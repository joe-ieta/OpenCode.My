import { Show, createUniqueId, type JSX } from "solid-js"

export function Section(props: { title: string; section?: string; action?: JSX.Element; children: JSX.Element }) {
  const id = createUniqueId()

  return (
    <section class="flex flex-col gap-2" data-section={props.section} aria-labelledby={id}>
      <div class="flex min-h-7 items-center gap-2">
        <h2 id={id} class="text-12-medium text-text-strong">
          {props.title}
        </h2>
        <Show when={props.action}>
          <div class="ms-auto flex items-center gap-1">{props.action}</div>
        </Show>
      </div>
      {props.children}
    </section>
  )
}

export function EmptyCard(props: { title: string; description: string }) {
  return (
    <div class="flex flex-col gap-1 rounded-lg border border-dashed border-border-muted px-3 py-3">
      <div class="text-12-medium text-text-base">{props.title}</div>
      <p class="text-12-regular text-text-weak">{props.description}</p>
    </div>
  )
}
