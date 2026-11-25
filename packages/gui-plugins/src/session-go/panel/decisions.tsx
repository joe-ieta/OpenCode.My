import { For, Show, createSignal } from "solid-js"
import { Button } from "@opencode/ui/button"
import { usePlugin } from "@opencode/plugin/gui"
import type SessionGo from "../index"
import type { ActionNode, DecisionNode, SourceRef } from "../types"
import { DecisionControls } from "./controls"
import {
  authorityKeys,
  canSupersede,
  decisionFilterKeys,
  decisionFilters,
  decisionKindKeys,
  decisionMatches,
  decisionStatusKeys,
  type DecisionFilter,
} from "./filters"
import { SourceButton } from "./format"
import { EmptyCard, Section } from "./section"

export function DecisionsSection(props: {
  decisions: readonly DecisionNode[]
  filter: DecisionFilter
  onFilter: (filter: DecisionFilter) => void
  selected: string | undefined
  onSelect: (id: string) => void
  disabled?: boolean
  onConfirm: (id: string) => void
  onReject: (id: string) => void
  onDefer: (id: string) => void
  onSupersede: (id: string, supersededBy: string) => void
  onEdit: (id: string) => void
  onOpenSource: (source: SourceRef) => void
  relatedActions: (id: string) => readonly ActionNode[]
}) {
  const ctx = usePlugin<typeof SessionGo>()
  const [replacing, setReplacing] = createSignal<string>()
  const visible = () => props.decisions.filter((decision) => decisionMatches(decision, props.filter))

  const replacements = (decision: DecisionNode) =>
    props.decisions.filter(
      (item) => item.id !== decision.id && item.status !== "dropped" && item.status !== "superseded",
    )

  const relatedLabel = (actions: readonly ActionNode[]) => {
    if (actions.length === 0) return

    const names = actions
      .slice(0, 2)
      .map((action) => action.summary)
      .join(" · ")

    return actions.length > 2 ? `${names} +${actions.length - 2}` : names
  }

  return (
    <Section section="decisions" title={ctx.t("section.decisions")}>
      <div class="flex flex-col gap-2">
        <div class="flex flex-wrap gap-1" role="group" aria-label={ctx.t("section.decisions")}>
          <For each={decisionFilters}>
            {(filter) => (
              <Button
                size="small"
                variant={props.filter === filter ? "ghost" : "ghost-muted"}
                data-state={props.filter === filter ? "pressed" : undefined}
                aria-pressed={props.filter === filter}
                class="h-7 rounded-full px-2.5 text-12-regular"
                onClick={() => props.onFilter(filter)}
              >
                {ctx.t(decisionFilterKeys[filter])}
              </Button>
            )}
          </For>
        </div>

        <Show
          when={visible().length > 0}
          fallback={
            <EmptyCard title={ctx.t("decision.empty")} description={ctx.t("decision.empty.description")} />
          }
        >
          <div class="flex flex-col gap-2">
            <For each={visible()}>
              {(decision) => {
                const related = () => props.relatedActions(decision.id)
                const alternatives = () => replacements(decision)
                const mayReplace = () => canSupersede(decision) && alternatives().length > 0

                return (
                  <div
                    class="flex flex-col gap-2 rounded-lg border px-3 py-3"
                    classList={{
                      "border-border-focus": props.selected === decision.id,
                      "border-border-muted": props.selected !== decision.id,
                    }}
                    data-decision={decision.id}
                    data-selected={props.selected === decision.id ? "" : undefined}
                    onClick={() => props.onSelect(decision.id)}
                  >
                    <div class="flex flex-wrap items-center gap-1.5">
                      <span class="rounded-full border border-border-muted px-2 py-0.5 text-11-regular text-text-weak">
                        {ctx.t(decision.deferred ? "status.deferred" : decisionStatusKeys[decision.status])}
                      </span>
                      <span class="rounded-full bg-background-stronger px-2 py-0.5 text-11-regular text-text-weak">
                        {ctx.t(authorityKeys[decision.authority])}
                      </span>
                      <span class="rounded-full border border-border-muted px-2 py-0.5 text-11-regular text-text-faint">
                        {ctx.t(decisionKindKeys[decision.kind])}
                      </span>
                      <Show when={decision.rule?.startsWith("l2.")}>
                        <span class="rounded-full bg-background-stronger px-2 py-0.5 text-11-regular text-text-weak">
                          {ctx.t("decision.l2")}
                        </span>
                      </Show>
                      <span class="ms-auto">
                        <SourceButton source={decision.source} onReveal={props.onOpenSource} />
                      </span>
                    </div>

                    <p class="text-13-medium text-text-strong">{decision.statement}</p>

                    <Show when={decision.rationale}>
                      {(rationale) => (
                        <div class="flex flex-col gap-0.5">
                          <div class="text-11-regular text-text-faint">{ctx.t("decision.rationale")}</div>
                          <p class="text-12-regular text-text-weak">{rationale()}</p>
                        </div>
                      )}
                    </Show>

                    <Show when={decision.alternatives?.length}>
                      <div class="flex flex-col gap-0.5">
                        <div class="text-11-regular text-text-faint">{ctx.t("decision.alternatives")}</div>
                        <ul class="flex flex-col gap-0.5">
                          <For each={decision.alternatives}>
                            {(alternative) => (
                              <li class="text-12-regular text-text-weak">· {alternative}</li>
                            )}
                          </For>
                        </ul>
                      </div>
                    </Show>

                    <Show when={related().length > 0}>
                      <div class="text-11-regular text-text-faint">
                        {ctx.t("decision.linkedActions")}: {relatedLabel(related())}
                      </div>
                    </Show>

                    <div class="flex flex-wrap items-center gap-1" onClick={(event) => event.stopPropagation()}>
                      <DecisionControls
                        decision={decision}
                        canSupersede={mayReplace()}
                        disabled={props.disabled}
                        onConfirm={props.onConfirm}
                        onReject={props.onReject}
                        onDefer={props.onDefer}
                        onSupersede={setReplacing}
                        onEdit={props.onEdit}
                        onOpenSource={() => props.onOpenSource(decision.source)}
                      />
                    </div>

                    <Show when={replacing() === decision.id}>
                      <div
                        class="flex flex-col gap-1 rounded-md border border-border-focus bg-background-stronger px-2.5 py-2"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div class="text-11-regular text-text-faint">{ctx.t("decision.supersede.hint")}</div>
                        <For each={alternatives()}>
                          {(replacement) => (
                            <Button
                              size="small"
                              variant="ghost-muted"
                              class="h-auto justify-start whitespace-normal text-left"
                              onClick={() => {
                                props.onSupersede(decision.id, replacement.id)
                                setReplacing(undefined)
                              }}
                            >
                              {replacement.statement}
                            </Button>
                          )}
                        </For>
                        <Button
                          size="small"
                          variant="ghost-muted"
                          class="self-start"
                          onClick={() => setReplacing(undefined)}
                        >
                          {ctx.t("decision.supersede.cancel")}
                        </Button>
                      </div>
                    </Show>
                  </div>
                )
              }}
            </For>
          </div>
        </Show>
      </div>
    </Section>
  )
}
