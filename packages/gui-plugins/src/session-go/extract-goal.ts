import { constraintSentences, firstLine, sectionItems } from "./extract-rules"
import type { ExtractionMessage, GoalNode, GoalSource, ProjectGoalRef } from "./types"

export type GoalExtractionInput = {
  messages: readonly ExtractionMessage[]
  explicit?: GoalSource
  project?: ProjectGoalRef
}

/** Extracts the explicit goal, else a conservative goal candidate from the first request or a checkpoint. */
export function extractGoal(input: GoalExtractionInput): GoalNode | undefined {
  if (input.explicit) return explicitGoal(input.explicit, input.project)

  const request = input.messages.find((message) => message.type === "user" && message.text.trim().length > 0)

  if (request?.type === "user") {
    const statement = firstLine(request.text, 240)

    return {
      id: "G1",
      projectID: input.project?.projectID,
      projectGoalID: input.project?.projectGoalID,
      version: 1,
      statement,
      scope: "session",
      status: "proposed",
      acceptance: [],
      constraints: constraintSentences(request.text),
      authority: "inferred",
      source: { messageID: request.id },
      confidence: "medium",
      reason: "first-request",
      rule: "goal.request",
    }
  }

  const checkpoint = input.messages.findLast(
    (message) =>
      message.type === "compaction" &&
      message.status === "completed" &&
      sectionItems(message.summary, "Objective").length > 0,
  )

  if (checkpoint?.type !== "compaction" || checkpoint.status !== "completed") return

  const statement = sectionItems(checkpoint.summary, "Objective")[0]

  if (!statement) return

  return {
    id: "G1",
    projectID: input.project?.projectID,
    projectGoalID: input.project?.projectGoalID,
    version: 1,
    statement: firstLine(statement, 240),
    scope: "session",
    status: "proposed",
    acceptance: [],
    constraints: sectionItems(checkpoint.summary, "Requirements"),
    authority: "inferred",
    source: { messageID: checkpoint.id, checkpointID: checkpoint.id },
    confidence: "low",
    reason: "compaction-objective",
    rule: "goal.compaction",
  }
}

function explicitGoal(goal: GoalSource, project: ProjectGoalRef | undefined): GoalNode {
  return {
    id: goal.id ?? "G1",
    projectID: project?.projectID,
    projectGoalID: project?.projectGoalID,
    version: 1,
    statement: firstLine(goal.objective, 240),
    scope: "session",
    status: goal.status === "complete" ? "achieved" : "active",
    acceptance: [],
    authority: goal.authority,
    source: goal.source,
    confidence: "high",
    reason: goal.status === "paused" ? "goal-state-paused" : "goal-state",
    rule: "goal.explicit",
  }
}
