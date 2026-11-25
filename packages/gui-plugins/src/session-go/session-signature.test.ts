import { describe, expect, test } from "bun:test"
import { sourceSettled, sourceSignature } from "./session-signature"
import { assistant, compaction, idle, shell, text, tool, user } from "./test-fixtures"

describe("source signature", () => {
  test("changes when an assistant completes without new text", () => {
    const running = assistant("msg_agent", [text("Working")], { created: 1 })
    const completed = assistant("msg_agent", [text("Working")], { created: 1, completed: 2 })

    expect(sourceSignature([running])).not.toBe(sourceSignature([completed]))
  })

  test("changes when a tool finishes in place", () => {
    const running = assistant("msg_agent", [tool("tool_1", "bash", { command: "bun test" }, "running", 1)], {
      created: 1,
      completed: 3,
    })

    const completed = assistant("msg_agent", [tool("tool_1", "bash", { command: "bun test" }, "completed", 1, 2)], {
      created: 1,
      completed: 3,
    })

    expect(sourceSignature([running])).not.toBe(sourceSignature([completed]))
  })

  test("changes when a shell command exits", () => {
    const running = shell("msg_shell", "bun test", { status: "running" })
    const exited = shell("msg_shell", "bun test", { status: "exited", exit: 0 })

    expect(sourceSignature([running])).not.toBe(sourceSignature([exited]))
  })

  test("changes with the project goal context", () => {
    const messages = [user("msg_user", "Implement it")]

    expect(sourceSignature(messages, "proj_1:PG1")).not.toBe(sourceSignature(messages, "proj_1:PG2"))
    expect(sourceSignature(messages, "")).not.toBe(sourceSignature(messages, "proj_1:PG1"))
  })

  test("keeps a stable fingerprint across repeated reads", () => {
    const messages = [user("msg_user", "Implement it"), assistant("msg_agent", [text("Done")], { completed: 2 })]

    expect(sourceSignature(messages)).toBe(sourceSignature(messages))
  })
})

describe("source settled", () => {
  test("waits for a running assistant, shell or compaction", () => {
    expect(sourceSettled([])).toBe(true)
    expect(sourceSettled([user("msg_user", "Implement it")])).toBe(true)
    expect(sourceSettled([assistant("msg_agent", [text("Working")], { created: 1 })])).toBe(false)
    expect(sourceSettled([assistant("msg_agent", [text("Done")], { created: 1, completed: 2 })])).toBe(true)
    expect(sourceSettled([shell("msg_shell", "bun test", { status: "running" })])).toBe(false)
    expect(sourceSettled([compaction("msg_compact", "summary", "running")])).toBe(false)
    expect(sourceSettled([idle("msg_idle")])).toBe(true)
  })
})
