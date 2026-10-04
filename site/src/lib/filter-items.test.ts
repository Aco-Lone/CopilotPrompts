import { describe, expect, it } from "vitest";
import { filterItems, parseQuery, serializeQuery } from "./filter-items";
import type { CatalogIndexEntry, CatalogQuery } from "./types";

const entries: CatalogIndexEntry[] = [
  {
    slug: "copilot-agent",
    title: "Ｆｏｏ assistant",
    summary: "Reusable prompts for teams.",
    tags: ["ＣＯＰＩＬＯＴ", "Agent"],
    normalizedTags: ["copilot", "agent"],
    type: "agent",
  },
  {
    slug: "prompt-library",
    title: "Prompt library",
    summary: "A reusable catalog.",
    tags: ["team", "Ｆｏｏ"],
    normalizedTags: ["team", "foo"],
    type: "prompt",
  },
  {
    slug: "bundle-tools",
    title: "Tools bundle",
    summary: "Reusable tools for teams.",
    tags: ["copilot", "team"],
    normalizedTags: ["copilot", "team"],
    type: "bundle",
  },
];

describe("filterItems [TOP-003..006, OVR-003]", () => {
  it("requires every normalized search term and allows each term in any searchable field [TOP-003/004]", () => {
    const result = filterItems(entries, {
      q: "  ＦＯＯ　reusable ",
      type: "all",
      tags: [],
    });

    expect(result.map(({ slug }) => slug)).toEqual(["copilot-agent", "prompt-library"]);
  });

  it("requires the selected type and every selected normalized tag [TOP-005/006]", () => {
    const result = filterItems(entries, {
      q: "",
      type: "prompt",
      tags: ["foo", "team"],
    });

    expect(result.map(({ slug }) => slug)).toEqual(["prompt-library"]);
  });

  it("normalizes selected tags with the shared Task 2 normalizer [TOP-005/006]", () => {
    const result = filterItems(entries, {
      q: "",
      type: "all",
      tags: ["ＦＯＯ", "ＴＥＡＭ"],
    });

    expect(result.map(({ slug }) => slug)).toEqual(["prompt-library"]);
  });

  it("applies type and tag requirements independently with AND semantics [TOP-005/006]", () => {
    const promptWithOneTag: CatalogIndexEntry = {
      ...entries[1]!,
      slug: "prompt-team-only",
      tags: ["team"],
      normalizedTags: ["team"],
    };
    const bundleWithBothTags: CatalogIndexEntry = {
      ...entries[1]!,
      slug: "bundle-with-both-tags",
      type: "bundle",
    };

    const result = filterItems([entries[0]!, entries[1]!, promptWithOneTag, bundleWithBothTags], {
      q: "",
      type: "prompt",
      tags: ["foo", "team"],
    });

    expect(result.map(({ slug }) => slug)).toEqual(["prompt-library"]);
  });

  it("returns the stable matching subsequence without mutating entries [TOP-003..006]", () => {
    const original = structuredClone(entries);
    const result = filterItems(entries, { q: "reusable", type: "all", tags: [] });

    expect(result.map(({ slug }) => slug)).toEqual(["copilot-agent", "prompt-library", "bundle-tools"]);
    expect(result[0]).toBe(entries[0]);
    expect(result[1]).toBe(entries[1]);
    expect(entries).toEqual(original);
  });

  it("throws for a runtime query type outside the supported types [TOP-005]", () => {
    expect(() =>
      filterItems(entries, { q: "", type: "unknown", tags: [] } as unknown as CatalogQuery),
    ).toThrow(/type/i);
  });
});

describe("parseQuery [TOP-011/012, OVR-003]", () => {
  const knownTags = ["foo", "agent", "日本語"];

  it("decodes search text and tags, normalizes known tags, and ignores unknown values [TOP-011/012]", () => {
    expect(
      parseQuery("?q=%EF%BC%A6%EF%BC%AF%EF%BC%AF+%26+%E6%97%A5%E6%9C%AC%E8%AA%9E&type=prompt&tags=%EF%BC%A6%EF%BC%AF%EF%BC%AF%2Cunknown%2Cagent", knownTags),
    ).toEqual({
      q: "ＦＯＯ & 日本語",
      type: "prompt",
      tags: ["foo", "agent"],
    });
  });

  it("ignores an unsupported type and tags that are not known [TOP-012]", () => {
    expect(parseQuery("type=other&tags=unknown%2Cmissing", knownTags)).toEqual({
      q: "",
      type: "all",
      tags: [],
    });
  });

  it("uses the first type parameter when type appears more than once [TOP-011]", () => {
    expect(parseQuery("type=skill&type=prompt", knownTags).type).toBe("skill");
  });
});

describe("serializeQuery [TOP-013, OVR-003]", () => {
  const knownTags = ["foo", "日本語"];

  it("omits default values and serializes fields in canonical order with URI encoding [TOP-013]", () => {
    const query: CatalogQuery = {
      q: "ＦＯＯ & 日本語",
      type: "prompt",
      tags: ["foo", "日本語"],
    };

    expect(serializeQuery(query)).toBe(
      "q=%EF%BC%A6%EF%BC%AF%EF%BC%AF+%26+%E6%97%A5%E6%9C%AC%E8%AA%9E&type=prompt&tags=foo%2C%E6%97%A5%E6%9C%AC%E8%AA%9E",
    );
    expect(serializeQuery({ q: "", type: "all", tags: [] })).toBe("");
    expect(parseQuery(serializeQuery(query), knownTags)).toEqual(query);
  });
});
