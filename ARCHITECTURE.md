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
| `scripts/storage.js` | Local-first persistence, schema normalization, secret redaction, conflict merging and optional WebDAV/GitHub synchronization. |
| `scripts/background.js` | Toolbar entrypoint, serialized database writer, explicit synchronization and reviewed submission-capture handoff. |
| `scripts/content.js` | Submission-portal recognition and the compact capture prompt on supported journal systems. |

## Removed from the active experience

Evidence Locker, project-tree and record-library dashboard sections, generic AI assistant, popup, side panel, and related permissions no longer load in the extension.

## Compatibility and migration

Existing `projects`, `researchRecords`, `manuscripts`, `submissions`, and `tasks` remain normalized. Database schema version 7 removes historical Evidence Locker fields, AI credentials, evidence file-routing settings, and synchronization secrets from the portable database, and adds deletion tombstones so stale remote snapshots cannot restore deleted entities. GitHub tokens and WebDAV credentials remain device-local and are excluded from cloud payloads and JSON exports.

All workspace writes pass through one service-worker queue. Submission autosaves use entity-aware conflict merging, and the committed snapshot is returned to the caller so its in-memory revision stays current. JSON import validates the file size and schema before replacement, then creates one rolling device-local pre-import recovery snapshot.
