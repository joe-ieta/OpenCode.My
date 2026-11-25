import { truncate } from "./extract-rules"
import type { ExtractionMessage, SessionGraph, SourceRef } from "./types"

export type HistoryRow = {
  id: string
  kind: "message" | "goal" | "decision" | "action" | "evidence"
  title: string
  text: string
  source: SourceRef
  /** Chronological position of the source message, used to break score ties newest-first. */
  order: number
  weight: number
}

const MAX_TEXT = 1_000

const MAX_TITLE = 120

/**
 * Indexes structural fields and truncated text only. Assistant reasoning, tool output and shell
 * output stay out, so the index never holds a full transcript or tool payload.
 */
export function buildHistoryIndex(input: {
  messages: readonly ExtractionMessage[]
  graph?: SessionGraph
}): HistoryRow[] {
  const rows: HistoryRow[] = []
  const positions = new Map<string, number>()

  input.messages.forEach((message, index) => {
    positions.set(message.id, index)
    const text = messageText(message)

    if (!text) return

    rows.push({
      id: `message-${message.id}`,
      kind: "message",
      title: messageTitle(message),
      text: truncate(text, MAX_TEXT),
      source: { messageID: message.id },
      order: index,
      weight: 0,
    })
  })

  const graph = input.graph

  if (!graph) return rows

  const orderOf = (source: SourceRef) => (source.messageID ? (positions.get(source.messageID) ?? -1) : -1)

  for (const goal of graph.goals) {
    rows.push({
      id: `goal-${goal.id}`,
      kind: "goal",
      title: truncate(`Goal · ${goal.statement}`, MAX_TITLE),
      text: truncate(
        [goal.statement, goal.constraints?.join("; "), ...goal.acceptance.map((item) => item.statement)]
          .filter(Boolean)
          .join(" · "),
        MAX_TEXT,
      ),
      source: goal.source,
      order: orderOf(goal.source),
      weight: 4,
    })
  }

  for (const decision of graph.decisions) {
    rows.push({
      id: `decision-${decision.id}`,
      kind: "decision",
      title: truncate(`Decision · ${decision.statement}`, MAX_TITLE),
      text: truncate(
        [decision.statement, decision.rationale, decision.alternatives?.join("; ")].filter(Boolean).join(" · "),
        MAX_TEXT,
      ),
      source: decision.source,
      order: orderOf(decision.source),
      weight: 3,
    })
  }

  for (const action of graph.actions) {
    rows.push({
      id: `action-${action.id}`,
      kind: "action",
      title: truncate(`Action · ${action.summary || action.name || action.kind}`, MAX_TITLE),
      text: truncate([action.summary, action.name, action.files?.join(", ")].filter(Boolean).join(" · "), MAX_TEXT),
      source: action.source,
      order: orderOf(action.source),
      weight: 1,
    })
  }

  for (const evidence of graph.evidence) {
    rows.push({
      id: `evidence-${evidence.id}`,
      kind: "evidence",
      title: truncate(`Evidence · ${evidence.summary}`, MAX_TITLE),
      text: truncate(
        [evidence.summary, evidence.kind, evidence.status, evidence.stale ? "stale" : "fresh"].join(" · "),
        MAX_TEXT,
      ),
      source: evidence.source,
      order: orderOf(evidence.source),
      weight: 1,
    })
  }

  return rows
}

/** Case-insensitive token search; every token must appear. Relevance first, then newest. */
export function searchHistory(rows: readonly HistoryRow[], query: string, limit = 20) {
  const needle = query.trim().toLowerCase()

  if (needle.length < 2) return []

  const tokens = needle.split(/\s+/).filter(Boolean)

  return rows
    .flatMap((row) => {
      const haystack = `${row.title}\n${row.text}`.toLowerCase()

      if (!tokens.every((token) => haystack.includes(token))) return []

      const exact = haystack.includes(needle) ? 20 : 0
      const matches = tokens.reduce((total, token) => total + occurrences(haystack, token), 0)

      return [{ row, score: exact + matches + row.weight * 2 }]
    })
    .sort((a, b) => b.score - a.score || b.row.order - a.row.order)
    .slice(0, limit)
    .map((item) => item.row)
}

/**
 * Fetched history owns the older messages. The live window contributes only messages newer than its
 * newest message, so scrolling the conversation neither adds nor reorders the history index.
 */
export function mergeHistoryMessages(
  live: readonly ExtractionMessage[],
  fetched: readonly ExtractionMessage[],
) {
  if (fetched.length === 0) return live

  const newest = fetched.at(-1)!
  const seen = new Set(fetched.map((message) => message.id))

  return [
    ...fetched,
    ...live.filter((message) => message.time.created > newest.time.created && !seen.has(message.id)),
  ]
}

function messageText(message: ExtractionMessage) {
  if (message.type === "user") return message.text

  if (message.type === "assistant") {
    return message.content.flatMap((part) => (part.type === "text" ? [part.text] : [])).join("\n")
  }

  if (message.type === "shell") return message.command

  if (message.type === "compaction") return message.summary ?? ""

  if (message.type === "synthetic" || message.type === "system" || message.type === "skill") return message.text

  return ""
}

function messageTitle(message: ExtractionMessage) {
  if (message.type === "user") return "Request"

  if (message.type === "assistant") return "Reply"

  if (message.type === "shell") return "Shell"

  if (message.type === "compaction") return "Compaction"

  if (message.type === "skill") return "Skill"

  return "Notice"
}

function occurrences(text: string, token: string) {
  let count = 0
  let index = text.indexOf(token)

  while (index >= 0) {
    count++
    index = text.indexOf(token, index + token.length)
  }

  return count
}
