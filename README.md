# ResearchFlow Companion - Chrome Extension (v1.0.0)

Welcome to the **ResearchFlow Companion**! This Chrome Extension brings the comprehensive power of ResearchFlow OS directly into your daily scholarly browser workspace.

---

## ✨ Features Built-In

1. **Local-First & Multi-Cloud Distributed Syncing**:
   - Stores all research projects, notes, and manuscript pipelines in browser local storage for instant loads.
   - **Distributed Cloud Routing**: Selectively sync your core JSON database to **WebDAV (Jianguoyun, Nextcloud)** or **GitHub Private Repositories**, and route large evidence attachments (PDFs, images) to separate cloud folders.
2. **In-Context Scraper (Side Panel)**:
   - One-click metadata extraction on major portals: **arXiv**, **bioRxiv**, **medRxiv**, **PubMed**, and **Google Scholar**.
   - Pre-fills scholarly titles, DOI strings, author listings, and abstract content, and logs them instantly as research records or links them as project evidence.
3. **Conversational AI Copilot**:
   - Built-in wrapper for **OpenAI** and **DeepSeek** endpoints.
   - Quick-actions: **Summarize Page** (condenses abstracts into structured breakthroughs, bulleted contributions, and weaknesses), **Reviewer Rebuttal Generator** (constructs polite academic rebuttal drafts matching specific comments).
4. **Master Options Dashboard**:
   - Full-page responsive management system with dark glassmorphism styling.
   - **Dashboard Overview**: Metrics overview, CSS/SVG Gantt deadlines tracker, recent records, and pending reviews.
   - **Areas & Projects Tree**: Manage multi-disciplinary science domains, hypothesis outlines, and folders.
   - **Spreadsheet Records Grid**: Manage experiments, simulations, or reviews. Includes a **Dynamic Attributes Editor** to log custom fields (e.g. `temperature_K`, `gpu_type`, `sample_id`) to comply with the database specifications.
   - **Manuscripts Kanban**: Dynamic flow columns representing manuscript writing stages.
   - **Submissions Timeline & Matrices**: Rebuttal editor matrices and journal compliance checklists.
   - **Evidence Locker**: File links directly pointing to cloud drives.

---

## 🛠️ How to Load and Test

1. Open your Google Chrome browser.
2. In the address bar, type `chrome://extensions/` and hit Enter.
3. In the top-right corner, toggle the **"Developer mode"** switch to **ON**.
4. In the top-left corner, click **"Load unpacked"**.
5. Select the extension directory: `d:\researchflow-os\chrome-extension`.
6. Pin **ResearchFlow Companion** to your browser toolbar!

---

## 📂 Distributed Storage Mappings Setup

1. Open the Master Dashboard (click **ResearchFlow Options Page** in the extension popup or options).
2. Head to the **Multi-Cloud Settings** tab on the left sidebar.
3. Enter your private **WebDAV credentials** (e.g. Jianguoyun server URL and app password) or **GitHub Private Personal Access Token** (PAT).
4. Validate connections using **Test Connection** buttons.
5. In **Cloud Storage Routing**, select which cloud providers to sync database JSON metadata vs raw evidence files.
6. Click **Force Sync** to perform the initial sync!
