import { firstLine, isQuestion, sentences, subsectionItems, uniqueStatements } from "./extract-rules"
import type { DecisionNode, ExtractionMessage } from "./types"

export type QuestionExtractionInput = {
  messages: readonly ExtractionMessage[]
}

/** Extracts candidate open questions from assistant text and blocked checkpoint items. */
export function extractOpenQuestions(input: QuestionExtractionInput): DecisionNode[] {
  const questions: DecisionNode[] = []

  input.messages.forEach((message) => {
    if (message.type === "assistant") {
      const text = lastText(message)

      sentences(text)
        .filter(isQuestion)
        .forEach((sentence, index) => {
          questions.push(openQuestion({
            id: `question-assistant-${message.id}-${index}`,
            statement: firstLine(sentence, 240),
            authority: "agent",
            confidence: "medium",
            source: { messageID: message.id },
            rule: "question.assistant",
          }))
        })
    }

    if (message.type === "compaction" && message.status === "completed") {
      subsectionItems(message.summary, "Work State", "Blocked").forEach((item, index) => {
        questions.push(openQuestion({
          id: `question-blocked-${message.id}-${index}`,
          statement: firstLine(item, 240),
          authority: "inferred",
          confidence: "low",
          source: { messageID: message.id, checkpointID: message.id },
          rule: "question.compaction.blocked",
        }))
      })
    }
  })

  return uniqueStatements(questions)
}

function openQuestion(input: {
  id: string
  statement: string
  authority: DecisionNode["authority"]
  confidence: DecisionNode["confidence"]
  source: DecisionNode["source"]
  rule: string
}): DecisionNode {
  return {
    ...input,
    kind: "open-question",
    status: "open",
    scope: "session",
  }
}

function lastText(message: Extract<ExtractionMessage, { type: "assistant" }>) {
  const text = message.content.findLast((part) => part.type === "text")

  return text?.type === "text" ? text.text : ""
}
