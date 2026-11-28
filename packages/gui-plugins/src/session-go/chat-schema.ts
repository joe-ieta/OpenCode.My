import { Schema } from "effect"
import { Model } from "@opencode/schema/model"
import { TokenUsage } from "@opencode/schema/token-usage"
import { Money } from "@opencode/schema/money"

export const ChatTurn = Schema.Struct({
  id: Schema.String,
  question: Schema.String,
  answer: Schema.optional(Schema.String),
  tokens: TokenUsage.Info.pipe(Schema.optionalKey),
  cost: Money.USD.pipe(Schema.optionalKey),
})

export type ChatTurn = typeof ChatTurn.Type

export const ChatData = Schema.Struct({
  draft: Schema.String,
  turns: Schema.Array(ChatTurn),
  model: Model.Ref.pipe(Schema.optionalKey),
})
