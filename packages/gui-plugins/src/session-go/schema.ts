/** The shape of persisted candidates. Rebuild candidates when this changes. */
export const CANDIDATE_SCHEMA_VERSION = 1

/** The extraction rule catalog version. Rebuild candidates when this changes. */
export const RULE_VERSION = 1

/** The model consolidation version. Rebuild candidates when this changes. */
export const MODEL_VERSION = "none"

/** The commitment log shape. Commitments must be migrated, never rebuilt. */
export const COMMITMENT_SCHEMA_VERSION = 1
