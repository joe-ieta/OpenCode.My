import type { SessionMessageInfo } from "@opencode/client/promise"
import { expect, test, type Page } from "@playwright/test"
import { pageMessagesFrom } from "../utils/app"
import { fileDiff, fileNode, openSession } from "../utils/workspace"
import { openFileLauncher, openReviewLauncher, storedStrips } from "../utils/side-panel"
import { expectSessionTitle } from "../utils/waits"
import { base64Encode } from "@opencode/util/encode"
import { Schema } from "effect"

test("review content stays aligned with the side region in both directions", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 })

  // A large nested branch diff; its first file is the sentinel that proves the virtualized tree stays mounted.
  const diffs = [
    fileDiff(".github/actions/setup-bun/action.yml", { additions: 7 }),
    ...Array.from({ length: 2_739 }, (_, index) =>
      fileDiff(
        `src/branch/d${String(Math.floor(index / 100)).padStart(5, "0")}/generated-${String(index).padStart(4, "0")}.ts`,
        { additions: 100, loaded: false },
      ),
    ),
  ]

  await openSession(page, { name: "SideStack", vcsDiff: diffs })
  const toggle = page.getByRole("button", { name: "Toggle review" })
  await toggle.click()
  await openReviewLauncher(page.locator("#review-panel"))
  await expectTreeSentinel(page)

  for (const direction of ["ltr", "rtl"] as const) {
    await page.evaluate((direction) => (document.documentElement.dir = direction), direction)
    await expect.poll(() => sideContentOffset(page, direction)).toBeLessThanOrEqual(1)
  }

  await page.reload()
  await expect(page.locator("#review-panel")).toBeVisible()
  await expectTreeSentinel(page)
})

test("new tab selection and closing stay in the focused pane", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const directory = "C:/OpenCode/PaneNewTabs"
  const key = `local\u0000${base64Encode(directory)}/ses_panenewtabs`

  await openSession(page, {
    name: "PaneNewTabs",
    fileList: () => [],
    fileContent: (path) => ({ type: "text", content: `contents:${path}` }),
    seed: {
      panes: { ses_panenewtabs: { review: true } },
      storage: {
        "opencode.global.dat:layout": {
          sessionTabs: {
            [key]: {
              all: ["file://README.md", "file://notes.md"],
              active: "file://README.md",
              panes: { "file://notes.md": "split" },
              selected: { side: "file://README.md", split: "file://notes.md" },
            },
          },
        },
      },
    },
  })

  const side = page.locator('[data-pane-content="side"]')
  const split = page.locator('[data-pane-content="split"]')
  const mod = (await page.evaluate(() => /Mac|iPhone|iPad/.test(navigator.platform))) ? "Meta" : "Control"
  const sideTabs = side.getByRole("tab", { name: "New tab", exact: true })
  const splitTabs = split.getByRole("tab", { name: "New tab", exact: true })
  await expect(side.getByRole("tab", { name: "README.md", exact: true })).toHaveAttribute("aria-selected", "true")
  await expect(split.getByRole("tab", { name: "notes.md", exact: true })).toHaveAttribute("aria-selected", "true")

  await side.getByRole("button", { name: "Add tab", exact: true }).click()
  await expect(sideTabs).toHaveCount(1)
  await side.getByRole("button", { name: "Add tab", exact: true }).click()
  await expect(sideTabs).toHaveCount(2)
  // Pick the older New tab, so a fallback to the newest one cannot pass unnoticed.
  await sideTabs.nth(0).click()
  await expect(sideTabs.nth(0)).toHaveAttribute("aria-selected", "true")

  await split.getByRole("button", { name: "Add tab", exact: true }).click()
  await expect(splitTabs).toHaveAttribute("aria-selected", "true")
  await expect(sideTabs.nth(0)).toHaveAttribute("aria-selected", "true")
  await expect(sideTabs.nth(1)).toHaveAttribute("aria-selected", "false")

  await splitTabs.click()
  await splitTabs.press(`${mod}+w`)
  await expect(splitTabs).toHaveCount(0)
  await expect(split.getByRole("tab", { name: "notes.md", exact: true })).toHaveAttribute("aria-selected", "true")
  await expect(sideTabs).toHaveCount(2)
  await expect(sideTabs.nth(0)).toHaveAttribute("aria-selected", "true")

  // With focus on the region itself, close falls back to the active pane, not another pane's New tab.
  await split.getByRole("tab", { name: "notes.md", exact: true }).click()
  await page.locator("#review-panel").focus()
  await page.keyboard.press(`${mod}+w`)
  await expect(split).toHaveCount(0)
  await expect(sideTabs).toHaveCount(2)
  await expect(sideTabs.nth(0)).toHaveAttribute("aria-selected", "true")
})

test("closing another pane's tab keeps the side pane's New tab", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const directory = "C:/OpenCode/OtherPaneClose"
  const key = `local\u0000${base64Encode(directory)}/ses_otherpaneclose`

  await openSession(page, {
    name: "OtherPaneClose",
    fileList: () => [],
    fileContent: (path) => ({ type: "text", content: `contents:${path}` }),
    seed: {
      panes: { ses_otherpaneclose: { review: true } },
      storage: {
        "opencode.global.dat:layout": {
          sessionTabs: {
            // The side pane selects nothing of its own, so it shows its fallback tab while the split pane is active.
            [key]: {
              all: ["review:changes", "file://README.md", "file://notes.md"],
              active: "file://notes.md",
              panes: { "file://notes.md": "split" },
              selected: { split: "file://notes.md" },
            },
          },
        },
      },
    },
  })

  const side = page.locator('[data-pane-content="side"]')
  const split = page.locator('[data-pane-content="split"]')
  const sideNewTab = side.getByRole("tab", { name: "New tab", exact: true })
  await expect(side.getByRole("tab", { name: "README.md", exact: true })).toHaveAttribute("aria-selected", "true")

  await side.getByRole("button", { name: "Add tab", exact: true }).click()
  await expect(sideNewTab).toHaveAttribute("aria-selected", "true")

  // The selection falls back to the side pane's first tab, which is already listed there: no launcher opened it.
  await split.getByRole("tab", { name: "notes.md", exact: true }).hover()
  await split
    .locator('div[data-value="file://notes.md"]')
    .getByRole("button", { name: "Close tab", exact: true })
    .click()
  await expect(split).toHaveCount(0)
  await expect(sideNewTab).toHaveCount(1)
  await expect(sideNewTab).toHaveAttribute("aria-selected", "true")
})

test("closing the last New tab closes the side region, and only a New tab lists the launchers", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await openSession(page, { name: "LastNewTab", seed: { panes: { ses_lastnewtab: { review: true } } } })

  const panel = page.locator("#review-panel")
  const toggle = page.getByRole("button", { name: "Toggle review", exact: true })
  const newTab = panel.getByRole("tab", { name: "New tab", exact: true })
  const review = panel.getByRole("button", { name: /^Review/ })

  // An empty side region opens on a New tab listing the launchers.
  await expect(newTab).toHaveAttribute("aria-selected", "true")
  await expect(review).toBeVisible()

  // Closing it leaves no tab, so the region closes rather than listing the launchers without one.
  await newTab.locator("..").getByRole("button", { name: "Close tab" }).click()
  await expect(toggle).toHaveAttribute("aria-expanded", "false")

  await toggle.click()
  await expect(newTab).toHaveAttribute("aria-selected", "true")
  await expect(review).toBeVisible()

  // Closing and reopening the region keeps its one New tab instead of adding another each time.
  for (const _ of [1, 2, 3]) {
    await toggle.click()
    await expect(toggle).toHaveAttribute("aria-expanded", "false")
    await toggle.click()
    await expect(toggle).toHaveAttribute("aria-expanded", "true")
    await expect(newTab).toHaveCount(1)
  }
})

