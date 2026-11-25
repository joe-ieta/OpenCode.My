import { Show } from "solid-js"
import { Button } from "@opencode/ui/button"
import { usePlugin } from "@opencode/plugin/gui"
import type SessionGo from "../index"
import type { SourceRef } from "../types"

/** A short source label for a fact, and the control that reveals it in the timeline. */
export function sourceLabel(source: SourceRef | undefined) {
  const id = source?.messageID ?? source?.actionID ?? source?.checkpointID ?? source?.partID

  if (!id) return

  return id.length > 22 ? `${id.slice(0, 21)}…` : id
}

export function SourceButton(props: {
  source: SourceRef | undefined
  onReveal: (source: SourceRef) => void
}) {
  const ctx = usePlugin<typeof SessionGo>()
  const label = () => sourceLabel(props.source)

  return (
    <Show
      when={label()}
      fallback={<span class="text-11-regular text-text-faint">{ctx.t("source.missing")}</span>}
    >
      {(value) => (
        <Button
          size="small"
          variant="ghost-muted"
          class="h-auto max-w-44 justify-start px-1 py-0 font-mono text-11-regular"
          title={ctx.t("source.open")}
          onClick={(event: MouseEvent) => {
            event.stopPropagation()

            if (props.source) props.onReveal(props.source)
          }}
        >
          <span class="truncate">{value()}</span>
        </Button>
      )}
    </Show>
  )
}
