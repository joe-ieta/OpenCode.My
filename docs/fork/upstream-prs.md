# 上游 PR、Issue 与补丁跟踪

#60867 更新于 2026-11-06；自定义 provider 与本地模型条目更新于 2026-11-14（upstream/dev `f0089856c0`、V2 2.3.0）；其他条目的历史快照记录于 2026-10-31，日期均为 Asia/Shanghai。历史条目指向官方 [anomalyco/opencode](https://github.com/anomalyco/opencode)。

> 当前仓库关系以顶层 [AGENTS.md](../../AGENTS.md) 为准：`origin` 是本仓库 GitHub，`upstream` 是官方 GitHub；同步及官方贡献使用官方对应分支。

## 官方 PR 维护（2026-11-25）

- 当前三个开放贡献为 [#62851](https://github.com/anomalyco/opencode/pull/62851)（运行中会话组件）、[#64850](https://github.com/anomalyco/opencode/pull/64850)（checkout 会话归属修复）、[#65049](https://github.com/anomalyco/opencode/pull/65049)（简繁中文翻译）。本轮检查时全部审查讨论均已解决，无新增待处理意见。
- 三条贡献线同步官方 `dev@b5dba31bf20d758d86871af65d206a197d411a0c`，保持各自范围。#62851 的 Inbox 冲突保留上游置顶、最近及草稿行为，同时保留共享分支加载器和耗时显示；另两条线自动合并。未关闭 PR、未发送测试邀请。
- #62851 的 App 官方 TypeScript 检查、15 项 App 回归、49 项 Client 数据测试及 2 项 Chromium 真实组件测试通过；#65049 的 App 官方 TypeScript 检查及 31 项简繁字典检查通过。完整检查与 #64850 会话归属回归结果见各 PR 当前验证段落。
- 当前上游 Actions 为 `action_required`，需要官方维护者批准运行；此状态不代表 CI 已通过。提交同步后继续核对冲突、审查和检查状态，不越过上游合并保护。
- Windows 检查临时展开声明符号链接并规范化灰度检查脚本的路径分隔符；平台处理不进入官方贡献。

## 中文翻译 PR 审核修正（2026-11-20）

- 官方 [#65049](https://github.com/anomalyco/opencode/pull/65049) 已推送审核修正 `c054c39f75`，来源为 `origin/chinese-translations`，目标仍为官方 `dev`。本轮只修改两份 App 中文词典，整个 PR 仍限于四份中文词典。
- 补齐审查指出的五个 ChatGPT 工作区用量提示和两个共享侧边面板词条，并补充完整审计发现的相机权限说明；繁体断开 Provider 的两处“供應商”统一为既有的“提供者”。原 PR 每种中文新增 95 个 App 词条和 2 个共享 UI 词条。
- 在独立 Linux 工作区按冻结锁文件安装依赖，完整检查 35/35、现有语言测试 31/31、App/UI 正式 TypeScript 检查通过。两种中文的 App 1,488 个词条及 UI 383 个词条无缺失、重复键、未知键和占位符差异；格式检查通过。正常 pre-push 检查保留并通过。
- 隔离 Chromium 的三组截图检查通过，覆盖简体修改前后及繁体修改后的时间线与扩展设置。六张截图和来源说明发布在独立 `origin/chinese-review-proof@b15817d797`，已核对远端 Git 对象摘要，并在 PR 说明中引用[不可变审核证据](https://github.com/joe-ieta/OpenCode.My/blob/b15817d797ba6969d550795daadb2c9e8708c693/docs/review/65049/README.md)，未混入官方翻译补丁。
- PR 说明已更新，术语审查线程已解决。规范和合规检查成功；正式 `check`、`check-test`、`check-nix`、`check-bot-scope` 为 `action_required`，需要上游维护者批准运行。PR 仍为 OPEN / MERGEABLE / BLOCKED，尚未合并。
- 同日按用户要求将本轮修正回迁到 `dev-my`：`c054c39f75` → `12f8d12a71`。逐项审计确认已有 Side bar 和其他 fork 词条完整保留；根检查 35/35、语言与 Side bar 单测 63/63、正式构建 Chromium 冒烟 15/15。回迁与此前已验证的上游同步历史一并推送到 `origin/dev-my`。

## 审核修正回迁 dev-my（2026-11-19）

以已同步的 `origin/dev-my` 为基线，将 [#62845](https://github.com/anomalyco/opencode/pull/62845) 的 `b696d7a81d` 和 [#64850](https://github.com/anomalyco/opencode/pull/64850) 的 `9bc70a296a` 分别回迁为 `81a443130d`、`fd937fda36`，提交说明保留原始提交引用。Core 源码与对应回归测试和官方贡献分支完全一致。

- 保留独立 Side bar：单服务器按钮、多服务器菜单显式传入既有项目添加动作，并使用重新配对后的连接；Home 继续使用自己的添加队列。
- 冒烟发现此前同步丢失的侧栏“新建会话”行为：在 Home 选择项目后切到另一会话，会错误使用当前会话的项目。恢复 `947eade9ed` 中的专用回调，沿用 Home 选择；原有 keeper 用例在修复前失败。
- 保留 fork 的项目显示名处理；未修改官方 PR、其他维护分支或 `origin/sidebar-mode`。

本轮验证：根目录 `bun run check` 35/35、Core 项目/会话创建/工作树/会话投影/重放回归 167/167、App 单测 2788/2788 通过。生产构建成功；恢复侧栏专用入口后，Chromium 构建模式冒烟 10/10 通过（2 workers、零重试），覆盖 Home/Side bar 共享索引、单/多服务器项目添加、草稿与运行中会话保留、项目菜单、新会话目标、列表模式、clone 目录恢复及服务器重新配对。

## 最新审核修正与 CI 跟进（2026-11-19）

再次核对官方 PR 的评论、逐行线程、当前 head 和 Actions workflow 状态；最新官方 dev 仍为 `d33b578333`。本轮处理新增审核意见，未通过空提交重跑无变化的分支。

| 官方 PR                                                    | 当前 head    | 审核处理与验证                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [#62845](https://github.com/anomalyco/opencode/pull/62845) | `b696d7a81d` | `choose` 强制接收 `onSelect`，移除绕过 Home 项目添加队列的直接添加备用路径。完整检查 35/35、App 单测 2773/2773、生产构建及相关 Chromium 回归 4/4 通过。审核机器人已[复核确认无进一步意见](https://github.com/anomalyco/opencode/pull/62845#pullrequestreview-5974039965)，新线程已回复并解决。 |
| [#62851](https://github.com/anomalyco/opencode/pull/62851) | `6af6f58b7b` | 无新增修改要求，现有线程全部解决；保持已验证的相同提交，沿用此前完整检查、App/Client 单测及 Running 组件回归结果，没有重复改动或测试。                                                                                                                                                         |
| [#64850](https://github.com/anomalyco/opencode/pull/64850) | `9bc70a296a` | 三项新增意见均已修正并逐条回复：取消写入 `.git/opencode`，身份未变时跳过迁移扫描，采用 Git 根提交及应用数据库 checkout 记录核验迁移来源。完整检查 35/35、Core 五个相关测试文件 167/167、九个关键场景各重复十次 90/90 通过；五个针对性回归在前一版实现上均失败。                                |

#64850 的 checkout 身份保存在既有 KV 表，未增加数据库迁移或修改 HTTP/event schema。旧 root-derived ID 可以直接按 Git 根提交确认；只有历史 remote-derived ID、没有可匹配 checkout 记录时不再仅凭路径自动迁移。两个目录复用场景（有/无身份记录）保留无关旧仓库的会话；服务重建后仍可恢复同一 checkout 的 origin 变化。重复解析的测试观察实际 SQL 与 Git 进程，确认不再进行会话/markerless 候选扫描。三个 PR 仍保持各自范围，所有临时 Windows 验证兼容改动均已撤回。

三者均为 OPEN / MERGEABLE / BLOCKED，规范与合规检查成功。正式 `check`、`check-test`、`check-nix`、`check-bot-scope` 仍为 `action_required`，不是已执行失败：[#62845 check-test](https://github.com/anomalyco/opencode/actions/runs/44512936100)、[#62851 check-test](https://github.com/anomalyco/opencode/actions/runs/44490488735)、[#64850 check-test](https://github.com/anomalyco/opencode/actions/runs/44514957555)。已在 [#62845](https://github.com/anomalyco/opencode/pull/62845#issuecomment-7007813813) 和 [#64850](https://github.com/anomalyco/opencode/pull/64850#issuecomment-7007821297) 提交最新验证与批准 CI/人工审核请求；#62851 沿用仍待处理的请求。

当前账号只有官方仓库读取权限，无 push/maintain/admin 权限。为 #64850 正式请求审核者时，GitHub 返回 `RequestReviewsByLogin` 权限不足，已改为在 PR 留言请求维护者处理。#62845 和 #62851 原有 Hona、Brendonovich 审核请求仍保留。尚未合并任何官方 PR；还需要官方维护者批准正式 CI 并完成人工审核。

## clone 会话迁移修复已提交官方 PR（2026-11-19，首次提交快照）

按用户优先级使用释放的一个名额，已创建 [#64850](https://github.com/anomalyco/opencode/pull/64850) `fix(core): preserve checkout sessions across origin changes`，目标为官方 `dev`。`origin-session-fix` 已无冲突合入最新官方 dev `d33b5783338b8b350aafc09f7dc2701eeba52a9a`，提交并推送 `883203cadc7cbb83f64e05c365b775a6964b0650`。PR 相对官方基线仅有 4 个 Core 源码/测试文件，216 行新增、9 行删除；`origin/dev` 同样保持该官方提交。

- GitHub 已确认 `Fixes #57985` 的关联，并引用被标记为重复的 [#64643](https://github.com/anomalyco/opencode/issues/64643)。两条 Issue 均已补充 PR 与验证说明：[主 Issue](https://github.com/anomalyco/opencode/issues/57985#issuecomment-7007118475)、[复现记录](https://github.com/anomalyco/opencode/issues/64643#issuecomment-7007119488)。
- 修复覆盖一个 clone 改 origin 后只迁移自身目录内的会话、保留另一 clone 的归属，以及子目录路径、时间戳、无身份 marker 的历史目录和已有目标工作树行。PR 说明关联了 [#58668](https://github.com/anomalyco/opencode/pull/58668) 的跨 clone/子路径审核问题；项目权限规则与 snapshot 存储迁移不属于此补丁。
- 完整 `bun run check` 35/35 通过；项目、会话创建、工作树、会话投影及状态重放共 163/163 通过。两个 clone 方向、无 marker、已注册目标目录四个关键场景各重复十次，40/40 通过，无重试。
- Windows 验证使用的 CSS lint 路径归一化和声明符号链接等价导入已撤回，未进入提交；贡献工作树保持干净。测试使用隔离临时数据库和真实 Git 仓库，未操作用户会话。
- PR 为 OPEN / MERGEABLE / BLOCKED；规范、合规及贡献者检查成功，[check-test](https://github.com/anomalyco/opencode/actions/runs/44510327640) 等正式 CI 为 `action_required`，待官方维护者批准运行与审核，尚未合并。

当前官方开放 PR 为 #62845、#62851、#64850，共三个。clone 目录选择修复 `clone-selection-fix` / #64644 仍待提交，未占用额外名额。

## 两个基础重构整合为一个官方 PR（2026-11-19）

用户最新要求是在控制改动规模的前提下合并其中两个 PR，释放一个名额。已将项目操作重构完整合入会话索引重构，复用 [#62845](https://github.com/anomalyco/opencode/pull/62845)，标题更新为 `refactor(app): share session index and project actions`。新 head 为 `cf0814f8d202755c03ca5299f0e7c52fa30b4cca`，同时包含两个已审核分支的最新提交，并合入官方 dev `d33b5783338b8b350aafc09f7dc2701eeba52a9a`。相对该官方基线共 25 个文件、171 行新增和 160 行删除，主要为模块搬移、命名及调用引用调整。

- [#62850](https://github.com/anomalyco/opencode/pull/62850) 已关闭，未合并进官方 dev；[关闭说明](https://github.com/anomalyco/opencode/pull/62850#issuecomment-7006330812) 指向完整接替它的 #62845。`project-actions` 分支和审核历史保留。
- [#62851](https://github.com/anomalyco/opencode/pull/62851) 继续独立开放，代码 head 仍为 `6af6f58b7b2229a4450635ed4e3a44a7c5124e20`；仅更新说明中的关联关系。Running 组件与 Side bar 界面模式未加入本次重构。
- 整合完成时官方开放 PR 从三个降至两个，释放的一个名额后来按用户要求用于 #64850，见上节。此次明确授权替代此前“保留三个现有 PR”的选择。
- 整合后完整 `bun run check` 35/35、App 单元测试 2773/2773、生产构建及 Chromium 构建模式回归 15/15 均通过。浏览器测试使用两个 worker、零重试，覆盖 Home 会话/项目列表、目录及工作树选择、服务器重新配对、项目菜单/设置、位置卡片、最近关闭会话、最近会话排序和 Inbox 重命名。
- Windows 验证使用的声明符号链接等价导入和 CSS lint 路径归一化已撤回，未进入提交。隔离静态测试服务器已停止，未操作用户运行中的服务；不据此次验证作性能结论。

#62845 和 #62851 均为 OPEN / MERGEABLE / BLOCKED，现有审核线程全部已解决。#62845 新 head 的规范及合规检查成功，但 [check-test](https://github.com/anomalyco/opencode/actions/runs/44504960584) 等正式 CI 仍为 `action_required`，需要官方维护者批准运行并完成审核；关闭 #62850 不代表补丁已经合入官方仓库。

## 同步与现有官方 PR 审核跟进（2026-11-19，整合前快照）

官方 dev `a86ac3f1b9` 已合入 `dev-my`，同步提交 `bf25d250dc` 已推送 origin；`origin/dev` 与本次拉取的 `upstream/dev` 完全一致。保留 fork 的独立 Side bar，兼容上游导航原型及旧项目分组组件的删除；视频 Job 纳入现有后台活动分类，并补上实际 Job 生命周期回归。合并时遗漏的 Home 冒烟辅助函数导入已恢复。

- dev-my 完整 `bun run check` 35/35 通过；Core 项目、Job 与会话活动 59/59 通过，视频生成独立复测 2/2 通过；Chromium 构建模式冒烟 7/7 通过，包含 Side bar、clone 目录恢复、远端选择恢复和项目入口。
- 三个官方 PR 的原有审核线程均已解决，没有新增待处理审核意见。本轮均合入同一官方 dev 提交，保持各自范围独立。
- 三个官方分支完整 `bun run check` 各 35/35、App 单测各 2773/2773 通过。Windows 检查使用临时声明符号链接等价导入和 CSS 路径归一化，均未进入提交。

| 官方 PR                                                    | 更新提交     | 本轮处理与验证                                                                                                                                                     |
| ---------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [#62845](https://github.com/anomalyco/opencode/pull/62845) | `b69665da42` | 共享索引与上游同名模块合并，保留上游 recency 规则；项目专属查询仍由 Home 拥有，新项目历史浏览器与自定义侧栏改用共享索引。Home/tabs 构建模式浏览器回归 94/94 通过。 |
| [#62850](https://github.com/anomalyco/opencode/pull/62850) | `1710919b50` | 修正新建会话入口及项目历史菜单的迁移引用，接受上游旧侧栏删除。项目菜单、工作树选择、服务器重新配对、设置及位置卡片浏览器回归 7/7 通过。                            |
| [#62851](https://github.com/anomalyco/opencode/pull/62851) | `6af6f58b7b` | 暂停虚拟时钟后挂载重试故事，消除加载时间推进重试次数的竞争。Running 两个真实组件场景各重复十次，20/20 通过；Client 数据测试 39/39 通过。                           |

此快照阶段遵循用户当时保留三个 PR 的要求，未关闭任何 PR；后续整合授权及结果见上节。三个 PR 的更新均已推送并更新验证说明，当时 GitHub 均为 OPEN / MERGEABLE / BLOCKED；规范与合规检查成功，正式 CI 仍为 `action_required`。已分别留言请求维护者批准 [#62845 的 check-test](https://github.com/anomalyco/opencode/actions/runs/44491017257)、[#62850 的 check-test](https://github.com/anomalyco/opencode/actions/runs/44490474185)、[#62851 的 check-test](https://github.com/anomalyco/opencode/actions/runs/44490488735) 并完成最终审核。当前账号无官方仓库 push/maintain 权限，尚未合并官方 PR。Strobe 对比已尝试，但因与冷构建负载重叠而中止，未据此作性能结论。浏览器测试改为先完成生产构建，再运行隔离静态服务，未调整测试超时或重试次数。

## 本轮修复与官方提交（2026-11-18）

已将官方 dev `d412042beb` 合入 `dev-my`（同步提交 `62a06611ed`），并推送 origin。`origin/dev` 仍与此次拉取的 `upstream/dev` 完全一致。

- [本仓库 PR #11](https://github.com/joe-ieta/OpenCode.My/pull/11) 已改为目标 `dev-my` 并合并（`ea49fb226f`），Issue #9 已关闭。Git 会话按自身目录迁移，保留其他 clone 的会话；相邻目录名不再触发重复迁移事件。最终修正提交为 `5690778cf6`。
- [本仓库 PR #12](https://github.com/joe-ieta/OpenCode.My/pull/12) 已改为目标 `dev-my` 并合并（`e5237b1f6f`），Issue #10 已关闭。选择的 clone 目录在添加、重载及新建会话时保持一致；清单恢复纳入 Home 状态机，并适配 fork 的共享项目控制器及 Side bar。
- 最终整合的根目录 `bun run check` 35/35 通过，App 单元测试 2776/2776 通过。Core 项目与会话创建测试 81/81 通过；双 clone 两个方向重复 10 次通过；Home 状态机重复测试 140/140；构建模式浏览器 clone 回归以 5 个 worker、零重试运行 10 次通过，dev-my 适配后两项 keeper 回归也通过。
- 两个独立官方分支均从官方 dev 建立，未包含 fork 品牌、发布工具或其他补丁；各自完整 lint/typecheck 35/35 通过。官方工作树检查使用了临时 Windows 路径归一化和符号链接声明的等价导入，之后均已撤回。独立 `typecheck:e2e` 仍报告未改动用例及 CSS/Vite ambient 类型问题，新增 Home 用例没有诊断；实际构建和浏览器测试通过。

| 官方问题                                                     | 已验证的独立贡献分支                                                                                                                             | 提交状态                                                                                                                                                                                                        |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [#64643](https://github.com/anomalyco/opencode/issues/64643) | [`origin-session-fix`](https://github.com/anomalyco/opencode/compare/dev...joe-ieta:OpenCode.My:origin-session-fix)，最新 `9bc70a296a`，4 个文件 | Issue 按 [#57985](https://github.com/anomalyco/opencode/issues/57985) 的重复报告关闭；2026-11-19 已同步最新官方 dev、复验并提交 [PR #64850](https://github.com/anomalyco/opencode/pull/64850)，关联两条 Issue。 |
| [#64644](https://github.com/anomalyco/opencode/issues/64644) | [`clone-selection-fix`](https://github.com/anomalyco/opencode/compare/dev...joe-ieta:OpenCode.My:clone-selection-fix)，`ba69969b54`，10 个文件   | Issue 已提交且开放；PR 尚未创建。浏览器截图保存在独立 `clone-review-proof` 证据分支，不在贡献补丁中。                                                                                                           |

GitHub 当时拒绝创建两个官方 PR：CLI GraphQL 返回 `joe-ieta does not have the correct permissions to execute CreatePullRequest`，REST 返回 404，连接器返回 integration 403。2026-11-19 整合前复核时，账号有 [#62845](https://github.com/anomalyco/opencode/pull/62845)、[#62850](https://github.com/anomalyco/opencode/pull/62850)、[#62851](https://github.com/anomalyco/opencode/pull/62851) 三个开放 PR，与下文记录的历史名额限制一致。用户此前选择“保留现有 PR”，后来明确授权整合其中两个以释放一个名额，并优先提交 clone 会话迁移修复，结果见本文最新记录。两个贡献分支和本机提交说明（`.cache/upstream-origin-pr.md`、`.cache/upstream-clone-pr.md`）均保留；前者已提交 #64850，后者仍待提交，提交前须再核对官方最新基线。

## 初次复核记录（2026-11-18，修正前）

已拉取官方 `upstream/dev` 至 [`d412042beb`](https://github.com/anomalyco/opencode/commit/d412042beb9821ed61c73466406f7dbfdadc04e0)（北京时间 2026-11-18 18:11），比两个 PR 原基线 `a9a35b4b4c` 新增 74 个提交。`origin/dev` 没有独有提交，已快进并核验与该上游提交完全一致。本次未合并三个维护分支，也未更新两个 PR 的来源分支。

| 本仓库 Issue / PR                                                                                                          | 最新上游结论                                                                                                  | 补丁对照验证                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Issue #9](https://github.com/joe-ieta/OpenCode.My/issues/9) / [PR #11](https://github.com/joe-ieta/OpenCode.My/pull/11)   | **仍存在**。origin 改名后 ID 改变，未写入 `.git/opencode`；已有 worktree 行仍阻止再次发布用于收养会话的事件。 | PR head `7b31a6fa0c` 可无冲突应用到最新上游。项目测试 29 项通过，原有相关会话测试 5 项通过；但新增双 clone 隔离用例失败，**不能据此认定补丁可直接合并**。 |
| [Issue #10](https://github.com/joe-ieta/OpenCode.My/issues/10) / [PR #12](https://github.com/joe-ieta/OpenCode.My/pull/12) | **仍存在**。Home 仍以共享项目的 canonical worktree 处理新增结果，恢复非 canonical clone 时会清空选择。        | PR head `2ac79bfad1` 可无冲突应用到最新上游；Home、workspaces、titlebar 相关测试 **454 项通过**，包含 PR 的 clone 选择回归用例。                          |

复核使用最新上游的独立工作树及 Bun 1.4.4。先仅移入 PR 的回归测试：Core 的缓存写入、无 marker 的 origin 改名、已有新 worktree 行三项均失败；Home 状态机 12 项通过、clone 回归项失败。再应用生产补丁作对照。当前 `dev-my@afa7429af7` 的 `project.ts`、`session/projector.ts`、`home/machine.ts` 与最新上游相同，因此不能依据 Issue 中历史 downstream 修复评论认定当前维护线已解决问题。

PR #11 的新增失败场景：两个 clone 共享旧项目 ID，A 是 canonical 目录；只改 A 的 origin 后，B 的会话也被改成新项目 ID。该用例在纯上游通过，在补丁上失败。原因是补丁把 Git 历史项目 ID 放入 `Worktree.Event.Resolved.adopted`，而现有 Session projector 对 `adopted` 按整个旧项目选择会话，并以旧项目的 canonical 目录判断归属；这一语义原用于 markerless 项目的收养，不保证 Git clone 的目录隔离。后续应先修正该边界，再评估合并。

Core 与 App 的 `bun typecheck` 均通过；App 在隔离工作树使用与原符号链接等价的临时导入。候选的根目录 `bun run check` 停在未改动的 `script/check-greys.ts`：Windows 反斜杠路径未匹配例外规则，报 172 项。同步镜像时现有 `dev-my` 的 pre-push 完整检查通过（35 个任务）；该结果不替代最新上游候选的全量检查。本次未运行桌面 UI / Playwright 端到端测试。

两个 PR 目前都指向本仓库 `dev`。按现行分支约束，`dev` 只能镜像官方代码，不能直接合入这些 fork 修复；维护线修复应适配 `dev-my`（Core 按需同步到 `oc-headless`），正式官方贡献另以 `anomalyco/opencode:dev` 为目标。问题仍然存在，不应因本次同步而关闭 Issue。

## 当前 PR

| PR / 分支                                                                         | 核对状态                                                                                            | 本地与后续策略                                                                                                                                             |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [#60496](https://github.com/anomalyco/opencode/pull/60496) · `model-release-date` | **MERGED**，2026-10-30；最终 head `88d92af959`；合并提交 `986221af346f8f71d0133f2c08130cedc17ab097` | fork Windows `v2.2.1-dev-my.2` 已有本地修复。已在 `v2.2.2-dev-my.1` 源码同步中吸收最终上游实现与测试；本地旧提交留在发行历史，不重复移植同一补丁           |
| [#56929](https://github.com/anomalyco/opencode/pull/56929) · `upstream-migration` | **OPEN**，非 Draft；核对时可合并；期间曾关闭，当前已重新打开                                        | V1 迁移清理分批提交的可靠性修复；`dev-my`、`oc-headless` 按实际需求保留，继续跟进审核                                                                      |
| [#60084](https://github.com/anomalyco/opencode/pull/60084) · `v2-upgrade-notice`  | **CLOSED / Draft**，未合并，2026-10-30                                                              | 单向 V1→V2 升级确认在本地发行保留；关闭不表示已上游化                                                                                                      |
| [#60867](https://github.com/anomalyco/opencode/pull/60867) · `sidebar-mode`       | **OPEN / Draft**，head `2de04af2cd`，目标 `dev`                                                     | 已解决 Inbox 首屏状态机冲突，GitHub 合并检测通过。Windows [v2.2.5-my.5](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.2.5-my.5) 提供测试安装包。 |
| [#60570](https://github.com/anomalyco/opencode/pull/60570) · `home-project-list`  | **OPEN**，非 Draft                                                                                  | 独立的 Home 全局项目清单提案；#60867 仅在 Side bar 模式扩展清单，比较范围和取舍，不声称两者都已被批准                                                      |
| [#60446](https://github.com/anomalyco/opencode/pull/60446) · `sidetab-overview`   | **CLOSED**，未合并，2026-10-31                                                                      | 已由作者关闭并链接 #60867；保留原设计、截图和分支供历史参考，不再作为当前贡献稿                                                                            |

`mergeable` 只是查询时的合并能力，不代表通过审核、CI 或已经获准合并。上游维护者修改过 #60496 的提交，最终 head 与本地初始 `8eb64b9416` 不同；本地发行修复是 `d28cf55b08`，不能仅凭提交哈希不同认定上游缺失。

## Issue 和设计提案

| 关联项                                                                                                                                                                             | 用途与状态                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [#49605](https://github.com/anomalyco/opencode/issues/49605)                                                                                                                       | 自定义模型未知日期被转为 1970 年的原始报告；已由 #60496 关闭                                                                                                                                                                                    |
| [#60479](https://github.com/anomalyco/opencode/issues/60479)                                                                                                                       | 本次 Windows V2 复现报告；机器人识别重复，当前已关闭。提交时申请 bug 标签，账号无权添加仓库标签                                                                                                                                                 |
| [#50726](https://github.com/anomalyco/opencode/issues/50726)                                                                                                                       | 桌面端自定义模型缺失的相关现象，供根因关联                                                                                                                                                                                                      |
| [#60241](https://github.com/anomalyco/opencode/issues/60241)                                                                                                                       | **OPEN**；已更新为独立 Side bar 提案，#60867 为设计评审材料，保持官方模式与初始默认值；已发布人工测试邀请                                                                                                                                       |
| [#33704 中的 V2 Proposal](https://github.com/anomalyco/opencode/issues/33704#issuecomment-6515528622)                                                                              | **OPEN**；自定义提供商/模型配置界面：表单 CRUD、可选凭据、连接测试、全局/项目范围、导入并保留 JSONC。上游仍无实现；fork 已合入 `dev-my` 并在 [v2.3.0-my.3](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.3) Windows 测试版验证 |
| [#59603](https://github.com/anomalyco/opencode/issues/59603)                                                                                                                       | **OPEN**；2.2.0 移除桌面自定义 provider 入口；官方仍建议编辑 `opencode.json`                                                                                                                                                                    |
| [#50650](https://github.com/anomalyco/opencode/issues/50650)、[#57325](https://github.com/anomalyco/opencode/issues/57325)                                                         | **OPEN**；旧桌面表单保存失败、不能设 limits/发现；旧表单已移除，问题未由上游解决                                                                                                                                                                |
| [#57997](https://github.com/anomalyco/opencode/pull/57997)                                                                                                                         | **OPEN**；恢复自定义 OpenAI-compatible provider 保存。仅机器人验证，无维护者批准/合并                                                                                                                                                           |
| [#57161](https://github.com/anomalyco/opencode/pull/57161)                                                                                                                         | 官方仍开放。fork 的 `dev-my` 已合入 `aa71865099`，由 `openai_compatible_discovery` 控制运行时目录补充。                                                                                                                                         |
| [#40524](https://github.com/anomalyco/opencode/issues/40524)                                                                                                                       | **OPEN**；V2 provider 目录与 `/models` 对账的主要跟踪 issue；无维护者结论                                                                                                                                                                       |
| [#51527](https://github.com/anomalyco/opencode/issues/51527)                                                                                                                       | **OPEN**；配置已存在时可通过 `ConfigProviderPlugin` 的 key method 设置 Key；任意 ID 预注册仍不支持                                                                                                                                              |
| [#62448](https://github.com/anomalyco/opencode/issues/62448)、[#61628](https://github.com/anomalyco/opencode/issues/61628)                                                         | **OPEN**；更广义的桌面 provider 管理、无需配置文件的产品需求                                                                                                                                                                                    |
| [#63710](https://github.com/anomalyco/opencode/pull/63710)、[#62743](https://github.com/anomalyco/opencode/pull/62743)、[#58066](https://github.com/anomalyco/opencode/pull/58066) | **Draft/OPEN/OPEN**；provider 模型通配符、Unix socket、原地轮换 Key；均未合并                                                                                                                                                                   |

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
