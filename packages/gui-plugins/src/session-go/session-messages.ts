import type { SessionMessageInfo } from "@opencode/client/promise"
import type { ExtractionMessage } from "./types"

/** Actual session messages satisfy the extractor's minimal structural input. */
export function extractionMessages(messages: readonly SessionMessageInfo[]): readonly ExtractionMessage[] {
  return messages
}
