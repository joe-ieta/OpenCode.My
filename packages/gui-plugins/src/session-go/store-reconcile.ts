import type { CommitmentEvent, DecisionNode, SessionGraph } from "./types"

/** Applies the durable commitment log over a candidate graph. */
export function reconcileGraph(graph: SessionGraph, events: readonly CommitmentEvent[]): SessionGraph {
  if (events.length === 0) return graph

  const decisions = graph.decisions.map((decision) => ({ ...decision }))
  const edges = graph.edges.map((edge) => ({ ...edge }))

  const apply = (event: CommitmentEvent, patch: (base: DecisionNode) => Partial<DecisionNode>) => {
    const index = decisions.findIndex((decision) => decision.id === event.targetID)

    if (index >= 0) {
      const base = decisions[index]!
      decisions[index] = { ...base, ...patch(base) }

      return
    }

    // A candidate the extraction dropped still comes back from the snapshot the commitment recorded.
    if (event.decision) decisions.push({ ...event.decision, ...patch(event.decision) })
  }

  const addEdge = (from: string, to: string, kind: "relatedTo" | "supersedes") => {
    if (edges.some((edge) => edge.from === from && edge.to === to && edge.kind === kind)) return

    edges.push({ from, to, kind })
  }

  for (const event of events) {
    if (event.type === "decision.confirmed") {
      apply(event, (base) => ({
        status: base.kind === "open-question" ? "resolved" : "active",
        authority: "confirmed",
        deferred: false,
      }))
      continue
    }

    if (event.type === "decision.rejected") {
      apply(event, () => ({ status: "dropped", deferred: false }))
      continue
    }

    if (event.type === "decision.deferred") {
      apply(event, () => ({ deferred: true }))
      continue
    }

    if (event.type === "decision.superseded") {
      apply(event, () => ({ status: "superseded", supersededBy: event.supersededBy }))

      if (event.supersededBy) addEdge(event.supersededBy, event.targetID, "supersedes")
      continue
    }

    if (event.type === "decision.promoted" && event.decision) {
      if (!decisions.some((decision) => decision.id === event.decision?.id)) {
        decisions.push({ ...event.decision })
      }

      continue
    }

    if (event.type === "action.linked") {
      const target = event.goalID ?? event.decisionID

      if (target) addEdge(event.actionID ?? event.targetID, target, "relatedTo")
    }
  }

  return { ...graph, decisions, edges }
}
