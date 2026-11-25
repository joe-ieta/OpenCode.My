export const turnTimeFormat = new Intl.DateTimeFormat(undefined, {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
})

export function formatTurnDuration(milliseconds: number) {
  if (milliseconds < 1000) return "<1s"

  const seconds = Math.round(milliseconds / 1000)

  if (seconds < 60) return seconds + "s"

  const minutes = Math.floor(seconds / 60)

  if (minutes < 60) return minutes + "m " + (seconds % 60) + "s"

  return Math.floor(minutes / 60) + "h " + (minutes % 60) + "m"
}
