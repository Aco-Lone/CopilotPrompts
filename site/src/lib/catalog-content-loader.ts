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

async function parseRawFrontmatter<TData extends Record<string, unknown>>(
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

  if (!isRecord(frontmatter.data)) {
    throw new Error(`${options.filePath}: YAML frontmatter must be a mapping.`);
  }

  const data = { ...options.data };
  // Remove every js-yaml value so coerced Date objects cannot leak into validation.
  for (const key of Object.keys(data)) {
    Reflect.deleteProperty(data, key);
  }
  // Define parsed keys directly so "__proto__" stays an own data property.
  for (const [key, value] of Object.entries(frontmatter.data)) {
    Object.defineProperty(data, key, {
      configurable: true,
      enumerable: true,
      value,
      writable: true,
    });
  }

  return context.parseData({ ...options, data });
}

export const catalogContentLoader: Loader = {
  name: "catalog-content-loader",
  load(context) {
    // Keep glob's discovery/rendering while validating the shared YAML 1.2 frontmatter parse.
    return markdownLoader.load({
      ...context,
      parseData: <TData extends Record<string, unknown>>(options: ParseDataOptions<TData>) =>
        parseRawFrontmatter(context, options),
    });
  },
};
