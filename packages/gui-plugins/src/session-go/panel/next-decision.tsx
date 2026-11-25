import { For, Show } from "solid-js"
import { Button } from "@opencode/ui/button"
import { usePlugin } from "@opencode/plugin/gui"
import type SessionGo from "../index"
import type { NextDecision, SourceRef } from "../types"
import { nextKindKeys, nextWhyKeys } from "./filters"
import { EmptyCard, Section } from "./section"

export function NextDecisionSection(props: {
  items: NextDecision[]
  disabled?: boolean
  onConfirm: (decisionID: string) => void
  onReject: (decisionID: string) => void
  onDefer: (decisionID: string) => void
  onSelectDecision: (decisionID: string) => void
  onReveal: (source: SourceRef) => void
}) {
  const ctx = usePlugin<typeof SessionGo>()
  const top = () => props.items[0]
  const queue = () => props.items.slice(1, 7)
  const unavailable = () => (props.disabled ? ctx.t("settings.commitments.disabled") : undefined)

  return (
    <Section section="next" title={ctx.t("section.next")}>
      <Show
        when={top()}
        fallback={<EmptyCard title={ctx.t("next.empty")} description={ctx.t("next.empty.description")} />}
      >
        {(item) => (
          <div
            class="flex flex-col gap-3 rounded-lg border border-border-focus bg-background-base px-3 py-3"
            data-next={item().id}
          >
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="rounded-full bg-background-stronger px-2 py-0.5 text-11-regular text-text-weak">
                {ctx.t(nextKindKeys[item().kind])}
              </span>
              <span class="rounded-full border border-border-muted px-2 py-0.5 text-11-regular text-text-faint">
                {ctx.t("next.priority", { priority: item().priority + 1 })}
              </span>
            </div>

            <p class="text-13-medium text-text-strong">{item().question}</p>
            <p class="text-12-regular text-text-weak">{ctx.t(nextWhyKeys[item().kind])}</p>

            <Show when={item().impact}>
              {(impact) => <p class="text-11-regular text-text-faint">{impact()}</p>}
            </Show>

            <Show
              when={item().kind === "conflict"}
              fallback={
                <div class="flex flex-wrap items-center gap-1">
                  <Show when={item().decisionID}>
                    {(decisionID) => (
                      <>
                        <Button
                          size="small"
                          variant="contrast"
                          disabled={props.disabled}
                          title={unavailable()}
                          onClick={() => props.onConfirm(decisionID())}
                        >
                          {ctx.t("decision.confirm")}
                        </Button>
                        <Button
                          size="small"
                          variant="ghost-muted"
                          disabled={props.disabled}
                          title={unavailable()}
                          onClick={() => props.onDefer(decisionID())}
                        >
                          {ctx.t("decision.defer")}
                        </Button>
                        <Button
                          size="small"
                          variant="ghost-muted"
                          onClick={() => props.onSelectDecision(decisionID())}
                        >
                          {ctx.t("next.showInLedger")}
                        </Button>
                      </>
                    )}
                  </Show>
                  <Button size="small" variant="ghost-muted" onClick={() => props.onReveal(item().source)}>
                    {ctx.t("next.openSource")}
                  </Button>
                </div>
              }
            >
              <div class="flex flex-col gap-1">
                <For each={item().options}>
                  {(option) => (
                    <div class="flex items-start gap-2 rounded-md border border-border-muted px-2.5 py-2">
                      <span class="min-w-0 flex-1 text-12-regular text-text-weak">{option.label}</span>
                      <Button
                        size="small"
                        variant="ghost-muted"
                        disabled={props.disabled}
                        title={unavailable()}
                        onClick={() => props.onReject(option.id)}
                      >
                        {ctx.t("next.reject")}
                      </Button>
                    </div>
                  )}
                </For>
                <div class="flex flex-wrap items-center gap-1">
                  <Show when={item().decisionID}>
                    {(decisionID) => (
                      <Button
                        size="small"
                        variant="ghost-muted"
                        onClick={() => props.onSelectDecision(decisionID())}
                      >
                        {ctx.t("next.showInLedger")}
                      </Button>
                    )}
                  </Show>
                  <Button size="small" variant="ghost-muted" onClick={() => props.onReveal(item().source)}>
                    {ctx.t("next.openSource")}
                  </Button>
                </div>
              </div>
            </Show>

            <Show when={queue().length > 0}>
              <div class="flex flex-col gap-1">
                <div class="text-11-regular text-text-faint">{ctx.t("next.queue")}</div>
                <For each={queue()}>
                  {(next) => (
                    <div class="flex items-start gap-2 rounded-md border border-border-muted px-2.5 py-2">
                      <span class="shrink-0 text-11-regular text-text-faint">
                        {ctx.t("next.priority", { priority: next.priority + 1 })}
                      </span>
                      <span class="min-w-0 flex-1 text-12-regular text-text-weak">{next.question}</span>
                      <span class="shrink-0 text-11-regular text-text-faint">
                        {ctx.t(nextKindKeys[next.kind])}
                      </span>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        )}
      </Show>
    </Section>
  )
}
