<div align="center">

**English** | **[中文](README.zh-CN.md)**

</div>

<div align="center">

<img src="assets/icons/icon-128.png" alt="ResearchFlow Companion Logo" width="96" height="96" />

# ResearchFlow Companion

### Your Personal Research Operating System — Chrome Extension

**Capture literature. Manage projects. Track manuscripts. Sync across clouds. All from your browser.**

![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-blue?style=flat-square)
![Version](https://img.shields.io/badge/version-1.2.2-green?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-yellow?style=flat-square)
![Chrome](https://img.shields.io/badge/Chrome-%3E%3D%20116-red?style=flat-square)
![Vanilla JS](https://img.shields.io/badge/Vanilla%20JS-No%20Dependencies-orange?style=flat-square)

</div>

---

## Table of Contents

- [What is ResearchFlow Companion?](#what-is-researchflow-companion)
- [Features at a Glance](#features-at-a-glance)
- [System Requirements](#system-requirements)
- [Installation (Step by Step)](#installation-step-by-step)
- [Quick Start Guide](#quick-start-guide)
  - [Step 1: Open the Popup](#step-1-open-the-popup)
  - [Step 2: Capture Your First Paper](#step-2-capture-your-first-paper)
  - [Step 3: Explore the Master Dashboard](#step-3-explore-the-master-dashboard)
  - [Step 4: Use the Side Panel](#step-4-use-the-side-panel)
- [Feature Deep Dive](#feature-deep-dive)
  - [1. Literature Capture System](#1-literature-capture-system)
  - [2. AI Copilot](#2-ai-copilot)
  - [3. Master Dashboard](#3-master-dashboard)
  - [4. Quick Note Capture (Popup)](#4-quick-note-capture-popup)
  - [5. Right-Click Context Menu](#5-right-click-context-menu)
  - [6. Notes & Tasks (Side Panel)](#6-notes--tasks-side-panel)
- [Configuration Guide](#configuration-guide)
  - [AI Copilot Setup](#ai-copilot-setup)
  - [Multi-Cloud Sync Setup](#multi-cloud-sync-setup)
  - [Language Settings](#language-settings)
  - [Database Import/Export](#database-importexport)
- [Supported Academic Platforms](#supported-academic-platforms)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [FAQ (Frequently Asked Questions)](#faq-frequently-asked-questions)
- [Privacy & Security](#privacy--security)
- [Known Limitations](#known-limitations)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## What is ResearchFlow Companion?

**ResearchFlow Companion** is a Chrome browser extension designed for **academic researchers, graduate students, and research teams**. It turns your browser into a fully-featured research operating system that helps you:

- **Capture** academic papers and extract metadata with one click
- **Organize** research areas, projects, and records in a structured hierarchy
- **Track** manuscript pipelines from idea to acceptance
- **Collaborate** with an AI copilot for summarization, rebuttal drafting, and more
- **Sync** your data across private cloud drives (WebDAV, GitHub)

Everything runs **local-first** in your browser — no server, no account required. Your data stays on your machine unless you choose to sync it to your own cloud.

---

## Features at a Glance

| Feature | Description |
|---------|-------------|
| **Literature Capture** | One-click metadata extraction from 20+ academic platforms |
| **AI Copilot** | Summarize papers, generate rebuttals, draft CV entries with OpenAI/DeepSeek |
| **Master Dashboard** | Full-page dashboard with 7 views: overview, projects, records, manuscripts, submissions, evidence, settings |
| **Manuscripts Kanban** | 4-column board (Idea → Drafting → Submitted → Accepted) |
| **Research Records** | Spreadsheet grid with custom attributes, search & filter |
| **Quick Note Capture** | Popup panel for rapid note-taking with auto DOI detection |
| **Right-Click Capture** | Highlight text on any webpage → save as research record |
| **Citation Generator** | APA 7th, MLA 9th, BibTeX citation formatting |
| **Structured Reading Notes** | Breakthrough, methodology, datasets, limitations fields |
| **Multi-Cloud Sync** | WebDAV (Jianguoyun, Nextcloud) and GitHub private repo sync |
| **Notes & Tasks** | Scratchpad with autosave + project-scoped task checklists |
| **Dark Mode** | Automatic dark/light theme based on system preference |
| **Bilingual UI** | English and Chinese interface |

---

## System Requirements

| Requirement | Minimum |
|-------------|---------|
| **Browser** | Google Chrome 116+ (or Chromium-based: Edge, Brave, Arc) |
| **OS** | Windows, macOS, Linux, ChromeOS |
| **Disk Space** | ~2 MB for extension files |
| **Network** | Optional (only needed for cloud sync and AI features) |
| **API Keys** | Optional (only needed for AI Copilot: OpenAI or DeepSeek) |

---

## Installation (Step by Step)

### Method 1: Load Unpacked Extension (Recommended for Development)

This is the standard way to install a Chrome extension from source code.

#### Step 1: Download the Source Code

Clone the repository or download the ZIP file:

```bash
git clone https://github.com/YOUR_USERNAME/ResearchFlow-Extension.git
```

Or download the ZIP from GitHub and extract it to a folder on your computer.

#### Step 2: Open Chrome Extensions Page

1. Open Google Chrome
2. Type `chrome://extensions/` in the address bar and press Enter
3. You will see the Chrome Extensions management page

#### Step 3: Enable Developer Mode

1. Look at the **top-right corner** of the extensions page
2. Find the toggle switch labeled **"Developer mode"**
3. Click it to turn it **ON** (the switch will slide to the right and turn blue)

#### Step 4: Load the Extension

1. Click the **"Load unpacked"** button (top-left corner)
2. A file dialog will open — navigate to the extension folder
3. Select the folder: `ResearchFlow-Extension-1.1.0` (the folder that contains `manifest.json`)
4. Click **"Select Folder"**

#### Step 5: Pin the Extension

1. Look at the **top-right corner** of Chrome for the puzzle piece icon (Extensions)
2. Click the puzzle piece icon
3. Find **"ResearchFlow Companion"** in the list
4. Click the **pin icon** (📌) next to it to pin it to your toolbar

**You're done!** You should now see the ResearchFlow Companion icon in your browser toolbar.

### Method 2: Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store once published. This section will be updated with the direct link.

---

## Quick Start Guide

### Step 1: Open the Popup

Click the **ResearchFlow Companion** icon in your browser toolbar. This opens the **Quick Panel** popup:

- **Metrics** at the top show your active projects and research records count
- **"Enter Master Dashboard"** button opens the full management interface
- **"Toggle Sidepanel Workspace"** opens the side panel for capture and AI

### Step 2: Capture Your First Paper

1. Navigate to any academic paper page (e.g., an arXiv paper, a PubMed article)
2. Click the **ResearchFlow Companion** icon → click **"Toggle Sidepanel Workspace"**
3. In the side panel, click the **"Capture"** tab
4. Click **"Capture Active Page"** button
5. The extension will automatically extract:
   - Paper title
   - DOI number
   - Authors
   - Abstract
   - PDF link
6. Fill in any additional notes (optional):
   - **Core Breakthrough**: What's the main finding?
   - **Methodology & Equations**: What methods were used?
   - **Datasets & Compute**: What data/tools were used?
   - **Open Limitations**: What are the weaknesses?
7. Click **"Save Record"** to save as a research record, or **"Link Evidence"** to link it to your evidence locker

### Step 3: Explore the Master Dashboard

1. Click the **ResearchFlow Companion** icon
2. Click **"Enter Master Dashboard"** (the purple button)
3. A new tab opens with the full dashboard
4. Explore the sidebar navigation:
   - **Dashboard**: Overview metrics, Gantt timelines, recent activity
   - **Areas & Projects**: Manage research domains and projects
   - **Research Records**: Browse all captured records in a spreadsheet view
   - **Manuscripts**: Kanban board for manuscript pipeline
   - **Submissions**: Track journal submissions and reviews
   - **Evidence**: File links to cloud storage
   - **Settings**: Configure sync, AI, language, and more

### Step 4: Use the Side Panel

The side panel has three tabs:

1. **Capture Tab**: Extract metadata from the current page, generate citations
2. **AI Copilot Tab**: Chat with AI, summarize pages, generate rebuttals
3. **Notes Tab**: Scratchpad for quick notes + project task checklist

---

## Feature Deep Dive

### 1. Literature Capture System

The capture system uses a **4-layer scraping architecture** to extract metadata from academic web pages:

| Layer | Method | Speed | Description |
|-------|--------|-------|-------------|
| **Layer 1** | Standard Meta Tags | ~1ms | Reads Dublin Core and Highwire Press meta tags (`citation_title`, `citation_doi`, etc.) |
| **Layer 2** | Platform-Specific Parsers | ~5ms | DOM selectors tailored to each platform (arXiv, PubMed, etc.) |
| **Layer 3** | Heuristic PDF Scoring | ~20ms | Scores all links on the page to find the most likely PDF URL |
| **Layer 4** | Unpaywall API | ~500ms | Looks up open-access PDF via the Unpaywall API (async, via background service worker) |

**Proactive Caching**: When you visit an academic page, the content script automatically scrapes metadata in the background and caches it for 5 minutes. When you click "Capture Active Page", the result is instant.

**Citation Generator**: After capturing a paper, you can generate citations in three formats:
- **APA 7th Edition**: `(Author, Year). Title. Journal. https://doi.org/xxx`
- **MLA 9th Edition**: `Author. "Title." Journal, Year. DOI.`
- **BibTeX**: `@article{key, author={...}, title={...}, ...}`

### 2. AI Copilot

The AI Copilot wraps OpenAI and DeepSeek API endpoints to provide research assistance.

**Quick Actions**:

| Action | Description |
|--------|-------------|
| **Summarize Page** | Condenses the abstract into: breakthrough summary, key contributions, weaknesses |
| **Reviewer Rebuttal** | Generates a polite academic rebuttal draft for reviewer comments |
| **CV Entry** | Formats your achievements into academic CV bullet points |
| **Extract Metadata** | AI fallback for extracting paper metadata from raw pasted text |

**Free-Form Chat**: Type any research question in the chat input and get AI-powered responses.

**How to Set Up**: See [AI Copilot Setup](#ai-copilot-setup) in the Configuration section.

### 3. Master Dashboard

The Master Dashboard is a full-page application with **7 major views**:

#### 3.1 Dashboard Overview
- **Metrics Cards**: Accepted submissions, in-review count, total submissions
- **Gantt Timeline**: Visual pipeline for manuscripts with deadline tracking
- **Recent Research Logs**: Latest activity across all projects
- **Timeline Alerts**: Upcoming deadlines and overdue items

#### 3.2 Areas & Projects Tree
- Create **Research Areas** (e.g., "Condensed Matter Physics", "Machine Learning")
- Create **Projects** under each area
- Define **hypotheses**, **objectives**, and **current stage** for each project
- Organize with folders and tags

#### 3.3 Research Records
- **Spreadsheet Grid**: All records in a filterable, searchable table
- **Record Types**: Experiment, Simulation, Survey, Analysis, Literature Review
- **Dynamic Custom Attributes**: Add custom fields like `temperature_K`, `gpu_type`, `sample_id`
- **Search & Filter**: Find records by title, DOI, project, type, or date

#### 3.4 Manuscripts Kanban
- **4-Column Board**: Idea → Drafting → Submitted → Accepted
- Drag-and-drop manuscripts between stages
- Link manuscripts to projects and research records

#### 3.5 Submissions & Review
- Track journal submissions with dates and status
- **Rebuttal Editor Matrices**: Structure your reviewer responses
- **Journal Compliance Checklists**: Verify formatting requirements
- **Quick Links**: Direct links to ACS, Wiley, APL, Nature journal portals

#### 3.6 Evidence Locker
- Store links to files in your cloud drives
- Link evidence to specific projects and records
- Supports PDFs, images, datasets, and any file type

#### 3.7 Multi-Cloud Settings
- Configure WebDAV and GitHub sync
- Set up AI API keys
- Switch language (English/Chinese)
- Import/export database as JSON

### 4. Quick Note Capture (Popup)

The popup provides a rapid intake panel for saving notes without leaving your current page:

- **Auto DOI Detection**: Automatically detects DOI from the active tab's URL or title
- **Auto Title Extraction**: Cleans site prefixes (arXiv, PubMed, etc.) to extract clean paper titles
- **Project Selection**: Choose which project to save the note to, or create a new project inline
- **Quick Save**: One click to save your observation as a research record

### 5. Right-Click Context Menu

After installation, the extension adds a right-click context menu:

1. **Highlight any text** on any webpage
2. **Right-click** to open the context menu
3. Select **"Log selection as Research Record Note"**
4. The selected text is saved as a new research record

### 6. Notes & Tasks (Side Panel)

The Notes tab in the side panel provides:

- **Working Scratchpad**: A text area that auto-saves as you type (debounced at 500ms)
- **Project Checklist**: Task management scoped to the active project
- **Add Tasks**: Click "+ Add Task" to create new checklist items

---

## Configuration Guide

### AI Copilot Setup

To use the AI Copilot features, you need an API key from OpenAI or DeepSeek.

#### Option A: OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **"Create new secret key"**
5. Copy the key (starts with `sk-...`)

#### Option B: DeepSeek API Key

1. Go to [platform.deepseek.com](https://platform.deepseek.com)
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **"Create API Key"**
5. Copy the key

#### Configure in Extension

1. Open the **Master Dashboard** (click extension icon → "Enter Master Dashboard")
2. Click **"Settings"** in the left sidebar
3. Scroll to the **AI Configuration** section
4. Select your provider (OpenAI or DeepSeek)
5. Enter your **API Key**
6. Enter the **API Endpoint** (default is pre-filled):
   - OpenAI: `https://api.openai.com/v1`
   - DeepSeek: `https://api.deepseek.com/v1`
7. Click **"Test Connection"** to verify
8. Click **"Save"**

### Multi-Cloud Sync Setup

ResearchFlow Companion supports syncing your research data to private cloud storage.

#### Option A: WebDAV (Jianguoyun / Nextcloud)

**For Jianguoyun (坚果云)**:

1. Log in to [jianguoyun.com](https://www.jianguoyun.com)
2. Go to **Security Settings** → **Third-Party Applications**
3. Click **"Add Application"**
4. Generate a password for the application
5. Note down the server URL and password

**For Nextcloud**:

1. Log in to your Nextcloud instance
2. Go to **Settings** → **Security** → **App Passwords**
3. Generate a new app password
4. Note down your server URL and app password

**Configure in Extension**:

1. Open **Master Dashboard** → **Settings** → **Multi-Cloud Settings**
2. In the **WebDAV** section:
   - **Server URL**: e.g., `https://dav.jianguoyun.com/dav/` or `https://your-nextcloud.com/remote.php/dav/files/username/`
   - **Username**: Your WebDAV username
   - **Password**: Your app-specific password
3. Click **"Test Connection"**
4. Select which data to sync (database JSON, evidence files, or both)

#### Option B: GitHub Private Repository

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Give it a name (e.g., "ResearchFlow Sync")
4. Select the **`repo`** scope (full control of private repositories)
5. Click **"Generate token"**
6. Copy the token (starts with `ghp_...`)

**Configure in Extension**:

1. Open **Master Dashboard** → **Settings** → **Multi-Cloud Settings**
2. In the **GitHub** section:
   - **Personal Access Token (PAT)**: Paste your token
   - **Repository**: Enter `username/repo-name` (the repo will be created automatically if it doesn't exist)
   - **File Path**: Default is `researchflow_db.json`
3. Click **"Test Connection"**
4. Click **"Force Sync"** to perform initial sync

#### Cloud Storage Routing

You can route different types of data to different providers:

| Data Type | Description | Recommended Provider |
|-----------|-------------|---------------------|
| **Database JSON** | All projects, records, manuscripts metadata | GitHub (version controlled) or WebDAV |
| **Evidence Files** | PDFs, images, datasets | WebDAV (supports larger files) |

### Language Settings

1. Open **Master Dashboard** → **Settings**
2. Find the **Language** section
3. Select **English** or **中文 (Chinese)**
4. The UI will update immediately

### Database Import/Export

#### Export Your Data

1. Open **Master Dashboard** → **Settings**
2. Find the **Database** section
3. Click **"Export Database"**
4. A JSON file will be downloaded containing all your research data

#### Import Data

1. Open **Master Dashboard** → **Settings**
2. Find the **Database** section
3. Click **"Import Database"**
4. Select a previously exported JSON file
5. Confirm the import (this will merge with existing data using entity-level conflict resolution)

---

## Supported Academic Platforms

The literature capture system works on **20+ academic platforms**. Here's the complete list:

| Platform | Domain | Metadata Extracted |
|----------|--------|-------------------|
| **arXiv** | arxiv.org | Title, authors, abstract, DOI, PDF |
| **bioRxiv** | biorxiv.org | Title, authors, abstract, DOI, PDF |
| **medRxiv** | medrxiv.org | Title, authors, abstract, DOI, PDF |
| **PubMed** | pubmed.ncbi.nlm.nih.gov | Title, authors, abstract, DOI |
| **PMC** | ncbi.nlm.nih.gov/pmc | Title, authors, abstract, DOI, PDF |
| **Nature** | nature.com | Title, authors, abstract, DOI, journal |
| **IEEE** | ieeexplore.ieee.org | Title, authors, abstract, DOI |
| **Springer** | link.springer.com | Title, authors, abstract, DOI, journal |
| **ScienceDirect** | sciencedirect.com | Title, authors, abstract, DOI |
| **ACM** | dl.acm.org | Title, authors, abstract, DOI |
| **Wiley** | onlinelibrary.wiley.com | Title, authors, abstract, DOI, journal |
| **PLOS** | journals.plos.org | Title, authors, abstract, DOI, PDF |
| **SSRN** | ssrn.com | Title, authors, abstract, DOI |
| **ResearchGate** | researchgate.net | Title, authors, abstract |
| **Semantic Scholar** | semanticscholar.org | Title, authors, abstract, DOI |
| **Google Scholar** | scholar.google.com | Title, authors, snippet |
| **Science** | science.org | Title, authors, abstract, DOI, journal |
| **Cell Press** | cell.com | Title, authors, abstract, DOI, journal |
| **APS Physics** | journals.aps.org | Title, authors, abstract, DOI, PDF |
| **Taylor & Francis** | tandfonline.com | Title, authors, abstract, DOI, journal |
| **Overleaf** | overleaf.com | Project title |
| **Generic Pages** | Any website | Title, meta tags, PDF links (heuristic) |

---

## Architecture Overview

ResearchFlow Companion is built with **Manifest V3** architecture:

```
┌─────────────────────────────────────────────────────┐
│                    Chrome Browser                     │
├─────────────┬───────────────┬───────────────────────┤
│   Popup     │  Side Panel   │   Options Page        │
│  (popup.html│ (sidepanel.   │  (options.html)       │
│   popup.js) │  html,        │   options.js)         │
│             │  sidepanel.js)│   (5,257 lines)       │
├─────────────┴───────────────┴───────────────────────┤
│              chrome.runtime.sendMessage()            │
├─────────────────────────────────────────────────────┤
│          Background Service Worker                   │
│          (background.js — 337 lines)                │
│          - Tab-level scrape cache                    │
│          - Context menu handler                      │
│          - Sync trigger coordinator                  │
│          - Content script injector                   │
├─────────────────────────────────────────────────────┤
│              chrome.scripting.executeScript()        │
├─────────────────────────────────────────────────────┤
│          Content Script                              │
│          (content.js — 701 lines)                   │
│          - 4-layer metadata scraper                  │
│          - Platform-specific DOM parsers             │
│          - Proactive cache push                      │
├─────────────────────────────────────────────────────┤
│              chrome.storage.local                    │
├─────────────────────────────────────────────────────┤
│          Storage Engine                              │
│          (storage.js — 704 lines)                   │
│          - Local-first persistence                   │
│          - WebDAV sync (PROPFIND/PUT)               │
│          - GitHub Contents API sync                  │
│          - Entity-level merge                        │
├─────────────────────────────────────────────────────┤
│          AI Client                                   │
│          (ai.js — 145 lines)                        │
│          - OpenAI / DeepSeek wrapper                 │
│          - Chat completions API                      │
└─────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Local-First**: All data lives in `chrome.storage.local`. No server required.
2. **Zero Dependencies**: Pure vanilla JavaScript — no npm, no bundler, no framework.
3. **Entity-Level Sync**: Merge conflicts are resolved at the entity level (by ID + `updatedAt` timestamp), not whole-database overwrite.
4. **Proactive Caching**: Content scripts auto-scrape on page load and cache results for instant access.
5. **Progressive Enhancement**: Core features work offline; AI and sync are optional enhancements.

---

## Project Structure

```
ResearchFlow-Extension-1.1.0/
├── manifest.json                    # Chrome MV3 manifest
├── README.md                        # This file (English)
├── README.zh-CN.md                  # Chinese documentation
├── guide.md                         # Architecture review (Chinese)
├── .gitignore                       # Git ignore rules
├── assets/
│   └── icons/
│       ├── icon-16.png              # Badge icon
│       ├── icon-32.png              # Retina badge icon
│       ├── icon-48.png              # Extensions page icon
│       ├── icon-128.png             # Chrome Web Store icon
│       └── icon.svg                 # Vector source icon
├── data/
│   └── preloaded_db.json            # Seed data with sample projects
├── pages/
│   ├── popup.html                   # Quick panel popup
│   ├── sidepanel.html               # Side panel workspace
│   └── options.html                 # Master dashboard
├── scripts/
│   ├── background.js                # MV3 service worker (337 lines)
│   ├── content.js                   # Content script scraper (701 lines)
│   ├── popup.js                     # Popup controller (275 lines)
│   ├── sidepanel.js                 # Side panel controller (745 lines)
│   ├── options.js                   # Dashboard controller (5,257 lines)
│   ├── storage.js                   # Storage & sync engine (704 lines)
│   └── ai.js                        # AI copilot client (145 lines)
└── styles/
    ├── theme.css                    # Design system & CSS variables
    ├── popup.css                    # Popup styles
    ├── sidepanel.css                # Side panel styles
    └── options.css                  # Dashboard styles
```

**Total**: ~13,400 lines of source code across all files. No build step required.

---

## Data Model

The extension stores all data in a single JSON database with the following structure:

```json
{
  "schemaVersion": 2,
  "researchAreas": [
    {
      "id": "unique-id",
      "name": "Condensed Matter Physics",
      "description": "...",
      "color": "#7c3aed",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "projects": [
    {
      "id": "unique-id",
      "areaId": "parent-area-id",
      "title": "Project Title",
      "discipline": "Physics",
      "hypothesis": "...",
      "objectives": "...",
      "currentStage": "experiment",
      "status": "active",
      "tags": ["tag1", "tag2"],
      "customFields": {},
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "researchRecords": [
    {
      "id": "unique-id",
      "projectId": "parent-project-id",
      "type": "literature_review",
      "title": "Paper Title",
      "doi": "10.1038/...",
      "authors": "Author A, Author B",
      "abstract": "...",
      "pdfUrl": "https://...",
      "notes": {
        "breakthrough": "...",
        "methodology": "...",
        "datasets": "...",
        "limitations": "..."
      },
      "customFields": {},
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "manuscripts": [
    {
      "id": "unique-id",
      "projectId": "parent-project-id",
      "title": "Manuscript Title",
      "stage": "drafting",
      "targetJournal": "Nature",
      "deadline": "2024-06-01",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "submissions": [
    {
      "id": "unique-id",
      "manuscriptId": "parent-manuscript-id",
      "journal": "Nature",
      "status": "in_review",
      "submittedAt": "...",
      "notes": "..."
    }
  ],
  "tasks": [
    {
      "id": "unique-id",
      "projectId": "parent-project-id",
      "text": "Task description",
      "completed": false,
      "createdAt": "..."
    }
  ],
  "evidence": [
    {
      "id": "unique-id",
      "projectId": "parent-project-id",
      "name": "filename.pdf",
      "url": "https://drive.google.com/...",
      "type": "pdf",
      "createdAt": "..."
    }
  ],
  "settings": {
    "syncProviders": {
      "webdav": { "server": "", "username": "", "password": "" },
      "github": { "token": "", "repo": "", "path": "" }
    },
    "ai": {
      "provider": "openai",
      "apiKey": "",
      "endpoint": "https://api.openai.com/v1"
    },
    "profile": {
      "language": "en",
      "name": "",
      "email": ""
    },
    "journalPortals": []
  }
}
```

### Record Types

| Type | Description |
|------|-------------|
| `experiment` | Lab experiment records |
| `simulation` | Computational simulation results |
| `survey` | Survey or questionnaire data |
| `analysis` | Data analysis results |
| `literature_review` | Literature review notes |

### Manuscript Stages

| Stage | Description |
|-------|-------------|
| `idea` | Initial concept or research question |
| `drafting` | Actively writing the manuscript |
| `submitted` | Submitted to a journal |
| `accepted` | Accepted for publication |

---

## FAQ (Frequently Asked Questions)

### General

**Q: Is my data stored on a server?**
A: No. All data is stored locally in your browser's `chrome.storage.local`. Cloud sync is entirely optional and uses your own accounts (WebDAV, GitHub).

**Q: Do I need an internet connection?**
A: No. Core features (capture, dashboard, notes) work offline. Internet is only needed for:
- AI Copilot features (requires API calls to OpenAI/DeepSeek)
- Cloud sync (requires connection to your WebDAV/GitHub server)
- Layer 4 of the scraper (Unpaywall API lookup for open-access PDFs)

**Q: Does this work on Edge/Brave/Arc?**
A: Yes. Any Chromium-based browser that supports Manifest V3 (Chrome 116+) should work.

**Q: Can I use this on Firefox?**
A: Not currently. The extension uses Chrome-specific APIs (Side Panel, `chrome.storage.local`). Firefox support would require porting to WebExtensions.

### Capture

**Q: The scraper didn't extract metadata from a page. What do I do?**
A: Try these steps:
1. Make sure the page is fully loaded before clicking "Capture Active Page"
2. Check if the platform is in the [supported list](#supported-academic-platforms)
3. For unsupported platforms, the extension falls back to generic meta tag extraction
4. As a last resort, use the AI Copilot's "Extract Metadata" feature by pasting the text

**Q: Can I capture multiple papers at once?**
A: Not currently. The capture is designed for one paper at a time from the active tab.

### AI Copilot

**Q: Which AI provider should I choose?**
A: Both work well. DeepSeek is generally cheaper; OpenAI has broader model options. Choose based on your existing account and budget.

**Q: Is my API key stored securely?**
A: The API key is stored in `chrome.storage.local`, which is only accessible to the extension itself. It is not transmitted to any third party except the AI provider you configured.

### Sync

**Q: What happens if I edit the same record on two devices?**
A: The sync engine uses **entity-level merge** with `updatedAt`-based conflict resolution. The most recently updated version of each entity wins. This is not real-time collaboration — it's designed for single-user multi-device sync.

**Q: Can I sync to multiple clouds simultaneously?**
A: Yes. You can configure both WebDAV and GitHub, and route different data types to different providers (e.g., database to GitHub, evidence files to WebDAV).

**Q: How often does sync happen?**
A: Sync is triggered automatically on every save, debounced at 1 second. You can also trigger a manual sync from the Settings page.

---

## Privacy & Security

### What Data is Collected

**Nothing.** ResearchFlow Companion does not collect, transmit, or analytics any of your data. All data stays on your device.

### Permissions Explained

| Permission | Why It's Needed |
|------------|-----------------|
| `storage` | Store research data locally |
| `activeTab` | Access the current tab for metadata capture |
| `tabs` | Detect tab URLs for DOI extraction and page type detection |
| `scripting` | Inject content script for metadata scraping |
| `sidePanel` | Display the side panel workspace |
| `unlimitedStorage` | Store large research databases without quota limits |
| `contextMenus` | Add right-click "Log selection" menu item |

### Host Permissions

| Host | Why |
|------|-----|
| `api.github.com` | GitHub sync |
| `api.openai.com` | OpenAI AI Copilot |
| `api.deepseek.com` | DeepSeek AI Copilot |
| `api.unpaywall.org` | Open-access PDF lookup |

The `optional_host_permissions` (`http://*/*`, `https://*/*`) are only requested when the content script needs to be injected for scraping. They are not active by default.

---

## Known Limitations

1. **Chrome Only**: Requires Chrome 116+ or Chromium-based browser. No Firefox/Safari support.
2. **No Real-Time Collaboration**: Sync is single-user multi-device. Not designed for simultaneous multi-user editing.
3. **No Binary File Storage**: Evidence files are stored as links, not uploaded to the extension. You need to store actual files in your cloud drive.
4. **API Key Storage**: API keys are stored in `chrome.storage.local` without additional encryption. This is standard for browser extensions but means anyone with physical access to your browser could read them.
5. **Monolithic Dashboard**: The options page controller (`options.js`) is 5,257 lines — a single file handling all dashboard views. This is a known architectural limitation.
6. **No Offline AI**: AI features require an internet connection to reach the API endpoints.

---

## Contributing

Contributions are welcome! Here's how to get started:

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ResearchFlow-Extension.git
   ```

2. Load the extension in Chrome (see [Installation](#installation-step-by-step))

3. Make your changes to the source files

4. Reload the extension:
   - Go to `chrome://extensions/`
   - Click the refresh icon (🔄) on the ResearchFlow Companion card

5. Test your changes

### Code Style

- **No build tools**: Write vanilla JavaScript (ES6+). No TypeScript, no bundler.
- **No dependencies**: Do not add npm packages. Everything should be self-contained.
- **Chrome MV3 APIs**: Use `chrome.*` APIs, not deprecated `browser.*` APIs.
- **CSS Custom Properties**: Use the existing design system variables from `theme.css`.
- **Naming**: Use camelCase for JavaScript, kebab-case for CSS classes.

### Reporting Issues

If you find a bug or have a feature request:

1. Check if the issue already exists in GitHub Issues
2. If not, create a new issue with:
   - A clear title and description
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Screenshots if applicable
   - Your Chrome version and OS

---

## License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 ResearchFlow Companion

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Acknowledgments

- **Chrome Extensions Team** for the Manifest V3 platform and Side Panel API
- **Unpaywall** for the open-access PDF lookup API
- **OpenAI** and **DeepSeek** for the AI language model APIs
- **Academic publishers** for providing structured metadata in their web pages
- The research community for feedback and feature requests

---

<div align="center">

**Built with care for researchers, by researchers.**

[Report Bug](https://github.com/YOUR_USERNAME/ResearchFlow-Extension/issues) · [Request Feature](https://github.com/YOUR_USERNAME/ResearchFlow-Extension/issues) · [Documentation](https://github.com/YOUR_USERNAME/ResearchFlow-Extension/wiki)

</div>
