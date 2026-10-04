import { readFile } from "node:fs/promises";
import { glob, type Loader, type LoaderContext, type ParseDataOptions } from "astro/loaders";
import { parseMarkdownFrontmatter } from "./markdown-frontmatter";

const markdownLoader = glob({
  // [BLD-001/002] Only direct item READMEs participate; the ID is the containing folder.
  pattern: "*/README.md",
  base: new URL("../../../catalog/", import.meta.url),
  generateId: ({ entry }) => entry.replace(/\\/gu, "/").split("/")[0] ?? entry,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function parseOriginalDate<TData extends Record<string, unknown>>(
  context: LoaderContext,
  options: ParseDataOptions<TData>,
): Promise<TData> {
  if (!options.filePath) {
    throw new Error("Catalog README entries must include a file path.");
  }

  const contents = await readFile(options.filePath, "utf8");
  const frontmatter = parseMarkdownFrontmatter(contents);
  if (!frontmatter.ok) {
    throw new Error(`${options.filePath}: ${frontmatter.messages.join("; ")}`);
  }

  const data = { ...options.data };
  if (isRecord(frontmatter.data) && Object.hasOwn(frontmatter.data, "updated")) {
    Object.assign(data, { updated: frontmatter.data.updated });
  } else {
    Reflect.deleteProperty(data, "updated");
  }

  return context.parseData({ ...options, data });
}

export const catalogContentLoader: Loader = {
  name: "catalog-content-loader",
  load(context) {
    // Keep glob's discovery/rendering, but restore the raw scalar before schema validation.
    return markdownLoader.load({
      ...context,
      parseData: <TData extends Record<string, unknown>>(options: ParseDataOptions<TData>) =>
        parseOriginalDate(context, options),
    });
  },
};
