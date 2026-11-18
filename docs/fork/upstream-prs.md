# 上游 PR、Issue 与补丁跟踪

#60867 更新于 2026-11-06；自定义 provider 与本地模型条目更新于 2026-11-14（upstream/dev `f0089856c0`、V2 2.3.0）；其他条目的历史快照记录于 2026-10-31，日期均为 Asia/Shanghai。历史条目指向官方 [anomalyco/opencode](https://github.com/anomalyco/opencode)。

> 当前仓库关系以顶层 [AGENTS.md](../../AGENTS.md) 为准：`origin` 是本仓库 GitHub，`upstream` 是官方 GitHub；同步及官方贡献使用官方对应分支。

## 本轮修复与官方提交（2026-11-18）

已将官方 dev `d412042beb` 合入 `dev-my`（同步提交 `62a06611ed`），并推送 origin。`origin/dev` 仍与此次拉取的 `upstream/dev` 完全一致。

- [本仓库 PR #11](https://github.com/joe-ieta/OpenCode.My/pull/11) 已改为目标 `dev-my` 并合并（`ea49fb226f`），Issue #9 已关闭。Git 会话按自身目录迁移，保留其他 clone 的会话；相邻目录名不再触发重复迁移事件。最终修正提交为 `5690778cf6`。
- [本仓库 PR #12](https://github.com/joe-ieta/OpenCode.My/pull/12) 已改为目标 `dev-my` 并合并（`e5237b1f6f`），Issue #10 已关闭。选择的 clone 目录在添加、重载及新建会话时保持一致；清单恢复纳入 Home 状态机，并适配 fork 的共享项目控制器及 Side bar。
- 最终整合的根目录 `bun run check` 35/35 通过，App 单元测试 2776/2776 通过。Core 项目与会话创建测试 81/81 通过；双 clone 两个方向重复 10 次通过；Home 状态机重复测试 140/140；构建模式浏览器 clone 回归以 5 个 worker、零重试运行 10 次通过，dev-my 适配后两项 keeper 回归也通过。
- 两个独立官方分支均从官方 dev 建立，未包含 fork 品牌、发布工具或其他补丁；各自完整 lint/typecheck 35/35 通过。官方工作树检查使用了临时 Windows 路径归一化和符号链接声明的等价导入，之后均已撤回。独立 `typecheck:e2e` 仍报告未改动用例及 CSS/Vite ambient 类型问题，新增 Home 用例没有诊断；实际构建和浏览器测试通过。

| 官方问题 | 已验证的独立贡献分支 | 提交状态 |
| --- | --- | --- |
| [#64643](https://github.com/anomalyco/opencode/issues/64643) | [`origin-session-fix`](https://github.com/anomalyco/opencode/compare/dev...joe-ieta:OpenCode.My:origin-session-fix)，`65b39d7234`，4 个文件 | Issue 已提交；机器人按 [#57985](https://github.com/anomalyco/opencode/issues/57985) 的重复报告关闭。PR 尚未创建，准备同时关联这两个记录。 |
| [#64644](https://github.com/anomalyco/opencode/issues/64644) | [`clone-selection-fix`](https://github.com/anomalyco/opencode/compare/dev...joe-ieta:OpenCode.My:clone-selection-fix)，`ba69969b54`，10 个文件 | Issue 已提交且开放；PR 尚未创建。浏览器截图保存在独立 `clone-review-proof` 证据分支，不在贡献补丁中。 |

GitHub 拒绝创建两个官方 PR：CLI GraphQL 返回 `joe-ieta does not have the correct permissions to execute CreatePullRequest`，REST 返回 404，连接器返回 integration 403。当前账号仍有 [#62845](https://github.com/anomalyco/opencode/pull/62845)、[#62850](https://github.com/anomalyco/opencode/pull/62850)、[#62851](https://github.com/anomalyco/opencode/pull/62851) 三个开放 PR，与下文记录的历史名额限制一致。已请求用户指定是否关闭其中两个，尚未关闭或更改这些旧 PR。完整提交说明保存在本机 `.cache/upstream-origin-pr.md` 和 `.cache/upstream-clone-pr.md`，待名额/权限解除后提交。

## 初次复核记录（2026-11-18，修正前）

已拉取官方 `upstream/dev` 至 [`d412042beb`](https://github.com/anomalyco/opencode/commit/d412042beb9821ed61c73466406f7dbfdadc04e0)（北京时间 2026-11-18 18:11），比两个 PR 原基线 `a9a35b4b4c` 新增 74 个提交。`origin/dev` 没有独有提交，已快进并核验与该上游提交完全一致。本次未合并三个维护分支，也未更新两个 PR 的来源分支。

| 本仓库 Issue / PR | 最新上游结论 | 补丁对照验证 |
| --- | --- | --- |
| [Issue #9](https://github.com/joe-ieta/OpenCode.My/issues/9) / [PR #11](https://github.com/joe-ieta/OpenCode.My/pull/11) | **仍存在**。origin 改名后 ID 改变，未写入 `.git/opencode`；已有 worktree 行仍阻止再次发布用于收养会话的事件。 | PR head `7b31a6fa0c` 可无冲突应用到最新上游。项目测试 29 项通过，原有相关会话测试 5 项通过；但新增双 clone 隔离用例失败，**不能据此认定补丁可直接合并**。 |
| [Issue #10](https://github.com/joe-ieta/OpenCode.My/issues/10) / [PR #12](https://github.com/joe-ieta/OpenCode.My/pull/12) | **仍存在**。Home 仍以共享项目的 canonical worktree 处理新增结果，恢复非 canonical clone 时会清空选择。 | PR head `2ac79bfad1` 可无冲突应用到最新上游；Home、workspaces、titlebar 相关测试 **454 项通过**，包含 PR 的 clone 选择回归用例。 |

复核使用最新上游的独立工作树及 Bun 1.4.4。先仅移入 PR 的回归测试：Core 的缓存写入、无 marker 的 origin 改名、已有新 worktree 行三项均失败；Home 状态机 12 项通过、clone 回归项失败。再应用生产补丁作对照。当前 `dev-my@afa7429af7` 的 `project.ts`、`session/projector.ts`、`home/machine.ts` 与最新上游相同，因此不能依据 Issue 中历史 downstream 修复评论认定当前维护线已解决问题。

PR #11 的新增失败场景：两个 clone 共享旧项目 ID，A 是 canonical 目录；只改 A 的 origin 后，B 的会话也被改成新项目 ID。该用例在纯上游通过，在补丁上失败。原因是补丁把 Git 历史项目 ID 放入 `Worktree.Event.Resolved.adopted`，而现有 Session projector 对 `adopted` 按整个旧项目选择会话，并以旧项目的 canonical 目录判断归属；这一语义原用于 markerless 项目的收养，不保证 Git clone 的目录隔离。后续应先修正该边界，再评估合并。

Core 与 App 的 `bun typecheck` 均通过；App 在隔离工作树使用与原符号链接等价的临时导入。候选的根目录 `bun run check` 停在未改动的 `script/check-greys.ts`：Windows 反斜杠路径未匹配例外规则，报 172 项。同步镜像时现有 `dev-my` 的 pre-push 完整检查通过（35 个任务）；该结果不替代最新上游候选的全量检查。本次未运行桌面 UI / Playwright 端到端测试。

两个 PR 目前都指向本仓库 `dev`。按现行分支约束，`dev` 只能镜像官方代码，不能直接合入这些 fork 修复；维护线修复应适配 `dev-my`（Core 按需同步到 `oc-headless`），正式官方贡献另以 `anomalyco/opencode:dev` 为目标。问题仍然存在，不应因本次同步而关闭 Issue。

## 当前 PR

| PR / 分支                                                                         | 核对状态                                                                                            | 本地与后续策略                                                                                                                                                              |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [#60496](https://github.com/anomalyco/opencode/pull/60496) · `model-release-date` | **MERGED**，2026-10-30；最终 head `88d92af959`；合并提交 `986221af346f8f71d0133f2c08130cedc17ab097` | fork Windows `v2.2.1-dev-my.2` 已有本地修复。已在 `v2.2.2-dev-my.1` 源码同步中吸收最终上游实现与测试；本地旧提交留在发行历史，不重复移植同一补丁                            |
| [#56929](https://github.com/anomalyco/opencode/pull/56929) · `upstream-migration` | **OPEN**，非 Draft；核对时可合并；期间曾关闭，当前已重新打开                                        | V1 迁移清理分批提交的可靠性修复；`dev-my`、`oc-headless` 按实际需求保留，继续跟进审核                                                                                       |
| [#60084](https://github.com/anomalyco/opencode/pull/60084) · `v2-upgrade-notice`  | **CLOSED / Draft**，未合并，2026-10-30                                                              | 单向 V1→V2 升级确认在本地发行保留；关闭不表示已上游化                                                                                                                       |
| [#60867](https://github.com/anomalyco/opencode/pull/60867) · `sidebar-mode` | **OPEN / Draft**，head `2de04af2cd`，目标 `dev` | 已解决 Inbox 首屏状态机冲突，GitHub 合并检测通过。Windows [v2.2.5-my.5](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.2.5-my.5) 提供测试安装包。 |
| [#60570](https://github.com/anomalyco/opencode/pull/60570) · `home-project-list`  | **OPEN**，非 Draft                                                                                  | 独立的 Home 全局项目清单提案；#60867 仅在 Side bar 模式扩展清单，比较范围和取舍，不声称两者都已被批准                                                                       |
| [#60446](https://github.com/anomalyco/opencode/pull/60446) · `sidetab-overview`   | **CLOSED**，未合并，2026-10-31                                                                      | 已由作者关闭并链接 #60867；保留原设计、截图和分支供历史参考，不再作为当前贡献稿                                                                                             |

`mergeable` 只是查询时的合并能力，不代表通过审核、CI 或已经获准合并。上游维护者修改过 #60496 的提交，最终 head 与本地初始 `8eb64b9416` 不同；本地发行修复是 `d28cf55b08`，不能仅凭提交哈希不同认定上游缺失。

## Issue 和设计提案

| 关联项                                                                                                | 用途与状态                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| [#49605](https://github.com/anomalyco/opencode/issues/49605)                                          | 自定义模型未知日期被转为 1970 年的原始报告；已由 #60496 关闭                                                                                |
| [#60479](https://github.com/anomalyco/opencode/issues/60479)                                          | 本次 Windows V2 复现报告；机器人识别重复，当前已关闭。提交时申请 bug 标签，账号无权添加仓库标签                                             |
| [#50726](https://github.com/anomalyco/opencode/issues/50726)                                          | 桌面端自定义模型缺失的相关现象，供根因关联                                                                                                  |
| [#60241](https://github.com/anomalyco/opencode/issues/60241)                                          | **OPEN**；已更新为独立 Side bar 提案，#60867 为设计评审材料，保持官方模式与初始默认值；已发布人工测试邀请                                   |
| [#33704 中的 V2 Proposal](https://github.com/anomalyco/opencode/issues/33704#issuecomment-6515528622) | **OPEN**；自定义提供商/模型配置界面：表单 CRUD、可选凭据、连接测试、全局/项目范围、导入并保留 JSONC。上游仍无实现；fork 已合入 `dev-my` 并在 [v2.3.0-my.3](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.3) Windows 测试版验证 |
| [#59603](https://github.com/anomalyco/opencode/issues/59603) | **OPEN**；2.2.0 移除桌面自定义 provider 入口；官方仍建议编辑 `opencode.json` |
| [#50650](https://github.com/anomalyco/opencode/issues/50650)、[#57325](https://github.com/anomalyco/opencode/issues/57325) | **OPEN**；旧桌面表单保存失败、不能设 limits/发现；旧表单已移除，问题未由上游解决 |
| [#57997](https://github.com/anomalyco/opencode/pull/57997) | **OPEN**；恢复自定义 OpenAI-compatible provider 保存。仅机器人验证，无维护者批准/合并 |
| [#57161](https://github.com/anomalyco/opencode/pull/57161) | 官方仍开放。fork 的 `dev-my` 已合入 `aa71865099`，由 `openai_compatible_discovery` 控制运行时目录补充。 |
| [#40524](https://github.com/anomalyco/opencode/issues/40524) | **OPEN**；V2 provider 目录与 `/models` 对账的主要跟踪 issue；无维护者结论 |
| [#51527](https://github.com/anomalyco/opencode/issues/51527) | **OPEN**；配置已存在时可通过 `ConfigProviderPlugin` 的 key method 设置 Key；任意 ID 预注册仍不支持 |
| [#62448](https://github.com/anomalyco/opencode/issues/62448)、[#61628](https://github.com/anomalyco/opencode/issues/61628) | **OPEN**；更广义的桌面 provider 管理、无需配置文件的产品需求 |
| [#63710](https://github.com/anomalyco/opencode/pull/63710)、[#62743](https://github.com/anomalyco/opencode/pull/62743)、[#58066](https://github.com/anomalyco/opencode/pull/58066) | **Draft/OPEN/OPEN**；provider 模型通配符、Unix socket、原地轮换 Key；均未合并 |

Side bar 的相关 V2 需求在 #60241 汇集，包括 #55446、#51759、#53851、#54922，以及 Inbox #59220、界面讨论 #60233。不要把“建议优先人工审核”或机器人转人工回复写成已经获得设计批准。

官方 2.3.0 已包含 #63266（保存 Key 用于本地发现）、#63700（15 秒超时与端点隔离）、#63200/#56214/#63198（LM Studio decision/null context）和 #62240（部分 limit 保留）。[#59520 的限额发现](https://github.com/anomalyco/opencode/pull/59520) 仅存历史记录，`dev-my` 已停止跟踪。

2026-11-14 已在 #33704 介绍 fork 的模型选择器入口与实现范围。[实现范围评论](https://github.com/anomalyco/opencode/issues/33704#issuecomment-6872183643)

已使用 OpenCode My `v2.3.0-my.5` 邀请试用与反馈。Side bar 的设计讨论位于 [#60241](https://github.com/anomalyco/opencode/issues/60241#issuecomment-6881398672)，实现评估邀请补充在已关闭且未合并的 [#60867](https://github.com/anomalyco/opencode/pull/60867#issuecomment-6881399042)。自定义模型的试用邀请位于 [#33704](https://github.com/anomalyco/opencode/issues/33704#issuecomment-6881397952) 和仍开放的 [#57997](https://github.com/anomalyco/opencode/pull/57997#issuecomment-6881398293)。

本次重新检索的 Issue/PR、设计边界与人工测试入口见 [Side bar 独立模式记录](dev-my/sidebar-mode.md)。其中 #60581 为新增相关需求，#59220 仍在评审，#57896/#57895 关闭且未合并；不要将关联或关闭当成实现获批。

## 历史关闭的贡献

| PR                                                                                | 状态               | 补丁去留                                                                       |
| --------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------ |
| [#54467](https://github.com/anomalyco/opencode/pull/54467) Layer 依赖校验（V2）   | CLOSED，2026-10-30 | 关闭不表示已上游化；按实现和测试核对，保留仍需要的本地诊断                     |
| [#54131](https://github.com/anomalyco/opencode/pull/54131) 自动压缩恢复误报（V1） | CLOSED             | V1 本地修复保留；V2 按自身语义验证，不机械移植                                 |
| [#49684](https://github.com/anomalyco/opencode/pull/49684) Layer 依赖校验（V1）   | CLOSED             | V1/V2 包路径和依赖不同，按分支维护                                             |
| [#49683](https://github.com/anomalyco/opencode/pull/49683) 文件搜索循环依赖       | CLOSED             | V1 历史记录确认由上游 #50439 解决，原重复补丁已移除；与 Layer 诊断补丁分开判断 |

详细根因和 V1 交互历史见 [V1 上游记录](qt-headless/KB/upstream.md)与 [问题历史](qt-headless/KB/history.md)。这些归档中的 OPEN、BLOCKED 等旧状态不覆盖本页核对结果。

## 合并与提交原则

1. **发行线保留补丁**：未合并、关闭、Draft、等待审核都不是删除本地有效修复的理由。先建立“本地提交 → 上游 PR/实现 → 回归测试”的对应关系。
2. **已合并去重**：官方可能 squash、改名或重写测试。先 merge 对应上游，再比较语义和回归结果；只清理等价且重复的本地差异，不重置发行线。
3. **贡献分支保持纯净**：V2 从最新 `upstream/dev` 建短名称小分支，目标官方 `dev`；不从带品牌、打包和其他补丁的整个 `dev-my` 提 PR。迁移、Side tabs、模型修复分别提交。
4. **产品设计先审核**：新界面/产品功能按当前 CONTRIBUTING 提 Issue 等设计批准；Bug 修复关联原始 Issue。PR 简洁填写模板，说明验证方法；用户可见变更附规定的动画 SVG。
5. **Draft 转 Ready 前复验**：更新最新官方 dev，解决冲突，跑受影响测试、类型检查与必要 UI 场景。特别是 Side tabs，不把旧基线的全绿记录冒充新基线验证。
6. **名额与权限**：此前账号有 3 个未关闭上游 PR 时，创建新 PR 返回权限错误/REST 404，关闭指定旧 PR 后可创建。遇到同样情况先查状态和权限；关闭其他 PR 必须获得明确授权，不能自动处理。

手动刷新命令见 [维护方法](maintenance.md)。未创建定时监控；需要周期执行时另行配置。
