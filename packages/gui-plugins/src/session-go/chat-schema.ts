import { Schema } from "effect"

export const ChatTurn = Schema.Struct({
  id: Schema.String,
  question: Schema.String,
  answer: Schema.optional(Schema.String),
})

export type ChatTurn = typeof ChatTurn.Type

export const ChatData = Schema.Struct({
  draft: Schema.String,
  turns: Schema.Array(ChatTurn),
})
