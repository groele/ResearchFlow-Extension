<div align="center">

# ResearchFlow Companion

**本地优先的科研工作流浏览器插件**  
*Local-first browser companion for literature capture, project management, manuscript tracking, and AI-assisted academic work.*

![Type](https://img.shields.io/badge/type-Chrome%20Extension-blue?style=flat-square)
![Manifest](https://img.shields.io/badge/manifest-MV3-green?style=flat-square)
![Architecture](https://img.shields.io/badge/architecture-local--first-purple?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-yellow?style=flat-square)

Part of **ResearchFlow Lab** — a local-first research productivity ecosystem for literature, manuscripts, data, and scientific visualization.

</div>

---

## 01. Overview

**ResearchFlow Companion** turns the browser into a lightweight research operating system. It helps researchers capture papers, organize projects, track manuscripts, write structured research records, and optionally use AI copilots while keeping the core workflow local-first.

**ResearchFlow Companion** 是一个面向研究生、科研人员和学术团队的 Chrome 扩展。它把浏览器扩展为一个本地优先的科研工作台，用于文献捕获、项目管理、科研记录、投稿追踪和 AI 辅助写作。

---

## 02. Why this project exists

Modern research work is fragmented across publisher pages, Google Scholar, Zotero, Word, spreadsheets, cloud drives, AI chats, and manuscript submission systems. ResearchFlow Companion reduces that fragmentation by providing one structured browser-side workflow.

核心目标：

- **Capture** literature and metadata at the moment of reading.
- **Organize** papers, notes, projects, manuscripts, evidence, and tasks in one hierarchy.
- **Track** manuscript timelines from idea, experiment, draft, submission, revision, acceptance, to online publication.
- **Assist** academic writing with optional AI models.
- **Keep data local-first**, with user-controlled sync through private storage.

---

## 03. Key features

| Module | What it does | 中文说明 |
|---|---|---|
| Literature Capture | Extract metadata from academic pages and save structured paper records | 从期刊页、学术页面中抓取论文题名、DOI、期刊、作者等元信息 |
| Research Projects | Organize research areas, projects, records, papers, notes, and tasks | 按研究方向、项目、论文、记录建立层级化管理 |
| Manuscript Tracker | Track manuscript status, deadlines, revisions, and acceptance milestones | 管理投稿状态、返修节点、接收时间和投稿周期 |
| Research Records | Spreadsheet-like records with search, filters, custom fields, and evidence links | 类表格科研记录系统，支持检索、筛选和自定义属性 |
| AI Copilot | Summarize papers, generate rebuttal drafts, polish academic text, and draft CV entries | 支持文献总结、审稿回复草稿、学术润色和简历条目生成 |
| Quick Notes | Capture fast notes from popup, side panel, or selected web text | 通过弹窗、侧边栏、网页划词快速记录想法 |
| Citation Tools | Generate APA, MLA, BibTeX, and structured reading notes | 生成常用引用格式和结构化读书笔记 |
| Sync | Optional WebDAV and GitHub-based private sync | 支持通过 WebDAV 或 GitHub 私有仓库进行可控同步 |
| Bilingual UI | English and Chinese interface | 支持中英文界面 |
| Theme | Light, dark, and system-aware appearance | 支持亮色、暗色和跟随系统主题 |

---

## 04. Product philosophy

ResearchFlow follows four design principles:

1. **Local-first** — core data should remain available without a server.
2. **Research-native** — data structures should match real academic workflows, not generic note-taking models.
3. **Modular** — literature, records, manuscripts, tasks, AI, and sync should be replaceable modules.
4. **Low-friction** — capturing a paper or note should take fewer clicks than copying it into a spreadsheet.

---

## 05. Architecture

```text
ResearchFlow Companion
├── Manifest V3 Extension Layer
│   ├── popup / quick capture
│   ├── side panel / notes and tasks
│   ├── content scripts / page extraction
│   └── background service worker / orchestration
├── Local Data Layer
│   ├── chrome.storage.local
│   ├── IndexedDB
│   └── import / export snapshots
├── Research Data Model
│   ├── areas
│   ├── projects
│   ├── papers
│   ├── records
│   ├── manuscripts
│   ├── evidence
│   └── tasks
└── Optional Integrations
    ├── AI providers
    ├── WebDAV
    └── GitHub sync
```

---

## 06. Quick start

```bash
git clone https://github.com/groele/ResearchFlow-Extension.git
cd ResearchFlow-Extension
```

Then load the extension in Chrome:

1. Open `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the project folder that contains `manifest.json`.
5. Pin **ResearchFlow Companion** to the toolbar.

---

## 07. Recommended workflow

```text
Find paper → Capture metadata → Assign to project → Add reading note
          → Extract evidence → Track manuscript → Draft response / summary
          → Sync private backup
```

Typical use cases:

- Save papers while browsing journal pages.
- Build project-specific literature libraries.
- Track manuscript progress and revision rounds.
- Record experimental evidence and analysis notes.
- Use AI for summaries, rebuttals, or structured writing drafts.

---

## 08. Documentation standard

This repository hosts the canonical ResearchFlow Lab project standard:

- `docs/standards/RESEARCHFLOW_LAB_PROJECT_STANDARDS.md`

All related projects should follow this style for README structure, badge vocabulary, documentation hierarchy, commit messages, versioning, privacy wording, and roadmap format.

---

## 09. Roadmap

- [ ] More robust DOI and metadata extraction across publishers
- [ ] Stronger manuscript timeline visualization
- [ ] Better Zotero import / export bridge
- [ ] Project-level evidence graph
- [ ] PDF annotation and reading-progress integration
- [ ] More stable GitHub / WebDAV sync conflict resolution
- [ ] Modular plugin API for custom research templates

---

## 10. Privacy and data ownership

ResearchFlow Companion is designed as a **local-first** tool. Core data is stored in the browser unless the user explicitly enables cloud sync or AI services. API keys, sync targets, and remote services should remain user-controlled.

---

## 11. Related projects

- **PaperPilot Pro** — academic search and publisher-page enhancement
- **ClipNote** — browser-native quick notes and Markdown capture
- **ManuGuide** — Microsoft Word manuscript formatting and style checker
- **Witec-Matlab** — spectroscopy data analysis workflow
- **Scientific Color Lab** — scientific color and visualization workspace

---

## 12. License

MIT License.

Developed by **Shikun Hou / groele**.
