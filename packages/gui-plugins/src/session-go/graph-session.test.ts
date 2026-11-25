import { describe, expect, test } from "bun:test"
import { buildSessionGraph } from "./graph-session"
import { assistant, compaction, idle, shell, text, tool, user } from "./test-fixtures"

describe("buildSessionGraph", () => {
  test("assembles actions, evidence, goals, decisions and relations", () => {
    const messages = [
      user("msg_user", "Implement Session Go. Keep the panel read-only.", 1),
      assistant("msg_agent", [text("I recommend one panel. Should we persist candidates?"), tool("part_read", "read", { filePath: "types.ts" })], {
        created: 2,
        completed: 3,
      }),
      shell("msg_shell", "bun test", { exit: 0, created: 4, completed: 5 }),
      compaction(
        "msg_compaction",
        `## Objective
- Ship the semantic layer

## Requirements
- No model calls

## Decisions
- Use one panel

## Work State
### Blocked
- Persistence needs a schema
`,
        "completed",
        6,
      ),
      idle("msg_idle", "succeeded", 7),
    ]

    const graph = buildSessionGraph({
      sessionKey: "server\nses_1",
      messages,
      plan: [{ id: "plan_1", content: "Add extraction", status: "pending" }],
      now: 100,
    })

    expect(graph.sessionKey).toBe("server\nses_1")
    expect(graph.approximate).toBe(false)
    expect(graph.outcomes).toHaveLength(1)
    expect(graph.goals[0]).toMatchObject({ statement: "Implement Session Go. Keep the panel read-only.", status: "proposed" })
    expect(graph.actions.some((action) => action.id === "plan-plan_1")).toBe(true)
    expect(graph.actions.some((action) => action.kind === "tool")).toBe(true)
    expect(graph.evidence.some((item) => item.kind === "test" && item.status === "supports")).toBe(true)
    expect(graph.decisions.some((decision) => decision.rule === "decision.user.constraint")).toBe(true)
    expect(graph.decisions.some((decision) => decision.rule === "decision.agent.proposal")).toBe(true)
    expect(graph.decisions.some((decision) => decision.rule === "question.assistant")).toBe(true)
    expect(graph.decisions.some((decision) => decision.rule === "question.compaction.blocked")).toBe(true)
    expect(graph.edges.some((edge) => edge.kind === "produces")).toBe(true)
    expect(graph.signature).toContain("5:")
  })

  test("links the session goal to a project goal reference", () => {
    const graph = buildSessionGraph({
      sessionKey: "server\nses_project",
      messages: [user("msg_user", "Implement the panel.", 1)],
      project: { projectID: "proj_1", projectGoalID: "PG1", label: "Ship the semantic layer" },
    })

    expect(graph.goals[0]).toMatchObject({
      projectID: "proj_1",
      projectGoalID: "PG1",
    })
  })

  test("includes spent evidence in the deterministic next-decision queue inputs", () => {
    const graph = buildSessionGraph({
      sessionKey: "server\nses_2",
      messages: [
        assistant("msg_agent", [tool("part_edit", "edit", { filePath: "src/a.ts" })], {
          created: 1,
          completed: 2,
          snapshotFiles: ["src/a.ts"],
        }),
        assistant("msg_later", [text("changed again")], { created: 3, completed: 4, snapshotFiles: ["src/a.ts"] }),
      ],
    })

    expect(graph.evidence.some((item) => item.stale === true)).toBe(true)
  })
})
