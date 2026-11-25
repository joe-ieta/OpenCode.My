import { expect, test } from "bun:test"
import { linkProjectGoal, projectGoalRef } from "./graph-project-refs"
import type { GoalNode } from "./types"

const goal: GoalNode = {
  id: "G1",
  version: 1,
  statement: "Ship",
  scope: "session",
  status: "active",
  acceptance: [],
  authority: "user",
  source: { messageID: "msg_goal" },
}

test("projectGoalRef keeps only the reference a session goal needs", () => {
  expect(projectGoalRef({ projectID: "proj_1", label: "Session Go" })).toEqual({
    projectID: "proj_1",
    projectGoalID: undefined,
    label: "Session Go",
  })
})

test("linkProjectGoal links a session goal without copying the project graph", () => {
  const linked = linkProjectGoal(goal, { projectID: "proj_1", projectGoalID: "goal_1", label: "Session Go" })

  expect(linked).toMatchObject({ id: "G1", projectID: "proj_1", projectGoalID: "goal_1" })
  expect(linked).not.toBe(goal)
  expect(linkProjectGoal(goal, undefined)).toBe(goal)
})
