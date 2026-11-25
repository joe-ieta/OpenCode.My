import { For, Show, createMemo, createSignal } from "solid-js"
import { Button } from "@opencode/ui/button"
import { Icon } from "@opencode/ui/icon"
import { TextInput } from "@opencode/ui/text-input"
import { usePlugin } from "@opencode/plugin/gui"
import type SessionGo from "../index"
import type { HistoryRow } from "../history-index"
import { searchHistory } from "../history-index"
import type { SourceRef } from "../types"
import type { HistoryStatus } from "./history"
import { EmptyCard, Section } from "./section"

const kindKeys: Record<HistoryRow["kind"], string> = {
  message: "search.kind.message",
  goal: "search.kind.goal",
  decision: "search.kind.decision",
  action: "search.kind.action",
  evidence: "search.kind.evidence",
}

export function SearchSection(props: {
  rows: readonly HistoryRow[]
  messageCount: number
  status: HistoryStatus
  progress: number
  complete: boolean
  error?: string
  hasHistory: boolean
  revealing: boolean
  onLoad: () => void
  onCancel: () => void
  onRetry: () => void
  onReveal: (source: SourceRef) => void
}) {
  const ctx = usePlugin<typeof SessionGo>()
  const [query, setQuery] = createSignal("")
  const results = createMemo(() => searchHistory(props.rows, query(), 20))
  const searching = () => query().trim().length >= 2

  return (
    <Section section="search" title={ctx.t("section.search")}>
      <div class="flex flex-col gap-2">
        <TextInput
          type="search"
          appearance="small"
          leadingIcon={<Icon name="search" />}
          showClearButton
          clearLabel={ctx.t("search.clear")}
          placeholder={ctx.t("search.placeholder")}
          value={query()}
          onInput={(event) => setQuery(event.currentTarget.value)}
          onClearClick={() => setQuery("")}
        />

        <div class="flex flex-wrap items-center gap-1.5 text-11-regular text-text-faint">
          <Show when={props.status === "loading"}>
            <span>{ctx.t("search.loading", { count: props.progress })}</span>
            <Button size="small" variant="ghost-muted" onClick={props.onCancel}>
              {ctx.t("search.cancel")}
            </Button>
          </Show>

          <Show when={props.status === "error"}>
            <span>{ctx.t("search.failed", { message: props.error ?? "" })}</span>
            <Button size="small" variant="ghost-muted" onClick={props.onRetry}>
              {ctx.t("search.retry")}
            </Button>
          </Show>

          <Show when={props.status !== "loading" && props.status !== "error"}>
            <Show
              when={props.hasHistory}
              fallback={
                <>
                  <span>{ctx.t("search.loadedScope")}</span>
                  <Button size="small" variant="ghost-muted" onClick={props.onLoad}>
                    {ctx.t("search.loadHistory")}
                  </Button>
                </>
              }
            >
              <span>
                {props.complete
                  ? ctx.t("search.history", { count: props.messageCount })
                  : ctx.t("search.historyPartial", { count: props.messageCount })}
              </span>
            </Show>
          </Show>
        </div>

        <Show
          when={searching()}
          fallback={<p class="text-11-regular text-text-faint">{ctx.t("search.hint")}</p>}
        >
          <Show
            when={results().length > 0}
            fallback={
              <EmptyCard title={ctx.t("search.empty")} description={ctx.t("search.empty.description")} />
            }
          >
            <div class="flex flex-col gap-1">
              <div class="text-11-regular text-text-faint">
                {ctx.t("search.results", { count: results().length })}
              </div>
              <For each={results()}>
                {(row) => (
                  <button
                    type="button"
                    class="flex w-full flex-col gap-1 rounded-md border border-border-muted px-2.5 py-2 text-left enabled:hover:bg-background-stronger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-border-focus disabled:opacity-60"
                    disabled={!row.source.messageID || props.revealing}
                    onClick={() => props.onReveal(row.source)}
                  >
                    <div class="flex min-w-0 items-center gap-1.5">
                      <span class="shrink-0 rounded-full bg-background-stronger px-1.5 py-0.5 text-11-regular text-text-weak">
                        {ctx.t(kindKeys[row.kind])}
                      </span>
                      <span class="min-w-0 flex-1 truncate text-12-medium text-text-strong">{row.title}</span>
                      <span class="shrink-0 text-11-regular text-text-faint">{ctx.t("search.reveal")}</span>
                    </div>
                    <span class="line-clamp-2 break-words text-11-regular text-text-weak">{row.text}</span>
                  </button>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </div>
    </Section>
  )
}
