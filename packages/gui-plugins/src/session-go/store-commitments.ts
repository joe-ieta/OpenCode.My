import { uuid } from "@opencode/util/uuid"
import { COMMITMENT_SCHEMA_VERSION } from "./schema"
import type { ActionNode, CommitmentEvent, CommitmentLog, DecisionNode, SourceRef } from "./types"

/**
 * Brings a stored log to the current shape. Every version keeps its events; add the fields a newer version needs
 * here instead of discarding the log. A newer log is left alone so this build cannot downgrade it.
 */
export function migrateCommitmentLog(log: CommitmentLog): CommitmentLog {
  if (log.schemaVersion >= COMMITMENT_SCHEMA_VERSION) return log

  return { ...log, schemaVersion: COMMITMENT_SCHEMA_VERSION }
}

/** Appends one commitment event, ignoring an identical repeat. */
export function appendCommitment(log: CommitmentLog, event: CommitmentEvent): CommitmentLog {
  if (log.events.some((item) => sameEvent(item, event))) return log

  return { ...log, events: [...log.events, event] }
}

/**
 * Confirming snapshots the candidate, so a later candidate rebuild that drops it cannot lose the commitment.
 * The snapshot is only the fallback: a surviving candidate keeps its newer statement and sources.
 */
export function decisionConfirmed(decision: DecisionNode, at = Date.now(), source?: SourceRef): CommitmentEvent {
  return event({ type: "decision.confirmed", targetID: decision.id, at, decision, source })
}

export function decisionRejected(decision: DecisionNode, at = Date.now(), source?: SourceRef): CommitmentEvent {
  return event({ type: "decision.rejected", targetID: decision.id, at, decision, source })
}

export function decisionDeferred(decision: DecisionNode, at = Date.now(), source?: SourceRef): CommitmentEvent {
  return event({ type: "decision.deferred", targetID: decision.id, at, decision, source })
}

export function decisionSuperseded(
  decision: DecisionNode,
  supersededBy: string,
  at = Date.now(),
  source?: SourceRef,
): CommitmentEvent {
  return event({ type: "decision.superseded", targetID: decision.id, supersededBy, at, decision, source })
}

/** A user-promoted action becomes an authoritative decision immediately. */
export function decisionPromoted(action: ActionNode, at = Date.now()): CommitmentEvent {
  const decision: DecisionNode = {
    id: `promoted-${action.id}`,
    kind: "approach",
    statement: action.summary,
    status: "active",
    authority: "user",
    scope: "session",
    source: action.source,
    confidence: "high",
    rule: "decision.promoted",
  }

  return event({
    type: "decision.promoted",
    targetID: decision.id,
    at,
    decision,
    actionID: action.id,
    source: action.source,
  })
}

export function actionLinked(
  actionID: string,
  target: { goalID?: string; decisionID?: string },
  at = Date.now(),
  source?: SourceRef,
): CommitmentEvent {
  return event({ type: "action.linked", targetID: actionID, at, ...target, source })
}

function event(input: Omit<CommitmentEvent, "id">): CommitmentEvent {
  return { id: `commit_${uuid()}`, ...input }
}

function sameEvent(a: CommitmentEvent, b: CommitmentEvent) {
  return (
    a.type === b.type &&
    a.targetID === b.targetID &&
    a.goalID === b.goalID &&
    a.decisionID === b.decisionID &&
    a.supersededBy === b.supersededBy
  )
}
