import { expect } from "bun:test"
import { LanguageModel, LLMClient } from "../../ai/src/effect"
import { OpenAIChat } from "../../ai/src/protocols"
import { TestLLM } from "../../ai/src/testing"
import { llmClient } from "@opencode/core/effect/app-node-platform"
import { Session } from "@opencode/core/session"
import { SessionRunnerModel } from "@opencode/core/session/runner/model"
import { Location } from "@opencode/schema/location"
import { AbsolutePath } from "@opencode/schema/schema"
import { Context, Effect, Layer } from "effect"
import { tmpdirScoped } from "../../core/test/fixture/tmpdir"
import { it } from "../../core/test/lib/effect"
import { ServerFetch } from "../src/fetch"

it.live("overrides the generation model through HTTP without changing the Session model or messages", () =>
  Effect.gen(function* () {
    const directory = yield* tmpdirScoped()
    const llm = yield* TestLLM.Test.pipe(Effect.provide(TestLLM.testLayer()))
    const models = ["main", "side"].map((id) =>
      SessionRunnerModel.resolved(LanguageModel.make({ id, provider: "test", route: OpenAIChat.route }), {
        capabilities: { tools: true, input: ["text"], output: ["text"] },
        cost: [],
        limit: { context: 200_000, output: 8_192 },
      }),
    )
    const main = models[0]!
    const side = models[1]!
    const server = yield* ServerFetch.makeWithContext(
      { database: { path: ":memory:" }, fs: { filewatcher: false }, models: { fetch: false } },
      {
        overrides: [
          llmClient.replace(Layer.succeed(LLMClient.Service, llm)),
          SessionRunnerModel.node.replace(
            Layer.succeed(SessionRunnerModel.Service, {
              select: (session) => Effect.fail(new SessionRunnerModel.ModelNotSelectedError({ sessionID: session.id })),
              resolve: (session) => Effect.succeed(session.model?.id === side.ref.id ? side : main),
            }),
          ),
        ],
      },
    )
    const sessions = Context.get(server.context, Session.Service)
    const session = yield* sessions.create({
      model: main.ref,
      location: Location.Ref.make({ directory: AbsolutePath.make(directory.path) }),
    })
    const before = yield* sessions.messages({ sessionID: session.id })

    for (const selected of [undefined, side.ref, undefined]) {
      yield* llm.push(TestLLM.text("Private answer", "answer"))
      const response = yield* Effect.promise(() =>
        server.handler(
          new Request(`http://opencode.local/api/session/${session.id}/generate`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              prompt: "Private question",
              experimental: selected ? { model: selected } : undefined,
            }),
          }),
        ),
      )
      expect(response.status).toBe(200)
      expect(yield* Effect.promise(() => response.json())).toMatchObject({ data: { text: "Private answer" } })
      expect((yield* sessions.get(session.id)).model).toEqual(session.model)
      expect(yield* sessions.messages({ sessionID: session.id })).toEqual(before)
    }

    expect((yield* llm.requests()).map((request) => String(request.model.id))).toEqual(["main", "side", "main"])
  }).pipe(Effect.scoped),
)
