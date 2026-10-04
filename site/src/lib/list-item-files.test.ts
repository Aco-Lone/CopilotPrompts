import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { listItemFiles } from "./list-item-files";

const fixtureParent = fileURLToPath(new URL(".", import.meta.url));
const createdDirectories: string[] = [];

function createFixtureDirectory(): string {
  const directory = join(fixtureParent, `.item-files-fixture-${randomUUID()}`);
  mkdirSync(directory);
  createdDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of createdDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("listItemFiles [DTL-008, OVR-003]", () => {
  it("recursively lists every file including README.md in sorted slash-separated order [DTL-008]", () => {
    const itemDir = createFixtureDirectory();
    mkdirSync(join(itemDir, "nested", "deeper"), { recursive: true });
    writeFileSync(join(itemDir, "README.md"), "readme", "utf8");
    writeFileSync(join(itemDir, "z.prompt.md"), "prompt", "utf8");
    writeFileSync(join(itemDir, "nested", "b.txt"), "nested", "utf8");
    writeFileSync(join(itemDir, "nested", "deeper", "a.md"), "deep", "utf8");
    mkdirSync(join(itemDir, "empty-directory"));

    expect(listItemFiles(itemDir)).toEqual([
      "README.md",
      "nested/b.txt",
      "nested/deeper/a.md",
      "z.prompt.md",
    ]);
  });

  it("throws an actionable error when the item directory is missing [DTL-008]", () => {
    const missingDirectory = join(fixtureParent, `.missing-item-fixture-${randomUUID()}`);

    expect(() => listItemFiles(missingDirectory)).toThrow(
      `Item directory does not exist: ${missingDirectory}`,
    );
  });
});
