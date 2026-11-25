import { createMemo, createSignal, onCleanup } from "solid-js"
import type { SessionMessageInfo } from "@opencode/client/promise"
import { loadFullHistory, type HistoryClient } from "../history-fetch"
import { buildHistoryIndex, mergeHistoryMessages } from "../history-index"
import { extractionMessages } from "../session-messages"
import { loadTurnHeads, mergeTurnHeads, type TurnHead } from "../turn-index"
import type { ExtractionMessage, SessionGraph } from "../types"

export type HistoryStatus = "idle" | "loading" | "ready" | "error"

export type HistoryTurn = TurnHead & {
  /** Time from the user input to the last observed event in this turn, when one was recorded. */
  durationMs?: number
}

/** Full-history pages kept beside the loaded timeline; they never enter the app's message store. */
export function createHistorySearch(input: {
  sessionID: () => string
  client: () => HistoryClient
  live: () => readonly ExtractionMessage[]
  graph: () => SessionGraph | undefined
}) {
  const [history, setHistory] = createSignal<SessionMessageInfo[]>([])
  const [status, setStatus] = createSignal<HistoryStatus>("idle")
  const [progress, setProgress] = createSignal(0)
  const [complete, setComplete] = createSignal(false)
  const [error, setError] = createSignal<string>()
  const [turnHeads, setTurnHeads] = createSignal<TurnHead[]>([])
  const [turnStatus, setTurnStatus] = createSignal<HistoryStatus>("idle")
  const [turnError, setTurnError] = createSignal<string>()
  let controller: AbortController | undefined
  let turnController: AbortController | undefined

  onCleanup(() => {
    controller?.abort()
    turnController?.abort()
  })

  const load = async () => {
    if (status() === "loading" || !input.sessionID()) return

    controller?.abort()
    const current = new AbortController()
    controller = current
    setStatus("loading")
    setError(undefined)
    setProgress(0)

    try {
      const result = await loadFullHistory({
        sessionID: input.sessionID(),
        client: input.client(),
        signal: current.signal,
        onProgress: setProgress,
        onPage: (messages, loadedComplete) => {
          if (current.signal.aborted || controller !== current) return

          setHistory(messages)
          setComplete(loadedComplete)
        },
      })

      if (current.signal.aborted || controller !== current) return

      setHistory(result.messages)
      setComplete(result.complete)
      setStatus("ready")
    } catch (cause) {
      if (controller !== current) return

      if (current.signal.aborted) {
        setStatus(history().length > 0 ? "ready" : "idle")

        return
      }

      setStatus("error")
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      if (controller === current) controller = undefined
    }
  }

  // The rail is a turn index, not a message window. Load every user message before publishing so its
  // numbering cannot change while older pages arrive.
  const loadTurns = async () => {
    if (turnStatus() === "loading" || !input.sessionID()) return

    turnController?.abort()
    const current = new AbortController()
    turnController = current
    setTurnStatus("loading")
    setTurnError(undefined)

    try {
      const heads = await loadTurnHeads({
        sessionID: input.sessionID(),
        client: input.client(),
        signal: current.signal,
      })

      if (current.signal.aborted || turnController !== current) return

      setTurnHeads(heads)
      setTurnStatus("ready")
    } catch (cause) {
      if (turnController !== current) return

      if (current.signal.aborted) {
        setTurnStatus(turnHeads().length > 0 ? "ready" : "idle")

        return
      }

      setTurnStatus("error")
      setTurnError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      if (turnController === current) turnController = undefined
    }
  }

  const reset = () => {
    controller?.abort()
    controller = undefined
    turnController?.abort()
    turnController = undefined
    setHistory([])
    setStatus("idle")
    setProgress(0)
    setComplete(false)
    setError(undefined)
    setTurnHeads([])
    setTurnStatus("idle")
    setTurnError(undefined)
  }

  const cancel = () => controller?.abort()

  const merged = createMemo(() => mergeHistoryMessages(input.live(), extractionMessages(history())))

  const rows = createMemo(() => buildHistoryIndex({ messages: merged(), graph: input.graph() }))

  const durationByTurn = createMemo(() => {
    const result = new Map<string, number | undefined>()

    for (const turn of buildTurns(merged())) result.set(turn.id, turn.durationMs)

    return result
  })

  const liveTurns = createMemo<TurnHead[]>(() =>
    input.live().flatMap((message) =>
      message.type === "user" ? [{ id: message.id, text: message.text, createdAt: message.time.created }] : [],
    ),
  )

  const turns = createMemo<HistoryTurn[]>(() => {
    if (turnStatus() !== "ready") return []

    const durations = durationByTurn()

    return mergeTurnHeads(turnHeads(), liveTurns()).map((turn) => ({
      ...turn,
      durationMs: durations.get(turn.id),
    }))
  })

  return {
    status,
    progress,
    complete,
    error,
    rows,
    turns,
    turnStatus,
    turnError,
    messageCount: () => merged().length,
    hasHistory: () => history().length > 0,
    load,
    loadTurns,
    reset,
    retry: load,
    cancel,
  }
}

/** One rail entry per user request in an ascending message list, with its observed run duration. */
function buildTurns(messages: readonly ExtractionMessage[]) {
  const result: HistoryTurn[] = []
  let current: { turn: HistoryTurn; endedAt: number } | undefined

  const finish = () => {
    if (!current) return

    if (current.endedAt > current.turn.createdAt) current.turn.durationMs = current.endedAt - current.turn.createdAt

    result.push(current.turn)
    current = undefined
  }

  for (const message of messages) {
    if (message.type === "user") {
      finish()
      current = {
        turn: { id: message.id, text: message.text, createdAt: message.time.created },
        endedAt: message.time.created,
      }
      continue
    }

    if (current) current.endedAt = Math.max(current.endedAt, messageEnd(message))
  }

  finish()

  return result
}

function messageEnd(message: ExtractionMessage) {
  if (message.type === "assistant" || message.type === "shell") return message.time.completed ?? message.time.created

  return message.time.created
}

export type HistorySearch = ReturnType<typeof createHistorySearch>
