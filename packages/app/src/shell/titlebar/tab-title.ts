import { isFallbackTitle } from "@opencode/util/session-title-fallback"
import type { SessionInfo } from "@opencode/client/promise"
import type { useLanguage } from "@/runtime/i18n/language"
import { getRelativeTime } from "@/shell/time"

// Draft, preparing, and untitled session tabs share one localized label.
export function sessionTabTitle(title: string | undefined, fallback: string) {
  return !title || isFallbackTitle(title) ? fallback : title
}

// Hints keep this short: minutes, hours or days for a recent run, then the date.
export function sessionLastRunLabel(time: SessionInfo["time"] | undefined, language: ReturnType<typeof useLanguage>) {
  if (time?.idle === undefined) return

  return language.t("sidebar.session.lastRun", {
    time: getRelativeTime(new Date(time.idle).toISOString(), language.t, language.intl()),
  })
}
