import { createMemo, createSignal, onCleanup, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { Icon } from "@opencode/ui/icon"
import { IconButton } from "@opencode/ui/icon-button"
import { createKeyed, usePlugin, type MountedSession } from "@opencode/plugin/gui"
import type SessionGo from "../index"
import { ActionsSection } from "./actions"
import { AnalysisSection } from "./analysis"
import { createSessionGoModel } from "./controller"
import { DecisionsSection } from "./decisions"
import { type ActionFilter, type ActionView, type DecisionFilter } from "./filters"
import { GoalSection } from "./goal"
import { NextDecisionSection } from "./next-decision"
import { SearchSection } from "./search"
import { EmptyCard } from "./section"
import { TimelineRail } from "./timeline-rail"
import type { HistoryTurn } from "./history"
import { formatTurnDuration, turnTimeFormat } from "./turn-format"

type ViewState = {
  decisionFilter: DecisionFilter
  actionFilter: ActionFilter
  actionView: ActionView
}

/** The decision-first Session Go panel, backed by this session's candidate cache and commitment log. */
export default function SessionGoPanel(props: {
  session: MountedSession
  mobile: boolean
  /** Present in the floating window; the side panel keeps the plain header. */
  dock?: { docked: boolean; toggle: () => void }
  /** Show the turn rail in the floating and docked windows. */
  timeline?: boolean
  chat?: { opened: boolean; toggle: () => void }
  /** Increments whenever the floating window opens; undefined in the side panel. */
  openToken?: number
}) {
  const ctx = usePlugin<typeof SessionGo>()
  const model = createSessionGoModel(() => props.session)

  const [view, setView] = createStore<ViewState>({
    decisionFilter: "all",
    actionFilter: "all",
    actionView: "list",
  })

  const [activeTurn, setActiveTurn] = createSignal<string>()

  const activeTurnData = createMemo(() => {
    const id = activeTurn()
    const turns = model.history.turns()
    const index = turns.findIndex((turn) => turn.id === id)

    return index >= 0 ? { turn: turns[index]!, index } : undefined
  })

  let revealedToken: number | undefined
  let revealTarget: string | undefined
  let revealFrame: number | undefined
  let scroller: HTMLDivElement | undefined
  let turnSection: HTMLElement | undefined
  let turnScrollFrame: number | undefined

  const stopReveal = () => {
    revealTarget = undefined

    if (revealFrame !== undefined) cancelAnimationFrame(revealFrame)

    revealFrame = undefined
  }

  const turnVisible = (messageID: string) => {
    const message = document.getElementById("message-" + messageID)
    const visible = document.querySelector('[data-slot="session-timeline-visible"]')

    if (!message || !visible) return false

    const box = message.getBoundingClientRect()
    const view = visible.getBoundingClientRect()

    if (box.width === 0 || box.height === 0) return false

    const overlap = Math.min(box.bottom, view.bottom) - Math.max(box.top, view.top)

    return overlap >= Math.min(24, box.height * 0.5)
  }

  // The timeline can mount a frame or two after the panel, so retry until the turn is actually in view.
  const revealWhenReady = async (messageID: string, options?: { silent?: boolean }) => {
    stopReveal()
    revealTarget = messageID
    let attempt = 0

    const tryReveal = async () => {
      if (revealTarget !== messageID) return

      const revealed = await model.revealTurn(messageID, { silent: true })

      if (revealTarget !== messageID) return

      if (revealed && turnVisible(messageID)) return

      if (++attempt >= 180) {
        if (!options?.silent) void model.revealTurn(messageID)

        return
      }

      revealFrame = requestAnimationFrame(() => void tryReveal())
    }

    await tryReveal()
  }

  const scrollPanelToTurn = () => {
    if (turnScrollFrame !== undefined) cancelAnimationFrame(turnScrollFrame)

    turnScrollFrame = requestAnimationFrame(() => {
      turnScrollFrame = undefined
      const section = turnSection
      const scroll = scroller

      if (!section || !scroll) return

      const top = section.getBoundingClientRect().top - scroll.getBoundingClientRect().top + scroll.scrollTop
      scroll.scrollTo({ top: Math.max(0, top - 8), behavior: "auto" })
    })
  }

  const durationText = (turn: HistoryTurn) =>
    turn.durationMs === undefined
      ? ctx.t(model.history.status() === "loading" ? "timeline.durationLoading" : "timeline.durationUnknown")
      : ctx.t("timeline.duration", { duration: formatTurnDuration(turn.durationMs) })

  onCleanup(() => {
    stopReveal()

    if (turnScrollFrame !== undefined) cancelAnimationFrame(turnScrollFrame)
  })

  const selectTurn = (messageID: string) => {
    setActiveTurn(messageID)
    scrollPanelToTurn()
    void revealWhenReady(messageID)
  }

  // A new session starts with its own turn index. The full transcript, search index, and observed
  // durations load only from the Search section so opening the panel does not compete with typing.
  createKeyed(
    () => props.session.key,
    () => {
      revealedToken = undefined
      stopReveal()
      setActiveTurn(undefined)
      model.history.reset()

      if (props.timeline) void model.history.loadTurns()
    },
  )

  // Every open selects the newest turn, also when the first turns arrive after the panel mounted.
  createKeyed(
    () => ({ token: props.openToken, last: model.history.turns().at(-1)?.id }),
    (value) => {
      if (value.token === undefined || !value.last || value.token === revealedToken) return

      revealedToken = value.token
      setActiveTurn(value.last)
      void revealWhenReady(value.last, { silent: true })
    },
    { equals: (previous, next) => previous.token === next.token && previous.last === next.last },
  )

  return (
    <div class="flex h-full min-h-0 bg-background-base" data-component="session-go-panel">
      <div ref={(element) => (scroller = element)} class="min-h-0 flex-1 overflow-y-auto" data-scrollable>
        <div
          class="@container flex flex-col gap-6"
          classList={{ "px-3 py-3": props.mobile, "px-4 py-4": !props.mobile }}
        >
          <header class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <Icon name="checklist" class="text-text-weak" />
              <h1 class="text-14-medium text-text-strong">{ctx.t("panel.title")}</h1>
              <div class="ms-auto flex items-center gap-1">
                <span class="rounded-full border border-border-muted px-2 py-0.5 text-11-regular text-text-weak">
                  {ctx.t("panel.badge")}
                </span>
                <Show when={props.dock}>
                  {(dock) => (
                    <IconButton
                      variant="ghost-muted"
                      size="large"
                      icon={<Icon name="pin" />}
                      aria-label={ctx.t(dock().docked ? "panel.undock" : "panel.dock")}
                      aria-pressed={dock().docked}
                      data-docked={dock().docked ? "" : undefined}
                      onClick={() => dock().toggle()}
                    />
                  )}
                </Show>
              </div>
            </div>
            <p class="text-12-regular text-text-weak">{ctx.t("panel.description")}</p>
            <p role="note" class="rounded-md border border-border-muted px-3 py-2 text-12-regular text-text-weak">
              {ctx.t("panel.note")}
            </p>

            <Show when={model.ready()}>
              <p class="text-11-regular text-text-faint" data-summary>
                {ctx.t("panel.summary", {
                  goals: model.goals().length,
                  decisions: model.decisions().length,
                  actions: model.actions().length,
                  confirmed: model.authoritative(),
                })}
              </p>
            </Show>
          </header>

          <Show when={activeTurnData()}>
            {(data) => (
              <section
                ref={(element) => (turnSection = element)}
                data-section="turn"
                class="flex flex-col gap-1.5 rounded-md border border-border-muted px-3 py-2"
              >
                <div class="flex items-center justify-between gap-2">
                  <h2 class="text-13-medium text-text-strong">
                    {ctx.t("timeline.turnIndex", { index: data().index + 1 })}
                  </h2>
                  <span class="text-11-regular text-text-faint">{turnTimeFormat.format(data().turn.createdAt)}</span>
                </div>
                <p class="line-clamp-6 whitespace-pre-wrap break-words text-12-regular text-text-weak">
                  {data().turn.text}
                </p>
                <span class="text-11-regular text-text-faint">{durationText(data().turn)}</span>
              </section>
            )}
          </Show>

          <Show
            when={model.ready()}
            fallback={<p class="text-12-regular text-text-weak">{ctx.t("panel.loading")}</p>}
          >
            <Show
              when={model.hasFacts()}
              fallback={
                <EmptyCard title={ctx.t("panel.empty")} description={ctx.t("panel.empty.description")} />
              }
            >
              <GoalSection goal={model.goal()} projectGoal={model.projectGoal()} onReveal={model.revealSource} />

              <NextDecisionSection
                items={model.next()}
                disabled={!model.commitmentsEnabled()}
                onConfirm={model.confirmDecision}
                onReject={model.rejectDecision}
                onDefer={model.deferDecision}
                onSelectDecision={model.selectDecision}
                onReveal={model.revealSource}
              />

              <AnalysisSection
                preview={model.manualPreview()}
                enabled={model.analysisEnabled()}
                autoEnabled={model.autoEnabled()}
                cacheEnabled={model.cacheEnabled()}
                status={model.analysis().status}
                error={model.analysis().error}
                last={model.lastAnalysis()}
                stale={model.analysisStale()}
                onAnalyze={model.analyze}
                onCancel={model.cancelAnalysis}
                onOpenSettings={model.openSettings}
              />

              <DecisionsSection
                decisions={model.decisions()}
                filter={view.decisionFilter}
                onFilter={(filter) => setView("decisionFilter", filter)}
                selected={model.selectedDecision()}
                onSelect={model.selectDecision}
                disabled={!model.commitmentsEnabled()}
                onConfirm={model.confirmDecision}
                onReject={model.rejectDecision}
                onDefer={model.deferDecision}
                onSupersede={model.supersedeDecision}
                onEdit={() => undefined}
                onOpenSource={model.revealSource}
                relatedActions={model.relatedActions}
              />

              <ActionsSection
                decisions={model.decisions()}
                actions={model.actions()}
                evidence={model.evidence()}
                filter={view.actionFilter}
                onFilter={(filter) => setView("actionFilter", filter)}
                view={view.actionView}
                onView={(actionView) => setView("actionView", actionView)}
                links={model.links()}
                selectedDecision={model.selectedDecision()}
                onSelectDecision={model.selectDecision}
                disabled={!model.commitmentsEnabled()}
                hasGoal={model.goals().length > 0}
                hasDecision={model.linkableDecision() !== undefined}
                promoted={model.isPromoted}
                onPromote={model.promoteAction}
                onLinkGoal={model.linkActionToGoal}
                onLinkDecision={model.linkActionToDecision}
                onReveal={model.revealSource}
              />
            </Show>

            <SearchSection
              rows={model.history.rows()}
              messageCount={model.history.messageCount()}
              status={model.history.status()}
              progress={model.history.progress()}
              complete={model.history.complete()}
              error={model.history.error()}
              hasHistory={model.history.hasHistory()}
              revealing={model.revealing()}
              onLoad={model.history.load}
              onCancel={model.history.cancel}
              onRetry={model.history.retry}
              onReveal={model.revealSource}
            />

            <p class="text-11-regular text-text-faint">{ctx.t("panel.footer")}</p>
          </Show>
        </div>
      </div>

      <Show when={props.timeline}>
        <TimelineRail
          chat={props.chat}
          turns={model.history.turns()}
          active={activeTurn()}
          status={model.history.turnStatus()}
          error={model.history.turnError()}
          durationPending={model.history.status() === "loading"}
          onRetry={model.history.loadTurns}
          onSelect={selectTurn}
        />
      </Show>
    </div>
  )
}
