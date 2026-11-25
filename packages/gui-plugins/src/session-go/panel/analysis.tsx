import { Show } from "solid-js"
import { Button } from "@opencode/ui/button"
import { useI18n } from "@opencode/ui/context/i18n"
import { usePlugin } from "@opencode/plugin/gui"
import type SessionGo from "../index"
import type { L2Snapshot, L2Scope } from "../types"
import type { L2Preview } from "./data"
import { Section } from "./section"

export function AnalysisSection(props: {
  preview: L2Preview | undefined
  enabled: boolean
  autoEnabled: boolean
  cacheEnabled: boolean
  status: "idle" | "running" | "error"
  error?: string
  last: L2Snapshot | undefined
  stale: boolean
  onAnalyze: () => void
  onCancel: () => void
  onOpenSettings: () => void
}) {
  const ctx = usePlugin<typeof SessionGo>()
  const i18n = useI18n()

  const usd = () =>
    new Intl.NumberFormat(i18n.locale(), { style: "currency", currency: "USD", maximumFractionDigits: 4 })

  const time = () => new Intl.DateTimeFormat(i18n.locale(), { timeStyle: "short" })

  const costLabel = (value: number | undefined) =>
    value === undefined
      ? ctx.t("analysis.costUnknown")
      : ctx.t("analysis.cost", { cost: usd().format(value) })

  const scope = (value: L2Scope) =>
    ctx.t(value.kind === "episode" ? "analysis.scope.episode" : "analysis.scope.session", {
      count: value.messageCount,
    })

  return (
    <Section section="analysis" title={ctx.t("section.analysis")}>
      <div class="flex flex-col gap-2 rounded-lg border border-border-muted px-3 py-3" data-analysis>
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="rounded-full bg-background-stronger px-2 py-0.5 text-11-regular text-text-weak">
            {ctx.t("analysis.badge")}
          </span>
          <span class="text-11-regular text-text-faint">{ctx.t("analysis.local")}</span>
        </div>

        <Show
          when={props.cacheEnabled && props.enabled}
          fallback={
            <div class="flex flex-col gap-2">
              <p class="text-12-regular text-text-weak">
                {props.cacheEnabled
                  ? ctx.t("analysis.disabled.model")
                  : ctx.t("analysis.disabled.cache")}
              </p>
              <Button
                size="small"
                variant="ghost-muted"
                class="self-start"
                onClick={props.onOpenSettings}
              >
                {ctx.t("analysis.openSettings")}
              </Button>
            </div>
          }
        >
          <Show
            when={props.preview}
            fallback={<p class="text-12-regular text-text-weak">{ctx.t("analysis.empty")}</p>}
          >
            {(preview) => (
              <>
                <div class="flex flex-wrap items-center gap-1.5 text-11-regular text-text-faint">
                  <span>{scope(preview().scope)}</span>
                  <span>·</span>
                  <span>{preview().modelName}</span>
                  <span>·</span>
                  <span>{ctx.t("analysis.promptTokens", { count: preview().promptTokens })}</span>
                  <span>·</span>
                  <span>{ctx.t("analysis.costReported")}</span>
                </div>

                <p class="text-11-regular text-text-faint">{ctx.t("analysis.note")}</p>
                <Show when={props.autoEnabled}>
                  <p class="text-11-regular text-text-faint">{ctx.t("analysis.auto")}</p>
                </Show>

                <div class="flex flex-wrap items-center gap-1">
                  <Show
                    when={props.status === "running"}
                    fallback={
                      <Button size="small" variant="contrast" onClick={props.onAnalyze}>
                        {ctx.t("analysis.run")}
                      </Button>
                    }
                  >
                    <Button size="small" variant="contrast" disabled>
                      {ctx.t("analysis.running")}
                    </Button>
                    <Button size="small" variant="ghost-muted" onClick={props.onCancel}>
                      {ctx.t("analysis.cancel")}
                    </Button>
                  </Show>
                </div>

                <Show when={props.status === "error"}>
                  <p class="break-words text-12-regular text-text-weak">
                    {ctx.t("analysis.failed", { message: props.error ?? "" })}
                  </p>
                </Show>
              </>
            )}
          </Show>
        </Show>

        <Show when={props.last}>
          {(last) => (
            <div class="flex flex-col gap-1 border-t border-border-muted pt-2" data-analysis-last>
              <div class="flex flex-wrap items-center gap-1.5 text-11-regular text-text-faint">
                <span>{ctx.t("analysis.last")}</span>
                <span>·</span>
                <span>{time().format(last().createdAt)}</span>
                <span>·</span>
                <span>{last().modelName}</span>
                <span>·</span>
                <span>{scope(last().scope)}</span>
                <span>·</span>
                <span>{costLabel(last().cost)}</span>
                <Show when={last().tokens}>
                  {(tokens) => (
                    <span>
                      {ctx.t("analysis.tokensUsed", {
                        input: tokens().input,
                        output: tokens().output,
                      })}
                    </span>
                  )}
                </Show>
                <span>·</span>
                <span>{ctx.t("analysis.candidates", { count: last().decisions.length })}</span>
              </div>
              <Show when={last().dropped > 0}>
                <p class="text-11-regular text-text-faint">
                  {ctx.t("analysis.dropped", { count: last().dropped })}
                </p>
              </Show>
              <Show when={props.stale}>
                <p class="text-11-regular text-text-faint">{ctx.t("analysis.stale")}</p>
              </Show>
            </div>
          )}
        </Show>
      </div>
    </Section>
  )
}
