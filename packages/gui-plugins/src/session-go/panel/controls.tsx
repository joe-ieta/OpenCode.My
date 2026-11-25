import { Show } from "solid-js"
import { Button } from "@opencode/ui/button"
import { usePlugin } from "@opencode/plugin/gui"
import type SessionGo from "../index"
import type { ActionNode, DecisionNode } from "../types"
import { isActionable, type FactLink } from "./filters"

export function DecisionControls(props: {
  decision: DecisionNode
  canSupersede: boolean
  disabled?: boolean
  onConfirm: (id: string) => void
  onReject: (id: string) => void
  onDefer: (id: string) => void
  onSupersede: (id: string) => void
  onEdit: (id: string) => void
  onOpenSource: () => void
}) {
  const ctx = usePlugin<typeof SessionGo>()
  const blocked = () => props.disabled === true
  const unavailable = () => (blocked() ? ctx.t("settings.commitments.disabled") : undefined)

  return (
    <div class="flex flex-wrap items-center gap-1">
      <Show when={isActionable(props.decision)}>
        <Button
          size="small"
          variant="contrast"
          disabled={blocked()}
          title={unavailable()}
          onClick={() => props.onConfirm(props.decision.id)}
        >
          {ctx.t("decision.confirm")}
        </Button>
        <Button
          size="small"
          variant="ghost-muted"
          disabled={blocked()}
          title={unavailable()}
          onClick={() => props.onReject(props.decision.id)}
        >
          {ctx.t("decision.reject")}
        </Button>
        <Button
          size="small"
          variant="ghost-muted"
          disabled={blocked()}
          title={unavailable()}
          onClick={() => props.onDefer(props.decision.id)}
        >
          {ctx.t("decision.defer")}
        </Button>
      </Show>
      <Show when={props.canSupersede}>
        <Button
          size="small"
          variant="ghost-muted"
          disabled={blocked()}
          title={unavailable()}
          onClick={() => props.onSupersede(props.decision.id)}
        >
          {ctx.t("decision.supersede")}
        </Button>
      </Show>
      <Button
        size="small"
        variant="ghost-muted"
        disabled
        title={ctx.t("decision.editUnavailable")}
        onClick={() => props.onEdit(props.decision.id)}
      >
        {ctx.t("decision.edit")}
      </Button>
      <Button
        size="small"
        variant="ghost-muted"
        onClick={props.onOpenSource}
      >
        {ctx.t("decision.openSource")}
      </Button>
    </div>
  )
}

export function ActionControls(props: {
  action: ActionNode
  link: FactLink | undefined
  promoted: boolean
  hasGoal: boolean
  hasDecision: boolean
  disabled?: boolean
  onPromote: (id: string) => void
  onLinkGoal: (id: string) => void
  onLinkDecision: (id: string) => void
  onOpenSource: () => void
}) {
  const ctx = usePlugin<typeof SessionGo>()
  const blocked = () => props.disabled === true
  const unavailable = () => (blocked() ? ctx.t("settings.commitments.disabled") : undefined)

  return (
    <div class="flex flex-wrap items-center gap-1">
      <Button
        size="small"
        variant="ghost-muted"
        disabled={blocked() || props.promoted}
        title={unavailable()}
        onClick={() => props.onPromote(props.action.id)}
      >
        {props.promoted ? ctx.t("action.promoted") : ctx.t("action.promote")}
      </Button>
      <Button
        size="small"
        variant="ghost-muted"
        disabled={blocked() || !props.hasGoal || props.link?.goal !== undefined}
        title={
          unavailable() ??
          (props.hasGoal ? undefined : ctx.t("action.linkGoalUnavailable"))
        }
        onClick={() => props.onLinkGoal(props.action.id)}
      >
        <Show when={props.link?.goal} fallback={ctx.t("action.link")}>
          {(goal) => ctx.t("action.linked", { goal: goal() })}
        </Show>
      </Button>
      <Button
        size="small"
        variant="ghost-muted"
        disabled={blocked() || !props.hasDecision || props.link?.decision !== undefined}
        title={
          unavailable() ??
          (props.hasDecision ? undefined : ctx.t("action.linkDecisionUnavailable"))
        }
        onClick={() => props.onLinkDecision(props.action.id)}
      >
        <Show when={props.link?.decision} fallback={ctx.t("action.linkDecision")}>
          {(decision) => ctx.t("action.linkedDecision", { decision: decision() })}
        </Show>
      </Button>
      <Button
        size="small"
        variant="ghost-muted"
        onClick={props.onOpenSource}
      >
        {ctx.t("action.openSource")}
      </Button>
    </div>
  )
}
