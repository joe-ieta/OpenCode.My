import { describe, expect, test } from "bun:test"
import { Option } from "effect"
import {
  compactionSections,
  confirmationSentences,
  constraintSentences,
  decodeErrorInfo,
  firstLine,
  isConfigPath,
  proposalSentences,
  sectionItems,
  sentences,
  subsectionItems,
  toolDetail,
  toolFiles,
  uniqueStatements,
} from "./extract-rules"

const summary = `## Objective
- Ship the semantic layer

## Requirements
- Do not change the timeline
- Keep the plugin read-only

## Decisions
- Use one panel for goal, decisions and actions

## Work State
### Completed
- Panel scaffold

### Active
- Extraction

### Blocked
- Persistence needs a schema

## Next Move
1. Add Action extraction

## Relevant Files
- \`types.ts\`: model
`

describe("text rules", () => {
  test("firstLine and sentences keep short readable units", () => {
    expect(firstLine("  first line\nsecond line  ")).toBe("first line")
    expect(sentences("One. Two! 三。四？")).toEqual(["One.", "Two!", "三。", "四？"])
  })

  test("constraints accept instructions and reject questions", () => {
    expect(constraintSentences("Must keep the panel read-only. Should we ship this?")).toEqual([
      "Must keep the panel read-only.",
    ])
    expect(constraintSentences("Use one panel. Keep it simple.")).toHaveLength(2)
  })

  test("proposals and confirmations are conservative", () => {
    expect(proposalSentences("I recommend one panel. The sky is blue.")).toEqual(["I recommend one panel."])
    expect(confirmationSentences("Sounds good.")).toEqual(["Sounds good."])
    expect(confirmationSentences("The sound is good.")).toEqual([])
  })

  test("compaction sections and items follow the stable headings", () => {
    expect([...compactionSections(summary).keys()]).toEqual([
      "Objective",
      "Requirements",
      "Decisions",
      "Work State",
      "Next Move",
      "Relevant Files",
    ])
    expect(sectionItems(summary, "Requirements")).toEqual([
      "Do not change the timeline",
      "Keep the plugin read-only",
    ])
    expect(sectionItems(summary, "Next Move")).toEqual(["Add Action extraction"])
    expect(subsectionItems(summary, "Work State", "Blocked")).toEqual(["Persistence needs a schema"])
  })

  test("uniqueStatements ignores case, spacing and trailing punctuation", () => {
    expect(
      uniqueStatements([
        { statement: "Use one panel." },
        { statement: " use   one panel " },
        { statement: "Keep it read-only" },
      ]),
    ).toHaveLength(2)
  })
})

describe("tool input rules", () => {
  test("toolFiles and toolDetail read the common input fields", () => {
    expect(toolFiles({ filePath: "a.ts", files: ["b.ts", "a.ts"] })).toEqual(["a.ts", "b.ts"])
    expect(toolDetail("bash", { command: "bun test" })).toBe("bun test")
    expect(toolDetail("read", { filePath: "a.ts" })).toBe("a.ts")
  })

  test("config paths are recognized without matching ordinary files", () => {
    expect(isConfigPath("package.json")).toBe(true)
    expect(isConfigPath("packages/app/tsconfig.json")).toBe(true)
    expect(isConfigPath(".env.local")).toBe(true)
    expect(isConfigPath("src/package.ts")).toBe(false)
  })

  test("error messages are read from an opaque error value", () => {
    expect(Option.getOrUndefined(decodeErrorInfo({ message: "boom" }))?.message).toBe("boom")
    expect(Option.getOrUndefined(decodeErrorInfo("boom"))?.message).toBeUndefined()
    expect(Option.getOrUndefined(decodeErrorInfo(undefined))?.message).toBeUndefined()
  })
})
