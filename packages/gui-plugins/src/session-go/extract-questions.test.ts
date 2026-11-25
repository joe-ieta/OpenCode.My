import { describe, expect, test } from "bun:test"
import { extractOpenQuestions } from "./extract-questions"
import { assistant, compaction, text } from "./test-fixtures"

describe("extractOpenQuestions", () => {
  test("reads question sentences from assistant text", () => {
    const messages = [
      assistant("msg_agent", [text("Should we persist candidates? Or keep them in memory?")], { created: 1 }),
    ]

    const questions = extractOpenQuestions({ messages })

    expect(questions).toHaveLength(2)
    expect(questions.every((question) => question.kind === "open-question" && question.status === "open")).toBe(true)
    expect(questions[0]).toMatchObject({ rule: "question.assistant", authority: "agent" })
  })

  test("turns blocked checkpoint items into open questions", () => {
    const summary = `## Work State
### Completed
- Panel

### Blocked
- Persistence needs a schema
- Candidate cache needs a key
`

    const questions = extractOpenQuestions({ messages: [compaction("msg_compaction", summary, "completed", 1)] })

    expect(questions).toHaveLength(2)
    expect(questions[0]).toMatchObject({
      statement: "Persistence needs a schema",
      rule: "question.compaction.blocked",
      authority: "inferred",
    })
  })

  test("deduplicates repeated questions", () => {
    const messages = [
      assistant("msg_a", [text("Should we persist candidates?")], { created: 1 }),
      assistant("msg_b", [text("Should we persist candidates?")], { created: 2 }),
    ]

    expect(extractOpenQuestions({ messages })).toHaveLength(1)
  })
})
