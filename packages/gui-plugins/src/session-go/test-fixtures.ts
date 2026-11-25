import type {
  ExtractionContent,
  ExtractionMessage,
  ExtractionToolContent,
  ExtractionToolState,
  ToolInputRecord,
} from "./types"

export function user(id: string, text: string, created = 1): ExtractionMessage {
  return { id, type: "user", text, files: [], time: { created } }
}

export function assistant(
  id: string,
  content: readonly ExtractionContent[],
  options: {
    created?: number
    completed?: number
    snapshotFiles?: readonly string[]
    error?: unknown
  } = {},
): ExtractionMessage {
  return {
    id,
    type: "assistant",
    agent: "build",
    model: { providerID: "test", id: "test" },
    content,
    snapshot: options.snapshotFiles ? { files: options.snapshotFiles } : undefined,
    error: options.error,
    time: { created: options.created ?? 1, completed: options.completed },
  }
}

export function text(value: string): ExtractionContent {
  return { type: "text", text: value }
}

export function reasoning(value: string): ExtractionContent {
  return { type: "reasoning", text: value }
}

export function tool(
  id: string,
  name: string,
  input: ToolInputRecord,
  status: "running" | "completed" | "error" = "completed",
  created = 1,
  completed = 2,
): ExtractionToolContent {
  const state = toolState(input, status)

  return { type: "tool", id, name, state, time: { created, completed } }
}

function toolState(input: ToolInputRecord, status: "running" | "completed" | "error"): ExtractionToolState {
  if (status === "running") return { status: "running", input }

  if (status === "error") return { status: "error", input, error: { message: "failed" } }

  return { status: "completed", input, content: [{ type: "text", text: "ok" }] }
}

export function shell(
  id: string,
  command: string,
  options: {
    status?: "running" | "exited" | "timeout" | "killed"
    exit?: number
    created?: number
    completed?: number
  } = {},
): ExtractionMessage {
  return {
    id,
    type: "shell",
    command,
    status: options.status ?? "exited",
    exit: options.exit ?? 0,
    time: { created: options.created ?? 1, completed: options.completed ?? 2 },
  }
}

export function compaction(
  id: string,
  summary: string,
  status: "running" | "completed" | "failed" = "completed",
  created = 1,
): ExtractionMessage {
  return { id, type: "compaction", status, reason: "auto", summary, time: { created } }
}

export function idle(
  id: string,
  outcome: "succeeded" | "failed" | "interrupted" = "succeeded",
  created = 2,
): ExtractionMessage {
  return { id, type: "idle", outcome, time: { created } }
}

export function notice(id: string, value: string, created = 1): ExtractionMessage {
  return { id, type: "synthetic", text: value, description: value, time: { created } }
}
