import type { SessionMessageInfo } from "@opencode/client/promise"
import { extractionMessages } from "../session-messages"
import type { ExtractionMessage } from "../types"
import type { HistoryTurn } from "./history"

/**
 * The newest user inputs in the live window, oldest first, with the observed duration of each turn.
 * The floating button's hint shows them as a compact list.
 */
export function recentTurns(messages: readonly SessionMessageInfo[], limit = 3): HistoryTurn[] {
  const turns = extractionMessages(messages)
  const recent: { message: Extract<ExtractionMessage, { type: "user" }>; index: number }[] = []

  for (let index = turns.length - 1; index >= 0 && recent.length < limit; index--) {
    const message = turns[index]!

    if (message.type === "user") recent.push({ message, index })
  }

  recent.reverse()

  return recent.map(({ message, index }, position) => {
    const next = recent[position + 1]?.index ?? turns.length
    let endedAt = message.time.created

    for (let cursor = index + 1; cursor < next; cursor++) endedAt = Math.max(endedAt, messageEnd(turns[cursor]!))

    return {
      id: message.id,
      text: message.text,
      createdAt: message.time.created,
      durationMs: endedAt > message.time.created ? endedAt - message.time.created : undefined,
    }
  })
}

function messageEnd(message: ExtractionMessage) {
  if (message.type === "assistant" || message.type === "shell") return message.time.completed ?? message.time.created

  return message.time.created
}
