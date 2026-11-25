import { describe, expect, test } from "bun:test"
import type { SessionMessageInfo } from "@opencode/client/promise"
import { loadFullHistory, type HistoryClient } from "./history-fetch"

const message = (id: string, created: number) =>
  ({ id, type: "user", text: id, time: { created } }) satisfies SessionMessageInfo

const page = (items: SessionMessageInfo[], next?: string) => ({
  data: items,
  cursor: { next: next ?? null },
})

function client(pages: ReturnType<typeof page>[], calls: unknown[] = []): HistoryClient {
  return {
    message: {
      list: async (input) => {
        // The real server rejects this pair; keeping the check here makes a regression fail in unit tests.
        if (input.cursor && input.order !== undefined) throw new Error("Cursor cannot be combined with order")

        calls.push(input)

        return pages.shift()!
      },
    },
  }
}

describe("loadFullHistory", () => {
  test("pages newest-first and returns ascending unique messages", async () => {
    const calls: unknown[] = []

    const api = client(
      [
        page([message("m4", 4), message("m3", 3)], "c1"),
        page([message("m2", 2), message("m1", 1)]),
      ],
      calls,
    )

    const progress: number[] = []

    const result = await loadFullHistory({
      sessionID: "ses_1",
      client: api,
      signal: new AbortController().signal,
      onProgress: (count) => progress.push(count),
    })

    expect(result.messages.map((item) => item.id)).toEqual(["m1", "m2", "m3", "m4"])
    expect(result.complete).toBe(true)
    expect(progress).toEqual([2, 4])
    expect(calls[0]).toMatchObject({ sessionID: "ses_1", order: "desc", limit: 200 })
    expect(calls[1]).toMatchObject({ cursor: "c1" })
    expect(calls[1]).not.toHaveProperty("order")
  })

  test("drops overlap between pages", async () => {
    const api = client([
      page([message("m3", 3), message("m2", 2)], "c1"),
      page([message("m2", 2), message("m1", 1)]),
    ])

    const result = await loadFullHistory({
      sessionID: "ses_1",
      client: api,
      signal: new AbortController().signal,
    })

    expect(result.messages.map((item) => item.id)).toEqual(["m1", "m2", "m3"])
  })

  test("stops at the message budget and reports incomplete history", async () => {
    const api = client([
      page([message("m4", 4), message("m3", 3)], "c1"),
      page([message("m2", 2), message("m1", 1)]),
    ])

    const result = await loadFullHistory({
      sessionID: "ses_1",
      client: api,
      signal: new AbortController().signal,
      maxMessages: 2,
    })

    expect(result.complete).toBe(false)
    expect(result.messages).toHaveLength(2)
  })

  test("propagates an aborted signal", async () => {
    const controller = new AbortController()
    controller.abort()

    const api: HistoryClient = {
      message: {
        list: async (_input, options) => {
          options?.signal?.throwIfAborted()

          return page([])
        },
      },
    }

    await expect(
      loadFullHistory({ sessionID: "ses_1", client: api, signal: controller.signal }),
    ).rejects.toThrow()
  })
})
