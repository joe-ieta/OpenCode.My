/** Who made a fact authoritative. */
export type Authority = "user" | "confirmed" | "agent" | "inferred"

/** Where a fact came from. */
export type SourceRef = {
  messageID?: string
  partID?: string
  actionID?: string
  checkpointID?: string
}

export type GoalStatus = "proposed" | "active" | "achieved" | "abandoned" | "superseded"

export type AcceptanceCriterion = {
  id: string
  statement: string
  met: boolean
  evidenceIDs?: readonly string[]
}

export type GoalNode = {
  id: string
  parentID?: string
  projectID?: string
  projectGoalID?: string
  version: number
  statement: string
  scope: "session" | "project"
  status: GoalStatus
  acceptance: readonly AcceptanceCriterion[]
  constraints?: readonly string[]
  authority: Authority
  source: SourceRef
  supersedes?: string
  reason?: string
  confidence?: "high" | "medium" | "low"
  rule?: string
}

export type DecisionKind =
  | "goal"
  | "constraint"
  | "approach"
  | "tradeoff"
  | "approval"
  | "open-question"

export type DecisionStatus = "open" | "proposed" | "active" | "superseded" | "resolved" | "dropped"

export type DecisionNode = {
  id: string
  kind: DecisionKind
  statement: string
  rationale?: string
  alternatives?: readonly string[]
  status: DecisionStatus
  authority: Authority
  scope: "goal" | "session" | "project"
  source: SourceRef
  supersedes?: string
  supersededBy?: string
  confidence: "high" | "medium" | "low"
  deferred?: boolean
  rule?: string
}

export type ActionKind =
  | "prompt"
  | "step"
  | "tool"
  | "shell"
  | "change"
  | "subagent"
  | "checkpoint"
  | "notice"
  | "switch"
  | "planned"
  | "error"

export type ActionStatus = "planned" | "running" | "succeeded" | "failed" | "interrupted"

export type ActionNode = {
  id: string
  kind: ActionKind
  actor: "user" | "agent" | "system"
  status: ActionStatus
  summary: string
  name?: string
  files?: readonly string[]
  source: SourceRef
  startedAt?: number
  endedAt?: number
  confidence?: "high" | "medium" | "low"
  rule?: string
}

export type EvidenceKind = "command" | "test" | "diff" | "file" | "artifact" | "tool" | "user-confirmation"

export type EvidenceStatus = "supports" | "refutes" | "inconclusive"

export type EvidenceNode = {
  id: string
  kind: EvidenceKind
  summary: string
  status: EvidenceStatus
  freshAt?: number
  signature?: string
  stale?: boolean
  files?: readonly string[]
  source: SourceRef
  confidence?: "high" | "medium" | "low"
  rule?: string
}

export type EdgeKind =
  | "addresses"
  | "implements"
  | "produces"
  | "supports"
  | "refutes"
  | "supersedes"
  | "conflicts"
  | "depends"
  | "derivedFrom"
  | "relatedTo"

export type Edge = {
  from: string
  to: string
  kind: EdgeKind
  reason?: string
  sourceMessageIDs?: readonly string[]
}

export type SessionGraph = {
  sessionKey: string
  goals: readonly GoalNode[]
  decisions: readonly DecisionNode[]
  actions: readonly ActionNode[]
  evidence: readonly EvidenceNode[]
  edges: readonly Edge[]
  approximate?: boolean
  outcomes?: readonly EpisodeOutcome[]
  signature?: string
}

export type NextDecisionOption = {
  id: string
  label: string
  detail?: string
}

export type NextDecision = {
  id: string
  kind: NextDecisionKind
  priority: number
  question: string
  whyNow?: string
  options: readonly NextDecisionOption[]
  impact?: string
  evidenceIDs?: readonly string[]
  source: SourceRef
  status: "open" | "resolved" | "deferred"
  decisionID?: string
  actionID?: string
  evidenceID?: string
  goalID?: string
}


// SAFETY: Tool input arrives as decoded JSON from the session protocol. parseToolInput narrows it with ToolInput
// before any field is read; this alias exists only at that boundary.
// oxlint-disable-next-line anti-slop/no-unsafe-dictionary-type -- see SAFETY above
export type ToolInputRecord = Record<string, unknown>

/** The minimal message shape the deterministic extractors read. Actual SessionMessageInfo values are compatible. */
// SAFETY: Tool input arrives as decoded JSON from the session protocol and is narrowed by parseToolInput before use.
// oxlint-disable anti-slop/no-unsafe-dictionary-type -- see SAFETY above
export type ExtractionToolState =
  | { status: "streaming"; input: string }
  | { status: "running"; input: ToolInputRecord }
  | { status: "completed"; input: ToolInputRecord; content?: readonly unknown[] }
  | { status: "error"; input: ToolInputRecord; error?: { message?: string }; content?: readonly unknown[] }
