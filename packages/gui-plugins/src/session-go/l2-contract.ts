import { Option, Schema } from "effect"
import { normalizeStatement, truncate } from "./extract-rules"
import type {
  DecisionKind,
  DecisionNode,
  Edge,
  ExtractionMessage,
  L2Scope,
  SessionGraph,
} from "./types"

/** Bump when the prompt or the accepted output shape changes; it is part of an analysis key. */
export const L2_PROMPT_VERSION = 1

export const L2_MAX_DECISIONS = 8

export const L2_MAX_QUESTIONS = 4

export const L2_MAX_CONFLICTS = 4

export const L2_MAX_INPUT_CHARS = 12_000

const L2_MAX_MESSAGE_CHARS = 600

const L2_MAX_EXCERPTS = 24

const Fact = Schema.Struct({
  statement: Schema.String,
  kind: Schema.optional(Schema.String),
  rationale: Schema.optional(Schema.String),
  alternatives: Schema.optional(Schema.Array(Schema.String)),
  sourceMessageIDs: Schema.Array(Schema.String),
  mergesDecisionIDs: Schema.optional(Schema.Array(Schema.String)),
  supersedesDecisionIDs: Schema.optional(Schema.Array(Schema.String)),
  confidence: Schema.optional(Schema.String),
})

const Conflict = Schema.Struct({
  decisionID: Schema.String,
  otherDecisionID: Schema.String,
  reason: Schema.optional(Schema.String),
  sourceMessageIDs: Schema.Array(Schema.String),
})

const Output = Schema.Struct({
  decisions: Schema.optional(Schema.Array(Fact)),
  openQuestions: Schema.optional(Schema.Array(Fact)),
  conflicts: Schema.optional(Schema.Array(Conflict)),
})

type L2Fact = (typeof Fact)["Type"]

export type L2ParseResult = {
  decisions: readonly DecisionNode[]
  edges: readonly Edge[]
  dropped: number
}

/**
 * Builds the compact consolidation prompt. It includes candidate facts and only the newest message
 * excerpts that fit the input budget; every excerpt carries the message ID the model may cite.
 */
export function buildL2Prompt(input: {
  graph: SessionGraph
  messages: readonly ExtractionMessage[]
  scope: L2Scope
}) {
  const facts = [
    "GOAL CANDIDATES:",
    input.graph.goals.length === 0
      ? "(none)"
      : input.graph.goals
          .map(
            (goal) =>
              `- ${goal.id} [${goal.status}, ${goal.authority}] ${clip(goal.statement, 240)}${
                goal.constraints?.length ? ` constraints: ${goal.constraints.join("; ")}` : ""
              }`,
          )
          .join("\n"),
    "",
    "DECISION CANDIDATES:",
    input.graph.decisions.length === 0
      ? "(none)"
      : input.graph.decisions
          .map(
            (decision) =>
              `- ${decision.id} [${decision.status}, ${decision.kind}, ${decision.authority}] ${clip(decision.statement, 240)}${
                decision.rationale ? ` rationale: ${clip(decision.rationale, 240)}` : ""
              }`,
          )
          .join("\n"),
    "",
    "ACTION FACTS:",
    input.graph.actions.length === 0
      ? "(none)"
      : input.graph.actions
          .slice(-20)
          .map(
            (action) =>
              `- ${action.id} [${action.kind}, ${action.status}] ${clip(action.summary, 180)}${
                action.files?.length ? ` files: ${action.files.slice(0, 4).join(", ")}` : ""
              }`,
          )
          .join("\n"),
    "",
    "EVIDENCE FACTS:",
    input.graph.evidence.length === 0
      ? "(none)"
      : input.graph.evidence
          .slice(-20)
          .map(
            (evidence) =>
              `- ${evidence.id} [${evidence.kind}, ${evidence.status}${evidence.stale ? ", stale" : ""}] ${clip(evidence.summary, 180)}`,
          )
          .join("\n"),
  ].join("\n")

  const excerpts = messageExcerpts(input.messages)
  const allowed = input.messages.map((message) => message.id)

  return [
    "You consolidate a coding session's decision candidates. Use only the facts and excerpts below; never invent facts or IDs.",
    "",
    "Return exactly one JSON object and nothing else, in this shape:",
    '{"decisions":[{"statement":"...","kind":"approach","rationale":"...","alternatives":["..."],"sourceMessageIDs":["msg_id"],"mergesDecisionIDs":["decision_id"],"supersedesDecisionIDs":["decision_id"],"confidence":"medium"}],"openQuestions":[{"statement":"...","sourceMessageIDs":["msg_id"],"confidence":"medium"}],"conflicts":[{"decisionID":"decision_id","otherDecisionID":"decision_id","reason":"...","sourceMessageIDs":["msg_id"]}]}',
    "",
    "Rules:",
    "1. Every sourceMessageIDs must contain at least one ID from ALLOWED MESSAGE IDS. Facts without one are discarded.",
    "2. mergesDecisionIDs, supersedesDecisionIDs, decisionID and otherDecisionID must use IDs from the listed facts.",
    "3. Merge near-duplicates instead of repeating them; keep every statement under 240 characters.",
    "4. kind is one of goal, constraint, approach, tradeoff, approval; confidence is high, medium or low.",
    "5. Your output is a proposal. Never mark anything confirmed or active.",
    "6. Output at most 8 decisions, 4 open questions and 4 conflicts. Empty arrays are fine.",
    "",
    `SCOPE: ${input.scope.kind === "episode" ? "the episode that just ended" : "the loaded session range"}; ${input.scope.messageCount} messages.`,
    `ALLOWED MESSAGE IDS: ${allowed.join(", ") || "(none)"}`,
    "",
    facts,
    "",
    "MESSAGE EXCERPTS:",
    excerpts || "(none)",
  ].join("\n")
}

