import { describe, expect, test } from "bun:test"
import { extractGoal } from "./extract-goal"
import { compaction, user } from "./test-fixtures"

const project = { projectID: "proj_1", projectGoalID: "goal_1", label: "Session Go" }

describe("extractGoal", () => {
  test("an explicit goal wins and keeps its project reference", () => {
    const goal = extractGoal({
      messages: [user("msg_user", "Build something else", 1)],
      explicit: {
        id: "goal_explicit",
        objective: "Ship the semantic layer",
        status: "active",
        authority: "user",
        source: { messageID: "msg_goal" },
      },
      project,
    })

    expect(goal).toMatchObject({
      id: "goal_explicit",
      statement: "Ship the semantic layer",
      status: "active",
      authority: "user",
      projectID: "proj_1",
      projectGoalID: "goal_1",
      rule: "goal.explicit",
    })
  })

  test("maps paused and complete goals without inventing a new state", () => {
    const paused = extractGoal({
      messages: [],
      explicit: {
        objective: "Wait",
        status: "paused",
        authority: "confirmed",
        source: {},
      },
    })

    const complete = extractGoal({
      messages: [],
      explicit: {
        objective: "Done",
        status: "complete",
        authority: "confirmed",
        source: {},
      },
    })

    expect(paused?.status).toBe("active")
    expect(paused?.reason).toBe("goal-state-paused")
    expect(complete?.status).toBe("achieved")
  })

  test("a first user request becomes a candidate goal", () => {
    const goal = extractGoal({
      messages: [user("msg_user", "Implement the panel. Keep it read-only.", 1)],
      project,
    })

    expect(goal).toMatchObject({
      statement: "Implement the panel. Keep it read-only.",
      status: "proposed",
      authority: "inferred",
      confidence: "medium",
      projectID: "proj_1",
      rule: "goal.request",
    })
    expect(goal?.constraints).toEqual(["Keep it read-only."])
  })

  test("falls back to a completed checkpoint Objective", () => {
    const summary = `## Objective
- Extract the session graph

## Requirements
- No model calls
- Keep it deterministic
`

    const goal = extractGoal({ messages: [compaction("msg_compaction", summary, "completed", 1)] })

    expect(goal?.statement).toBe("Extract the session graph")
    expect(goal?.constraints).toEqual(["No model calls", "Keep it deterministic"])
    expect(goal?.reason).toBe("compaction-objective")
    expect(goal?.rule).toBe("goal.compaction")
  })

  test("returns nothing for an empty session", () => {
    expect(extractGoal({ messages: [] })).toBeUndefined()
  })
})
