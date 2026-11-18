import { useGlobal, useServerCtx, type ServerCtx } from "@/runtime/server/runtime"
import { useSettings } from "@/settings/model"
import { useLayout, type HomeProjectSelection } from "@/shell/state/layout"
import { ServerConnection, useServers } from "@/runtime/server/registry"
import { isServerFailed } from "@/runtime/server/health-machine"
import { usePluginServers } from "@/runtime/plugin/servers"
import { createProjectSessionActions } from "@/shell/tabs/project-sessions"
import { batch, createEffect, createMemo, createSignal, onCleanup, untrack } from "solid-js"
import { pathKey } from "@/workspaces/path-key"
import { isProjectDirectory, workspaceSelectionDirectories } from "@/workspaces/paths"
import { addProjects } from "@/shell/projects/add"
import {
  INITIAL_HOME_SELECTION_STATE,
  sameHomeSelection,
  selectHomeSelection,
  transitionHomeSelection,
  type HomeEnvSnapshot,
  type HomeSelectionEffect,
  type HomeSelectionEvent,
} from "./machine"

// Side bar includes projects known to the server, even if this client has not used them.
function homeProjects(ctx: ServerCtx | undefined, sidebar: boolean) {
  return (sidebar ? ctx?.projects.visible() : ctx?.projects.used()) ?? []
}

export function createHomeSessionActions(selection: () => HomeProjectSelection) {
  const global = useGlobal()
  const servers = useServers()
  const settings = useSettings()
  const sessions = createProjectSessionActions()

  const target = () => {
    const current = selection()
    const preferred = servers.visible.find((conn) => ServerConnection.key(conn) === current.server)
    const conn = preferred ?? servers.visible[0]

    if (!conn) return
    const ctx = global.serverCtx(ServerConnection.key(conn))
    const projects = homeProjects(ctx, settings.appearance.tabLayout() === "sidebar")
    const directory = preferred && current.directory
    const selected = directory ? projects.find((project) => isProjectDirectory(project, directory)) : undefined
    const project = selected ?? ctx?.projects.last() ?? projects[0]

    if (project) return { conn, project, directory: selected && directory ? directory : project.worktree }
  }

  return {
    ...sessions,
    newSessionProject: () => target()?.project,
    openNewSession: () => {
      const value = target()

      if (value) sessions.openProjectNewSession(value.conn, value.directory)
    },
  }
}

