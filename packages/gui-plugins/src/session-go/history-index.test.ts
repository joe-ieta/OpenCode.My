import { describe, expect, test } from "bun:test"
import { buildHistoryIndex, mergeHistoryMessages, searchHistory } from "./history-index"
import type { DecisionNode, SessionGraph } from "./types"
import { assistant, shell, text, user } from "./test-fixtures"

const decision: DecisionNode = {
  id: "D1",
  kind: "approach",
  statement: "Use one panel for the semantic layer",
  rationale: "It keeps the side panel narrow",
  status: "proposed",
  authority: "agent",
  scope: "session",
  source: { messageID: "msg_agent" },
  confidence: "medium",
}

const graph: SessionGraph = {
  sessionKey: "test",
  goals: [],
  decisions: [decision],
  actions: [],
  evidence: [],
  edges: [],
}

const messages = [
  user("msg_user", "Build a panel for decisions", 1),
  assistant("msg_agent", [text("Use one panel for the semantic layer")], { created: 2, completed: 3 }),
  shell("msg_shell", "bun test src/session-go", { status: "exited", exit: 0 }),
]

describe("buildHistoryIndex", () => {
  test("indexes messages and facts, with facts weighted above messages", () => {
    const rows = buildHistoryIndex({ messages, graph })
    const results = searchHistory(rows, "panel")

    expect(results[0]?.kind).toBe("decision")
    expect(rows.some((row) => row.kind === "decision")).toBe(true)
    expect(rows.some((row) => row.kind === "message")).toBe(true)
    expect(searchHistory(rows, "semantic layer")[0]?.kind).toBe("decision")
  })

  test("does not index tool output or reasoning", () => {
    const secret = "TOP-SECRET-TOOL-OUTPUT"

    const messagesWithTool = [
      user("msg_user", "Check the file", 1),
      assistant(
        "msg_agent",
        [
          { type: "reasoning", text: `reasoning ${secret}` },
          {
            type: "tool",
            id: "tool_1",
            name: "read",
            state: { status: "completed", input: { path: secret }, content: [{ type: "text", text: secret }] },
            time: { created: 2, completed: 3 },
          },
        ],
        { created: 2, completed: 3 },
      ),
    ]

    const rows = buildHistoryIndex({ messages: messagesWithTool })
    const messageRows = rows.filter((row) => row.kind === "message")

    expect(messageRows.some((row) => row.text.includes(secret))).toBe(false)
    expect(searchHistory(rows, secret)).toHaveLength(0)
  })

  test("requires every token and ignores queries shorter than two characters", () => {
    const rows = buildHistoryIndex({ messages, graph })

    expect(searchHistory(rows, "p")).toHaveLength(0)
    expect(searchHistory(rows, "panel missing")).toHaveLength(0)
    expect(searchHistory(rows, "panel decisions").length).toBeGreaterThan(0)
  })

  test("indexes 5,000 messages within the acceptance budget", () => {
    const many = Array.from({ length: 5_000 }, (_, index) => user(`m${index}`, `Message ${index} about the panel`, index))
    const started = performance.now()
    const rows = buildHistoryIndex({ messages: many })
    const elapsed = performance.now() - started

    expect(rows).toHaveLength(5_000)
    expect(elapsed).toBeLessThan(3_000)
  })
})

describe("mergeHistoryMessages", () => {
  test("prepends fetched older messages and keeps newer live messages", () => {
    const older = [user("m1", "old", 1), user("m2", "shared", 2)]
    const live = [user("m2", "shared", 2), user("m3", "new", 3)]

    expect(mergeHistoryMessages(live, older).map((message) => message.id)).toEqual(["m1", "m2", "m3"])
    expect(mergeHistoryMessages(live, [])).toBe(live)
  })

  test("ignores older live messages when the fetched history owns them", () => {
    const live = [
      user("m1", "old", 1),
      user("m2", "older", 2),
      user("m3", "shared", 3),
      user("m4", "new", 4),
      user("m5", "streaming", 5),
    ]

    const fetched = [user("m3", "shared", 3), user("m4", "new", 4)]

    expect(mergeHistoryMessages(live, fetched).map((message) => message.id)).toEqual(["m3", "m4", "m5"])
  })
})
