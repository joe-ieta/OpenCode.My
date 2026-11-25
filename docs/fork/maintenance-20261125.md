# 2026-11-25 同步及本机 headless 发布

## dev-my

从 `origin/dev-my@d966c52769` 同步，合并官方 `dev@b5dba31bf20d758d86871af65d206a197d411a0c`（内核 2.4.1）。保留 Side bar、项目管理、自定义 Provider 以及现有发行命名。导航设置采用上游共享预览，保留第四种 Side bar 模式；删除重复的 pin 图标定义；保留产品名称和 app ID 覆盖，同时采用上游独立的本地 Windows 通知身份。公开协议合并后从 `packages/client` 重新生成客户端。

验证：根目录 `bun run check` 36/36；App 官方 TypeScript 检查；14 项 Side bar/Inbox/分支回归；11 项桌面身份测试；7 项 Chromium 冒烟（四种界面模式、Side bar 会话索引、clone 目录恢复及会话位置导航）均通过。没有发布桌面新版，现有 Latest 保持不变。

## 本机 Windows x64 发行

用户明确选择本机发布。两条分支分别从同名 origin 分支快进，V2 合并官方 dev，V1 确认最新官方 v1 已包含；没有推送 headless 分支或标签，也未创建远端 Release。

| 产物 | 内核 | 构建源提交 | 上游 | 字节数 | SHA256 |
| --- | --- | --- | --- | ---: | --- |
| `artifacts/oc/oc_core-2.4.1-windows-x64.exe` | 2.4.1 | `b64c41e645fe8e76a7cd8b0556ca7292d99f4bff` | `dev@b5dba31bf2` | 251430400 | `4d40e653033d823bd654be3def3a38f21fa66cbb5af6e9831800055a80b7102e` |
| `artifacts/qtoc/qtoc_core-1.19.6-windows-x64.exe` | 1.19.6 | `926fe2fd73450039c9188d9061de7ef2aa582a35` | `v1@c618499abc` | 164845056 | `348c9258b96d7335c874ba30e22540ecbb19c4b1c179187b7320e63ba1d7d43a` |

各目录提供稳定名称、版本名称、SHA256 侧车和 `build.json`；旧版本文件及原构建记录已保留。V2 完整检查 37/37、客户端生成和 14 项稳定 API 契约通过，新增 34 条上游路径仅作信息记录，不修改契约基线。V1 类型检查 18/18 及 lint 通过。

冒烟仅启动新构建的测试进程，使用隔离配置、数据库、随机凭据和独立端口：V2 info 200/版本一致、无凭据 401、SSE `server.connected`、stderr 空；V1 health 200/版本一致、无凭据 401、14 个工具中包含 question、SSE 连接事件、stderr 空均通过。主目录副本逐一核对 SHA256，不影响当前桌面或后台服务。

官方贡献维护见 [PR 跟踪](upstream-prs.md)。

#65049 本轮补齐的 13 个 App 和 6 个 UI 简繁中文键已同步回 `dev-my`，包括模型速度、任务栏通知、Inbox 草稿和侧栏位置。仅更新字典，未改变 Side bar 行为。
