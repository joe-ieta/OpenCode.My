# dev-my 发行与源码同步记录

二进制发行以 [GitHub Releases](https://github.com/joe-ieta/OpenCode.My/releases) 的完整资产为准。自 2026-11-02 起，所有平台仅使用本仓库 GitHub 的完整安装包与更新清单；旧镜像和分卷流程已停用。源码标签只证明提交已标记，不代表为该版本构建或上传了安装包。环境准备、构建和排障见 [发布环境与多架构构建](../KB/release-environment.md)。

## 2026-11-20 源码同步与审核回迁

- 本机 `dev-my` 从 `0deac1b4aa` 快进到 `origin/dev-my@61e1b94c23`，拉取 19 个提交；随后合入官方 `upstream/dev@c98608c513` 的 72 个提交，保留维护分支历史。
- 解决 12 个冲突文件，保留独立 Side bar、Home 的 clone/worktree 选择、自定义 Provider 管理和会话活动观察；接入上游焦点处理、任务更新事件及功能开关。客户端和 OpenAPI 均由生成脚本更新，重复生成与一致性检查通过。
- 按锁文件安装依赖后，`bun run check` 35/35、Core 回归 147/147、App 单元测试 2846/2846、客户端回归 46/46、桌面打包配置 25/25、Protocol 测试 14/14 通过。
- 首次同步的正式构建 Chromium 冒烟 12/12，覆盖 Side bar 项目操作、共享历史、Home 所选项目的新建会话、clone 目录恢复、键盘焦点及 Provider 账号移除。该次同步先保存在本机，随后与下述审核回迁一并推送至 `origin/dev-my`。
- 同日将官方 [PR #65049](https://github.com/anomalyco/opencode/pull/65049) 的审核修正 `c054c39f75` 回迁为 `12f8d12a71`，提交保留来源引用。两种中文各补充 8 个词条，繁体两处 Provider 用词统一为“提供者”；解决与本地模型测试提示相邻的冲突，逐项核验其余已有词条全部保留。Side bar、Home 和设置的实现文件未因本次回迁变化。
- 回迁后 `bun run check` 35/35、语言与 Side bar 单元测试 63/63、正式构建 Chromium 冒烟 15/15 通过。浏览器验证覆盖项目菜单、项目关闭与恢复、排序与置顶、未读状态、跨项目/服务器 Running sessions、Home 选择的新建会话目标、列表模式、clone 目录恢复及语言切换。

## 2026-11-20 最新 dev 同步与 PR #16 审查

- 将官方 `upstream/dev@f0df6070f9` 的 37 个新提交合入 `dev-my`，同步提交为 `9f52cf8edf`。唯一冲突是 OpenAPI 生成文件，已重新生成协议与客户端，保留 fork 的会话活动端点与已有定制。
- 审查并合入 [PR #16](https://github.com/joe-ieta/OpenCode.My/pull/16)，合并提交为 `47a7171fe4`。保留 Side bar 的项目/列表模式、置顶、共享历史、运行中会话及 clone 目录选择；接入三行导航、版本/构建日期/服务端提示、数量在前的计数及项目内草稿优先排序。补齐身份提示的三条简繁中文文本，并扩展现有词典检查。
- 完整检查 35/35、App 单元测试 2858/2858、Core 定向回归 116/116、Protocol 测试 14/14、客户端 268 项通过（4 项平台条件跳过）、App 官方 TypeScript 检查通过。客户端首次全测指出端点枚举遗漏已有 `session.activity`，修正契约断言后重新全测通过。
- 正式构建 Chromium 冒烟 23/23，无重试，覆盖 Side bar 顶栏与版本提示、中英文窄栏、项目菜单与关闭恢复、草稿排序、置顶滚动区、跨服务器 Running sessions、Home/clone 目录恢复、语言切换，以及上游子会话权限在重连后的恢复。
- 将 `origin/dev` 快进到同一官方提交，作为纯上游镜像；不混入 fork 提交。

## 当前下载

| 通道 | 版本 | 平台 | 下载 |
| --- | --- | --- | --- |
| 正式发行（Latest） | `2.3.0-my 0.1.25` | Windows x64、Linux amd64/arm64 | [NSIS、AppImage、deb 与校验文件](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.0.1.25) |

早于 `v2.3.0-my.24` 的桌面发行保留发行页、说明和源码标签，其历史附件已清理。下方记录中的旧附件链接仅供追溯。两条 headless 发行线单独管理。

## OpenCode My 2.3.0-my 0.1.25 正式发行（Windows x64 / Linux amd64、arm64）

- 2026-11-21（Asia/Shanghai）候选版通过人工验收。正式版按新版本号重建，三个目标均使用构建提交 `d3d52458636c95325fa9256dc60708f8e9bf005f` 和原候选模型目录快照，SHA256 为 `9b679293eb100564645d1c1cd755afbf406d736172124ffa8d6278677d08f359`。候选标签和发行附件均保留。[正式发行](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.0.1.25) · [候选版](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.0.1.25-rc)
- Windows 提供 NSIS，Linux 两种架构各提供 AppImage 和 deb。三个目标均通过包内 CLI 版本、HTTP 健康和 SSE 冒烟，arm64 使用 QEMU。已核对包内版本、三个更新清单及 10 个 GitHub 附件的大小、SHA256 和公开下载链接。[SHA256SUMS](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.0.1.25/SHA256SUMS)
- GitHub Latest 展示为 `OpenCode My 2.3.0-my 0.1.25`。该版沿用既有正式标签 `v2.3.0-my.0.1.25` 和对应安装包版本 `2.3.0-my.0.1.25`。正式标签和候选标签指向同一源码提交。

## v2.3.0-my.0.1.25-rc Windows x64 与 Linux amd64/arm64 候选版

- 2026-11-21（Asia/Shanghai）发布新规则下首个桌面候选。官方基线为 `2.3.0`，fork 系列为 `0.1`，构建脚本从历史基线 24 自动分配 25。标签指向 `d3d52458636c95325fa9256dc60708f8e9bf005f`，包含 `upstream/dev@cfbf3f7171`。[候选版](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.0.1.25-rc)
- Windows x64 提供 NSIS，Linux amd64、arm64 各提供 AppImage 和 deb。三个目标复用同一模型目录快照。`bun run check` 通过，包内 CLI 的版本、HTTP 健康和 SSE 均通过；arm64 使用 QEMU。
- 已核对 GitHub 上 10 个附件的大小、SHA256 和公开下载链接。该候选发布时为预发行，当时的正式 Latest 为 `v2.3.0-my.24`。[SHA256SUMS](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.0.1.25-rc/SHA256SUMS)

## v2.3.0-my.24 正式发行（Windows x64 / Linux amd64、arm64）

- 2026-11-21（Asia/Shanghai）发布 Windows x64 预发行，构建及标签对应 `1cebbb83412b0012415dee8cf6044c45a55465de`。[GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.24)
- 官方 dev 同步至 656c273638，保留本地 Side bar 补丁。同步验证包括 Side bar 与 Home Chromium 20/20、会话活动 Core 31/31、Windows MCP pool 22/22，`bun run check` 35/35。
- 未签名 NSIS 安装包为 286414517 字节，SHA256 为 `eecbb2df33c5f2a64a84710b8599f93d0c4b3c588f7ef531d8b951511f13fe01`。安装包、ASAR 和包内 CLI 版本已核验。包内 CLI 的 `/api/info` 返回 HTTP 200，`/api/event` 首帧为 `server.connected`。GitHub 四个附件的大小、SHA256 和公开下载链接均已核验。[SHA256SUMS](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.24/SHA256SUMS)
- 2026-11-21（Asia/Shanghai）Windows x64 人工验收通过。保留安装包及 `latest.yml` 的原附件 ID 和 SHA256，以同一标签 `1cebbb83412b0012415dee8cf6044c45a55465de` 和同一模型目录快照补齐 Linux amd64、arm64 的 AppImage 和 deb。快照 SHA256 为 `9b679293eb100564645d1c1cd755afbf406d736172124ffa8d6278677d08f359`。
- Linux `bun run check` 35/35。四个 Linux 安装包通过解包、架构、版本、桌面入口及更新源核验；两种架构通过 CLI 服务发现、历史迁移、HTTP 健康和 SSE 冒烟，arm64 使用 QEMU。
- 全部 10 个附件的大小、SHA256 和公开下载链接均已核验。`.24` 已转为正式发行并设为 GitHub Latest。[发行页](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.24)
- 清理了早于 `.24` 的桌面发行附件，涉及 `.18`、`.19`、`.20`、`.21`、`.22` 共 5 个发行、38 个附件。已核验历史发行页面、发布说明和源码标签均保留，`oc-headless` 与 `qt-headless` 发行附件未受影响。`.24` 清理后仍是 Latest，10 个资产全部保留。

## v2.3.0-my.22 正式发行（Windows x64 / Linux amd64、arm64）

- 2026-11-20（Asia/Shanghai）Windows x64 人工审核通过；基于同一不可变标签 `68fdc0684378e771159638d14263efd928973850` 补齐 Linux amd64、arm64 的 AppImage 和 deb，并验证后转为正式版、设为 Latest。`draft=false`、`prerelease=false`；源码标签未移动。[GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.22)
- Side bar 左上角“添加项目”与“搜索会话”统一行高、左右留白、图标/文字间距和对齐，并使用相同的悬停背景反馈；同时覆盖单服务器按钮和多服务器选择菜单。保留上一版官方 dev 同步、PR #16 顶栏与草稿排序改进，以及现有 Side bar、共享历史、Provider/模型管理和 clone/V1 迁移修正。
- 冻结依赖安装未改变锁文件；Windows、Linux 完整检查均为 35/35，正式构建 Chromium 回归 5/5、Linux 项目相关回归 32/32 通过。隔离浏览器核对单/多服务器控件的布局、文字对齐和悬停背景，两种入口均能打开目录选择器。
- 使用 Bun 1.4.4 和同一模型快照构建三个目标。Windows 与两种 Linux 架构的包内 CLI 均比对 8,760 个模型，并通过服务发现、共享 V1 数据库、升级确认和历史迁移冒烟；两种 Linux 包内 CLI 的 HTTP 信息接口与 SSE 连接检查通过，ARM64 使用 QEMU 验证。模型快照 SHA256 为 `b12f4063cd47e2349d7a6052d3cea677dabd82930727d072a71142fb14dc0eb7`，保存在 `.cache/desktop-my/2.3.0-my.22/models-catalog.json`。
- 保留已验收 Windows 安装包（附件 ID `771610352`）和更新清单（ID `771610371`）原字节、大小与哈希。NSIS 为 286,188,625 字节，SHA256 为 `d7d836c4223bd064bbec20b6de150723e9efbebff4b4f874e4bdb1147b64021a`；内嵌 CLI 与通过冒烟的构建输入一致。
- 四个 Linux 安装包均解包核对 ELF 架构、ASAR/CLI 版本、简繁中文资源、原生终端模块、桌面入口及更新源；同架构 AppImage/deb 的应用内容一致。ARM64 AppImage 使用已验证的静态运行时。两个 Linux 更新清单的 SHA512 与大小均通过核验。
- `SHA256SUMS` 扩展为五个安装包，`build.json` 记录共同源码和三个目标。十个 GitHub 附件的大小及服务端 SHA256 均与本地一致；公开下载的五个安装包片段与本地一致，三个更新清单、完整校验清单和构建信息均完整下载后核对哈希。Windows 预发行阶段四个附件的完整下载核验记录保留。所有安装包未签名。[Windows 安装包](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.22/opencode-desktop-win-x64.exe) · [Linux amd64/arm64](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.22) · [SHA256SUMS](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.22/SHA256SUMS) · [构建信息](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.22/build.json)

## v2.3.0-my.21 Windows x64 人工审核预发行

- 2026-11-20（Asia/Shanghai）发布 Windows x64 人工审核预发行，构建源码和不可变标签均指向 `9fc8d1a9d611b6e65aefaed20cc4fd987f7e4ee9`。`draft=false`、`prerelease=true`；Latest 保持 `v2.3.0-my.18`，人工安装与界面验收待完成。[GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.21)
- 包含上文官方 `dev@f0df6070f9` 同步及已审查合并的 PR #16；补齐新增身份提示的简繁中文，保留 Side bar、共享历史、自定义 Provider/模型管理、clone 归属与目录选择、V1 迁移补丁。完整检查 35/35、App 单测 2858/2858、Core 定向回归 116/116、Protocol 14/14、客户端 268 项通过（4 项平台条件跳过）、App 官方 TypeScript 检查与正式构建 Chromium 冒烟 23/23 通过。
- 使用 Bun 1.4.4 构建，包内 CLI 比对 8,760 个模型，并通过服务发现、共享 V1 数据库、升级确认和历史迁移冒烟。模型快照 `.cache/desktop-my/2.3.0-my.21/models-catalog.json` 的 SHA256 为 `b12f4063cd47e2349d7a6052d3cea677dabd82930727d072a71142fb14dc0eb7`，供同版本其他平台构建复用。
- 未签名 NSIS 安装包为 286,186,904 字节，SHA256 为 `1fde05d38cf272fb5bc3d4a5184117b007672782f286caa048f08726e1c4148d`。安装包完整性、应用/CLI 的 x64 架构和版本、更新源、清单 SHA512 及包内简繁中文提示均已核验；内嵌 CLI 与通过冒烟的构建输入逐字节一致。
- 四个 GitHub 附件的大小和服务端 SHA256 均与本地一致，四个公开链接的完整下载也已核对大小和 SHA256。[Windows 安装包](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.21/opencode-desktop-win-x64.exe) · [SHA256SUMS](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.21/SHA256SUMS) · [构建信息](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.21/build.json)

## v2.3.0-my.20 Windows x64 人工审核预发行

- 2026-11-20（Asia/Shanghai）发布 Windows x64 预发行，标签和构建源码均为 `a3a02b2e0e4c554f30d6d37b4788790f6d1ea7d0`。`draft=false`、`prerelease=true`；GitHub Latest 保持 `v2.3.0-my.18`，人工安装与界面验收待完成。[GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.20)
- 包含官方 `dev@c98608c513` 同步及 PR #65049 本轮中文审核修正，保留独立 Side bar、共享历史、自定义 Provider/模型管理及升级迁移补丁。冻结依赖安装成功，根完整检查 35/35；同源码语言与 Side bar 单测 63/63、正式构建 Chromium 冒烟 15/15 通过。
- 使用 Bun 1.4.4 构建，包内 CLI 比对 8,760 个模型，并通过服务发现、V1 升级确认和历史迁移冒烟。模型快照位于 `.cache/desktop-my/2.3.0-my.20/models-catalog.json`，SHA256 为 `7aa3f98dad6ae5d18a91f668ff553118d4ed23c843df6f6bea96743619ea1848`，供后续同版本其他平台复用。
- 未签名 NSIS 安装包为 286,112,493 字节，SHA256 为 `4692e61e23350b1c0066994938b0110662ae943a9d60a95e1a238e721ebd14af`。安装包完整性、应用/CLI 的 x64 架构和版本、更新源、更新清单 SHA512 均已核验；内嵌 CLI 与通过冒烟的构建输入完全一致。包内两种中文的审核修正、Side bar 及模型测试词条均与源码匹配。
- 四个 GitHub 附件的大小和服务端 SHA256 均与本地一致；公开链接和 GitHub CLI 完整下载的四个文件也已核对大小与 SHA256。[Windows 安装包](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.20/opencode-desktop-win-x64.exe) · [SHA256SUMS](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.20/SHA256SUMS) · [构建信息](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.20/build.json)

## v2.3.0-my.19 Windows x64 与 Linux amd64/arm64 RC 预览

- 2026-11-20（Asia/Shanghai）发布 Windows x64 预发行，构建及标签对应 `e484bb9707ad08501edd58351db73ffc11605c29`。GitHub Latest 为 `v2.3.0-my.18`。[GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.19)
- 包含 Git diff 仓库配置修复、Windows 桌面打开 PowerShell 7 修复，以及 Shell 输出目录恢复修复。保留本地会话活动注册，Side bar 与 Home Chromium 回归 20/20，Core 回归 62/62，`bun run check` 35/35。
- 未签名 NSIS 安装包为 284898564 字节，SHA256 为 `38d2e8dfcc545918d248f828d595961fd8b207740295ffe03c2717c2d3b212a5`。安装包、ASAR 和包内 CLI 版本已核验。包内 CLI 的 `/api/info` 返回 HTTP 200，`/api/event` 首帧为 `server.connected`。GitHub 四个附件的大小、SHA256 和公开下载链接均已核验。[SHA256SUMS](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.19/SHA256SUMS)

- 2026-11-20（Asia/Shanghai）确认 Windows 安装包通过人工验收，保留安装包及 `latest.yml` 的原附件 ID 和 SHA256。基于同一源码及模型目录快照（SHA256 `07e30ec665660770ca22d04d98b3d0d80b1c8edc26859608e364dc38b9ba5e1e`）补齐 Linux amd64/arm64 的 AppImage 和 deb。
- Linux `bun run check` 35/35。四个安装包完成解包和架构、版本、桌面入口及更新源核验。两架构的包内 CLI 均通过模型目录、服务发现、历史迁移、HTTP 健康检查和 SSE 冒烟，arm64 使用 QEMU。
- 已核对全部 10 个发布附件的大小、SHA256 和公开下载链接。`.19` 保持预发行并标记 RC 预览，Latest 为 `.18`。[RC 预览](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.19)

## v2.3.0-my.18 Windows x64 与 Linux amd64/arm64 正式发行

- 2026-11-19（Asia/Shanghai），用户已确认同一源码的本地审核构建。`v2.3.0-my.18` 基于 `0deac1b4aa10f52b9b9883cc2fc8a84399ae2712` 重新构建，并设为 GitHub Latest。与 `.16` 相比，Git 源码只增加了发行记录。[GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.18)
- Windows 和 Linux 的 `bun run check` 各通过 35/35。三个目标使用同一份内置模型目录快照，SHA256 为 `07e30ec665660770ca22d04d98b3d0d80b1c8edc26859608e364dc38b9ba5e1e`。
- Windows x64 未签名 NSIS 安装包为 284,896,889 字节，SHA256 为 `c0b3570619c8c172dbc7bc3b00d9ba4cee5218c6476f4d3f298f5226ba13a600`。已核对安装包、ASAR、包内 CLI 版本和更新清单，CLI 的 `/api/info` 返回 HTTP 200，`/api/event` 首帧为 `server.connected`。
- Linux amd64 和 arm64 的 AppImage 与 deb 均已解包核对架构、桌面入口、应用版本、包内 CLI 和更新源。两种架构通过模型目录、服务发现和历史迁移冒烟，arm64 运行时使用 QEMU。
- 已核对 GitHub 上全部 10 个附件的大小及 SHA256，验证五个安装包的公开下载链接，并完整下载校验三份更新清单、`SHA256SUMS` 和 `build.json`。[SHA256SUMS](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.18/SHA256SUMS) · [构建信息](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.18/build.json)
- 发布成功后，按用户确认删除所有早于 `.18` 的桌面发行附件。本次涉及 6 个发行、54 个附件。历史发行页、发布说明、源码标签和两条 headless 发行的附件均已核对保留。

## v2.3.0-my.16 Windows x64 与 Linux amd64/arm64 正式发行

- 2026-11-19（Asia/Shanghai），用户确认 Windows x64 人工审核通过；补齐并验证 Linux amd64/arm64 后，将原预发行转为正式发行并设为 GitHub Latest。标签及三个目标的构建源码均为 `4bccffbf2ef47234c6013d1ec556f1903c2a8712`，标签未变。[GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.16)
- 包含官方 PR [#62845](https://github.com/anomalyco/opencode/pull/62845)、[#64850](https://github.com/anomalyco/opencode/pull/64850) 本轮审核修正：项目选择显式传入添加动作；以 checkout 身份核验会话迁移来源，停止写入 `.git/opencode`，跳过身份未变时的迁移扫描。保留 Side bar 的单/多服务器项目添加，并恢复“新建会话”沿用 Home 所选项目的行为。
- 根目录完整检查 35/35、Core 回归 167/167、App 单测 2788/2788、Chromium 冒烟 10/10 通过。冻结依赖安装后再次完整检查 35/35 通过；Bun 1.4.4 构建的 CLI 比对 8,740 个模型，并通过服务发现、V1 升级确认和历史迁移冒烟。
- Windows NSIS 完整性、内嵌 ASAR/CLI 版本、更新源及 `latest.yml` 的大小和 SHA512 均已核验。已验收的安装包和更新清单保留原附件 ID、大小和 SHA256。
- Windows 安装包未签名，为 284,970,598 字节，SHA256 为 `3731db9b470e018453142f16683d5c524e3c7166ebea18c69bbc67b019d02996`。[安装包](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.16/opencode-desktop-win-x64.exe) · [SHA256SUMS](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.16/SHA256SUMS) · [构建信息](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.16/build.json)
- Linux amd64、arm64 各提供 AppImage 和 deb，在 Ubuntu 24.04 构建容器中复用 Windows 模型快照 `.cache/desktop-my/2.3.0-my.16/models-catalog.json`，SHA256 为 `54e91bab0c729fc98fb373556c23ab4a3d5fc4cfde357ae5d9319dcae1c5b5d7`。Linux 完整检查 35/35、Core 回归 167/167；两种架构均比对 8,740 个模型，通过服务发现、V1 升级确认和历史迁移冒烟，arm64 运行时验证使用 QEMU。
- 四个 Linux 包已解包核对 Electron、CLI、终端原生模块的架构，以及桌面入口、ASAR 版本和更新源；同架构 AppImage 与 deb 的应用内容一致。Linux 两份更新清单的大小和 SHA512 通过核验，联合校验文件覆盖五个安装包，构建信息记录三个目标。
- GitHub 的 10 个附件均已核对大小和服务端 SHA256；公开下载链接已验证，五个安装包的下载片段与本地一致，更新清单、联合校验文件和构建信息均在完整下载后通过校验。

## v2.3.0-my.15 Windows x64 与 Linux amd64/arm64 正式发行

- 2026-11-19，用户确认 Windows x64 安装包已通过人工验收。
- 2026-11-19（Asia/Shanghai）补齐 Linux 资产后设为正式发行和 GitHub Latest。标签及三种架构构建均对应 `9160ad1d89d7139eb961c7fb56b92a28a6c7ec3c`。合并 PR #15 后补齐未读会话恢复执行时的请求同步，以及运行与未读计数的无障碍标签。[GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.15)
- `bun run check` 通过（35/35），Side bar 与 Home 定向浏览器回归 7/7。包内 CLI 通过模型目录、服务发现、V1 升级确认和历史迁移冒烟。已核对 NSIS 载荷、ASAR、CLI 版本，以及 `latest.yml` 中的大小和 SHA512。
- Windows 安装包未签名，大小为 284,809,412 字节，保留验收时的 SHA256 `35e239209551899c60130e119c9f2555ab988c4e966defd340edbbd8ca92204c`。
- Linux amd64、arm64 均提供 AppImage 和 deb，复用 Windows 的模型快照 `66b706398e6993ac24d3a28e6ecff7f15e8ecaa21115aa44e38985fc41aa813b`。Linux 完整检查 35/35。两架构均比对 8,779 个模型，通过服务发现、V1 升级确认和历史迁移冒烟。arm64 运行时验证使用 QEMU。
- 四个 Linux 包均已解包确认架构、桌面入口、ASAR、包内 CLI 版本和更新源。三份更新清单的大小和 SHA512 均已核对，联合校验文件覆盖五个安装包。GitHub 的 10 个附件均已核对大小、SHA256 和下载链接。[SHA256SUMS](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.15/SHA256SUMS) · [构建信息](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.15/build.json)

## v2.3.0-my.14 Windows x64 人工审核预发行

- 2026-11-19（Asia/Shanghai）发布，构建提交为 `0b462b859ea66deef274e68101c50285f72d94a8`，官方基线为 `0220248dc1`。Windows 安装包未签名，等待人工安装与界面验收。[GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.14)
- 审核场景包括重启后保留所选 clone 目录、更换 clone 的 Git origin 后保留历史会话归属，以及最新回复的复制按钮和 Side bar 的常用操作。
- `bun run check` 通过（35/35）。包内 CLI 通过模型目录、服务发现、V1 升级确认和历史迁移冒烟。已核对 NSIS 载荷、ASAR 和包内 CLI 版本，以及 `latest.yml` 中的大小和 SHA512。
- 安装包为 284,804,593 字节，SHA256 为 `b8ee00fba3688a1016da7d1fcc2139f97c463cf3e98ad7b3a85ed33ba4d95656`。[安装包](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.14/opencode-desktop-win-x64.exe) · [SHA256SUMS](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.14/SHA256SUMS)

## v2.3.0-my.13 Windows x64 与 Linux amd64/arm64 正式发行

- 2026-11-17（Asia/Shanghai）发布为正式发行并设为 Latest。标签和三种架构的构建均对应 `0f1bf0b279cd55c448faf9be0cb7073f7f9902a9`，包含 `upstream/dev@9b57cc05cb` 的 15 个提交。[中英文发布说明](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.13)
- 同步子代理状态、Claude Agent 上下文限额、时间线布局和侧栏预览间距修复，保留 OpenCode My 的 Side bar 和自定义模型功能。
- Windows x64 NSIS 安装包已通过用户手工安装验收，SHA256 为 `7d5508cb81858b5b0a4ab30efbc14cdacdf488445c2050505270bc2134aa2575`。
- Linux amd64、arm64 各提供 AppImage 和 deb，复用 Windows 的同一模型快照，SHA256 为 `8d47c44895578a09cee270341aa8164d394bd588735d91b98167e41543c45a9d`。两种架构均比对 8,652 个内置模型，通过服务发现、V1 升级确认和历史迁移冒烟。四个 Linux 包均已解包核验，arm64 冒烟通过 QEMU 执行。
- 2026-11-17，用户确认 Linux amd64 和 arm64 安装测试均已通过，中英文发布说明已补记验收结果。
- 联合 `SHA256SUMS` 覆盖五个安装包，三份更新清单的 SHA512 和大小已核验。GitHub 的 10 个附件均已逐项核对大小和 SHA256。[SHA256SUMS](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.13/SHA256SUMS) · [构建信息](https://github.com/joe-ieta/OpenCode.My/releases/download/v2.3.0-my.13/build.json)
- 2026-11-17 清理 `v2.3.0` 系列旧附件，移除 `v2.3.0-my.12` 的 10 个附件。该系列现仅本版保留 10 个附件，旧版本的发行页、发布说明和源码标签均已核对保留。

## v2.3.0-my.12 Windows x64 与 Linux amd64/arm64 正式发行

- 构建提交为 `09e804577bcfacb05c7ea7e42855aab4cc3db44c`，包含 `upstream/dev@e3ed63c7de`。Windows x64 安装包已通过用户手工验收。[GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.12)
- 模型选择器恢复内置集成连接，并支持移除已保存的凭据。侧栏会话悬停提示新增轮次、上下文用量和费用，近期运行结束时间以相对时间显示。[PR #6](https://github.com/joe-ieta/OpenCode.My/pull/6) · [PR #7](https://github.com/joe-ieta/OpenCode.My/pull/7)
- Linux 两种架构各提供 AppImage 和 deb，使用与 Windows 同一源码和模型快照。快照 SHA256 为 `1622400c83bc3333bd75ac3b814874e27dbbf0ae9df4e5c001b359e6bb513acc`。
- `bun run check` 35/35，相关 Chromium 回归 38/38。两种 Linux 架构均比对 8,633 个模型，通过桌面 CLI 冒烟和解包核验。arm64 自动冒烟使用 QEMU。
- 2026-11-16，用户确认 Linux amd64 和 arm64 的安装测试均已通过，中英文发布说明已更新。
- 联合 `SHA256SUMS` 覆盖五个安装包。发行时核验了三份更新清单的 SHA512 和大小，并核对了 10 个远端附件的大小和 SHA256。
- 本次清理了 8 个桌面过程版本的 56 个附件。发行页、发布说明和源码标签均已核对保留，三个系列末版各保留 10 个附件。

## v2.3.0-my.10 Windows x64 与 Linux amd64/arm64 正式发行

- 2026-11-15 23:45:32（Asia/Shanghai）公开为正式发行并设为 GitHub Latest。发行标签指向构建提交 `947eade9ed69957179899d987c39a0180425f5ab`。[GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.10)
- Side bar 在「首页」下方恢复「新建会话」，使用首页选中的项目。「按项目」和「列表」统一显示活跃会话数、会话总数和项目总数。项目展开与折叠采用对应的文件夹图标。[PR #5](https://github.com/joe-ieta/OpenCode.My/pull/5)
- Windows x64 的 NSIS 安装包已通过用户安装测试。2026-11-16，用户确认 Linux amd64 和 arm64 的安装测试均已通过，中英文发布说明已更新。
- Linux 两种架构各提供 AppImage 与 deb，复用 Windows 的源码提交和模型快照。快照 SHA256 为 `1622400c83bc3333bd75ac3b814874e27dbbf0ae9df4e5c001b359e6bb513acc`。两种架构均比对 8,633 个模型，通过 CLI 服务发现、V1 升级确认和历史迁移冒烟。arm64 自动冒烟通过 QEMU 执行，四个 Linux 安装包均已解包核验。
- `bun run check` 35/35，Chromium 回归 25/25。三份更新清单的 SHA512 和大小与安装包一致，五个安装包的联合校验清单及全部 10 个远端附件在发布时均已核对。

## v2.3.0-my.8 Windows x64 与 Linux amd64/arm64 正式发行

- 2026-11-15 公开为正式发行并设为 GitHub Latest。`origin/dev-my` 和发行标签均核对到源码提交 `9e7ae48438f7c1638cd686d5213b4c1572814264`。[GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.8)
- Side bar 默认按项目分组，可用图标切换到按最近活动排序的列表。Home 项目行显示运行状态。模型设置新增已保存文本模型的测试、取消和重试，自动发现的模型进入运行时目录。
- Windows 沿用已通过用户安装验收的 NSIS 安装包，282,168,224 字节，SHA256 为 `16adf124c1742d42d7bd2ae4553172553358e2edc49e5fcfa481c955c9ab2af1`。中英文默认模式专项 Chromium 回归 2/2 通过，Windows 和 WSL 的 `bun run check` 均为 35/35。
- Linux amd64 和 arm64 各提供 AppImage 与 deb。四包均解包核对架构、桌面入口、ASAR 和 CLI 版本。两架构用 Windows 同一模型快照比对 8,639 个模型，包内 CLI 服务发现、V1 确认和历史迁移冒烟均通过。arm64 冒烟通过 QEMU 执行。快照 SHA256 为 `98a4edfea42662f40c44f21f42c710e96d96328d03ef9ff7c524038e656afbbf`。
- 用户确认 Linux amd64 和 arm64 的安装测试均已通过，中英文发布说明已补记验收结果。
- 三份更新清单的 SHA512 和大小与对应安装包一致。联合 `SHA256SUMS` 覆盖五个安装包，GitHub 公开发行的 10 个资产均已逐项核对大小和 SHA256。

## v2.3.0-my.6 Windows x64 本地审核版

- 本地构建标签指向 `30e8e40e5e2bf7acf227abbb4462990f87d77d88`，官方基线为 `upstream/dev@d432a06b9c`。本版供 Windows 手工安装审核，安装包和标签保存在本地。当时的 GitHub Latest 为 `v2.3.0-my.5`。
- 合入 `720e6c35d5`。模型设置可对已保存的文本模型发起测试、取消或在失败后重试。合入上游 [#57161](https://github.com/anomalyco/opencode/pull/57161) 后，配置的 OpenAI Compatible Provider 可将发现的模型加入运行时目录，手工录入的模型 ID、限额、JSONC 及原有 Custom providers 界面继续沿用。保留 Side bar 的项目运行状态改动。
- `bun run check` 35/35，lint 0 errors。Core 30/30、Server 19/19、Chromium 13/13，协议和生成客户端一致性检查通过。内置模型快照比对 8,777 个模型，CLI 服务发现和 V1 确认及历史迁移冒烟通过。
- `dist/releases/v2.3.0-my.6/opencode-desktop-win-x64.exe` 为 282,162,294 字节，SHA256 为 `cd8a8111c0ed69b70e56f733a88cc727e8fc58a3c6059d754da8384d17988806`。NSIS、内嵌应用归档、ASAR 版本和 `latest.yml` 的 SHA512 及大小已核验。安装包未签名，Windows 安装后的界面待手工审核。

## v2.3.0-my.5 Windows x64 与 Linux amd64/arm64 正式发行

- 构建标签对应 `29d0135d9b784a3cd7489ab9fd67edf7db45aa2c`，包含官方 `dev@d759c548aa`。用户已通过 Windows x64 安装验收，确认在矮窗口可滚动查看完整的模型名称、请求 ID 和上下文限额。[GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.5)
- Windows 根检查 35/35，Chromium 回归 29/29。CLI 服务发现和 V1 迁移冒烟通过。安装包 282,100,524 字节，SHA256 为 `8c54783a06a3696a10804139929ca84591213c7770ba72c40ad122852de29273`。
- 2026-11-15 在同一 Release 追加 Linux amd64/arm64 的 AppImage 和 deb，复用 Windows 模型快照，快照 SHA256 为 `37821e757acb6b6793e786f6c77153913da1b8280e5ea582a3aac3c063c394e2`。两种架构均比对 7,855 个模型，内置 CLI 的服务发现、V1 升级确认和历史迁移冒烟通过，arm64 自动冒烟通过 QEMU 执行。
- 四个 Linux 安装包已解包核对架构、ASAR、桌面入口和更新源。两个 Linux 更新清单的 SHA512 和大小与安装包一致。联合 `SHA256SUMS` 覆盖五个安装包。
- 2026-11-15，用户确认 Linux amd64 和 arm64 安装测试均通过。使用同一标签和十个已有资产将预发行转为正式发行并设为 GitHub Latest。已核对资产 ID、大小和 SHA256 均与转正前一致。

## v2.3.0-my.4 Windows x64 测试预发行（dev-my）

- 2026-11-14 19:51:16（Asia/Shanghai）公开为测试预发行，`draft=false`、`prerelease=true`、`latest=false`。[GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.4)
- 构建源码为 `09fc39f73b5f0bb534f521e4f2470d723e50431c`：在合入 `dev-my-models` 的 `dev-my` 上增加语言系统跟随、自定义 Provider 弹框简繁中文和 V1 历史模型清理；官方基线仍为 V2 2.3.0 的 `upstream/dev@f0089856c0`。
- 语言设置新增 `Follow system` 并作为首次安装默认值；系统语言变化时跟随切换，手动选择具体语言后保存该选择，旧版本已保存的 locale 按手动选择保留。
- 模型选择器与自定义 Provider 弹框全部使用 `customProvider.*` 词条，简繁中文已补齐；V1 配置保持只读锁定，但可从列表/表单删除并清理对应凭据，多来源、项目/托管来源和内置 Provider 仍拒绝删除。
- 验证通过：根目录 `bun run check` 35/35、lint 0 errors；App/core/server 的 `typecheck:tsc`；自定义 Provider 服务端 15/15；自定义 Provider 浏览器回归 10/10；语言设置回归 3/3；根语言单元测试 18/18。
- Bun 1.4.4 构建；发布脚本比较模型目录（7,855 个模型），执行 CLI 服务发现、V1 升级确认和历史迁移冒烟。实际 ASAR 含 Custom Provider 资源、`config.providers.*` 调用及简繁中文词条，内置 CLI 版本为 `opencode v2.3.0-my.4`。
- 安装包 `opencode-desktop-win-x64.exe` 为 282,075,750 字节，SHA256 为 `3b20de53bbc5ea38f4336bd6dff11726bfe8a4da0bff6805bf5561ebb88ef40c`；`latest.yml` SHA512 为 `kcXsNh94Zgpmjx0emz9cJ/W0v+iQLR5k2GGiL0jYOl3mXt4wNi70dnPQ83CUbPJO/fDygmA3HAmggj6FVgzjfA==`。本地路径为 `dist/releases/v2.3.0-my.4/`。
- 四个 GitHub 资产的服务端大小及 SHA256 与本地一致；完整公开下载安装包与 `latest.yml` 的哈希一致。Latest 仍为 `v2.2.6-my.1`；安装包未签名，Windows 安装后人工验收待本地验证。

## v2.3.0-my.3 Windows x64 测试预发行（dev-my）

- 2026-11-14 18:32:08（Asia/Shanghai）公开为测试预发行，`draft=false`、`prerelease=true`、`latest=false`。[GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.3)
- 构建源码为 `b43dac876797fa43d44ca951d82eaad7b7dd3ed5`：`dev-my` 已合入 `dev-my-models`（合并提交 `4005a3aecd`，UI 收口 `abc5450959`），官方基线为 V2 2.3.0 的 `upstream/dev@f0089856c0`。本版是自定义 Provider 与模型管理进入桌面主线后的首个 Windows 测试版。
- 模型选择器底部并列提供 `Custom providers` 与 `Manage models`；新增/编辑/删除全局 OpenAI Compatible Provider，Key 进凭据存储，支持主动 `/models` 发现、Ollama/LM Studio 原生元数据、最小文本测试、类型化高级字段与 JSONC 保留写入。Provider 删除会清理对应 integration 的已存凭据；模型删除只移除全局定义。
- 保留独立 Side bar：项目置顶/收起/计数/远程提示、按项目分组的 Recent sessions、跨服务器 Running sessions，以及后台 Shell/子智能体和模型执行的统一活动汇总。官方 Top tabs、Side tabs 和 Inbox 行为不变。
- 范围限制：Provider ID 重命名、项目级写入、任意 headers/body 编辑不做；真实 llama.cpp/SGLang/LiteLLM/私有网关与真实 Ollama/LM Studio 的版本兼容、工具/图像推理仍待人工验收；部分 Side bar 非英语词条仍为英文回退。
- 验证通过：根目录 `bun run check` 35/35 类型检查、lint 0 errors；App/core/server 的 `typecheck:tsc`；自定义 Provider 服务端 14/14；生产 Chromium 回归 10/10（底部入口、返回导航、Provider/模型删除、发现、文本测试和高级字段）；合并前 2.3.0 重验的应用单元测试 2,723 项、核心相关 94 项、生产 Chromium 113 项。
- Bun 1.4.4 构建；发布脚本重新比较模型目录（7,855 个模型），执行 CLI 服务发现、V1 升级确认和历史迁移冒烟。实际 ASAR 含 Custom Provider 资源与 `config.providers.*` 调用，内置 CLI 版本为 `opencode v2.3.0-my.3`。
- 安装包 `opencode-desktop-win-x64.exe` 为 282,078,101 字节，SHA256 为 `16c53d6a55ead01b221c82c122c52bb050a2ffce411eef6cc17b418388738ba8`；`latest.yml` SHA512 为 `Y+97LJ4GCdYj6BcDViddvwIMWPDyXnkm7jGdZL/5OJ5NCqq/xSPcccCDaysiXy5VCXj+H7xhkTmXyAoNL0irZA==`。本地路径为 `dist/releases/v2.3.0-my.3/`。
- 四个 GitHub 资产的服务端大小及 SHA256 与本地一致；公开下载 HEAD 均返回 200，安装器、清单、校验文件和 `build.json` 大小匹配。Latest 仍为 `v2.2.6-my.1`；安装包未签名，Windows 安装后人工验收待本地验证。

## v2.3.0-my.2 Windows x64 测试预发行（dev-my-models）

- 2026-11-14 13:25:51（Asia/Shanghai）公开为测试预发行，`draft=false`、`prerelease=true`、`latest=false`。[GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.2)
- 构建源码为 `4060cf9babc3d61df7ce28077838c194425b384a`：在 `dev-my-models` 上合并 Custom Provider 实现（合并提交 `1749671c3d`），官方基线为 V2 2.3.0 的 `upstream/dev@f0089856c0`；未改变 `dev-my` 桌面主线。
- 本版在模型选择器中新增/编辑全局 OpenAI Compatible provider：Key 存凭据存储，用户主动拉取 `/models` 并选择导入，支持 Ollama/LM Studio 原生元数据、最小文本测试、类型化高级字段（超时、兼容、推理选项、计费与变体），并保留未编辑 JSONC、revision 冲突检查和 V1/项目/托管只读边界。内置 Ollama/LM Studio/vLLM 发现不重复实现。
- 范围限制：provider 删除/重命名、项目级写入、任意 headers/body 编辑不做；真实 llama.cpp/SGLang/LiteLLM/私有网关与工具/图像推理仍待人工验收。
- 合并冲突为 `composer.spec.ts`、`select-dialog.tsx`、`unpaid.tsx`；移动抽屉已接入上游 `ModelDrawer` 状态机，生成客户端按仓库要求重新执行 `bun run generate`。
- 验证通过：根目录 `bun run check` 35/35 类型检查、lint 0 errors；App/core/server 的 `typecheck:tsc`；自定义 provider 服务端 5 个测试文件 13/13；移动抽屉状态机 19/19；自定义 provider 生产 Chromium 回归 8/8（串行及 2 workers 复跑）。
- Bun 1.4.4 构建，模型目录比较覆盖 7,855 个模型；CLI 服务发现、V1 升级确认与历史迁移冒烟通过。实际 ASAR 含 Custom Provider 资源与 `config.providers.*` 调用，内置 CLI 版本为 `opencode v2.3.0-my.2`。
- 安装包 `opencode-desktop-win-x64.exe` 为 282,083,431 字节，SHA256 为 `85f47e43f0bd9e09bb89b3eabc439e15af22bc48c32924c9d4f467b967816c03`；`latest.yml` SHA512 为 `fbmdkbI0y/UC/g6DgY3qVatUfY+a1YhZW5JhDKAAvEKrYsbsZdnCK4SnVESqLj84/b6K1oGdQ43BU9tmProktg==`。本地路径为 `dist/releases/v2.3.0-my.2/`。
- 四个 GitHub 资产的服务端大小及 SHA256 与本地一致；公开下载 HEAD 均返回 200，安装器、清单、校验文件和 `build.json` 大小匹配。Latest 仍为 `v2.2.6-my.1`；安装包未签名，Windows 安装后人工验收待本地验证。

## v2.3.0-my.1 Windows x64 测试预发行（dev-my-models）

- 2026-11-14 11:14:19（Asia/Shanghai）公开为测试预发行，`draft=false`、`prerelease=true`，发布时设置 `--latest=false`。[GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.3.0-my.1)
- 构建源码为 `fb4b28252b9a06bea58af3ad26311075881235a2`：将 `dev-my@50295da4da6e159483b80aaf7f611b414e27ec5d` 合入 `dev-my-models`，官方基线为 V2 2.3.0 的 `upstream/dev@f0089856c0`；合并无冲突。
- 该分支相对 `dev-my` 仅增加 Custom Provider 设计文档及其入口，尚未实现文档描述的模型管理功能。运行时代码与已验证的 `dev-my` 一致，包含下节记录的新侧栏分组、Recent 视图、会话排序及本地 Side bar 补丁。
- 合并后完整 `bun run check` 35/35 项通过；桌面安装器配置、项目选择器、服务连接与迁移状态机测试 25 项通过。相同运行时代码的 App 官方 TypeScript 检查、2,723 项应用单元测试、94 项核心测试、113 项生产 Chromium 回归及额外 E2E 类型检查的限制见下节源码同步记录。
- Bun 1.4.4 构建，模型目录比较覆盖 7,855 个模型；CLI 服务发现、V1 升级确认与历史迁移冒烟通过。NSIS 完整性、实际 ASAR/CLI 版本、项目管理资源、固定标签更新源及清单 SHA512/大小已核验。
- 安装包 `opencode-desktop-win-x64.exe` 为 281,928,299 字节，SHA256 为 `0f379fcb97fb527eaf1b30c62b8856465a9ace412943aa319f09dd5000837a7c`。本地路径为 `dist/releases/v2.3.0-my.1/opencode-desktop-win-x64.exe`，附 `latest.yml`、`SHA256SUMS`、`build.json`。安装包未签名，Windows 人工安装验收待本地验证。
- 四个 GitHub 资产的服务端大小及 SHA256 与本地一致；三份清单完整公开下载、安装器公开下载入口、总大小及 65,536 字节文件头均已核验。Latest 仍为 `v2.2.6-my.1`，其 10 个既有资产的 ID、大小及摘要保持一致。源码标签固定在上述构建提交，发行文档另行提交到 `dev-my-models`。

## 2026-11-14：同步官方 dev 至 2.3.0 源码

- 从 `upstream/dev` 合入 `f0089856c07eded13396a0a0d05f19f1718be7b9`，相对上一基线新增 227 个提交；`origin/dev` 同步为该官方提交的镜像。
- 保留独立 Side bar、项目计数、完整会话索引与 Running，接入上游共享会话排序、新侧栏分组和 Recent 视图；适配后台作业活动通知及子会话测试依赖。
- 修正本地与上游隐藏会话词条重名，以及新增灰阶检查在 Windows 路径下无法匹配既有例外的问题。公共协议合并后重新运行客户端生成器。
- 验证通过：根目录 `bun run check`（35/35 项）、App 官方 TypeScript 检查、应用单元测试 2,723 项、核心作业/活动/执行/子会话测试 94 项，以及生产 Chromium 的 Home/标签/Side bar 回归 113 项（无重试）。共享索引和侧栏排序用例重复 10 次，合计 210 项通过。浏览器回归验证了重命名缓存、关闭菜单及执行完成后的重排。
- 额外的 `typecheck:e2e` 未通过：共 190 条诊断，包含其他回归用例的旧字段、未使用变量及 E2E 配置缺少 CSS/Vite 类型等；本轮修改的 Home/tabs 用例和 mock-server 未报类型错误。Home 性能基准 `exp_d319fa` 因测试浏览器 CDP 连接中断而未完成，不据此作性能结论。
- 本次为源码同步，已验收的 `v2.2.6-my.1` 安装包、标签与 Latest 发行保持原样。

## v2.2.6-my.1 Windows x64 与 Linux amd64/arm64 正式发行

- 2026-11-10 18:45:29（Asia/Shanghai）公开为测试预发行，`draft=false`、`prerelease=true`，发布时设置 `--latest=false`。[GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.2.6-my.1)
- 2026-11-10，用户确认 Windows 本地验证通过；沿用同一源码标签和四个已验证资产，转为正式发行（`prerelease=false`）并设为 GitHub Latest。
- 构建源码为 `231de37312ef7172cb6be387ea89d6a427934555`。维护分支 `dev-my` 合入官方 `dev@57719d7fd400721783a059fee78c7d33a21cd9b6`，相对上次官方基线新增 78 个提交，版本更新为 2.2.6。
- Side bar 增加项目计数、固定项目下置及按需显示的 origin/upstream 提示。保留 my.7 的 Home/Side bar 共享项目缓存、会话索引和 Running 分支加载实现，避免引入旧贡献稿的重复逻辑。
- 合入官方会话已读/未读菜单、侧面板关闭与恢复快捷键、GitHub Copilot Auto、OpenAI/Google/Vertex 嵌入模型入口，以及 OAuth 刷新、Claude Agent 会话、缓存预热和会话生成用量统计修复。
- 简洁性审阅：远程提示复用现有 VCS 缓存，不增加独立轮询或持久化；Copilot Auto 复用模型解析 hook，嵌入模型复用请求执行器。新增远程信息放入 `experimental.remotes`，客户端与 OpenAPI 由生成器更新；修正带凭据和端口的 HTTPS 地址被误判为 SCP 地址的问题，提示移除凭据、查询参数和片段，并保留端口。地址回归用例已验证修复前失败、修复后通过。
- 按本仓库明确约束保留服务端非阻塞插件加载，未采纳官方本轮临时等待插件并超时返回 503 的补丁。
- 根检查 34/34 项、App 官方 TypeScript 检查、相关单元测试 222 项、生产 Chromium 回归 115 项及 Side bar 重点重复回归 40 项通过；浏览器测试均无重试。VCS 套件在本机默认 30 秒预算下出现真实 Git 进程超时及随后清理临时目录的 `EBUSY`，诊断运行中的远程信息用例通过，未将整套 VCS 测试记为通过。
- Bun 1.4.4 构建，模型目录比较覆盖 7,676 个模型；CLI 服务发现、V1 升级确认与历史迁移冒烟通过。NSIS 完整性、实际 ASAR/CLI 版本、项目管理资源、固定标签更新源及清单 SHA512/大小已核验。
- 安装包 `opencode-desktop-win-x64.exe` 为 281,699,674 字节，SHA256 为 `cadb9c9c32c8ce331e8c19d5482a9318632e7a07ec6c504096f3cbd8c4cdc9dd`。本地路径为 `dist/releases/v2.2.6-my.1/opencode-desktop-win-x64.exe`。安装包未签名，Windows 本地安装验证已由用户确认通过；初次发布仅含 Windows x64，Linux 追加记录见下。
- Windows 初次发行时，四个 GitHub 资产的服务端大小及 SHA256 与本地一致；三份清单的完整公开下载、安装器公开下载入口、总大小和 65,536 字节文件头均核验通过。源码标签固定在上述构建提交，发行文档另行提交。
- 原 `origin/dev@171d675ae1a233c891c13f47e68003bc99aeb3a7` 的 fork 历史已完整保存到 `origin/dev-my`，随后使用租约校验将 `origin/dev` 恢复为上述官方提交的镜像。默认分支仍为 `dev-my`。
- 2026-11-13（Asia/Shanghai），在同一正式 Release 追加 Linux amd64/arm64 的 AppImage、deb 和两份更新清单。构建使用同一不可变源码标签及 Windows 模型快照，快照 SHA256 为 `6a14794d0dc259042e56fc52b1e974cdd091247a99c3ba23d1c9490e330ed087`。
- Linux 环境为 Ubuntu 24.04.5 容器、Node 24.15.0、Bun 1.4.4。完整检查 34/34 项通过；两个架构各比较 7,676 个模型，并通过 CLI 服务发现、V1 升级确认和历史迁移冒烟。
- 四个安装包均已实际解包，核验 Electron、CLI、终端组件的架构、ASAR 版本与界面资源、桌面入口、metainfo 及更新源；同架构 AppImage/deb 的 ASAR 与 CLI 相同，包内 CLI 与构建所用二进制一致。两份 Linux 更新清单的 SHA512、文件大小和目标架构匹配。
- ARM64 AppImage 沿用静态启动器（`toolsets.appimage=1.0.3`）。ARM64 CLI 及 AppImage 解包通过 QEMU 执行。
- 2026-11-13（Asia/Shanghai），用户确认 Linux 本地验证通过；Windows 与 Linux 的本地验收均已完成。
- 联合 `SHA256SUMS` 覆盖全部 5 个安装包，`build.json` 记录三个构建目标。全部 10 个 GitHub 资产的大小及 SHA256 均已验证，公开清单完整下载与各安装包的 65,536 字节范围下载均匹配本地。原 Windows 安装包与 `latest.yml` 的资产 ID、大小及摘要保持一致；Release 仍为正式版及 Latest。

| 安装包 | 字节 | SHA256 |
| --- | ---: | --- |
| `opencode-desktop-linux-x86_64.AppImage` | 328,499,886 | `886b4fa551c18ed4cb8e40560bdf542351044a74df5436db6f02ac1a4559fd04` |
| `opencode-desktop-linux-amd64.deb` | 274,221,356 | `9719ce99d315e19ee8d777e3c256b714c5a79110bd13c60696ff17929c84f8d9` |
| `opencode-desktop-linux-arm64.AppImage` | 306,429,237 | `3b9cebd88087adf8a86bef9daa07690ce430deaeb7cf6df847b86041b0c4ea8f` |
| `opencode-desktop-linux-arm64.deb` | 263,897,780 | `d7052aeb250c5814d2f12d1ff7feadc7a2c0c5786c7f2d9eb40e375ca9c422ae` |

## v2.2.5-my.7 Windows x64 与 Linux amd64/arm64 正式发行

- 2026-11-09 17:23:21（Asia/Shanghai）公开为 Windows x64 测试预发行，`draft=false`、`prerelease=true`，设置 `--latest=false`。[GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.2.5-my.7)
- 构建源码为 `5e4e2bd7033fa86e3beaf8026f25e26ec5fab21f`，已合入官方 `dev@12a661ea40`。Side bar 的项目、会话行、草稿和 Running 各有独立模块。Home 和 Side bar 共用项目操作与会话索引，项目清单与保留的会话行共用一个缓存快照。
- Running 保留全局后台活动与子会话显示，复用 Inbox 的分支重试和时长格式化，按会话行加载信息及待处理请求。
- 完整检查 33 项、正式 App TypeScript 检查、相关单元测试 46 项和生产 Chromium 回归 102 项通过。模型目录比较覆盖 7,645 个模型，CLI 服务发现与 V1 历史迁移冒烟通过。
- NSIS 完整性、ASAR 和内置 CLI 版本、固定标签更新源、清单和四个远端资产摘要已核验。安装包 `opencode-desktop-win-x64.exe` 为 281,676,454 字节，SHA256 为 `9b3ea0ef4cc60199b462c8b247d41bc2ea805522c5142089529c88f13cfc5826`。安装包未签名。
- 2026-11-09（Asia/Shanghai），用户确认 Windows x64 安装和 Side bar 项目管理手工测试均通过。
- Windows 验收通过后，以同一不可变标签和同一模型快照在 Ubuntu 24.04 容器中构建 Linux x64、ARM64 的 AppImage 和 deb。ARM64 AppImage 使用 Electron Builder 的静态启动器（`toolsets.appimage=1.0.3`）。GitHub Release 已转为正式发行并设为 Latest。
- Linux 完整检查 33 项通过。两种架构的 7,645 个模型目录、服务发现、V1 迁移及历史冒烟通过。已从实际安装包核验 ELF、ASAR、CLI、原生终端组件和更新源。ARM64 冒烟使用模拟环境，Linux 桌面未做人工验收。
- 两份 Linux 更新清单和全部 10 个 GitHub 资产的大小与摘要已核对。联合 `SHA256SUMS` 覆盖 5 个安装包，`build.json` 记录三种构建目标。安装包未签名。

## v2.2.5-my.6 Windows x64 测试预发行

- 2026-11-09 00:36:36（Asia/Shanghai）公开为 Windows x64 测试预发行，`draft=false`、`prerelease=true`，发布时设置 `--latest=false`。[GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.2.5-my.6)
- 构建源码为 `ca61e332a34fa4bd2aa1eeef9c11930817bbf3ba`，基于已同步官方 `dev@caf8d6a554ecd988767c08f1f15508849eff8728` 的 `dev-my`。用户于 2026-11-08 确认 Windows 安装后的手工测试通过，`project-management` 随后快进合入 `dev-my`。
- 吸收 [PR #2](https://github.com/joe-ieta/OpenCode.My/pull/2) 的 Home 项目管理共享思路：Side bar 增加相同的项目菜单及添加项目入口，支持编辑、复制路径、关闭/重新打开、导入/新建会话及导出会话。Side bar 只按项目显示，栏目使用 Projects，保留草稿和运行会话；同时修复新草稿在冷加载时未及时持久化的问题。
- 合入前完整根检查 33 项、相关单元测试 35 项、生产 Chromium Home/标签回归 102 项及重点重复回归 30 项通过；浏览器回归均无重试。
- 合入后重新构建生产界面，6/6 Chromium 冒烟通过（三 workers、无重试），覆盖 Home/Side bar 项目共享、项目菜单与编辑、关闭/重新打开后的草稿及运行会话保留、整组收起、历史同步和旧 List 设置兼容。
- 使用 Bun 1.4.4 构建。模型目录完整比较 7,660 个模型；单次请求遇到五秒插件激活超时后，通过已有 `--via-server` 模式复验。隔离的服务发现、V1 升级确认及迁移历史冒烟通过。
- 实际安装包的 ASAR/CLI 版本、项目管理资源、NSIS 完整性、固定标签更新源、SHA256SUMS 和更新清单 SHA512/大小均通过校验；产物未签名。
- 安装包位于 `dist/releases/v2.2.5-my.6/opencode-desktop-win-x64.exe`，281,873,709 字节，SHA256 为 `5bd579bd793ca7671e33e6b9f57d7aacb53ba5f5b85241aff05b3a12408223bb`。源码标签固定在构建提交，四个 GitHub 资产的服务端大小及 SHA256 与本地一致。
- 三份清单的完整公开下载与本地一致；安装器公开下载入口、总大小及 65,536 字节文件头均已验证。稳定 Latest 接口仍返回 404，本次未改变 Latest。临时分支 `project-management` 的本地和远程引用已在确认完全合入且无开放 PR 后删除。

## v2.2.5-my.5 Windows x64 测试预发行

- 2026-11-06 01:27:28（Asia/Shanghai）公开为 Windows x64 测试预发行，设置 `--latest=false`。[GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.2.5-my.5)
- 构建源码 `02457d62e2dc12674041aaf5dc6dedcea04e1291` 合入官方 `dev@1009033569e3a31bcfc1dab857c2a66db82dbdeb` 和 PR `2de04af2cd0ca555b8393ecb1411e46663d694bb`。应用标识为 `ai.opencode.desktop.dev-my`，更新源固定在本发行标签。
- Inbox 首屏通过上游状态机等待活动快照和工作会话的权限及表单查询。超时后展示已有内容，之后的活动更新继续刷新现有界面。
- PR 根检查 35 项、应用相关单测 22 项、客户端会话数据测试 35 项、生产 Chromium 回归 19 项通过。修复前的两次隔离对照均复现 Inbox 提前展示。发行源码根检查 35 项和生产 Chromium 回归 21 项通过。
- Bun 1.4.4 构建，比较 7,658 个模型，通过服务发现、V1 升级确认和历史迁移冒烟。NSIS、内置 ASAR 与 CLI、固定标签更新源及 `latest.yml` 校验通过。安装器 `opencode-desktop-win-x64.exe` 为 281,105,297 字节，SHA256 为 `b9db3afbf5498c28430635ff5ed82d81e2bb27edbff0461da63d22c6ec709b5c`。四个 GitHub 资产的服务端摘要及公开下载均与本地一致。
- 安装包未签名，Windows 安装后人工验收待完成。

## v2.2.5-my.4 Windows x64 测试预发行

- 2026-11-05 23:54:42（Asia/Shanghai）公开，`draft=false`、`prerelease=true`，发布时设置 `--latest=false`。提供 Windows x64 完整安装包。[GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.2.5-my.4)
- 构建源码 `0eb91d7ea1b2d40326673d231c1bfb673d6713df` 合入官方 `dev@6bd47192ac97527e9fdc5e64c36fd4730aec2acd` 及 Side bar 贡献稿 `ad6923e0c30de156d951a240b511646d865d8ea2`。应用标识为 `ai.opencode.desktop.dev-my`，更新源固定在本发行标签。
- 底部 Running 随模型执行和后台 Shell 活动刷新。活动会话在项目内置顶，结束后将重新计算的顺序保存到已有手动排序的列表。Inbox 首屏等待活动状态同步后显示提示。
- 自动验证通过根检查 35 项、应用单元测试 2,406 项和生产 Chromium 回归 180 项。Bun 1.4.4 构建，比较 7,658 个内置模型，通过服务发现、V1 升级确认和历史迁移冒烟。独立 E2E 类型检查仍有 12 条上游基线已有的 fixture 诊断。
- 已核对 NSIS 完整性、内置 ASAR 与 CLI 版本、更新源及 `latest.yml` 的 SHA512 和大小。安装器 `opencode-desktop-win-x64.exe` 为 281,014,299 字节，SHA256 为 `c460b738fe7d26a0aa5789e8873f7559b84051509af200446bc30028e30e9d58`。四个 GitHub 资产的服务端摘要及公开下载均与本地一致。
- 安装包未签名，Windows 安装后人工验收待完成。

## v2.2.5-my.3 Windows x64 测试预发行

- [GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.2.5-my.3) 于 2026/11/3 15:28:47（Asia/Shanghai）公开，`draft=false`、`prerelease=true`；仅发布 Windows x64，本轮未重建 Linux。
- 不可变构建源码为 `97c429b635882143714d13702defda324b3d818f`，版本号改为 `2.2.5-my.3`，应用标识仍为 `ai.opencode.desktop.dev-my`。后续文档合并提交不作为二进制构建来源。
- 修复模型执行结束后后台 Shell 未纳入会话活动汇总的问题。兼容旧后端活动接口 404，侧栏、Running 与根会话标题跟随 Shell 活动显示和清除；模型执行、排队和中断状态保持独立。只读现场核验确认模型空闲、Shell 运行时汇总仍忙碌，服务注册未改变。
- 包含项目名称排序、独立固定区域及 40% 上限、滚动条、折叠未读提示、底部最多五行 Running 区域、无占位的悬浮操作、草稿标识，以及右键菜单 Close。
- 自动验证：根检查 35/35；Home/tabs 73/73、零重试；客户端相关测试 40/40；桌面打包相关测试 24/24。应用及客户端官方 TypeScript 检查通过，E2E 仍有原有 13 处类型诊断。
- Bun 1.4.4 构建；模型目录比较覆盖 7,657 个模型，CLI 服务发现、V1 升级确认与历史迁移冒烟通过。实际 ASAR/CLI 版本、既有 31 个中文词条、更新源、NSIS 完整性及 latest.yml 的 SHA512/大小均已核验。
- 安装器 `opencode-desktop-win-x64.exe` 为 279,878,027 字节，SHA256 `a8b78309bdd88521d6831cedc081c3dd36c1fe193a4b26596aa093259f77fe96`。四个远端资产大小及 SHA256 与本地一致；四个公开下载文件再次核对一致。
- 安装包未签名；用户于 2026-11-03 确认 Windows x64 安装后人工验收通过。验收后按用户要求将对应界面改动整理同步至 PR #60867，来源提交 `703db47378ab63960fc53899b0ae389b9dc3994d`，保留 Draft 等待上游设计评审。未重启用户应用或后台，也未发送测试邀请。
- 合并了 GitHub 上并行的文档更新；Gitee 不再作为远端或发行目标，未上传本版任何数据，也未清理历史远端资产。

### 2026-11-03 验收后的 PR 更新

- 既有 [PR #60867](https://github.com/anomalyco/opencode/pull/60867) 从 `b88b94a75d` 更新为 `703db47378`，先同步官方 `dev@3ba597f776`，再迁入已验收的 Side bar 改动；维护仍统一在 `dev-my`，贡献工作区保持 detached。
- 差异共 41 个文件：38 个应用文件及客户端 Shell 缓存读取、图标类型和目录；不包含 fork 服务端/协议、goal state、品牌或发行代码。复用已有 Shell 列表和事件，没有新增 HTTP 接口。
- 独立贡献验证：根检查 35/35，应用/客户端官方 TypeScript 检查通过，客户端数据测试 35/35，生产 Home/tabs 77/77，关键场景五并发重复 50/50、零重试。E2E 原有 13 处类型诊断保持不变；Windows 声明链接仅在检查时按导入解析，已恢复且不进入 PR。
- 导航基准前后各串行三次：内容首次显示中位数 551.5→511.4 ms，全部里程碑稳定 635.9→566.8 ms。此对照包含上游同步，小样本不用于推断性能提升；原始记录位于贡献工作区 `.cache/pr60867-{before,after}-benchmark.log`。
- PR 描述已更新为当前布局，并替换过时截图为 240×72 动画 SVG。GitHub check-standards/check-compliance 通过，PR 可合并但保留 Draft；人工验收不等于上游设计批准。

> 以下为历史发行事实。出现的旧 Gitee、分卷及远端名称只用于来源追溯，不是当前配置或发布步骤；以顶层 [AGENTS.md](../../../AGENTS.md) 为准。

## v2.2.5-dev-my.2 Windows / Linux 测试预发行

- [GitHub Release](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.2.5-dev-my.2) 于 2026-11-02 17:09:40（Asia/Shanghai）公开，`draft=false`、`prerelease=true`；十个资产均已完成服务端 SHA256/大小独立核对。三份公开更新清单与本地字节一致（HTTP 200），Windows 安装包与两架构 AppImage 的公开入口及 PE/ELF 文件头验证通过（HTTP 206）。稳定 Latest 独立查询仍为 `v2.2.3-dev-my.3`。

- 构建源码与不可变标签：`3777b783c5647651707cccc939c25ccdb09e27ff` / `v2.2.5-dev-my.2`。同步官方 `dev@ff90ed9160`（V2 2.2.5），相对前次 `69269e4ebe` 新增 53 个提交；先以 `0779e086ec` 整合既有 Side bar 贡献历史，再以 `3777b783c5` 合并上游。Windows x64 与 Linux x64/arm64 均从此提交构建。
- 保留项目整组收起/展开及持久化、项目内与平面列表排序、深层子智能体祖先状态恢复、相反文字方向标题修复和既有 31 个中文词条。官方 Top tabs、Side tabs、Inbox 及原有布局偏好保持原语义。
- 验证：Windows 和 Ubuntu 根检查各 35/35；最终 PR 分支两平台根检查各 35/35、应用单元 948 项、Linux browser 条件 303 项（默认超时）、生产 Home/标签回归 67/67（五 workers、无重试）。发行源码的应用正式 TypeScript 检查通过；Windows 安装器/打包配置 18 项通过。Windows browser 条件测试在并行构建期间对实际启动子进程采用 30 秒预算后 303/303 通过，测试断言与产品代码未为此修改。
- 使用 Bun 1.4.4；三个目标的模型目录均完整比较 7,653 个模型，服务发现、共享 V1 数据库、升级确认及迁移历史冒烟通过。Windows 的一次独立目录冒烟遇到五秒插件激活超时，随后复用同一已编译 CLI，以已有 `--via-server` 路径通过，继续执行相同桌面打包阶段。
- 实际 Windows ASAR/CLI 版本、四种模式、收起状态键、中文词条、固定标签更新源、NSIS 7-Zip 完整性与清单 SHA512/大小均已核对；Linux 两架构的 AppImage/deb 已实际解包，ASAR 内容一致，ELF/deb 架构、版本、桌面/metainfo、更新源与两份更新清单均通过核验。
- [Gitee Windows 测试版](https://gitee.com/ieta/opencode-my/releases/tag/v2.2.5-dev-my.2) 已公开为预览版本，八个附件全部从公开下载入口读回并比较大小和 SHA256。三卷分别为 94,371,840、94,371,840、91,118,164 字节，均小于 100 MB；合并 SHA256 与完整安装包相同。GitHub 提供全部平台完整资产，Gitee 仅提供 Windows 分卷及清单。
- 用户已于 2026-11-02 确认此前 Windows 2.2.5 测试包手工测试通过；本次同步后的新包尚未执行安装后 GUI 人工验收，Linux/原生 ARM64 GUI 未人工验收。所有目标未签名，Windows Authenticode 为 `NotSigned`；固定标签更新源的后续版本需手动下载安装。
- 用户确认本次二进制只包含冻结时已提交的内容。并行任务随后提交的 Session activity / goal state 工作保留于维护线 `dev-my`，并通过 `453084892e` 合回本次源码同步；它不属于 `v2.2.5-dev-my.2` 标签或安装包。合回后客户端重新生成无差异，完整检查 35/35、客户端回归 40 项、核心活动回归 2 项通过；维护线与记录分别推送 GitHub/Gitee，源码标签保持固定。
- [PR #60867](https://github.com/anomalyco/opencode/pull/60867) 已按用户本次明确要求更新到 `b88b94a75d3d517c3bbd417274392e326b7cb1e7`，基线 `ff90ed9160`，仅 35 个应用层文件。项目收起、后代活动、RTL 标题与原有分组/排序回归已同步；未混入 fork 发行、品牌或 Session activity 协议改动。本地 `sidebar-mode` 分支已删除，远端仅冻结保留 PR 来源引用，不再并行开发；旧 `sidebar-projects` 在 GitHub/Gitee 均已删除。本地旧项目工作区原以 `dev` 指向 `966e97bf71`，现已转为 detached 历史检出并删除该旧本地分支；文件及 `refs/archive/sidebar-projects` 归档引用保留。未发送测试邀请。

| 安装包                                   |        字节 | SHA256                                                             |
| ---------------------------------------- | ----------: | ------------------------------------------------------------------ |
| `opencode-desktop-win-x64.exe`           | 279,861,844 | `e664ea654fa54e781595626318c45bdfed60d299d80100a39f3ddf3c8734e304` |
| `opencode-desktop-linux-x86_64.AppImage` | 326,174,875 | `fe36733779c9ef098c4b2a5718d9fd9838af7b0abeae5b8ed868d46ad37ae436` |
| `opencode-desktop-linux-amd64.deb`       | 272,189,848 | `5209067a4d95d8005e9661648ba20608b728208073b6ea0c30357685a6d281de` |
| `opencode-desktop-linux-arm64.AppImage`  | 326,049,295 | `97a145f3534fb02349e92ad5335ae4c8a18d85527fe02bb2fa25e76f7d3f9212` |
| `opencode-desktop-linux-arm64.deb`       | 261,869,328 | `b81c0547499adb7430a1c2aae44a114342feedebdae965fa4b1f79bf84c325ac` |

## v2.2.5 源码同步（2026-11-01）

- 同步目标 `upstream/dev-my@8593792301`，相对上次共同基线 `3747a8caa9` 吸收 84 个上游提交；官方基线由 V2 2.2.3 `dev@e7acf85bb7` 推进到 V2 2.2.5 `dev@69269e4ebe`（官方段 81 个提交），并包含 fork 的 `ca18869aaa`（深层子智能体状态与项目整组收起）和 `8593792301`（Windows 2.2.5 测试包准备记录）。
- 上游 2.2.4 的主要变化：持久桌面终端及其重命名、实验性交互 artifacts、Claude Agent 引导安装、worktree 基础分支快捷键等。
- 上游 2.2.5 的主要变化：worktree 与 Shell 模式快捷键、引用弹窗直接发送、`compaction.buffer` 支持百分比，以及 MCP/stdio、上下文压缩和推理恢复等修复；完整清单见 `CHANGELOG.md` 的 v2.2.4 与 v2.2.5。
- 本地保留独立 Side bar、Gitee Windows 分卷、V1 升级与迁移、SQLite/Layer 诊断和桌面发行脚本；本次未改动两条 headless 分支。文档继续按 Gitee `origin` 与 GitHub fork `upstream` 的关系维护。
- 验证：`bun install --frozen-lockfile` 无依赖变化；`bun run check` 35/35 通过（本机需以 `NODE_OPTIONS=--experimental-strip-types` 加载 oxlint 的 TypeScript 插件）；从 `packages/client` 重新执行 `bun run generate`，生成客户端与合并结果一致。
- 本次只同步源码并更新发行记录，不构建或发布新安装包；Windows `2.2.5-dev-my.1` 仍为未公开的发行草稿。

## v2.2.5-dev-my.1 Windows x64 测试包准备

- 构建源码：`ca18869aaa1b8c92e93c7db5a1d803e78830eefc`。合并官方 `dev@69269e4ebe309a08919b3c9be7948b9fd699c3a4`（V2 2.2.5），相对前次上游基线新增 81 个提交；合并提交为 `a7b90e8444`。SQLite 冲突采用上游官方客户端并保留数据库文件名错误诊断，V1 迁移文档保留本地确认与备份说明。
- 修复深层子智能体执行时，因祖先元数据缺失而使顶层会话错误显示空闲的问题；Home 与 Side bar 同步受益。仅按需读取元数据，不读取祖先对话内容或改写服务器执行状态。
- 项目标题增加整组收起/展开，按服务器及项目路径保存状态；收起后仅保留标题、计数和新建入口，与五条预览/More 独立。List 和运行概览继续保留，新建时展开项目。两个新增无障碍标签先提供英文源，既有 31 个中文词条保留。
- 动画问题已定位：本机 Windows 客户端区域动画关闭，应用设置为跟随系统，因此主会话和子智能体图标均按官方减少动态效果设计保持静态。应用内将“减少动态效果”设为关闭即可允许动画。本轮没有覆盖系统偏好或修改共用 Spinner。
- 验证：完整根检查 35/35；应用单元 948 项、browser 条件 303 项；数据库 67 项通过、2 项 Windows 条件跳过；完整生产 Home/标签回归 67 项无重试，最终无障碍标题/分组/状态/动画专项 5 项无重试；Windows 安装器及打包配置 22 项通过。新回归在修复前复现了缺失整组收起与深层子智能体状态错误。
- 生产导航基准修改前后三次：内容首次显示中位数 386.2 → 382.0 ms，稳定显示中位数 432.2 → 432.3 ms。小样本未见明显退化，不作为通用性能保证。
- Bun 1.4.4 完成 Windows x64 构建；模型目录完整比较 7,656 个模型，服务发现、V1 确认与迁移历史冒烟通过。实际 ASAR/CLI 版本、Side bar 功能标记、31 个中文值、固定标签更新源、清单 SHA512/大小及 7-Zip 完整性均已核对；Authenticode 为 `NotSigned`。尚未完成安装后的 GUI 人工验收。
- 安装器 `opencode-desktop-win-x64.exe`：279,868,420 字节，SHA256 `d5a3eea642d70fadc007d96a5dc8b88b94d23bc2f68f17fcc142f0d25d197cdc`。本地目录为 `dist/releases/v2.2.5-dev-my.1`。
- [发行草稿](https://github.com/joe-ieta/OpenCode.My/releases/tag/untagged-883f9a89dc0f7c23428d) 的四个资产已全部上传并独立核对服务端 SHA256/大小与本地一致，`draft=true`、`prerelease=true`、`published_at=null`；尚未公开，不能使用公开下载入口。稳定 Latest `.3`、Windows 最新公开测试版 `.6`、Linux 最新公开测试版 `.5` 均保留。临时传输探针资产已清理。
- 继续维护于 `dev-my`，未修改或新建 PR，未发送测试邀请。

## v2.2.3-dev-my.6 Windows x64 中文测试预发行

- 发行页：[v2.2.3-dev-my.6](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.2.3-dev-my.6)，2026/10/31 22:12（Asia/Shanghai）已公开，`draft=false`、`prerelease=true`。稳定 Latest 仍为 `v2.2.3-dev-my.3`，Linux 最新测试版仍为 `v2.2.3-dev-my.5`。
- Gitee Windows 分卷：[v2.2.3-dev-my.6](https://gitee.com/ieta/opencode-my/releases/tag/v2.2.3-dev-my.6)，仅含 Windows 分卷和 Windows 清单；Linux/macOS 走上游。
- 构建源码：`9506fb6d69e9470cd97e3bb834339bf5f82120bf`；只增加前次缺少的 29 个 Side bar 简体中文词条及翻译核对记录。相关键现有中文 31/31，占位符与英文源一致，英文源和其他语言未修改。术语、语义和参考语料见 [中文翻译核对](sidebar-zh.md)。
- Windows 包含独立 Side bar 及此前的标题方向修复；官方三种模式、后台项目登记、会话历史和权限模型不变。Linux `.5` 安装包未重新构建，不包含本次新增中文词条。
- 验证：完整根检查 35/35；既有语言测试 21/21（467 项断言）；Windows 安装器/打包配置测试 18/18。隔离生产界面覆盖 0/1/2 个运行会话、小时/天、空项目、分组/列表、更多/收起、隐藏提示、项目新建、悬浮详情及设置卡片；截图已复核。
- 使用 Bun 1.4.4 完成正式 Windows x64 构建；本轮 CLI 模型目录比较覆盖 7,646 个模型，服务发现、V1 升级确认及迁移历史冒烟通过。实际 ASAR 内的 31 个相关中文值均已核验，ASAR/CLI/安装器版本正确，7-Zip 完整性、固定标签更新源及 `latest.yml` 的 SHA512/大小均通过。
- 安装器 `opencode-desktop-win-x64.exe`：277,954,927 字节，SHA256 `ae83752b76955f50406c225f178aefe98427ca784d89a6fbeb4ef3fec258ce26`。四个 GitHub 资产的大小、SHA256 与本地一致；公开清单内容与本地一致，安装器公开下载和 PE 文件头已验证。产物未签名，本版尚未完成安装后的 Windows GUI 人工验收。
- 继续维护于 `dev-my`；本次未修改或新建 PR，未发送测试邀请，后续也不再发送。
- 沿用已确认的保留策略，在 `.6` 公开并核验后删除被替代的 Windows `v2.2.3-dev-my.4` Release 及 4 个资产（277,958,267 字节），源码标签保留。现保留稳定 `.3`、Linux 测试 `.5`、Windows 测试 `.6`；旧 `.4` 的历史发行页/下载链接失效，人工验收记录仍保留。

## v2.2.3-dev-my.5 Linux amd64/arm64 测试预发行

- 发行页：[v2.2.3-dev-my.5](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.2.3-dev-my.5)，2026/10/31 21:32（Asia/Shanghai）已公开，`draft=false`、`prerelease=true`；稳定 Latest 仍为 `v2.2.3-dev-my.3`，Windows 最新测试版仍为 `v2.2.3-dev-my.4`。
- Gitee 不保存本 Linux 版本资产，请使用上述上游 Release。
- 构建源码：`31d67160e0d5c96f760227ab7b9f4ab65258c919`，基于 V2 2.2.3，使用 Bun 1.4.4 在 WSL Ubuntu 24.04 的独立原生工作区构建；amd64 原生编译，arm64 经 QEMU/binfmt 交叉构建。标签固定在构建源码，发行记录另行提交到维护主线 `dev-my`。
- 提供独立 Side bar 模式，保留官方 Top tabs、Side tabs（vertical）和 Inbox。相对 Windows `.4` 增加相反文字方向标题的对齐修复，仅作用于 Side bar，不修改官方模式、后台 Project 登记或公开 API。
- 国际化核对：31 个相关英文词条、63 个语言字典；未发现硬编码可见文案、缺失英文回退或占位符不一致。非英语界面中仍有 29 个相关词条使用英文回退，本轮未批量翻译。语言测试 21/21（467 项断言），英语/简体中文/法语/阿拉伯语生产界面及 RTL 截图已核对。
- 验证：Windows 与本轮 WSL 根检查均 35/35；方向修复生产构建 Home/标签回归 65/65，无重试。两架构 CLI 版本正确，模型目录各完整比较 7,648 个模型，服务发现、V1 升级确认与迁移历史冒烟均通过。Linux 发行工具复用已有 `--via-server` 路径等待插件激活；合成凭据触发的外网发现仅在目录冒烟进程中限制，其他构建下载使用现有本机代理。
- 官方 V2 模型目录经 Windows 实时取得并通过现有 schema 校验，再由临时本地镜像供 WSL 构建读取；使用同一份快照比较内置目录。临时镜像和代理地址未固化到产品，不作为运行时更新源。环境设置与辅助文件均未提交。
- 两架构 AppImage/deb 已实际解包，ASAR 内容一致，四模式与 RTL 修复标记存在；ASAR/内置 CLI 版本、ELF/deb 架构、deb 元数据、桌面文件、metainfo、固定标签更新源、两份更新清单 SHA512/大小及 SHA256SUMS 均通过核验。
- 8 个 GitHub 资产的服务端大小与 SHA256 均匹配本地；公开下载的两份更新清单与本地完全一致，两个 AppImage 的公开下载入口及 ELF 文件头已核对。安装包未签名，本轮未执行 Linux GUI 人工验收，arm64 GUI 未在原生机器运行。
- 交叉环境的 ARM 系统根缺少 AppImage 自解包所需 `libz.so`，arm64 AppImage 内容使用原生 `unsquashfs` 核验；该 AppImage 的运行时/GUI 启动不作为本轮通过项。两架构 Electron/CLI 的 ELF 头均正确，AppImage 与 deb 内置 CLI 哈希一致。

| 安装包                                   |        字节 | SHA256                                                             |
| ---------------------------------------- | ----------: | ------------------------------------------------------------------ |
| `opencode-desktop-linux-x86_64.AppImage` | 324,071,050 | `4ea250b92bcf22b11dc6a1b609184c3875d1f27960c511986d617d85d7719244` |
| `opencode-desktop-linux-amd64.deb`       | 270,318,772 | `21a6a8d997a422713f0dadcff07a1135e3ab642a906cba0a1e880a34c79cca16` |
| `opencode-desktop-linux-arm64.AppImage`  | 324,087,839 | `7ecac70310165527e48d5f56e3a068e01eb4f2808e95ef7775b1f671c4591474` |
| `opencode-desktop-linux-arm64.deb`       | 260,156,184 | `57c014465d45863c27a0d809603718e266bf500db52e388c4e53bc6eb5798e3a` |

本轮不修改、新建 PR；未发送测试邀请，后续也不再发送。维护约束见 [维护方法](../maintenance.md)。

## 历史发行清理（2026-10-31）

按用户确认，保留稳定 Latest `v2.2.3-dev-my.3`、Windows 最新测试版 `v2.2.3-dev-my.4`，并保留后续各平台最新测试发行。已删除以下 9 个历史 GitHub Release 及全部资产：`v2.2.3-dev-my.2`、`v2.2.3-dev-my.1`、`v2.2.2-dev-my.2`、`v2.2.1-dev-my.2`、`v2.2.1-dev-my.1`、`v2.2.0-dev-my.4`、`v2.2.0-dev-my.3`、`v2.2.0-dev-my.2`、`v2.2.0-dev-my.1`。累计清理 3,168,724,360 字节（约 2.95 GiB）；独立核验 9 个远端源码标签仍在，Latest 仍为 `.3`。

以下历史条目保留当时的构建和验证事实；上述版本的发行页、安装包链接已失效，不再表示可下载。源码可通过 Git 标签查看。未清理 headless 的分支、标签或 Actions artifacts。

## v2.2.3-dev-my.4 Windows x64 测试预发行

- 发行页：[v2.2.3-dev-my.4](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.2.3-dev-my.4)，2026-10-31 16:42（Asia/Shanghai）已公开，标记为预发行；稳定 Latest 仍为 `v2.2.3-dev-my.3`。
- 构建源码：`0b82c40bff512f3c7a88c612d1caa5d2cceebfef`；功能提交为 `feat(app): add independent Side bar interface mode`，已推送到 `dev-my`。标签固定在该构建提交，发行记录另行提交。
- 保留官方 Top tabs、Side tabs（`vertical`）和 Inbox，新增独立 Side bar（`sidebar`）。官方标签组件恢复到已合入的上游基线；项目分组/简单列表、最近历史、Running sessions、扩展悬浮信息与 Home 服务器项目清单仅在新模式中启用。后台项目登记、会话及权限模型不变。
- 已有 `vertical` 偏好不会自动变成 `sidebar`。安装后需在设置 → 通用 → 界面选择 Side bar；已有分组、排序与隐藏状态保留。
- 验证：根检查 35/35；应用单元测试 945 项、browser 条件测试 303 项；最新生产构建 Home/标签回归 63/63；设置/预览专项 4/4；Windows 打包与安装器测试 20/20。CLI 模型目录检查覆盖 7,646 个模型，隔离服务发现、V1 升级确认和历史迁移冒烟通过。
- 实际 ASAR/CLI 版本、四种模式标记、固定更新源、7-Zip 安装包完整性、`latest.yml` 大小与 SHA512 均通过核验。Windows x64 安装包 `opencode-desktop-win-x64.exe` 为 277,957,439 字节，SHA256 为 `374e365cda476f1a853df72473198998c280f5a453f76ddd5b36df4c3dc9b684`。
- 四个 GitHub 资产（安装包、`latest.yml`、`SHA256SUMS`、`build.json`）的服务端大小与 SHA256 均与本地一致。产物未签名；本次仅构建 Windows x64，Linux/macOS 未构建。
- 发布时等待人工测试；2026-10-31 用户确认通过后，已提交独立模式 [Draft PR #60867](https://github.com/anomalyco/opencode/pull/60867)，目标官方 dev，等待上游设计审核。旧 #60446 已关闭，维护主线仍为 dev-my。

## v2.2.3-dev-my.3 Windows AMD64 + Ubuntu AMD64/ARM64 发行

- 发行页：[v2.2.3-dev-my.3](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.2.3-dev-my.3)，2026-10-31 15:03（Asia/Shanghai）已公开；`draft=false`、`prerelease=false`，并设为 Latest。
- 源码提交：`393c371b654e6afa75828e602bfda70085e1d587`；使用 Bun 1.4.4，Windows 原生构建，Linux 在 WSL2 Ubuntu 24.04 x64 构建；后台渠道为 `dev`，appId 为 `ai.opencode.desktop.dev-my`。
- 相对 `.2` 新增发行工具链支持：`release-my.ts` 的 `--arch=x64|arm64|all`、Linux arm64 目标和 `latest-linux-arm64.yml`，以及 QEMU 下可重试的 `catalog-smoke --via-server`。Windows 与 Linux 产品代码未改变；源码另外包含 Home 页文档提交。
- Ubuntu 24.04 LTS 为本轮重点验证基线，提供 amd64 与 arm64 的 AppImage、deb。x64 原生构建；arm64 在 x64 WSL 上通过 `qemu-user-static`、`libc6-dev-arm64-cross` 和 binfmt 交叉构建，CLI 通过 `QEMU_LD_PREFIX=/usr/aarch64-linux-gnu` 执行。
- 验证结果：Windows 与 WSL 的根检查均 35/35；Windows NSIS、ASAR/CLI 版本、7-Zip 完整性、`latest.yml` SHA512 通过；Linux x64/arm64 的模型目录冒烟各覆盖 7,646 个模型，desktop CLI 服务发现、V1 升级确认和迁移历史冒烟均通过；两架构 ASAR/CLI 版本、AppImage/deb 架构、deb 元数据、更新清单 SHA512/大小和 `SHA256SUMS` 均已核对。
- ARM64 GUI 未在原生 arm64 上运行；本版 ARM64 属于 QEMU 交叉构建和 CLI 冒烟验证，正式 ARM64 GUI 验收仍需原生机器或 runner。Windows GUI 回归也未在本轮重复运行。
- 五个安装包：Windows x64 `277,953,147` 字节，SHA256 `44a32f97461eea5e76f01199fc5022a4628b5557837bc8daeab413c6eb5c9f84`；Linux amd64 AppImage `324,058,263` 字节，SHA256 `a01a26c1176e57213b580325cf0de61d2bd96798debb8f9eb0710060879839bd`；amd64 deb `270,314,328` 字节，SHA256 `6662af88cf532d7d99bcddd65f253835a8000f0a08bffd956bf39ec3e40341a3`；arm64 AppImage `324,077,892` 字节，SHA256 `d873cdf82d17bd3e46b5afb32aefafc4d977ef839aeb0300b864df12b8489ba2`；arm64 deb `260,152,112` 字节，SHA256 `484f8d126836103289cc7c841e4bd89f9edbdaab23970b51ccd4e688e4571fe3`。
- 随包提供 `latest.yml`、`latest-linux.yml`、`latest-linux-arm64.yml`、`SHA256SUMS` 和 `build.json`。10 个资产的服务端大小与 SHA256 均与本地一致。产物未签名，更新源固定于本标签；后续版本手动下载安装。
- Gitee Windows 分卷：[v2.2.3-dev-my.3](https://gitee.com/ieta/opencode-my/releases/tag/v2.2.3-dev-my.3)，含 `part1`–`part3`、Windows `latest.yml`、`SHA256SUMS`、`build.json` 和 `WINDOWS-README.txt`；Linux 资产不在 Gitee，走上游 GitHub Release。

## v2.2.3-dev-my.2 Windows AMD64 发行

- 发行页：[v2.2.3-dev-my.2](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.2.3-dev-my.2)，2026-10-31 13:07（Asia/Shanghai）已公开。按不可变迭代标签约定，在 `.1` 测试预发行之后使用新标签；相对 `.1` 的构建源码 `52e000fc52`，本次构建源码 `f587b0f8a7` 仅多一个发行记录文档提交，功能内容一致。
- 源码提交：`f587b0f8a7755ef1abe51efd19615a906cdc3422`；在 Windows x64 干净克隆以 Bun 1.4.4 构建，后台渠道为 `dev`，appId 为 `ai.opencode.desktop.dev-my`。
- `bun install --frozen-lockfile` 安装 1777 个包；根检查 35/35 通过。本机 Node 22.16 默认无法加载 oxlint 的 TypeScript 插件，需以 `NODE_OPTIONS=--experimental-strip-types` 运行检查；该参数只影响本机 lint 工具加载，不改变构建产物。
- 正式构建完成：更新模型目录；从同一源码构建 baseline CLI；CLI 版本、模型目录与桌面冒烟通过；Electron 构建和 NSIS 打包成功。
- 实际打包的 ASAR 版本为 `2.2.3-dev-my.2`，内置 CLI 为 `opencode v2.2.3-dev-my.2`，Side tabs 文案存在；`app-update.yml` 指向本标签。安装包 `opencode-desktop-win-x64.exe` 为 277,959,249 字节，SHA256 为 `638c4567af5e2732453f92ca5d9880b8dd5118427a3bd106d82f96eff23b3757`；`latest.yml` 的 SHA512 与安装包一致，`SHA256SUMS`、`build.json` 和 7-Zip 完整性均通过。
- 四个资产的服务端大小与 SHA256 均与本地一致；`draft=false`、`prerelease=false`，并设为 Latest。本次未重复运行 `.1` 已完成的完整应用单元测试、browser 条件测试和正式构建 GUI 回归，不把历史结果当作本次验证。
- 随包提供 `latest.yml`、`SHA256SUMS` 与 `build.json`。产物未签名，更新源固定于当前标签；后续版本手动下载安装。本次仅构建 Windows AMD64。

## v2.2.3-dev-my.1 Windows AMD64 测试发行

- 2026-10-30，在独立 `dev-my` 工作区合并官方 `dev@e7acf85bb75fb121c4c53561333938ab91bf1ba1`；相对上次维护分支新增 28 个上游提交，保留已发行历史。本次自动合并没有文本冲突。
- 保留 Side tabs 后续优化：常驻运行区、分支/工作树和运行时长、共享项目与会话历史、每项目默认 5 条和展开、项目新建会话入口、显式隐藏和重新打开恢复。两条 headless 维护线没有改动。
- 桌面维护与发行统一以 `dev-my` 为准；`sidetab-overview` 保持纯上游贡献范围，旧 `sidebar-projects` 仅作原始实现的历史参考。
- 从合并后的协议运行 `packages/client` 的 `bun run generate`，生成结果没有额外差异。根检查 35/35、应用单元测试 945 项、browser 条件测试 303 项、迁移/SQLite/Layer 重点测试 45 项、桌面打包配置 14 项，以及应用/桌面正式 TypeScript 检查通过。
- 验证过程中修正两个已有 E2E 的时序：远端先轮换密码再输入新凭据，避免健康预检查缓存旧服务的拒绝；终端首次连接完成后再刷新，避免误算重连次数。两个场景各重复 10 次（5 workers、无重试），20/20 通过；产品逻辑与断言范围保持原样。
- 正式构建的首页、标签/Side tabs 与持久终端完整浏览器回归 83/83 通过（3 workers、无重试）。
- 构建源码：`52e000fc52b82792e6e1dda8b528c84d9b3b8747`；标签 `v2.2.3-dev-my.1` 固定指向该提交，桌面与内置 CLI 均为 `2.2.3-dev-my.1`，不使用后续文档提交冒充构建来源。
- 实际 ASAR 已核对 Running/Recent、项目分组、新建会话与工作树提示；CLI 模型目录、隔离服务发现、V1 升级确认和迁移历史冒烟通过。固定更新源与本标签一致；7-Zip 安装包完整性、SHA256SUMS 及更新清单的 SHA512/大小均通过校验。
- 安装包 `opencode-desktop-win-x64.exe` 为 277,957,195 字节，SHA256：`1d4a207c611c7f872b9f81238816ce6bd4271a371af892be2aca0462ffd7e376`；随包提供 `latest.yml`、`SHA256SUMS` 和 `build.json`。仅构建 Windows x64，未签名，不替用户安装或重启现有应用/服务。
- 补充服务器 API 回归在 Git Bash 下为 5 项通过、0 项失败；默认 PowerShell 不支持用例中的 `printf` 等 Unix 命令，6 项持久终端测试按上游规则在 Windows 跳过，未记作通过。
- 发布状态：2026-10-31 00:12（Asia/Shanghai）已公开 [Windows 测试预发行](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.2.3-dev-my.1)。四个资产的服务端大小与 SHA256 均与本地一致，`draft=false`、`prerelease=true`；稳定版 Latest 标记保持不变。

| 日期       | 标签                                                                                   | 类型                           | 说明                                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| 2026-10-31 | [`v2.2.3-dev-my.3`](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.2.3-dev-my.3) | Windows amd64 + Ubuntu 双架构  | 新增 Linux arm64 发行工具链；源码 `393c371b65`，Windows 与 Ubuntu amd64/arm64 同步发行并设为 Latest                      |
| 2026-10-31 | [`v2.2.3-dev-my.2`](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.2.3-dev-my.2) | Windows amd64 二进制发行       | 在 `.1` 测试版之后按不可变标签重新构建；源码 `f587b0f8a7`，正式发行并设为 Latest                                         |
| 2026-10-31 | [`v2.2.3-dev-my.1`](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.2.3-dev-my.1) | Windows AMD64 测试预发行       | 同步官方 V2 2.2.3 的 `e7acf85bb7`；源码 `52e000fc52`，预发行，Latest 保持不变                                            |
| 2026-10-30 | `v2.2.2-dev-my.1`                                                                      | 源码同步标签                   | 同步官方 V2 2.2.2 的 `92b2ca0dd7`，吸收 107 个新上游提交及已合并 PR #60496；包含 fork 文档整理。此轮不构建或发布新安装包 |
| 2026-10-30 | [`v2.2.1-dev-my.2`](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.2.1-dev-my.2) | Windows amd64 二进制发行       | 本地修复未知发布日期模型默认隐藏；源码 `d28cf55b08`，安装包、更新清单、SHA256SUMS、build.json 已发布                     |
| 2026-10-29 | [`v2.2.1-dev-my.1`](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.2.1-dev-my.1) | Windows / Linux x64 二进制发行 | 同步 V2 2.2.1，并补充 Ubuntu AppImage/deb 构建支持                                                                       |
| 2026-10-29 | [`v2.2.0-dev-my.4`](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.2.0-dev-my.4) | Windows amd64 二进制发行       | Side tabs 项目计数、最近活动与任务观察窗完善；旧发行作为历史参考                                                         |

## v2.2.2-dev-my.2 Windows AMD64 发行

- 发行页：[v2.2.2-dev-my.2](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.2.2-dev-my.2)，2026-10-30。
- 源码提交：`8a6320092373addc2ba9ef67b19287e43ff53399`；在独立工作区以 Bun 1.4.4 构建，后台渠道为 `dev`，appId 为 `ai.opencode.desktop.dev-my`。
- 包含 V2 2.2.2 上游同步、服务器项目历史与显式隐藏状态、Side tabs 的分支/工作树提示和项目新建会话入口；Recent sessions 仅列主会话。
- 根检查 35 个任务、应用单元测试 941 项、正式 TypeScript 检查、正式构建首页/标签回归 62 项通过；CLI 模型目录、服务发现、V1 升级确认与迁移历史冒烟通过。
- 实际打包的 ASAR 已核对项目隐藏与侧栏新入口/工作树提示、应用版本；安装包 `opencode-desktop-win-x64.exe` 为 277,917,998 字节，SHA256 为 `d8ef81e2757f7a831a0882623e403df2d967b8655fd744117c2af5a3ce5326da`。
- 随包提供 `latest.yml`、`SHA256SUMS` 与 `build.json`。产物未签名，更新源固定于当前标签；后续版本手动下载安装。本次仅构建 Windows AMD64。

## v2.2.2-dev-my.1 同步内容

- 上游基线：`92b2ca0dd727942e00aba3523ed141d53e78ea28`，相对上一发行源码新增 107 个可达上游提交。
- 已接受的贡献：[#60496](https://github.com/anomalyco/opencode/pull/60496)，最终合并提交 `986221af346f`。模型适配器及其测试采用最终上游版本，保留已知/未知日期回归与新推理能力测试。
- 其他上游进展包含 Claude Agent provider、OpenTUI 0.8.0、托管策略与接口演进、桌面窗口恢复、HTTP 来源兼容和界面性能修复；完整列表以两次上游基线之间的 Git 日志为准。
- 本地保留 Side tabs、V1 单向升级确认、迁移清理批次提交/恢复、SQLite 错误分类、Layer 依赖诊断，以及独立桌面身份/同源码 CLI 打包约定。
- 会话缓存冲突合并了两端行为：保留侧栏轻量投影使用的删除过滤器，同时采用上游成功删除后的缓存/活动清理。lockfile 保留新 OpenTUI 0.8.0 条目；从合并后的协议重新生成客户端，未手改生成文件。
- 三个维护分支的专属说明已集中到 [docs/fork](../README.md)，本次只同步 dev-my，不改变两条 headless 的基线或发行标签。

## v2.2.2-dev-my.1 验证

集成提交：`1dfa6ca79c`；后续文档记录提交与该集成提交一起纳入源码标签。

- `bun run check`：35 个任务全部通过。
- 应用单元测试：941 项通过。
- V1 迁移、SQLite 与 Layer 依赖校验重点测试：45 项通过。
- 桌面打包配置测试：14 项通过。
- 应用 `bun run typecheck:tsc`：通过。
- 正式构建的首页、标签/Side tabs、模型选择 Playwright 回归：64 项通过，3 workers、无重试。
- 从合并后协议执行 `packages/client` 的 `bun run generate`；模型适配器和测试与最终上游版本一致。
- 项目文档共 41 份，388 个内部链接与 30 个来源固定引用检查通过；格式检查通过。

本轮未运行新的 headless 三平台构建，也未生成新的桌面安装包；这些验证不替代后续二进制发行的 CLI/安装包冒烟。

本轮合并范围：[上一源码标签到本次标签](https://github.com/joe-ieta/OpenCode.My/compare/v2.2.1-dev-my.2...v2.2.2-dev-my.1)。详细本地检查日志位于 `.cache/dev-my-sync-*.log`，不随源码提交。
