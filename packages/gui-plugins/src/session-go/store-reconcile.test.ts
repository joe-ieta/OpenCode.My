import { describe, expect, test } from "bun:test"
import {
  actionLinked,
  decisionConfirmed,
  decisionDeferred,
  decisionPromoted,
  decisionRejected,
  decisionSuperseded,
} from "./store-commitments"
import { reconcileGraph } from "./store-reconcile"
import type { ActionNode, DecisionNode, SessionGraph } from "./types"

const decision = (id: string, status: DecisionNode["status"], kind: DecisionNode["kind"] = "approach"): DecisionNode => ({
  id,
  kind,
  statement: id,
  status,
  authority: "agent",
  scope: "session",
  source: { messageID: `msg_${id}` },
  confidence: "medium",
})

const action: ActionNode = {
  id: "A1",
  kind: "change",
  actor: "agent",
  status: "succeeded",
  summary: "Change",
  source: { messageID: "msg_A1" },
}

const graph: SessionGraph = {
  sessionKey: "server\nses_1",
  goals: [],
  decisions: [decision("D1", "proposed"), decision("D2", "open", "open-question"), decision("D3", "proposed")],
  actions: [action],
  evidence: [],
  edges: [],
}

describe("reconcileGraph", () => {
  test("returns the candidate graph when there are no commitments", () => {
    expect(reconcileGraph(graph, [])).toBe(graph)
  })

  test("applies confirmation, rejection, deferral and supersession", () => {
    const next = reconcileGraph(graph, [
      decisionConfirmed(graph.decisions[0]!, 1),
      decisionConfirmed(graph.decisions[1]!, 2),
      decisionRejected(graph.decisions[2]!, 3),
      decisionDeferred(graph.decisions[0]!, 4),
      decisionSuperseded(graph.decisions[2]!, "D2", 5),
    ])

    expect(next.decisions.find((item) => item.id === "D1")).toMatchObject({
      status: "active",
      authority: "confirmed",
      deferred: true,
    })
    expect(next.decisions.find((item) => item.id === "D2")?.status).toBe("resolved")
    expect(next.decisions.find((item) => item.id === "D3")).toMatchObject({
      status: "superseded",
      supersededBy: "D2",
    })
    expect(next.edges).toContainEqual({ from: "D2", to: "D3", kind: "supersedes" })
    expect(graph.decisions[0]?.status).toBe("proposed")
  })

  test("restores a committed decision the candidate rebuild dropped", () => {
    const rebuilt: SessionGraph = { ...graph, decisions: [] }
    const next = reconcileGraph(rebuilt, [decisionConfirmed(graph.decisions[0]!, 1)])

    expect(next.decisions).toHaveLength(1)
    expect(next.decisions[0]).toMatchObject({
      id: "D1",
      statement: "D1",
      status: "active",
      authority: "confirmed",
    })
  })

  test("adds promoted decisions and manual links without duplicates", () => {
    const next = reconcileGraph(graph, [
      decisionPromoted(action, 1),
      actionLinked("A1", { goalID: "G1" }, 2),
      actionLinked("A1", { goalID: "G1" }, 3),
      actionLinked("A1", { decisionID: "D1" }, 4),
    ])

    expect(next.decisions.find((item) => item.id === "promoted-A1")).toMatchObject({
      status: "active",
      authority: "user",
    })
    expect(next.edges.filter((edge) => edge.kind === "relatedTo")).toEqual([
      { from: "A1", to: "G1", kind: "relatedTo" },
      { from: "A1", to: "D1", kind: "relatedTo" },
    ])
    expect(graph.decisions.some((item) => item.id === "promoted-A1")).toBe(false)
  })
})
