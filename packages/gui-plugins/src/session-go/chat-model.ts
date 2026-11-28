import { createMemo, createSignal, onCleanup } from "solid-js"
import { usePlugin, type MountedSession } from "@opencode/plugin/gui"
import { Model } from "@opencode/schema/model"
import { Provider } from "@opencode/schema/provider"
import { uuid } from "@opencode/util/uuid"
import type SessionGo from "./index"
import type { ChatTurn } from "./chat-schema"
import { chatPrompt, transitionChat, type ChatEvent, type ChatState } from "./chat-machine"

export function createGoChat(session: () => MountedSession) {
  const ctx = usePlugin<typeof SessionGo>()
  const store = () => ctx.stores.chat(session())
  const [state, setState] = createSignal<ChatState>({ status: "idle" })

  const models = createMemo(() => {
    const current = session()
    const location = { directory: current.directory }
    const providers = current.server.data.location.provider.list(location)

    return (current.server.data.location.model.list(location) ?? [])
      .filter((model) => model.enabled && model.status !== "deprecated" && model.capabilities.output.includes("text"))
      .map((model) => ({
        ref: { providerID: Provider.ID.make(model.providerID), id: Model.ID.make(model.id) },
        name: model.name,
        provider: providers?.find((provider) => provider.id === model.providerID)?.name ?? model.providerID,
      }))
  })

  // Resource handles only; the machine owns request identity and every terminal state.
  const requests = new Map<string, { controller: AbortController; timer: ReturnType<typeof setTimeout> }>()

  const dispatch = (event: ChatEvent) => {
    const previous = state()
    const next = transitionChat(previous, event)

    if (next === previous) return false
    setState(next)

    if (previous.status === "running") {
      const request = requests.get(previous.id)
      requests.delete(previous.id)

      if (request) {
        clearTimeout(request.timer)

        if (event.type !== "succeeded") request.controller.abort()
      }
    }

    return true
  }

  const generate = (turn: ChatTurn) => {
    const id = uuid()

    if (!dispatch({ type: "requested", id, turn: turn.id })) return
    const target = session()
    const saved = ctx.stores.chat(target)
    const controller = new AbortController()
    requests.set(id, {
      controller,
      timer: setTimeout(() => dispatch({ type: "failed", id, reason: "timeout" }), 300_000),
    })
    target.server.client.session
      .generate(
        {
          sessionID: target.id,
          prompt: chatPrompt(saved.value?.turns ?? [], turn.question),
          experimental: saved.value?.model ? { model: saved.value.model } : undefined,
        },
        { signal: AbortSignal.any([ctx.signal, controller.signal]) },
      )
      .then(
        (reply) => {
          const answer = reply.text.trim()

          if (!answer) {
            dispatch({ type: "failed", id, reason: "empty" })

            return
          }

          if (!dispatch({ type: "succeeded", id })) return
          saved.update((draft) => {
            const item = draft.turns.find((item) => item.id === turn.id)

            if (item) item.answer = answer
          })
        },
        (cause) =>
          dispatch({
            type: "failed",
            id,
            reason: "error",
            message: cause instanceof Error ? cause.message : String(cause),
          }),
      )
  }

  const busy = () => state().status === "running"
  const pending = () => store().value?.turns.find((turn) => turn.answer === undefined)

  const cancel = () => {
    const turn = pending()

    if (!turn) return
    dispatch({ type: "cancelled" })
    store().update((draft) => {
      draft.draft = turn.question
      draft.turns = draft.turns.filter((item) => item.id !== turn.id)
    })
  }

  onCleanup(() => dispatch({ type: "disposed" }))

  return {
    ready: () => store().ready(),
    models,
    selectedModel: () => store().value?.model,
    setModel: (model: Model.Ref | undefined) =>
      store().update((draft) => {
        if (!model) {
          delete draft.model

          return
        }

        draft.model = model
      }),
    turns: () => store().value?.turns ?? [],
    draft: () => store().value?.draft ?? "",
    setDraft: (value: string) =>
      store().update((draft) => {
        draft.draft = value
      }),
    busy,
    canSend: () => store().ready() && !busy() && !pending() && !!store().value?.draft.trim(),
    running: (id: string) => {
      const current = state()

      return current.status === "running" && current.turn === id
    },
    failure: (id: string) => {
      const current = state()

      if (current.status === "failed" && current.turn === id) {
        if (current.reason === "error") return current.message ?? ctx.t("chat.error")

        return ctx.t(current.reason === "empty" ? "chat.emptyAnswer" : "chat.timeout")
      }

      return ctx.t("chat.interrupted")
    },
    send: () => {
      if (!store().ready() || busy() || pending()) return
      const question = store().value?.draft.trim()

      if (!question) return
      const turn = { id: uuid(), question }
      store().update((draft) => {
        draft.draft = ""
        draft.turns.push(turn)
      })
      generate(turn)
    },
    retry: () => {
      if (!store().ready() || busy()) return
      const turn = pending()

      if (turn) generate(turn)
    },
    cancel,
  }
}

export type GoChatModel = ReturnType<typeof createGoChat>
