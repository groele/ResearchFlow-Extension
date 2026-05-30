# ResearchFlow Lab Project Standards

**A unified documentation, branding, and engineering style guide for the groele research-software ecosystem.**  
**groele 个人科研软件生态的统一 README、项目结构、命名、版本与发布规范。**

---

## 01. Brand identity

### 1.1 Umbrella brand

The shared umbrella identity is:

> **ResearchFlow Lab**

ResearchFlow Lab is a personal research-software ecosystem focused on local-first, research-native, and productivity-oriented tools for academic work.

中文定位：

> **ResearchFlow Lab 是一个面向科研人员的本地优先科研软件工具生态，覆盖文献发现、浏览器记录、论文写作、投稿追踪、实验数据分析和科研可视化。**

### 1.2 Brand sentence

Use the following sentence consistently across README files:

> Part of **ResearchFlow Lab** — a local-first research productivity ecosystem for literature, manuscripts, data, and scientific visualization.

中文：

> 本项目属于 **ResearchFlow Lab**：一个围绕文献、论文、数据和科研可视化构建的本地优先科研生产力工具生态。

### 1.3 Core principles

All projects should reflect four principles:

| Principle | Meaning | 中文说明 |
|---|---|---|
| Local-first | Core data should remain usable without a server | 核心数据优先保存在本地，避免默认依赖远程服务 |
| Research-native | The data model should match real academic workflows | 数据结构应贴合真实科研流程，而不是泛化笔记模型 |
| Modular | Each project should expose clear modules and boundaries | 模块边界清晰，便于扩展、复用和维护 |
| Low-friction | Important actions should require minimal interaction | 文献保存、笔记捕获、数据导出等操作应尽量少点击 |

---

## 02. Project taxonomy

Use the following taxonomy to classify repositories.

| Category | Representative projects | Purpose |
|---|---|---|
| Research OS | ResearchFlow, ResearchFlow Companion | Project, literature, manuscript, evidence, and task management |
| Literature Engine | PaperPilot Pro, BetterScholar | Academic search, publisher-page enhancement, DOI/PDF/BibTeX workflows |
| Capture Layer | ClipNote | Quick notes, clipboard snippets, Markdown side panel, web text capture |
| Manuscript Layer | ManuGuide | Word-based manuscript formatting, style, and bilingual writing checks |
| Data Layer | Witec-Matlab, Witec-Flow, WITio | Raman/PL spectroscopy processing and batch analysis |
| Visualization Layer | Scientific Color Lab, CSL-Studio | Scientific color palettes, figure color analysis, plotting export |
| Zotero Layer | ZoteroPreview, Zotero-Weekly-Plan, ZoteroPlugins | Zotero reading, preview, planning, and literature management extensions |

---

## 03. Repository naming rules

### 3.1 Product repositories

Use clear product-style names:

- `ResearchFlow-Extension`
- `Paperpilot-Pro`
- `ClipNote`
- `ManuGuide`
- `Scientific-Color-Lab`
- `Witec-Matlab`

### 3.2 Internal packages

Use lower-kebab-case for package names and build artifacts:

- `clipnote-extension`
- `researchflow-companion`
- `paperpilot-pro-extension`
- `scientific-color-lab`

### 3.3 Avoid ambiguous repository names

Avoid names such as:

- `mycode`
- `exp`
- `test`
- `new-project`
- `final-version`

If a repository is experimental, use:

- `prototype-<topic>`
- `lab-<topic>`
- `archive-<topic>`

---

## 04. Standard README structure

Every mature project SHOULD use the following structure.

```markdown
<div align="center">

# Project Name

**中文一句话定位**  
*English one-sentence positioning.*

Badges

Part of **ResearchFlow Lab** — a local-first research productivity ecosystem.

</div>

---

## 01. Overview
## 02. Why this project exists
## 03. Key features
## 04. Product philosophy
## 05. Architecture
## 06. Quick start
## 07. Recommended workflow
## 08. Project structure
## 09. Roadmap
## 10. Privacy and data ownership
## 11. Related projects
## 12. License
```

Small scripts may use:

```markdown
# Project Name

## Overview
## Features
## Installation
## Usage
## Limitations
## License
```

---