test("New tabs stay when a launcher in another one opens a tab, or when the tab before them closes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await openSession(page, { name: "ManyNewTabs", seed: { panes: { ses_manynewtabs: { review: true } } } })

  const panel = page.locator("#review-panel")
  const toggle = page.getByRole("button", { name: "Toggle review", exact: true })
  const newTabs = panel.getByRole("tab", { name: "New tab", exact: true })
  const review = panel.getByRole("tab", { name: "Review", exact: true })

  await expect(newTabs).toHaveCount(1)
  await panel.getByRole("button", { name: "Add tab", exact: true }).click()
  await panel.getByRole("button", { name: "Add tab", exact: true }).click()
  await expect(newTabs).toHaveCount(3)
  await expect(newTabs.nth(2)).toHaveAttribute("aria-selected", "true")

  // A launcher in the middle New tab replaces only that one.
  await newTabs.nth(1).click()
  await openReviewLauncher(panel)
  await expect(review).toHaveAttribute("aria-selected", "true")
  await expect(newTabs).toHaveCount(2)

  // Selecting another tab keeps the New tabs too.
  await newTabs.nth(0).click()
  await expect(newTabs.nth(0)).toHaveAttribute("aria-selected", "true")
  await review.click()
  await expect(review).toHaveAttribute("aria-selected", "true")
  await expect(newTabs).toHaveCount(2)

  // Closing the strip's first tab shows a New tab instead of closing the region.
  await review.hover()
  await panel
    .locator('div[data-value="review:changes"]')
    .getByRole("button", { name: "Close tab", exact: true })
    .click()
  await expect(review).toHaveCount(0)
  await expect(toggle).toHaveAttribute("aria-expanded", "true")
  await expect(newTabs).toHaveCount(2)
  await expect(newTabs.nth(1)).toHaveAttribute("aria-selected", "true")

  // The region closes with its last New tab.
  await newTabs.nth(0).click({ button: "middle" })
  await expect(newTabs).toHaveCount(1)
  await newTabs.click({ button: "middle" })
  await expect(toggle).toHaveAttribute("aria-expanded", "false")
})

test("tabs in a narrow side strip shrink to keep their close buttons, and a tab's menu closes the others or those to its right", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1000, height: 700 })
  const directory = "C:/OpenCode/NarrowStrip"
  const key = `local\u0000${base64Encode(directory)}/ses_narrowstrip`
  const files = ["a.md", "a-file-name-long-enough-to-overflow-the-side-strip-by-itself.md", "b.md"]

  await openSession(page, {
    name: "NarrowStrip",
    fileList: () => [],
    fileContent: (path) => ({ type: "text", content: `contents:${path}` }),
    seed: {
      panes: { ses_narrowstrip: { review: true, sessionWidth: 640 } },
      storage: {
        "opencode.global.dat:layout": {
          sessionTabs: { [key]: { all: files.map((file) => `file://${file}`), active: `file://${files[1]}` } },
        },
      },
    },
  })

  const side = page.locator('[data-pane-content="side"]')
  const add = side.getByRole("button", { name: "Add tab", exact: true })
  await expect(side.getByRole("tab", { name: files[1], exact: true })).toHaveAttribute("aria-selected", "true")

  // Every tab's close button stays left of "+", instead of the strip scrolling it away under its edge fade.
  const end = (await add.boundingBox())!.x
  const closes = side.locator('[data-pane-strip="side"] [data-slot="tabs-trigger-close-button"]')
  await expect(closes).toHaveCount(files.length)

  for (const close of await closes.all()) {
    const box = (await close.boundingBox())!
    expect(box.x + box.width).toBeLessThanOrEqual(end)
  }

  await side.getByRole("tab", { name: files[1], exact: true }).click({ button: "right" })
  await page.getByRole("menuitem", { name: "Close tabs to the right", exact: true }).click()
  await expect(side.getByRole("tab")).toHaveText(["a.md", files[1]])

  await side.getByRole("tab", { name: "a.md", exact: true }).click({ button: "right" })
  await page.getByRole("menuitem", { name: "Close other tabs", exact: true }).click()
  await expect(side.getByRole("tab")).toHaveCount(1)
  await expect(side.getByRole("tab", { name: "a.md", exact: true })).toHaveAttribute("aria-selected", "true")

  // With nothing else to close, the menu offers only the tab itself.
  await side.getByRole("tab", { name: "a.md", exact: true }).click({ button: "right" })
  await expect(page.getByRole("menuitem", { name: "Close other tabs", exact: true })).toBeDisabled()
  await expect(page.getByRole("menuitem", { name: "Close tabs to the right", exact: true })).toBeDisabled()
  await page.getByRole("menuitem", { name: "Close tab", exact: true }).click()
  await expect(side.getByRole("tab", { name: "a.md", exact: true })).toHaveCount(0)
})

test("a reopened side tab returns to where it closed", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const directory = "C:/OpenCode/ReopenPlace"
  const key = `local\u0000${base64Encode(directory)}/ses_reopenplace`
  const files = ["a.md", "b.md", "c.md"]

  await openSession(page, {
    name: "ReopenPlace",
    fileList: () => [],
    fileContent: (path) => ({ type: "text", content: `contents:${path}` }),
    seed: {
      panes: { ses_reopenplace: { review: true } },
      storage: {
        "opencode.global.dat:layout": {
          sessionTabs: { [key]: { all: files.map((file) => `file://${file}`), active: "file://b.md" } },
        },
      },
    },
  })

  const side = page.locator('[data-pane-content="side"]')
  await expect(side.getByRole("tab", { name: "b.md", exact: true })).toHaveAttribute("aria-selected", "true")

  await page.getByRole("textbox", { name: "Prompt", exact: true }).click()
  await page.keyboard.press("ControlOrMeta+w")
  await expect(side.getByRole("tab")).toHaveText(["a.md", "c.md"])

  await page.keyboard.press("ControlOrMeta+Shift+t")
  await expect(side.getByRole("tab")).toHaveText(["a.md", "b.md", "c.md"])
  await expect(side.getByRole("tab", { name: "b.md", exact: true })).toHaveAttribute("aria-selected", "true")
})

// The layout stores the side tabs of 50 sessions. It ranked them only by when each was last on screen in this run, so
// after a restart, or once enough other sessions were used, it forgot a session that was still open in a shell tab:
// its file, review, terminal and browser tabs were gone when the person switched back to it.
test("a session open in a shell tab keeps its side tabs when the layout forgets old sessions, at startup and after a scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const directory = "C:/OpenCode/KeepOpenStrip"
  const key = (session: string) => `local\u0000${base64Encode(directory)}/${session}`
  // Fifty-one sessions whose shell tabs are closed, oldest first, then the one open in a background shell tab.
  const closed = Array.from({ length: 51 }, (_, index) => key(`ses_closed_${String(index).padStart(2, "0")}`))
  const strip = { all: ["file://notes.md"], active: "file://notes.md" }

  await openSession(page, {
    name: "KeepOpenStrip",
    sessions: [
      { id: "ses_onscreen", title: "On screen" },
      { id: "ses_background", title: "In the background" },
    ],
    fileList: () => [fileNode(directory, "long.txt")],
    fileContent: (path) => ({ type: "text", content: path === "long.txt" ? Array.from({ length: 400 }, (_, index) => `line ${index + 1}`).join("\n") : `contents:${path}` }),
    seed: {
      panes: { ses_background: { review: true } },
      storage: {
        "opencode.global.dat:layout": {
          sessionTabs: Object.fromEntries([...closed.map((item) => [item, strip]), [key("ses_background"), strip]]),
        },
      },
    },
  })

  // Startup: 52 stored strips. The two oldest closed sessions go; the open one, stored last and not used yet, stays.
  await expect.poll(() => storedStrips(page)).toEqual([...closed.slice(2), key("ses_background")])

  // The person opens a file in the session on screen and scrolls it, which stores a 51st session and prunes again.
  const panel = page.locator("#review-panel")
  await page.getByRole("button", { name: "Toggle review" }).click()
  await openFileLauncher(panel)
  await panel.getByRole("treeitem", { name: "long.txt" }).click()
  await expect(panel.getByRole("tab", { name: "long.txt", exact: true })).toHaveAttribute("aria-selected", "true")
  const code = panel.locator("[data-scrollable]", { has: page.locator('[data-component="file"]') })
  await expect.poll(() => code.evaluate((element) => element.scrollHeight - element.clientHeight)).toBeGreaterThan(0)
  await code.hover()
  await page.mouse.wheel(0, 2_000)
  await expect.poll(() => storedStrips(page)).toEqual([...closed.slice(3), key("ses_background"), key("ses_onscreen")])

  // Its side tab is there when the person switches to it.
  await page.locator("[data-titlebar-tab-slot]", { hasText: "In the background" }).click()
  await expectSessionTitle(page, "In the background")
  await expect(panel.getByRole("tab", { name: "notes.md", exact: true })).toHaveAttribute("aria-selected", "true")
  await expect(panel.getByText("contents:notes.md", { exact: true })).toBeVisible()
})


