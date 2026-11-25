import type { SessionMessageInfo } from "@opencode/client/promise"

export const HISTORY_PAGE_SIZE = 200

export const HISTORY_MAX_MESSAGES = 5_000

const HISTORY_REQUEST_TIMEOUT_MS = 30_000

export type HistoryClient = {
  message: {
    list(
      input: {
        sessionID: string
        limit?: number
        order?: "asc" | "desc"
        cursor?: string
        type?: SessionMessageInfo["type"]
      },
      options?: { signal?: AbortSignal },
    ): Promise<{
      data: readonly SessionMessageInfo[]
      cursor: { next?: string | null }
    }>
  }
}

/**
 * Reads one message page. A cursor already carries its order on the server, so it must never be
 * combined with `order`; the server rejects that pair with InvalidCursorError.
 */
export function readHistoryPage(
  input: { sessionID: string; client: HistoryClient; signal: AbortSignal },
  page: { limit: number; cursor?: string; type?: SessionMessageInfo["type"]; order?: "asc" | "desc" },
) {
  const query = page.cursor
    ? { sessionID: input.sessionID, limit: page.limit, type: page.type, cursor: page.cursor }
    : page.order
      ? { sessionID: input.sessionID, limit: page.limit, type: page.type, order: page.order }
      : { sessionID: input.sessionID, limit: page.limit, type: page.type }

  return input.client.message.list(query, {
    signal: AbortSignal.any([input.signal, AbortSignal.timeout(HISTORY_REQUEST_TIMEOUT_MS)]),
  })
}

/**
 * Pages the complete session history through the API into the plugin's own list. The main timeline
 * store is not touched. Pages stop at the start of history or at the message budget.
 */
export async function loadFullHistory(input: {
  sessionID: string
  client: HistoryClient
  signal: AbortSignal
  maxMessages?: number
  onProgress?: (loaded: number) => void
  onPage?: (messages: SessionMessageInfo[], complete: boolean) => void
}): Promise<{ messages: SessionMessageInfo[]; complete: boolean }> {
  const max = input.maxMessages ?? HISTORY_MAX_MESSAGES
  const pages: SessionMessageInfo[][] = []
  let cursor: string | undefined
  let loaded = 0
  let complete = false

  while (!complete && loaded < max) {
    const page = await readHistoryPage(input, { limit: HISTORY_PAGE_SIZE, cursor, order: "desc" })
    input.signal.throwIfAborted()
    pages.push([...page.data])
    loaded += page.data.length
    cursor = page.cursor.next ?? undefined

    if (!cursor || page.data.length === 0) complete = true

    input.onProgress?.(loaded)
    input.onPage?.(collectMessages(pages), complete)
  }

  return { messages: collectMessages(pages), complete }
}

/** Pages arrive newest-first; the plugin stores ascending order and drops any overlap. */
function collectMessages(pages: readonly (readonly SessionMessageInfo[])[]) {
  const messages: SessionMessageInfo[] = []
  const seen = new Set<string>()

  for (let pageIndex = pages.length - 1; pageIndex >= 0; pageIndex--) {
    const page = pages[pageIndex]!

    for (let index = page.length - 1; index >= 0; index--) {
      const message = page[index]!

      if (seen.has(message.id)) continue

      seen.add(message.id)
      messages.push(message)
    }
  }

  return messages
}
