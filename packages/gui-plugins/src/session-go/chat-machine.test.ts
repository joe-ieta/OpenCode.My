import { describe, expect, test } from "bun:test"
import { transitionChat, type ChatState } from "./chat-machine"

describe("Go chat request ownership", () => {
  test("claims a request before another submission and rejects unrelated results", () => {
    const running = transitionChat({ status: "idle" }, { type: "requested", id: "first", turn: "question" })
    expect(running).toEqual({ status: "running", id: "first", turn: "question" })
    expect(transitionChat(running, { type: "requested", id: "second", turn: "other" })).toBe(running)
    expect(transitionChat(running, { type: "succeeded", id: "other" })).toBe(running)
    expect(transitionChat(running, { type: "succeeded", id: "first" })).toEqual({ status: "idle" })
  })

  test.each(["empty", "timeout", "error"] as const)(
    "a %s failure is retryable without accepting the old response",
    (reason) => {
      const running: ChatState = { status: "running", id: "first", turn: "question" }
      const failed = transitionChat(running, { type: "failed", id: "first", reason })
      expect(failed).toMatchObject({ status: "failed", turn: "question", reason })
      const retry = transitionChat(failed, { type: "requested", id: "retry", turn: "question" })
      expect(transitionChat(retry, { type: "succeeded", id: "first" })).toBe(retry)
      expect(transitionChat(retry, { type: "failed", id: "first", reason })).toBe(retry)
      expect(transitionChat(retry, { type: "succeeded", id: "retry" })).toEqual({ status: "idle" })
    },
  )

  test("cancelled and disposed requests cannot accept a late answer", () => {
    const running: ChatState = { status: "running", id: "first", turn: "question" }
    const cancelled = transitionChat(running, { type: "cancelled" })
    expect(transitionChat(cancelled, { type: "succeeded", id: "first" })).toBe(cancelled)
    const disposed = transitionChat(running, { type: "disposed" })
    expect(transitionChat(disposed, { type: "succeeded", id: "first" })).toBe(disposed)
    expect(transitionChat(disposed, { type: "requested", id: "retry", turn: "question" })).toBe(disposed)
  })
})
