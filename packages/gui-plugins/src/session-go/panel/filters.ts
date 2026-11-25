import type {
  ActionKind,
  ActionNode,
  ActionStatus,
  Authority,
  DecisionKind,
  DecisionNode,
  DecisionStatus,
  EvidenceKind,
  EvidenceStatus,
  GoalStatus,
  NextDecisionKind,
} from "../types"

export const decisionFilters = ["all", "open", "proposed", "active", "superseded"] as const

export type DecisionFilter = (typeof decisionFilters)[number]

export const actionFilters = ["all", "related", "changes", "errors"] as const

export type ActionFilter = (typeof actionFilters)[number]

export const actionViews = ["list", "relations"] as const

export type ActionView = (typeof actionViews)[number]

export const decisionFilterKeys: Record<DecisionFilter, string> = {
  all: "decision.filter.all",
  open: "decision.filter.open",
  proposed: "decision.filter.proposed",
  active: "decision.filter.active",
  superseded: "decision.filter.superseded",
}

export const actionFilterKeys: Record<ActionFilter, string> = {
  all: "action.filter.all",
  related: "action.filter.related",
  changes: "action.filter.changes",
  errors: "action.filter.errors",
}

export const decisionStatusKeys: Record<DecisionStatus, string> = {
  open: "status.open",
  proposed: "status.proposed",
  active: "status.active",
  superseded: "status.superseded",
  resolved: "status.resolved",
  dropped: "status.dropped",
}

export const actionStatusKeys: Record<ActionStatus, string> = {
  planned: "status.planned",
  running: "status.running",
  succeeded: "status.succeeded",
  failed: "status.failed",
  interrupted: "status.interrupted",
}

export const goalStatusKeys: Record<GoalStatus, string> = {
  proposed: "status.proposed",
  active: "status.active",
  achieved: "status.achieved",
  abandoned: "status.abandoned",
  superseded: "status.superseded",
}

export const decisionKindKeys: Record<DecisionKind, string> = {
  goal: "decision.kind.goal",
  constraint: "decision.kind.constraint",
  approach: "decision.kind.approach",
  tradeoff: "decision.kind.tradeoff",
  approval: "decision.kind.approval",
  "open-question": "decision.kind.open-question",
}

export const nextKindKeys: Record<NextDecisionKind, string> = {
  "open-question": "next.kind.open-question",
  "proposed-decision": "next.kind.proposed-decision",
  conflict: "next.kind.conflict",
  "stale-evidence": "next.kind.stale-evidence",
  acceptance: "next.kind.acceptance",
  failure: "next.kind.failure",
}

export const nextWhyKeys: Record<NextDecisionKind, string> = {
  "open-question": "next.why.open-question",
  "proposed-decision": "next.why.proposed-decision",
  conflict: "next.why.conflict",
  "stale-evidence": "next.why.stale-evidence",
  acceptance: "next.why.acceptance",
  failure: "next.why.failure",
}

export const authorityKeys: Record<Authority, string> = {
  user: "authority.user",
  confirmed: "authority.confirmed",
  agent: "authority.agent",
  inferred: "authority.inferred",
}

export const actionKindKeys: Record<ActionKind, string> = {
  prompt: "action.kind.prompt",
  step: "action.kind.step",
  tool: "action.kind.tool",
  shell: "action.kind.shell",
  change: "action.kind.change",
  subagent: "action.kind.subagent",
  checkpoint: "action.kind.checkpoint",
  notice: "action.kind.notice",
  switch: "action.kind.switch",
  planned: "action.kind.planned",
  error: "action.kind.error",
}

export const evidenceKindKeys: Record<EvidenceKind, string> = {
  command: "evidence.command",
  test: "evidence.test",
  diff: "evidence.diff",
  file: "evidence.file",
  artifact: "evidence.artifact",
  tool: "evidence.tool",
  "user-confirmation": "evidence.user",
}

export const evidenceStatusKeys: Record<EvidenceStatus, string> = {
  supports: "evidence.supports",
  refutes: "evidence.refutes",
  inconclusive: "evidence.inconclusive",
}

/** A confirmed manual link from an action to a goal or a decision. */
export type FactLink = {
  goal?: string
  decision?: string
}

export function decisionMatches(decision: DecisionNode, filter: DecisionFilter) {
  if (filter === "all") return true

  if (filter === "open") return decision.status === "open"

  if (filter === "proposed") return decision.status === "proposed"

  if (filter === "active") return decision.status === "active"

  return decision.status === "superseded" || decision.status === "resolved"
}

export function actionMatches(action: ActionNode, filter: ActionFilter, link: FactLink | undefined) {
  if (filter === "all") return true

  if (filter === "related") return link?.decision !== undefined || link?.goal !== undefined

  if (filter === "changes") return action.kind === "change" || (action.files?.length ?? 0) > 0

  return action.status === "failed" || action.status === "interrupted"
}

export function isActionable(decision: DecisionNode) {
  return decision.status === "proposed" || decision.status === "open"
}

/** A decision still in play can be replaced by another one. */
export function canSupersede(decision: DecisionNode) {
  return (
    decision.status === "proposed" ||
    decision.status === "open" ||
    decision.status === "active" ||
    decision.status === "resolved"
  )
}