// oxlint-enable anti-slop/no-unsafe-dictionary-type

export type ExtractionContent =
  | { type: "text"; text: string }
  | { type: "reasoning"; text: string }
  | {
      type: "tool"
      id: string
      name: string
      state: ExtractionToolState
      time: { created: number; completed?: number }
    }

export type ExtractionToolContent = Extract<ExtractionContent, { type: "tool" }>

export type ExtractionMessage =
  | {
      id: string
      type: "user"
      text: string
      files?: readonly unknown[]
      time: { created: number }
    }
  | {
      id: string
      type: "assistant"
      agent: string
      model: { providerID: string; id: string }
      content: readonly ExtractionContent[]
      snapshot?: { files?: readonly string[]; end?: string }
      error?: unknown
      retry?: unknown
      time: { created: number; completed?: number }
    }
  | {
      id: string
      type: "shell"
      command: string
      status: "running" | "exited" | "timeout" | "killed"
      exit?: number | "-Infinity" | "Infinity" | "NaN"
      time: { created: number; completed?: number }
    }
  | {
      id: string
      type: "compaction"
      status: "running" | "completed"
      reason: "auto" | "manual"
      summary: string
      time: { created: number }
    }
  | {
      id: string
      type: "compaction"
      status: "failed"
      reason: "auto" | "manual"
      summary?: string
      time: { created: number }
    }
  | {
      id: string
      type: "idle"
      outcome: "succeeded" | "failed" | "interrupted"
      error?: unknown
      time: { created: number }
    }
  | {
      id: string
      type: "synthetic" | "system"
      text: string
      description?: string
      time: { created: number }
    }
  | {
      id: string
      type: "skill"
      skill: string
      name: string
      text: string
      time: { created: number }
    }
  | {
      id: string
      type: "agent-switched" | "model-switched" | "location-switched"
      time: { created: number }
    }

export type GoalSource = {
  id?: string
  objective: string
  status: "active" | "paused" | "complete"
  authority: "user" | "confirmed"
  source: SourceRef
}

export type PlanItem = {
  id: string
  content: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  source?: SourceRef
}

export type NextDecisionKind =
  | "open-question"
  | "proposed-decision"
  | "conflict"
  | "stale-evidence"
  | "acceptance"
  | "failure"

export type EpisodeOutcome = {
  messageID: string
  outcome: "succeeded" | "failed" | "interrupted"
  error?: string
  time: number
}

export type ActionExtraction = {
  actions: readonly ActionNode[]
  outcomes: readonly EpisodeOutcome[]
  approximate: boolean
}

export type ProjectGoalRef = {
  projectID: string
  projectGoalID?: string
  label: string
}

/** A top-level project goal. The first version keeps it as a read-only placeholder. */
export type ProjectGoal = {
  id: string
  projectID: string
  parentID?: string
  statement: string
  status: GoalStatus
  authority: Authority
  source?: SourceRef
  mock?: boolean
}

export type L2Trigger = "manual" | "episode"

export type L2ModelRef = {
  providerID: string
  id: string
  variant?: string
}

export type L2Scope = {
  kind: "session" | "episode"
  fromMessageID?: string
  toMessageID?: string
  episodeID?: string
  messageCount: number
  truncated?: boolean
}

export type L2Tokens = {
  input: number
  output: number
  reasoning: number
  cache: { read: number; write: number }
}

export type L2Snapshot = {
  key: string
  trigger: L2Trigger
  promptVersion: number
  createdAt: number
  providerID?: string
  modelID?: string
  modelName: string
  cost?: number
  tokens?: L2Tokens
  scope: L2Scope
  decisions: readonly DecisionNode[]
  edges: readonly Edge[]
  dropped: number
}

export type CandidateCache = {
  schemaVersion: number
  ruleVersion: number
  modelVersion: string
  sourceSignature?: string
  updatedAt: number
  graph?: SessionGraph
  l2?: readonly L2Snapshot[]
}

export type CommitmentEventType =
  | "decision.confirmed"
  | "decision.rejected"
  | "decision.deferred"
  | "decision.superseded"
  | "decision.promoted"
  | "action.linked"

export type CommitmentEvent = {
  id: string
  type: CommitmentEventType
  at: number
  targetID: string
  decision?: DecisionNode
  decisionID?: string
  supersededBy?: string
  goalID?: string
  actionID?: string
  source?: SourceRef
}

export type CommitmentLog = {
  schemaVersion: number
  events: readonly CommitmentEvent[]
}
