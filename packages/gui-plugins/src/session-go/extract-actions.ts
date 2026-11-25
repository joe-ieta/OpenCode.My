import { Option } from "effect"
import { decodeErrorInfo, firstLine, isChangeTool, toolDetail, toolFiles } from "./extract-rules"
import type {
  ActionExtraction,
  ActionNode,
  ActionStatus,
  EpisodeOutcome,
  ExtractionMessage,
  ExtractionToolContent,
  ExtractionToolState,
} from "./types"

/** Extracts the observed actions from a session's message log. No model call is involved. */
export function extractActions(messages: readonly ExtractionMessage[]): ActionExtraction {
  const actions: ActionNode[] = []
  const outcomes: EpisodeOutcome[] = []
  let open = false
  let approximate = false

  for (const message of messages) {
    if (message.type === "user") {
      if (open) approximate = true
      open = true
      actions.push(promptAction(message))
      continue
    }

    if (message.type === "assistant") {
      actions.push(stepAction(message))

      for (const part of message.content) {
        if (part.type !== "tool") continue
        actions.push(toolAction(message, part))
      }

      const covered = new Set(
        message.content.flatMap((part) =>
          part.type === "tool" && isChangeTool(part.name) && part.state.status === "completed"
            ? toolFiles(part.state.input)
            : [],
        ),
      )

      const files = (message.snapshot?.files ?? []).filter((file) => !covered.has(file))

      if (files.length > 0) actions.push(changeAction(message, files))

      if (message.error || message.retry) actions.push(errorAction(message))
      continue
    }

    if (message.type === "shell") {
      open = true
      actions.push(shellAction(message))
      continue
    }

    if (message.type === "compaction") {
      actions.push(compactionAction(message))
      continue
    }

    if (message.type === "idle") {
      open = false
      outcomes.push({
        messageID: message.id,
        outcome: message.outcome,
        error: Option.getOrUndefined(decodeErrorInfo(message.error))?.message,
        time: message.time.created,
      })
      continue
    }

    if (message.type === "synthetic" || message.type === "system" || message.type === "skill") {
      actions.push(noticeAction(message))
      continue
    }

    if (message.type === "agent-switched" || message.type === "model-switched" || message.type === "location-switched") {
      actions.push(switchAction(message))
    }
  }

  return { actions, outcomes, approximate }
}

function promptAction(message: Extract<ExtractionMessage, { type: "user" }>): ActionNode {
  return {
    id: `prompt-${message.id}`,
    kind: "prompt",
    actor: "user",
    status: "succeeded",
    summary: firstLine(message.text),
    source: { messageID: message.id },
    startedAt: message.time.created,
    endedAt: message.time.created,
    confidence: "high",
    rule: "action.user",
  }
}

function stepAction(message: Extract<ExtractionMessage, { type: "assistant" }>): ActionNode {
  const text = message.content.findLast((part) => part.type === "text")

  return {
    id: `step-${message.id}`,
    kind: "step",
    actor: "agent",
    status: message.error ? "failed" : message.time.completed ? "succeeded" : "running",
    summary: text?.type === "text" ? firstLine(text.text) : "",
    name: message.agent,
    source: { messageID: message.id },
    startedAt: message.time.created,
    endedAt: message.time.completed,
    confidence: "high",
    rule: "action.assistant",
  }
}

function toolAction(
  message: Extract<ExtractionMessage, { type: "assistant" }>,
  part: ExtractionToolContent,
): ActionNode {
  const input = toolInput(part.state)

  return {
    id: `tool-${message.id}-${part.id}`,
    kind: toolKind(part.name),
    actor: "agent",
    status: toolStatus(part.state),
    summary: firstLine(toolDetail(part.name, input)),
    name: part.name,
    files: toolFiles(input),
    source: { messageID: message.id, partID: part.id },
    startedAt: part.time.created,
    endedAt: part.time.completed,
    confidence: "high",
    rule: "action.tool",
  }
}

