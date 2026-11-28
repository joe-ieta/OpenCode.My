import { createMemo, For, onCleanup, Show } from "solid-js"
import { createKeyed, usePlugin } from "@opencode/plugin/gui"
import { Button } from "@opencode/ui/button"
import { Icon } from "@opencode/ui/icon"
import { IconButton } from "@opencode/ui/icon-button"
import { Loader } from "@opencode/ui/loader"
import { TextShimmer } from "@opencode/ui/text-shimmer"
import { Markdown } from "@opencode/session-ui/markdown"
import { showToast } from "@opencode/ui/toast"
import { Tooltip } from "@opencode/ui/tooltip"
import { useI18n } from "@opencode/ui/context/i18n"
import type SessionGo from "./index"
import type { GoChatModel } from "./chat-model"

export default function GoChatPanel(props: {
  model: GoChatModel
  visible: boolean
  maximized?: boolean
  onResize: () => void
  onClose: () => void
}) {
  const ctx = usePlugin<typeof SessionGo>()
  const i18n = useI18n()
  let scroller: HTMLDivElement | undefined
  let input: HTMLTextAreaElement | undefined

  const revision = createMemo(() =>
    props.model
      .turns()
      .map((turn) => `${turn.id}:${turn.answer?.length ?? 0}`)
      .join("\n"),
  )

  // Keep the local side conversation at its latest answer when it changes or is reopened.
  createKeyed(
    () => (props.visible ? revision() : undefined),
    (value) => {
      if (value === undefined) return
      const frame = requestAnimationFrame(() => scroller?.scrollTo({ top: scroller.scrollHeight }))
      onCleanup(() => cancelAnimationFrame(frame))
    },
  )

  const send = () => {
    if (!props.model.canSend()) return
    props.model.send()
  }

  const numbers = createMemo(() => new Intl.NumberFormat(i18n.locale()))

  const money = createMemo(
    () => new Intl.NumberFormat(i18n.locale(), { style: "currency", currency: "USD", maximumFractionDigits: 6 }),
  )

  const clear = async () => {
    const confirmed = await ctx.dialogs.confirm({
      title: ctx.t("chat.clearTitle"),
      description: ctx.t("chat.clearDescription"),
      confirm: ctx.t("chat.clear"),
      danger: true,
    })

    if (confirmed) props.model.clear()
  }

  const modelHint = () => (
    <div class="flex min-w-56 flex-col gap-1 text-12-regular">
      <p class="font-medium">{props.model.modelInfo()?.name ?? ctx.t("chat.modelUnknown")}</p>
      <Show when={!props.model.selectedModel()}>
        <p>{ctx.t("chat.follow")}</p>
      </Show>
      <Show when={props.model.modelInfo()}>
        {(info) => (
          <>
            <p>{info().provider}</p>
            <p>{ctx.t("chat.modelVariant", { variant: info().variant ?? ctx.t("common.default") })}</p>
            <p>
              {ctx.t("chat.reasoning", {
                value: ctx.t(
                  info().reasoning === undefined
                    ? "chat.unknown"
                    : info().reasoning
                      ? "chat.supported"
                      : "chat.notAdvertised",
                ),
              })}
            </p>
            <Show when={info().context}>
              {(context) => <p>{ctx.t("chat.contextLimit", { count: numbers().format(context()) })}</p>}
            </Show>
          </>
        )}
      </Show>
      <p class="mt-1 font-medium">{ctx.t("chat.usage")}</p>
      <p>
        {ctx.t("chat.usageTokens", {
          input: numbers().format(props.model.usage().input),
          output: numbers().format(props.model.usage().output),
          reasoning: numbers().format(props.model.usage().reasoning),
        })}
      </p>
      <p>{ctx.t("chat.usageCache", { count: numbers().format(props.model.usage().cache) })}</p>
      <p>{ctx.t("chat.usageCost", { cost: money().format(props.model.usage().cost) })}</p>
    </div>
  )

  return (
    <div class="flex h-full min-h-0 w-full flex-col bg-background-base" data-component="session-go-chat">
      <header class="flex min-h-12 shrink-0 items-center gap-2 border-b border-border-muted px-4 py-2">
        <Icon name="comment" class="text-text-weak" />
        <h2 class="text-14-medium text-text-strong">{ctx.t("chat.title")}</h2>
        <span class="text-11-regular text-text-faint">{ctx.t("chat.badge")}</span>
        <div class="ms-auto flex shrink-0 items-center gap-0.5">
          <Tooltip placement="bottom-end" value={modelHint()}>
            <IconButton
              variant="ghost-muted"
              size="normal"
              icon={<Icon name="models" />}
              aria-label={ctx.t("chat.modelSelect")}
              disabled={!props.model.ready() || props.model.busy()}
              onClick={() => void props.model.pickModel()}
            />
          </Tooltip>
          <Tooltip placement="bottom-end" value={ctx.t("chat.clear")}>
            <IconButton
              variant="ghost-muted"
              size="normal"
              icon={<Icon name="trash" />}
              aria-label={ctx.t("chat.clear")}
              disabled={!props.model.canClear()}
              onClick={() => void clear()}
            />
          </Tooltip>
          <Tooltip placement="bottom-end" value={ctx.t(props.maximized ? "chat.restore" : "chat.maximize")}>
            <IconButton
              variant="ghost-muted"
              size="normal"
              icon={<Icon name={props.maximized ? "collapse" : "expand"} />}
              aria-label={ctx.t(props.maximized ? "chat.restore" : "chat.maximize")}
              onClick={props.onResize}
            />
          </Tooltip>
          <IconButton
            variant="ghost-muted"
            size="normal"
            icon={<Icon name="minus" />}
            aria-label={ctx.t("chat.close")}
            onClick={props.onClose}
          />
        </div>
      </header>
      <p class="shrink-0 px-4 pt-3 text-11-regular text-text-faint">{ctx.t("chat.context")}</p>
      <div
        ref={(element) => (scroller = element)}
        class="min-h-0 flex-1 overflow-y-auto px-4 py-4"
        data-scrollable
        role="log"
        aria-label={ctx.t("chat.history")}
        aria-live="polite"
      >
        <Show when={props.model.ready()} fallback={<Loader class="mx-auto size-4" />}>
          <Show
            when={props.model.turns().length > 0}
            fallback={
              <div class="flex h-full min-h-40 flex-col items-center justify-center gap-3 text-center">
                <Icon name="comment" class="size-6 text-text-faint" />
                <h3 class="text-13-medium text-text-strong">{ctx.t("chat.empty")}</h3>
                <p class="text-12-regular text-text-weak">{ctx.t("chat.emptyDescription")}</p>
                <div class="flex flex-wrap justify-center gap-1.5">
                  <For each={["progress", "decisions"] as const}>
                    {(key) => (
                      <Button
                        size="small"
                        variant="outline"
                        onClick={() => {
                          props.model.setDraft(ctx.t(`chat.prompt.${key}`))
                          input?.focus({ preventScroll: true })
                        }}
                      >
                        {ctx.t(`chat.suggestion.${key}`)}
                      </Button>
                    )}
                  </For>
                </div>
              </div>
            }
          >
            <div class="flex flex-col gap-6">
              <For each={props.model.turns()}>
                {(turn) => (
                  <article class="flex min-w-0 flex-col gap-3">
                    <p
                      class="max-w-[96%] self-end whitespace-pre-wrap break-words rounded-lg bg-background-stronger px-3 py-2 text-13-regular text-text-strong"
                      dir="auto"
                    >
                      {turn.question}
                    </p>
                    <Show
                      when={turn.answer}
                      fallback={
                        <Show
                          when={props.model.running(turn.id)}
                          fallback={
                            <div role="alert" class="flex flex-col items-start gap-2">
                              <p class="text-12-regular text-text-weak">{props.model.failure(turn.id)}</p>
                              <div class="flex gap-1">
                                <Button size="small" variant="outline" onClick={props.model.retry}>
                                  {ctx.t("chat.retry")}
                                </Button>
                                <Button size="small" variant="ghost-muted" onClick={props.model.cancel}>
                                  {ctx.t("chat.edit")}
                                </Button>
                              </div>
                            </div>
                          }
                        >
                          <div role="status" class="text-13-regular text-text-weak">
                            <TextShimmer text={ctx.t("chat.working")} active />
                          </div>
                        </Show>
                      }
                    >
                      {(answer) => (
                        <div class="min-w-0">
                          <Markdown text={answer()} class="text-13-regular" />
                          <Button
                            size="small"
                            variant="ghost-muted"
                            class="mt-1"
                            onClick={() =>
                              void ctx.system
                                .copy(answer())
                                .catch(() => showToast({ title: ctx.t("common.requestFailed") }))
                            }
                          >
                            <Icon name="copy" />
                            {ctx.t("chat.copy")}
                          </Button>
                        </div>
                      )}
                    </Show>
                  </article>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </div>
      <div class="shrink-0 border-t border-border-muted p-3">
        <div class="rounded-lg border border-border-base bg-background-base focus-within:border-border-focus">
          <textarea
            ref={(element) => (input = element)}
            rows={2}
            value={props.model.draft()}
            disabled={!props.model.ready() || props.model.busy()}
            aria-label={ctx.t("chat.input")}
            placeholder={ctx.t("chat.placeholder")}
            class="block min-h-16 w-full resize-none border-0 bg-transparent px-3 pt-2.5 pb-1 text-13-regular text-text-strong outline-none placeholder:text-text-faint"
            onInput={(event) => props.model.setDraft(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.shiftKey || event.isComposing) return
              event.preventDefault()
              event.stopPropagation()
              send()
            }}
          />
          <div class="flex flex-wrap items-center justify-between gap-2 px-2 pb-2 ps-3">
            <span class="text-11-regular text-text-faint">{ctx.t("chat.keyboard")}</span>
            <Show
              when={props.model.busy()}
              fallback={
                <Button size="small" variant="contrast" disabled={!props.model.canSend()} onClick={send}>
                  {ctx.t("chat.send")}
                  <Icon name="arrow-up" />
                </Button>
              }
            >
              <Button size="small" variant="outline" onClick={props.model.cancel}>
                {ctx.t("chat.cancel")}
              </Button>
            </Show>
          </div>
        </div>
        <div class="mt-1.5 flex flex-wrap justify-between gap-1 text-11-regular text-text-faint">
          <span>{ctx.t("chat.private")}</span>
        </div>
      </div>
    </div>
  )
}
