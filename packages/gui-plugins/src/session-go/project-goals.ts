import type { ProjectGoal, ProjectGoalRef } from "./types"

/** The placeholder used until a project goal provider writes a real top-level goal. */
export function mockProjectGoal(input: { projectID: string; statement: string }): ProjectGoal {
  return {
    id: `mock-project-goal-${input.projectID}`,
    projectID: input.projectID,
    statement: input.statement,
    status: "proposed",
    authority: "inferred",
    mock: true,
  }
}

/** Prefers a stored top-level goal for the project, else the explicit placeholder. */
export function resolveProjectGoal(input: {
  projectID: string
  stored: readonly ProjectGoal[]
  mockStatement: string
}): ProjectGoal {
  return (
    input.stored.find((goal) => goal.projectID === input.projectID && !goal.parentID) ??
    mockProjectGoal({ projectID: input.projectID, statement: input.mockStatement })
  )
}

/** The minimal reference a session goal keeps; it does not copy the project graph. */
export function projectGoalRefFrom(goal: ProjectGoal): ProjectGoalRef {
  return {
    projectID: goal.projectID,
    projectGoalID: goal.id,
    label: goal.statement,
  }
}

/** The part of a candidate fingerprint that follows the project goal reference. */
export function projectGoalContext(ref: ProjectGoalRef | undefined) {
  return ref ? `${ref.projectID}:${ref.projectGoalID ?? ""}` : ""
}
