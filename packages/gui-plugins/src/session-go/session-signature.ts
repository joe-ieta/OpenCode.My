import type { ExtractionMessage } from "./types"

/**
 * A compact fingerprint of everything the extractors read. It changes when a message is appended and when an
 * in-place message state changes, such as an assistant finishing or a shell command exiting, so a cache written at
 * one state is never reused for another.
 */
export function sourceSignature(messages: readonly ExtractionMessage[], context = "") {
  let hash = 2166136261

  const feed = (value: string) => {
    for (let index = 0; index < value.length; index++) {
      hash ^= value.charCodeAt(index)
      hash = Math.imul(hash, 16777619)
    }

    // A separator keeps neighbouring fields from hashing as the same byte stream.
    hash ^= 0x1f
    hash = Math.imul(hash, 16777619)
  }

  feed(context)

  for (const message of messages) {
    feed(message.id)
    feed(message.type)

    if (message.type === "user") {
      feed(String(message.text.length))
      feed(String(message.files?.length ?? 0))
      continue
    }

    if (message.type === "assistant") {
      feed(String(message.time.completed ?? 0))
      feed(String(message.content.length))
      feed(message.error ? "error" : "ok")
      feed(message.retry ? "retry" : "ok")

      for (const part of message.content) {
        feed(part.type)

        if (part.type !== "tool") {
          feed(String(part.text.length))
          continue
        }

        feed(part.name)
        feed(part.state.status)
        feed(String(part.time.completed ?? 0))
      }

      feed(String(message.snapshot?.end ?? ""))
      feed((message.snapshot?.files ?? []).join(","))
      continue
    }

    if (message.type === "shell") {
      feed(message.status)
      feed(String(message.exit ?? ""))
      feed(String(message.time.completed ?? 0))
      continue
    }

    if (message.type === "compaction") {
      feed(message.status)
      feed(String(message.summary?.length ?? 0))
      continue
    }

    if (message.type === "idle") {
      feed(message.outcome)
      continue
    }

    feed("text" in message ? String(message.text.length) : "")
  }

  return `${messages.length}:${messages.at(-1)?.id ?? ""}:${(hash >>> 0).toString(36)}`
}

/** Whether the newest message has reached a state worth persisting a candidate snapshot for. */
export function sourceSettled(messages: readonly ExtractionMessage[]) {
  const last = messages.at(-1)

  if (!last) return true

  if (last.type === "assistant") return last.time.completed !== undefined

  if (last.type === "shell") return last.status !== "running"

  if (last.type === "compaction") return last.status !== "running"

  return true
}
