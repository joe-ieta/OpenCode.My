# OpenCode My

**English** · [简体中文](README.zh.md)

`OpenCode My` is a desktop AI coding workspace for everyday development and long-running tasks. Built on `opencode`, it helps developers stay in control, understand progress, and work with AI agents across multiple projects at once. It retains the full coding and agent capabilities of `opencode` while improving the interface, personal workflows, and the experience of running models locally. The desktop edition is maintained on `dev-my`.

- **Control** · Manage projects and sessions, and use session summaries to steer long-running, system-level development.
- **Understanding** · See facts, summaries, and rollups for project design, task breakdown, task progress, and session activity.
- **Ease of use** · Work in a streamlined interface with personalization features and support for local deployments.

## Personalization features

- **Side bar** · Select **Side bar** under **Settings → General → Interface layout**. Pin or collapse projects, browse recent sessions by project, and see running work across connected servers, including background Shell tasks and subagents.

  <img src="docs/fork/dev-my/side-bar-en.png" alt="Side bar with project groups, recent sessions, and running work">

- **Custom models** · Open **Custom providers** from the model picker to configure a global OpenAI-compatible provider. Discover and import models or enter them manually, set the display name, request ID, and context limit, and test text responses. Use **Manage models** to choose which models appear in the picker.

  <img src="docs/fork/dev-my/custom-models-en.png" alt="Custom provider model form with the request ID, display name, context limit, and text test">

_Screenshots use sample data._

## New features in OpenCode My

### Side bar

- **Project and list views.** The default **By project** view groups sessions under their projects. **List** sorts sessions across projects by most recent activity.
- **Project controls.** Pin projects for quick access, expand or collapse them with the folder icons, and view branch, worktree, and remote information where available.
- **Project and session menus.** Home and Side bar share actions for importing sessions, editing projects, copying paths, clearing notifications, and closing projects. Open the Side bar project menu with a right-click or **Shift+F10**. Closing a project keeps its history and unsent drafts, and the session menu supports export.
- **Shared counts.** Both views show active sessions / total sessions / projects across the available projects. For example, `2/20/5` means 2 active sessions out of 20 across 5 projects.
- **Home and new sessions.** Home and Side bar share project history. Home project rows show running activity, and **New session** below **Home** uses the project selected there. Project rows also offer shortcuts to start a session in that project.
- **Running sessions.** A dedicated section across connected servers shows active work and waits for input or approval. It includes background Shell tasks and subagents, even when the session is closed in the workspace.
- **Session hover details.** See the branch and worktree, when the last run ended, the number of user messages in the loaded history, the latest effective context usage, and session cost. Recent runs show a relative time.

### Custom models

- **Provider setup.** Create, edit, or remove global OpenAI-compatible providers from **Custom providers**. Set the display name, provider ID, and base URL in the form.
- **Credentials.** Save or replace API keys in the credential store. Editing the provider preserves JSONC comments and fields managed outside the form.
- **Model discovery.** Preview models via OpenAI-compatible `/models` or the native Ollama and LM Studio APIs. Import selected entries, retain manually entered fields, and use discovered models in the runtime catalog.
- **Manual model entries.** Set the display name, request model ID, context, input and output limits, and tool and image capabilities. The form scrolls on shorter windows.
- **Advanced options.** Configure request and streaming timeouts, reasoning and compatibility settings, price tiers, and model variants.
- **Saved-model text test.** Send a small test request using the saved endpoint, credentials, and model ID. Inspect the result, cancel the test, or retry after an error.
- **Model visibility.** Use **Manage models** to choose which models appear in the picker. Close the panel to return to the same picker.
- **Built-in integrations.** Open **Connect an integration** from the picker footer or from the search field on desktop. Confirming removal deletes the integration's saved credentials and refreshes the model catalog.

[Download OpenCode My](https://github.com/joe-ieta/OpenCode.My/releases/latest) · [Desktop maintenance](docs/fork/dev-my/README.md) · [Official OpenCode README](https://github.com/anomalyco/opencode#readme)