const SESSION_GO_SETTINGS = "opencode.global.dat:plugin.session-go.settings"

const sessionGoEnabled = {
  enabled: true,
  keepAnalysis: true,
  commitments: true,
  modelAnalysis: false,
  autoAnalyze: false,
  historyIndex: false,
}

const sessionGoDisabled = { ...sessionGoEnabled, enabled: false }

function sessionGoTurnMessages(count = 12): SessionMessageInfo[] {
  const reply = Array.from({ length: 8 }, (_, index) => "Reply line " + (index + 1) + " keeps the turn tall enough to scroll.").join("\n")

  return Array.from({ length: count }, (_, index) => {
    const created = sessionGoTime + index * 10

    return [
      {
        id: "msg_turn_" + index + "_user",
        type: "user",
        text: "Turn " + (index + 1) + " request: inspect the session and continue.",
        time: { created },
      },
      {
        id: "msg_turn_" + index + "_agent",
        type: "assistant",
        agent: "build",
        model: sessionGoModel,
        content: [{ type: "text", text: reply }],
        time: { created: created + 1, completed: created + 2 },
      },
    ] satisfies SessionMessageInfo[]
  }).flat()
}

test("Session Go is enabled for a fresh profile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await openSession(page, { name: "SessionGoDefault" })

  await expect(page.getByRole("button", { name: "Open Session Go", exact: true })).toBeVisible()
  await expect(page.locator('[data-component="session-go-fab"]')).toBeVisible()
})

test("Session Go keeps a multi-round side conversation beside its overview without admitting prompts", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  const prompts: unknown[] = []
  const generations: { sessionID: string; prompt: string }[] = []

  const workspace = await openSession(page, {
    name: "SessionGoChat",
    sessions: [{ id: "ses_go_main", title: "Go main" }, { id: "ses_go_other", title: "Go other" }],
    seed: { storage: { [SESSION_GO_SETTINGS]: sessionGoEnabled } },
    pageMessages: () => ({ items: sessionGoMessages() }),
    onPrompt: (input) => prompts.push(input),
    generate: (input) => {
      generations.push(input)

      return { text: generations.length === 1 ? "Build the Go side conversation." : "Confirm the panel layout." }
    },
  })

  const overview = page.locator('[data-component="session-go-floating"]')
  const chat = page.locator('[data-component="session-go-chat-floating"]')
  const fab = page.locator('[data-component="session-go-fab"]').getByRole("button")
  await fab.click()
  const open = overview.getByRole("button", { name: "Open Go chat", exact: true })
  await expect(open).toBeVisible()
  await open.click()
  const input = chat.getByRole("textbox", { name: "Ask Go", exact: true })
  await expect(input).toBeEditable()
  await expect(overview).toBeVisible()

  const bounds = await page.evaluate(() => {
    const main = document.querySelector('[data-component="session-go-floating"]')?.getBoundingClientRect()
    const side = document.querySelector('[data-component="session-go-chat-floating"]')?.getBoundingClientRect()

    return main && side
      ? { mainRight: main.right, sideLeft: side.left, sideRight: side.right, width: innerWidth }
      : undefined
  })

  expect(bounds?.sideLeft).toBeGreaterThan(bounds?.mainRight ?? Infinity)
  expect(bounds?.sideRight).toBeLessThanOrEqual(bounds?.width ?? 0)
  await input.fill("What is the goal?")
  await input.press("Enter")
  await expect(chat.getByText("Build the Go side conversation.", { exact: true })).toBeVisible()
  await input.fill("What remains?")
  await chat.getByRole("button", { name: "Send", exact: true }).click()
  await expect(chat.getByText("Confirm the panel layout.", { exact: true })).toBeVisible()
  expect(generations).toHaveLength(2)
  expect(generations[1]?.sessionID).toBe(workspace.session.id)
  expect(generations[1]?.prompt).toContain("What is the goal?")
  expect(generations[1]?.prompt).toContain("Build the Go side conversation.")
  expect(generations[1]?.prompt).toContain("What remains?")
  expect(prompts).toEqual([])
  await input.fill("An unsent follow-up")
  await chat.getByRole("button", { name: "Collapse Go chat", exact: true }).click()
  await expect(chat).toBeHidden()
  await expect(overview).toBeVisible()
  await overview.getByRole("button", { name: "Open Go chat", exact: true }).click()
  await expect(input).toHaveValue("An unsent follow-up")
  await expect(chat.getByText("Build the Go side conversation.", { exact: true })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath("go-chat-pair.png") })
  await page.reload()
  await expect(fab).toBeVisible()
  await fab.click()
  await overview.getByRole("button", { name: "Open Go chat", exact: true }).click()
  await expect(input).toHaveValue("An unsent follow-up")
  await expect(chat.getByText("Confirm the panel layout.", { exact: true })).toBeVisible()
  expect(generations).toHaveLength(2)
  expect(prompts).toEqual([])
  await page.locator("[data-titlebar-tab-slot]", { hasText: "Go other" }).click()
  await expectSessionTitle(page, "Go other")
  await fab.click()
  await overview.getByRole("button", { name: "Open Go chat", exact: true }).click()
  await expect(input).toHaveValue("")
  await expect(chat.getByText("Build the Go side conversation.", { exact: true })).toHaveCount(0)
  await input.fill("Other session question")
  await input.press("Enter")
  await expect(chat.getByText("Confirm the panel layout.", { exact: true })).toBeVisible()
  expect(generations[2]?.sessionID).toBe("ses_go_other")
  expect(generations[2]?.prompt).not.toContain("What is the goal?")
  expect(prompts).toEqual([])
  await page.setViewportSize({ width: 820, height: 900 })
  await expect(overview).toBeVisible()
  await expect(chat).toBeVisible()
  await expect.poll(async () => {
    const main = await overview.boundingBox()
    const side = await chat.boundingBox()

    return !!main && !!side && side.x >= main.x + main.width && side.x + side.width <= 820
  }).toBe(true)
  await expect(input).toBeEditable()
  await page.screenshot({ path: testInfo.outputPath("go-chat-narrow.png") })
})

test("Session Go answers while collapsed and makes cancelled and blank answers recoverable", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  const held = Promise.withResolvers<void>()
  const cancelled = Promise.withResolvers<void>()
  const attempts: string[] = []
  await openSession(page, {
    name: "SessionGoChatRecovery",
    seed: { storage: { [SESSION_GO_SETTINGS]: sessionGoEnabled } },
    generate: async (input) => {
      const question = Schema.decodeUnknownSync(Schema.fromJsonString(Schema.Struct({ question: Schema.String })))(
        input.prompt.split("\n\n").at(-1),
      ).question

      attempts.push(question)

      if (question === "slow answer") {
        await held.promise

        return { text: "The background answer arrived." }
      }

      if (question === "cancel this") {
        await cancelled.promise

        return { text: "Discard this late answer." }
      }

      return {
        text: attempts.filter((prompt) => prompt.includes("blank answer")).length === 1 ? " " : "Recovered answer.",
      }
    },
  })
  const overview = page.locator('[data-component="session-go-floating"]')
  const chat = page.locator('[data-component="session-go-chat-floating"]')
  await page.locator('[data-component="session-go-fab"]').getByRole("button").click()
  await overview.getByRole("button", { name: "Open Go chat", exact: true }).click()
  const input = chat.getByRole("textbox", { name: "Ask Go", exact: true })
  await expect(input).toBeEditable()
  await input.fill("slow answer")
  await input.press("Enter")
  await expect(chat.getByRole("button", { name: "Cancel", exact: true })).toBeVisible()
  await chat.getByRole("button", { name: "Collapse Go chat", exact: true }).click()
  held.resolve()
  await overview.getByRole("button", { name: "Open Go chat", exact: true }).click()
  await expect(chat.getByText("The background answer arrived.", { exact: true })).toBeVisible()
  await input.fill("cancel this")
  await input.press("Enter")
  await chat.getByRole("button", { name: "Cancel", exact: true }).click()
  await expect(input).toHaveValue("cancel this")
  cancelled.resolve()
  await input.fill("blank answer")
  await input.press("Enter")
  await expect(chat.getByText("The model replied without any text. Try again.", { exact: true })).toBeVisible()
  await chat.getByRole("button", { name: "Retry", exact: true }).click()
  await expect(chat.getByText("Recovered answer.", { exact: true })).toBeVisible()
  await expect(chat.getByText("Discard this late answer.", { exact: true })).toHaveCount(0)
})

