# ResearchFlow

ResearchFlow is a Chrome extension for a focused research loop: capture a paper or observation, attach it to a project, and keep the next action clear.

## What is in the core

- Capture metadata from academic pages with a side panel, popup, or selection context menu.
- Organize literature, experiments, analyses, and notes under explicit research projects.
- Store captured literature and notes in a local-first database.
- Keep project-scoped working notes and next actions.
- Export JSON and optionally synchronize your private database through WebDAV or GitHub.

The main workspace consists of **Overview** and **Settings**. Project association, record capture, working notes, and next actions remain available through the popup and side panel; the former project-tree and record-library dashboard sections have been removed. See [ARCHITECTURE.md](ARCHITECTURE.md) for boundaries, data compatibility, and migration notes.

## Deliberately out of scope

ResearchFlow no longer loads project-tree and record-library dashboard sections, manuscript kanban, submission timelines, reviewer-response authoring, journal portals, or a generic AI copilot. These increased permissions and maintenance burden and obscured the focused capture workflow.

The active app continues to normalize and use projects, research records, and tasks. When an older database is loaded, its retired `evidence` field is removed and is no longer synchronized or exported.

## Install for development

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Select **Load unpacked** and choose this repository directory.
4. Pin ResearchFlow. Clicking its toolbar icon opens the full ResearchFlow workspace directly; the side panel remains an optional capture surface.

Chrome 116 or newer is required. The extension has no build step or third-party runtime dependency.

## Verify

```powershell
Get-ChildItem tests -Filter *.test.js | Sort-Object Name | ForEach-Object { node $_.FullName }
Get-ChildItem scripts -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
```

## Privacy

Research data is stored locally by default. WebDAV and GitHub synchronization are opt-in and use only the settings you supply. Academic-page capture uses the minimum metadata needed to create a research record; the Unpaywall fallback is only contacted when you explicitly request an open-access PDF lookup.
