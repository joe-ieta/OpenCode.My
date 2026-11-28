import { expect, test } from "bun:test"
import { transitionChatWindow } from "./chat-window-machine"

test("a closed modal cannot restore a later modal or a disposed window", () => {
  const floating = transitionChatWindow({ status: "unmounted" }, { type: "toggle" })
  const first = transitionChatWindow(floating, { type: "maximize", id: "first" })
  const restored = transitionChatWindow(first, { type: "restore" })
  const second = transitionChatWindow(restored, { type: "maximize", id: "second" })
  expect(transitionChatWindow(second, { type: "dismissed", id: "first" })).toBe(second)
  const disposed = transitionChatWindow(second, { type: "disposed" })
  expect(transitionChatWindow(disposed, { type: "dismissed", id: "second" })).toBe(disposed)
  expect(transitionChatWindow(disposed, { type: "toggle" })).toBe(disposed)
})
