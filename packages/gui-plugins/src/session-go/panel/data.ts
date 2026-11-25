import { createMemo } from "solid-js"
import { createKeyed, usePlugin, type MountedSession } from "@opencode/plugin/gui"
import type SessionGo from "../index"
import { buildNextDecisions } from "../graph-next-decision"
import { buildL2Prompt, mergeL2Snapshots } from "../l2-contract"
import { modelRefFromMessages, promptTokens, runL2Analysis, type L2Client } from "../l2-client"
import { sessionScope, type L2ScopeSlice } from "../l2-triggers"
import { projectGoalContext, projectGoalRefFrom, resolveProjectGoal } from "../project-goals"
import { extractionMessages } from "../session-messages"
import { sourceSettled, sourceSignature } from "../session-signature"
import { buildCandidateCache, graphFromCache } from "../store-candidate-cache"
import { reconcileGraph } from "../store-reconcile"
import type { L2ModelRef, L2Snapshot, L2Trigger } from "../types"
import type { FactLink } from "./filters"
import { createHistorySearch } from "./history"

export type L2Preview = L2ScopeSlice & {
  model?: L2ModelRef
  modelName: string
  promptTokens: number
}

/** The reactive data layer shared by the panel and the automatic analysis trigger. */
export function createSessionGoData(session: () => MountedSession) {
  const ctx = usePlugin<typeof SessionGo>()
  const settings = () => ctx.stores.settings.value
  const candidates = () => ctx.stores.candidates(session())
  const commitments = () => ctx.stores.commitments(session())

  const messages = createMemo(() => {
    const current = session()

    return current.id ? current.server.data.session.message.list(current.id) : []
  })

  const extraction = createMemo(() => extractionMessages(messages()))

  const projectGoal = createMemo(() => {
    const current = session()
    const projectID = current.project?.id ?? (current.listedProject ? `worktree:${current.listedProject.worktree}` : undefined)

    if (!projectID) return

    const name =
      current.project?.name ?? current.listedProject?.name ?? basename(current.directory)

    return resolveProjectGoal({
      projectID,
      stored: ctx.stores.projectGoals.value.goals,
      mockStatement: ctx.t("project.mock", { project: name }),
    })
  })

  const projectRef = createMemo(() => {
    const goal = projectGoal()

    return goal ? projectGoalRefFrom(goal) : undefined
  })

  const signature = createMemo(() => sourceSignature(extraction(), projectGoalContext(projectRef())))
  const settled = createMemo(() => sourceSettled(extraction()))
  const ready = createMemo(() => candidates().ready() && commitments().ready())

  const cached = () => (settings().keepAnalysis ? candidates().value : undefined)

  const built = createMemo(() => {
    if (!ready() || graphFromCache(cached(), signature())) return

    return buildCandidateCache({
      sessionKey: session().key,
      messages: extraction(),
      project: projectRef(),
    })
  })

  // Persist a settled snapshot once per source state. The stored graph is reused until the fingerprint changes.
  createKeyed(
    () => (settled() && settings().keepAnalysis ? built() : undefined),
    (value) => {
      candidates().update((draft) => {
        draft.schemaVersion = value.schemaVersion
        draft.ruleVersion = value.ruleVersion
        draft.modelVersion = value.modelVersion
        draft.sourceSignature = value.sourceSignature
        draft.updatedAt = value.updatedAt
        // SAFETY: the draft only drops readonly from the same graph; nothing is narrowed or altered.
        draft.graph = value.graph as typeof draft.graph
      })
    },
    { equals: (previous, next) => previous?.sourceSignature === next?.sourceSignature },
  )

  const graph = createMemo(() => graphFromCache(cached(), signature()) ?? built()?.graph)
  const l2Snapshots = createMemo(() => cached()?.l2 ?? [])
  const events = createMemo(() => commitments().value?.events ?? [])

  const merged = createMemo(() => {
    const base = graph()

    if (!base) return

    return mergeL2Snapshots(base, l2Snapshots())
  })

  const reconciled = createMemo(() => {
    const base = merged()

    if (!base) return

    return reconcileGraph(base, events())
  })

  const goals = createMemo(() => reconciled()?.goals ?? [])
  const decisions = createMemo(() => reconciled()?.decisions ?? [])
  const actions = createMemo(() => reconciled()?.actions ?? [])
  const evidence = createMemo(() => reconciled()?.evidence ?? [])

  const promoted = createMemo(
    () =>
      new Set(
        decisions()
          .flatMap((decision) => (decision.id.startsWith("promoted-") ? [decision.id] : [])),
      ),
  )

  const next = createMemo(() => {
    const current = reconciled()

    return current ? buildNextDecisions(current) : []
  })

  const links = createMemo(() => {
    const current = reconciled()
    const result: Record<string, FactLink | undefined> = {}

    if (!current) return result

    for (const edge of current.edges) {
      if (edge.kind !== "relatedTo") continue

      const link = result[edge.from] ?? {}

      if (current.goals.some((goal) => goal.id === edge.to)) link.goal = edge.to
      else if (current.decisions.some((decision) => decision.id === edge.to)) link.decision = edge.to

      result[edge.from] = link
    }

    return result
  })

  const relatedActions = (decisionID: string) => {
    const current = reconciled()

    if (!current) return []

    return current.edges
      .filter(
        (edge) => (edge.kind === "relatedTo" || edge.kind === "implements") && edge.to === decisionID,
      )
      .flatMap((edge) => {
        const action = current.actions.find((item) => item.id === edge.from)

        return action ? [action] : []
      })
  }

  const history = createHistorySearch({
    sessionID: () => session().id,
    client: () => session().server.client,
    live: extraction,
    graph: reconciled,
  })

  const modelRef = createMemo<L2ModelRef | undefined>(() => {
    const current = session()
    const info = current.id ? current.server.data.session.get(current.id) : undefined

    if (info?.model) return info.model

    return modelRefFromMessages(extraction())
  })

  const modelInfo = createMemo(() => {
    const ref = modelRef()
    const current = session()
    const list = current.server.data.location.model.list({ directory: current.directory })

    if (!ref) return

    return list?.findLast(
      (item) =>
        item.providerID === ref.providerID &&
        item.id === ref.id &&
        item.status !== "deprecated",
    )
  })

  const modelName = () => {
    const ref = modelRef()

    if (!ref) return "Server default model"

    return modelInfo()?.name ?? `${ref.providerID}/${ref.id}`
  }

  const manualPreview = createMemo<L2Preview | undefined>(() => {
    const slice = sessionScope(extraction())
    const current = reconciled()

    if (!slice || !current) return

    const prompt = buildL2Prompt({ graph: current, messages: slice.messages, scope: slice.scope })

    return {
      ...slice,
      model: modelRef(),
      modelName: modelName(),
      promptTokens: promptTokens(prompt),
    }
  })

  const client: L2Client = {
    text: (input, options) => session().server.client.session.generate(input, options),
  }

  const runAnalysis = async (input: {
    trigger: L2Trigger
    slice: L2ScopeSlice
    signal: AbortSignal
    now?: number
  }): Promise<L2Snapshot> => {
    const current = reconciled()

    if (!current) throw new Error("No session facts to analyze")

    return runL2Analysis({
      sessionID: session().id,
      graph: current,
      messages: input.slice.messages,
      scope: input.slice.scope,
      trigger: input.trigger,
      model: modelRef(),
      modelName: modelName(),
      client,
      signal: input.signal,
      now: input.now,
    })
  }

  const saveL2 = (snapshot: L2Snapshot) => {
    if (!settings().keepAnalysis) return

    candidates().update((draft) => {
      const list =
        snapshot.trigger === "manual"
          ? [snapshot]
          : [...(draft.l2 ?? []).filter((item) => item.key !== snapshot.key), snapshot].slice(-20)

      // SAFETY: the draft only drops readonly from the same snapshots; nothing is narrowed or altered.
      draft.l2 = list as typeof draft.l2
    })
  }

  return {
    settings,
    ready,
    extraction,
    graph,
    l2Snapshots,
    reconciled,
    goals,
    decisions,
    actions,
    evidence,
    next,
    links,
    relatedActions,
    manualPreview,
    history,
    projectGoal,
    projectRef,
    modelRef,
    modelName,
    runAnalysis,
    saveL2,
    isPromoted: (actionID: string) => promoted().has(`promoted-${actionID}`),
    hasFacts: () => goals().length + decisions().length + actions().length + evidence().length > 0,
    authoritative: () =>
      decisions().filter(
        (decision) =>
          decision.status !== "dropped" &&
          decision.status !== "superseded" &&
          (decision.authority === "confirmed" ||
            (decision.authority === "user" && decision.status === "active")),
      ).length,
  }
}

function basename(path: string) {
  return path.split(/[\\/]/).filter(Boolean).at(-1) ?? path
}
