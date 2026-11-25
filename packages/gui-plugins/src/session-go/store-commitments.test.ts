import { describe, expect, test } from "bun:test"
import { Schema } from "effect"
import { CommitmentLogSchema } from "./model-schema"
import {
  actionLinked,
  appendCommitment,
  decisionConfirmed,
  decisionDeferred,
  decisionPromoted,
  decisionRejected,
  decisionSuperseded,
  migrateCommitmentLog,
} from "./store-commitments"
import type { ActionNode, DecisionNode } from "./types"

const decision: DecisionNode = {
  id: "D1",
  kind: "approach",
  statement: "Keep one panel",
  status: "proposed",
  authority: "agent",
  scope: "session",
  source: { messageID: "msg_1" },
  confidence: "medium",
}

const action: ActionNode = {
  id: "A1",
  kind: "change",
  actor: "agent",
  status: "succeeded",
  summary: "Change panel.tsx",
  source: { messageID: "msg_1" },
}

describe("commitment log", () => {
  test("appends events idempotently", () => {
    const event = decisionConfirmed(decision, 1)
    const once = appendCommitment({ schemaVersion: 1, events: [] }, event)
    const twice = appendCommitment(once, decisionConfirmed(decision, 2))

    expect(once.events).toHaveLength(1)
    expect(twice.events).toHaveLength(1)
    expect(once.events[0]?.id.startsWith("commit_")).toBe(true)
  })

  test("snapshots the decision in every status event", () => {
    expect(decisionConfirmed(decision, 1)).toMatchObject({
      type: "decision.confirmed",
      targetID: "D1",
      at: 1,
      decision: { id: "D1", statement: "Keep one panel" },
    })
    expect(decisionRejected(decision, 1)).toMatchObject({ type: "decision.rejected", targetID: "D1" })
    expect(decisionDeferred(decision, 1)).toMatchObject({ type: "decision.deferred", targetID: "D1" })
    expect(decisionSuperseded(decision, "D2", 1)).toMatchObject({
      type: "decision.superseded",
      targetID: "D1",
      supersededBy: "D2",
      decision: { id: "D1" },
    })
  })

  test("migrates an older log without losing its events", () => {
    const event = decisionConfirmed(decision, 1)
    const migrated = migrateCommitmentLog({ schemaVersion: 0, events: [event] })

    expect(migrated.schemaVersion).toBe(1)
    expect(migrated.events).toEqual([event])

    const current = { schemaVersion: 1, events: [event] }
    expect(migrateCommitmentLog(current)).toBe(current)
  })

  test("round-trips the snapshot through the store schema", () => {
    const log = { schemaVersion: 1, events: [decisionConfirmed(decision, 1)] }
    const decoded = Schema.decodeUnknownSync(CommitmentLogSchema)(JSON.parse(JSON.stringify(log)))

    expect(decoded.events[0]?.decision?.id).toBe("D1")
    expect(decoded.events[0]?.decision?.statement).toBe("Keep one panel")
  })

  test("promotes an action into an authoritative decision", () => {
    const event = decisionPromoted(action, 1)

    expect(event).toMatchObject({
      type: "decision.promoted",
      targetID: "promoted-A1",
      actionID: "A1",
      decision: {
        id: "promoted-A1",
        status: "active",
        authority: "user",
        statement: "Change panel.tsx",
      },
    })
  })

  test("records manual links", () => {
    expect(actionLinked("A1", { goalID: "G1" }, 1)).toMatchObject({
      type: "action.linked",
      targetID: "A1",
      goalID: "G1",
    })
    expect(actionLinked("A1", { decisionID: "D1" }, 1)).toMatchObject({ decisionID: "D1" })
  })
})