test("Session Go stays off when disabled and has no command entry", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await openSession(page, {
    name: "SessionGoOff",
    seed: { storage: { [SESSION_GO_SETTINGS]: sessionGoDisabled } },
  })

  await expect(page.getByRole("button", { name: "Open Session Go", exact: true })).toHaveCount(0)
  await expect(page.locator('[data-component="session-go-fab"]')).toHaveCount(0)

  await page.keyboard.press("ControlOrMeta+Shift+P")
  const palette = page.getByRole("dialog")
  const input = palette.getByRole("combobox")
  await expect(input).toBeFocused()
  await input.fill("Open Session Go")
  await expect(palette.getByRole("option", { name: /Open Session Go/ })).toHaveCount(0)
  await page.keyboard.press("Escape")
})

const sessionGoModel = { id: "test", providerID: "opencode" } as const

const sessionGoTime = 1_750_000_000_000

const sessionGoal = "Keep the message timeline unchanged. Add a Session Go panel."

const sessionConstraint = "Keep the message timeline unchanged."

const sessionProposal = "I suggest one side panel for goals and decisions."

const sessionTestCommand = "bun test src/session-go"

function sessionGoMessages() {
  return [
    {
      id: "msg_user",
      type: "user",
      text: sessionGoal,
      time: { created: sessionGoTime },
    },
    {
      id: "msg_agent",
      type: "assistant",
      agent: "build",
      model: sessionGoModel,
      content: [{ type: "text", text: sessionProposal }],
      time: { created: sessionGoTime + 1, completed: sessionGoTime + 2 },
    },
    {
      id: "msg_idle",
      type: "idle",
      outcome: "succeeded",
      time: { created: sessionGoTime + 2 },
    },
    {
      id: "msg_shell",
      type: "shell",
      shellID: "sh_session_go",
      command: sessionTestCommand,
      status: "exited",
      exit: 0,
      time: { created: sessionGoTime + 3, completed: sessionGoTime + 4 },
    },
  ] satisfies SessionMessageInfo[]
}

test("Session Go opens from the header and records confirmed facts", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await openSession(page, {
    name: "SessionGo",
    seed: { storage: { [SESSION_GO_SETTINGS]: sessionGoEnabled } },
    pageMessages: () => ({ items: sessionGoMessages() }),
  })

  const floatingPanel = page.locator('[data-component="session-go-floating"] [data-component="session-go-panel"]')
  const fab = page.locator('[data-component="session-go-fab"]')
  const fabButton = fab.getByRole("button")
  await expect(fabButton).toBeVisible()
  await expect(fabButton).toHaveAttribute("aria-label", "Open Session Go panel")
  await expect(fabButton).toHaveAttribute("aria-pressed", "false")

  await fabButton.click()
  await expect(floatingPanel).toBeVisible()
  await expect(fabButton).toHaveAttribute("aria-label", "Close Session Go panel")
  await expect(fabButton).toHaveAttribute("aria-pressed", "true")

  await page.locator('[data-component="composer-editor"]').click()
  await expect(floatingPanel).toBeHidden()
  await expect(fabButton).toHaveAttribute("aria-label", "Open Session Go panel")
  await expect(fabButton).toHaveAttribute("aria-pressed", "false")

  await fabButton.click()
  await expect(floatingPanel).toBeVisible()
  await fabButton.click()
  await expect(floatingPanel).toBeHidden()

  const open = page.getByRole("button", { name: "Open Session Go", exact: true })
  await expect(open).toBeVisible()
  await open.click()
  const panel = page.locator('#review-panel [data-component="session-go-panel"]')
  await expect(panel).toBeVisible()

  const goal = panel.locator('[data-section="goal"]')
  await expect(goal.getByRole("heading", { name: "Goal", exact: true })).toBeVisible()
  await expect(goal.getByText("Ship SessionGo", { exact: true })).toBeVisible()
  await expect(goal.getByText("Placeholder", { exact: true })).toBeVisible()
  await expect(goal.getByText(sessionGoal, { exact: true })).toBeVisible()

  const next = panel.locator('[data-section="next"]')
  await expect(next.getByRole("heading", { name: "Next decision", exact: true })).toBeVisible()
  await expect(next.getByText(sessionConstraint, { exact: true })).toBeVisible()

  const decisions = panel.locator('[data-section="decisions"]')
  const constraint = decisions.locator('[data-decision="decision-user-msg_user-0"]')
  await expect(constraint.getByText(sessionConstraint, { exact: true })).toBeVisible()
  await expect(constraint.getByText("Proposed", { exact: true })).toBeVisible()
  await expect(constraint.getByText("Constraint", { exact: true })).toBeVisible()

  await constraint.getByRole("button", { name: "Confirm", exact: true }).click()
  await expect(constraint.getByText("Active", { exact: true })).toBeVisible()
  await expect(constraint.getByText("Confirmed", { exact: true })).toBeVisible()

  const proposal = decisions.locator('[data-decision="decision-agent-msg_agent-0"]')
  await expect(proposal.getByText(sessionProposal, { exact: true })).toBeVisible()
  await proposal.getByRole("button", { name: "Defer", exact: true }).click()
  await expect(proposal.getByText("Deferred", { exact: true })).toBeVisible()
  await expect(next.getByText("Nothing needs a decision right now.", { exact: true })).toBeVisible()

  await proposal.getByRole("button", { name: "Reject", exact: true }).click()
  await expect(proposal.getByText("Dropped", { exact: true })).toBeVisible()

  const actions = panel.locator('[data-section="actions"]')
  const shellAction = actions.locator('[data-action="shell-msg_shell"]')
  await expect(shellAction.getByText(sessionTestCommand, { exact: true }).first()).toBeVisible()
  const evidence = shellAction.getByRole("button", { name: "Evidence (1)", exact: true })
  await expect(evidence).toContainText("¶")
  await expect(evidence).toHaveAttribute("aria-expanded", "false")
  await expect(shellAction.getByText("Test", { exact: true })).toHaveCount(0)

  await evidence.click()
  await expect(evidence).toHaveAttribute("aria-expanded", "true")
  await expect(shellAction.getByText("Test", { exact: true })).toBeVisible()
  await expect(shellAction.getByText("Fresh", { exact: true })).toBeVisible()

  await shellAction.getByRole("button", { name: "Promote to decision", exact: true }).click()
  const promoted = decisions.locator('[data-decision="promoted-shell-msg_shell"]')
  await expect(promoted.getByText(sessionTestCommand, { exact: true })).toBeVisible()
  await expect(promoted.getByText("Active", { exact: true })).toBeVisible()

  await shellAction.getByRole("button", { name: "Link to goal", exact: true }).click()
  await expect(shellAction.getByRole("button", { name: "Linked to G1", exact: true })).toBeVisible()

  await shellAction.getByRole("button", { name: "Link to decision", exact: true }).click()
  await expect(
    shellAction.getByRole("button", { name: "Linked to promoted-shell-msg_shell", exact: true }),
  ).toBeVisible()

  await actions.getByRole("button", { name: "Relations", exact: true }).click()
  const relation = actions.locator('[data-relation="promoted-shell-msg_shell"]')
  await expect(relation.getByText(sessionTestCommand, { exact: true }).first()).toBeVisible()

  await constraint.getByRole("button", { name: "Supersede", exact: true }).click()
  await constraint.getByRole("button", { name: sessionTestCommand, exact: true }).click()
  await expect(constraint.getByText("Superseded", { exact: true })).toBeVisible()

  const side = page.locator("#review-panel")
  await side
    .getByRole("tab", { name: "Session Go", exact: true })
    .locator("..")
    .getByRole("button", { name: "Close tab", exact: true })
    .click()
  await expect(panel).toHaveCount(0)

  await page.keyboard.press("ControlOrMeta+Shift+P")
  const palette = page.getByRole("dialog")
  const input = palette.getByRole("combobox")
  await expect(input).toBeFocused()
  await input.fill("Open Session Go")
  await palette.getByRole("option", { name: /Open Session Go/ }).click()
  await expect(panel).toBeVisible()
  await expect(fabButton).toHaveAttribute("aria-pressed", "false")
})

