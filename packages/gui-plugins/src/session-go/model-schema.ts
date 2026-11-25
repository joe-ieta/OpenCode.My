import { Schema } from "effect"
import { CANDIDATE_SCHEMA_VERSION, COMMITMENT_SCHEMA_VERSION, MODEL_VERSION, RULE_VERSION } from "./schema"

const SourceRef = Schema.Struct({
  messageID: Schema.optional(Schema.String),
  partID: Schema.optional(Schema.String),
  actionID: Schema.optional(Schema.String),
  checkpointID: Schema.optional(Schema.String),
})

const Authority = Schema.Literals(["user", "confirmed", "agent", "inferred"])

const GoalStatus = Schema.Literals(["proposed", "active", "achieved", "abandoned", "superseded"])

const DecisionKind = Schema.Literals([
  "goal",
  "constraint",
  "approach",
  "tradeoff",
  "approval",
  "open-question",
])

const DecisionStatus = Schema.Literals([
  "open",
  "proposed",
  "active",
  "superseded",
  "resolved",
  "dropped",
])

const ActionKind = Schema.Literals([
  "prompt",
  "step",
  "tool",
  "shell",
  "change",
  "subagent",
  "checkpoint",
  "notice",
  "switch",
  "planned",
  "error",
])

const ActionStatus = Schema.Literals(["planned", "running", "succeeded", "failed", "interrupted"])

const EvidenceKind = Schema.Literals([
  "command",
  "test",
  "diff",
  "file",
  "artifact",
  "tool",
  "user-confirmation",
])

const EvidenceStatus = Schema.Literals(["supports", "refutes", "inconclusive"])

const EdgeKind = Schema.Literals([
  "addresses",
  "implements",
  "produces",
  "supports",
  "refutes",
  "supersedes",
  "conflicts",
  "depends",
  "derivedFrom",
  "relatedTo",
])

const Confidence = Schema.Literals(["high", "medium", "low"])

const AcceptanceCriterion = Schema.Struct({
  id: Schema.String,
  statement: Schema.String,
  met: Schema.Boolean,
  evidenceIDs: Schema.optional(Schema.Array(Schema.String)),
})

const GoalNode = Schema.Struct({
  id: Schema.String,
  parentID: Schema.optional(Schema.String),
  projectID: Schema.optional(Schema.String),
  projectGoalID: Schema.optional(Schema.String),
  version: Schema.Number,
  statement: Schema.String,
  scope: Schema.Literals(["session", "project"]),
  status: GoalStatus,
  acceptance: Schema.Array(AcceptanceCriterion),
  constraints: Schema.optional(Schema.Array(Schema.String)),
  authority: Authority,
  source: SourceRef,
  supersedes: Schema.optional(Schema.String),
  reason: Schema.optional(Schema.String),
  confidence: Schema.optional(Confidence),
  rule: Schema.optional(Schema.String),
})

const DecisionNode = Schema.Struct({
  id: Schema.String,
  kind: DecisionKind,
  statement: Schema.String,
  rationale: Schema.optional(Schema.String),
  alternatives: Schema.optional(Schema.Array(Schema.String)),
  status: DecisionStatus,
  authority: Authority,
  scope: Schema.Literals(["goal", "session", "project"]),
  source: SourceRef,
  supersedes: Schema.optional(Schema.String),
  supersededBy: Schema.optional(Schema.String),
  confidence: Confidence,
  deferred: Schema.optional(Schema.Boolean),
  rule: Schema.optional(Schema.String),
})

const ActionNode = Schema.Struct({
  id: Schema.String,
  kind: ActionKind,
  actor: Schema.Literals(["user", "agent", "system"]),
  status: ActionStatus,
  summary: Schema.String,
  name: Schema.optional(Schema.String),
  files: Schema.optional(Schema.Array(Schema.String)),
  source: SourceRef,
  startedAt: Schema.optional(Schema.Number),
  endedAt: Schema.optional(Schema.Number),
  confidence: Schema.optional(Confidence),
  rule: Schema.optional(Schema.String),
})

const EvidenceNode = Schema.Struct({
  id: Schema.String,
  kind: EvidenceKind,
  summary: Schema.String,
  status: EvidenceStatus,
  freshAt: Schema.optional(Schema.Number),
  signature: Schema.optional(Schema.String),
  stale: Schema.optional(Schema.Boolean),
  files: Schema.optional(Schema.Array(Schema.String)),
  source: SourceRef,
  confidence: Schema.optional(Confidence),
  rule: Schema.optional(Schema.String),
})

