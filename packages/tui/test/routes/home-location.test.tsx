import { expect, test } from "bun:test"
import { InputRenderable, TextareaRenderable } from "@opentui/core"
import path from "node:path"
import { createAppFixture } from "../fixture/app"
import { tmpdir } from "../fixture/fixture"
import { json, worktree } from "../fixture/tui-client"

const alpha = "/tmp/wt-alpha"
const beta = "/tmp/wt-beta"
const project = { id: "proj_test", directory: worktree, canonical: worktree }

test("switching Home between worktrees loads the branch of each", async () => {
  await using state = await tmpdir()
  const vcs: string[] = []
  let worktreeReads = 0
  await using setup = await createAppFixture({
    state: state.path,
    width: 120,
    fetch: (url, request) => {
      const directory = url.searchParams.get("location[directory]") ?? worktree
      if (url.pathname === "/api/location") return json({ directory, project })
      if (url.pathname === "/api/experimental/session/activity") return json({ data: [] })
      if (url.pathname === "/api/vcs") {
        vcs.push(directory)
        const branch = path.basename(directory).replace("wt-", "")
        return json({ location: { directory, project }, data: { branch: { current: branch, default: "main" } } })
      }
      if (url.pathname === "/api/worktree" && request.method === "GET") {
        worktreeReads++
        return json([
          { directory: worktree },
          { directory: alpha, strategy: "git" },
          { directory: beta, strategy: "git" },
        ])
      }
    },
  })
  await setup.ready

  // Frame waits give up after a fixed number of rendered frames, so wait for the server to answer first: on
  // slow runners (Windows) the location and vcs round trips a worktree switch needs can outlast that budget.
  async function until(description: string, check: () => boolean) {
    const deadline = Date.now() + 5_000
    while (!check()) {
      if (Date.now() >= deadline) throw new Error(`Timed out waiting for ${description}\n${setup.captureCharFrame()}`)
      await Bun.sleep(10)
    }
  }

  async function select(filter: string) {
    await until("Home prompt focus", () => {
      const input = setup.renderer.currentFocusedRenderable
      return input instanceof TextareaRenderable && !(input instanceof InputRenderable)
    })
    const reads = worktreeReads
    await setup.mockInput.typeText("/worktrees")
    await setup.renderOnce()
    setup.mockInput.pressEnter()
    await until("worktree list request", () => worktreeReads > reads)
    await setup.waitForFrame((frame) => frame.includes(alpha) && frame.includes(beta))
    await setup.waitFor(() => setup.renderer.currentFocusedRenderable instanceof InputRenderable)
    await setup.mockInput.typeText(filter)
    await setup.waitForFrame((frame) => !frame.includes(filter === "alpha" ? beta : alpha))
    setup.mockInput.pressEnter()
  }

  await select("alpha")
  await until("alpha VCS request", () => vcs.includes(alpha))
  await setup.waitForFrame((frame) => frame.includes(`${alpha}:alpha`))
  await select("beta")
  await until("beta VCS request", () => vcs.includes(beta))
  const frame = await setup.waitForFrame((frame) => frame.includes(`${beta}:beta`))

  expect(frame).toContain(`${beta}:beta`)
  expect(vcs).toContain(beta)
})