test("Session Go docks the floating window at its current position", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await openSession(page, {
    name: "SessionGoDock",
    seed: { storage: { [SESSION_GO_SETTINGS]: sessionGoEnabled } },
    pageMessages: () => ({ items: sessionGoMessages() }),
  })

  const panel = page.locator('[data-component="session-go-floating"] [data-component="session-go-panel"]')
  const fab = page.locator('[data-component="session-go-fab"]')
  const fabButton = fab.getByRole("button")
  await expect(fabButton).toBeVisible()

  const placement = await page.evaluate(() => {
    const fab = document.querySelector('[data-component="session-go-fab"] button')?.getBoundingClientRect()
    const composer = document.querySelector('[data-component="composer"]')?.getBoundingClientRect()
    const send = document.querySelector('[data-action="composer-submit"]')?.getBoundingClientRect()

    return fab && composer && send
      ? { fabBottom: fab.bottom, fabRight: fab.right, composerTop: composer.top, sendRight: send.right }
      : undefined
  })

  expect(placement?.fabBottom).toBeLessThanOrEqual(placement?.composerTop ?? 0)
  expect(Math.abs((placement?.fabRight ?? 0) - (placement?.sendRight ?? 0))).toBeLessThanOrEqual(2)

  await fabButton.click()
  await expect(panel).toBeVisible()

  await panel.getByRole("button", { name: "Dock at this position", exact: true }).click()

  const docked = page.locator('[data-component="session-go-floating"][data-docked]')
  await expect(docked).toBeVisible()
  await expect(docked.getByRole("button", { name: "Undock", exact: true })).toBeVisible()
  await expect(fab).toHaveCount(0)

  await page.locator('[data-slot="session-chat-panel"]').click({ position: { x: 8, y: 8 } })
  await expect(docked).toBeVisible()

  await docked.getByRole("button", { name: "Undock", exact: true }).click()
  await expect(docked).toHaveCount(0)
  await expect(panel).toBeVisible()
  await expect(fabButton).toHaveAttribute("aria-pressed", "true")
})

test("Session Go navigates to a turn from the floating timeline rail", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const messages = sessionGoTurnMessages()
  await openSession(page, {
    name: "SessionGoRail",
    seed: { storage: { [SESSION_GO_SETTINGS]: sessionGoEnabled } },
    pageMessages: () => ({ items: messages }),
  })

  const fabButton = page.locator('[data-component="session-go-fab"]').getByRole("button")
  await fabButton.hover()
  const fabHint = page.getByRole("tooltip")
  const fabTurns = fabHint.locator('[data-slot="fab-turn"]')
  await expect(fabHint).toContainText("Recent 3 turns")
  await expect(fabTurns).toHaveCount(3)
  await expect(fabTurns.nth(0)).toContainText("Turn 12 request:")
  await expect(fabTurns.nth(1)).toContainText("Turn 11 request:")
  await expect(fabTurns.nth(2)).toContainText("Turn 10 request:")
  await expect(fabHint).toContainText("<1s")
  await expect(fabTurns.nth(1)).toHaveCSS("border-top-width", "0px")
  await expect(fabHint.getByRole("separator")).toBeVisible()
  await expect(fabHint).toContainText("Click to open Session Go")
  await fabButton.click()

  await page.mouse.move(0, 0)
  await fabButton.hover()
  await expect(fabHint).toContainText("Click to close Session Go")

  const rail = page.locator(
    '[data-component="session-go-floating"] [data-component="session-go-timeline"]',
  )

  await expect(rail).toBeVisible()

  const track = rail.locator('[data-slot="timeline-slider"]')
  const segments = rail.locator('[data-slot="timeline-segment"]')
  const preview = rail.locator('[data-slot="timeline-preview"]')
  const previous = rail.locator('[data-slot="timeline-prev"]')
  const next = rail.locator('[data-slot="timeline-next"]')
  const panel = page.locator('[data-component="session-go-floating"] [data-component="session-go-panel"]')
  const turnCard = page.locator('[data-component="session-go-floating"] [data-section="turn"]')

  await panel.getByRole("button", { name: "Load full history", exact: true }).click()
  await expect(panel.getByText(/Full history loaded/)).toBeVisible()

  await expect(track).toHaveAttribute("aria-label", "Session turns")
  await expect(segments).toHaveCount(12)
  await expect(segments.nth(11)).toHaveAttribute("aria-current", "true")
  await expect(segments.nth(11)).toHaveAttribute("aria-label", "Go to turn 12")
  // One segment per turn replaces the old divider grid and single scrollbar track.
  await expect(rail.locator('[data-slot="timeline-ticks"], [data-slot="timeline-track"]')).toHaveCount(0)

  const markerDistance = (index: number) =>
    page.evaluate((index) => {
      const rail = document.querySelector('[data-component="session-go-timeline"]')
      const segment = rail?.querySelectorAll('[data-slot="timeline-segment"]')[index]
      const thumb = rail?.querySelector('[data-slot="timeline-thumb"]')

      if (!segment || !thumb) return Number.POSITIVE_INFINITY

      const segmentBox = segment.getBoundingClientRect()
      const thumbBox = thumb.getBoundingClientRect()

      return Math.abs(segmentBox.top + segmentBox.height / 2 - (thumbBox.top + thumbBox.height / 2))
    }, index)

  const lastTurn = messages[22]!
  await expect(page.locator("#message-" + lastTurn.id)).toBeInViewport()
  await expect.poll(() => markerDistance(11)).toBeLessThanOrEqual(1)

  await expect(previous).toHaveAttribute("aria-label", "Previous turn")
  await expect(next).toHaveAttribute("aria-label", "Next turn")
  await previous.click()
  await expect(segments.nth(10)).toHaveAttribute("aria-current", "true")
  await expect(turnCard).toContainText("Turn 11 request:")
  await expect.poll(() => markerDistance(10)).toBeLessThanOrEqual(1)

  await next.click()
  await expect(segments.nth(11)).toHaveAttribute("aria-current", "true")
  await expect(turnCard).toContainText("Turn 12 request:")
  await expect.poll(() => markerDistance(11)).toBeLessThanOrEqual(1)

  await segments.nth(0).click()
  await expect(segments.nth(0)).toHaveAttribute("aria-current", "true")
  await expect(previous).toBeDisabled()
  await expect(turnCard).toContainText("Turn 1 request:")
  await expect.poll(() => markerDistance(0)).toBeLessThanOrEqual(1)

  const segment6 = segments.nth(5)
  const restBackground = await segment6.evaluate((element) => getComputedStyle(element).backgroundColor)
  await segment6.hover()
  await expect(preview).toContainText("Turn 6 request:")
  await expect
    .poll(() => segment6.evaluate((element) => getComputedStyle(element).backgroundColor))
    .not.toBe(restBackground)
  const firstPreviewTop = (await preview.boundingBox())?.y ?? 0
  await segments.nth(8).hover()
  await expect(preview).toContainText("Turn 9 request:")
  await expect.poll(async () => (await preview.boundingBox())?.y ?? 0).toBeGreaterThan(firstPreviewTop + 20)
  await expect(preview).toContainText("Ran for")

  await segment6.click()
  await expect(segment6).toHaveAttribute("aria-current", "true")
  const target = messages[10]!
  await expect(page.locator("#message-" + target.id)).toBeVisible()
  await expect(turnCard).toContainText("Turn 6 request:")
  await expect.poll(() => markerDistance(5)).toBeLessThanOrEqual(1)

  const railBox = await rail.boundingBox()
  const segmentBox = await segment6.boundingBox()
  // The hover bed spans the rail's content width, not only the narrow marker column.
  expect(segmentBox?.width ?? 0).toBeCloseTo((railBox?.width ?? 0) - 1, 0)

  await segment6.focus()
  await expect(preview).toContainText("Turn 6 request:")
  await segment6.press("Home")
  await expect(segments.nth(0)).toHaveAttribute("aria-current", "true")
  await expect(turnCard).toContainText("Turn 1 request:")

  for (let index = 0; index < 5; index++) await page.keyboard.press("ArrowDown")

  await expect(segments.nth(5)).toHaveAttribute("aria-current", "true")
  await expect(page.locator("#message-" + target.id)).toBeVisible()
  await expect(turnCard).toContainText("Turn 6 request:")
  await expect
    .poll(() =>
      page.evaluate(() => {
        const card = document.querySelector('[data-component="session-go-floating"] [data-section="turn"]')
        const scroller = card?.closest('[data-scrollable]')

        if (!card || !scroller) return Number.POSITIVE_INFINITY

        return card.getBoundingClientRect().top - scroller.getBoundingClientRect().top
      }),
    )
    .toBeLessThanOrEqual(16)

  await expect
    .poll(() =>
      page.evaluate((id) => {
        const message = document.getElementById("message-" + id)
        const visible = document.querySelector('[data-slot="session-timeline-visible"]')

        if (!message || !visible) return Number.POSITIVE_INFINITY

        const box = message.getBoundingClientRect()
        const bounds = visible.getBoundingClientRect()

        return box.top - bounds.top
      }, target.id),
    )
    .toBeLessThanOrEqual(80)

  await page.keyboard.press("Escape")
  await expect(page.locator('[data-component="session-go-floating"]')).toBeHidden()
  await page.mouse.move(0, 0)
  await fabButton.hover()
  await expect(fabHint).toContainText("Click to open Session Go")
  await fabButton.click()
  await expect(segments.nth(11)).toHaveAttribute("aria-current", "true")
  await expect.poll(() => markerDistance(11)).toBeLessThanOrEqual(1)
})

