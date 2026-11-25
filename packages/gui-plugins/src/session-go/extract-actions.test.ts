import { describe, expect, test } from "bun:test"
import { extractActions } from "./extract-actions"
import { assistant, compaction, idle, notice, shell, text, tool, user } from "./test-fixtures"

describe("extractActions", () => {
  test("maps a session's messages to ordered actions", () => {
    const messages = [
      user("msg_user", "Implement the panel", 1),
      assistant(
        "msg_assistant",
        [
          text("Working on the panel"),
          tool("part_edit", "edit", { filePath: "panel/panel.tsx" }, "completed", 2, 6),
          tool("part_bash", "bash", { command: "bun test" }, "completed", 3, 7),
        ],
        { created: 2, completed: 10, snapshotFiles: ["panel/panel.tsx", "extra.ts"] },
      ),
      shell("msg_shell", "bun typecheck", { exit: 0, created: 11, completed: 12 }),
      compaction("msg_compaction", "## Objective\n- Ship", "completed", 13),
      idle("msg_idle", "succeeded", 14),
      notice("msg_notice", "Background finished", 15),
      { id: "msg_switch", type: "model-switched" as const, time: { created: 16 } },
    ]

    const result = extractActions(messages)

    expect(result.approximate).toBe(false)
    expect(result.outcomes).toEqual([{ messageID: "msg_idle", outcome: "succeeded", error: undefined, time: 14 }])
    expect(result.actions.map((action) => action.kind)).toEqual([
      "prompt",
      "step",
      "change",
      "shell",
      "change",
      "shell",
      "checkpoint",
      "notice",
      "switch",
    ])

    const edit = result.actions.find((action) => action.id === "tool-msg_assistant-part_edit")
    expect(edit?.files).toEqual(["panel/panel.tsx"])
    expect(edit?.rule).toBe("action.tool")

    const snapshot = result.actions.find((action) => action.id === "change-msg_assistant")
    expect(snapshot?.files).toEqual(["extra.ts"])
    expect(snapshot?.rule).toBe("action.change")
  })

  test("marks a new prompt without an idle marker as approximate", () => {
    const result = extractActions([user("msg_a", "First", 1), user("msg_b", "Second", 2)])

    expect(result.approximate).toBe(true)
    expect(result.outcomes).toEqual([])
  })

  test("maps shell outcomes and assistant errors", () => {
    const result = extractActions([
      shell("msg_failed", "bun test", { exit: 1, created: 1, completed: 2 }),
      shell("msg_timeout", "bun build", { status: "timeout", created: 3, completed: 4 }),
      shell("msg_killed", "bun lint", { status: "killed", created: 5, completed: 6 }),
      assistant("msg_error", [text("No")], { created: 7, completed: 8, error: { message: "boom" } }),
      idle("msg_idle", "failed", 9),
    ])

    expect(result.actions.filter((action) => action.kind === "shell").map((action) => action.status)).toEqual([
      "failed",
      "failed",
      "interrupted",
    ])
    expect(result.actions.find((action) => action.kind === "error")?.summary).toBe("boom")
    expect(result.outcomes[0]?.outcome).toBe("failed")
  })

  test("keeps planned actions out of the message extraction", () => {
    expect(extractActions([]).actions).toEqual([])
  })
})
