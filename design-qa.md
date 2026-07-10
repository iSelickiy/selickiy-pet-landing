# Design QA — personal landing modernization

## Sources

- Desktop reference: `/Users/selickiy/.codex/generated_images/019f4aed-a468-7511-944d-e615dc951b92/exec-3aa130fd-a729-4d41-9ae3-f51bfb6b1e5b.png`
- Mobile reference: `/Users/selickiy/.codex/generated_images/019f4aed-a468-7511-944d-e615dc951b92/exec-21d212db-9c45-4fbd-84cd-a3361a7330c5.png`
- Desktop implementation: `/Users/selickiy/.codex/visualizations/2026/07/10/019f4aed-a468-7511-944d-e615dc951b92/site-audit/09-final-home-desktop.jpg`
- Mobile implementation: `/Users/selickiy/.codex/visualizations/2026/07/10/019f4aed-a468-7511-944d-e615dc951b92/site-audit/10-final-home-mobile.jpg`
- Combined comparison: `/Users/selickiy/.codex/visualizations/2026/07/10/019f4aed-a468-7511-944d-e615dc951b92/site-audit/11-design-comparison.jpg`

## Viewports and states

- Desktop: 1440 × 1000, light theme, homepage at the top.
- Tablet: 768 × 1024, light and dark themes, mobile navigation open and closed.
- Mobile: 390 × 844, light theme, homepage at the top; menu, focus return and resume disclosure tested separately.
- Admin: 390 × 844, unauthenticated redirect and login state.

The in-app browser capture currently rasterizes a DPR-scaled local page into a CSS-pixel-sized bitmap. This visibly duplicates/crops the desktop capture and compresses the mobile capture. It is a capture artifact, not a page overflow: the DOM measurements below are authoritative for geometry.

## Full-view comparison

The implementation preserves the selected direction:

- dark navy personal sidebar/header;
- neutral, airy content surface with blue accents;
- resume-first hierarchy with a compact timeline;
- pet projects as an honest working collection rather than sales cases;
- laboratory as a horizontal artifact journal;
- the same identity and navigation model on desktop and mobile.

Dynamic content explains the intended differences from the mock: production uses the administrator's real avatar, resume entries, project previews and dates. The local database-free fallback intentionally uses initials and representative content.

Geometry checks:

- 1440 px: sidebar 288 px; main content 1137 px; resume 475 px; projects 526 px; document scroll width 1425 px, matching the scrollbar-adjusted viewport with no horizontal overflow.
- 390 px: visible page width 375 px; resume and project sections are 335 px wide with 20 px side gutters; no horizontal overflow.

## Focused comparison

- Identity: name, short positioning, personal intro, availability and contacts keep the mock's calm editorial tone.
- Timeline: year rail, blue nodes, company hierarchy and expandable descriptions match the reference behavior and visual rhythm.
- Projects: status pills, technology chips, subdued placeholders/previews and link icons use the same visual language.
- Mobile: personal context remains visible above the tabs; the desktop greeting/CTA is hidden to avoid duplicated positioning.
- Accessibility: the mobile drawer is a modal dialog with `aria-expanded`, focus trap, Escape close, background inertness and focus restoration.

## Comparison history

### Round 1

- P2: the mobile page repeated the intro below the already-visible profile header.
- P2: local HMR was blocked for `127.0.0.1`, which made the menu appear non-interactive during testing.
- P2: the build depended on downloading Google Fonts.

Fixes: hid the desktop greeting/CTA on mobile, allowed the local development origin, and switched to a zero-request system font stack.

### Round 2

- Mobile menu, theme toggle, Escape close and focus restoration passed.
- Resume disclosure passed with pointer and keyboard-compatible native details.
- Protected admin route redirected to `/admin/login` and the login controls were reachable.
- Light/dark, 390/768/1440 layouts passed without overflow.
- No remaining P0, P1 or P2 visual/interaction defects were found.

## Final result

final result: passed
