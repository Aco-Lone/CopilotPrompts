import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { validateCatalog } from "./catalog-validation";

const testWorkRoot = fileURLToPath(new URL("../../.test-work/", import.meta.url));
const testWorkspace = join(testWorkRoot, "catalog-validation");
const validFrontmatter = {
  title: "Catalog item",
  summary: "A short catalog summary.",
  tags: ["example"],
  type: "prompt",
};

async function createCatalog(): Promise<string> {
  await mkdir(testWorkspace, { recursive: true });
  return mkdtemp(join(testWorkspace, "catalog-"));
}

async function writeFixture(root: string, filePath: string, contents: string): Promise<void> {
  const target = join(root, filePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, contents, "utf8");
}

function markdown(frontmatter: unknown): string {
  const yamlLines =
    typeof frontmatter === "string" ? frontmatter : JSON.stringify(frontmatter, null, 2);
  return `---\n${yamlLines}\n---\n\nFixture body.\n`;
}

async function writePromptItem(
  root: string,
  slug: string,
  options: { frontmatter?: unknown; files?: Record<string, string> } = {},
): Promise<void> {
  await writeFixture(root, `${slug}/README.md`, markdown(options.frontmatter ?? validFrontmatter));
  for (const [filePath, contents] of Object.entries(options.files ?? { "example.prompt.md": "Prompt body" })) {
    await writeFixture(root, `${slug}/${filePath}`, contents);
  }
}

type CatalogEntrySnapshot =
  | { path: string; type: "directory" }
  | { path: string; type: "file"; contents: string };

async function snapshotCatalog(root: string, directory = root): Promise<CatalogEntrySnapshot[]> {
  const results: CatalogEntrySnapshot[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = join(directory, entry.name);
    const entryPath = relative(root, target).split(sep).join("/");
    if (entry.isDirectory()) {
      results.push({ path: entryPath, type: "directory" });
      results.push(...(await snapshotCatalog(root, target)));
    } else {
      results.push({ path: entryPath, type: "file", contents: await readFile(target, "utf8") });
    }
  }
  return results.sort((first, second) => first.path.localeCompare(second.path));
}

afterEach(async () => {
  await rm(testWorkRoot, { recursive: true, force: true });
});

// Coverage for CNT-001..010, BLD-001..006, BLD-014, and OVR-003.
describe("validateCatalog structure [CNT-001..010, BLD-001..006]", () => {
  it("accepts an empty catalog root [CNT-009]", async () => {
    const root = await createCatalog();

    const result = await validateCatalog(root);

    expect(result).toEqual({ valid: true, diagnostics: [] });
  });

  it("never treats catalog/README.md as an item [BLD-002]", async () => {
    const root = await createCatalog();
    await writeFixture(root, "README.md", "---\ntitle: [malformed\n---\n");

    const result = await validateCatalog(root);

    expect(result).toEqual({ valid: true, diagnostics: [] });
  });

  it("rejects catalog-root files other than README.md [CNT-001]", async () => {
    const root = await createCatalog();
    await writeFixture(root, "unexpected.txt", "not allowed");

    const result = await validateCatalog(root);

    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ path: "unexpected.txt" }),
    );
  });

  it("rejects invalid item folder slugs [CNT-002]", async () => {
    const root = await createCatalog();
    await writePromptItem(root, "Invalid_Slug");

    const result = await validateCatalog(root);

    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ path: "Invalid_Slug", message: expect.stringContaining("slug") }),
    );
  });

  it("requires a root README.md in every item folder [CNT-003]", async () => {
    const root = await createCatalog();
    await writeFixture(root, "missing-readme/example.prompt.md", "Prompt body");

    const result = await validateCatalog(root);

    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        path: "missing-readme/README.md",
        message: expect.stringContaining("README.md"),
      }),
    );
  });

  it("reports malformed README YAML and continues validating later items [BLD-003]", async () => {
    const root = await createCatalog();
    await writeFixture(root, "broken/README.md", markdown("title: [unterminated"));
    await writePromptItem(root, "later", {
      frontmatter: { ...validFrontmatter, title: "" },
      files: {},
    });

    const result = await validateCatalog(root);

    expect(result.diagnostics.some((item) => item.path === "broken/README.md" && /YAML/i.test(item.message))).toBe(
      true,
    );
    expect(result.diagnostics.some((item) => item.path === "later/README.md" && item.key === "title")).toBe(true);
    expect(result.diagnostics.some((item) => item.path === "later/README.md" && item.key === "type")).toBe(true);
  });

  it("preserves unquoted YAML dates for real-date validation [CNT-007]", async () => {
    const root = await createCatalog();
    await writePromptItem(root, "dated", {
      frontmatter: [
        "title: Date item",
        "summary: A valid date item.",
        "tags: [dates]",
        "type: prompt",
        "updated: 2024-02-29",
      ].join("\n"),
    });

    expect((await validateCatalog(root)).valid).toBe(true);
  });

  it("aggregates independent root, slug, schema, and file-rule violations [BLD-003..006]", async () => {
    const root = await createCatalog();
    await writeFixture(root, "stray.txt", "not allowed");
    await writePromptItem(root, "Bad_Folder", {
      frontmatter: { ...validFrontmatter, title: "", unexpected: true, type: "agent" },
      files: {},
    });
    await writePromptItem(root, "second", {
      frontmatter: { ...validFrontmatter, summary: "line one\nline two" },
      files: {},
    });

    const result = await validateCatalog(root);

    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((item) => item.path === "stray.txt")).toBe(true);
    expect(result.diagnostics.some((item) => item.path === "Bad_Folder" && /slug/i.test(item.message))).toBe(true);
    expect(result.diagnostics.some((item) => item.path === "Bad_Folder/README.md" && item.key === "title")).toBe(true);
    expect(result.diagnostics.some((item) => item.path === "Bad_Folder/README.md" && item.key === "unexpected")).toBe(
      true,
    );
    expect(result.diagnostics.some((item) => item.path === "Bad_Folder/README.md" && item.key === "type")).toBe(true);
    expect(result.diagnostics.some((item) => item.path === "second/README.md" && item.key === "summary")).toBe(true);
  });
});