function changeAction(
  message: Extract<ExtractionMessage, { type: "assistant" }>,
  files: readonly string[],
): ActionNode {
  return {
    id: `change-${message.id}`,
    kind: "change",
    actor: "agent",
    status: "succeeded",
    summary: firstLine(files.join(", "), 240),
    files: [...files],
    source: { messageID: message.id },
    startedAt: message.time.created,
    endedAt: message.time.completed,
    confidence: "high",
    rule: "action.change",
  }
}

function errorAction(message: Extract<ExtractionMessage, { type: "assistant" }>): ActionNode {
  return {
    id: `error-${message.id}`,
    kind: "error",
    actor: "agent",
    status: "failed",
    summary: firstLine(
      Option.getOrUndefined(decodeErrorInfo(message.error))?.message ??
        Option.getOrUndefined(decodeErrorInfo(message.retry))?.message ??
        "",
    ),
    source: { messageID: message.id },
    startedAt: message.time.created,
    endedAt: message.time.completed,
    confidence: "high",
    rule: "action.error",
  }
}

function shellAction(message: Extract<ExtractionMessage, { type: "shell" }>): ActionNode {
  return {
    id: `shell-${message.id}`,
    kind: "shell",
    actor: "agent",
    status: shellStatus(message),
    summary: firstLine(message.command, 240),
    name: "shell",
    source: { messageID: message.id },
    startedAt: message.time.created,
    endedAt: message.time.completed,
    confidence: "high",
    rule: "action.shell",
  }
}

function compactionAction(message: Extract<ExtractionMessage, { type: "compaction" }>): ActionNode {
  return {
    id: `checkpoint-${message.id}`,
    kind: "checkpoint",
    actor: "system",
    status: compactionStatus(message.status),
    summary: message.reason,
    name: "compaction",
    source: { messageID: message.id, checkpointID: message.id },
    startedAt: message.time.created,
    endedAt: message.time.created,
    confidence: "high",
    rule: "action.checkpoint",
  }
}

function noticeAction(
  message: Extract<ExtractionMessage, { type: "synthetic" | "system" | "skill" }>,
): ActionNode {
  return {
    id: `notice-${message.id}`,
    kind: "notice",
    actor: "system",
    status: "succeeded",
    summary: message.type === "skill" ? message.name : firstLine(message.description ?? message.text),
    name: message.type,
    source: { messageID: message.id },
    startedAt: message.time.created,
    endedAt: message.time.created,
    confidence: "high",
    rule: "action.notice",
  }
}

function switchAction(
  message: Extract<ExtractionMessage, { type: "agent-switched" | "model-switched" | "location-switched" }>,
): ActionNode {
  return {
    id: `switch-${message.id}`,
    kind: "switch",
    actor: "system",
    status: "succeeded",
    summary: message.type,
    name: message.type,
    source: { messageID: message.id },
    startedAt: message.time.created,
    endedAt: message.time.created,
    confidence: "high",
    rule: "action.switch",
  }
}

function compactionStatus(status: Extract<ExtractionMessage, { type: "compaction" }>["status"]): ActionStatus {
  if (status === "running") return "running"

  if (status === "completed") return "succeeded"

  return "failed"
}

function toolInput(state: ExtractionToolState) {
  return state.status === "streaming" ? {} : state.input
}

function toolStatus(state: ExtractionToolState): ActionStatus {
  if (state.status === "streaming" || state.status === "running") return "running"

  if (state.status === "completed") return "succeeded"

  return "failed"
}

function toolKind(name: string): ActionNode["kind"] {
  if (/^(task|subagent)$/i.test(name)) return "subagent"

  if (isChangeTool(name)) return "change"

  if (/^(bash|shell)$/i.test(name)) return "shell"

  return "tool"
}

function shellStatus(message: Extract<ExtractionMessage, { type: "shell" }>): ActionStatus {
  if (message.status === "running") return "running"

  if (message.status === "killed") return "interrupted"

  if (message.status === "timeout") return "failed"

  return message.exit === 0 ? "succeeded" : "failed"
}
