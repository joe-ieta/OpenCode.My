import { describe, expect, test } from "bun:test"
import { Schema } from "effect"
import { CandidateCacheSchema } from "./model-schema"
import { CANDIDATE_SCHEMA_VERSION, MODEL_VERSION, RULE_VERSION } from "./schema"
import { sourceSignature } from "./session-signature"
import { buildCandidateCache, candidateCacheValid, graphFromCache } from "./store-candidate-cache"
import { assistant, text, user } from "./test-fixtures"

const messages = [
  user("msg_user", "Implement the panel.", 1),
  assistant("msg_agent", [text("Working on it")], { created: 2, completed: 3 }),
]

describe("candidate cache", () => {
  test("builds a versioned candidate snapshot", () => {
    const cache = buildCandidateCache({ sessionKey: "server\nses_1", messages }, 100)

    expect(cache.schemaVersion).toBe(CANDIDATE_SCHEMA_VERSION)
    expect(cache.ruleVersion).toBe(RULE_VERSION)
    expect(cache.modelVersion).toBe(MODEL_VERSION)
    expect(cache.sourceSignature).toBe(sourceSignature(messages))
    expect(cache.updatedAt).toBe(100)
    expect(cache.graph?.sessionKey).toBe("server\nses_1")
  })

  test("accepts only matching versions and source signature", () => {
    const cache = buildCandidateCache({ sessionKey: "server\nses_1", messages }, 100)
    const signature = sourceSignature(messages)

    expect(candidateCacheValid(cache, signature)).toBe(true)
    expect(candidateCacheValid({ ...cache, schemaVersion: 0 }, signature)).toBe(false)
    expect(candidateCacheValid({ ...cache, ruleVersion: 0 }, signature)).toBe(false)
    expect(candidateCacheValid({ ...cache, sourceSignature: "other" }, signature)).toBe(false)
    expect(candidateCacheValid({ ...cache, graph: undefined }, signature)).toBe(false)
    expect(graphFromCache(cache, signature)).toBe(cache.graph)
    expect(graphFromCache(cache, "other")).toBeUndefined()
  })

  test("fingerprints the project goal reference and applies it to the goal", () => {
    const project = { projectID: "proj_1", projectGoalID: "PG1", label: "Ship the semantic layer" }
    const cache = buildCandidateCache({ sessionKey: "server\nses_1", messages, project }, 100)

    expect(cache.sourceSignature).toBe(sourceSignature(messages, "proj_1:PG1"))
    expect(cache.graph?.goals[0]).toMatchObject({
      projectID: "proj_1",
      projectGoalID: "PG1",
    })
  })

  test("round-trips through the store schema", () => {
    const cache = buildCandidateCache({ sessionKey: "server\nses_1", messages }, 100)
    const decoded = Schema.decodeUnknownSync(CandidateCacheSchema)(JSON.parse(JSON.stringify(cache)))

    expect(decoded.sourceSignature).toBe(cache.sourceSignature)
    expect(decoded.graph?.decisions).toEqual(cache.graph?.decisions)
    expect(decoded.graph?.actions).toEqual(cache.graph?.actions)
  })

  test("the source signature follows text growth and idle markers", () => {
    const first = sourceSignature(messages)
    const grown = sourceSignature([messages[0]!, assistant("msg_agent", [text("Working on it, longer")], { created: 2, completed: 3 })])
    const idle = sourceSignature([...messages, { id: "msg_idle", type: "idle", outcome: "succeeded", time: { created: 4 } }])

    expect(grown).not.toBe(first)
    expect(idle).not.toBe(first)
  })
})
