import { For, Show } from "solid-js"
import { Icon } from "@opencode/ui/icon"
import { usePlugin } from "@opencode/plugin/gui"
import type SessionGo from "../index"
import type { GoalNode, ProjectGoal, SourceRef } from "../types"
import { authorityKeys, goalStatusKeys } from "./filters"
import { SourceButton } from "./format"
import { EmptyCard, Section } from "./section"

export function GoalSection(props: {
  goal: GoalNode | undefined
  projectGoal: ProjectGoal | undefined
  onReveal: (source: SourceRef) => void
}) {
  const ctx = usePlugin<typeof SessionGo>()
  const done = () => props.goal?.acceptance.filter((item) => item.met).length ?? 0

  return (
    <Section section="goal" title={ctx.t("section.goal")}>
      <Show when={props.projectGoal}>
        {(project) => (
          <div
            class="flex flex-col gap-1 rounded-lg border border-border-muted px-3 py-2"
            classList={{ "border-dashed": project().mock === true }}
            data-project-goal
          >
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="rounded-full bg-background-stronger px-2 py-0.5 text-11-regular text-text-weak">
                {ctx.t("project.goal")}
              </span>
              <span class="rounded-full border border-border-muted px-2 py-0.5 text-11-regular text-text-weak">
                {ctx.t(goalStatusKeys[project().status])}
              </span>
              <Show when={project().mock}>
                <span class="rounded-full border border-dashed border-border-muted px-2 py-0.5 text-11-regular text-text-faint">
                  {ctx.t("project.placeholder")}
                </span>
              </Show>
            </div>
            <p class="text-12-medium text-text-strong">{project().statement}</p>
            <p class="text-11-regular text-text-faint">
              {ctx.t(project().mock ? "project.mockHint" : "project.providedHint")}
            </p>
            <Show when={props.goal?.projectGoalID}>
              <span class="text-11-regular text-text-faint">{ctx.t("project.linked")}</span>
            </Show>
          </div>
        )}
      </Show>

      <Show
        when={props.goal}
        fallback={
          <EmptyCard title={ctx.t("goal.empty")} description={ctx.t("goal.empty.description")} />
        }
      >
        {(goal) => {
          return (
            <div class="flex flex-col gap-2 rounded-lg border border-border-muted px-3 py-3">
              <div class="flex items-start gap-2">
                <p class="min-w-0 flex-1 text-13-medium text-text-strong">{goal().statement}</p>
                <span class="shrink-0 rounded-full border border-border-muted px-2 py-0.5 text-11-regular text-text-weak">
                  {ctx.t(goalStatusKeys[goal().status])}
                </span>
              </div>

              <div class="flex flex-wrap items-center gap-1 text-11-regular text-text-faint">
                <span>{ctx.t(authorityKeys[goal().authority])}</span>
                <span>·</span>
                <SourceButton source={goal().source} onReveal={props.onReveal} />
              </div>

              <Show when={(goal().constraints?.length ?? 0) > 0}>
                <div class="flex flex-col gap-1">
                  <div class="text-11-regular text-text-faint">{ctx.t("goal.constraints")}</div>
                  <ul class="flex flex-col gap-1">
                    <For each={goal().constraints}>
                      {(constraint) => (
                        <li class="text-12-regular text-text-weak">· {constraint}</li>
                      )}
                    </For>
                  </ul>
                </div>
              </Show>

              <Show when={goal().acceptance.length > 0}>
                <div class="flex flex-col gap-1">
                  <For each={goal().acceptance}>
                    {(item) => (
                      <div class="flex items-start gap-1.5 text-12-regular text-text-weak">
                        <Icon
                          name={item.met ? "circle-check" : "status"}
                          class="mt-0.5 shrink-0 text-text-faint"
                          aria-hidden="true"
                        />
                        <span>{item.statement}</span>
                      </div>
                    )}
                  </For>
                </div>
              </Show>

              <div class="flex flex-wrap items-center gap-2 text-11-regular text-text-faint">
                <span>{ctx.t("goal.acceptance", { done: done(), total: goal().acceptance.length })}</span>
                <Show when={goal().version > 1}>
                  <span>·</span>
                  <span>{ctx.t("goal.version", { version: goal().version })}</span>
                </Show>
              </div>
            </div>
          )
        }}
      </Show>
    </Section>
  )
}
