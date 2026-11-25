import { For, Show, createSignal } from "solid-js"
import { Button } from "@opencode/ui/button"
import { usePlugin } from "@opencode/plugin/gui"
import type SessionGo from "../index"
import type { ActionNode, DecisionNode, EvidenceNode, SourceRef } from "../types"
import { ActionControls } from "./controls"
import {
  actionFilterKeys,
  actionFilters,
  actionKindKeys,
  actionMatches,
  actionStatusKeys,
  actionViews,
  evidenceKindKeys,
  evidenceStatusKeys,
  type ActionFilter,
  type ActionView,
  type FactLink,
} from "./filters"
import { SourceButton } from "./format"
import { EmptyCard, Section } from "./section"

export function ActionsSection(props: {
  decisions: readonly DecisionNode[]
  actions: readonly ActionNode[]
  evidence: readonly EvidenceNode[]
  filter: ActionFilter
  onFilter: (filter: ActionFilter) => void
  view: ActionView
  onView: (view: ActionView) => void
  links: Record<string, FactLink | undefined>
  selectedDecision: string | undefined
  onSelectDecision: (id: string) => void
  disabled?: boolean
  hasGoal: boolean
  hasDecision: boolean
  promoted: (id: string) => boolean
  onPromote: (id: string) => void
  onLinkGoal: (id: string) => void
  onLinkDecision: (id: string) => void
  onReveal: (source: SourceRef) => void
}) {
  const ctx = usePlugin<typeof SessionGo>()
  const [expandedEvidence, setExpandedEvidence] = createSignal<ReadonlySet<string>>(new Set())
  const visible = () => props.actions.filter((action) => actionMatches(action, props.filter, props.links[action.id]))

  const evidenceOpened = (actionID: string) => expandedEvidence().has(actionID)

  const toggleEvidence = (actionID: string) =>
    setExpandedEvidence((current) => {
      const next = new Set(current)

      if (next.has(actionID)) next.delete(actionID)
      else next.add(actionID)

      return next
    })

  const evidenceFor = (action: ActionNode) =>
    props.evidence.filter((item) => item.source.actionID === action.id)

  const actionsFor = (decision: DecisionNode) =>
    visible().filter((action) => props.links[action.id]?.decision === decision.id)

  const groups = () =>
    props.decisions
      .map((decision) => ({ decision, actions: actionsFor(decision) }))
      .filter((group) => group.actions.length > 0)

  const unlinked = () => visible().filter((action) => props.links[action.id]?.decision === undefined)

  const card = (action: ActionNode) => {
    const link = () => props.links[action.id]
    const related = () => link()?.decision

    return (
      <div
        class="flex flex-col gap-2 rounded-lg border px-3 py-3"
        classList={{
          "border-border-focus": related() !== undefined && related() === props.selectedDecision,
          "border-border-muted": related() === undefined || related() !== props.selectedDecision,
        }}
        data-action={action.id}
        onClick={() => {
          const decision = related()

          if (decision) props.onSelectDecision(decision)
        }}
      >
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="rounded-full bg-background-stronger px-2 py-0.5 text-11-regular text-text-weak">
            {ctx.t(actionKindKeys[action.kind])}
          </span>
          <span class="rounded-full border border-border-muted px-2 py-0.5 text-11-regular text-text-weak">
            {ctx.t(actionStatusKeys[action.status])}
          </span>
          <Show when={related()}>
            {(decision) => (
              <span class="rounded-full border border-border-muted px-2 py-0.5 text-11-regular text-text-faint">
                {ctx.t("action.linkedDecision", { decision: decision() })}
              </span>
            )}
          </Show>
          <span class="ms-auto">
            <SourceButton source={action.source} onReveal={props.onReveal} />
          </span>
        </div>

        <p class="text-12-regular text-text-strong">{action.summary}</p>

        <Show when={action.files}>
          {(files) => (
            <div class="flex flex-wrap gap-1">
              <For each={files()}>
                {(file) => (
                  <span class="rounded bg-background-stronger px-1.5 py-0.5 font-mono text-11-regular text-text-weak">
                    {file}
                  </span>
                )}
              </For>
            </div>
          )}
        </Show>

        <Show when={evidenceFor(action).length > 0}>
          <div class="flex flex-col gap-1">
            <button
              type="button"
              data-evidence-toggle
              class="flex h-6 w-fit items-center gap-1 rounded-full border border-border-muted px-2 font-mono text-12-regular text-text-weak hover:bg-background-stronger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              classList={{ "bg-background-stronger text-text-strong": evidenceOpened(action.id) }}
              aria-label={ctx.t("action.evidence", { count: evidenceFor(action).length })}
              aria-expanded={evidenceOpened(action.id)}
              onClick={(event) => {
                event.stopPropagation()
                toggleEvidence(action.id)
              }}
            >
              <span aria-hidden="true">¶</span>
              <span>{evidenceFor(action).length}</span>
            </button>

            <Show when={evidenceOpened(action.id)}>
              <div class="flex flex-col gap-1">
                <For each={evidenceFor(action)}>
                  {(evidence) => (
                    <div class="flex flex-wrap items-center gap-1.5 text-11-regular text-text-weak">
                      <span class="rounded-full border border-border-muted px-1.5 py-0.5">
                        {ctx.t(evidenceKindKeys[evidence.kind])}
                      </span>
                      <span>{ctx.t(evidenceStatusKeys[evidence.status])}</span>
                      <span>·</span>
                      <span>{evidence.summary}</span>
                      <span class="ms-auto text-text-faint">
                        {evidence.stale ? ctx.t("evidence.stale") : ctx.t("evidence.fresh")}
                      </span>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </Show>

        <div class="flex flex-wrap items-center gap-1" onClick={(event) => event.stopPropagation()}>
          <ActionControls
            action={action}
            link={link()}
            promoted={props.promoted(action.id)}
            hasGoal={props.hasGoal}
            hasDecision={props.hasDecision}
            disabled={props.disabled}
            onPromote={props.onPromote}
            onLinkGoal={props.onLinkGoal}
            onLinkDecision={props.onLinkDecision}
            onOpenSource={() => props.onReveal(action.source)}
          />
        </div>
      </div>
    )
  }

  return (
    <Section section="actions" title={ctx.t("section.actions")}>
      <div class="flex flex-col gap-2">
        <div class="flex flex-wrap items-center gap-1">
          <div class="flex flex-wrap gap-1" role="group" aria-label={ctx.t("section.actions")}>
            <For each={actionFilters}>
              {(filter) => (
                <Button
                  size="small"
                  variant={props.filter === filter ? "ghost" : "ghost-muted"}
                  data-state={props.filter === filter ? "pressed" : undefined}
                  aria-pressed={props.filter === filter}
                  class="h-7 rounded-full px-2.5 text-12-regular"
                  onClick={() => props.onFilter(filter)}
                >
                  {ctx.t(actionFilterKeys[filter])}
                </Button>
              )}
            </For>
          </div>

          <div class="ms-auto flex gap-1" role="group" aria-label={ctx.t("action.view")}>
            <For each={actionViews}>
              {(view) => (
                <Button
                  size="small"
                  variant={props.view === view ? "ghost" : "ghost-muted"}
                  data-state={props.view === view ? "pressed" : undefined}
                  aria-pressed={props.view === view}
                  class="h-7 rounded-full px-2.5 text-12-regular"
                  onClick={() => props.onView(view)}
                >
                  {ctx.t(`action.view.${view}`)}
                </Button>
              )}
            </For>
          </div>
        </div>

        <Show
          when={visible().length > 0}
          fallback={<EmptyCard title={ctx.t("action.empty")} description={ctx.t("action.empty.description")} />}
        >
          <Show
            when={props.view === "relations"}
            fallback={<div class="flex flex-col gap-2"><For each={visible()}>{(action) => card(action)}</For></div>}
          >
            <Show
              when={groups().length > 0}
              fallback={
                <EmptyCard
                  title={ctx.t("action.relations.empty")}
                  description={ctx.t("action.relations.empty.description")}
                />
              }
            >
              <div class="flex flex-col gap-3">
                <For each={groups()}>
                  {(group) => (
                    <div class="flex flex-col gap-2" data-relation={group.decision.id}>
                      <div class="flex flex-col gap-0.5">
                        <div class="text-11-regular text-text-faint">{ctx.t("action.relatedTo")}</div>
                        <p class="text-12-medium text-text-strong">{group.decision.statement}</p>
                      </div>
                      <For each={group.actions}>{(action) => card(action)}</For>
                    </div>
                  )}
                </For>

                <Show when={unlinked().length > 0}>
                  <div class="flex flex-col gap-2">
                    <div class="text-11-regular text-text-faint">{ctx.t("action.relations.other")}</div>
                    <For each={unlinked()}>{(action) => card(action)}</For>
                  </div>
                </Show>
              </div>
            </Show>
          </Show>
        </Show>
      </div>
    </Section>
  )
}