export function createHomeController() {
  const layout = useLayout()
  const global = useGlobal()
  const servers = useServers()
  const pluginServers = usePluginServers()
  const settings = useSettings()

  const projectsFor = (ctx: ServerCtx | undefined) => homeProjects(ctx, settings.appearance.tabLayout() === "sidebar")

  const env = createMemo(
    (): HomeEnvSnapshot => ({
      hydrated: layout.ready() && servers.hydrated() && pluginServers.ready(),
      stored: { server: layout.home.selection().server, directory: layout.home.selection().directory },
      servers: servers.visible.map((conn) => {
        const key = ServerConnection.key(conn)
        const ctx = global.serverCtx(key)

        return {
          key,
          failed: isServerFailed(global.servers.health[key]),
          connected: ctx?.sdk.connection.status() === "connected",
          projectsReady: !!ctx?.sync.project.ready() && servers.projects.forServer(key).legacy() === undefined,
          usedProjects: projectsFor(ctx).map((project) => ({
            id: project.id,
            worktree: project.worktree,
            directories: [project.worktree, ...workspaceSelectionDirectories(project, [])].toSorted((a, b) =>
              pathKey(a).localeCompare(pathKey(b)),
            ),
          })),
        }
      }),
    }),
  )

  // Seeded synchronously, so the first render already shows a listed server.
  const initial = transitionHomeSelection(INITIAL_HOME_SELECTION_STATE, { type: "env.synced", env: untrack(env) })
  const [machine, setMachine] = createSignal(initial.state)

  const dispatch = (event: HomeSelectionEvent) => {
    const result = transitionHomeSelection(untrack(machine), event)

    if (result.state !== untrack(machine)) setMachine(result.state)
    result.effects.forEach(run)
  }

  // A user action can follow a server change in the same update, before the effect below reports it.
  const send = (event: HomeSelectionEvent) =>
    untrack(() =>
      batch(() => {
        dispatch({ type: "env.synced", env: env() })
        dispatch(event)
      }),
    )

  const searches = new Set<ReturnType<typeof setTimeout>>()

  function run(effect: HomeSelectionEffect) {
    if (effect.type === "selection.persist") return layout.home.setSelection(effect.selection)

    if (effect.type === "worktrees.refresh")
      return void global.serverCtx(effect.server)?.sync.worktrees.refresh(effect.projectID)

    const ctx = global.serverCtx(effect.server)

    if (effect.type === "worktrees.search") {
      if (!ctx) return send({ type: "worktrees.searched", attempt: effect.attempt })

      // A disconnected server must not leave Home verifying a saved clone forever.
      const timer = setTimeout(() => {
        searches.delete(timer)
        send({ type: "worktrees.searched", attempt: effect.attempt })
      }, 15_000)
      searches.add(timer)
      return void Promise.all(effect.projectIDs.map((projectID) => ctx.sync.worktrees.list(projectID))).then(() => {
        clearTimeout(timer)
        searches.delete(timer)
        send({ type: "worktrees.searched", attempt: effect.attempt })
      })
    }

    if (effect.type === "worktrees.list") {
      // The inventory read never rejects; a failed read still asks the server to discover worktrees.
      if (!ctx) return dispatch({ type: "worktrees.listed", attempt: effect.attempt })

      return void ctx.sync.worktrees
        .list(effect.projectID)
        .then(() => dispatch({ type: "worktrees.listed", attempt: effect.attempt }))
    }

    if (!ctx) return dispatch({ type: "project.added", attempt: effect.attempt, project: undefined })

    void addProjects(ctx, [...effect.directories]).then(
      (project) =>
        send({
          type: "project.added",
          attempt: effect.attempt,
          project: project && { id: project.id, worktree: project.worktree },
        }),
      () => dispatch({ type: "project.added", attempt: effect.attempt, project: undefined }),
    )
  }

  initial.effects.forEach(run)

  createEffect(() => {
    const current = env()
    untrack(() => dispatch({ type: "env.synced", env: current }))
  })

  onCleanup(() => {
    dispatch({ type: "disposed" })
    searches.forEach(clearTimeout)
  })

  const selection = createMemo(() => selectHomeSelection(machine()), undefined, { equals: sameHomeSelection })
  const sessions = createHomeSessionActions(selection)

  const focusedServer = createMemo(() => {
    const key = selection().server

    return key ? servers.visible.find((conn) => ServerConnection.key(conn) === key) : undefined
  })

  const focusedServerCtx = useServerCtx(focusedServer)
  const focusedSync = () => focusedServerCtx()?.sync
  const projects = createMemo(() => projectsFor(focusedServerCtx()))

  const selectedProject = createMemo(() => {
    const directory = selection().directory

    return directory ? projects().find((project) => isProjectDirectory(project, directory)) : undefined
  })

  return {
    selection: {
      value: selection,
      focusServer: (conn: ServerConnection.Any) => send({ type: "server.focused", server: ServerConnection.key(conn) }),
    },
    server: {
      list: () => servers.visible,
      health: (conn: ServerConnection.Any) => global.servers.health[ServerConnection.key(conn)],
      label: servers.label,
      context: (conn: ServerConnection.Any) => global.serverCtx(ServerConnection.key(conn)),
      focused: focusedServer,
      focusedContext: focusedServerCtx,
      focusedSync,
    },
    project: {
      list: projects,
      selected: selectedProject,
      newSession: sessions.newSessionProject,
      forServer: (conn: ServerConnection.Any) => projectsFor(global.serverCtx(ServerConnection.key(conn))),
      select: (conn: ServerConnection.Any, directory: string) =>
        send({ type: "project.toggled", server: ServerConnection.key(conn), directory }),
      add: (conn: ServerConnection.Any, directories: string[]) =>
        send({ type: "project.add", server: ServerConnection.key(conn), directories }),
      openNewSession: sessions.openNewSession,
      openProjectNewSession: sessions.openProjectNewSession,
      openProjectSession: sessions.openProjectSession,
    },
  }
}

export type HomeController = ReturnType<typeof createHomeController>