describe("validateCatalog item file rules [CNT-008, BLD-001]", () => {
  it("requires at least one direct *.agent.md file for agents [CNT-008]", async () => {
    const root = await createCatalog();
    await writePromptItem(root, "an-agent", {
      frontmatter: { ...validFrontmatter, type: "agent" },
      files: { "nested/example.agent.md": "not direct" },
    });

    const result = await validateCatalog(root);

    expect(result.diagnostics.some((item) => item.key === "type" && /agent\.md/i.test(item.message))).toBe(true);
  });

  it("accepts an agent with a direct *.agent.md file [CNT-008]", async () => {
    const root = await createCatalog();
    await writePromptItem(root, "an-agent", {
      frontmatter: { ...validFrontmatter, type: "agent" },
      files: { "an-agent.agent.md": "Agent body" },
    });

    expect((await validateCatalog(root)).valid).toBe(true);
  });

  it("accepts a prompt with a direct *.prompt.md file [CNT-008]", async () => {
    const root = await createCatalog();
    await writePromptItem(root, "a-prompt", {
      files: { "a-prompt.prompt.md": "Prompt body" },
    });

    expect((await validateCatalog(root)).valid).toBe(true);
  });

  it("requires at least one direct *.prompt.md file for prompts [CNT-008]", async () => {
    const root = await createCatalog();
    await writePromptItem(root, "a-prompt", {
      files: { "nested/example.prompt.md": "not direct" },
    });

    const result = await validateCatalog(root);

    expect(result.diagnostics.some((item) => item.key === "type" && /prompt\.md/i.test(item.message))).toBe(true);
  });

  it("requires a direct SKILL.md file for skills [CNT-008]", async () => {
    const root = await createCatalog();
    await writePromptItem(root, "a-skill", {
      frontmatter: { ...validFrontmatter, type: "skill" },
      files: { "nested/SKILL.md": "---\nname: a-skill\n---\n" },
    });

    const result = await validateCatalog(root);

    expect(result.diagnostics.some((item) => item.key === "type" && /SKILL\.md/.test(item.message))).toBe(true);
  });

  it("requires the skill frontmatter name to equal its folder slug [CNT-008]", async () => {
    const root = await createCatalog();
    await writePromptItem(root, "a-skill", {
      frontmatter: { ...validFrontmatter, type: "skill" },
      files: { "SKILL.md": "---\nname: another-skill\n---\n\nSkill body.\n" },
    });

    const result = await validateCatalog(root);

    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        path: "a-skill/SKILL.md",
        key: "name",
        message: expect.stringContaining("a-skill"),
      }),
    );
  });

  it("accepts a skill whose direct SKILL.md names the folder [CNT-008]", async () => {
    const root = await createCatalog();
    await writePromptItem(root, "a-skill", {
      frontmatter: { ...validFrontmatter, type: "skill" },
      files: { "SKILL.md": "---\nname: a-skill\n---\n\nSkill body.\n" },
    });

    expect((await validateCatalog(root)).valid).toBe(true);
  });

  it("reports malformed skill frontmatter without hiding its path [CNT-008]", async () => {
    const root = await createCatalog();
    await writePromptItem(root, "a-skill", {
      frontmatter: { ...validFrontmatter, type: "skill" },
      files: { "SKILL.md": "---\nname: [unterminated\n---\n" },
    });

    const result = await validateCatalog(root);

    expect(result.diagnostics.some((item) => item.path === "a-skill/SKILL.md" && /YAML/i.test(item.message))).toBe(
      true,
    );
  });

  it("requires a non-README file somewhere recursively for bundles [CNT-008]", async () => {
    const root = await createCatalog();
    await writePromptItem(root, "a-bundle", {
      frontmatter: { ...validFrontmatter, type: "bundle" },
      files: { "docs/README.md": "Only a readme" },
    });

    const result = await validateCatalog(root);

    expect(result.diagnostics.some((item) => item.key === "type" && /non-README/i.test(item.message))).toBe(true);
  });

  it("accepts a bundle with a recursively nested non-README file [CNT-008]", async () => {
    const root = await createCatalog();
    await writePromptItem(root, "a-bundle", {
      frontmatter: { ...validFrontmatter, type: "bundle" },
      files: { "nested/files/payload.bin": "payload" },
    });

    expect((await validateCatalog(root)).valid).toBe(true);
  });
});

describe("validateCatalog safety [BLD-014]", () => {
  it("propagates unexpected filesystem failures [BLD-003..006]", async () => {
    const parent = await createCatalog();

    await expect(validateCatalog(join(parent, "missing-root"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("does not create, delete, or mutate catalog entries [OVR-003, BLD-014]", async () => {
    const root = await createCatalog();
    await writePromptItem(root, "unchanged");
    const initialSnapshot = await snapshotCatalog(root);

    await validateCatalog(root);

    expect(await snapshotCatalog(root)).toEqual(initialSnapshot);
  });
});
