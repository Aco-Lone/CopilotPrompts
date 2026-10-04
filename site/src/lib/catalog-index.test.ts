import { describe, expect, it } from "vitest";
import { buildCatalogIndex } from "./catalog-index";
import type { CatalogItem } from "./types";

describe("buildCatalogIndex [BLD-007/013, OVR-003]", () => {
  it("projects, normalizes, and sorts entries without mutating source items", () => {
    const items: CatalogItem[] = [
      {
        slug: "zeta",
        title: "同じタイトル",
        summary: "Second item.",
        tags: ["ＦＯＯ", "Tag"],
        type: "prompt",
        body: "README body must not be indexed.",
        updated: "2025-02-03",
      },
      {
        slug: "beta",
        title: "同じタイトル",
        summary: "First item.",
        tags: ["Ａgent"],
        type: "agent",
        body: "Another README body.",
      },
      {
        slug: "alpha",
        title: "あいう",
        summary: "Japanese title sorts before the shared title.",
        tags: ["日本語"],
        type: "skill",
        version: "1.2.3",
      },
    ];
    const original = structuredClone(items);

    const index = buildCatalogIndex(items);

    expect(index.map(({ slug }) => slug)).toEqual(["alpha", "beta", "zeta"]);
    expect(index).toEqual([
      {
        slug: "alpha",
        title: "あいう",
        summary: "Japanese title sorts before the shared title.",
        tags: ["日本語"],
        normalizedTags: ["日本語"],
        type: "skill",
      },
      {
        slug: "beta",
        title: "同じタイトル",
        summary: "First item.",
        tags: ["Ａgent"],
        normalizedTags: ["agent"],
        type: "agent",
      },
      {
        slug: "zeta",
        title: "同じタイトル",
        summary: "Second item.",
        tags: ["ＦＯＯ", "Tag"],
        normalizedTags: ["foo", "tag"],
        type: "prompt",
        updated: "2025-02-03",
      },
    ]);
    expect(JSON.stringify(index)).not.toContain("README body");
    expect(JSON.stringify(index)).not.toContain("1.2.3");
    expect(items).toEqual(original);
    expect(index[2]?.tags).not.toBe(items[0]?.tags);
  });

  it("uses slug ascending as the title tie-breaker [BLD-013]", () => {
    const items: CatalogItem[] = [
      { slug: "z-item", title: "Same", summary: "Z", tags: ["z"], type: "prompt" },
      { slug: "a-item", title: "Same", summary: "A", tags: ["a"], type: "prompt" },
    ];

    expect(buildCatalogIndex(items).map(({ slug }) => slug)).toEqual(["a-item", "z-item"]);
  });

  it("throws when two catalog items have the same slug [BLD-013]", () => {
    const items: CatalogItem[] = [
      { slug: "duplicate", title: "One", summary: "One", tags: ["one"], type: "prompt" },
      { slug: "duplicate", title: "Two", summary: "Two", tags: ["two"], type: "agent" },
    ];

    expect(() => buildCatalogIndex(items)).toThrow(/duplicate/i);
  });

  it("returns an empty index for an empty catalog [BLD-007]", () => {
    expect(buildCatalogIndex([])).toEqual([]);
  });
});
