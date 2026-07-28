# ResearchFlow core architecture

ResearchFlow is a focused manuscript and submission workflow manager.

## Active research loop

`Manuscript → submission → review/revision → acceptance/publication`

The main workspace has four views:

- **Dashboard**: manuscript pipelines, event timing and alerts.
- **Manuscripts**: kanban workflow.
- **Submissions & Review**: submission tracking, checklists and reviewer responses.
- **Settings**: metadata synchronization and JSON backup/import.

Clicking the toolbar icon opens the full workspace directly. No popup or side panel is registered.

## Module boundaries

| Path | Responsibility |
| --- | --- |
| `scripts/options.js` | Dashboard, manuscript kanban, submissions, peer review, portals, settings, import/export and navigation. |
| `scripts/storage.js` | Local-first persistence and optional WebDAV/GitHub synchronization. |
| `scripts/background.js` | Toolbar entrypoint, storage service and background metadata support. |

## Removed from the active experience

Evidence Locker, project-tree and record-library dashboard sections, generic AI assistant, popup, side panel, and related permissions no longer load in the extension.

## Compatibility and migration

Existing `projects`, `researchRecords`, `manuscripts`, `submissions`, and `tasks` remain normalized. Database schema version 6 removes historical Evidence Locker fields, AI credentials, evidence file-routing settings, and synchronization secrets from the portable database. GitHub tokens and WebDAV credentials remain device-local and are excluded from cloud payloads and JSON exports.
