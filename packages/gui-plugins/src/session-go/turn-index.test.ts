import { describe, expect, test } from "bun:test"
import type { SessionMessageInfo } from "@opencode/client/promise"
import type { HistoryClient } from "./history-fetch"
import { collectTurnHeads, loadTurnHeads, mergeTurnHeads, type TurnHead } from "./turn-index"

const user = (id: string, created: number) =>
  ({ id, type: "user", text: id, time: { created } }) satisfies SessionMessageInfo

const reply = (id: string, created: number) =>
  ({
    id,
    type: "assistant",
    agent: "build",
    model: { id: "test", providerID: "opencode" },
    content: [],
    time: { created, completed: created + 1 },
  }) satisfies SessionMessageInfo

const page = (items: SessionMessageInfo[], next?: string) => ({
  data: items,
  cursor: { next: next ?? null },
})

function client(pages: ReturnType<typeof page>[], calls: unknown[] = []): HistoryClient {
  return {
    message: {
      list: async (input) => {
        // The real server rejects this pair; a turn page must follow its cursor without an order.
        if (input.cursor && input.order !== undefined) throw new Error("Cursor cannot be combined with order")

        calls.push(input)

        return pages.shift()!
      },
    },
  }
}

describe("loadTurnHeads", () => {
  test("pages user messages by cursor and returns every turn ascending", async () => {
    const calls: unknown[] = []

    const api = client(
      [
        page([user("m5", 5), user("m4", 4)], "c1"),
        page([user("m3", 3), user("m2", 2)], "c2"),
        page([user("m1", 1)]),
      ],
      calls,
    )

    const progress: number[] = []

    const turns = await loadTurnHeads({
      sessionID: "ses_1",
      client: api,
      signal: new AbortController().signal,
      onProgress: (loaded) => progress.push(loaded),
    })

    expect(turns.map((turn) => turn.id)).toEqual(["m1", "m2", "m3", "m4", "m5"])
    expect(progress).toEqual([2, 4, 5])
    expect(calls[0]).toMatchObject({ sessionID: "ses_1", type: "user", limit: 200 })
    expect(calls[0]).not.toHaveProperty("order")
    expect(calls[1]).toMatchObject({ type: "user", limit: 200, cursor: "c1" })
    expect(calls[1]).not.toHaveProperty("order")
    expect(calls[2]).toMatchObject({ type: "user", limit: 200, cursor: "c2" })
  })

  test("filters non-user rows and drops overlap", () => {
    const turns = collectTurnHeads([
      [user("m3", 3), user("m2", 2)],
      [reply("m3", 3), user("m2", 2), user("m1", 1)],
    ])

    expect(turns).toEqual([
      { id: "m1", text: "m1", createdAt: 1 },
      { id: "m2", text: "m2", createdAt: 2 },
      { id: "m3", text: "m3", createdAt: 3 },
    ])
  })
})

describe("mergeTurnHeads", () => {
  const turn = (id: string, createdAt: number): TurnHead => ({ id, text: id, createdAt })

  test("appends only turns newer than the fetched index", () => {
    expect(mergeTurnHeads([turn("m2", 2), turn("m3", 3)], [turn("m1", 1), turn("m2", 2), turn("m4", 4)])).toEqual([
      turn("m2", 2),
      turn("m3", 3),
      turn("m4", 4),
    ])
  })

  test("uses the live window while the fetched index is empty", () => {
    expect(mergeTurnHeads([], [turn("m1", 1)])).toEqual([turn("m1", 1)])
  })
})
