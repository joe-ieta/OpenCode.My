# 2026-11-26 V2 同步与会话隔离 PR 维护

## 同步范围

- 本轮官方基线：`dev@5e000543a6b25da9e239bbfc39a74ababab58b50`，内核 2.4.1。
- `dev-my` 从 `origin/dev-my@137e3863b3` 合并，保留 Side bar、Session Go、现有发布命名和其他 fork 补丁。解决 Project、会话创建测试及 LayerNode 冲突；依赖类型采用上游 `GraphError`，保留本地无效依赖诊断。
- `oc-headless` 保留本机维护历史并合并同一上游基线。源码、构建记录和二进制继续仅在本机保存。
- `origin/dev` 原为 `63261c1c5d`，没有上游以外的独有提交，可快进镜像至本轮基线；镜像不包含 fork 合并提交。
- `qt-headless` 与历史分支、工作树保持原状。

## #64850 冲突处理

官方 [#64850](https://github.com/anomalyco/opencode/pull/64850) 的本轮提交为 `89572c11a3661f4584fc1858d1f1889aa89a1522`，保留四个 Core 源码及测试文件的贡献范围。

Project 同时声明上游新增的 CrossSpawnSpawner 依赖和原有 KV 依赖；保留 Environment 的本机/远程持久化边界。checkout 的根提交与 KV 身份校验、其他 clone 的会话隔离、复用目录的保护和无变化 checkout 的快速路径继续保留，不写 `.git/opencode`。创建会话的回归测试显式提供 KV 和 SessionInbox。保留移除 origin 后回到根提交身份的专属回归，接受上游对无关冗余测试的删除。

Linux 验证直接获取公开上游与 PR 引用并应用同样的冲突处理；Git tree `e4272b00e7faa0b7467ad91dcce475e9350440bd` 与本地提交完全相同。PR 说明更新验证记录，不发送测试邀请。

## 验证结果

| 验证 | 结果 |
| --- | --- |
| `dev-my` 根 `bun run check` | 36/36 |
| `oc-headless` 根 `bun run check` | 37/37 |
| 官方 PR 根 `bun run check` | 36/36 |
| App 官方 TypeScript 检查 | 通过 |
| PR Core 官方 TypeScript 检查 | Windows、Linux 均通过 |
| Linux 项目、会话创建、投影、重放、worktree、VCS、snapshot、Environment 回归 | 258 通过，1 跳过，0 失败，共 8 个文件 |
| 同组 Windows 回归 | 247 通过，11 跳过；1 个 PowerShell 初始化失败，见下文 |
| LayerNode 与 Environment 回归 | 51 通过，11 跳过，0 失败 |
| GUI 主题默认值、解析与对比度回归 | 70 通过 |
| 正式构建 Chromium Side bar / Home / Inbox 冒烟 | 26/26 |
| V2 headless 稳定 API 契约 | 14 项通过，不更新基线 |
| 客户端生成 | 三个 V2 工作区均执行，无额外生成差异 |

Windows Shell 集成用例遇到系统 PowerShell 初始化错误 `8009001d`，在上游 Core 基线同样复现；没有为此改变生产 Shell 行为或测试断言。完整迁移回归使用相同 Git tree 在 Linux 通过。PR 的 Windows 检查临时展开声明符号链接并规范化灰度脚本路径分隔符，提交前恢复，不进入贡献。

开发服务器首轮浏览器用例出现依赖预扫描错误，3 项未通过；正式构建静态服务上的同一组 26 项全部通过，E2E 源码没有修改。额外运行的全套 `typecheck:e2e` 仍报告夹具中的旧 provider default、compaction 字段及 CSS/Vite 声明诊断；该附加检查不等同于上表的标准根检查与正式构建运行结果。

## 本机 Windows x64 headless

构建源提交：`8054fd9075d46998f37d99ac7528a2fb01e21801`。产物 `artifacts/oc/oc_core-2.4.1-windows-x64.exe`（251,791,360 B），SHA256：`88f453106182d8af32b9d052efd26d35b888e368190682c258ed4ed1821aa7df`。

稳定名称、版本名称、两份 SHA256 侧车及 `build.json` 已更新。旧构建保留在 `artifacts/oc/history/3fda511575/`。新构建使用隔离配置、数据库、随机凭据和独立端口验证：版本与 info HTTP 200 一致、无凭据 HTTP 401、SSE `server.connected`、stderr 空均通过。未创建远端 Release 或标签，未改变 Latest，未操作正在使用的桌面或后台服务。
