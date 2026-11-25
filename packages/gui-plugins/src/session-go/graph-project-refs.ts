import type { GoalNode, ProjectGoalRef } from "./types"

/** The minimal project-goal reference kept beside a session goal. */
export function projectGoalRef(input: {
  projectID: string
  label: string
  projectGoalID?: string
}): ProjectGoalRef {
  return {
    projectID: input.projectID,
    projectGoalID: input.projectGoalID,
    label: input.label,
  }
}

/** Links a session goal to its project goal without copying the project graph. */
export function linkProjectGoal(goal: GoalNode, project: ProjectGoalRef | undefined): GoalNode {
  if (!project) return goal

  return {
    ...goal,
    projectID: project.projectID,
    projectGoalID: project.projectGoalID,
  }
}
