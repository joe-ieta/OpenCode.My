import { extractActions } from "./extract-actions"
import { extractDecisions } from "./extract-decisions"
import { extractEvidence } from "./extract-evidence"
import { extractGoal } from "./extract-goal"
import { extractOpenQuestions } from "./extract-questions"
import { linkProjectGoal } from "./graph-project-refs"
import { buildRelations } from "./graph-relations"
import { projectGoalContext } from "./project-goals"
import { sourceSignature } from "./session-signature"
import type {
  ActionNode,
  ExtractionMessage,
  GoalSource,
  PlanItem,
  ProjectGoalRef,
  SessionGraph,
} from "./types"

export type SessionGraphInput = {
  sessionKey: string
  messages: readonly ExtractionMessage[]
  goal?: GoalSource
  project?: ProjectGoalRef
  plan?: readonly PlanItem[]
  now?: number
}

/** Builds the deterministic semantic read model for one session. */
export function buildSessionGraph(input: SessionGraphInput): SessionGraph {
  const actions = extractActions(input.messages)
  const planned = (input.plan ?? []).map(plannedAction)
  const allActions = [...actions.actions, ...planned]
  const evidence = extractEvidence(allActions, input.messages, input.now)
  const goal = extractGoal({ messages: input.messages, explicit: input.goal, project: input.project })

  const decisions = [
    ...extractDecisions({ messages: input.messages, actions: allActions }),
    ...extractOpenQuestions({ messages: input.messages }),
  ]

  return {
    sessionKey: input.sessionKey,
    goals: goal ? [linkProjectGoal(goal, input.project)] : [],
    decisions,
    actions: allActions,
    evidence,
    edges: buildRelations({ decisions, actions: allActions, evidence }),
    approximate: actions.approximate,
    outcomes: actions.outcomes,
    signature: `${sourceSignature(input.messages, projectGoalContext(input.project))}:${allActions.length}:${decisions.length}:${evidence.length}`,
  }
}

function plannedAction(item: PlanItem): ActionNode {
  return {
    id: `plan-${item.id}`,
    kind: "planned",
    actor: "agent",
    status: plannedStatus[item.status],
    summary: item.content,
    source: item.source ?? {},
    confidence: "medium",
    rule: "action.plan",
  }
}

const plannedStatus = {
  pending: "planned",
  in_progress: "running",
  completed: "succeeded",
  cancelled: "interrupted",
} as const satisfies Record<PlanItem["status"], ActionNode["status"]>
