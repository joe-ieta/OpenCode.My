import { buildL2Prompt, L2_PROMPT_VERSION, parseL2Output } from "./l2-contract"
import { l2SnapshotKey } from "./l2-triggers"
import type {
  ExtractionMessage,
  L2ModelRef,
  L2Scope,
  L2Snapshot,
  L2Tokens,
  L2Trigger,
  SessionGraph,
} from "./types"

/** The session's transient generation call: current context, no history mutation, real usage. */
export type L2Client = {
  text(
    input: { sessionID: string; prompt: string },
    options?: { signal?: AbortSignal },
  ): Promise<{ text: string; tokens?: L2Tokens; cost?: number }>
}

/** A model the session already uses, used for the displayed name and the analysis key. */
export function modelRefFromMessages(messages: readonly ExtractionMessage[]) {
  const message = messages.findLast((item) => item.type === "assistant")

  if (message?.type !== "assistant") return

  return {
    providerID: message.model.providerID,
    id: message.model.id,
  } satisfies L2ModelRef
}

/** A rough prompt-size readout; the server reports the real tokens and cost after the run. */
export function promptTokens(prompt: string) {
  return Math.ceil(prompt.length / 4)
}

export class L2InvalidOutputError extends Error {
  constructor() {
    super("The model returned no valid analysis.")
    this.name = "L2InvalidOutputError"
  }
}

/** Runs one consolidation request and returns the persisted snapshot shape. */
export async function runL2Analysis(input: {
  sessionID: string
  graph: SessionGraph
  messages: readonly ExtractionMessage[]
  scope: L2Scope
  trigger: L2Trigger
  model?: L2ModelRef
  modelName: string
  client: L2Client
  signal: AbortSignal
  now?: number
}): Promise<L2Snapshot> {
  const prompt = buildL2Prompt({ graph: input.graph, messages: input.messages, scope: input.scope })

  const response = await input.client.text(
    { sessionID: input.sessionID, prompt },
    { signal: input.signal },
  )

  const parsed = parseL2Output(response.text, { graph: input.graph, messages: input.messages })

  if (!parsed) throw new L2InvalidOutputError()

  return {
    key: l2SnapshotKey({
      trigger: input.trigger,
      promptVersion: L2_PROMPT_VERSION,
      model: input.model,
      messages: input.messages,
      scope: input.scope,
    }),
    trigger: input.trigger,
    promptVersion: L2_PROMPT_VERSION,
    createdAt: input.now ?? Date.now(),
    providerID: input.model?.providerID,
    modelID: input.model?.id,
    modelName: input.modelName,
    cost: response.cost,
    tokens: response.tokens,
    scope: input.scope,
    decisions: parsed.decisions,
    edges: parsed.edges,
    dropped: parsed.dropped,
  }
}