const Edge = Schema.Struct({
  from: Schema.String,
  to: Schema.String,
  kind: EdgeKind,
  reason: Schema.optional(Schema.String),
  sourceMessageIDs: Schema.optional(Schema.Array(Schema.String)),
})

const EpisodeOutcome = Schema.Struct({
  messageID: Schema.String,
  outcome: Schema.Literals(["succeeded", "failed", "interrupted"]),
  error: Schema.optional(Schema.String),
  time: Schema.Number,
})

export const SessionGraphSchema = Schema.Struct({
  sessionKey: Schema.String,
  goals: Schema.Array(GoalNode),
  decisions: Schema.Array(DecisionNode),
  actions: Schema.Array(ActionNode),
  evidence: Schema.Array(EvidenceNode),
  edges: Schema.Array(Edge),
  approximate: Schema.optional(Schema.Boolean),
  outcomes: Schema.optional(Schema.Array(EpisodeOutcome)),
  signature: Schema.optional(Schema.String),
})

const L2ScopeSchema = Schema.Struct({
  kind: Schema.Literals(["session", "episode"]),
  fromMessageID: Schema.optional(Schema.String),
  toMessageID: Schema.optional(Schema.String),
  episodeID: Schema.optional(Schema.String),
  messageCount: Schema.Number,
  truncated: Schema.optional(Schema.Boolean),
})

const L2TokensSchema = Schema.Struct({
  input: Schema.Number,
  output: Schema.Number,
  reasoning: Schema.Number,
  cache: Schema.Struct({ read: Schema.Number, write: Schema.Number }),
})

export const L2SnapshotSchema = Schema.Struct({
  key: Schema.String,
  trigger: Schema.Literals(["manual", "episode"]),
  promptVersion: Schema.Number,
  createdAt: Schema.Number,
  providerID: Schema.optional(Schema.String),
  modelID: Schema.optional(Schema.String),
  modelName: Schema.String,
  cost: Schema.optional(Schema.Number),
  tokens: Schema.optional(L2TokensSchema),
  scope: L2ScopeSchema,
  decisions: Schema.Array(DecisionNode),
  edges: Schema.Array(Edge),
  dropped: Schema.Number,
})

export const CandidateCacheSchema = Schema.Struct({
  schemaVersion: Schema.Number,
  ruleVersion: Schema.Number,
  modelVersion: Schema.String,
  sourceSignature: Schema.optional(Schema.String),
  updatedAt: Schema.Number,
  graph: Schema.optional(SessionGraphSchema),
  l2: Schema.optional(Schema.Array(L2SnapshotSchema)),
})

export const CommitmentEventSchema = Schema.Struct({
  id: Schema.String,
  type: Schema.Literals([
    "decision.confirmed",
    "decision.rejected",
    "decision.deferred",
    "decision.superseded",
    "decision.promoted",
    "action.linked",
  ]),
  at: Schema.Number,
  targetID: Schema.String,
  decision: Schema.optional(DecisionNode),
  decisionID: Schema.optional(Schema.String),
  supersededBy: Schema.optional(Schema.String),
  goalID: Schema.optional(Schema.String),
  actionID: Schema.optional(Schema.String),
  source: Schema.optional(SourceRef),
})

export const CommitmentLogSchema = Schema.Struct({
  schemaVersion: Schema.Number,
  events: Schema.Array(CommitmentEventSchema),
})

export const initialCandidateCache = {
  schemaVersion: CANDIDATE_SCHEMA_VERSION,
  ruleVersion: RULE_VERSION,
  modelVersion: MODEL_VERSION,
  updatedAt: 0,
}

export const initialCommitmentLog = {
  schemaVersion: COMMITMENT_SCHEMA_VERSION,
  events: [],
}

const ProjectGoalSchema = Schema.Struct({
  id: Schema.String,
  projectID: Schema.String,
  parentID: Schema.optional(Schema.String),
  statement: Schema.String,
  status: GoalStatus,
  authority: Authority,
  source: Schema.optional(SourceRef),
  mock: Schema.optional(Schema.Boolean),
})

export const ProjectGoalsSchema = Schema.Struct({
  goals: Schema.Array(ProjectGoalSchema),
})

export const initialProjectGoals = {
  goals: [],
}
