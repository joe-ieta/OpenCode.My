import { createMemo, createSignal, Index, onCleanup, onMount, Show } from "solid-js"
import { Icon } from "@opencode/ui/icon"
import { Loader } from "@opencode/ui/loader"
import { usePlugin } from "@opencode/plugin/gui"
import type SessionGo from "../index"
import type { HistoryStatus, HistoryTurn } from "./history"
import { formatTurnDuration, turnTimeFormat } from "./turn-format"

const PREVIEW_MARGIN = 64

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/**
 * A vertical turn navigator. The track is divided into one equal segment per turn, each segment
 * selects its turn, and the previous and next buttons step the blue selection marker through them.
 */
export function TimelineRail(props: {
  turns: readonly HistoryTurn[]
  active?: string
  status: HistoryStatus
  error?: string
  durationPending?: boolean
  onRetry: () => void
  onSelect: (messageID: string) => void
  chat?: { opened: boolean; toggle: () => void }
}) {
  const ctx = usePlugin<typeof SessionGo>()
  const [height, setHeight] = createSignal(0)
  const [hoverIndex, setHoverIndex] = createSignal<number>()
  const [focused, setFocused] = createSignal(false)
  let slider: HTMLDivElement | undefined
  let observer: ResizeObserver | undefined

  const activeIndex = createMemo(() => {
    const index = props.turns.findIndex((turn) => turn.id === props.active)

    return index >= 0 ? index : Math.max(0, props.turns.length - 1)
  })

  const previewIndex = createMemo(() => hoverIndex() ?? (focused() ? activeIndex() : undefined))

  const previewTurn = createMemo(() => {
    const index = previewIndex()

    return index === undefined ? undefined : props.turns[index]
  })

  const previewTop = () => {
    const index = previewIndex()

    if (index === undefined || props.turns.length === 0) return 0

    const center = ((index + 0.5) / props.turns.length) * height()

    return clamp(center, PREVIEW_MARGIN, Math.max(PREVIEW_MARGIN, height() - PREVIEW_MARGIN))
  }

  const thumbTop = () => {
    const count = props.turns.length

    return count === 0 ? 0 : ((activeIndex() + 0.5) / count) * 100
  }

  const select = (index: number) => {
    const turn = props.turns[index]

    if (turn) props.onSelect(turn.id)
  }

  const durationLabel = (turn: HistoryTurn) =>
    turn.durationMs === undefined
      ? ctx.t(props.durationPending ? "timeline.durationLoading" : "timeline.durationUnknown")
      : ctx.t("timeline.duration", { duration: formatTurnDuration(turn.durationMs) })

  const move = (index: number, focus: boolean) => {
    const count = props.turns.length

    if (count === 0) return

    const target = clamp(index, 0, count - 1)

    select(target)

    if (!focus) return

    // Roving focus keeps one tab stop while arrow keys move the selection.
    slider
      ?.querySelectorAll<HTMLButtonElement>('[data-slot="timeline-segment"]')
      [target]?.focus({ preventScroll: true })
  }

  const step = (offset: number) => move(activeIndex() + offset, false)

  const key = (event: KeyboardEvent, index: number) => {
    const count = props.turns.length

    if (count === 0) return

    const next =
      event.key === "ArrowUp" || event.key === "ArrowLeft"
        ? index - 1
        : event.key === "ArrowDown" || event.key === "ArrowRight"
          ? index + 1
          : event.key === "PageUp"
            ? index - 10
            : event.key === "PageDown"
              ? index + 10
              : event.key === "Home"
                ? 0
                : event.key === "End"
                  ? count - 1
                  : undefined

    if (next === undefined) return

    event.preventDefault()
    setHoverIndex(undefined)
    move(next, true)
  }

  onMount(() => {
    if (!slider) return

    const measure = () => setHeight(slider?.clientHeight ?? 0)

    measure()
    observer = new ResizeObserver(measure)
    observer.observe(slider)
  })

  onCleanup(() => observer?.disconnect())

  return (
    // No horizontal padding: each segment's hover bed spans the whole rail width.
    <div
      data-component="session-go-timeline"
      class="relative flex shrink-0 flex-col gap-0.5 border-s border-border-base bg-background-base py-1"
      classList={{ "w-9": !!props.chat, "w-6": !props.chat }}
    >
      <Show when={props.chat}>
        {(chat) => (
          <button
            type="button"
            data-slot="session-go-chat-toggle"
            aria-label={ctx.t(chat().opened ? "chat.close" : "chat.open")}
            aria-expanded={chat().opened}
            class="mx-auto my-1 flex size-7 shrink-0 items-center justify-center rounded-md border border-border-muted text-12-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-border-focus"
            onClick={() => chat().toggle()}
          >
            {ctx.t("chat.trigger")}
          </button>
        )}
      </Show>
      <button
        type="button"
        data-slot="timeline-prev"
        aria-label={ctx.t("timeline.previousTurn")}
        disabled={props.turns.length === 0 || activeIndex() <= 0}
        class="flex h-4 w-full shrink-0 items-center justify-center rounded-[3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-border-focus disabled:pointer-events-none disabled:opacity-40"
        onClick={() => step(-1)}
      >
        <Icon name="chevron-down" class="rotate-180" />
      </button>
      <div
        ref={(element) => (slider = element)}
        data-slot="timeline-slider"
        role="group"
        aria-label={ctx.t("timeline.title")}
        aria-busy={props.status === "loading" ? "true" : undefined}
        class="relative flex min-h-0 w-full flex-1 flex-col"
        style={`--turn-count:${props.turns.length}`}
        onPointerLeave={() => setHoverIndex(undefined)}
      >
        <Index each={props.turns}>
          {(_turn, index) => (
            <button
              type="button"
              data-slot="timeline-segment"
              data-turn={index + 1}
              data-current={index === activeIndex() ? "" : undefined}
              aria-label={ctx.t("timeline.turn", { index: index + 1 })}
              aria-current={index === activeIndex() ? "true" : undefined}
              tabIndex={index === activeIndex() ? 0 : -1}
              class="session-go-timeline-segment relative flex min-h-0 w-full flex-1 items-center justify-center"
              onClick={() => select(index)}
              onPointerEnter={() => setHoverIndex(index)}
              onFocus={() => {
                setHoverIndex(undefined)
                setFocused(true)
              }}
              onBlur={() => setFocused(false)}
              onKeyDown={(event) => key(event, index)}
            />
          )}
        </Index>
        <Show when={props.turns.length > 0}>
          <div
            data-slot="timeline-thumb"
            aria-hidden="true"
            class="pointer-events-none absolute left-1/2 z-[1] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ top: `${thumbTop()}%` }}
          />
        </Show>
        <Show when={previewTurn()}>
          {(turn) => (
            <div
              data-slot="timeline-preview"
              aria-hidden="true"
              class="pointer-events-none absolute z-10 flex w-56 -translate-y-1/2 flex-col gap-1 rounded-lg border border-border-base p-2.5"
              style={{ top: `${previewTop()}px` }}
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-11-regular text-text-faint">
                  {ctx.t("timeline.turn", { index: (previewIndex() ?? 0) + 1 })}
                </span>
                <span class="text-11-regular text-text-faint">{turnTimeFormat.format(turn().createdAt)}</span>
              </div>
              <p class="line-clamp-3 whitespace-pre-wrap break-words text-12-regular text-text-strong">{turn().text}</p>
              <span class="text-11-regular text-text-faint">{durationLabel(turn())}</span>
            </div>
          )}
        </Show>
      </div>
      <button
        type="button"
        data-slot="timeline-next"
        aria-label={ctx.t("timeline.nextTurn")}
        disabled={props.turns.length === 0 || activeIndex() >= props.turns.length - 1}
        class="flex h-4 w-full shrink-0 items-center justify-center rounded-[3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-border-focus disabled:pointer-events-none disabled:opacity-40"
        onClick={() => step(1)}
      >
        <Icon name="chevron-down" />
      </button>
      <Show when={props.status === "loading"}>
        <div
          data-slot="timeline-loading"
          role="status"
          aria-label={ctx.t("timeline.loading")}
          class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        >
          <Loader class="size-4" />
        </div>
      </Show>
      <Show when={props.status === "error"}>
        <div
          class="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center"
          style={{ top: props.chat ? "38px" : "0" }}
        >
          <button
            type="button"
            data-slot="timeline-retry"
            aria-label={ctx.t("timeline.retry")}
            title={props.error}
            class="flex size-5 items-center justify-center rounded-[3px] text-text-faint hover:bg-background-stronger hover:text-text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-border-focus"
            onClick={props.onRetry}
          >
            <Icon name="reset" class="size-3" />
          </button>
        </div>
      </Show>
    </div>
  )
}
