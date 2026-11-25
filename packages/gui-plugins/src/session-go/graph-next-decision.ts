import { normalizeStatement } from "./extract-rules"
import type { NextDecision, SessionGraph } from "./types"

const MAX_NEXT_DECISIONS = 20

/** Builds the deterministic next-decision queue. Semantic conflicts are left to L2. */
export function buildNextDecisions(graph: SessionGraph): NextDecision[] {
  const queue: NextDecision[] = []

  for (const decision of graph.decisions) {
    if (decision.deferred) continue

    if (decision.status === "open") {
      queue.push({
        id: `next-open-${decision.id}`,
        kind: "open-question",
        priority: 0,
        question: decision.statement,
        options: [],
        source: decision.source,
        status: "open",
        decisionID: decision.id,
      })
      continue
    }

    if (decision.status === "proposed") {
      queue.push({
        id: `next-proposed-${decision.id}`,
        kind: "proposed-decision",
        priority: 1,
        question: decision.statement,
        options: [],
        source: decision.source,
        status: "open",
        decisionID: decision.id,
      })
    }
  }

  for (const edge of graph.edges) {
    if (edge.kind !== "conflicts") continue

    const from = graph.decisions.find((decision) => decision.id === edge.from)
    const to = graph.decisions.find((decision) => decision.id === edge.to)

    if (!from || !to) continue

    if (isClosed(from) || isClosed(to)) continue

    queue.push({
      id: `next-conflict-${[from.id, to.id].sort().join("-")}`,
      kind: "conflict",
      priority: 2,
      question: `${from.statement} ↔ ${to.statement}`,
      options: [
        { id: from.id, label: from.statement },
        { id: to.id, label: to.statement },
      ],
      impact: edge.reason,
      source: from.source,
      status: "open",
      decisionID: from.id,
    })
  }

  for (const evidence of graph.evidence) {
    if (!evidence.stale) continue

    queue.push({
      id: `next-stale-${evidence.id}`,
      kind: "stale-evidence",
      priority: 3,
      question: evidence.summary,
      options: [],
      evidenceIDs: [evidence.id],
      source: evidence.source,
      status: "open",
      evidenceID: evidence.id,
    })
  }

  for (const goal of graph.goals) {
    for (const item of goal.acceptance) {
      if (item.met) continue

      queue.push({
        id: `next-acceptance-${goal.id}-${item.id}`,
        kind: "acceptance",
        priority: 4,
        question: item.statement,
        options: [],
        source: goal.source,
        status: "open",
        goalID: goal.id,
      })
    }
  }

  for (const action of graph.actions) {
    if (action.status !== "failed" && action.status !== "interrupted") continue

    queue.push({
      id: `next-failure-${action.id}`,
      kind: "failure",
      priority: 5,
      question: action.summary,
      options: [],
      source: action.source,
      status: "open",
      actionID: action.id,
    })
  }

  return dedupe(queue).sort((a, b) => a.priority - b.priority).slice(0, MAX_NEXT_DECISIONS)
}

function isClosed(decision: SessionGraph["decisions"][number]) {
  return decision.status === "dropped" || decision.status === "superseded"
}

function dedupe(queue: readonly NextDecision[]) {
  const seen = new Set<string>()

  return queue.filter((item) => {
    const key = `${item.kind}:${normalizeStatement(item.question)}`

    if (!key || seen.has(key)) return false

    seen.add(key)

    return true
  })
}
