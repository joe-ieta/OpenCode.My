import { describe, expect, test } from "bun:test"
import {
  runL2Analysis,
  modelRefFromMessages,
  promptTokens,
  L2InvalidOutputError,
} from "./l2-client"
import { sessionScope } from "./l2-triggers"
import type { SessionGraph } from "./types"
import { assistant, text, user } from "./test-fixtures"

const messages = [
  user("msg_user", "Use one side panel.", 1),
  assistant("msg_agent", [text("I suggest one panel.")], { created: 2, completed: 3 }),
]

const graph: SessionGraph = {
  sessionKey: "test",
  goals: [],
  decisions: [],
  actions: [],
  evidence: [],
  edges: [],
}

const usage = {
  tokens: { input: 120, output: 80, reasoning: 0, cache: { read: 0, write: 0 } },
  cost: 0.0042,
}

describe("modelRefFromMessages", () => {
  test("uses the newest assistant model", () => {
    const older = assistant("a1", [text("old")], { created: 1, completed: 2 })
    const newer = assistant("a2", [text("new")], { created: 3, completed: 4 })

    expect(modelRefFromMessages([older, newer])).toEqual({ providerID: "test", id: "test" })
    expect(modelRefFromMessages([user("u1", "hi")])).toBeUndefined()
  })
})

describe("promptTokens", () => {
  test("rounds a rough character estimate up", () => {
    expect(promptTokens("12345")).toBe(2)
    expect(promptTokens("")).toBe(0)
  })
})

describe("runL2Analysis", () => {
  const slice = sessionScope(messages)!

  test("returns a snapshot with model, scope, usage and validated candidates", async () => {
    let request: { sessionID: string; prompt: string } | undefined

    const snapshot = await runL2Analysis({
      sessionID: "ses_1",
      graph,
      messages: slice.messages,
      scope: slice.scope,
      trigger: "manual",
      model: { providerID: "opencode", id: "test" },
      modelName: "Test model",
      client: {
        text: async (input) => {
          request = input

          return {
            text: JSON.stringify({
              decisions: [{ statement: "Use one panel", sourceMessageIDs: ["msg_agent"] }],
            }),
            ...usage,
          }
        },
      },
      signal: new AbortController().signal,
      now: 100,
    })

    expect(request?.sessionID).toBe("ses_1")
    expect(request?.prompt).toContain("ALLOWED MESSAGE IDS")
    expect(snapshot).toMatchObject({
      trigger: "manual",
      promptVersion: 1,
      createdAt: 100,
      providerID: "opencode",
      modelID: "test",
      modelName: "Test model",
      cost: 0.0042,
      tokens: usage.tokens,
      scope: slice.scope,
      dropped: 0,
    })
    expect(snapshot.key.startsWith("l2-manual-")).toBe(true)
    expect(snapshot.decisions[0]).toMatchObject({ status: "proposed", authority: "inferred" })
  })

  test("rejects output without a valid JSON shape", async () => {
    await expect(
      runL2Analysis({
        sessionID: "ses_1",
        graph,
        messages: slice.messages,
        scope: slice.scope,
        trigger: "manual",
        modelName: "Test model",
        client: { text: async () => ({ text: "I cannot help with that." }) },
        signal: new AbortController().signal,
      }),
    ).rejects.toBeInstanceOf(L2InvalidOutputError)
  })

  test("passes the abort signal through to the client", async () => {
    const controller = new AbortController()

    await expect(
      runL2Analysis({
        sessionID: "ses_1",
        graph,
        messages: slice.messages,
        scope: slice.scope,
        trigger: "episode",
        modelName: "Test model",
        client: {
          text: async (_input, options) => {
            expect(options?.signal).toBe(controller.signal)
            controller.abort()
            throw new Error("aborted")
          },
        },
        signal: controller.signal,
      }),
    ).rejects.toThrow("aborted")
  })
})
