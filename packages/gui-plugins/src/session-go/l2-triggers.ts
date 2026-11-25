import { sourceSignature } from "./session-signature"
import type { ExtractionMessage, L2ModelRef, L2Scope, L2Trigger } from "./types"

/** How many trailing messages an analysis includes. Older messages stay out of the prompt budget. */
export const L2_MAX_MESSAGES = 24

export type L2ScopeSlice = {
  scope: L2Scope
  messages: readonly ExtractionMessage[]
}

/** The loaded session's newest messages, which is what a manual analysis covers. */
export function sessionScope(messages: readonly ExtractionMessage[]): L2ScopeSlice | undefined {
  if (messages.length === 0) return

  const slice = messages.slice(-L2_MAX_MESSAGES)

  return {
    scope: {
      kind: "session",
      fromMessageID: slice[0]?.id,
      toMessageID: slice.at(-1)?.id,
      messageCount: slice.length,
      truncated: slice.length < messages.length,
    },
    messages: slice,
  }
}

/**
 * The episode that just ended: everything since the previous idle through the latest idle. Undefined
 * while a new episode is already running, so automatic analysis never covers a half-finished turn.
 */
export function episodeScope(messages: readonly ExtractionMessage[]): L2ScopeSlice | undefined {
  const lastIdle = messages.findLastIndex((message) => message.type === "idle")

  if (lastIdle < 0) return

  // A user prompt or shell after the last idle started new work; the old episode is no longer the tail.
  if (
    messages
      .slice(lastIdle + 1)
      .some((message) => message.type === "user" || message.type === "shell")
  )
    return

  const previousIdle = messages.findLastIndex(
    (message, index) => index < lastIdle && message.type === "idle",
  )

  const raw = messages.slice(previousIdle + 1)

  if (!raw.some((message) => message.type === "user" || message.type === "assistant")) return

  const slice = raw.slice(-L2_MAX_MESSAGES)
  const idle = messages[lastIdle]

  return {
    scope: {
      kind: "episode",
      fromMessageID: slice[0]?.id,
      toMessageID: slice.at(-1)?.id,
      episodeID: idle?.id,
      messageCount: slice.length,
      truncated: slice.length < raw.length,
    },
    messages: slice,
  }
}

/** Stable per-scope key; the same idle or manual range is never analyzed twice by the same model. */
export function l2SnapshotKey(input: {
  trigger: L2Trigger
  promptVersion: number
  model?: L2ModelRef
  messages: readonly ExtractionMessage[]
  scope: L2Scope
}) {
  const model = input.model ? `${input.model.providerID}/${input.model.id}` : "default"

  const scope =
    input.trigger === "episode"
      ? input.scope.episodeID ?? input.scope.toMessageID ?? "none"
      : `${input.scope.fromMessageID ?? ""}:${input.scope.toMessageID ?? ""}:${sourceSignature(input.messages)}`

  return `l2-${input.trigger}-${input.promptVersion}-${hash(`${scope}|${model}`)}`
}

function hash(value: string) {
  let result = 2166136261

  for (let index = 0; index < value.length; index++) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 16777619)
  }

  return (result >>> 0).toString(36)
}
