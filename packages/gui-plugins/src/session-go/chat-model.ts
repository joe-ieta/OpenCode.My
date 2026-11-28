import { createMemo, createSignal, onCleanup } from "solid-js"
import { usePlugin, type MountedSession } from "@opencode/plugin/gui"
import { Model } from "@opencode/schema/model"
import { Provider } from "@opencode/schema/provider"
import { Money } from "@opencode/schema/money"
import { uuid } from "@opencode/util/uuid"
import type SessionGo from "./index"
import type { ChatTurn } from "./chat-schema"
import { chatPrompt, transitionChat, type ChatEvent, type ChatState } from "./chat-machine"

export function createGoChat(session: () => MountedSession) {
  const ctx = usePlugin<typeof SessionGo>()
  const store = () => ctx.stores.chat(session())
  const [state, setState] = createSignal<ChatState>({ status: "idle" })

  const modelInfo = createMemo(() => {
    const current = session()
    const ref = store().value?.model ?? current.server.data.session.get(current.id)?.model
    const location = { directory: current.directory }

    if (!ref) return

    const info = current.server.data.location.model
      .list(location)
      ?.find((model) => model.providerID === ref.providerID && model.id === ref.id)

    const provider = current.server.data.location.provider
      .list(location)
      ?.find((provider) => provider.id === ref.providerID)

    return {
      name: info?.name ?? ref.id,
      provider: provider?.name ?? ref.providerID,
      variant: ref.variant,
      context: info?.limit.context,
      reasoning: info
        ? info.compatibility?.reasoningField !== undefined || info.variants.some((variant) => variant.id !== "none")
        : undefined,
    }
  })

  const usage = createMemo(() =>
    (store().value?.turns ?? []).reduce(
      (total, turn) => ({
        input: total.input + (turn.tokens?.input ?? 0),
        output: total.output + (turn.tokens?.output ?? 0),
        reasoning: total.reasoning + (turn.tokens?.reasoning ?? 0),
        cache: total.cache + (turn.tokens?.cache.read ?? 0) + (turn.tokens?.cache.write ?? 0),
        cost: total.cost + (turn.cost ?? 0),
      }),
      { input: 0, output: 0, reasoning: 0, cache: 0, cost: 0 },
    ),
  )

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

            if (!item) return
            item.answer = answer
            item.tokens = reply.tokens
            item.cost = Money.USD.make(reply.cost)
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
    modelInfo,
    usage,
    selectedModel: () => store().value?.model,
    pickModel: async () => {
      const target = store()
      const current = target.value?.model
      const screen = ctx.screen.current()

      if (!target.ready() || busy() || !screen) return

      const selected = await screen.composer.pickModel({
        current: current
          ? { providerID: current.providerID, modelID: current.id, variant: current.variant }
          : undefined,
        defaultLabel: ctx.t("chat.follow"),
      })

      if (selected === undefined || state().status === "disposed") return
      target.update((draft) => {
        if (selected === null) {
          delete draft.model

          return
        }

        draft.model = { providerID: Provider.ID.make(selected.providerID), id: Model.ID.make(selected.modelID) }

        if (selected.variant !== undefined) draft.model.variant = Model.VariantID.make(selected.variant)
      })
    },
    canClear: () => store().ready() && (!!store().value?.turns.length || !!store().value?.draft || busy()),
    clear: () => {
      if (!store().ready()) return
      dispatch({ type: "cancelled" })
      store().update((draft) => {
        draft.turns = []
        draft.draft = ""
      })
    },
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
