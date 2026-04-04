# Admin Redesign: Profile, Resume, Contacts, Projects

## Summary

Redesign the admin panel to support structured data entry for the sidebar profile, resume, contact buttons, and improved project editing. Replace the single "Content" WYSIWYG page with dedicated sections: Profile, Resume, Projects.

---

## 1. Data Model Changes

### 1.1 New table: `SiteSetting`

Key-value store for profile settings. One row per key.

| Key | Type | Description |
|---|---|---|
| `firstName` | string | First name |
| `lastName` | string | Last name |
| `avatarUrl` | string? | Uploaded avatar path |
| `avatarMode` | `static` \| `dynamic` | Toggle: single avatar or light/dark pair |
| `avatarDarkUrl` | string? | Avatar for dark theme (when mode=dynamic) |
| `aboutContent` | text (HTML) | "About me" WYSIWYG content |

### 1.2 New table: `ResumeExperience`

| Field | Type | Description |
|---|---|---|
| id | cuid | Primary key |
| company | string | Company name |
| position | string | Job title |
| periodFrom | string | Free-text, e.g. "Февраль 2025" |
| periodTo | string | Free-text, e.g. "настоящее время" |
| description | text (HTML) | WYSIWYG description of responsibilities |
| sortOrder | int | Display order |

Skills remain in `ContentSection` with key `skills` as a single WYSIWYG block.

### 1.3 New table: `ContactButton`

Full-width CTA buttons in sidebar.

| Field | Type | Description |
|---|---|---|
| id | cuid | Primary key |
| label | string | Button text, e.g. "Забронировать демо" |
| url | string | Link URL |
| icon | string | Icon identifier (from predefined set) |
| sortOrder | int | Display order |

### 1.4 New table: `SocialLink`

Icon-only social buttons in sidebar. Predefined set with enable/disable.

| Field | Type | Description |
|---|---|---|
| id | cuid | Primary key |
| platform | string (unique) | Platform key: telegram, email, instagram, github, vk, linkedin, youtube, whatsapp, habr |
| url | string | URL or value (email address for email) |
| enabled | boolean | Show/hide toggle |
| sortOrder | int | Display order |

### 1.5 Changes to existing tables

- `ContentSection`: keys `hero` and `contacts` become unused (data moves to SiteSetting + ContactButton + SocialLink). Keys `about` becomes unused (moves to SiteSetting.aboutContent). Key `resume` becomes unused (moves to ResumeExperience + skills). Key `skills` remains.
- `Project.description`: changes from plain text to HTML (WYSIWYG).
- No schema type change needed since SQLite stores it as string already.

---

## 2. Admin Panel Structure

### 2.1 Menu (sidebar)

```
Админ-панель
├── Профиль        /admin/profile
├── Резюме         /admin/resume
├── Проекты        /admin/projects
├── Медиа          /admin/media
└── ← На сайт     (link to /)
```

Remove "Контент" page entirely.

### 2.2 Profile page (`/admin/profile`)

Three sections on one page:

**Section A — Identity:**
- First name (text input)
- Last name (text input)
- Avatar mode toggle: Static / Dynamic
- If Static: single ImageUpload
- If Dynamic: two ImageUploads (light theme avatar, dark theme avatar)
- Uploaded image shows in a preview circle (same size as sidebar avatar)

**Section B — About me:**
- WYSIWYG editor (Tiptap) on the left
- Live preview on the right: dark-bg card mimicking the sidebar appearance, updating in real-time as user types

**Section C — Contacts:**

*Full-width buttons:*
- List of existing buttons (label, URL, icon selector, delete)
- "Add button" action
- Icon selector: dropdown of available icons (calendar, link, arrow-right, etc.)

*Social links:*
- Predefined list with toggles and URL inputs:
  - Telegram (default: on)
  - Email (default: on)
  - Instagram (default: on)
  - GitHub (default: off)
  - VK (default: off)
  - LinkedIn (default: off)
  - YouTube (default: off)
  - WhatsApp (default: off)
  - Habr (default: off)

**Save:** Single "Save" button per section, or one "Save all" at the bottom.

### 2.3 Resume page (`/admin/resume`)

**Section A — Work experience:**
- List of experience cards, drag-and-drop sortable
- Each card shows: company, position, period
- Click to expand/edit: all fields + WYSIWYG for description
- Add new / Delete actions
- Inline editing (expand in place, not separate page)

**Section B — Skills:**
- Single WYSIWYG block (Tiptap)
- Save button

### 2.4 Projects — improvements

- **Tech stack field:** text input + suggestion buttons below. Predefined suggestions: Next.js, React, TypeScript, Tailwind CSS, Python, PostgreSQL, Node.js, Docker, Redis, Chart.js, Prisma, DnD Kit. Click adds tag. Custom input also adds tag on Enter.
- **Description field:** replace textarea with Tiptap WYSIWYG editor.
- **Preview image:** ImageUpload (already exists, keep as-is).

### 2.5 "Back to site" button

Add `← На сайт` link at the bottom of admin sidebar, linking to `/`.

---

## 3. Public Site — Sidebar Changes

The sidebar component (`Sidebar.tsx`) switches from hardcoded content to database-driven:

### Data fetching (in `page.tsx` server component):
- Fetch SiteSettings (firstName, lastName, avatarUrl, avatarMode, avatarDarkUrl, aboutContent)
- Fetch ContactButtons (ordered by sortOrder)
- Fetch SocialLinks (where enabled=true, ordered by sortOrder)
- Pass all as props to Sidebar

### Sidebar rendering:
1. **Avatar:** If mode=static, show avatarUrl. If mode=dynamic, show light/dark avatar based on current theme. Fallback to initials circle if no avatar uploaded.
2. **Name:** `{firstName} {lastName}`
3. **About:** Render aboutContent via RichContent (compact sidebar styling)
4. **Full-width buttons:** Render ContactButtons as large buttons with icon + label
5. **Social icons:** Render enabled SocialLinks as icon buttons in a row

---

## 4. API Routes

### New routes:
- `GET/PUT /api/settings` — fetch all / update settings (auth required for PUT)
- `GET/POST /api/resume` — list / create experience entries (auth for POST)
- `PUT/DELETE /api/resume/[id]` — update / delete experience (auth required)
- `PUT /api/resume/reorder` — reorder experiences (auth required)
- `GET/POST /api/contact-buttons` — list / create (auth for POST)
- `PUT/DELETE /api/contact-buttons/[id]` — update / delete (auth required)
- `PUT /api/social-links` — bulk update all social links (auth required)

### Modified routes:
- `PUT /api/projects/[id]` — description field now accepts HTML from WYSIWYG

---

## 5. Seed Data

Seed script populates:
- SiteSettings with Igor's current data (name, about text)
- ResumeExperience with 4 entries from current resume content
- Skills ContentSection with current skills text
- ContactButtons: one "Забронировать демо" button
- SocialLinks: telegram, email, instagram enabled with current URLs; rest disabled

---

## 6. Migration Plan

1. Add new tables (SiteSetting, ResumeExperience, ContactButton, SocialLink)
2. Run seed to populate from existing data
3. Update admin pages (remove Content, add Profile + Resume)
4. Update Sidebar component to use new data
5. Update Project form with WYSIWYG + tech suggestions
6. Delete unused admin content page and old ContentSection entries
