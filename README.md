# ResearchFlow

ResearchFlow is a Chrome extension for managing manuscript pipelines, journal submissions, peer-review responses, and private synchronization.

## What is in the core

- Monitor manuscript pipelines and key-event timelines from the dashboard.
- Manage manuscripts through a kanban workflow.
- Track submissions, journal portals, compliance checklists, and reviewer-response matrices.
- Store the research workflow in a local-first database.
- Export JSON and optionally synchronize your private database through WebDAV or GitHub.

The main workspace consists of **Dashboard**, **Manuscripts**, **Submissions & Review**, and **Settings**. Clicking the toolbar icon opens this workspace directly. Popup and side-panel surfaces have been removed.

## Deliberately out of scope

ResearchFlow no longer includes the Domain & Project Tree, Research Records dashboard, Evidence Locker, or generic AI assistant.

The active app normalizes projects, research records, manuscripts, submissions, and tasks. Schema version 5 removes retired Evidence Locker fields, AI credentials, and evidence-file routing from older databases.

## Install for development

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Select **Load unpacked** and choose this repository directory.
4. Pin ResearchFlow and click its toolbar icon to open the full workspace.

Chrome 116 or newer is required. The extension has no build step or third-party runtime dependency.

## Verify

```powershell
Get-ChildItem tests -Filter *.test.js | Sort-Object Name | ForEach-Object { node $_.FullName }
Get-ChildItem scripts -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
```

## Privacy

Research data is stored locally by default. WebDAV and GitHub synchronization are opt-in and use only the settings you supply.
