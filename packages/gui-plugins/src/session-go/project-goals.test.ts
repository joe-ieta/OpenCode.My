import { describe, expect, test } from "bun:test"
import {
  mockProjectGoal,
  projectGoalContext,
  projectGoalRefFrom,
  resolveProjectGoal,
} from "./project-goals"
import type { ProjectGoal } from "./types"

const stored: ProjectGoal = {
  id: "PG1",
  projectID: "proj_1",
  statement: "Ship the semantic layer",
  status: "active",
  authority: "user",
}

describe("project goals", () => {
  test("builds a mock top-level goal", () => {
    const goal = mockProjectGoal({ projectID: "proj_1", statement: "Ship Test" })

    expect(goal).toMatchObject({
      id: "mock-project-goal-proj_1",
      projectID: "proj_1",
      statement: "Ship Test",
      status: "proposed",
      authority: "inferred",
      mock: true,
    })
  })

  test("prefers a stored top-level goal and falls back to the mock", () => {
    expect(
      resolveProjectGoal({ projectID: "proj_1", stored: [stored], mockStatement: "Ship Mock" }),
    ).toBe(stored)

    const child = { ...stored, id: "PG2", parentID: "PG1" }
    expect(
      resolveProjectGoal({ projectID: "proj_1", stored: [child], mockStatement: "Ship Mock" }),
    ).toMatchObject({ id: "mock-project-goal-proj_1", mock: true })

    expect(
      resolveProjectGoal({ projectID: "proj_2", stored: [stored], mockStatement: "Ship Mock" }),
    ).toMatchObject({ projectID: "proj_2", mock: true })
  })

  test("keeps only the reference and a stable fingerprint context", () => {
    expect(projectGoalRefFrom(stored)).toEqual({
      projectID: "proj_1",
      projectGoalID: "PG1",
      label: "Ship the semantic layer",
    })
    expect(projectGoalContext(projectGoalRefFrom(stored))).toBe("proj_1:PG1")
    expect(projectGoalContext(undefined)).toBe("")
  })
})
