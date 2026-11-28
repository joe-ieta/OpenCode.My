type Rect = { top: number; left: number; width: number; height: number }

/** Keep the overview and its optional chat inside the viewport without covering each other. */
export function floatingLayout(rect: Rect, viewport: { width: number; height: number }, paired: boolean) {
  if (!paired) return { main: rect, chat: rect }
  const available = viewport.width - 24

  if (available < 640) {
    const width = Math.min(rect.width, available)
    const height = Math.min(rect.height, (viewport.height - 36) / 2)
    const left = Math.max(12, Math.min(rect.left, viewport.width - width - 12))
    const top = Math.max(12, Math.min(rect.top, viewport.height - height * 2 - 24))

    return { main: { top, left, width, height }, chat: { top: top + height + 12, left, width, height } }
  }

  const chat = Math.min(380, available - 320 - 12)
  const width = Math.min(rect.width, available - chat - 12)
  const left = Math.max(12, Math.min(rect.left, viewport.width - width - chat - 24))

  return { main: { ...rect, left, width }, chat: { ...rect, left: left + width + 12, width: chat } }
}
