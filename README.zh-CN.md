# ResearchFlow

ResearchFlow 是一个面向 Chrome 的科研工作流扩展，用于管理手稿流水线、期刊投稿、审稿回复和私有同步。

## 核心能力

- 在仪表盘查看手稿流水线和关键事件时间线。
- 通过看板管理手稿状态。
- 跟踪投稿、期刊入口、合规清单和审稿回复矩阵。
- 将科研工作流保存在本地优先数据库中。
- 导出 JSON；可选地通过 WebDAV 或 GitHub 同步自己的私有数据库。

主工作区包含 **仪表盘总览、手稿看板、投稿与审稿、多云设置**。点击工具栏图标会直接打开完整工作区；弹出面板和侧边栏已经移除。

## 有意移出的范围

ResearchFlow 不再包含“领域与项目树”、“研究记录”主面板、Evidence Locker 或泛化 AI 助手。

活跃运行时会规范化项目、研究记录、手稿、投稿和任务。数据库 schema 5 会从旧数据库中清除 Evidence Locker 字段、AI 凭据及证据文件路由。

## 开发安装

1. 在 Chrome 打开 `chrome://extensions`。
2. 启用“开发者模式”。
3. 选择“加载已解压的扩展程序”，并选择本仓库目录。
4. 固定 ResearchFlow 图标并点击它，直接打开完整主程序。

需要 Chrome 116 或更高版本。扩展不需要构建步骤或第三方运行时依赖。

## 验证

```powershell
Get-ChildItem tests -Filter *.test.js | Sort-Object Name | ForEach-Object { node $_.FullName }
Get-ChildItem scripts -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
```

## 隐私

研究数据默认存储在本地。WebDAV 和 GitHub 同步均为可选功能，仅使用你提供的配置。
