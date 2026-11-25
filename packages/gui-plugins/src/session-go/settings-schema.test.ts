import { describe, expect, test } from "bun:test"
import { Schema } from "effect"
import { SessionGoSettings, initialSettings } from "./settings-schema"

describe("Session Go settings", () => {
  test("a fresh profile enables Session Go", () => {
    expect(initialSettings.enabled).toBe(true)
    expect(Schema.decodeUnknownSync(SessionGoSettings)(initialSettings).enabled).toBe(true)
  })
})
