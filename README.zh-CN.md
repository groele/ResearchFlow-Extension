# ResearchFlow

ResearchFlow 是一个面向 Chrome 的科研工作流扩展，用于管理手稿流水线、期刊投稿、审稿回复和私有同步。

## 核心能力

- 在仪表盘查看手稿流水线和关键事件时间线。
- 通过看板管理手稿状态。
- 跟踪投稿、期刊入口、合规清单和审稿回复矩阵。
- 在投稿记录器中维护第一作者，并直接显示在仪表盘投稿流水线条目中。
- 编辑投稿信息、日期、清单和审稿回复时自动保存，无需单独点击保存。
- 自动识别支持的期刊投稿网站，一键捕获稿件与流程字段并给出置信度；经人工逐项核对确认后，再创建相互关联的项目、稿件和投稿记录。
- 将科研工作流保存在本地优先数据库中。
- 所有界面写入由后台串行处理，降低自动保存与其他操作并发时相互覆盖的风险。
- 使用 Blob 导出 JSON；导入前校验文件大小与结构，并自动保留一个可一键恢复的“导入前备份”。
- 可选地通过 WebDAV 或 GitHub 同步自己的私有数据库。

主工作区包含 **仪表盘总览、手稿看板、投稿与审稿、多云设置**。点击工具栏图标会直接打开完整工作区；弹出面板和侧边栏已经移除。

## 有意移出的范围

ResearchFlow 不再包含“领域与项目树”、“研究记录”主面板、Evidence Locker 或泛化 AI 助手。

活跃运行时会规范化项目、研究记录、手稿、投稿和任务。数据库 schema 7 会从旧数据库中清除 Evidence Locker 字段、AI 凭据及证据文件路由，并通过删除墓碑避免远程旧数据重新恢复已删除条目。

## 开发安装

1. 在 Chrome 打开 `chrome://extensions`。
2. 启用“开发者模式”。
3. 选择“加载已解压的扩展程序”，并选择本仓库目录。
4. 固定 ResearchFlow 图标并点击它，直接打开完整主程序。

需要 Chrome 116 或更高版本。扩展不需要构建步骤或第三方运行时依赖。

投稿网站识别目前覆盖 ScholarOne Manuscripts、Editorial Manager、eJournalPress、ACS Paragon Plus、Wiley Submission、Springer Nature Submissions、AIP Peer X-Press、MDPI SuSy、Frontiers Review、APS Authors 和 Science Journals Submission。识别器会综合域名、页面标题、元数据、表单字段标签和流程状态判断，可捕获稿件题目、期刊、稿件编号、投稿状态、日期、第一作者、作者列表、摘要和关键词；密码、邮箱与上传文件不会被采集。“自动识别投稿网站”和“自动捕获投稿信息”可在“多云设置”中分别控制。

## 验证

```powershell
Get-ChildItem tests -Filter *.test.js | Sort-Object Name | ForEach-Object { node $_.FullName }
Get-ChildItem scripts -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
```

## 隐私

研究数据默认存储在本地。WebDAV 和 GitHub 同步均为可选功能，仅使用你提供的配置。
