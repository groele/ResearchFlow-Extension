<div align="center">

**[English](README.md)** | **中文**

</div>

<div align="center">

<img src="assets/icons/icon-128.png" alt="ResearchFlow Companion Logo" width="96" height="96" />

# ResearchFlow Companion

### 你的个人研究操作系统 — Chrome 浏览器扩展

**文献捕获 | 项目管理 | 稿件追踪 | 多云同步 | 全部在浏览器中完成**

![Chrome Extension](https://img.shields.io/badge/Chrome%20扩展-Manifest%20V3-blue?style=flat-square)
![Version](https://img.shields.io/badge/版本-1.2.2-green?style=flat-square)
![License](https://img.shields.io/badge/许可证-MIT-yellow?style=flat-square)
![Chrome](https://img.shields.io/badge/Chrome-%3E%3D%20116-red?style=flat-square)
![Vanilla JS](https://img.shields.io/badge/原生JS-零依赖-orange?style=flat-square)

</div>

---

## 目录

- [什么是 ResearchFlow Companion？](#什么是-researchflow-companion)
- [功能一览](#功能一览)
- [系统要求](#系统要求)
- [安装教程（逐步说明）](#安装教程逐步说明)
- [快速入门指南](#快速入门指南)
  - [第一步：打开快捷面板](#第一步打开快捷面板)
  - [第二步：捕获你的第一篇论文](#第二步捕获你的第一篇论文)
  - [第三步：探索主控制台](#第三步探索主控制台)
  - [第四步：使用侧边栏工作区](#第四步使用侧边栏工作区)
- [功能详解](#功能详解)
  - [1. 文献捕获系统](#1-文献捕获系统)
  - [2. AI 智能助手](#2-ai-智能助手)
  - [3. 主控制台（Dashboard）](#3-主控制台dashboard)
  - [4. 快速笔记捕获（弹出面板）](#4-快速笔记捕获弹出面板)
  - [5. 右键菜单捕获](#5-右键菜单捕获)
  - [6. 笔记与任务（侧边栏）](#6-笔记与任务侧边栏)
- [配置指南](#配置指南)
  - [AI 智能助手配置](#ai-智能助手配置)
  - [多云同步配置](#多云同步配置)
  - [语言设置](#语言设置)
  - [数据导入/导出](#数据导入导出)
- [支持的学术平台](#支持的学术平台)
- [架构概览](#架构概览)
- [项目结构](#项目结构)
- [数据模型](#数据模型)
- [常见问题（FAQ）](#常见问题faq)
- [隐私与安全](#隐私与安全)
- [已知限制](#已知限制)
- [参与贡献](#参与贡献)
- [许可证](#许可证)
- [致谢](#致谢)

---

## 什么是 ResearchFlow Companion？

**ResearchFlow Companion** 是一款专为**学术研究者、研究生和科研团队**设计的 Chrome 浏览器扩展。它将你的浏览器变成一个功能完整的研究操作系统，帮助你：

- **捕获**学术论文，一键提取元数据（标题、DOI、作者、摘要等）
- **组织**研究领域、项目和记录，建立结构化的研究层级
- **追踪**稿件从构思到接收的全流程
- **协作**——借助 AI 智能助手进行论文摘要、审稿回复撰写等
- **同步**数据到你自己的私有云存储（WebDAV、GitHub）

所有数据**优先本地存储**在浏览器中——无需服务器，无需注册账号。除非你主动选择同步到云端，否则数据不会离开你的电脑。

---

## 功能一览

| 功能模块 | 说明 |
|---------|------|
| **文献捕获** | 一键从 20+ 学术平台提取论文元数据 |
| **AI 智能助手** | 论文摘要、审稿回复生成、CV 条目生成（支持 OpenAI / DeepSeek） |
| **主控制台** | 全页面管理面板，含 7 个视图：总览、项目、记录、稿件、投稿、证据、设置 |
| **稿件看板** | 四列看板（构思 → 撰写中 → 已投稿 → 已接收） |
| **研究记录** | 电子表格视图，支持自定义属性、搜索和筛选 |
| **快速笔记** | 弹出面板快速记录，自动检测 DOI |
| **右键捕获** | 选中网页文字 → 右键 → 保存为研究记录 |
| **引用生成器** | 支持 APA 第7版、MLA 第9版、BibTeX 格式 |
| **结构化阅读笔记** | 核心突破、方法论、数据集、局限性等维度 |
| **多云同步** | WebDAV（坚果云、Nextcloud）和 GitHub 私有仓库同步 |
| **笔记与任务** | 自动保存的草稿板 + 项目级任务清单 |
| **暗色模式** | 跟随系统设置自动切换明暗主题 |
| **中英双语** | 支持英文和中文界面切换 |

---

## 系统要求

| 要求 | 最低配置 |
|-----|---------|
| **浏览器** | Google Chrome 116+（或基于 Chromium 的浏览器：Edge、Brave、Arc） |
| **操作系统** | Windows、macOS、Linux、ChromeOS |
| **磁盘空间** | 扩展文件约 2 MB |
| **网络** | 可选（仅云同步和 AI 功能需要网络） |
| **API 密钥** | 可选（仅 AI 功能需要：OpenAI 或 DeepSeek 的 API Key） |

---

## 安装教程（逐步说明）

### 方法一：加载已解压的扩展（推荐）

这是从源代码安装 Chrome 扩展的标准方式。

#### 第一步：下载源代码

克隆仓库或下载 ZIP 文件：

```bash
git clone https://github.com/YOUR_USERNAME/ResearchFlow-Extension.git
```

或者从 GitHub 下载 ZIP 文件并解压到电脑上的某个文件夹。

#### 第二步：打开 Chrome 扩展管理页面

1. 打开 Google Chrome 浏览器
2. 在地址栏输入 `chrome://extensions/` 并按回车
3. 你将看到 Chrome 扩展管理页面

#### 第三步：开启开发者模式

1. 在扩展页面的**右上角**找到 **"开发者模式"** 开关
2. 点击将其打开（开关会向右滑动并变为蓝色）

#### 第四步：加载扩展

1. 点击左上角的 **"加载已解压的扩展程序"** 按钮
2. 在弹出的文件选择对话框中，导航到扩展所在的文件夹
3. 选择文件夹：`ResearchFlow-Extension-1.1.0`（包含 `manifest.json` 的那个文件夹）
4. 点击 **"选择文件夹"**

#### 第五步：固定扩展图标

1. 在 Chrome **右上角**找到拼图图标（扩展管理）
2. 点击拼图图标
3. 在列表中找到 **"ResearchFlow Companion"**
4. 点击旁边的 **📌 图钉图标**，将其固定到工具栏

**安装完成！** 你现在应该能在浏览器工具栏上看到 ResearchFlow Companion 的图标了。

### 方法二：Chrome 网上应用店（即将上架）

扩展上架 Chrome 网上应用店后，将提供直接安装链接。此部分届时更新。

---

## 快速入门指南

### 第一步：打开快捷面板

点击浏览器工具栏上的 **ResearchFlow Companion** 图标，打开**快捷面板**：

- 顶部的**指标卡片**显示你的活跃项目数和研究记录数
- **"进入主控制台"** 按钮打开完整的管理界面
- **"切换侧边栏工作区"** 按钮打开侧边栏，用于文献捕获和 AI 助手

### 第二步：捕获你的第一篇论文

1. 在浏览器中打开任意学术论文页面（例如 arXiv 论文、PubMed 文章）
2. 点击 **ResearchFlow Companion** 图标 → 点击 **"切换侧边栏工作区"**
3. 在侧边栏中，点击 **"Capture"（捕获）** 标签页
4. 点击 **"Capture Active Page"（捕获当前页面）** 按钮
5. 扩展将自动提取以下信息：
   - 论文标题
   - DOI 编号
   - 作者列表
   - 摘要内容
   - PDF 链接
6. 填写额外的阅读笔记（可选）：
   - **核心突破**：主要发现是什么？
   - **方法论与公式**：使用了什么方法？
   - **数据集与算力**：用了什么数据/工具？
   - **已知局限**：有什么不足之处？
7. 点击 **"Save Record"（保存记录）** 保存为研究记录，或点击 **"Link Evidence"（关联证据）** 将其链接到证据库

### 第三步：探索主控制台

1. 点击 **ResearchFlow Companion** 图标
2. 点击 **"进入主控制台"**（紫色按钮）
3. 将打开一个新标签页，显示完整的控制台界面
4. 左侧侧边栏导航包含以下模块：
   - **Dashboard（总览）**：指标概览、甘特图时间线、最近活动
   - **Areas & Projects（领域与项目）**：管理研究领域和项目
   - **Research Records（研究记录）**：以电子表格形式浏览所有记录
   - **Manuscripts（稿件）**：稿件管理看板
   - **Submissions（投稿）**：追踪期刊投稿和审稿状态
   - **Evidence（证据）**：云存储文件链接
   - **Settings（设置）**：配置同步、AI、语言等

### 第四步：使用侧边栏工作区

侧边栏包含三个标签页：

1. **Capture（捕获）标签页**：从当前页面提取元数据，生成学术引用
2. **AI Copilot（AI 助手）标签页**：与 AI 对话、摘要页面、生成审稿回复
3. **Notes（笔记）标签页**：快速草稿板 + 项目任务清单

---

## 功能详解

### 1. 文献捕获系统

文献捕获系统采用**四层抓取架构**，从学术网页中提取元数据：

| 层级 | 方法 | 速度 | 说明 |
|-----|------|------|------|
| **第1层** | 标准 Meta 标签 | ~1ms | 读取 Dublin Core 和 Highwire Press 标准的 meta 标签（`citation_title`、`citation_doi` 等） |
| **第2层** | 平台专用解析器 | ~5ms | 针对各平台（arXiv、PubMed 等）定制的 DOM 选择器 |
| **第3层** | 启发式 PDF 评分 | ~20ms | 对页面上所有链接进行评分，找到最可能的 PDF 链接 |
| **第4层** | Unpaywall API | ~500ms | 通过 Unpaywall API 查询开放获取 PDF（异步，通过后台脚本） |

**主动缓存机制**：当你访问学术页面时，内容脚本会在后台自动抓取元数据并缓存 5 分钟。当你点击"捕获当前页面"时，结果是即时返回的。

**引用生成器**：捕获论文后，可以生成三种格式的引用：
- **APA 第7版**：`(Author, Year). Title. Journal. https://doi.org/xxx`
- **MLA 第9版**：`Author. "Title." Journal, Year. DOI.`
- **BibTeX**：`@article{key, author={...}, title={...}, ...}`

### 2. AI 智能助手

AI 智能助手封装了 OpenAI 和 DeepSeek 的 API 端点，提供研究辅助功能。

**快捷操作**：

| 操作 | 说明 |
|-----|------|
| **Summarize Page（摘要页面）** | 将摘要浓缩为：突破性总结、核心贡献、研究不足 |
| **Reviewer Rebuttal（审稿回复）** | 为审稿意见生成礼貌的学术回复草稿 |
| **CV Entry（CV 条目）** | 将成果格式化为学术简历的条目 |
| **Extract Metadata（提取元数据）** | AI 从粘贴的原始文本中提取论文元数据（兜底方案） |

**自由对话**：在聊天输入框中输入任何研究问题，获取 AI 驱动的回答。

**配置方法**：参见 [AI 智能助手配置](#ai-智能助手配置)。

### 3. 主控制台（Dashboard）

主控制台是一个全页面应用，包含 **7 个主要视图**：

#### 3.1 Dashboard 总览
- **指标卡片**：已接收稿件数、审稿中数量、总投稿数
- **甘特图时间线**：稿件流程的可视化展示，含截止日期追踪
- **最近研究日志**：所有项目的最新活动
- **时间线提醒**：即将到期和已逾期的事项

#### 3.2 领域与项目树
- 创建**研究领域**（如"凝聚态物理"、"机器学习"）
- 在每个领域下创建**项目**
- 定义每个项目的**假设**、**目标**和**当前阶段**
- 使用文件夹和标签进行组织

#### 3.3 研究记录
- **电子表格视图**：所有记录的可筛选、可搜索表格
- **记录类型**：实验、仿真、问卷、分析、文献综述
- **动态自定义属性**：添加自定义字段，如 `temperature_K`、`gpu_type`、`sample_id`
- **搜索与筛选**：按标题、DOI、项目、类型或日期查找记录

#### 3.4 稿件看板
- **四列看板**：构思 → 撰写中 → 已投稿 → 已接收
- 拖拽稿件在各阶段之间移动
- 将稿件关联到项目和研究记录

#### 3.5 投稿与审稿
- 追踪期刊投稿的日期和状态
- **审稿回复编辑器**：结构化地组织审稿回复
- **期刊合规检查清单**：验证格式要求
- **快捷链接**：直达 ACS、Wiley、APL、Nature 等期刊门户

#### 3.6 证据库
- 存储云盘中的文件链接
- 将证据关联到具体项目和记录
- 支持 PDF、图片、数据集等任意文件类型

#### 3.7 多云设置
- 配置 WebDAV 和 GitHub 同步
- 设置 AI API 密钥
- 切换语言（英文/中文）
- 导入/导出数据库 JSON 文件

### 4. 快速笔记捕获（弹出面板）

弹出面板提供快速记录功能，无需离开当前页面：

- **自动 DOI 检测**：从当前标签页的 URL 或标题中自动识别 DOI
- **自动标题提取**：清除网站前缀（arXiv、PubMed 等），提取干净的论文标题
- **项目选择**：选择将笔记保存到哪个项目，或直接创建新项目
- **一键保存**：一键将你的观察保存为研究记录

### 5. 右键菜单捕获

安装扩展后，右键菜单会新增一个选项：

1. 在任意网页上**选中文字**
2. **右键**打开上下文菜单
3. 选择 **"Log selection as Research Record Note"**（将选中内容记录为研究笔记）
4. 选中的文字将被保存为一条新的研究记录

### 6. 笔记与任务（侧边栏）

侧边栏的 Notes 标签页提供：

- **工作草稿板**：输入即自动保存的文本区域（防抖延迟 500ms）
- **项目清单**：按项目范围管理的任务列表
- **添加任务**：点击 "+ Add Task" 创建新的待办事项

---

## 配置指南

### AI 智能助手配置

要使用 AI 助手功能，你需要一个 OpenAI 或 DeepSeek 的 API 密钥。

#### 方案一：OpenAI API Key

1. 访问 [platform.openai.com](https://platform.openai.com)
2. 注册或登录
3. 进入 **API Keys** 页面
4. 点击 **"Create new secret key"**
5. 复制密钥（以 `sk-...` 开头）

#### 方案二：DeepSeek API Key

1. 访问 [platform.deepseek.com](https://platform.deepseek.com)
2. 注册或登录
3. 进入 **API Keys** 页面
4. 点击 **"Create API Key"**
5. 复制密钥

#### 在扩展中配置

1. 打开**主控制台**（点击扩展图标 → "进入主控制台"）
2. 点击左侧侧边栏的 **"Settings"（设置）**
3. 找到 **AI Configuration（AI 配置）** 部分
4. 选择你的 AI 服务商（OpenAI 或 DeepSeek）
5. 输入你的 **API Key**
6. 输入 **API Endpoint**（API 端点，默认已预填）：
   - OpenAI：`https://api.openai.com/v1`
   - DeepSeek：`https://api.deepseek.com/v1`
7. 点击 **"Test Connection"（测试连接）** 验证是否成功
8. 点击 **"Save"（保存）**

### 多云同步配置

ResearchFlow Companion 支持将研究数据同步到你自己的私有云存储。

#### 方案一：WebDAV（坚果云 / Nextcloud）

**坚果云配置**：

1. 登录 [jianguoyun.com](https://www.jianguoyun.com)
2. 进入 **安全设置** → **第三方应用管理**
3. 点击 **"添加应用"**
4. 生成应用密码
5. 记下服务器地址和应用密码

**Nextcloud 配置**：

1. 登录你的 Nextcloud 实例
2. 进入 **设置** → **安全** → **应用密码**
3. 生成新的应用密码
4. 记下服务器地址和应用密码

**在扩展中配置**：

1. 打开**主控制台** → **Settings（设置）** → **Multi-Cloud Settings（多云设置）**
2. 在 **WebDAV** 部分填写：
   - **服务器地址**：例如 `https://dav.jianguoyun.com/dav/` 或 `https://your-nextcloud.com/remote.php/dav/files/用户名/`
   - **用户名**：你的 WebDAV 用户名
   - **密码**：你的应用专用密码
3. 点击 **"Test Connection"（测试连接）**
4. 选择要同步的数据类型（数据库 JSON、证据文件，或两者都同步）

#### 方案二：GitHub 私有仓库

1. 访问 [github.com/settings/tokens](https://github.com/settings/tokens)
2. 点击 **"Generate new token (classic)"**
3. 命名令牌（如 "ResearchFlow Sync"）
4. 选择 **`repo`** 权限范围（完全控制私有仓库）
5. 点击 **"Generate token"**
6. 复制令牌（以 `ghp_...` 开头）

**在扩展中配置**：

1. 打开**主控制台** → **Settings（设置）** → **Multi-Cloud Settings（多云设置）**
2. 在 **GitHub** 部分填写：
   - **Personal Access Token (PAT)**：粘贴你的令牌
   - **Repository（仓库）**：输入 `用户名/仓库名`（如果仓库不存在会自动创建）
   - **File Path（文件路径）**：默认为 `researchflow_db.json`
3. 点击 **"Test Connection"（测试连接）**
4. 点击 **"Force Sync"（强制同步）** 执行首次同步

#### 云存储路由

你可以将不同类型的数据路由到不同的存储服务商：

| 数据类型 | 说明 | 推荐存储 |
|---------|------|---------|
| **数据库 JSON** | 所有项目、记录、稿件的元数据 | GitHub（有版本控制）或 WebDAV |
| **证据文件** | PDF、图片、数据集 | WebDAV（支持更大的文件） |

### 语言设置

1. 打开**主控制台** → **Settings（设置）**
2. 找到 **Language（语言）** 部分
3. 选择 **English（英文）** 或 **中文**
4. 界面将立即更新

### 数据导入/导出

#### 导出数据

1. 打开**主控制台** → **Settings（设置）**
2. 找到 **Database（数据库）** 部分
3. 点击 **"Export Database"（导出数据库）**
4. 一个包含所有研究数据的 JSON 文件将被下载

#### 导入数据

1. 打开**主控制台** → **Settings（设置）**
2. 找到 **Database（数据库）** 部分
3. 点击 **"Import Database"（导入数据库）**
4. 选择之前导出的 JSON 文件
5. 确认导入（系统会使用实体级冲突解决策略与现有数据合并）

---

## 支持的学术平台

文献捕获系统支持 **20+ 个学术平台**。完整列表如下：

| 平台 | 域名 | 可提取的元数据 |
|-----|------|--------------|
| **arXiv** | arxiv.org | 标题、作者、摘要、DOI、PDF |
| **bioRxiv** | biorxiv.org | 标题、作者、摘要、DOI、PDF |
| **medRxiv** | medrxiv.org | 标题、作者、摘要、DOI、PDF |
| **PubMed** | pubmed.ncbi.nlm.nih.gov | 标题、作者、摘要、DOI |
| **PMC** | ncbi.nlm.nih.gov/pmc | 标题、作者、摘要、DOI、PDF |
| **Nature** | nature.com | 标题、作者、摘要、DOI、期刊名 |
| **IEEE** | ieeexplore.ieee.org | 标题、作者、摘要、DOI |
| **Springer** | link.springer.com | 标题、作者、摘要、DOI、期刊名 |
| **ScienceDirect** | sciencedirect.com | 标题、作者、摘要、DOI |
| **ACM** | dl.acm.org | 标题、作者、摘要、DOI |
| **Wiley** | onlinelibrary.wiley.com | 标题、作者、摘要、DOI、期刊名 |
| **PLOS** | journals.plos.org | 标题、作者、摘要、DOI、PDF |
| **SSRN** | ssrn.com | 标题、作者、摘要、DOI |
| **ResearchGate** | researchgate.net | 标题、作者、摘要 |
| **Semantic Scholar** | semanticscholar.org | 标题、作者、摘要、DOI |
| **Google Scholar** | scholar.google.com | 标题、作者、摘要片段 |
| **Science** | science.org | 标题、作者、摘要、DOI、期刊名 |
| **Cell Press** | cell.com | 标题、作者、摘要、DOI、期刊名 |
| **APS Physics** | journals.aps.org | 标题、作者、摘要、DOI、PDF |
| **Taylor & Francis** | tandfonline.com | 标题、作者、摘要、DOI、期刊名 |
| **Overleaf** | overleaf.com | 项目标题 |
| **通用页面** | 任意网站 | 标题、meta 标签、PDF 链接（启发式） |

---

## 架构概览

ResearchFlow Companion 基于 **Manifest V3** 架构构建：

```
┌─────────────────────────────────────────────────────┐
│                    Chrome 浏览器                      │
├─────────────┬───────────────┬───────────────────────┤
│   弹出面板    │   侧边栏工作区  │   主控制台页面          │
│  (popup.html │ (sidepanel.   │  (options.html)       │
│   popup.js)  │  html,        │   options.js)         │
│              │  sidepanel.js)│   (5,257 行)          │
├─────────────┴───────────────┴───────────────────────┤
│              chrome.runtime.sendMessage()            │
├─────────────────────────────────────────────────────┤
│          后台服务工作者（Service Worker）               │
│          (background.js — 337 行)                   │
│          - 标签页级抓取缓存                            │
│          - 右键菜单处理                               │
│          - 同步触发协调器                              │
│          - 内容脚本注入器                              │
├─────────────────────────────────────────────────────┤
│              chrome.scripting.executeScript()        │
├─────────────────────────────────────────────────────┤
│          内容脚本（Content Script）                    │
│          (content.js — 701 行)                      │
│          - 四层元数据抓取器                            │
│          - 平台专用 DOM 解析器                        │
│          - 主动缓存推送                               │
├─────────────────────────────────────────────────────┤
│              chrome.storage.local                    │
├─────────────────────────────────────────────────────┤
│          存储引擎（Storage Engine）                    │
│          (storage.js — 704 行)                      │
│          - 本地优先持久化                              │
│          - WebDAV 同步（PROPFIND/PUT）               │
│          - GitHub Contents API 同步                  │
│          - 实体级合并                                 │
├─────────────────────────────────────────────────────┤
│          AI 客户端                                    │
│          (ai.js — 145 行)                           │
│          - OpenAI / DeepSeek 封装                    │
│          - Chat Completions API                     │
└─────────────────────────────────────────────────────┘
```

### 核心设计原则

1. **本地优先（Local-First）**：所有数据存储在 `chrome.storage.local` 中，无需服务器。
2. **零依赖（Zero Dependencies）**：纯原生 JavaScript——无 npm、无打包工具、无框架。
3. **实体级同步**：合并冲突在实体级别解决（按 ID + `updatedAt` 时间戳），而非整体覆盖数据库。
4. **主动缓存**：内容脚本在页面加载时自动抓取元数据并缓存，确保即时访问。
5. **渐进增强**：核心功能离线可用；AI 和同步是可选的增强功能。

---

## 项目结构

```
ResearchFlow-Extension-1.1.0/
├── manifest.json                    # Chrome MV3 清单文件
├── README.md                        # 英文文档
├── README.zh-CN.md                  # 中文文档（本文件）
├── guide.md                         # 架构审查文档（中文）
├── .gitignore                       # Git 忽略规则
├── assets/
│   └── icons/
│       ├── icon-16.png              # 徽章图标
│       ├── icon-32.png              # 视网膜屏徽章图标
│       ├── icon-48.png              # 扩展管理页面图标
│       ├── icon-128.png             # Chrome 网上应用店图标
│       └── icon.svg                 # 矢量源文件
├── data/
│   └── preloaded_db.json            # 预置种子数据（含示例项目）
├── pages/
│   ├── popup.html                   # 快捷面板弹出页
│   ├── sidepanel.html               # 侧边栏工作区
│   └── options.html                 # 主控制台页面
├── scripts/
│   ├── background.js                # MV3 服务工作者（337 行）
│   ├── content.js                   # 内容脚本抓取器（701 行）
│   ├── popup.js                     # 弹出面板控制器（275 行）
│   ├── sidepanel.js                 # 侧边栏控制器（745 行）
│   ├── options.js                   # 主控制台控制器（5,257 行）
│   ├── storage.js                   # 存储与同步引擎（704 行）
│   └── ai.js                        # AI 智能助手客户端（145 行）
└── styles/
    ├── theme.css                    # 设计系统与 CSS 变量
    ├── popup.css                    # 弹出面板样式
    ├── sidepanel.css                # 侧边栏样式
    └── options.css                  # 主控制台样式
```

**总计**：所有文件约 13,400 行源代码。无需构建步骤。

---

## 数据模型

扩展将所有数据存储在一个 JSON 数据库中，结构如下：

```json
{
  "schemaVersion": 2,
  "researchAreas": [
    {
      "id": "唯一ID",
      "name": "凝聚态物理",
      "description": "...",
      "color": "#7c3aed",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "projects": [
    {
      "id": "唯一ID",
      "areaId": "所属领域ID",
      "title": "项目标题",
      "discipline": "物理学",
      "hypothesis": "...",
      "objectives": "...",
      "currentStage": "experiment",
      "status": "active",
      "tags": ["标签1", "标签2"],
      "customFields": {},
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "researchRecords": [
    {
      "id": "唯一ID",
      "projectId": "所属项目ID",
      "type": "literature_review",
      "title": "论文标题",
      "doi": "10.1038/...",
      "authors": "作者A, 作者B",
      "abstract": "...",
      "pdfUrl": "https://...",
      "notes": {
        "breakthrough": "核心突破...",
        "methodology": "方法论...",
        "datasets": "数据集...",
        "limitations": "局限性..."
      },
      "customFields": {},
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "manuscripts": [
    {
      "id": "唯一ID",
      "projectId": "所属项目ID",
      "title": "稿件标题",
      "stage": "drafting",
      "targetJournal": "Nature",
      "deadline": "2024-06-01",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "submissions": [
    {
      "id": "唯一ID",
      "manuscriptId": "所属稿件ID",
      "journal": "Nature",
      "status": "in_review",
      "submittedAt": "...",
      "notes": "..."
    }
  ],
  "tasks": [
    {
      "id": "唯一ID",
      "projectId": "所属项目ID",
      "text": "任务描述",
      "completed": false,
      "createdAt": "..."
    }
  ],
  "evidence": [
    {
      "id": "唯一ID",
      "projectId": "所属项目ID",
      "name": "文件名.pdf",
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
      "language": "zh",
      "name": "",
      "email": ""
    },
    "journalPortals": []
  }
}
```

### 记录类型

| 类型 | 说明 |
|-----|------|
| `experiment` | 实验记录 |
| `simulation` | 仿真计算结果 |
| `survey` | 问卷调查数据 |
| `analysis` | 数据分析结果 |
| `literature_review` | 文献综述笔记 |

### 稿件阶段

| 阶段 | 说明 |
|-----|------|
| `idea` | 初始构思或研究问题 |
| `drafting` | 正在撰写稿件 |
| `submitted` | 已投稿至期刊 |
| `accepted` | 已被接收发表 |

---

## 常见问题（FAQ）

### 通用问题

**问：我的数据是否存储在服务器上？**
答：不会。所有数据都存储在浏览器的 `chrome.storage.local` 中。云同步完全可选，且使用的是你自己的账号（WebDAV、GitHub）。

**问：需要联网吗？**
答：不需要。核心功能（文献捕获、主控制台、笔记）离线可用。仅以下功能需要网络：
- AI 智能助手功能（需要调用 OpenAI/DeepSeek 的 API）
- 云同步（需要连接到你的 WebDAV/GitHub 服务器）
- 抓取器第4层（Unpaywall API 查询开放获取 PDF）

**问：能在 Edge/Brave/Arc 上用吗？**
答：可以。任何支持 Manifest V3 的 Chromium 内核浏览器（Chrome 116+）都可以使用。

**问：能在 Firefox 上用吗？**
答：目前不支持。扩展使用了 Chrome 特有的 API（Side Panel、`chrome.storage.local`）。移植到 Firefox 需要适配 WebExtensions API。

### 文献捕获

**问：抓取器没有从某个页面提取到元数据，怎么办？**
答：请尝试以下步骤：
1. 确保页面完全加载后再点击"捕获当前页面"
2. 检查该平台是否在[支持列表](#支持的学术平台)中
3. 对于不支持的平台，扩展会回退到通用 meta 标签提取
4. 作为兜底方案，可以使用 AI 助手的"提取元数据"功能，粘贴文本即可

**问：能一次捕获多篇论文吗？**
答：目前不支持。捕获功能设计为从当前标签页一次捕获一篇论文。

### AI 智能助手

**问：应该选择哪个 AI 服务商？**
答：两者都很好用。DeepSeek 通常更便宜；OpenAI 有更多模型选择。根据你已有的账号和预算来选择即可。

**问：我的 API Key 存储安全吗？**
答：API Key 存储在 `chrome.storage.local` 中，只有扩展本身可以访问。除了你配置的 AI 服务商外，不会传输给任何第三方。

### 数据同步

**问：如果我在两台设备上编辑了同一条记录会怎样？**
答：同步引擎使用**实体级合并**和基于 `updatedAt` 的冲突解决策略。每个实体的最新更新版本胜出。这不是实时协作——它设计用于单用户多设备同步。

**问：能同时同步到多个云吗？**
答：可以。你可以同时配置 WebDAV 和 GitHub，并将不同类型的数据路由到不同的服务商（如数据库同步到 GitHub，证据文件同步到 WebDAV）。

**问：同步多久触发一次？**
答：每次保存时自动触发同步，防抖延迟 1 秒。你也可以在设置页面手动触发同步。

---

## 隐私与安全

### 数据收集

**完全不收集。** ResearchFlow Companion 不会收集、传输或分析你的任何数据。所有数据都保留在你的设备上。

### 权限说明

| 权限 | 用途 |
|-----|------|
| `storage` | 本地存储研究数据 |
| `activeTab` | 访问当前标签页以提取元数据 |
| `tabs` | 检测标签页 URL，用于 DOI 提取和页面类型识别 |
| `scripting` | 注入内容脚本以抓取元数据 |
| `sidePanel` | 显示侧边栏工作区 |
| `unlimitedStorage` | 存储大型研究数据库，不受配额限制 |
| `contextMenus` | 添加右键"记录选中内容"菜单项 |

### 主机权限

| 主机 | 用途 |
|-----|------|
| `api.github.com` | GitHub 同步 |
| `api.openai.com` | OpenAI AI 助手 |
| `api.deepseek.com` | DeepSeek AI 助手 |
| `api.unpaywall.org` | 开放获取 PDF 查询 |

`optional_host_permissions`（`http://*/*`、`https://*/*`）仅在需要注入内容脚本进行抓取时才会请求。默认情况下不会激活。

---

## 已知限制

1. **仅限 Chrome**：需要 Chrome 116+ 或基于 Chromium 的浏览器。不支持 Firefox/Safari。
2. **无实时协作**：同步是单用户多设备模式，不支持多人同时编辑。
3. **无二进制文件存储**：证据文件以链接形式存储，不会上传到扩展中。你需要将实际文件存储在云盘中。
4. **API Key 存储**：API Key 存储在 `chrome.storage.local` 中，没有额外加密。这是浏览器扩展的标准做法，但意味着任何能物理访问你浏览器的人都可以读取它们。
5. **单体控制台**：主控制台控制器（`options.js`）有 5,257 行——一个文件处理所有视图。这是一个已知的架构限制。
6. **无离线 AI**：AI 功能需要网络连接才能访问 API 端点。

---

## 参与贡献

欢迎参与贡献！以下是开发指南：

### 开发环境搭建

1. 克隆仓库：
   ```bash
   git clone https://github.com/YOUR_USERNAME/ResearchFlow-Extension.git
   ```

2. 在 Chrome 中加载扩展（参见[安装教程](#安装教程逐步说明)）

3. 修改源代码

4. 重新加载扩展：
   - 进入 `chrome://extensions/`
   - 点击 ResearchFlow Companion 卡片上的刷新图标（🔄）

5. 测试你的修改

### 代码规范

- **无构建工具**：编写原生 JavaScript（ES6+）。不使用 TypeScript，不使用打包工具。
- **无依赖**：不要添加 npm 包。所有代码应自包含。
- **Chrome MV3 API**：使用 `chrome.*` API，不要使用已废弃的 `browser.*` API。
- **CSS 自定义属性**：使用 `theme.css` 中已有的设计系统变量。
- **命名规范**：JavaScript 使用 camelCase，CSS 类名使用 kebab-case。

### 问题反馈

如果你发现了 bug 或有功能建议：

1. 先在 GitHub Issues 中检查是否已存在相同问题
2. 如果没有，创建一个新 issue，包含：
   - 清晰的标题和描述
   - 重现步骤（针对 bug）
   - 期望行为与实际行为
   - 相关截图（如有）
   - 你的 Chrome 版本和操作系统

---

## 许可证

本项目基于 **MIT 许可证** 开源。

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

## 致谢

- **Chrome 扩展团队** 提供的 Manifest V3 平台和 Side Panel API
- **Unpaywall** 提供的开放获取 PDF 查询 API
- **OpenAI** 和 **DeepSeek** 提供的 AI 语言模型 API
- **学术出版商** 在网页中提供结构化元数据
- 研究社区的反馈和功能建议

---

<div align="center">

**为研究者而生，由研究者打造。**

[报告 Bug](https://github.com/YOUR_USERNAME/ResearchFlow-Extension/issues) · [功能建议](https://github.com/YOUR_USERNAME/ResearchFlow-Extension/issues) · [文档](https://github.com/YOUR_USERNAME/ResearchFlow-Extension/wiki)

</div>