/** Parses model output, dropping any fact without a real source or a real referenced fact ID. */
export function parseL2Output(
  raw: string,
  input: { graph: SessionGraph; messages: readonly ExtractionMessage[] },
): L2ParseResult | undefined {
  const json = extractJson(raw)

  if (!json) return

  const decoded = Schema.decodeUnknownOption(Schema.fromJsonString(Output))(json)

  if (Option.isNone(decoded)) return

  const allowedMessages = new Set(input.messages.map((message) => message.id))
  const allowedDecisions = new Set(input.graph.decisions.map((decision) => decision.id))
  const existingStatements = new Set(input.graph.decisions.map((decision) => normalizeStatement(decision.statement)))
  const decisions: DecisionNode[] = []
  const edges: Edge[] = []
  const seenStatements = new Set<string>()
  const seenConflicts = new Set<string>()
  let dropped = 0

  const accept = (fact: L2Fact, kind: DecisionKind) => {
    const sources = fact.sourceMessageIDs.filter((id) => allowedMessages.has(id))

    const confidence =
      fact.confidence === "high" || fact.confidence === "low" ? fact.confidence : "medium"

    if (sources.length === 0) {
      dropped++

      return
    }

    const statement = statementText(fact.statement)

    if (!statement) {
      dropped++

      return
    }

    const normalized = normalizeStatement(statement)

    if (existingStatements.has(normalized) || seenStatements.has(normalized)) return

    seenStatements.add(normalized)
    const id = l2DecisionID(statement)
    const merges = (fact.mergesDecisionIDs ?? []).filter((decisionID) => allowedDecisions.has(decisionID))

    const supersedes = (fact.supersedesDecisionIDs ?? []).filter((decisionID) =>
      allowedDecisions.has(decisionID),
    )

    decisions.push({
      id,
      kind,
      statement,
      rationale: fact.rationale ? statementText(fact.rationale, 400) : undefined,
      alternatives: fact.alternatives
        ?.slice(0, 4)
        .map((alternative) => statementText(alternative, 200))
        .filter(Boolean),
      status: "proposed",
      authority: "inferred",
      scope: "session",
      source: { messageID: sources[0] },
      confidence,
      rule: "l2.consolidated",
    })

    for (const decisionID of merges) {
      edges.push({ from: id, to: decisionID, kind: "derivedFrom" })
    }

    for (const decisionID of supersedes) {
      edges.push({ from: id, to: decisionID, kind: "supersedes" })
    }
  }

  for (const fact of (decoded.value.decisions ?? []).slice(0, L2_MAX_DECISIONS)) {
    accept(fact, l2Kind(fact.kind))
  }

  for (const fact of (decoded.value.openQuestions ?? []).slice(0, L2_MAX_QUESTIONS)) {
    accept(fact, "open-question")
  }

  for (const decision of decisions) allowedDecisions.add(decision.id)

  for (const conflict of (decoded.value.conflicts ?? []).slice(0, L2_MAX_CONFLICTS)) {
    const sources = conflict.sourceMessageIDs.filter((id) => allowedMessages.has(id))

    if (
      sources.length === 0 ||
      conflict.decisionID === conflict.otherDecisionID ||
      !allowedDecisions.has(conflict.decisionID) ||
      !allowedDecisions.has(conflict.otherDecisionID)
    ) {
      dropped++
      continue
    }

    const key = [conflict.decisionID, conflict.otherDecisionID].sort().join(":")

    if (seenConflicts.has(key)) continue

    seenConflicts.add(key)
    edges.push({
      from: conflict.decisionID,
      to: conflict.otherDecisionID,
      kind: "conflicts",
      reason: conflict.reason ? statementText(conflict.reason, 240) : undefined,
      sourceMessageIDs: sources,
    })
  }

  return { decisions, edges, dropped }
}