## 05. README writing style

### 5.1 Tone

| Rule | Required style |
|---|---|
| Be concrete | Explain exact workflows, modules, commands, and outputs |
| Be research-aware | Use terms such as metadata, DOI, BibTeX, manuscript, spectroscopy, PL, Raman, batch processing when relevant |
| Be concise | Start with value and scope before long implementation detail |
| Be bilingual when useful | Use Chinese + English for tools targeting Chinese researchers |
| Be transparent | State limitations and data ownership clearly |

### 5.2 Avoid

- Empty slogans: “the best”, “ultimate”, “revolutionary”.
- Unsupported claims: “100% accurate”, “perfectly secure”.
- Local private paths: `C:/Users/...`, `/Users/name/...`.
- Placeholder URLs: `your-username/project.git`.
- Overlong screenshot sections without explanation.

---

## 06. Top hero block standard

Use this exact pattern for mature projects:

```markdown
<div align="center">

# Project Name

**中文一句话定位**  
*English one-sentence positioning.*

![Type](https://img.shields.io/badge/type-Chrome%20Extension-blue?style=flat-square)
![Architecture](https://img.shields.io/badge/architecture-local--first-purple?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-yellow?style=flat-square)

Part of **ResearchFlow Lab** — a local-first research productivity ecosystem.

</div>
```

### 6.1 Badge vocabulary

| Dimension | Options |
|---|---|
| Type | Chrome Extension, Userscript, Word Add-in, MATLAB Toolbox, Web App, Zotero Plugin |
| Architecture | local-first, browser-native, modular, offline-first, data-pipeline |
| Language | TypeScript, JavaScript, MATLAB, C#, Python |
| Status | prototype, active, stable, archived |
| License | MIT, academic-use, private |

---

## 07. Feature table standard

Prefer feature tables instead of long unstructured bullet lists.

```markdown
| Module | What it does | 中文说明 |
|---|---|---|
| Literature Capture | Extract DOI, title, authors, journal, and PDF links | 提取 DOI、题名、作者、期刊和 PDF 链接 |
```

Feature names should be noun phrases:

- Literature Capture
- Manuscript Tracker
- Metadata Parser
- Polarization Analysis
- Batch Export
- Color Diagnostics

Avoid vague feature names:

- Powerful Tools
- Better UI
- Smart Function

---

## 08. Architecture diagram standard

Use `text` diagrams for consistency.

### 8.1 Browser extension

```text
Project Name
├── Extension UI
│   ├── popup
│   ├── side panel
│   └── options page
├── Content Layer
│   ├── publisher-page parser
│   ├── Google Scholar enhancer
│   └── text-selection capture
├── Background Layer
│   ├── message routing
│   ├── sync orchestration
│   └── scheduled tasks
└── Data Layer
    ├── chrome.storage.local
    ├── IndexedDB
    └── export / import snapshots
```

### 8.2 MATLAB / data-analysis project

```text
Raw Data → Import → Classification → Preprocessing → Fitting / Metrics → Excel Export → Figure-ready Tables
```

### 8.3 Word add-in

```text
Word Document → Scanner Registry → Rule Modules → Issue Cards → One-click Fix / Ignore → Audit Trail
```

### 8.4 Web / PWA tool

```text
Workspace UI → Project Library → Analysis Engine → Export Adapters → Reusable Presets
```

---

## 09. Quick start standard

Every README must provide a minimal executable path.

### 9.1 Chrome extension

```bash
git clone https://github.com/groele/ProjectName.git
cd ProjectName
npm install
npm run build
```

Then:

