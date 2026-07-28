# ResearchFlow

ResearchFlow 是一个面向 Chrome 的研究资料库扩展，聚焦于一条清晰的研究链路：采集论文或观察记录，关联到项目，并明确下一步行动。

## 核心能力

- 通过侧边栏、弹出面板或右键菜单采集学术页面元数据。
- 以明确的研究项目组织文献、实验、分析和笔记。
- 将采集的文献和笔记保存在本地优先数据库中。
- 维护项目范围内的工作笔记和下一步任务。
- 导出 JSON；可选地通过 WebDAV 或 GitHub 同步自己的私有数据库。

主工作区仅保留 **概览** 和 **设置**。项目关联、记录采集、工作笔记及下一步任务仍可通过弹出面板和侧边栏使用；原“领域与项目树”和“研究记录”主面板已经移除。模块边界、数据兼容性和迁移说明请见 [ARCHITECTURE.md](ARCHITECTURE.md)。

## 有意移出的范围

ResearchFlow 不再加载“领域与项目树”和“研究记录”主面板、稿件看板、投稿时间线、审稿回复编辑器、期刊门户或泛化 AI 助手。这些功能增加了权限、维护负担和使用复杂度，也偏离了聚焦的采集工作流。

活跃运行时继续规范化并使用项目、研究记录和任务。打开旧数据库时，已退役的 `evidence` 字段会被移除，不再同步或导出。

## 开发安装

1. 在 Chrome 打开 `chrome://extensions`。
2. 启用“开发者模式”。
3. 选择“加载已解压的扩展程序”，并选择本仓库目录。
4. 固定 ResearchFlow 图标。点击工具栏图标会直接打开完整主程序；侧边栏仅作为可选采集入口保留。

需要 Chrome 116 或更高版本。扩展不需要构建步骤或第三方运行时依赖。

## 验证

```powershell
Get-ChildItem tests -Filter *.test.js | Sort-Object Name | ForEach-Object { node $_.FullName }
Get-ChildItem scripts -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
```

## 隐私

研究数据默认存储在本地。WebDAV 和 GitHub 同步均为可选功能，仅使用你提供的配置。学术页面采集仅提取创建研究记录所需的元数据；只有在显式请求开放获取 PDF 查询时，才会使用 Unpaywall 兜底服务。
