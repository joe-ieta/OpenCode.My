import type { SessionInfo } from "@opencode/client/promise"
import { pathKey } from "@/workspaces/path-key"
import { mergeRootSessionIndex } from "@/runtime/server/session-index"
import { SESSION_RECENT_LIMIT, SESSION_RECENT_WINDOW } from "@/runtime/server/global-sync/types"

export const HOME_SESSION_LIMIT = 64

// Rows kept per directory from the fetched index: the visible limit plus the
// recent-window search bucket. Merging locally known sessions and pending
// removals into this subset resolves exactly like merging into the complete
// index, so Home shows the same rows, order, and search results while the
// query cache and every per-update re-merge stay bounded by directory count.
export const HOME_SESSION_INDEX_LIMIT = HOME_SESSION_LIMIT + SESSION_RECENT_LIMIT

export function mergeHomeSessionIndex(fetched: readonly SessionInfo[], known: readonly SessionInfo[]) {
  return mergeRootSessionIndex(fetched, known).filter((session) => session.time.archived === undefined)
}

export function retainHomeSessions(sessions: SessionInfo[], limit: number, now: number) {
  return [...Map.groupBy(sessions, (session) => pathKey(session.location.directory)).values()].flatMap((items) => {
    const sorted = items.toSorted((a, b) => {
      const updated = (b.time.updated ?? b.time.created) - (a.time.updated ?? a.time.created)

      return updated || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
    })

    const recent = sorted
      .slice(limit)
      .filter((session) => (session.time.updated ?? session.time.created) > now - SESSION_RECENT_WINDOW)
      .slice(0, SESSION_RECENT_LIMIT)

    return [...sorted.slice(0, limit), ...recent]
  })
}
