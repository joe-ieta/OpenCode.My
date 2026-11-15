import fs from "node:fs/promises"
import path from "node:path"
import { expect } from "bun:test"
import { Config } from "@opencode/core/config"
import { Generate } from "@opencode/core/generate"
import { makeLocationNode } from "@opencode/util/effect/app-node"
import { Effect, Layer, Predicate } from "effect"
import { tmpdir } from "../../core/test/fixture/tmpdir"
import { it } from "../../core/test/lib/effect"
import { ServerFetch } from "../src/fetch"
import { startServer } from "./fixture/server"

const generate = makeLocationNode({
  service: Generate.Service,
  layer: Layer.effect(
    Generate.Service,
    Effect.gen(function* () {
      const config = yield* Config.Service
      return Generate.Service.of({
        text: () =>
          config.entries().pipe(
            Effect.map((entries) =>
              JSON.stringify({
                model: Config.latest(entries, "model"),
              }),
            ),
          ),
        image: () => Effect.die("unused"),
        decisions: () => Effect.die("unused"),
      })
    }),
  ),
  deps: [Config.node],
})

it.live("uses base configuration without depending on process.cwd()", () =>
  Effect.gen(function* () {
    const tmp = yield* Effect.acquireDisposable(Effect.promise(() => tmpdir("opencode-generate-endpoint-")))
    const global = path.join(tmp.path, "global")
    const project = path.join(tmp.path, "project")
    yield* Effect.promise(() => Promise.all([fs.mkdir(global), fs.mkdir(project)]))
    yield* Effect.promise(() =>
      Promise.all([
        fs.writeFile(path.join(global, "opencode.json"), JSON.stringify({ model: "base/default" })),
        fs.writeFile(path.join(project, "opencode.json"), JSON.stringify({ model: "project/default" })),
      ]),
    )
    const handler = yield* ServerFetch.make(
      {
        database: { path: ":memory:" },
        config: { directory: global },
        fs: { filewatcher: false },
        models: { fetch: false },
      },
      { overrides: [Generate.node.replace(generate)] },
    )

    expect(global).not.toBe(process.cwd())
    expect(yield* request(handler, new URL("http://opencode.local/api/experimental/generate/text"))).toEqual({
      model: { providerID: "base", model: "default" },
    })

    const legacy = new URL("http://opencode.local/api/experimental/generate/text")
    legacy.searchParams.set("location[directory]", project)
    expect(yield* request(handler, legacy)).toEqual({
      model: { providerID: "base", model: "default" },
    })

    const deprecatedPath = new URL("http://opencode.local/api/experimental/generate")
    expect(yield* request(handler, deprecatedPath)).toEqual({
      model: { providerID: "base", model: "default" },
    })
  }),
)