test("Session Go builds every turn from full history, not the loaded timeline", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const messages = sessionGoTurnMessages(80)
  await openSession(page, {
    name: "SessionGoRailHistory",
    seed: { storage: { [SESSION_GO_SETTINGS]: sessionGoEnabled } },
    pageMessages: pageMessagesFrom({ ses_sessiongorailhistory: messages }),
  })

  await page.locator('[data-component="session-go-fab"]').getByRole("button").click()

  const rail = page.locator(
    '[data-component="session-go-floating"] [data-component="session-go-timeline"]',
  )

  await expect(rail).toBeVisible()

  const track = rail.locator('[data-slot="timeline-slider"]')
  const segments = rail.locator('[data-slot="timeline-segment"]')
  const preview = rail.locator('[data-slot="timeline-preview"]')
  const turnCard = page.locator('[data-component="session-go-floating"] [data-section="turn"]')

  await expect(track).toHaveAttribute("aria-label", "Session turns")
  await expect(segments).toHaveCount(80)
  await expect(segments.nth(79)).toHaveAttribute("aria-current", "true")
  await expect(rail.locator('[data-slot="timeline-prev"]')).toBeEnabled()
  await expect(rail.locator('[data-slot="timeline-next"]')).toBeDisabled()

  const trackBox = await track.boundingBox()
  const thumbBox = await rail.locator('[data-slot="timeline-thumb"]').boundingBox()
  expect(thumbBox?.y ?? 0).toBeGreaterThan((trackBox?.y ?? 0) + (trackBox?.height ?? 0) / 2)

  await segments.nth(79).focus()
  await expect(preview).toContainText("Turn 80 request:")

  await segments.nth(79).press("Home")
  await expect(segments.nth(0)).toHaveAttribute("aria-current", "true")
  await expect(turnCard).toContainText("Turn 1 request:")
  await expect(page.locator("#message-msg_turn_0_user")).toBeInViewport()

  await page.keyboard.press("End")
  await expect(segments.nth(79)).toHaveAttribute("aria-current", "true")
  await expect(turnCard).toContainText("Turn 80 request:")
  await expect(page.locator("#message-msg_turn_79_user")).toBeInViewport()
})

test("Session Go loads every turn beyond one user-message page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const messages = sessionGoTurnMessages(220)
  await openSession(page, {
    name: "SessionGoRailTurns",
    seed: { storage: { [SESSION_GO_SETTINGS]: sessionGoEnabled } },
    pageMessages: pageMessagesFrom({ ses_sessiongorailturns: messages }),
  })

  await page.locator('[data-component="session-go-fab"]').getByRole("button").click()

  const rail = page.locator(
    '[data-component="session-go-floating"] [data-component="session-go-timeline"]',
  )

  await expect(rail).toBeVisible()

  const segments = rail.locator('[data-slot="timeline-segment"]')
  await expect(segments).toHaveCount(220)
  await expect(segments.nth(219)).toHaveAttribute("aria-current", "true")

  await segments.nth(219).focus()
  await expect(rail.locator('[data-slot="timeline-preview"]')).toContainText("Turn 220 request:")
})

test("Session Go keeps confirmed facts and candidates across a reload", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await openSession(page, {
    name: "SessionGoReload",
    seed: { storage: { [SESSION_GO_SETTINGS]: sessionGoEnabled } },
    pageMessages: () => ({ items: sessionGoMessages() }),
  })

  await page.getByRole("button", { name: "Open Session Go", exact: true }).click()

  const panel = page.locator('[data-component="session-go-panel"]')
  const decisions = panel.locator('[data-section="decisions"]')
  const constraint = decisions.locator('[data-decision="decision-user-msg_user-0"]')

  await expect(constraint.getByText(sessionConstraint, { exact: true })).toBeVisible()
  await constraint.getByRole("button", { name: "Confirm", exact: true }).click()
  await expect(constraint.getByText("Confirmed", { exact: true })).toBeVisible()

  const stored = (name: string) =>
    page.evaluate((name) => {
      return Object.keys(localStorage)
        .filter((key) => key.includes(`plugin.session-go.${name}`))
        .map((key) => localStorage.getItem(key) ?? "")
        .join("|")
    }, name)

  await expect.poll(() => stored("commitments")).toContain("decision.confirmed")
  await expect.poll(() => stored("candidates")).toContain("sourceSignature")

  await page.reload()
  await expectSessionTitle(page, "SessionGoReload")

  await page.getByRole("button", { name: "Open Session Go", exact: true }).click()
  await expect(panel).toBeVisible()
  await expect(constraint.getByText(sessionConstraint, { exact: true })).toBeVisible()
  await expect(constraint.getByText("Active", { exact: true })).toBeVisible()
  await expect(constraint.getByText("Confirmed", { exact: true })).toBeVisible()
})

test("Session Go consolidates with the session model and keeps only sourced candidates", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  const l2Statement = "Use one side panel for the semantic layer"
  const question = "Should the cached analysis survive a reload?"
  const calls: { sessionID: string; prompt: string }[] = []

  await openSession(page, {
    name: "SessionGoL2",
    sessions: [{ id: "ses_sessiongo_l2", title: "Session Go L2", model: { providerID: "opencode", id: "test" } }],
    seed: {
      storage: {
        [SESSION_GO_SETTINGS]: { ...sessionGoEnabled, modelAnalysis: true },
      },
    },
    pageMessages: () => ({ items: sessionGoMessages() }),
    generate: (input) => {
      calls.push(input)

      return {
        text: JSON.stringify({
          decisions: [
            {
              statement: l2Statement,
              kind: "approach",
              rationale: "Keeps the panel narrow.",
              sourceMessageIDs: ["msg_agent"],
              mergesDecisionIDs: ["decision-agent-msg_agent-0"],
              confidence: "high",
            },
            { statement: "Invented fact", sourceMessageIDs: ["msg_missing"] },
          ],
          openQuestions: [{ statement: question, sourceMessageIDs: ["msg_user"] }],
          conflicts: [
            {
              decisionID: "decision-user-msg_user-0",
              otherDecisionID: "decision-agent-msg_agent-0",
              reason: "They disagree about the panel layout.",
              sourceMessageIDs: ["msg_user"],
            },
          ],
        }),
        tokens: { input: 420, output: 120, reasoning: 0, cache: { read: 0, write: 0 } },
        cost: 0.0042,
      }
    },
  })

  await page.getByRole("button", { name: "Open Session Go", exact: true }).click()

  const panel = page.locator('[data-component="session-go-panel"]')
  const analysis = panel.locator('[data-section="analysis"]')
  const analyze = analysis.getByRole("button", { name: "Analyze loaded session", exact: true })

  await expect(analyze).toBeVisible()
  expect(calls).toHaveLength(0)

  await analyze.click()

  await expect(analysis.getByText("Last analysis", { exact: true })).toBeVisible()
  await expect(analysis.getByText("Cost $0.0042", { exact: true })).toBeVisible()
  await expect(analysis.getByText("420 in / 120 out tokens", { exact: true })).toBeVisible()
  expect(calls).toHaveLength(1)
  expect(calls[0]?.sessionID).toBe("ses_sessiongo_l2")
  expect(calls[0]?.prompt).toContain("ALLOWED MESSAGE IDS")

  const decisions = panel.locator('[data-section="decisions"]')
  const l2Decision = decisions.locator("[data-decision]").filter({ hasText: l2Statement })
  await expect(l2Decision.getByText("Proposed", { exact: true })).toBeVisible()
  await expect(l2Decision.getByText("Inferred", { exact: true })).toBeVisible()
  await expect(l2Decision.getByText("L2", { exact: true })).toBeVisible()
  await expect(decisions.getByText(question, { exact: true })).toBeVisible()
  await expect(panel.getByText("Invented fact", { exact: true })).toHaveCount(0)
  await expect(
    analysis.getByText("1 proposals dropped for missing sources.", { exact: true }),
  ).toBeVisible()

  await l2Decision.getByRole("button", { name: "Confirm", exact: true }).click()
  await expect(l2Decision.getByText("Active", { exact: true })).toBeVisible()
  await expect(l2Decision.getByText("Confirmed", { exact: true })).toBeVisible()

  await page.reload()
  await expectSessionTitle(page, "Session Go L2")
  await page.getByRole("button", { name: "Open Session Go", exact: true }).click()

  const persisted = page
    .locator('[data-component="session-go-panel"] [data-section="decisions"] [data-decision]')
    .filter({ hasText: l2Statement })

  await expect(persisted.getByText("Confirmed", { exact: true })).toBeVisible()
  expect(calls).toHaveLength(1)
})

