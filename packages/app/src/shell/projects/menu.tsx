import { Show } from "solid-js"
import { Menu } from "@opencode/ui/menu"
import { useLanguage } from "@/runtime/i18n/language"
import { usePlatform } from "@/runtime/platform/platform"
import { ServerConnection, useServers } from "@/runtime/server/registry"
import type { LocalProject } from "@/shell/state/layout"
import { fileManagerApp } from "./file-manager"
import type { ProjectBrowserTarget } from "@/home/projects/browse"
import { writeClipboard } from "@opencode/session-ui/copy"
import { showToast } from "@/shell/notifications/toast"

const terminalApp = { windows: "powershell", macos: "Terminal", linux: "terminal", unknown: undefined }

export function ProjectMenuItems(props: {
  server: ServerConnection.Any
  project: LocalProject
  /** The selected clone/worktree, or the project's canonical directory. */
  directory?: string
  unread: boolean
  onViewHistory?: (target: ProjectBrowserTarget) => void
  canImportSession: boolean
  importingSession?: boolean
  canRevealProject: (server: ServerConnection.Any) => boolean
  onOpenProjectNewSession: (server: ServerConnection.Any, directory: string) => void
  onImportSession: (server: ServerConnection.Any, project: LocalProject) => void
  onEditProject: (server: ServerConnection.Any, project: LocalProject) => void
  onRevealProject: (server: ServerConnection.Any, project: LocalProject, directory?: string) => void
  onClearNotifications: (server: ServerConnection.Any, project: LocalProject) => void
  onHideProject: (server: ServerConnection.Any, project: LocalProject) => void
}) {
  const language = useLanguage()
  const platform = usePlatform()
  const servers = useServers()
  const directory = () => props.directory ?? props.project.worktree
  const terminal = terminalApp[platform.os ?? "unknown"]

  const openTerminal = () => {
    if (!terminal || !platform.openPath) return
    const path = directory()
    void platform.openPath(path, terminal).catch(() =>
      showToast({
        variant: "error",
        title: language.t("sidebar.project.openTerminalFailed"),
        description: path,
      }),
    )
  }

  const copyPath = () => {
    const failed = () => showToast({ variant: "error", title: language.t("sidebar.project.copyPathFailed") })
    void Promise.try(() =>
      platform.writeClipboardText
        ? platform.writeClipboardText(directory()).then(() => true)
        : writeClipboard(directory()),
    ).then((written) => {
      if (!written) failed()
    }, failed)
  }

  return (
    <>
      <Menu.Item onSelect={() => props.onOpenProjectNewSession(props.server, directory())}>
        {language.t("command.session.new")}
      </Menu.Item>
      <Show when={props.onViewHistory} keyed>
        {(open) => (
          <Menu.Item onSelect={() => open({ server: ServerConnection.key(props.server), directory: directory() })}>
            {language.t("project.browse.history")}
          </Menu.Item>
        )}
      </Show>
      <Show when={props.canImportSession}>
        <Menu.Item
          disabled={props.importingSession}
          onSelect={() => props.onImportSession(props.server, props.project)}
        >
          {language.t("command.session.import")}
        </Menu.Item>
      </Show>
      <Menu.Item onSelect={() => props.onEditProject(props.server, props.project)}>
        {language.t("dialog.project.edit.title")}
      </Menu.Item>
      <Menu.Item onSelect={copyPath}>{language.t("sidebar.project.copyPath")}</Menu.Item>
      <Show when={props.canRevealProject(props.server)}>
        <Menu.Item onSelect={() => props.onRevealProject(props.server, props.project, directory())}>
          {language.t(
            fileManagerApp(platform.platform === "desktop" ? (platform.os ?? "unknown") : "unknown").actionLabel,
          )}
        </Menu.Item>
      </Show>
      <Show when={platform.platform === "desktop" && platform.openPath && terminal && servers.local(props.server)}>
        <Menu.Item onSelect={openTerminal}>{language.t("sidebar.project.openTerminal")}</Menu.Item>
      </Show>
      <Menu.Item disabled={!props.unread} onSelect={() => props.onClearNotifications(props.server, props.project)}>
        {language.t("sidebar.project.clearNotifications")}
      </Menu.Item>
      <Menu.Separator />
      <Menu.Item onSelect={() => props.onHideProject(props.server, props.project)}>
        {language.t("common.close")}
      </Menu.Item>
    </>
  )
}