1. Open `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the generated `dist/` folder or the folder containing `manifest.json`.

### 9.2 MATLAB toolbox

```matlab
addpath(genpath('path_to_project'));
```

Then open a documented example script.

### 9.3 Word add-in

1. Open the `.sln` file in Visual Studio.
2. Restore dependencies.
3. Build in Debug or Release.
4. Press F5 to launch Word with the add-in.

---

## 10. Project structure standard

### 10.1 Browser extension

```text
project/
├── src/
│   ├── background/
│   ├── content/
│   ├── popup/
│   ├── sidepanel/
│   ├── options/
│   ├── shared/
│   └── storage/
├── public/
├── assets/
├── docs/
├── manifest.json
├── package.json
└── README.md
```

### 10.2 MATLAB toolbox

```text
project/
├── 1_import_preprocess/
├── 2_analysis_metrics/
├── 3_export_visualization/
├── examples/
├── docs/
├── tests/
└── README.md
```

### 10.3 Word add-in

```text
project/
├── AddIn/
│   ├── Ribbon/
│   ├── Scanners/
│   ├── Services/
│   ├── Models/
│   └── UI/
├── Guideline/
├── docs/
├── tests/
└── README.md
```

---

## 11. Documentation file set

Mature projects should gradually include:

| File | Purpose |
|---|---|
| `README.md` | Project overview and entry point |
| `README.zh-CN.md` | Chinese detailed documentation when needed |
| `docs/ARCHITECTURE.md` | Internal architecture and module boundaries |
| `docs/USAGE.md` | User workflows and examples |
| `docs/ROADMAP.md` | Development plan and milestones |
| `docs/CHANGELOG.md` | Release notes |
| `docs/PRIVACY.md` | Data storage, sync, API, and privacy model |
| `CONTRIBUTING.md` | Contribution and development rules |
| `LICENSE` | License text |

---

## 12. Commit message standard

Use a lightweight conventional commit style.

| Type | Use case |
|---|---|
| `feat:` | New user-facing feature |
| `fix:` | Bug fix |
| `docs:` | README, docs, comments |
| `style:` | Formatting without logic changes |
| `refactor:` | Internal restructuring without feature change |
| `perf:` | Performance improvement |
| `test:` | Tests and examples |
| `chore:` | Build, dependency, config, repo maintenance |
| `release:` | Version bump and release notes |

Examples:

```text
feat: add manuscript timeline module
docs: unify README style with ResearchFlow Lab standards
refactor: split metadata parser from content script
fix: prevent duplicate capture on publisher pages
```

---

## 13. Versioning standard

Use Semantic Versioning when the project is user-facing.

```text
MAJOR.MINOR.PATCH
```

| Version part | Meaning |
|---|---|
| MAJOR | Breaking changes or architecture rewrite |
| MINOR | New feature without breaking existing workflows |
| PATCH | Bug fix, docs fix, small compatibility update |

Recommended lifecycle:

- `0.x` — prototype / early research utility
- `1.x` — stable public tool
- `2.x` — major architecture or product evolution

---

## 14. Release note format

```markdown
# v1.2.0

## Added
- Added manuscript timeline metrics.

## Changed
- Reorganized side panel navigation.

## Fixed
- Fixed DOI parser for selected publisher pages.

## Notes
- Data model remains backward compatible.
```

---

## 15. Privacy and data ownership wording

Every local-first tool should include:

> This project is designed as a local-first tool. Core data remains on the user's device unless the user explicitly enables sync or external AI services.

For browser tools, specify:

- `chrome.storage.local`
- IndexedDB
- optional WebDAV / GitHub sync
- optional AI API providers

For data-analysis tools, specify:

- no automatic upload
- input/output files remain local
- example data should be anonymized

---

## 16. README quality checklist

Before publishing or updating a README:

- [ ] The project is understandable from the first 10 lines.
- [ ] It contains the ResearchFlow Lab ecosystem sentence.
- [ ] It has a concrete one-sentence positioning statement.
- [ ] It explains why the project exists.
- [ ] It includes a structured feature table.
- [ ] It includes architecture or workflow diagrams.
- [ ] It provides real installation commands.
- [ ] It avoids private local paths.
- [ ] It states privacy and data ownership assumptions.
- [ ] It has a roadmap with testable items.
- [ ] It links to related ecosystem projects.
- [ ] The license is clear.

---

## 17. Personal brand consistency

The personal style of this ecosystem should be:

> **Precise, research-native, local-first, modular, and visually disciplined.**

中文风格：

> **精确、科研原生、本地优先、模块化、视觉克制。**

This means:

- Do not make a tool look larger than it is.
- Do not hide experimental status.
- Do not use vague feature claims.
- Prefer mechanism, workflow, data model, and reproducibility over decoration.
- Make every repository look like it belongs to one coherent research-software portfolio.