/** Merges persisted L2 snapshots over the deterministic candidate graph. */
export function mergeL2Snapshots(graph: SessionGraph, snapshots: readonly { decisions: readonly DecisionNode[]; edges: readonly Edge[] }[]) {
  if (snapshots.length === 0) return graph

  const decisions = [...graph.decisions]
  const edges = [...graph.edges]
  const ids = new Set(decisions.map((decision) => decision.id))
  const statements = new Set(decisions.map((decision) => normalizeStatement(decision.statement)))

  for (const snapshot of snapshots) {
    for (const decision of snapshot.decisions) {
      if (ids.has(decision.id)) continue

      const statement = normalizeStatement(decision.statement)

      if (statements.has(statement)) continue

      ids.add(decision.id)
      statements.add(statement)
      decisions.push(decision)
    }
  }

  for (const snapshot of snapshots) {
    for (const edge of snapshot.edges) {
      if (!ids.has(edge.from) || !ids.has(edge.to)) continue

      if (edges.some((item) => item.from === edge.from && item.to === edge.to && item.kind === edge.kind)) continue

      edges.push(edge)
    }
  }

  if (decisions.length === graph.decisions.length && edges.length === graph.edges.length) return graph

  return { ...graph, decisions, edges }
}

/** Stable candidate ID for a consolidated statement. */
export function l2DecisionID(statement: string) {
  let hash = 2166136261

  for (let index = 0; index < statement.length; index++) {
    hash ^= statement.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return `l2-${(hash >>> 0).toString(36)}`
}

function messageExcerpts(messages: readonly ExtractionMessage[]) {
  const excerpts: string[] = []
  let used = 0

  for (let index = messages.length - 1; index >= 0 && excerpts.length < L2_MAX_EXCERPTS; index--) {
    const message = messages[index]!
    const text = excerpt(message)

    if (!text) continue

    const line = `[${message.type}:${message.id}] ${clip(text, L2_MAX_MESSAGE_CHARS)}`

    if (used + line.length > L2_MAX_INPUT_CHARS / 2) break

    used += line.length
    excerpts.push(line)
  }

  return excerpts.reverse().join("\n")
}

function excerpt(message: ExtractionMessage) {
  if (message.type === "user") return message.text

  if (message.type === "assistant") {
    return message.content
      .flatMap((part) => (part.type === "text" ? [part.text] : []))
      .join("\n")
  }

  if (message.type === "shell") return `${message.command} (${message.status})`

  if (message.type === "compaction") return message.summary ?? "(compaction failed)"

  if (message.type === "idle") return message.outcome

  if (message.type === "synthetic" || message.type === "system" || message.type === "skill") return message.text

  if (message.type === "agent-switched" || message.type === "model-switched" || message.type === "location-switched")
    return message.type

  return ""
}

function extractJson(raw: string) {
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")

  if (start < 0 || end <= start) return

  return text.slice(start, end + 1)
}

function l2Kind(value: string | undefined): DecisionKind {
  if (
    value === "goal" ||
    value === "constraint" ||
    value === "tradeoff" ||
    value === "approval"
  )
    return value

  return "approach"
}

function clip(text: string, maximum: number) {
  return statementText(text, maximum)
}

function statementText(text: string, maximum = 240) {
  return truncate(text.trim().replace(/^[-*\d.\s]+/, "").replace(/\s+/g, " "), maximum)
}
