import { describe, expect, test } from "bun:test"
import {
  buildL2Prompt,
  l2DecisionID,
  mergeL2Snapshots,
  parseL2Output,
} from "./l2-contract"
import type { DecisionNode, SessionGraph } from "./types"
import { assistant, text, user } from "./test-fixtures"

const decision = (id: string, statement: string, status: DecisionNode["status"] = "proposed"): DecisionNode => ({
  id,
  kind: "approach",
  statement,
  status,
  authority: "agent",
  scope: "session",
  source: { messageID: "msg_user" },
  confidence: "medium",
})

const messages = [user("msg_user", "Use one side panel. Keep the timeline untouched."), assistant("msg_agent", [text("I suggest one panel for decisions.")], { created: 2, completed: 3 })]

const graph: SessionGraph = {
  sessionKey: "test",
  goals: [
    {
      id: "G1",
      version: 1,
      statement: "Ship Session Go",
      scope: "session",
      status: "proposed",
      acceptance: [],
      authority: "inferred",
      source: { messageID: "msg_user" },
    },
  ],
  decisions: [decision("D1", "Keep the timeline untouched", "active"), decision("D2", "Use two panels")],
  actions: [
    {
      id: "A1",
      kind: "prompt",
      actor: "user",
      status: "succeeded",
      summary: "Use one side panel.",
      source: { messageID: "msg_user" },
    },
  ],
  evidence: [],
  edges: [],
}

describe("buildL2Prompt", () => {
  test("lists candidate facts and the source IDs the model may cite", () => {
    const prompt = buildL2Prompt({
      graph,
      messages,
      scope: { kind: "session", messageCount: messages.length },
    })

    expect(prompt).toContain("GOAL CANDIDATES:")
    expect(prompt).toContain("G1")
    expect(prompt).toContain("D1")
    expect(prompt).toContain("A1")
    expect(prompt).toContain("ALLOWED MESSAGE IDS: msg_user, msg_agent")
    expect(prompt).toContain("[user:msg_user]")
    expect(prompt).toContain("Return exactly one JSON object")
  })
})

describe("parseL2Output", () => {
  test("accepts fenced JSON and defaults model facts to proposed and inferred", () => {
    const raw = `\`\`\`json
{"decisions":[{"statement":"Use one panel for the semantic layer","kind":"approach","rationale":"Keeps the panel narrow.","alternatives":["Two panels"],"sourceMessageIDs":["msg_agent","missing"],"mergesDecisionIDs":["D1","missing"]}],"openQuestions":[{"statement":"Should candidates persist?","sourceMessageIDs":["msg_user"]}],"conflicts":[{"decisionID":"D1","otherDecisionID":"D2","reason":"They disagree about the layout.","sourceMessageIDs":["msg_user"]}]}
\`\`\``

    const result = parseL2Output(raw, { graph, messages })

    expect(result).toBeDefined()
    expect(result?.dropped).toBe(0)
    expect(result?.decisions).toHaveLength(2)
    expect(result?.decisions[0]).toMatchObject({
      statement: "Use one panel for the semantic layer",
      status: "proposed",
      authority: "inferred",
      confidence: "medium",
      rule: "l2.consolidated",
      source: { messageID: "msg_agent" },
      rationale: "Keeps the panel narrow.",
    })
    expect(result?.decisions[1]).toMatchObject({ kind: "open-question", status: "proposed" })
    expect(result?.edges).toContainEqual({
      from: l2DecisionID("Use one panel for the semantic layer"),
      to: "D1",
      kind: "derivedFrom",
    })
    expect(result?.edges).toContainEqual({
      from: "D1",
      to: "D2",
      kind: "conflicts",
      reason: "They disagree about the layout.",
      sourceMessageIDs: ["msg_user"],
    })
  })

  test("drops facts without a real source or a real referenced ID", () => {
    const raw = JSON.stringify({
      decisions: [
        { statement: "No source", sourceMessageIDs: ["missing"] },
        { statement: "Bad merge", sourceMessageIDs: ["msg_user"], mergesDecisionIDs: ["missing"] },
      ],
      conflicts: [{ decisionID: "D1", otherDecisionID: "missing", sourceMessageIDs: ["msg_user"] }],
    })

    const result = parseL2Output(raw, { graph, messages })

    expect(result?.decisions).toHaveLength(1)
    expect(result?.decisions[0]?.statement).toBe("Bad merge")
    expect(result?.edges).toHaveLength(0)
    expect(result?.dropped).toBe(2)
  })

  test("returns undefined for output without JSON or without the expected shape", () => {
    expect(parseL2Output("The model refused.", { graph, messages })).toBeUndefined()
    expect(parseL2Output('{"decisions":"nope"}', { graph, messages })).toBeUndefined()
  })

  test("falls back to a safe kind and confidence", () => {
    const raw = JSON.stringify({
      decisions: [
        {
          statement: "Use a tolerant parser",
          kind: "not-a-kind",
          confidence: "certain",
          sourceMessageIDs: ["msg_user"],
        },
      ],
    })

    const result = parseL2Output(raw, { graph, messages })

    expect(result?.decisions[0]).toMatchObject({ kind: "approach", confidence: "medium" })
  })

  test("skips a statement that already exists as a candidate", () => {
    const raw = JSON.stringify({
      decisions: [{ statement: "Keep the timeline untouched", sourceMessageIDs: ["msg_user"] }],
    })

    expect(parseL2Output(raw, { graph, messages })?.decisions).toHaveLength(0)
  })
})

describe("mergeL2Snapshots", () => {
  test("adds new decisions once and keeps existing candidates untouched", () => {
    const first = parseL2Output(
      JSON.stringify({
        decisions: [
          { statement: "Use one panel for the semantic layer", sourceMessageIDs: ["msg_agent"] },
          { statement: "Keep the timeline untouched", sourceMessageIDs: ["msg_user"] },
        ],
      }),
      { graph, messages },
    )!

    const snapshot = { decisions: first.decisions, edges: first.edges }
    const merged = mergeL2Snapshots(graph, [snapshot, snapshot])

    expect(merged.decisions).toHaveLength(graph.decisions.length + 1)
    expect(merged.decisions.at(-1)?.statement).toBe("Use one panel for the semantic layer")
    expect(merged.edges).toHaveLength(graph.edges.length)
  })

  test("keeps a stable ID for the same statement", () => {
    expect(l2DecisionID("Use one panel")).toBe(l2DecisionID("Use one panel"))
    expect(l2DecisionID("Use one panel")).not.toBe(l2DecisionID("Use two panels"))
  })
})
