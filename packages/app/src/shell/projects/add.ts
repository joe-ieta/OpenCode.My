import type { ServerCtx } from "@/runtime/server/runtime"

export async function addProjects(context: ServerCtx, directories: string[]) {
  const projects = await Promise.all(directories.map((directory) => context.projects.add(directory)))

  // Additions finish in any order; the first directory is the one the caller opens.
  const first = directories[0]

  if (projects[0] && first) context.projects.touch(first)

  return projects[0]
}