test("Session Go analyzes a finished episode automatically once", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  const statement = "Automatically consolidate the finished episode"
  const calls: { sessionID: string; prompt: string }[] = []

  const messages = () => [
    {
      id: "msg_auto_user",
      type: "user" as const,
      text: "Consolidate this episode and keep the automatic path.",
      time: { created: sessionGoTime },
    },
    {
      id: "msg_auto_agent",
      type: "assistant" as const,
      agent: "build",
      model: sessionGoModel,
      content: [{ type: "text" as const, text: "I suggest the automatic path." }],
      time: { created: sessionGoTime + 1, completed: sessionGoTime + 2 },
    },
    {
      id: "msg_auto_idle",
      type: "idle" as const,
      outcome: "succeeded" as const,
      time: { created: sessionGoTime + 3 },
    },
  ] satisfies SessionMessageInfo[]

  await openSession(page, {
    name: "SessionGoAuto",
    sessions: [{ id: "ses_sessiongo_auto", title: "Session Go Auto", model: { providerID: "opencode", id: "test" } }],
    seed: {
      storage: {
        [SESSION_GO_SETTINGS]: { ...sessionGoEnabled, modelAnalysis: true, autoAnalyze: true },
      },
    },
    pageMessages: () => ({ items: messages() }),
    generate: (input) => {
      calls.push(input)

      return {
        text: JSON.stringify({
          decisions: [{ statement, kind: "approach", sourceMessageIDs: ["msg_auto_agent"] }],
        }),
        tokens: { input: 180, output: 40, reasoning: 0, cache: { read: 0, write: 0 } },
        cost: 0.0011,
      }
    },
  })

  await expect.poll(() => calls.length).toBe(1)
  expect(calls[0]?.sessionID).toBe("ses_sessiongo_auto")
  expect(calls[0]?.prompt).toContain("ALLOWED MESSAGE IDS: msg_auto_user, msg_auto_agent, msg_auto_idle")

  await page.getByRole("button", { name: "Open Session Go", exact: true }).click()

  const panel = page.locator('[data-component="session-go-panel"]')
  const analysis = panel.locator('[data-section="analysis"]')
  const decisions = panel.locator('[data-section="decisions"]')
  await expect(analysis.getByText("Last analysis", { exact: true })).toBeVisible()
  await expect(decisions.getByText(statement, { exact: true })).toBeVisible()

  await page.reload()
  await expectSessionTitle(page, "Session Go Auto")
  await page.getByRole("button", { name: "Open Session Go", exact: true }).click()
  await expect(
    page.locator('[data-component="session-go-panel"] [data-section="decisions"]').getByText(statement, {
      exact: true,
    }),
  ).toBeVisible()
  expect(calls).toHaveLength(1)
})

test("Session Go loads full history and searches older messages", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  const oldText = `The ancient decision mentions zephyr-archive. ${"Long context keeps the first page tall. ".repeat(12)}`
  const filler = (label: string) => `${label} ${"Long context keeps the first page tall. ".repeat(12)}`

  const messages = () => {
    const items: SessionMessageInfo[] = [
      {
        id: "msg_old_user",
        type: "user",
        text: oldText,
        time: { created: sessionGoTime },
      },
    ]

    for (let index = 0; index < 39; index++) {
      const created = sessionGoTime + 10 + index * 4

      items.push({
        id: `msg_old_agent_${index}`,
        type: "assistant",
        agent: "build",
        model: sessionGoModel,
        content: [{ type: "text", text: filler(`Old answer ${index}`) }],
        time: { created, completed: created + 1 },
      })
      items.push({
        id: `msg_old_follow_${index}`,
        type: "user",
        text: filler(`Old follow-up ${index}`),
        time: { created: created + 2 },
      })
    }

    items.push({
      id: "msg_new_user",
      type: "user",
      text: filler("Keep the current panel behavior."),
      time: { created: sessionGoTime + 1_000 },
    })
    items.push({
      id: "msg_new_agent",
      type: "assistant",
      agent: "build",
      model: sessionGoModel,
      content: [{ type: "text", text: filler("I suggest keeping the panel.") }],
      time: { created: sessionGoTime + 1_001, completed: sessionGoTime + 1_002 },
    })
    items.push({
      id: "msg_new_idle",
      type: "idle",
      outcome: "succeeded",
      time: { created: sessionGoTime + 1_003 },
    })

    return items
  }

  await openSession(page, {
    name: "SessionGoSearch",
    seed: { storage: { [SESSION_GO_SETTINGS]: sessionGoEnabled } },
    pageMessages: (_id, limit) => {
      const all = messages()

      return limit >= 100 ? { items: all } : { items: all.slice(-20) }
    },
  })

  await page.getByRole("button", { name: "Open Session Go", exact: true }).click()

  const panel = page.locator('[data-component="session-go-panel"]')
  const search = panel.locator('[data-section="search"]')
  const input = search.getByRole("searchbox")

  await input.fill("zephyr-archive")
  await expect(search.getByText("No matches.", { exact: true })).toBeVisible()

  await search.getByRole("button", { name: "Load full history", exact: true }).click()
  await expect(search.getByText(/Full history loaded/)).toBeVisible()

  await expect(search.getByRole("button", { name: /zephyr-archive/ })).toBeVisible()
})

test("Session Go reveals a fact's source in the timeline", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  const pairs = Array.from({ length: 15 }, (_, index) => [
    {
      id: `msg_u${index}`,
      type: "user" as const,
      text: `User message ${index}`,
      time: { created: sessionGoTime + index * 2 },
    },
    {
      id: `msg_a${index}`,
      type: "assistant" as const,
      agent: "build",
      model: sessionGoModel,
      content: [{ type: "text" as const, text: `Agent reply ${index}` }],
      time: { created: sessionGoTime + index * 2 + 1, completed: sessionGoTime + index * 2 + 1 },
    },
  ])

  const messages = pairs.flat() satisfies SessionMessageInfo[]

  await openSession(page, {
    name: "SessionGoReveal",
    sessions: [{ id: "ses_sessiongo_reveal", title: "Session Go Reveal" }],
    seed: { storage: { [SESSION_GO_SETTINGS]: sessionGoEnabled } },
    pageMessages: pageMessagesFrom({ ses_sessiongo_reveal: messages }),
  })

  await page.getByRole("button", { name: "Open Session Go", exact: true }).click()

  const goal = page.locator('[data-component="session-go-panel"] [data-section="goal"]')
  const source = goal.getByRole("button", { name: /^msg_/ })
  await expect(source).toBeVisible()

  const messageID = (await source.textContent())?.trim()
  expect(messageID).toBeTruthy()

  const jump = page.getByRole("button", { name: "Jump to latest", exact: true })

  await source.click()

  await expect(page.locator(`#message-${messageID}`)).toBeInViewport()
  await expect(jump).toBeVisible()
})

