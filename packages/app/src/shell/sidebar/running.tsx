import { createEffect, createMemo, createUniqueId, For, on, onCleanup, Show } from "solid-js"
import { createStore } from "solid-js/store"
import type { SessionInfo } from "@opencode/client/promise"
import { ActivityRing } from "@opencode/ui/activity-ring"
import { Icon } from "@opencode/ui/icon"
import { displayName } from "@opencode/ui/project-avatar"
import { useLanguage } from "@/runtime/i18n/language"
import { ServerConnection, serverName } from "@/runtime/server/registry"
import type { ServerCtx } from "@/runtime/server/runtime"
import { projectSettingsKey, useSettings } from "@/settings/model"
import { sessionRequests } from "@/shell/layout/project-avatar-state"
import { workingSince } from "@/shell/titlebar/inbox-working"
import { sessionLastRunLabel, sessionTabTitle } from "@/shell/titlebar/tab-title"
import { elapsedTime } from "@/shell/sessions/duration"
import { createSessionBranches } from "@/shell/sessions/branches"
import { pathKey } from "@/workspaces/path-key"
import { createSessionIndexes } from "./history"
import "./running.css"

type Entry = {
  key: string
  id: string
  server: ServerConnection.Key
  conn: ServerConnection.Any
  ctx: ServerCtx
  unread: boolean
  snapshot?: SessionInfo
}

