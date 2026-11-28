export type ChatWindowState =
  | { readonly status: "unmounted" }
  | { readonly status: "collapsed" }
  | { readonly status: "floating" }
  | { readonly status: "modal"; readonly id: string }
  | { readonly status: "disposed" }

export type ChatWindowEvent =
  | { readonly type: "toggle" }
  | { readonly type: "collapse" }
  | { readonly type: "maximize"; readonly id: string }
  | { readonly type: "restore" }
  | { readonly type: "dismissed"; readonly id: string }
  | { readonly type: "disposed" }

export function transitionChatWindow(state: ChatWindowState, event: ChatWindowEvent): ChatWindowState {
  if (state.status === "disposed") return state

  if (event.type === "disposed") return { status: "disposed" }

  if (event.type === "toggle")
    return { status: state.status === "unmounted" || state.status === "collapsed" ? "floating" : "collapsed" }

  if (event.type === "collapse")
    return state.status === "floating" || state.status === "modal" ? { status: "collapsed" } : state

  if (event.type === "maximize") return state.status === "floating" ? { status: "modal", id: event.id } : state

  if (state.status !== "modal") return state

  if (event.type === "restore" || (event.type === "dismissed" && event.id === state.id)) return { status: "floating" }

  return state
}
