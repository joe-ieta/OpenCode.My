import {
  constraintSentences,
  decisionKind,
  firstLine,
  isConfigPath,
  isQuestion,
  proposalSentences,
  sectionItems,
  uniqueStatements,
} from "./extract-rules"
import type { ActionNode, DecisionNode, ExtractionMessage, SourceRef } from "./types"

export type DecisionExtractionInput = {
  messages: readonly ExtractionMessage[]
  actions: readonly ActionNode[]
}

/** Extracts conservative decision candidates. Nothing here becomes authoritative without user confirmation. */
export function extractDecisions(input: DecisionExtractionInput): DecisionNode[] {
  const decisions: DecisionNode[] = []

  input.messages.forEach((message, index) => {
    if (message.type === "user") {
      constraintSentences(message.text).forEach((sentence, offset) => {
        decisions.push(
          decision({
            id: `decision-user-${message.id}-${offset}`,
            kind: decisionKind(sentence),
            statement: firstLine(sentence, 240),
            authority: "user",
            confidence: "medium",
            source: { messageID: message.id },
            rule: "decision.user.constraint",
          }),
        )
      })

      const previous = input.messages[index - 1]

      if (
        previous?.type === "assistant" &&
        message.text.trim().length <= 200 &&
        isQuestion(lastText(previous))
      ) {
        decisions.push(
          decision({
            id: `decision-answer-${message.id}`,
            kind: "approval",
            statement: firstLine(message.text, 240),
            authority: "user",
            confidence: "medium",
            source: { messageID: message.id },
            rule: "decision.user.answer",
          }),
        )
      }
    }

    if (message.type === "assistant") {
      proposalSentences(lastText(message)).forEach((sentence, offset) => {
        decisions.push(
          decision({
            id: `decision-agent-${message.id}-${offset}`,
            kind: "approach",
            statement: firstLine(sentence, 240),
            authority: "agent",
            confidence: "medium",
            source: { messageID: message.id },
            rule: "decision.agent.proposal",
          }),
        )
      })
    }

    if (message.type === "compaction" && message.status === "completed") {
      sectionItems(message.summary, "Decisions").forEach((item, offset) => {
        decisions.push(
          decision({
            id: `decision-compaction-${message.id}-${offset}`,
            kind: decisionKind(item),
            statement: firstLine(item, 240),
            authority: "inferred",
            confidence: "low",
            source: { messageID: message.id, checkpointID: message.id },
            rule: "decision.compaction",
          }),
        )
      })

      sectionItems(message.summary, "Requirements").forEach((item, offset) => {
        decisions.push(
          decision({
            id: `decision-requirement-${message.id}-${offset}`,
            kind: "constraint",
            statement: firstLine(item, 240),
            authority: "inferred",
            confidence: "low",
            source: { messageID: message.id, checkpointID: message.id },
            rule: "decision.compaction.requirement",
          }),
        )
      })
    }
  })

  input.actions
    .filter((action) => action.kind === "change" && action.files?.some(isConfigPath))
    .forEach((action) => {
      decisions.push(
        decision({
          id: `decision-enacted-${action.id}`,
          kind: "approach",
          statement: firstLine(action.summary, 240),
          authority: "agent",
          confidence: "low",
          source: { messageID: action.source.messageID, actionID: action.id },
          rule: "decision.enacted",
        }),
      )
    })

  return uniqueStatements(decisions)
}

function decision(input: {
  id: string
  kind: DecisionNode["kind"]
  statement: string
  authority: DecisionNode["authority"]
  confidence: DecisionNode["confidence"]
  source: SourceRef
  rule: string
}): DecisionNode {
  return {
    ...input,
    status: "proposed",
    scope: "session",
  }
}

function lastText(message: Extract<ExtractionMessage, { type: "assistant" }>) {
  const text = message.content.findLast((part) => part.type === "text")

  return text?.type === "text" ? text.text : ""
}
