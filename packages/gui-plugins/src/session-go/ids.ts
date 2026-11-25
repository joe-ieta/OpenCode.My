/** The stable key of a session across servers. */
export function sessionKey(serverID: string, sessionID: string) {
  return `${serverID}\n${sessionID}`
}

/** The stable key of a fact within a session graph. */
export function factKey(kind: "goal" | "decision" | "action" | "evidence", id: string) {
  return `${kind}:${id}`
}
