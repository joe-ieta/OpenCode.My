import type { ActionNode, DecisionNode, Edge, EvidenceNode } from "./types"

/** Builds only the relations the deterministic extractors can prove. */
export function buildRelations(input: {
  decisions: readonly DecisionNode[]
  actions: readonly ActionNode[]
  evidence: readonly EvidenceNode[]
}): Edge[] {
  const edges: Edge[] = []
  const seen = new Set<string>()

  const add = (edge: Edge) => {
    const key = `${edge.from}:${edge.to}:${edge.kind}`

    if (seen.has(key)) return
    seen.add(key)
    edges.push(edge)
  }

  for (const item of input.evidence) {
    if (item.source.actionID) add({ from: item.source.actionID, to: item.id, kind: "produces" })
  }

  for (const decision of input.decisions) {
    if (decision.supersedes) add({ from: decision.id, to: decision.supersedes, kind: "supersedes" })

    if (decision.supersededBy) add({ from: decision.supersededBy, to: decision.id, kind: "supersedes" })
  }

  return edges
}