it.live("rejects unknown image and decision models and duplicate question names", () =>
  Effect.gen(function* () {
    const tmp = yield* Effect.acquireDisposable(Effect.promise(() => tmpdir("opencode-generate-media-")))
    const handler = yield* ServerFetch.make({
      database: { path: ":memory:" },
      config: { directory: tmp.path },
      fs: { filewatcher: false },
      models: { fetch: false },
    })
    const model = { providerID: "nowhere", id: "nothing" }
    const question = { type: "predicate", name: "refund", instructions: "Is this a refund request?" }
    const post = (path: string, body: unknown) =>
      Effect.promise(() =>
        handler(
          new Request(`http://opencode.local/api/experimental/generate/${path}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          }),
        ),
      )
    for (const [path, body] of [
      ["image", { model, prompt: "a red square" }],
      ["decisions", { model, input: [{ type: "text", text: "I was charged twice." }], questions: [question] }],
    ] as const) {
      const response = yield* post(path, body)
      expect(response.status).toBe(404)
      expect(yield* Effect.promise(() => response.json())).toMatchObject({ _tag: "ModelNotFoundError" })
    }
    const duplicate = yield* post("decisions", { model, input: [], questions: [question, question] })
    expect(duplicate.status).toBe(400)
  }),
)

it.live("tests a saved model using its configured endpoint, request ID, and credential", () =>
  Effect.gen(function* () {
    const tmp = yield* Effect.acquireDisposable(Effect.promise(() => tmpdir("opencode-text-test-")))
    const calls: { path: string; authorization: string | null; body: unknown }[] = []
    const started = Promise.withResolvers<void>()
    const cancelled = Promise.withResolvers<void>()
    let reject = false
    let pending = false
    const gateway = yield* Effect.acquireRelease(
      Effect.sync(() =>
        Bun.serve({
          hostname: "127.0.0.1",
          port: 0,
          async fetch(request) {
            const body: unknown = await request.json()
            calls.push({
              path: new URL(request.url).pathname,
              authorization: request.headers.get("authorization"),
              body,
            })
            if (reject) return Response.json({ error: { message: "synthetic-secret-in-error" } }, { status: 401 })
            if (pending)
              return new Response(
                new ReadableStream({
                  start(controller) {
                    controller.enqueue(
                      new TextEncoder().encode(
                        'data: {"choices":[{"index":0,"delta":{"content":"O"},"finish_reason":null}]}\n\n',
                      ),
                    )
                    started.resolve()
                  },
                  cancel: () => cancelled.resolve(),
                }),
                { headers: { "content-type": "text/event-stream" } },
              )
            return new Response(
              `data: ${JSON.stringify({
                id: "completion",
                object: "chat.completion.chunk",
                created: 1,
                model: "gateway-model",
                choices: [{ index: 0, delta: { content: "OK" }, finish_reason: "stop" }],
              })}\n\ndata: [DONE]\n\n`,
              { headers: { "content-type": "text/event-stream" } },
            )
          },
        }),
      ),
      (server) => Effect.promise(() => server.stop(true)),
    )
    const project = path.join(tmp.path, "project")
    yield* Effect.promise(async () => {
      await fs.mkdir(project)
      const provider = {
        name: "Saved gateway",
        package: "@opencode/ai/providers/openai-compatible",
        settings: { baseURL: new URL("nested/v1", gateway.url).href },
        models: { saved: { modelID: "gateway-model", name: "Saved model" } },
      }
      await Bun.write(path.join(tmp.path, "opencode.jsonc"), JSON.stringify({ providers: { fixture: provider } }))
      await Bun.write(path.join(project, "opencode.jsonc"), JSON.stringify({ providers: { project: provider } }))
    })
    const server = yield* startServer(tmp.path)
    yield* Effect.promise(async () => {
      const post = (url: string | URL, body: unknown, signal?: AbortSignal) =>
        fetch(new URL(url, server.base), {
          method: "POST",
          headers: { ...server.headers, "content-type": "application/json" },
          body: JSON.stringify(body),
          signal,
        })
      const key = await post("/api/credential", {
        integrationID: "fixture",
        value: { type: "key", key: "fixture-key" },
      })
      expect(key.status).toBe(200)
      const catalog = new URL("/api/model", server.base)
      catalog.searchParams.set("location[directory]", tmp.path)
      expect((await fetch(catalog, { headers: server.headers })).status).toBe(200)

      const url = new URL("/api/experimental/generate/test-text", server.base)
      url.searchParams.set("location[directory]", project)
      expect((await post(url, { model: { providerID: "project", id: "saved" } })).status).toBe(404)
      expect((await post(url, { model: { providerID: "fixture", id: "unsaved" } })).status).toBe(404)
      expect(calls).toHaveLength(0)

      const body = { model: { providerID: "fixture", id: "saved" } }
      reject = true
      const failure = await post(url, body)
      expect(failure.status).toBe(502)
      expect(await failure.json()).toMatchObject({
        reason: "authentication",
        message: "The provider rejected the saved credentials.",
      })
      expect(calls).toHaveLength(1)

      reject = false
      expect((await post(url, body)).status).toBe(204)
      expect(calls).toHaveLength(2)
      expect(calls[1]).toMatchObject({
        path: "/nested/v1/chat/completions",
        authorization: "Bearer fixture-key",
        body: {
          model: "gateway-model",
          messages: [{ role: "user", content: "Reply with just OK." }],
          max_completion_tokens: 32,
        },
      })

      pending = true
      const controller = new AbortController()
      const running = post(url, body, controller.signal)
      await started.promise
      controller.abort()
      await expect(running).rejects.toMatchObject({ name: "AbortError" })
      await cancelled.promise
      expect(calls).toHaveLength(3)
    })
  }),
)

function request(handler: (request: Request) => Promise<Response>, url: URL) {
  return Effect.promise(() =>
    handler(
      new Request(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: "hello" }),
      }),
    ).then(async (response) => {
      expect(response.status).toBe(200)
      const body: unknown = await response.json()
      if (!Predicate.isObject(body) || !Predicate.isObject(body.data) || typeof body.data.text !== "string")
        throw new Error("Expected a generate response")
      const result: unknown = JSON.parse(body.data.text)
      return result
    }),
  )
}
