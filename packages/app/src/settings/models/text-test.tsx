import { Button } from "@opencode/ui/button"
import { useDialog } from "@opencode/ui/context/dialog"
import { Dialog, DialogBody, DialogHeader, DialogTitle } from "@opencode/ui/dialog"
import { createSignal, onCleanup, onMount, Show } from "solid-js"
import { useLanguage } from "@/runtime/i18n/language"
import { useServerSDK } from "@/runtime/server/client"
import { formatServerError } from "@/runtime/server/errors"
import { type Event, type State, transition } from "./text-test-machine"

export function ModelTextTest(props: { providerID: string; id: string; name: string }) {
  const language = useLanguage()
  const dialog = useDialog()
  const server = useServerSDK()
  const [state, setState] = createSignal<State>({ kind: "idle", attempt: 0 })
  const dispatch = (event: Event) => setState((state) => transition(state, event))
  const running = () => state().kind === "testing"

  const error = () => {
    const current = state()

    return current.kind === "failed" ? current.message : undefined
  }

  let request: AbortController | undefined

  function start() {
    const before = state()
    const next = dispatch({ type: "start" })

    if (next === before || next.kind !== "testing") return

    const controller = new AbortController()
    const timeout = AbortSignal.timeout(20_000)
    request = controller
    void server.api.experimental.generate
      .testText(
        { model: { providerID: props.providerID, id: props.id } },
        { signal: AbortSignal.any([controller.signal, timeout]) },
      )
      .then(
        () => dispatch({ type: "passed", attempt: next.attempt }),
        (cause) =>
          dispatch({
            type: "failed",
            attempt: next.attempt,
            message: timeout.aborted
              ? language.t("settings.models.test.timeout")
              : formatServerError(cause, language.t, language.t("settings.models.test.failed")),
          }),
      )
  }

  onCleanup(() => {
    dispatch({ type: "dispose" })
    request?.abort()
  })
  onMount(start)

  return (
    <Dialog size="normal" fit>
      <DialogHeader closeLabel={language.t("common.close")}>
        <DialogTitle>{language.t("settings.models.test.title")}</DialogTitle>
      </DialogHeader>
      <DialogBody class="flex min-h-0 flex-col gap-3 overflow-y-auto p-4">
        <p class="truncate">{props.name}</p>
        <Show when={running()}>
          <p role="status">{language.t("settings.models.test.running")}</p>
        </Show>
        <Show when={state().kind === "passed"}>
          <p role="status">{language.t("settings.models.test.passed")}</p>
        </Show>
        <Show when={state().kind === "cancelled"}>
          <p role="status">{language.t("settings.models.test.cancelled")}</p>
        </Show>
        <Show when={error()}>
          {(message) => (
            <p role="alert" class="break-words">
              {message()}
            </p>
          )}
        </Show>
        <div class="flex justify-end gap-2">
          <Show
            when={running()}
            fallback={
              <>
                <Button variant="ghost" onClick={() => dialog.close()}>
                  {language.t("common.close")}
                </Button>
                <Button variant="submit" onClick={start}>
                  {language.t(
                    state().kind === "failed" || state().kind === "cancelled"
                      ? "common.retry"
                      : "settings.models.test.title",
                  )}
                </Button>
              </>
            }
          >
            <Button
              variant="ghost"
              onClick={() => {
                dispatch({ type: "cancel" })
                request?.abort()
              }}
            >
              {language.t("common.cancel")}
            </Button>
          </Show>
        </div>
      </DialogBody>
    </Dialog>
  )
}
