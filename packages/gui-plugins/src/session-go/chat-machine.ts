import type { ChatTurn } from "./chat-schema"

export type ChatState =
  | { readonly status: "idle" }
  | { readonly status: "running"; readonly id: string; readonly turn: string }
  | {
      readonly status: "failed"
      readonly turn: string
      readonly reason: "empty" | "timeout" | "error"
      readonly message?: string
    }
  | { readonly status: "disposed" }

export type ChatEvent =
  | { readonly type: "requested"; readonly id: string; readonly turn: string }
  | { readonly type: "succeeded"; readonly id: string }
  | {
      readonly type: "failed"
      readonly id: string
      readonly reason: "empty" | "timeout" | "error"
      readonly message?: string
    }
  | { readonly type: "cancelled" }
  | { readonly type: "disposed" }

export function transitionChat(state: ChatState, event: ChatEvent): ChatState {
  if (state.status === "disposed") return state

  if (event.type === "disposed") return { status: "disposed" }

  if (event.type === "cancelled") return { status: "idle" }

  if (event.type === "requested") {
    if (state.status === "running") return state

    return { status: "running", id: event.id, turn: event.turn }
  }

  if (state.status !== "running" || state.id !== event.id) return state

  if (event.type === "succeeded") return { status: "idle" }

  return { status: "failed", turn: state.turn, reason: event.reason, message: event.message }
}

/** Side history stays in this transient request; session.generate supplies the main Session context. */
export function chatPrompt(turns: readonly ChatTurn[], question: string) {
  return [
    "The user is having a separate side conversation about the current Session.",
    "Use the Session context and the previous side questions and answers below to answer follow-ups.",
    "Answer directly in markdown. Do not call tools, take actions, or continue the main task.",
    "The following JSON contains the side conversation and the new question:",
    JSON.stringify({
      conversation: turns.flatMap((turn) =>
        turn.answer === undefined ? [] : [{ question: turn.question, answer: turn.answer }],
      ),
      question,
    }),
  ].join("\n\n")
}
