import { readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

export function listItemFiles(itemDir: string): string[] {
  const root = resolve(itemDir);
  let rootStat: ReturnType<typeof statSync>;
  try {
    rootStat = statSync(root);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`Item directory does not exist: ${itemDir}`, { cause: error });
    }
    throw error;
  }

  if (!rootStat.isDirectory()) {
    throw new Error(`Item path is not a directory: ${itemDir}`);
  }

  const files: string[] = [];
  function visit(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const entryPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
      } else if (entry.isFile()) {
        files.push(relative(root, entryPath).split(sep).join("/"));
      }
    }
  }

  visit(root);
  return files.sort();
}
