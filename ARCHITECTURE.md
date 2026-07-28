# ResearchFlow core architecture

ResearchFlow is now a focused capture, working-notes, and next-actions companion rather than a general academic operating system.

## Active research loop

`Capture current page → research record → optional project context → notes/tasks → export`

The main workspace has two views:

- **Overview**: open-task count.
- **Settings**: local-first preferences, sync provider selection and JSON export.

Clicking the toolbar icon opens the full workspace directly. The side panel remains an optional capture and project-scoped working area. Project and record collections remain part of the compatible data contract because capture surfaces still write to them, but their dedicated dashboard sections are no longer active.

## Module boundaries

| Path | Responsibility |
| --- | --- |
| `scripts/core/research-core.js` | Compatible data contract, validation, capture mutations and dashboard statistics. |
| `scripts/modules/dashboard.js` | Overview rendering. |
| `scripts/modules/settings.js` | Preferences and portable JSON export. |
| `scripts/options.js` | Lifecycle composition, navigation, modal and toast plumbing only. |
| `scripts/storage.js` | Local-first persistence and optional WebDAV/GitHub synchronization. |
| `scripts/content.js`, `scripts/background.js` | Academic-page extraction, cache warming, context capture and Unpaywall fallback. |

## Removed from the active experience

Evidence Locker, project-tree and record-library dashboard sections, manuscript kanban, submission timelines, reviewer-response authoring, journal portals, generic AI copilot screens, and related API permissions no longer load in the extension. Evidence Locker storage is also retired: loading an older database drops its `evidence` field.

## Compatibility and migration

Existing `projects`, `researchRecords`, and `tasks` continue without migration. Database schema version 4 removes historical `evidence` values during normalization, so they are not retained, synchronized, or exported.