/** Observation includes background work and ancestors, independently of model execution ownership. */
export function RunningSessions(props: {
  connections: { conn: ServerConnection.Any; ctx: ServerCtx | undefined }[]
  selected?: { server: ServerConnection.Key; sessionID: string }
  onOpen: (server: ServerConnection.Key, sessionID: string) => void
}) {
  const language = useLanguage()
  const settings = useSettings()
  const heading = createUniqueId()

  const branches = createSessionBranches(() =>
    props.connections.flatMap((item) =>
      item.ctx?.sdk.connection.status() === "connected" ? [ServerConnection.key(item.conn)] : [],
    ),
  )

  const [clock, setClock] = createStore({ now: Date.now() })

  // The same index Home and the project list read, so an unread session outside the loaded subset still appears.
  const indexes = createSessionIndexes(() =>
    props.connections.flatMap((item) => (item.ctx ? [{ conn: item.conn, ctx: item.ctx }] : [])),
  )

  const indexed = createMemo(
    () =>
      new Map(
        indexes
          .sources()
          .flatMap((source) =>
            source.sessions.map(
              (session) => [JSON.stringify([ServerConnection.key(source.conn), session.id]), session] as const,
            ),
          ),
      ),
  )

  const activeEntries = createMemo<Entry[]>(() =>
    props.connections.flatMap((item) => {
      const ctx = item.ctx

      if (!ctx || ctx.sdk.connection.status() !== "connected") return []
      const server = ServerConnection.key(item.conn)

      return ctx.data.session.activity.active().map((id) => {
        const key = JSON.stringify([server, id])

        return { key, id, server, conn: item.conn, ctx, unread: false, snapshot: indexed().get(key) }
      })
    }),
  )

  const unreadEntries = createMemo<Entry[]>(() => {
    const active = activeEntries()
    const activeKeys = new Set(active.map((entry) => entry.key))
    const activeRoots = new Set(
      active.map((entry) => JSON.stringify([entry.server, entry.ctx.data.session.root(entry.id)])),
    )

    return indexes.sources().flatMap((source) => {
      const ctx = source.ctx

      if (ctx.sdk.connection.status() !== "connected") return []
      const server = ServerConnection.key(source.conn)

      return source.sessions.flatMap((session): Entry[] => {
        if (session.parentID || session.time.archived !== undefined) return []
        if (
          props.selected?.server === server &&
          ctx.data.session.root(props.selected.sessionID) === session.id
        )
          return []

        const key = JSON.stringify([server, session.id])

        if (activeKeys.has(key) || activeRoots.has(key)) return []
        if (ctx.data.session.status(session.id) === "running" || ctx.data.session.activity.busy(session.id, true))
          return []
        if (!ctx.notification.session.unread(session.id, session)) return []

        return [{ key, id: session.id, server, conn: source.conn, ctx, unread: true, snapshot: session }]
      })
    })
  })

  const sessionOf = (entry: Entry) => entry.ctx.data.session.get(entry.id) ?? entry.snapshot

  const endedAt = (entry: Entry) => {
    const session = sessionOf(entry)

    return session?.time.idle ?? session?.time.updated ?? 0
  }

  const entries = createMemo(() => {
    // `time.updated` moves with every message, but the current run's start stays put, so rows do not jump.
    const active = activeEntries().toSorted((a, b) => {
      const start =
        (workingSince(sessionOf(a) ?? { time: {} }) ?? Infinity) -
        (workingSince(sessionOf(b) ?? { time: {} }) ?? Infinity)

      return start || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)
    })
    const unread = unreadEntries().toSorted(
      (a, b) => endedAt(b) - endedAt(a) || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0),
    )

    return [...active, ...unread]
  })

  const byKey = createMemo(() => new Map(entries().map((entry) => [entry.key, entry])))
  const disconnected = () => props.connections.some((item) => item.ctx?.sdk.connection.status() !== "connected")
  const unavailable = () => props.connections.some((item) => item.ctx?.data.session.activity.unavailable())
  const loading = () =>
    props.connections.some((item) => item.ctx && !item.ctx.data.session.activity.ready()) || indexes.loading()

  createEffect(() => {
    if (!activeEntries().length) return
    setClock("now", Date.now())
    const timer = setInterval(() => setClock("now", Date.now()), 1_000)
    onCleanup(() => clearInterval(timer))
  })

  createEffect(() => {
    branches.load(
      entries().flatMap((entry) => {
        const session = sessionOf(entry)

        return session ? [{ server: entry.server, ctx: entry.ctx, session }] : []
      }),
    )
  })

  return (
    <section data-component="active-sessions" aria-labelledby={heading}>
      <div data-slot="active-sessions-header">
        <h2 id={heading}>{language.t("sidebar.running.title")}</h2>
        <span class="tabular-nums" aria-label={language.plural("sidebar.running.count", entries().length)}>
          {entries().length}
        </span>
      </div>
      <div data-slot="active-sessions-list" data-scrollable>
        <For
          each={[...byKey().keys()]}
          fallback={
            <p data-slot="active-sessions-empty">
              {language.t(
                disconnected()
                  ? "sidebar.running.disconnected"
                  : unavailable()
                    ? "sidebar.running.unavailable"
                    : loading()
                      ? "common.loading"
                      : "sidebar.running.empty",
              )}
            </p>
          }
        >
          {(key) => (
            <Show when={byKey().get(key)}>
              {(entry) => {
                // A keyed row survives other sessions and shells changing. Refresh only on arrival or a new connection.
                const context = createMemo(() => entry().ctx)

                createEffect(
                  on(context, (ctx) => {
                    if (entry().unread) {
                      void ctx.data.session.sync(entry().id).catch(() => undefined)

                      return
                    }

                    void Promise.allSettled([
                      ctx.data.session.sync(entry().id),
                      ctx.data.session.permission.sync(entry().id),
                      ctx.data.session.form.sync(entry().id),
                    ])
                  }),
                )

                // A running child can belong to a parent that this window has never opened.
                createEffect(() => {
                  const value = entry()
                  const root = value.ctx.data.session.root(value.id)

                  if (root === value.id || value.ctx.data.session.get(root)) return
                  void value.ctx.data.session.sync(root).catch(() => undefined)
                })

                const session = createMemo(() => sessionOf(entry()))

                const project = createMemo(() => {
                  const value = session()

                  return value
                    ? (entry().ctx.projects.forSession(value) ?? { worktree: value.location.directory })
                    : undefined
                })

                const projectName = () => displayName(project() ?? { worktree: session()?.location.directory ?? "" })

                const branch = () => {
                  const value = session()

                  return value
                    ? branches.branch({ server: entry().server, ctx: entry().ctx, session: value })
                    : undefined
                }

                const worktree = () => {
                  const root = project()?.worktree
                  const directory = session()?.location.directory

                  return !!root && !!directory && pathKey(root) !== pathKey(directory)
                }

                const duration = () => {
                  const since = entry().ctx.data.session.activity.since(entry().id, true)

                  return since === undefined
                    ? undefined
                    : elapsedTime(Math.max(0, Math.floor((clock.now - since) / 1000)), language)
                }

                const summary = () => {
                  const work = entry().ctx.data.session.activity.list(entry().id, true)

                  return language.plural("sidebar.running.activity", work.length, {
                    models: work.filter((item) => item.kind === "model").length,
                    agents: work.filter((item) => item.kind === "subagent").length,
                    shells: work.filter((item) => item.kind === "shell").length,
                    other: work.filter((item) => item.kind === "image" || item.kind === "job").length,
                  })
                }

                const status = createMemo(() => {
                  const value = entry()

                  if (value.unread) return "unread"

                  const requests = sessionRequests(
                    value.ctx,
                    value.id,
                    false,
                    settings.permissions.autoApproves(projectSettingsKey(value.ctx.sdk.scope, session()?.projectID)),
                  )

                  if (requests.permission) return "approval"

                  if (requests.form) return "input"

                  return "working"
                })

                const statusLabel = createMemo(() =>
                  status() === "unread"
                    ? language.t("sidebar.running.unread")
                    : language.t(`sidebar.inbox.status.${status()}`),
                )

                const selected = () =>
                  props.selected?.server === entry().server && props.selected.sessionID === entry().id

                return (
                  <button
                    type="button"
                    data-slot="active-session"
                    data-state={selected() ? "active" : undefined}
                    aria-current={selected() ? "page" : undefined}
                    title={[
                      session()?.title,
                      projectName(),
                      branch(),
                      session()?.location.directory,
                      sessionLastRunLabel(session()?.time, language),
                      entry().unread ? statusLabel() : summary(),
                      ...(entry().unread
                        ? []
                        : entry()
                            .ctx.data.session.activity.list(entry().id, true)
                            .map((item) => item.title)),
                    ]
                      .filter(Boolean)
                      .join("\n")}
                    onClick={() => {
                      const value = entry()
                      props.onOpen(value.server, value.id)
                      const directory = project()?.worktree

                      if (directory) value.ctx.projects.touch(directory)
                    }}
                  >
                    <span data-slot="active-session-mark" aria-hidden="true">
                      <Show
                        when={status() === "working"}
                        fallback={
                          <Show
                            when={status() === "unread"}
                            fallback={<span data-slot="active-session-waiting" />}
                          >
                            <span data-slot="active-session-unread" />
                          </Show>
                        }
                      >
                        <ActivityRing />
                      </Show>
                    </span>
                    <span data-slot="active-session-title" dir="auto">
                      {sessionTabTitle(session()?.title, language.t("session.tab.session"))}
                    </span>
                    <span
                      data-slot="active-session-status"
                      data-waiting={status() === "approval" || status() === "input" ? "" : undefined}
                      data-unread={status() === "unread" ? "" : undefined}
                      title={status() === "working" ? summary() : statusLabel()}
                    >
                      <span class="sr-only">{statusLabel()}</span>
                      <span aria-hidden="true">
                        {status() === "working" ? (duration() ?? language.t("sidebar.inbox.status.working")) : statusLabel()}
                      </span>
                    </span>
                    <span data-slot="active-session-project" dir="auto">
                      <Show when={project()} fallback={language.t("common.loading")}>
                        <span class="min-w-0 truncate">{projectName()}</span>
                      </Show>
                      <Show when={!entry().unread && entry().ctx.data.session.status(entry().id) !== "running"}>
                        <span aria-hidden="true">·</span>
                        <span class="truncate" title={summary()}>
                          {language.t("sidebar.running.background")}
                        </span>
                      </Show>
                      <Show when={branch() || worktree()}>
                        <span aria-hidden="true">·</span>
                        <span class="flex min-w-0 items-center gap-1">
                          <Icon name={worktree() ? "outline-worktree" : "branch"} size="small" class="shrink-0" />
                          <span class="min-w-0 truncate" dir="ltr">
                            {branch()}
                          </span>
                        </span>
                      </Show>
                      <Show when={props.connections.length > 1}>
                        <span class="ms-1.5">{serverName(entry().conn)}</span>
                      </Show>
                    </span>
                  </button>
                )
              }}
            </Show>
          )}
        </For>
      </div>
      <Show when={disconnected() && entries().length > 0}>
        <p data-slot="active-sessions-empty">{language.t("sidebar.running.disconnected")}</p>
      </Show>
      <Show when={unavailable() && entries().length > 0}>
        <p data-slot="active-sessions-empty">{language.t("sidebar.running.unavailable")}</p>
      </Show>
    </section>
  )
}
