import { confirmationSentences, firstLine, isVerificationCommand } from "./extract-rules"
import type { ActionNode, EvidenceNode, EvidenceStatus, ExtractionMessage } from "./types"

/** Extracts evidence from observed actions and explicit user confirmations. */
export function extractEvidence(
  actions: readonly ActionNode[],
  messages: readonly ExtractionMessage[],
  now = Date.now(),
): EvidenceNode[] {
  const evidence: EvidenceNode[] = []
  const seen = new Set<string>()

  for (const action of actions) {
    if (action.kind === "shell") {
      evidence.push(shellEvidence(action, now))
      continue
    }

    if (action.kind === "change") {
      const key = changeKey(action)

      if (seen.has(key)) continue
      seen.add(key)
      evidence.push(changeEvidence(action, now))
      continue
    }

    if (action.kind === "error" || action.status === "failed") {
      evidence.push(failureEvidence(action, now))
    }
  }

  for (const message of messages) {
    if (message.type !== "user") continue

    confirmationSentences(message.text).forEach((sentence, index) => {
      evidence.push({
        id: `evidence-user-${message.id}-${index}`,
        kind: "user-confirmation",
        summary: firstLine(sentence),
        status: "supports",
        freshAt: message.time.created,
        source: { messageID: message.id },
        confidence: "medium",
        rule: "evidence.user",
      })
    })
  }

  return markStaleEvidence(evidence, actions)
}

/** Marks evidence stale when a later change touches one of the files it covers. */
export function markStaleEvidence(evidence: readonly EvidenceNode[], actions: readonly ActionNode[]) {
  return evidence.map((item) => {
    if (!item.files?.length || item.freshAt === undefined) return item

    const freshAt = item.freshAt
    const files = item.files

    const stale = actions.some((action) => {
      const time = action.endedAt ?? action.startedAt

      return (
        time !== undefined &&
        time > freshAt &&
        action.files?.some((file) => files.includes(file)) === true
      )
    })

    return stale ? { ...item, stale: true } : item
  })
}

function shellEvidence(action: ActionNode, now: number): EvidenceNode {
  const verification = isVerificationCommand(action.summary)

  return {
    id: `evidence-${action.id}`,
    kind: verification ? "test" : "command",
    summary: action.summary,
    status: shellStatus(action.status),
    freshAt: action.endedAt ?? action.startedAt ?? now,
    files: action.files,
    source: { messageID: action.source.messageID, actionID: action.id },
    confidence: "high",
    rule: verification ? "evidence.test" : "evidence.command",
  }
}

function changeEvidence(action: ActionNode, now: number): EvidenceNode {
  return {
    id: `evidence-${action.id}`,
    kind: "diff",
    summary: action.summary,
    status: "supports",
    freshAt: action.endedAt ?? action.startedAt ?? now,
    files: action.files,
    source: { messageID: action.source.messageID, actionID: action.id },
    confidence: "high",
    rule: "evidence.diff",
  }
}

function failureEvidence(action: ActionNode, now: number): EvidenceNode {
  return {
    id: `evidence-${action.id}`,
    kind: "tool",
    summary: firstLine(action.summary || action.name || ""),
    status: "refutes",
    freshAt: action.endedAt ?? action.startedAt ?? now,
    files: action.files,
    source: { messageID: action.source.messageID, actionID: action.id },
    confidence: "high",
    rule: "evidence.tool",
  }
}

function shellStatus(status: ActionNode["status"]): EvidenceStatus {
  if (status === "succeeded") return "supports"

  if (status === "failed") return "refutes"

  return "inconclusive"
}

function changeKey(action: ActionNode) {
  return `change:${action.source.messageID ?? ""}:${[...(action.files ?? [])].sort().join(",")}`
}
