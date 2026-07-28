# ResearchFlow core architecture

ResearchFlow is now a focused capture and working-notes companion rather than a general academic operating system.

## Active research loop

`Capture current page → research record → optional project context → notes/tasks/evidence → export`

The main workspace has two views:

- **Overview**: open-task and evidence counts.
- **Settings**: local-first preferences, sync provider selection and JSON export.

The side panel contains capture and the project-scoped working area. The popup remains the fastest path for a short note. Project and record collections remain part of the compatible data contract because these capture surfaces still write to them, but their dedicated dashboard sections are no longer active.

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

Project-tree and record-library dashboard sections, manuscript kanban, submission timelines, reviewer-response authoring, journal portals, generic AI copilot screens, and related API permissions no longer load in the extension. Existing stored JSON fields are intentionally retained when a previous database is opened, so this UI simplification does not erase historical data; they are simply outside the active dashboard contract.

## Compatibility and migration

Existing `projects`, `researchRecords`, `tasks`, and `evidence` continue without migration. Opening an older database normalizes those collections in place. Export JSON before performing a separate archival cleanup of legacy manuscript or submission fields.
