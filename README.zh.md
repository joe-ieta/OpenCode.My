# OpenCode My

[English](README.md) · **简体中文**

OpenCode My 是在 `dev-my` 上维护的桌面版，新增独立 Side bar，在模型选择器中提供自定义模型配置。

## Side bar

在 **设置 → 常规 → 界面布局** 中选择 **侧栏（Side bar）**。可置顶或收起项目，按项目浏览最近会话，并从项目行新建会话。**运行中会话**汇总已连接服务器上的执行活动，包括后台 Shell 和子智能体，并在有数据时显示分支和运行时长。

<img src="docs/fork/dev-my/side-bar-zh.png" alt="侧栏中的项目分组、最近会话和运行中任务" width="330">

## 自定义模型

打开模型选择器，点 **自定义 Provider** 添加或编辑全局 OpenAI 兼容 Provider。填写服务地址，可选的 API Key 会存入凭据存储。模型可以主动发现并导入，也可以手动添加。配置模型显示名称、请求模型 ID 和上下文限额后，点 **测试文本响应** 验证模型能否返回文本。**管理模型**可调整模型选择器的显示列表。

<img src="docs/fork/dev-my/custom-models-zh.png" alt="自定义 Provider 表单，显示请求模型 ID、模型名称、上下文限额和文本测试" width="690">

_截图使用示例数据。_

[下载 OpenCode My](https://github.com/joe-ieta/opencode/releases) · [桌面维护说明](docs/fork/dev-my/README.md) · [官方 OpenCode README](https://github.com/anomalyco/opencode#readme)
