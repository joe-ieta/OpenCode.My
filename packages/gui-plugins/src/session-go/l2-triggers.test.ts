import { describe, expect, test } from "bun:test"
import { episodeScope, l2SnapshotKey, sessionScope } from "./l2-triggers"
import { assistant, idle, notice, shell, text, user } from "./test-fixtures"

const closedEpisode = [
  user("u1", "Earlier request", 1),
  assistant("a1", [text("Earlier answer")], { created: 2, completed: 3 }),
  idle("i1", "succeeded", 3),
  user("u2", "Current request", 4),
  assistant("a2", [text("Current answer")], { created: 5, completed: 6 }),
  idle("i2", "succeeded", 6),
]

describe("sessionScope", () => {
  test("keeps the newest messages within the scope budget", () => {
    const messages = Array.from({ length: 30 }, (_, index) => user(`m${index}`, `Message ${index}`, index))
    const slice = sessionScope(messages)

    expect(slice?.scope.kind).toBe("session")
    expect(slice?.scope.messageCount).toBe(24)
    expect(slice?.scope.truncated).toBe(true)
    expect(slice?.messages[0]?.id).toBe("m6")
    expect(slice?.scope.toMessageID).toBe("m29")
  })

  test("returns undefined for an empty session", () => {
    expect(sessionScope([])).toBeUndefined()
  })
})

describe("episodeScope", () => {
  test("takes everything since the previous idle through the latest idle", () => {
    const slice = episodeScope(closedEpisode)

    expect(slice?.scope.kind).toBe("episode")
    expect(slice?.scope.episodeID).toBe("i2")
    expect(slice?.scope.fromMessageID).toBe("u2")
    expect(slice?.scope.toMessageID).toBe("i2")
    expect(slice?.scope.messageCount).toBe(3)
    expect(slice?.messages.map((message) => message.id)).toEqual(["u2", "a2", "i2"])
  })

  test("includes notices after the idle but not a new user prompt", () => {
    const withNotice = [...closedEpisode, notice("n1", "A system notice", 7)]

    expect(episodeScope(withNotice)?.scope.episodeID).toBe("i2")
    expect(episodeScope(withNotice)?.scope.toMessageID).toBe("n1")
    expect(episodeScope([...closedEpisode, user("u3", "Next request", 8)])).toBeUndefined()
  })

  test("waits when a shell starts after the idle", () => {
    expect(episodeScope([...closedEpisode, shell("s1", "bun test", { status: "running" })])).toBeUndefined()
  })

  test("returns undefined before the first idle", () => {
    expect(episodeScope(closedEpisode.slice(0, 3))).toBeDefined()
    expect(episodeScope(closedEpisode.slice(0, 2))).toBeUndefined()
  })
})

describe("l2SnapshotKey", () => {
  const slice = episodeScope(closedEpisode)!
  const model = { providerID: "opencode", id: "test" }

  test("is stable for the same episode and model", () => {
    const key = (messages = closedEpisode) =>
      l2SnapshotKey({
        trigger: "episode",
        promptVersion: 1,
        model,
        messages,
        scope: episodeScope(messages)!.scope,
      })

    expect(key()).toBe(key())
    expect(key([...closedEpisode, notice("n1", "Notice", 7)])).toBe(key())
    expect(
      l2SnapshotKey({
        trigger: "episode",
        promptVersion: 1,
        model: { providerID: "opencode", id: "other" },
        messages: closedEpisode,
        scope: slice.scope,
      }),
    ).not.toBe(key())
  })

  test("separates manual runs from episodes and changes with the manual range", () => {
    const manual = (messages = closedEpisode) => {
      const value = sessionScope(messages)!

      return l2SnapshotKey({
        trigger: "manual",
        promptVersion: 1,
        model,
        messages: value.messages,
        scope: value.scope,
      })
    }

    expect(manual()).not.toBe(
      l2SnapshotKey({
        trigger: "episode",
        promptVersion: 1,
        model,
        messages: closedEpisode,
        scope: slice.scope,
      }),
    )
    expect(manual([...closedEpisode, user("u3", "New request", 8)])).not.toBe(manual())
  })
})
