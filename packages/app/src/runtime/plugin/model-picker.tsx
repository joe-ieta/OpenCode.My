import { lazy, onCleanup, Suspense } from "solid-js"
import type { Composer, ComposerModel } from "@opencode/plugin/gui"
import { Dialog } from "@opencode/ui/dialog"
import { Loader } from "@opencode/ui/loader"
import { useDialog } from "@opencode/ui/context/dialog"
import { uuid } from "@opencode/util/uuid"
import type { ModelSelection } from "@/providers/models/selection"

const DialogSelectModel = lazy(async () => {
  const { DialogSelectModel } = await import("@/providers/models/select-dialog")

  return { default: DialogSelectModel }
})

/** The shared model picker with a private selection; catalog preferences remain shared. */
export function createPluginModelPicker(model: ModelSelection) {
  const dialog = useDialog({ context: "caller" })
  const requests = new Set<string>()
  onCleanup(() => requests.forEach((id) => dialog.close(id)))

  return (options?: Parameters<Composer["pickModel"]>[0]) => {
    const id = uuid()
    const reply = Promise.withResolvers<ComposerModel | null | undefined>()
    requests.add(id)
    void dialog.push(
      () => (
        <Suspense
          fallback={
            <Dialog size="large">
              <Loader class="m-auto" />
            </Dialog>
          }
        >
          <PluginModelPicker
            model={model}
            current={options?.current}
            defaultLabel={options?.defaultLabel}
            done={(value) => {
              reply.resolve(value)
              dialog.close(id)
            }}
          />
        </Suspense>
      ),
      () => {
        requests.delete(id)
        reply.resolve(undefined)
      },
      id,
    )

    return reply.promise
  }
}

function PluginModelPicker(props: {
  model: ModelSelection
  current: ComposerModel | undefined
  defaultLabel: string | undefined
  done: (model: ComposerModel | null) => void
}) {
  const key = props.model.key()
  const initial = props.current ?? (key ? { ...key, variant: props.model.variant.current() } : undefined)

  const current = () =>
    initial
      ? props.model.list().find((item) => item.id === initial.modelID && item.provider.id === initial.providerID)
      : undefined

  const selection: ModelSelection = {
    ...props.model,
    key: () => initial,
    current,
    standard: current,
    set: (value) => {
      if (value) props.done(value)
    },
    variant: {
      ...props.model.variant,
      current: (item) => {
        if (initial && (!item || (item.modelID === initial.modelID && item.providerID === initial.providerID)))
          return initial.variant

        return props.model.variant.current(item)
      },
      set: (variant) => {
        if (initial) props.done({ ...initial, variant })
      },
    },
  }

  return (
    <DialogSelectModel
      model={selection}
      onPick={props.done}
      defaultOption={props.defaultLabel ? { label: props.defaultLabel, run: () => props.done(null) } : undefined}
    />
  )
}
