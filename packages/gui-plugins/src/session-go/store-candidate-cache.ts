import { buildSessionGraph, type SessionGraphInput } from "./graph-session"
import { CANDIDATE_SCHEMA_VERSION, MODEL_VERSION, RULE_VERSION } from "./schema"
import { projectGoalContext } from "./project-goals"
import { sourceSignature } from "./session-signature"
import type { CandidateCache } from "./types"

/** Whether a stored candidate graph still matches the session and the extractor versions. */
export function candidateCacheValid(cache: CandidateCache | undefined, signature: string) {
  if (!cache?.graph) return false

  return (
    cache.schemaVersion === CANDIDATE_SCHEMA_VERSION &&
    cache.ruleVersion === RULE_VERSION &&
    cache.modelVersion === MODEL_VERSION &&
    cache.sourceSignature === signature
  )
}

export function graphFromCache(cache: CandidateCache | undefined, signature: string) {
  if (!candidateCacheValid(cache, signature)) return

  return cache?.graph
}

/** Builds a persisted candidate snapshot for one session. */
export function buildCandidateCache(input: SessionGraphInput, now = Date.now()): CandidateCache {
  return {
    schemaVersion: CANDIDATE_SCHEMA_VERSION,
    ruleVersion: RULE_VERSION,
    modelVersion: MODEL_VERSION,
    sourceSignature: sourceSignature(input.messages, projectGoalContext(input.project)),
    updatedAt: now,
    graph: buildSessionGraph({ ...input, now }),
  }
}
