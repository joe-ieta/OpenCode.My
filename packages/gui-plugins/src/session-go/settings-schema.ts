import { Schema } from "effect"

/** The plugin settings. Every field is stored now so later phases can wire it without a migration. */
export const SessionGoSettings = Schema.Struct({
  enabled: Schema.Boolean,
  keepAnalysis: Schema.Boolean,
  commitments: Schema.Boolean,
  modelAnalysis: Schema.Boolean,
  autoAnalyze: Schema.Boolean,
  historyIndex: Schema.Boolean,
})

export const initialSettings = {
  enabled: true,
  keepAnalysis: true,
  commitments: true,
  modelAnalysis: true,
  autoAnalyze: false,
  historyIndex: false,
}
