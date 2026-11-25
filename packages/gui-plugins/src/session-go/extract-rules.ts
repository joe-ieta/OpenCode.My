import { Option, Schema } from "effect"
import type { DecisionKind, ToolInputRecord } from "./types"

const ToolInput = Schema.Struct({
  filePath: Schema.optional(Schema.String),
  path: Schema.optional(Schema.String),
  file: Schema.optional(Schema.String),
  files: Schema.optional(Schema.Array(Schema.String)),
  filePaths: Schema.optional(Schema.Array(Schema.String)),
  command: Schema.optional(Schema.String),
  pattern: Schema.optional(Schema.String),
  query: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  prompt: Schema.optional(Schema.String),
  subagent_type: Schema.optional(Schema.String),
})

const decodeToolInput = Schema.decodeUnknownOption(ToolInput)

const ErrorInfo = Schema.Struct({ message: Schema.optional(Schema.String) })

export const decodeErrorInfo = Schema.decodeUnknownOption(ErrorInfo)

const constraintPatterns = [
  /\b(must|should|shall|require|required|ensure|only|never|avoid|prefer)\b/i,
  /\b(do not|don't|must not|cannot|can't|should not|shouldn't)\b/i,
  /\b(use|keep|preserve|leave|stay|remain)\b/i,
  /必须|不要|不能|只能|采用|保持|避免|优先|禁止|需要|应该|确保|不改|保留|统一|务必/,
]

const proposalPatterns = [
  /\b(recommend|suggest|propose|we should|i would|i will|let's)\b/i,
  /建议|推荐|可以采用|可以采用|应该采用|我建议|我们可以|方案是/,
]

const confirmationPatterns = [
  /\b(ok|okay|approved?|agree|yes|sounds good|looks good)\b/i,
  /可以|同意|通过|没问题|就这样|好的|行|确认/,
]

const questionPatterns = [
  /[?？]/,
  /^\s*(should|would|could|can|do|does|did|which|what|how|why|who|when|where|is|are|will)\b/i,
  /是否|要不要|需不需要|哪一个|哪些|请确认|吗|呢/,
]

/** The first line of a text, shortened for a fact summary. */
export function firstLine(text: string, maximum = 160) {
  const line = text.trim().split(/\r?\n/, 1)[0]?.trim() ?? ""

  return truncate(line, maximum)
}

export function truncate(text: string, maximum: number) {
  if (text.length <= maximum) return text

  return text.slice(0, Math.max(0, maximum - 1)).trimEnd() + "…"
}

/** Sentences in a plain text, split on line breaks and sentence punctuation. */
export function sentences(text: string) {
  return text
    .split(/\r?\n|(?<=[.!?])\s+|(?<=[。！？])/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

export function isQuestion(text: string) {
  return questionPatterns.some((pattern) => pattern.test(text))
}

export function constraintSentences(text: string) {
  return sentences(text).filter((line) => !isQuestion(line) && constraintPatterns.some((pattern) => pattern.test(line)))
}

export function proposalSentences(text: string) {
  return sentences(text).filter((line) => proposalPatterns.some((pattern) => pattern.test(line)))
}

export function confirmationSentences(text: string) {
  return sentences(text).filter((line) => line.length <= 120 && confirmationPatterns.some((pattern) => pattern.test(line)))
}

export function decisionKind(text: string): DecisionKind {
  if (constraintPatterns.some((pattern) => pattern.test(text))) return "constraint"

  return "approach"
}

/** Parses the stable Markdown headings of a completed compaction summary. */
export function compactionSections(summary: string) {
  const result = new Map<string, string[]>()
  let heading: string | undefined

  for (const line of summary.split(/\r?\n/)) {
    const match = /^##\s+(.+?)\s*$/.exec(line)

    if (match) {
      heading = match[1]?.trim()

      if (heading) result.set(heading, [])

      continue
    }

    if (heading) result.get(heading)?.push(line)
  }

  return result
}

export function subsectionItems(summary: string, heading: string, subheading: string) {
  const lines = compactionSections(summary).get(heading) ?? []
  const result: string[] = []
  let active = false

  for (const line of lines) {
    const sub = /^###\s+(.+?)\s*$/.exec(line)

    if (sub) {
      active = sub[1]?.trim() === subheading
      continue
    }

    if (!active) continue

    const bullet = /^\s*(?:-|\d+\.)\s+(.+?)\s*$/.exec(line)
    const text = bullet?.[1]?.trim()

    if (text && text !== "(none)") result.push(text)
  }

  return result
}

export function sectionItems(summary: string, heading: string) {
  return (compactionSections(summary).get(heading) ?? []).flatMap((line) => {
    const bullet = /^\s*(?:-|\d+\.)\s+(.+?)\s*$/.exec(line)
    const text = bullet?.[1]?.trim()

    if (!text || text === "(none)") return []

    return [text]
  })
}

export function normalizeStatement(text: string) {
  return text
    .trim()
    .replace(/^[-*\d.\s]+/, "")
    .replace(/\s+/g, " ")
    .replace(/[.。!！?？:：;；,，]+$/, "")
    .toLowerCase()
}

export function uniqueStatements<T extends { statement: string }>(items: readonly T[]) {
  const seen = new Set<string>()

  return items.filter((item) => {
    const key = normalizeStatement(item.statement)

    if (!key || seen.has(key)) return false

    seen.add(key)

    return true
  })
}

export type ToolInput = typeof ToolInput.Type

export function parseToolInput(input: ToolInputRecord) {
  return Option.getOrUndefined(decodeToolInput(input))
}

export function toolFiles(input: ToolInputRecord) {
  const parsed = parseToolInput(input)

  if (!parsed) return []

  return [
    ...(parsed.filePath ? [parsed.filePath] : []),
    ...(parsed.path ? [parsed.path] : []),
    ...(parsed.file ? [parsed.file] : []),
    ...(parsed.files ?? []),
    ...(parsed.filePaths ?? []),
  ].filter((path, index, all) => path.length > 0 && all.indexOf(path) === index)
}

export function toolDetail(name: string, input: ToolInputRecord) {
  const parsed = parseToolInput(input)

  if (!parsed) return name

  const values = [
    parsed.command,
    parsed.description,
    parsed.pattern,
    parsed.query,
    parsed.filePath,
    parsed.path,
    parsed.file,
    parsed.files?.[0],
    parsed.filePaths?.[0],
  ]

  const found = values.find((value): value is string => value !== undefined && value.length > 0)

  return found ?? name
}

export function isVerificationCommand(command: string) {
  return /\b(test|typecheck|build|lint|check|vitest|jest|playwright)\b/i.test(command)
}

export function isChangeTool(name: string) {
  return /^(edit|write|patch|apply_patch)$/i.test(name)
}

export function isConfigPath(path: string) {
  return /(^|\/)(package\.json|tsconfig(\..*)?\.json|bunfig\.toml|opencode\.jsonc?|\.env(\..*)?|Dockerfile|docker-compose\.ya?ml)$/i.test(
    path,
  )
}


