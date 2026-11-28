import { Dialog, DialogTitle } from "@opencode/ui/dialog"
import { usePlugin } from "@opencode/plugin/gui"
import GoChatPanel from "./chat-panel"
import type { GoChatModel } from "./chat-model"
import type SessionGo from "./index"

export default function GoChatDialog(props: { model: GoChatModel; onRestore: () => void; onCollapse: () => void }) {
  const ctx = usePlugin<typeof SessionGo>()

  return (
    <Dialog size="maximized" preventBackdropDismiss>
      <div class="sr-only">
        <DialogTitle>{ctx.t("chat.title")}</DialogTitle>
      </div>
      <GoChatPanel model={props.model} visible maximized onResize={props.onRestore} onClose={props.onCollapse} />
    </Dialog>
  )
}
