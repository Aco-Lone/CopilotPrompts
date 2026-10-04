import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { access, mkdir, readdir, rm, rmdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const siteRoot = fileURLToPath(new URL("../../", import.meta.url));
const catalogRoot = join(repositoryRoot, "catalog");
const itemSlug = `invalid-date-${randomUUID().replace(/-/gu, "").slice(0, 12)}`;
const itemDirectory = join(catalogRoot, itemSlug);
const astroCli = join(siteRoot, "node_modules", "astro", "bin", "astro.mjs");
let createdCatalogRoot = false;

async function ensureCatalogRoot(): Promise<void> {
  try {
    await access(catalogRoot);
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
      throw error;
    }

    await mkdir(catalogRoot);
    createdCatalogRoot = true;
  }
}

afterEach(async () => {
  await rm(itemDirectory, { recursive: true, force: true });
  if (createdCatalogRoot) {
    if ((await readdir(catalogRoot)).length === 0) {
      await rmdir(catalogRoot);
    }
    createdCatalogRoot = false;
  }
});

async function writeCollectionFixture(updated: string, dateLikeStringFields = false): Promise<void> {
  await ensureCatalogRoot();
  await mkdir(itemDirectory);
  await writeFile(
    join(itemDirectory, "README.md"),
    [
      "---",
      `title: ${dateLikeStringFields ? "2024-02-29" : "Date regression"}`,
      `summary: ${dateLikeStringFields ? "2024-02-29" : "This item exercises collection date validation."}`,
      `tags: ${dateLikeStringFields ? "[2024-02-29]" : "[date]"}`,
      "type: prompt",
      `updated: ${updated}`,
      "---",
      "",
      "Date fixture.",
      "",
    ].join("\n"),
    "utf8",
  );
  await writeFile(join(itemDirectory, `${itemSlug}.prompt.md`), "Prompt fixture.", "utf8");
}

async function writeProtoFixture(): Promise<void> {
  await ensureCatalogRoot();
  await mkdir(itemDirectory);
  await writeFile(
    join(itemDirectory, "README.md"),
    [
      "---",
      "__proto__:",
      "  title: inherited title",
      "  summary: inherited summary",
      "  tags:",
      "    - inherited",
      "  type: prompt",
      "---",
      "",
      "Prototype fixture.",
      "",
    ].join("\n"),
    "utf8",
  );
  await writeFile(join(itemDirectory, `${itemSlug}.prompt.md`), "Prompt fixture.", "utf8");
}

function runAstroSync() {
  return spawnSync(process.execPath, [astroCli, "sync"], {
    cwd: siteRoot,
    encoding: "utf8",
  });
}

describe("Astro Content Collection date validation [CNT-007]", () => {
  it(
    "accepts a real unquoted YAML date scalar",
    async () => {
      await writeCollectionFixture("2024-02-29");

      const result = runAstroSync();

      expect(result.error).toBeUndefined();
      expect(result.signal).toBeNull();
      expect(result.status).toBe(0);
    },
    30_000,
  );

  it(
    "preserves date-like YAML string scalars in title, summary, and tags [CNT-004..006]",
    async () => {
      await writeCollectionFixture("2024-02-29", true);

      const result = runAstroSync();
      const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

      expect(result.error).toBeUndefined();
      expect(result.signal).toBeNull();
      expect(result.status, output).toBe(0);
    },
    30_000,
  );

  it(
    "rejects an impossible unquoted YAML date scalar",
    async () => {
      await writeCollectionFixture("2024-02-30");

      const result = runAstroSync();
      const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

      expect(result.error).toBeUndefined();
      expect(result.signal).toBeNull();
      expect(result.status, output).not.toBe(0);
      expect(output).toMatch(/updated/i);
    },
    30_000,
  );

  it(
    "reports __proto__ as an unknown frontmatter key through the strict collection schema",
    async () => {
      await writeProtoFixture();

      const result = runAstroSync();
      const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

      expect(result.error).toBeUndefined();
      expect(result.signal).toBeNull();
      expect(result.status, output).not.toBe(0);
      expect(output).toContain("[InvalidContentEntryDataError]");
      expect(output).toContain('Unrecognized key: "__proto__"');
    },
    30_000,
  );
});
