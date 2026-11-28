// Runs every generator in script/gen in name order. Each writes its own output under crates/.
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const scripts = Array.from(new Bun.Glob("script/gen/*.ts").scanSync({ cwd: root })).sort()

for (const script of scripts) {
  console.log(`generate: ${script}`)
  const proc = Bun.spawnSync(["bun", "run", script], { cwd: root, stdout: "inherit", stderr: "inherit" })
  if (proc.exitCode !== 0) process.exit(proc.exitCode ?? 1)
}
if (scripts.length === 0) console.log("generate: no generators in script/gen")
