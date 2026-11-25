import { createMemo, createSignal, onCleanup } from "solid-js"
import { usePlugin, type MountedSession } from "@opencode/plugin/gui"
import { showToast } from "@opencode/ui/toast"
import type SessionGo from "../index"
import {
  actionLinked,
  appendCommitment,
  decisionConfirmed,
  decisionDeferred,
  decisionPromoted,
  decisionRejected,
  decisionSuperseded,
  migrateCommitmentLog,
} from "../store-commitments"
import type { CommitmentEvent, SourceRef } from "../types"
import { createSessionGoData } from "./data"
import { isActionable } from "./filters"

type AnalysisState = {
  status: "idle" | "running" | "error"
  error?: string
}

/** The panel read model: shared session data, manual facts, and one model analysis run at a time. */
export function createSessionGoModel(session: () => MountedSession) {
  const ctx = usePlugin<typeof SessionGo>()
  const data = createSessionGoData(session)
  const commitments = () => ctx.stores.commitments(session())
  const settings = data.settings

  const [selected, setSelected] = createSignal<string>()

  const selectedDecision = createMemo(() => {
    const current = selected()

    if (current && data.decisions().some((decision) => decision.id === current)) return current

    return (data.decisions().find(isActionable) ?? data.decisions()[0])?.id
  })

  const linkableDecision = createMemo(() => {
    const decision = data.decisions().find((item) => item.id === selectedDecision())

    if (!decision) return

    if (decision.status === "dropped" || decision.status === "superseded") return

    return decision
  })

  const [analysis, setAnalysis] = createSignal<AnalysisState>({ status: "idle" })
  const [revealing, setRevealing] = createSignal(false)
  let running: AbortController | undefined

  onCleanup(() => running?.abort())

  const lastAnalysis = createMemo(() => data.l2Snapshots().at(-1))

  const analysisStale = createMemo(() => {
    const snapshot = lastAnalysis()

    if (!snapshot) return false

    return snapshot.scope.toMessageID !== data.extraction().at(-1)?.id
  })

  const analyze = async () => {
    if (analysis().status === "running") return

    const preview = data.manualPreview()

    if (!preview) return

    const controller = new AbortController()
    running = controller
    setAnalysis({ status: "running" })

    try {
      const snapshot = await data.runAnalysis({
        trigger: "manual",
        slice: preview,
        signal: controller.signal,
      })

      data.saveL2(snapshot)
      setAnalysis({ status: "idle" })
    } catch (error) {
      if (controller.signal.aborted) {
        setAnalysis({ status: "idle" })

        return
      }

      setAnalysis({
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      if (running === controller) running = undefined
    }
  }

  const cancelAnalysis = () => running?.abort()

  const revealSource = async (source: SourceRef) => {
    if (!source.messageID) {
      showToast({ title: ctx.t("source.unavailable"), variant: "error" })

      return false
    }

    setRevealing(true)

    try {
      const revealed = await ctx.sessions.reveal(session(), source.messageID)

      if (!revealed) showToast({ title: ctx.t("source.unavailable"), variant: "error" })

      return revealed
    } finally {
      setRevealing(false)
    }
  }

  const revealTurn = async (messageID: string, options?: { silent?: boolean }) => {
    setRevealing(true)

    try {
      const revealed = await ctx.sessions.reveal(session(), messageID)

      if (!revealed && !options?.silent) showToast({ title: ctx.t("source.unavailable"), variant: "error" })

      return revealed
    } finally {
      setRevealing(false)
    }
  }

  const commit = (event: CommitmentEvent) => {
    if (!settings().commitments) return

    commitments().update((draft) => {
      const current = migrateCommitmentLog({
        schemaVersion: draft.schemaVersion,
        events: draft.events,
      })

      draft.schemaVersion = current.schemaVersion
      // SAFETY: the draft only drops readonly from the same events; nothing is narrowed or altered.
      draft.events = appendCommitment(current, event).events as typeof draft.events
    })
  }

  const findDecision = (id: string) => data.decisions().find((decision) => decision.id === id)

  const confirmDecision = (id: string) => {
    const decision = findDecision(id)

    if (decision) commit(decisionConfirmed(decision))
  }

  const rejectDecision = (id: string) => {
    const decision = findDecision(id)

    if (decision) commit(decisionRejected(decision))
  }

  const deferDecision = (id: string) => {
    const decision = findDecision(id)

    if (decision) commit(decisionDeferred(decision))
  }

  const supersedeDecision = (id: string, supersededBy: string) => {
    const decision = findDecision(id)

    if (decision) commit(decisionSuperseded(decision, supersededBy))
  }

  const promoteAction = (id: string) => {
    const action = data.actions().find((item) => item.id === id)

    if (!action) return

    commit(decisionPromoted(action))
    setSelected(`promoted-${action.id}`)
  }

  const linkActionToGoal = (id: string) => {
    const goal = data.goals()[0]

    if (goal) commit(actionLinked(id, { goalID: goal.id }))
  }

  const linkActionToDecision = (id: string) => {
    const decision = linkableDecision()

    if (decision) commit(actionLinked(id, { decisionID: decision.id }))
  }

  return {
    ready: data.ready,
    hasFacts: data.hasFacts,
    goal: () => data.goals()[0],
    goals: data.goals,
    decisions: data.decisions,
    actions: data.actions,
    evidence: data.evidence,
    next: data.next,
    authoritative: data.authoritative,
    links: data.links,
    selectedDecision,
    linkableDecision,
    selectDecision: setSelected,
    relatedActions: data.relatedActions,
    isPromoted: data.isPromoted,
    commitmentsEnabled: () => settings().commitments,
    confirmDecision,
    rejectDecision,
    deferDecision,
    supersedeDecision,
    promoteAction,
    linkActionToGoal,
    linkActionToDecision,
    manualPreview: data.manualPreview,
    projectGoal: data.projectGoal,
    lastAnalysis,
    analysisStale,
    analysis: analysis,
    analyze,
    cancelAnalysis,
    revealSource,
    revealTurn,
    revealing,
    history: data.history,
    analysisEnabled: () => settings().modelAnalysis,
    autoEnabled: () => settings().autoAnalyze,
    cacheEnabled: () => settings().keepAnalysis,
    openSettings: () => ctx.layout.settings("session-go"),
  }
}

export type SessionGoModel = ReturnType<typeof createSessionGoModel>