test("Session Go uses a provided global project goal", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  const projectGoal = {
    id: "PG1",
    projectID: "proj_sessiongoproject",
    statement: "Ship the semantic layer",
    status: "active",
    authority: "user",
  }

  await openSession(page, {
    name: "SessionGoProject",
    seed: {
      storage: {
        [SESSION_GO_SETTINGS]: sessionGoEnabled,
        "opencode.global.dat:plugin.session-go.projectGoals": { goals: [projectGoal] },
      },
    },
    pageMessages: () => ({ items: sessionGoMessages() }),
  })

  await page.getByRole("button", { name: "Open Session Go", exact: true }).click()

  const goal = page.locator('[data-component="session-go-panel"] [data-section="goal"]')
  await expect(goal.getByText("Ship the semantic layer", { exact: true })).toBeVisible()
  await expect(goal.getByText("Placeholder", { exact: true })).toHaveCount(0)
  await expect(goal.getByText("Linked to this project goal", { exact: true })).toBeVisible()

  await page.reload()
  await expectSessionTitle(page, "SessionGoProject")
  await page.getByRole("button", { name: "Open Session Go", exact: true }).click()
  await expect(
    page.locator('[data-component="session-go-panel"] [data-section="goal"]').getByText("Ship the semantic layer", {
      exact: true,
    }),
  ).toBeVisible()
})

async function expectTreeSentinel(page: Page) {
  const tree = page.locator('#review-panel [data-component="file-tree-v2"]')
  await expect(tree.getByRole("treeitem", { name: "action.yml" })).toBeVisible()
  const rows = await tree.locator('[data-type="item"]').count()
  expect(rows).toBeGreaterThan(0)
  expect(rows).toBeLessThanOrEqual(60)
}

function sideContentOffset(page: Page, direction: "ltr" | "rtl") {
  return page.evaluate((direction) => {
    const frame = document.querySelector('[data-slot="session-side-panel-presence"]')!.getBoundingClientRect()
    const content = document.querySelector('[data-slot="session-side-panel-content"]')!.getBoundingClientRect()

    return direction === "rtl" ? Math.abs(frame.right - content.right) : Math.abs(frame.left - content.left)
  }, direction)
}

test("the new tab view lists recently closed tabs, expands to the rest, and keeps them across a reload", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const directory = "C:/OpenCode/RecentlyClosed"
  const key = `local\u0000${base64Encode(directory)}/ses_recentlyclosed`

  // Twelve files closed earlier, newest first, as the app stores them beside the strip.
  const closed = Array.from({ length: 12 }, (_, index) => ({
    key: `file://src/closed-${String(index).padStart(2, "0")}.ts`,
    title: `closed-${String(index).padStart(2, "0")}.ts`,
    file: `src/closed-${String(index).padStart(2, "0")}.ts`,
    closed: 1_000 - index,
  }))

  await openSession(page, {
    name: "RecentlyClosed",
    fileContent: (path) => ({ type: "text", content: `contents:${path}` }),
    seed: {
      panes: { ses_recentlyclosed: { review: true } },
      storage: {
        "opencode.global.dat:layout": {
          sessionTabs: { [key]: { all: ["file://README.md"], active: "file://README.md" } },
          sessionView: { [key]: { scroll: {}, closed } },
        },
      },
    },
  })

  const panel = page.locator("#review-panel")
  const recent = panel.getByRole("region", { name: "Recently closed", exact: true })
  const rows = recent.locator('[data-slot="side-recently-closed-row"]')
  const toggle = page.getByRole("button", { name: "Toggle review", exact: true })

  // The latest five, then all of them once expanded.
  await panel.getByRole("button", { name: "Add tab", exact: true }).click()
  await expect(rows).toHaveCount(5)
  await expect(rows.first()).toContainText("closed-00.ts")
  const more = recent.getByRole("button", { name: "Show more", exact: true })
  await more.focus()
  await more.press("Enter")
  await expect(rows).toHaveCount(12)
  await expect(rows.filter({ hasText: "closed-05.ts" })).toBeFocused()
  await expect(recent.getByRole("button", { name: "Show more", exact: true })).toHaveCount(0)
  await expect(recent.getByRole("button", { name: "Show less", exact: true })).toHaveCount(0)

  // Closing the last tab keeps the region open on the New tab beside it, which lists that tab first.
  const readme = panel.getByRole("tab", { name: "README.md" })
  await readme.click()
  await expect(panel.getByRole("tab", { name: "New tab", exact: true })).toHaveAttribute("aria-selected", "false")
  await readme.locator("..").getByRole("button", { name: "Close tab" }).click()
  await expect(toggle).toHaveAttribute("aria-expanded", "true")
  await expect(panel.getByRole("tab", { name: "New tab", exact: true })).toHaveAttribute("aria-selected", "true")
  await expect(rows.first()).toContainText("README.md")

  // The list survives a reload, and reopening a row brings its tab back and takes it off the list.
  await page.reload()
  await expect(rows.first()).toContainText("README.md")
  await rows.first().click()
  await expect(panel.getByRole("tab", { name: "README.md" })).toHaveAttribute("aria-selected", "true")
  await panel.getByRole("button", { name: "Add tab", exact: true }).click()
  await expect(rows.first()).toContainText("closed-00.ts")
  await expect(recent).not.toContainText("README.md")
})

test("Mod+F finds in Markdown and HTML previews with the code view's find bar", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const directory = "C:/OpenCode/PreviewFind"
  const key = `local\u0000${base64Encode(directory)}/ses_previewfind`

  const files = new Map([
    ["notes.md", "# Needle notes\n\nOne needle here.\n\nAnother **needle** there."],
    ["diagram.mmd", "flowchart TD\n  A[First needle] --> B[Last needle]"],
    [
      "page.html",
      "<!-- note -->\n<!doctype html><title>Page</title><p>First needle</p><p style='margin-top:2000px'>Last needle</p>",
    ],
  ])

  await openSession(page, {
    name: "PreviewFind",
    fileList: () => [],
    fileContent: (path) => ({ type: "text", content: files.get(path.split("/").at(-1) ?? "") ?? "" }),
    seed: {
      panes: { ses_previewfind: { review: true } },
      storage: {
        "opencode.global.dat:layout": {
          sessionTabs: {
            [key]: { all: ["file://notes.md", "file://diagram.mmd", "file://page.html"], active: "file://notes.md" },
          },
        },
      },
    },
  })

  const side = page.locator('[data-pane-content="side"]')
  const find = page.getByRole("textbox", { name: "Find" })
  const mod = await page.evaluate(() => (/(Mac|iPod|iPhone|iPad)/.test(navigator.platform) ? "Meta" : "Control"))
  await side.getByText("One needle here.").click()
  await page.keyboard.press(`${mod}+f`)
  await expect(find).toBeFocused()
  await find.fill("needle")
  await expect(page.getByText("1/3", { exact: true })).toBeVisible()
  await find.press("Enter")
  await expect(page.getByText("2/3", { exact: true })).toBeVisible()
  await find.press("Shift+Enter")
  await find.press("Shift+Enter")
  await expect(page.getByText("3/3", { exact: true })).toBeVisible()
  await find.press("Escape")
  await expect(find).toHaveCount(0)

  // A closed side panel keeps its preview mounted out of sight, so Mod+F opens no bar there.
  const toggle = page.getByRole("button", { name: "Toggle review" })
  await toggle.click()
  await expect(side).toBeHidden()
  await page.keyboard.press(`${mod}+f`)
  await expect(find).toHaveCount(0)
  await toggle.click()

  // Mermaid keeps its source in a hidden code block; only the drawn labels count.
  await side.getByRole("tab", { name: "diagram.mmd", exact: true }).click()
  await side.locator("svg").getByText("First needle").click()
  await page.keyboard.press(`${mod}+f`)
  await expect(find).toBeFocused()
  await find.fill("needle")
  await expect(page.getByText("1/2", { exact: true })).toBeVisible()
  await find.press("Escape")
  await expect(find).toHaveCount(0)

  // The HTML runs in a sandboxed frame; Mod+F pressed inside it still opens the bar.
  await side.getByRole("tab", { name: "page.html", exact: true }).click()
  const frame = side.frameLocator('iframe[data-file-find="frame"]')
  await frame.getByText("First needle").click()
  // The find script goes after the doctype, even behind a comment, so the page keeps standards mode.
  expect(await frame.locator("html").evaluate(() => document.compatMode)).toBe("CSS1Compat")
  await page.keyboard.press(`${mod}+f`)
  await expect(find).toBeFocused()
  await find.fill("needle")
  await expect(page.getByText("1/2", { exact: true })).toBeVisible()
  await find.press("Enter")
  await expect(page.getByText("2/2", { exact: true })).toBeVisible()
  await expect(frame.getByText("Last needle")).toBeInViewport()
  await find.press("Escape")
  await expect(find).toHaveCount(0)
})
