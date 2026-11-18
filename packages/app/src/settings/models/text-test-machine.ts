export type State =
  | { kind: "idle" | "testing" | "passed" | "cancelled" | "disposed"; attempt: number }
  | { kind: "failed"; attempt: number; message: string }

export type Event =
  | { type: "start" | "cancel" | "dispose" }
  | { type: "passed"; attempt: number }
  | { type: "failed"; attempt: number; message: string }

export function transition(state: State, event: Event): State {
  if (state.kind === "disposed") return state

  if (event.type === "dispose") return { kind: "disposed", attempt: state.attempt }

  if (event.type === "start" && state.kind !== "testing") return { kind: "testing", attempt: state.attempt + 1 }

  if (state.kind !== "testing") return state

  if (event.type === "cancel") return { kind: "cancelled", attempt: state.attempt }

  if (!("attempt" in event) || event.attempt !== state.attempt) return state

  if (event.type === "failed") return { kind: "failed", attempt: event.attempt, message: event.message }

  return { kind: "passed", attempt: event.attempt }
}
