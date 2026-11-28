import { createMemo, createSignal, For, lazy, onCleanup, onMount, Show, Suspense } from "solid-js"
import { Portal } from "solid-js/web"
import { Icon } from "@opencode/ui/icon"
import { IconButton } from "@opencode/ui/icon-button"
import { Tooltip } from "@opencode/ui/tooltip"
import {
  Command,
  MenuItem,
  SettingsPage,
  Slot,
  Style,
  usePanel,
  type ClosedPanelTab,
  type MountedSession,
  type Plugin,
} from "@opencode/plugin/gui"
import { BuiltinPanel, onIdle, type BuiltinPanelTab } from "@opencode/plugin/gui/builtin"
import styles from "./floating.css?inline"
import type definition from "./index"
import type { HistoryTurn } from "./panel/history"
import { recentTurns } from "./panel/last-turn"
import { formatTurnDuration } from "./panel/turn-format"
import { createGoChat } from "./chat-model"
import { floatingLayout } from "./floating-layout"

const TAB = "main"

const hintTimeFormat = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
})

function hintMeta(turn: HistoryTurn) {
  const time = hintTimeFormat.format(turn.createdAt)

  return turn.durationMs === undefined ? time : `${time} · ${formatTurnDuration(turn.durationMs)}`
}

const setup: Plugin.Setup<typeof definition> = (ctx) => {
  const key = `${ctx.id}:${TAB}`
  const enabled = () => ctx.stores.settings.value.enabled
  const SessionGoPanel = lazy(() => import("./panel/panel"))
  const SessionGoAuto = lazy(() => import("./panel/auto"))
  const SessionGoSettings = lazy(() => import("./settings"))
  const GoChatPanel = lazy(() => import("./chat-panel"))

  ctx.add(Style, styles)

  // Compile both chunks while the app idles, so the first open and settings visit render at once.
  onCleanup(
    onIdle(() => {
      void SessionGoPanel.preload()
      void SessionGoSettings.preload()
      void GoChatPanel.preload()

      if (ctx.stores.settings.value.autoAnalyze) void SessionGoAuto.preload()
    }),
  )

  const open = (session = ctx.sessions.current()) => {
    if (!session || !enabled()) return
    ctx.layout.open(key, session, { tab: ctx.layout.narrow() ? "open" : "select" })
  }

  // Anchored above the composer's send button and following it as the composer grows or the window changes.
  const FloatingSessionGo = (props: { session: MountedSession }) => {
    const chatModel = createGoChat(() => props.session)
    const [chatOpened, setChatOpened] = createSignal(false)
    const [chatMounted, setChatMounted] = createSignal(false)
    const [viewport, setViewport] = createSignal({ width: window.innerWidth, height: window.innerHeight })
    const [position, setPosition] = createSignal<{ top: number; left: number }>()
    const [opened, setOpened] = createSignal(false)
    const [mounted, setMounted] = createSignal(false)
    const [openToken, setOpenToken] = createSignal(0)
    const [hintOpen, setHintOpen] = createSignal(false)

    const recent = createMemo(() => {
      if (!hintOpen()) return []

      const id = props.session.id

      return id ? recentTurns(props.session.server.data.session.message.list(id), 3) : []
    })

    const [docked, setDocked] = createSignal<{ top: number; left: number; width: number; height: number }>()
    let fab: HTMLDivElement | undefined
    let panel: HTMLDivElement | undefined
    let chatWindow: HTMLDivElement | undefined
    let send: HTMLElement | undefined
    let composer: HTMLElement | undefined
    let chat: HTMLElement | undefined
    let observer: ResizeObserver | undefined
    let frame: number | undefined
    let settleFrame: number | undefined
    let tries = 0

    const measure = (force = false) => {
      if (docked()) return

      // Keep the open panel still while the composer grows or shrinks under it.
      if (!force && opened()) return

      if (!send?.isConnected) {
        setOpened(false)
        setPosition(undefined)
        find()

        return
      }

      const rect = send.getBoundingClientRect()
      const anchor = composer?.getBoundingClientRect() ?? rect

      if (rect.width === 0) {
        setOpened(false)
        setPosition(undefined)

        return
      }

      const size = 32
      setPosition({ top: Math.round(anchor.top - size - 8), left: Math.round(rect.right - size) })
    }

    const settle = (remaining: number) => {
      measure()

      if (remaining > 0) settleFrame = requestAnimationFrame(() => settle(remaining - 1))
    }

    const find = () => {
      const candidates = document.querySelectorAll<HTMLElement>('[data-action="composer-submit"]')
      send = Array.from(candidates).find((element) => element.getClientRects().length > 0)
      observer?.disconnect()
      observer = undefined

      if (!send) {
        composer = undefined
        chat = undefined
        setOpened(false)
        setPosition(undefined)

        if (++tries < 120) frame = requestAnimationFrame(find)

        return
      }

      tries = 0
      composer = send.closest<HTMLElement>('[data-component="composer"]') ?? undefined
      chat = send.closest<HTMLElement>('[data-slot="session-chat-panel"]') ?? undefined
      observer = new ResizeObserver(() => measure())
      observer.observe(send)

      if (composer) observer.observe(composer)

      if (chat) observer.observe(chat)

      settle(6)
    }

    onMount(() => {
      void SessionGoPanel.preload()
      find()

      const resize = () => {
        setViewport({ width: window.innerWidth, height: window.innerHeight })
        measure(true)
      }

      const outside = (event: Event) => {
        if (!opened() || docked()) return

        const target = event.target

        if (!(target instanceof Node)) return

        if (panel?.contains(target) || chatWindow?.contains(target) || fab?.contains(target)) return

        if (target instanceof Element && target.closest("[data-kb-top-layer]")) return

        setOpened(false)
      }

      const escape = (event: KeyboardEvent) => {
        if (event.key !== "Escape" || !opened() || docked()) return

        if (event.target instanceof Element && event.target.closest("[data-kb-top-layer]")) return

        if (chatOpened()) {
          setChatOpened(false)
          event.preventDefault()
          event.stopPropagation()

          return
        }

        setOpened(false)
      }

      const blur = () => {
        if (!docked()) setOpened(false)
      }

      window.addEventListener("resize", resize)
      window.addEventListener("pointerdown", outside, true)
      window.addEventListener("focusin", outside, true)
      window.addEventListener("keydown", escape, true)
      window.addEventListener("blur", blur)
      onCleanup(() => {
        window.removeEventListener("resize", resize)
        window.removeEventListener("pointerdown", outside, true)
        window.removeEventListener("focusin", outside, true)
        window.removeEventListener("keydown", escape, true)
        window.removeEventListener("blur", blur)
        observer?.disconnect()

        if (frame !== undefined) cancelAnimationFrame(frame)

        if (settleFrame !== undefined) cancelAnimationFrame(settleFrame)
      })
    })

    const label = () => ctx.t(opened() ? "fab.close" : "fab.open")

    const toggle = () => {
      const next = !opened()

      if (next) measure(true)

      setMounted(true)
      setOpened(next)

      if (!next) measure(true)

      if (next) setOpenToken((value) => value + 1)
    }

    const dockHere = () => {
      const rect = panel?.getBoundingClientRect()

      if (!rect) return

      setDocked({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })
      setOpened(true)
    }

    const undock = () => {
      setDocked(undefined)
      measure(true)
      setOpened(true)
    }

    const rectangles = createMemo(() => {
      const dock = docked()
      const current = position()

      if (!current) return undefined
      const size = viewport()
      const height = Math.max(240, Math.min(640, size.height - 32, current.top - 16))
      const width = Math.min(440, Math.max(280, size.width - 24))

      return floatingLayout(
        dock ?? {
          top: Math.max(8, current.top - height - 8),
          left: size.width - Math.max(12, size.width - (current.left + 32)) - width,
          width,
          height,
        },
        size,
        chatMounted(),
      )
    })

    const panelStyle = (kind: "main" | "chat") => {
      const rect = rectangles()?.[kind]

      if (!rect) return undefined

      return {
        top: rect.top + "px",
        left: rect.left + "px",
        width: rect.width + "px",
        height: rect.height + "px",
      }
    }

    return (
      <Show when={position()}>
        {(position) => (
          <>
            <Show when={!docked()}>
              <div
                ref={(element) => (fab = element)}
                data-component="session-go-fab"
                data-opened={opened() ? "" : undefined}
                style={{ position: "fixed", top: position().top + "px", left: position().left + "px" }}
                onPointerEnter={() => setHintOpen(true)}
                onPointerLeave={() => setHintOpen(false)}
                onFocusIn={() => setHintOpen(true)}
                onFocusOut={() => setHintOpen(false)}
              >
                <Tooltip
                  placement="left"
                  appearance="large"
                  value={
                    <div class="flex w-96 max-w-[calc(100vw-24px)] flex-col gap-1">
                      <Show
                        when={recent().length > 0}
                        fallback={<span class="text-12-regular text-text-strong">{ctx.t("fab.clickToOpen")}</span>}
                      >
                        <p class="mb-2 text-11-regular text-text-muted">
                          {ctx.t("fab.recentInputs", { count: recent().length })}
                        </p>
                        <div class="flex flex-col gap-2">
                          <For each={recent().toReversed()}>
                            {(turn) => (
                              <div data-slot="fab-turn" class="flex min-w-0 flex-col gap-0.5">
                                <p class="whitespace-pre-wrap break-words text-12-regular text-text-strong">
                                  {turn.text}
                                </p>
                                <span class="self-end text-11-regular text-text-muted">{hintMeta(turn)}</span>
                              </div>
                            )}
                          </For>
                        </div>
                        <div role="separator" class="my-0.5 h-px w-full bg-border-muted" />
                        <span class="text-11-regular text-text-faint">
                          {ctx.t(opened() ? "fab.clickToClose" : "fab.clickToOpen")}
                        </span>
                      </Show>
                    </div>
                  }
                >
                  <IconButton
                    variant="neutral"
                    size="large"
                    class="session-go-fab-button"
                    aria-label={label()}
                    aria-pressed={opened()}
                    icon={<Icon name="checklist" />}
                    onClick={toggle}
                  />
                </Tooltip>
              </div>
            </Show>

            <Show when={mounted()}>
              <div
                ref={(element) => (panel = element)}
                data-component="session-go-floating"
                data-docked={docked() ? "" : undefined}
                data-floating-overlay={opened() || docked() ? "" : undefined}
                class="session-go-float"
                classList={{ hidden: !opened() && !docked() }}
                style={panelStyle("main")}
              >
                <Suspense
                  fallback={
                    <div class="flex h-full items-center justify-center p-4 text-12-regular text-text-faint">
                      {ctx.t("panel.loading")}
                    </div>
                  }
                >
                  <SessionGoPanel
                    session={props.session}
                    mobile={false}
                    dock={{ docked: !!docked(), toggle: docked() ? undock : dockHere }}
                    timeline
                    chat={{
                      opened: chatOpened(),
                      toggle: () => {
                        setChatMounted(true)
                        setChatOpened(!chatOpened())
                      },
                    }}
                    openToken={openToken()}
                  />
                </Suspense>
              </div>
            </Show>
            <Show when={chatMounted()}>
              <div
                ref={(element) => (chatWindow = element)}
                data-component="session-go-chat-floating"
                data-floating-overlay={chatOpened() && (opened() || docked()) ? "" : undefined}
                classList={{ hidden: !chatOpened() || (!opened() && !docked()) }}
                style={panelStyle("chat")}
              >
                <Suspense
                  fallback={<div class="h-full p-4 text-12-regular text-text-faint">{ctx.t("panel.loading")}</div>}
                >
                  <GoChatPanel
                    model={chatModel}
                    visible={chatOpened() && !!(opened() || docked())}
                    onClose={() => setChatOpened(false)}
                  />
                </Suspense>
              </div>
            </Show>
          </>
        )}
      </Show>
    )
  }

  const tab: BuiltinPanelTab = {
    id: TAB,
    get title() {
      return ctx.t("tab.title")
    },
    label: () => (
      <div class="flex items-center gap-1.5">
        <Icon name="checklist" />
        <span>{ctx.t("tab.title")}</span>
      </div>
    ),
    dom: { tab: "session-side-panel-session-go-tab", panel: "session-side-panel-session-go-tabpanel" },
  }

  ctx.add(Slot, (): Slot | undefined => {
    if (!enabled()) return

    return {
      at: "session.header",
      order: 15,
      render: (input) => (
        <>
          <Show when={ctx.stores.settings.value.autoAnalyze && ctx.stores.settings.value.keepAnalysis}>
            <Suspense fallback={null}>
              <SessionGoAuto session={input.session} />
            </Suspense>
          </Show>
          <Tooltip placement="bottom" value={ctx.t("header.open")}>
            <IconButton
              variant="ghost-muted"
              size="large"
              aria-label={ctx.t("header.open")}
              icon={<Icon name="checklist" />}
              onClick={() => open(input.session)}
            />
          </Tooltip>
          <Show when={input.active ? input.session.key : undefined} keyed>
            <Portal>
              <FloatingSessionGo session={input.session} />
            </Portal>
          </Show>
        </>
      ),
    }
  })

  ctx.add(BuiltinPanel, (): BuiltinPanel | undefined => {
    if (!enabled()) return

    return {
      id: TAB,
      region: "side",
      mobile: {
        get title() {
          return ctx.t("mobile.title")
        },
        order: 45,
        kind: "drawer",
        icon: "checklist",
      },
      list: (input) => (ctx.layout.narrow() || !input.open.includes(TAB) ? [] : [tab]),
      closed: (): ClosedPanelTab => ({ icon: "checklist" }),
      render: (input) => {
        const panel = usePanel()

        return (
          <div class="relative flex h-full min-h-0 flex-col overflow-hidden">
            <Suspense>
              <SessionGoPanel session={input.session} mobile={panel.placement() === "mobile"} />
            </Suspense>
          </div>
        )
      },
    }
  })

  ctx.add(Command, (): Command | undefined => {
    if (!enabled() || !ctx.sessions.current()) return

    return {
      id: "open",
      title: ctx.t("command.open"),
      group: ctx.t("command.category.view"),
      section: "session",
      run: () => open(),
    }
  })

  ctx.add(MenuItem, (): MenuItem | undefined => {
    if (!enabled() || ctx.layout.narrow()) return

    const session = ctx.sessions.current()

    return {
      menu: "session.panel",
      id: "open",
      title: ctx.t("menu.open"),
      icon: "checklist",
      order: 25,
      opened: session ? ctx.layout.state(key, session) !== "closed" : undefined,
      run: () => open(),
    }
  })

  // The settings page stays available while the feature is off, so the switch that turns it on can be found.
  ctx.add(SettingsPage, {
    id: "session-go",
    icon: "checklist",
    get title() {
      return ctx.t("settings.title")
    },
    get entries() {
      return [
        {
          id: "settings-session-go-enabled",
          title: ctx.t("settings.enabled.title"),
          keywords: ctx.t("settings.search.enabled"),
        },
        {
          id: "settings-session-go-keep-analysis",
          title: ctx.t("settings.keepAnalysis.title"),
          keywords: ctx.t("settings.search.keepAnalysis"),
        },
        {
          id: "settings-session-go-commitments",
          title: ctx.t("settings.commitments.title"),
          keywords: ctx.t("settings.search.commitments"),
        },
        {
          id: "settings-session-go-model-analysis",
          title: ctx.t("settings.modelAnalysis.title"),
          keywords: ctx.t("settings.search.modelAnalysis"),
        },
        {
          id: "settings-session-go-auto-analyze",
          title: ctx.t("settings.autoAnalyze.title"),
          keywords: ctx.t("settings.search.autoAnalyze"),
        },
        {
          id: "settings-session-go-history-index",
          title: ctx.t("settings.historyIndex.title"),
          keywords: ctx.t("settings.search.historyIndex"),
        },
        {
          id: "settings-session-go-preview",
          title: ctx.t("settings.preview.title"),
          keywords: ctx.t("settings.search.preview"),
        },
      ]
    },
    render: () => (
      <Suspense>
        <SessionGoSettings />
      </Suspense>
    ),
  })
}

export default setup
