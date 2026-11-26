# OpenCode My

**English** · [简体中文](README.zh.md)

OpenCode My is a desktop workspace for long-running agent coding, built on `opencode`. It helps developers work across several projects and follow tasks that take time to complete. It retains OpenCode's coding and agent capabilities and improves desktop interactions, personal workflows, and access to locally hosted models. The desktop edition is maintained on `dev-my`.

- **Control** · Organize sessions by project and see running work and tasks waiting for input, so you can switch projects and intervene when needed.
- **Visibility** · Use project overviews, task status, and session context to see what has finished and what still needs attention.
- **Ease of use** · Use simpler desktop controls, choose the layout and workflow that fit your work, and connect custom or locally hosted models.

## What this project does

OpenCode My is a desktop project in the OpenCode ecosystem. It focuses on how developers work with agents across demanding projects. Desktop enhancements follow upstream conventions and are optional where practical.

### Respond to community feedback

We prioritize community issues with concrete use cases, such as the Side bar layout and connecting custom models hosted locally. We release verified fixes in the fork and submit suitable changes upstream for review.

### Develop and validate new features

We evaluate agent coding features in real workflows when they make tasks easier to control, progress easier to understand, or common actions simpler. Those results inform what we ship in the desktop edition.

## Download

The [current release candidate, `v2.4.1-my-0.1.27-rc`](https://github.com/joe-ieta/OpenCode.My/releases/tag/v2.4.1-my-0.1.27-rc), includes Session Go. The [latest stable release](https://github.com/joe-ieta/OpenCode.My/releases/latest) includes Side bar and custom models. Both provide a Windows x64 installer and Linux AppImage and deb packages for amd64 and arm64.

## Desktop features

### Side bar

- **Switch layouts.** Open **Settings → Preferences → Interface layout** and choose **Side bar**. Use the sidebar header to open Home or Settings, add a project, or search sessions.
- **Project and list views.** The default **By project** view groups sessions under their projects. **List** sorts sessions across projects by most recent activity.
- **Project controls.** Pin projects for quick access, expand or collapse them with the folder icons, and view branch, worktree, and remote information where available.
- **Project and session menus.** Home and Side bar share actions for importing sessions, editing projects, copying paths, clearing notifications, and closing projects. Open the Side bar project menu with a right-click or **Shift+F10**. Closing a project keeps its history and unsent drafts, and the session menu supports export.
- **Shared counts.** Both views show active sessions / total sessions / projects across the available projects. For example, `2/20/5` means 2 active sessions out of 20 across 5 projects.
- **Home and new sessions.** Home and Side bar share project history. Home project rows show running activity and let you start a session. Use the **+** beside a project in Side bar to start a session in that project.
- **Running sessions.** A dedicated section across connected servers shows active work and waits for input or approval. It includes background Shell tasks and subagents, even when the session is closed in the workspace.
- **Session hover details.** See the branch and worktree, when the last run ended, the number of user messages in the loaded history, the latest effective context usage, and session cost. Recent runs show a relative time.

### Session Go

Open Session Go from the session header to review a long conversation while keeping its original timeline visible. The floating **Session Go** button also opens the panel and offers a rail for jumping between user turns. Manage the feature in **Settings → Session Go**.

- **Goals, decisions, and actions.** Local rules pull candidates from the session history. Review the goal, outstanding decisions, and recorded actions such as shell commands or test runs.
- **Search and evidence.** Search messages and facts in the loaded history, choose **Load full history** when you need earlier messages, and use **Reveal** to jump to a source in the conversation.
- **Confirmed facts.** Confirm, defer, or reject decision candidates. Session Go can keep confirmed facts and their supporting evidence locally while preserving the original messages.
- **Model-assisted analysis.** Choose **Analyze loaded session** to use the session's configured model to refine candidates. It adds model usage to the session. Automatic analysis after each episode is off by default.

### Custom models

- **Provider setup.** Create, edit, or remove global OpenAI-compatible providers from **Custom providers**. Set the display name, provider ID, and base URL in the form.
- **Credentials.** Save or replace API keys in the credential store. Editing the provider preserves JSONC comments and fields managed outside the form.
- **Model discovery.** Preview models via OpenAI-compatible `/models` or the native Ollama and LM Studio APIs. Import selected entries, retain manually entered fields, and use discovered models in the runtime catalog.
- **Manual model entries.** Set the display name, request model ID, context, input and output limits, and tool and image capabilities. The form scrolls on shorter windows.
- **Advanced options.** Configure request and streaming timeouts, reasoning and compatibility settings, price tiers, and model variants.
- **Saved-model text test.** Send a small test request using the saved endpoint, credentials, and model ID. Inspect the result, cancel the test, or retry after an error.
- **Model visibility.** Use **Manage models** to choose which models appear in the picker. Close the panel to return to the same picker.
- **Built-in integrations.** Open **Connect an integration** from the picker footer or from the search field on desktop. Confirming removal deletes the integration's saved credentials and refreshes the model catalog.

## Desktop screenshots

These full-window screenshots use sample data from the desktop interface build.

- **Side bar** · Browse project groups and see running sessions across connected servers alongside the current conversation.

  <img src="docs/fork/dev-my/side-bar-en.png" alt="Full window with the Side bar project groups, cross-server running sessions, and the current conversation and composer">

- **Session Go** · Review goals, decision candidates, and actions in the right-hand panel alongside the original conversation.

  <img src="docs/fork/dev-my/session-go-en.png" alt="Full window with the Side bar, session timeline, composer, and Session Go review panel">

- **Custom models** · Open **Custom providers** from the model picker to fetch models or add them manually. Test a saved model and see the result alongside its configuration.

  <img src="docs/fork/dev-my/custom-models-en.png" alt="Full window with the custom provider editor, model discovery, and a successful sample text test">

[Report an issue or share feedback](https://github.com/joe-ieta/OpenCode.My/issues) · [Desktop maintenance](docs/fork/dev-my/README.md) · [Official OpenCode README](https://github.com/anomalyco/opencode#readme)
