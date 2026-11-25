import type { SessionMessageInfo } from "@opencode/client/promise"
import { readHistoryPage, type HistoryClient } from "./history-fetch"

/** One user request in the session. The rail needs only these fields until full history supplies durations. */
export type TurnHead = {
  id: string
  text: string
  createdAt: number
}

export const TURN_PAGE_SIZE = 200

/**
 * Reads every delivered user message for the session. The server filters by type before pagination,
 * so a page holds up to 200 turns rather than 200 transcript messages. All pages are collected before
 * returning, so the rail never publishes a partial or renumbered list.
 */
export async function loadTurnHeads(input: {
  sessionID: string
  client: HistoryClient
  signal: AbortSignal
  onProgress?: (loaded: number) => void
}): Promise<TurnHead[]> {
  const pages: SessionMessageInfo[][] = []
  let cursor: string | undefined
  let loaded = 0

  while (true) {
    const page = await readHistoryPage(input, { limit: TURN_PAGE_SIZE, cursor, type: "user" })
    input.signal.throwIfAborted()
    pages.push([...page.data])
    loaded += page.data.length
    input.onProgress?.(loaded)

    cursor = page.cursor.next ?? undefined

    if (!cursor || page.data.length === 0) break
  }

  return collectTurnHeads(pages)
}

/** Pages arrive newest-first; the index is ascending and drops overlap or non-user rows. */
export function collectTurnHeads(pages: readonly (readonly SessionMessageInfo[])[]) {
  const turns: TurnHead[] = []
  const seen = new Set<string>()

  for (let pageIndex = pages.length - 1; pageIndex >= 0; pageIndex--) {
    const page = pages[pageIndex]!

    for (let index = page.length - 1; index >= 0; index--) {
      const message = page[index]!

      if (message.type !== "user" || seen.has(message.id)) continue

      seen.add(message.id)
      turns.push({ id: message.id, text: message.text, createdAt: message.time.created })
    }
  }

  return turns
}

/**
 * The fetched index owns older turns. The live window contributes only turns newer than its newest
 * head, so scrolling the timeline neither adds nor reorders older rail entries.
 */
export function mergeTurnHeads(fetched: readonly TurnHead[], live: readonly TurnHead[]) {
  if (fetched.length === 0) return [...live]

  const newest = fetched.at(-1)!
  const seen = new Set(fetched.map((turn) => turn.id))

  return [...fetched, ...live.filter((turn) => turn.createdAt > newest.createdAt && !seen.has(turn.id))]
}
