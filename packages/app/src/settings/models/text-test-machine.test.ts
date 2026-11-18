import { expect, test } from "bun:test"
import { transition } from "./text-test-machine"

test("ignores late results after cancellation, retry, and disposal", () => {
  const running = transition({ kind: "idle", attempt: 0 }, { type: "start" })
  expect(transition(running, { type: "start" })).toBe(running)
  const cancelled = transition(running, { type: "cancel" })
  expect(transition(cancelled, { type: "passed", attempt: 1 })).toBe(cancelled)
  const retried = transition(cancelled, { type: "start" })
  expect(transition(retried, { type: "failed", attempt: 1, message: "Disconnected" })).toBe(retried)
  expect(transition(retried, { type: "passed", attempt: 2 })).toEqual({ kind: "passed", attempt: 2 })
  const disposed = transition(retried, { type: "dispose" })
  expect(transition(disposed, { type: "passed", attempt: 2 })).toBe(disposed)
})
