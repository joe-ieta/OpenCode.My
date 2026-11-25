import { createMemo, onCleanup } from "solid-js"
import { createKeyed, usePlugin, type MountedSession } from "@opencode/plugin/gui"
import type SessionGo from "../index"
import { L2_PROMPT_VERSION } from "../l2-contract"
import { episodeScope, l2SnapshotKey } from "../l2-triggers"
import { createSessionGoData } from "./data"

/**
 * Runs episode-end consolidation while this session is on screen. The header slot mounts it only
 * when automatic analysis is enabled, and the plugin's settings still gate every request.
 */
export default function SessionGoAuto(props: { session: MountedSession }) {
  const ctx = usePlugin<typeof SessionGo>()
  const data = createSessionGoData(() => props.session)
  const attempted = new Set<string>()

  const run = createMemo(() => {
    if (!ctx.stores.settings.value.autoAnalyze || !ctx.stores.settings.value.keepAnalysis) return

    if (!data.reconciled()) return

    const slice = episodeScope(data.extraction())

    if (!slice) return

    const key = l2SnapshotKey({
      trigger: "episode",
      promptVersion: L2_PROMPT_VERSION,
      model: data.modelRef(),
      messages: slice.messages,
      scope: slice.scope,
    })

    if (attempted.has(key) || data.l2Snapshots().some((snapshot) => snapshot.key === key)) return

    return { key, slice }
  })

  createKeyed(
    run,
    (value) => {
      if (attempted.has(value.key)) return

      attempted.add(value.key)
      const controller = new AbortController()
      onCleanup(() => controller.abort())

      void data
        .runAnalysis({ trigger: "episode", slice: value.slice, signal: controller.signal })
        .then((snapshot) => data.saveL2(snapshot))
        .catch(() => {
          if (!controller.signal.aborted) console.error("[session-go] automatic analysis failed")
        })
    },
    { equals: (previous, next) => previous?.key === next?.key },
  )

  return null
}
