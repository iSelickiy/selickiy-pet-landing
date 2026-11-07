#!/usr/bin/env bash
set -Eeuo pipefail

if [ "$#" -ne 3 ]; then
  echo "Usage: $0 DEPLOY_ROOT RELEASE_DIR TARGET_SHA" >&2
  exit 2
fi

deploy_root=$1
release_dir=$2
target_sha=$3
release_id=${release_dir##*/}
current_link="$deploy_root/current"

if [[ "$deploy_root" != /* || "$release_dir" != /* || ! "$target_sha" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Invalid deploy paths or target SHA" >&2
  exit 2
fi
if [ ! -f "$deploy_root/shared/.env" ]; then
  echo "Missing $deploy_root/shared/.env" >&2
  exit 2
fi
if [ -e "$current_link" ] && [ ! -L "$current_link" ]; then
  echo "$current_link must be a symlink or absent" >&2
  exit 2
fi

previous_release=""
if [ -L "$current_link" ]; then
  previous_release=$(readlink "$current_link")
fi

printf '%s\n' "$target_sha" > "$release_dir/.release-sha"
printf '%s\n' "$release_id" > "$release_dir/.release-id"

export APP_RELEASE_ID="$release_id"
export APP_GIT_SHA="$target_sha"
export APP_BUILT_AT
APP_BUILT_AT=$(date -u --iso-8601=seconds)

compose=(docker compose --project-name selickiy-landing --env-file "$deploy_root/shared/.env" -f "$release_dir/compose.yaml")

check_health() {
  local attempt base_url
  for ((attempt = 1; attempt <= 18; attempt++)); do
    if "${compose[@]}" exec -T app node -e '
      fetch("http://127.0.0.1:3000/api/health")
        .then(async (response) => {
          const body = await response.json();
          console.log(JSON.stringify(body));
          const validCommit = body.commit === process.env.APP_GIT_SHA;
          process.exit(response.ok && body.status === "ok" && body.database === "ok" && validCommit ? 0 : 1);
        })
        .catch((error) => { console.error(error); process.exit(1); });
    '; then
      base_url=$("${compose[@]}" exec -T app printenv NEXTAUTH_URL)
      if curl --fail --silent --show-error --connect-timeout 5 --max-time 10 "${base_url%/}/api/health"; then
        return 0
      fi
    fi
    sleep 5
  done
  return 1
}

rollback() {
  local code=$1 previous_id previous_sha
  set +e
  echo "Deploy failed; previous release and all volumes are preserved" >&2
  if [ -n "$previous_release" ] && [ -d "$previous_release" ]; then
    previous_id=$(<"$previous_release/.release-id")
    previous_sha=$(<"$previous_release/.release-sha")
    export APP_RELEASE_ID="$previous_id"
    export APP_GIT_SHA="$previous_sha"
    export APP_BUILT_AT=unknown
    compose=(docker compose --project-name selickiy-landing --env-file "$deploy_root/shared/.env" -f "$previous_release/compose.yaml")
    echo "Restoring previous application image $previous_id"
    if "${compose[@]}" up -d --no-build --no-deps app && check_health; then
      echo "Previous application release is healthy" >&2
    else
      echo "Rollback finished with errors; inspect app and database logs" >&2
    fi
  else
    echo "No previous release is available for automatic rollback" >&2
  fi
  exit "$code"
}

# Build and pull before touching the running application.
"${compose[@]}" pull db
"${compose[@]}" build --pull app migrate

if ! "${compose[@]}" up -d --no-build; then
  rollback 1
fi
if ! check_health; then
  rollback 1
fi
next_link="$deploy_root/.current-$release_id"
if ! ln -s "$release_dir" "$next_link"; then
  rollback 1
fi
if ! mv -Tf "$next_link" "$current_link"; then
  rollback 1
fi

echo "Deploy complete: $target_sha ($release_id)"
