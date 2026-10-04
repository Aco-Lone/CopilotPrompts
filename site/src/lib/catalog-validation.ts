import { readdir, readFile } from "node:fs/promises";
import type { Dirent } from "node:fs";
import { relative, resolve, sep, join } from "node:path";
import { parseDocument, YAMLParseError } from "yaml";
import type { CatalogDiagnostic, CatalogValidationResult } from "./types";
import { itemSchema, validateSlug } from "./item-schema";
import type { ItemFrontmatter } from "./item-schema";

type FrontmatterParseResult = { ok: true; data: unknown } | { ok: false; messages: string[] };

function relativeCatalogPath(root: string, target: string): string {
  return relative(root, target).split(sep).join("/");
}

function getIssueKey(path: readonly (string | number | symbol)[]): string | undefined {
  if (path.length === 0) {
    return undefined;
  }

  return path.reduce<string>((key, part) => {
    if (typeof part === "number") {
      return `${key}[${part}]`;
    }
    return `${key}${key ? "." : ""}${String(part)}`;
  }, "");
}

function parseFrontmatter(contents: string): FrontmatterParseResult {
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

  return { ok: true, data: document.toJS() };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getItemType(value: unknown): ItemFrontmatter["type"] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const type = value.type;
  return type === "agent" || type === "skill" || type === "prompt" || type === "bundle" ? type : undefined;
}

function addTypeDiagnostic(
  diagnostics: CatalogDiagnostic[],
  path: string,
  message: string,
): void {
  diagnostics.push({ path, key: "type", message });
}

async function containsNonReadmeFile(directory: string): Promise<boolean> {
  let containsFile = false;
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile()) {
      if (entry.name !== "README.md") {
        containsFile = true;
      }
    } else if (entry.isDirectory()) {
      if (await containsNonReadmeFile(join(directory, entry.name))) {
        containsFile = true;
      }
    }
  }

  return containsFile;
}

async function validateSkillFile(
  skillFile: string,
  skillCatalogPath: string,
  slug: string,
  diagnostics: CatalogDiagnostic[],
): Promise<void> {
  const contents = await readFile(skillFile, "utf8");
  const frontmatter = parseFrontmatter(contents);

  if (!frontmatter.ok) {
    for (const message of frontmatter.messages) {
      diagnostics.push({
        path: skillCatalogPath,
        message: `Invalid SKILL.md YAML frontmatter: ${message}`,
      });
    }
    return;
  }

  const name = isRecord(frontmatter.data) ? frontmatter.data.name : undefined;
  if (name !== slug) {
    diagnostics.push({
      path: skillCatalogPath,
      key: "name",
      message: `must equal the item folder slug "${slug}"`,
    });
  }
}

async function validateItemFiles(
  type: ItemFrontmatter["type"],
  slug: string,
  itemDirectory: string,
  directEntries: Dirent[],
  readmeCatalogPath: string,
  diagnostics: CatalogDiagnostic[],
): Promise<void> {
  if (type === "agent") {
    const hasAgentFile = directEntries.some((entry) => entry.isFile() && entry.name.endsWith(".agent.md"));
    if (!hasAgentFile) {
      addTypeDiagnostic(diagnostics, readmeCatalogPath, 'agent items require at least one direct "*.agent.md" file');
    }
    return;
  }

  if (type === "prompt") {
    const hasPromptFile = directEntries.some((entry) => entry.isFile() && entry.name.endsWith(".prompt.md"));
    if (!hasPromptFile) {
      addTypeDiagnostic(
        diagnostics,
        readmeCatalogPath,
        'prompt items require at least one direct "*.prompt.md" file',
      );
    }
    return;
  }

  if (type === "skill") {
    const skillEntry = directEntries.find((entry) => entry.name === "SKILL.md" && entry.isFile());
    if (!skillEntry) {
      addTypeDiagnostic(diagnostics, readmeCatalogPath, "skill items require one direct SKILL.md file");
      return;
    }

    await validateSkillFile(
      join(itemDirectory, skillEntry.name),
      `${slug}/SKILL.md`,
      slug,
      diagnostics,
    );
    return;
  }

  if (!(await containsNonReadmeFile(itemDirectory))) {
    addTypeDiagnostic(
      diagnostics,
      readmeCatalogPath,
      "bundle items require at least one non-README file anywhere in the folder",
    );
  }
}

async function validateItem(
  root: string,
  slug: string,
  itemDirectory: string,
  diagnostics: CatalogDiagnostic[],
): Promise<void> {
  if (!validateSlug(slug)) {
    diagnostics.push({
      path: relativeCatalogPath(root, itemDirectory),
      message: "item folder name must be a valid lowercase slug (1-64 characters)",
    });
  }

  const entries = await readdir(itemDirectory, { withFileTypes: true });
  const readmeEntry = entries.find((entry) => entry.name === "README.md");
  const readmeCatalogPath = `${relativeCatalogPath(root, itemDirectory)}/README.md`;

  if (!readmeEntry || !readmeEntry.isFile()) {
    diagnostics.push({
      path: readmeCatalogPath,
      message: readmeEntry ? "item README.md must be a regular file" : "item folder is missing its root README.md",
    });
    return;
  }

  const readmeContents = await readFile(join(itemDirectory, readmeEntry.name), "utf8");
  const frontmatter = parseFrontmatter(readmeContents);
  if (!frontmatter.ok) {
    for (const message of frontmatter.messages) {
      diagnostics.push({
        path: readmeCatalogPath,
        message: `Invalid README.md YAML frontmatter: ${message}`,
      });
    }
    return;
  }

  const parsed = itemSchema.safeParse(frontmatter.data);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key =
        issue.code === "unrecognized_keys" ? issue.keys.join(", ") : getIssueKey(issue.path);
      diagnostics.push({
        path: readmeCatalogPath,
        ...(key === undefined ? {} : { key }),
        message: issue.message,
      });
    }
  }

  const itemType = getItemType(frontmatter.data);
  if (itemType) {
    await validateItemFiles(itemType, slug, itemDirectory, entries, readmeCatalogPath, diagnostics);
  }
}

export async function validateCatalog(root: string): Promise<CatalogValidationResult> {
  const absoluteRoot = resolve(root);
  const diagnostics: CatalogDiagnostic[] = [];
  const entries = await readdir(absoluteRoot, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = join(absoluteRoot, entry.name);
    const catalogPath = relativeCatalogPath(absoluteRoot, entryPath);

    if (entry.name === "README.md") {
      if (!entry.isFile()) {
        diagnostics.push({
          path: catalogPath,
          message: "catalog README.md must be a regular file",
        });
      }
      continue;
    }

    if (entry.isDirectory()) {
      await validateItem(absoluteRoot, entry.name, entryPath, diagnostics);
    } else if (entry.isFile()) {
      diagnostics.push({
        path: catalogPath,
        message: "catalog root may contain files only when the file is exactly README.md",
      });
    } else {
      diagnostics.push({
        path: catalogPath,
        message: "catalog root entries must be item folders or a regular README.md file",
      });
    }
  }

  return { valid: diagnostics.length === 0, diagnostics };
}
