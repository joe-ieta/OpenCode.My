import { Plugin, Store } from "@opencode/plugin/gui"
import en from "./i18n/en"
import {
  CandidateCacheSchema,
  CommitmentLogSchema,
  ProjectGoalsSchema,
  initialCandidateCache,
  initialCommitmentLog,
  initialProjectGoals,
} from "./model-schema"
import { SessionGoSettings, initialSettings } from "./settings-schema"
import { ChatData } from "./chat-schema"

export default Plugin.define({
  stores: {
    settings: Store.global(SessionGoSettings, initialSettings),
    candidates: Store.session(CandidateCacheSchema, initialCandidateCache),
    commitments: Store.session(CommitmentLogSchema, initialCommitmentLog),
    projectGoals: Store.global(ProjectGoalsSchema, initialProjectGoals),
    chat: Store.session(ChatData, { draft: "", turns: [] }),
  },
  i18n: { en },
})
