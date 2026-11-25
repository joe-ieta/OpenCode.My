import { describe, expect, test } from "bun:test"
import { buildNextDecisions } from "./graph-next-decision"
import type { SessionGraph } from "./types"

const graph: SessionGraph = {
  sessionKey: "test",
  goals: [
    {
      id: "G1",
      version: 1,
      statement: "Ship",
      scope: "session",
      status: "active",
      acceptance: [
        { id: "AC1", statement: "Panel renders", met: true },
        { id: "AC2", statement: "Extraction is deterministic", met: false },
      ],
      authority: "user",
      source: { messageID: "msg_goal" },
    },
  ],
  decisions: [
    {
      id: "D1",
      kind: "open-question",
      statement: "Should candidates persist?",
      status: "open",
      authority: "agent",
      scope: "session",
      source: { messageID: "msg_q" },
      confidence: "medium",
    },
    {
      id: "D2",
      kind: "approach",
      statement: "Use one panel",
      status: "proposed",
      authority: "agent",
      scope: "session",
      source: { messageID: "msg_d" },
      confidence: "medium",
    },
  ],
  actions: [
    {
      id: "A1",
      kind: "shell",
      actor: "agent",
      status: "failed",
      summary: "bun test",
      source: { messageID: "msg_a" },
    },
  ],
  evidence: [
    {
      id: "E1",
      kind: "test",
      summary: "bun test",
      status: "refutes",
      stale: true,
      source: { actionID: "A1" },
    },
  ],
  edges: [],
}

describe("buildNextDecisions", () => {
  test("orders open questions, proposals, stale evidence, acceptance and failures", () => {
    const next = buildNextDecisions(graph)

    expect(next.map((item) => item.kind)).toEqual([
      "open-question",
      "proposed-decision",
      "stale-evidence",
      "acceptance",
      "failure",
    ])
    expect(next.map((item) => item.priority)).toEqual([0, 1, 3, 4, 5])
    expect(next[0]?.decisionID).toBe("D1")
    expect(next[1]?.decisionID).toBe("D2")
    expect(next[2]?.evidenceID).toBe("E1")
    expect(next[3]?.goalID).toBe("G1")
    expect(next[4]?.actionID).toBe("A1")
  })

  test("leaves deferred decisions out of the queue", () => {
    const deferred: SessionGraph = {
      ...graph,
      decisions: graph.decisions.map((decision) => ({ ...decision, deferred: true })),
      evidence: [],
      goals: [],
      actions: [],
    }

    expect(buildNextDecisions(deferred)).toHaveLength(0)
  })

  test("surfaces a conflict between two open decisions", () => {
    const conflicting: SessionGraph = {
      ...graph,
      goals: [],
      evidence: [],
      actions: [],
      edges: [{ from: "D1", to: "D2", kind: "conflicts", reason: "They disagree" }],
    }

    const conflict = buildNextDecisions(conflicting).find((item) => item.kind === "conflict")

    expect(conflict).toMatchObject({
      priority: 2,
      decisionID: "D1",
      impact: "They disagree",
    })
    expect(conflict?.options.map((option) => option.id)).toEqual(["D1", "D2"])
  })

  test("ignores a conflict whose decision is already closed", () => {
    const conflicting: SessionGraph = {
      ...graph,
      goals: [],
      evidence: [],
      actions: [],
      decisions: graph.decisions.map((decision) =>
        decision.id === "D2" ? { ...decision, status: "dropped" } : decision,
      ),
      edges: [{ from: "D1", to: "D2", kind: "conflicts" }],
    }

    expect(buildNextDecisions(conflicting).some((item) => item.kind === "conflict")).toBe(false)
  })

  test("does not duplicate the same kind and question", () => {
    const open = graph.decisions[0]

    const duplicated: SessionGraph = {
      ...graph,
      decisions: open ? [open, { ...open, id: "D3", source: { messageID: "msg_q2" } }] : [],
      evidence: [],
      goals: [],
      actions: [],
    }

    expect(buildNextDecisions(duplicated)).toHaveLength(1)
  })
})
