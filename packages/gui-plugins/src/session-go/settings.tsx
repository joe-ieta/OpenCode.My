import { usePlugin } from "@opencode/plugin/gui"
import type SessionGo from "./index"

type SettingKey =
  | "enabled"
  | "keepAnalysis"
  | "commitments"
  | "modelAnalysis"
  | "autoAnalyze"
  | "historyIndex"

/** Settings › Session Go: the feature gate and the stored preferences for later phases. */
export default function SessionGoSettings() {
  const ctx = usePlugin<typeof SessionGo>()
  const ui = ctx.ui
  const settings = ctx.stores.settings

  const set = (key: SettingKey, value: boolean) =>
    settings.update((draft) => {
      draft[key] = value
    })

  const row = (key: SettingKey, id: string) => {
    const title = ctx.t(`settings.${key}.title`)
    const description = ctx.t(`settings.${key}.description`)

    return (
      <ui.SettingsRow id={id} title={title} description={description}>
        <ui.Switch
          label={title}
          hideLabel
          checked={settings.value[key]}
          onChange={(checked) => set(key, checked)}
        />
      </ui.SettingsRow>
    )
  }

  return (
    <ui.SettingsLayout title={ctx.t("settings.title")} description={ctx.t("settings.description")}>
      <ui.SettingsSection title={ctx.t("settings.section.general")}>
        {row("enabled", "settings-session-go-enabled")}
        {row("keepAnalysis", "settings-session-go-keep-analysis")}
        {row("commitments", "settings-session-go-commitments")}
      </ui.SettingsSection>

      <ui.SettingsSection title={ctx.t("settings.section.analysis")}>
        {row("modelAnalysis", "settings-session-go-model-analysis")}
        {row("autoAnalyze", "settings-session-go-auto-analyze")}
        {row("historyIndex", "settings-session-go-history-index")}
      </ui.SettingsSection>

      <ui.SettingsSection title={ctx.t("settings.section.status")}>
        <ui.SettingsRow
          id="settings-session-go-preview"
          title={ctx.t("settings.preview.title")}
          description={ctx.t("settings.preview.description")}
        />
      </ui.SettingsSection>
    </ui.SettingsLayout>
  )
}
