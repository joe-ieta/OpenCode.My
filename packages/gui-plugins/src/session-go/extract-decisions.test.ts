import { describe, expect, test } from "bun:test"
import { extractActions } from "./extract-actions"
import { extractDecisions } from "./extract-decisions"
import { assistant, compaction, text, tool, user } from "./test-fixtures"

const summary = `## Decisions
- Use one panel for the semantic layer
- Keep confirmed facts separate

## Requirements
- Do not change the timeline
`

describe("extractDecisions", () => {
  test("reads user constraints and assistant proposals", () => {
    const messages = [
      user("msg_user", "Must keep the panel read-only.", 1),
      assistant("msg_agent", [text("I recommend one panel for the whole flow.")], { created: 2 }),
    ]

    const actions = extractActions(messages).actions
    const decisions = extractDecisions({ messages, actions })

    expect(decisions[0]).toMatchObject({
      kind: "constraint",
      authority: "user",
      status: "proposed",
      rule: "decision.user.constraint",
    })
    expect(decisions[1]).toMatchObject({
      kind: "approach",
      authority: "agent",
      status: "proposed",
      rule: "decision.agent.proposal",
    })
  })

  test("reads a short answer after an assistant question", () => {
    const messages = [
      assistant("msg_agent", [text("Should we persist candidates?")], { created: 1 }),
      user("msg_user", "Yes, option A.", 2),
    ]

    const actions = extractActions(messages).actions
    const decisions = extractDecisions({ messages, actions })

    expect(decisions.find((decision) => decision.rule === "decision.user.answer")).toMatchObject({
      kind: "approval",
      authority: "user",
      statement: "Yes, option A.",
    })
  })

  test("reads checkpoint decisions and requirements as candidates", () => {
    const messages = [compaction("msg_compaction", summary, "completed", 1)]
    const decisions = extractDecisions({ messages, actions: [] })

    expect(decisions).toHaveLength(3)
    expect(decisions.filter((decision) => decision.rule === "decision.compaction")).toHaveLength(2)
    expect(decisions.find((decision) => decision.rule === "decision.compaction.requirement")?.kind).toBe("constraint")
    expect(decisions.every((decision) => decision.authority === "inferred" && decision.status === "proposed")).toBe(true)
  })

  test("flags a config change as an observed choice", () => {
    const messages = [
      assistant("msg_agent", [tool("part_edit", "edit", { filePath: "package.json" })], {
        created: 1,
        completed: 2,
      }),
    ]

    const actions = extractActions(messages).actions
    const decisions = extractDecisions({ messages, actions })

    expect(decisions.find((decision) => decision.rule === "decision.enacted")).toMatchObject({
      authority: "agent",
      confidence: "low",
    })
  })

  test("deduplicates repeated statements", () => {
    const messages = [
      user("msg_a", "Use one panel.", 1),
      user("msg_b", "use   one panel", 2),
    ]

    const decisions = extractDecisions({ messages, actions: [] })

    expect(decisions).toHaveLength(1)
  })
})
