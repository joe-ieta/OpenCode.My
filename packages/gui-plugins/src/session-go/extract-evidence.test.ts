import { describe, expect, test } from "bun:test"
import { extractActions } from "./extract-actions"
import { extractEvidence, markStaleEvidence } from "./extract-evidence"
import { assistant, shell, text, tool, user } from "./test-fixtures"

describe("extractEvidence", () => {
  test("turns verification commands, changes and confirmations into evidence", () => {
    const messages = [
      user("msg_user", "Sounds good.", 1),
      assistant("msg_a1", [tool("part_test", "bash", { command: "bun test" })], { created: 2, completed: 3 }),
      shell("msg_build", "bun build", { exit: 1, created: 4, completed: 5 }),
      assistant("msg_a2", [tool("part_edit", "edit", { filePath: "src/a.ts" })], {
        created: 6,
        completed: 7,
        snapshotFiles: ["src/a.ts"],
      }),
      assistant("msg_a3", [text("changed again")], { created: 8, completed: 9, snapshotFiles: ["src/a.ts"] }),
    ]

    const actions = extractActions(messages).actions
    const evidence = extractEvidence(actions, messages, 100)

    expect(evidence.some((item) => item.kind === "test" && item.status === "supports")).toBe(true)
    expect(evidence.some((item) => item.kind === "test" && item.status === "refutes")).toBe(true)
    expect(evidence.filter((item) => item.kind === "diff")).toHaveLength(2)
    expect(evidence.find((item) => item.kind === "user-confirmation")?.status).toBe("supports")
    expect(evidence.filter((item) => item.kind === "diff" && item.stale === true)).toHaveLength(1)
  })

  test("marks a failed tool as refuting evidence", () => {
    const messages = [
      assistant("msg_a1", [tool("part_bad", "read", { filePath: "src/a.ts" }, "error")], {
        created: 1,
        completed: 2,
      }),
    ]

    const actions = extractActions(messages).actions
    const evidence = extractEvidence(actions, messages)

    expect(evidence.find((item) => item.kind === "tool")?.status).toBe("refutes")
  })

  test("markStaleEvidence uses both files and time", () => {
    const evidence = [
      {
        id: "evidence-a",
        kind: "diff" as const,
        summary: "a.ts",
        status: "supports" as const,
        freshAt: 10,
        files: ["a.ts"],
        source: { actionID: "a" },
      },
    ]

    const actions = [
      { id: "a", kind: "change" as const, actor: "agent" as const, status: "succeeded" as const, summary: "a.ts", files: ["a.ts"], source: {}, startedAt: 9, endedAt: 10 },
      { id: "b", kind: "change" as const, actor: "agent" as const, status: "succeeded" as const, summary: "a.ts", files: ["a.ts"], source: {}, startedAt: 11, endedAt: 12 },
    ]

    const earlier = actions[0]

    expect(markStaleEvidence(evidence, actions)[0]?.stale).toBe(true)
    expect(markStaleEvidence(evidence, earlier ? [earlier] : [])[0]?.stale).toBeUndefined()
  })
})
