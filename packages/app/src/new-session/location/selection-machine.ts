import type { LocationEntry } from "./machine"

export type LocationChoice = Extract<LocationEntry, { type: "project" | "workspace" }>

type Outcome = "available" | "missing" | "failed"

export type LocationSelection =
  | { type: "idle" }
  | { type: "checking"; choice: LocationChoice; attempt: symbol }
  | { type: "missing" | "failed"; choice: LocationChoice }

type LocationSelectionEvent =
  | { type: "choose"; choice: LocationChoice; attempt: symbol }
  | { type: "resolved"; attempt: symbol; outcome: Outcome }
  | { type: "cancel" }

type LocationSelectionTransition = { state: LocationSelection; select?: LocationChoice }

const idle = { type: "idle" } as const
const noticeTitle = {
  checking: "session.new.location.checking",
  missing: "home.project.missing.title",
  failed: "session.new.location.checkFailed",
} as const

export function transitionLocationSelection(
  state: LocationSelection,
  event: LocationSelectionEvent,
): LocationSelectionTransition {
  if (event.type === "cancel") return { state: idle }

  if (event.type === "choose") {
    if (state.type === "checking" && state.choice === event.choice) return { state }

    return { state: { type: "checking", choice: event.choice, attempt: event.attempt } }
  }

  if (state.type !== "checking" || state.attempt !== event.attempt) return { state }
  if (event.outcome === "available") return { state: idle, select: state.choice }

  return { state: { type: event.outcome, choice: state.choice } }
}

export function locationSelectionNotice(state: LocationSelection) {
  if (state.type === "idle") return
  const directory = state.choice.type === "workspace" ? state.choice.directory : state.choice.project.worktree

  return {
    choice: state.choice,
    directory,
    title: noticeTitle[state.type],
    checking: state.type === "checking",
    removable: state.type === "missing" && directory === state.choice.project.worktree,
  }
}
