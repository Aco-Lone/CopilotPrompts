import { parseDocument, YAMLParseError } from "yaml";

export type MarkdownFrontmatterResult =
  | { ok: true; data: unknown; body: string }
  | { ok: false; messages: string[] };

export function parseMarkdownFrontmatter(contents: string): MarkdownFrontmatterResult {
  const text = contents.startsWith("\uFEFF") ? contents.slice(1) : contents;
  const lines = text.split(/\r?\n/u);
  if (lines[0]?.trim() !== "---") {
    return { ok: false, messages: ["YAML frontmatter must begin with ---"] };
  }

  const closingDelimiter = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (closingDelimiter === -1) {
    return { ok: false, messages: ["YAML frontmatter is missing its closing --- delimiter"] };
  }

  let document;
  try {
    document = parseDocument(lines.slice(1, closingDelimiter).join("\n"), {
      schema: "core",
      uniqueKeys: true,
      version: "1.2",
    });
  } catch (error) {
    if (error instanceof YAMLParseError) {
      return { ok: false, messages: [error.message] };
    }
    throw error;
  }

  if (document.errors.length > 0) {
    return { ok: false, messages: document.errors.map((error) => error.message) };
  }

  return {
    ok: true,
    data: document.toJS(),
    body: lines.slice(closingDelimiter + 1).join("\n").trim(),
  };
}
