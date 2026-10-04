import { describe, expect, it } from "vitest";
import { itemSchema, normalizeTag, validateSlug } from "./item-schema";

const validItem = {
  title: "Prompt title",
  summary: "A short summary.",
  tags: ["copilot"],
  type: "prompt",
};

describe("validateSlug [CNT-002]", () => {
  it("accepts lowercase alphanumeric segments separated by single hyphens", () => {
    expect(validateSlug("agent-42")).toBe(true);
    expect(validateSlug("a".repeat(64))).toBe(true);
  });

  it("rejects malformed and out-of-range slugs", () => {
    for (const slug of ["", "-agent", "agent-", "two--words", "Upper", "under_score", "agent\n", "a".repeat(65)]) {
      expect(validateSlug(slug)).toBe(false);
    }
  });

  it("throws TypeError for non-string runtime inputs", () => {
    expect(() => validateSlug(null as unknown as string)).toThrow(TypeError);
  });
});

describe("normalizeTag [CNT-006]", () => {
  it("applies NFKC and lowercase normalization idempotently without changing the input", () => {
    const input = "ＦＯＯ";
    const normalized = normalizeTag(input);

    expect(normalized).toBe("foo");
    expect(normalizeTag(normalized)).toBe(normalized);
    expect(input).toBe("ＦＯＯ");
  });

  it("throws RangeError for an empty tag", () => {
    expect(() => normalizeTag("")).toThrow(RangeError);
  });

  it("throws TypeError for non-string runtime inputs", () => {
    expect(() => normalizeTag(undefined as unknown as string)).toThrow(TypeError);
  });
});

describe("itemSchema [CNT-004..007, CNT-009]", () => {
  it("requires title, summary, tags, and type [CNT-004]", () => {
    for (const requiredField of ["title", "summary", "tags", "type"] as const) {
      const frontmatter = { ...validItem };
      delete frontmatter[requiredField];
      expect(itemSchema.safeParse(frontmatter).success).toBe(false);
    }
  });

  it("trims title and summary without mutating the source frontmatter", () => {
    const input = {
      ...validItem,
      title: "  Prompt title  ",
      summary: "  A short summary.  ",
    };
    const original = structuredClone(input);

    expect(itemSchema.parse(input)).toMatchObject({
      title: "Prompt title",
      summary: "A short summary.",
    });
    expect(input).toEqual(original);
  });

  it("accepts trimmed title values at the 1-80 character boundaries", () => {
    expect(itemSchema.safeParse({ ...validItem, title: "x" }).success).toBe(true);
    expect(itemSchema.safeParse({ ...validItem, title: ` ${"x".repeat(80)} ` }).success).toBe(true);
  });

  it("rejects empty and overlong titles after trimming", () => {
    expect(itemSchema.safeParse({ ...validItem, title: "   " }).success).toBe(false);
    expect(itemSchema.safeParse({ ...validItem, title: "x".repeat(81) }).success).toBe(false);
  });

  it("accepts summary values at the 1-200 character boundaries", () => {
    expect(itemSchema.safeParse({ ...validItem, summary: "x" }).success).toBe(true);
    expect(itemSchema.safeParse({ ...validItem, summary: "x".repeat(200) }).success).toBe(true);
  });

  it("rejects empty, overlong, and newline-containing summaries", () => {
    for (const summary of ["   ", "x".repeat(201), "first\nsecond", "\nsummary"]) {
      expect(itemSchema.safeParse({ ...validItem, summary }).success).toBe(false);
    }
  });

  it("rejects Unicode line separators in summaries", () => {
    for (const summary of ["first\u2028second", "first\u2029second"]) {
      expect(itemSchema.safeParse({ ...validItem, summary }).success).toBe(false);
    }
  });

  it("accepts one through ten tags and 1-30 character tag boundaries", () => {
    expect(itemSchema.safeParse({ ...validItem, tags: ["x"] }).success).toBe(true);
    expect(itemSchema.safeParse({ ...validItem, tags: ["x".repeat(30)] }).success).toBe(true);
    expect(itemSchema.safeParse({ ...validItem, tags: Array.from({ length: 10 }, (_, i) => `tag${i}`) }).success)
      .toBe(true);
  });

  it("rejects empty, overlong, too few, and too many tags", () => {
    for (const tags of [[], [""], ["x".repeat(31)], Array.from({ length: 11 }, (_, i) => `tag${i}`)]) {
      expect(itemSchema.safeParse({ ...validItem, tags }).success).toBe(false);
    }
  });

  it("rejects tags containing whitespace or commas", () => {
    for (const tag of ["two words", "two\twords", "one,two", "one，two"]) {
      expect(itemSchema.safeParse({ ...validItem, tags: [tag] }).success).toBe(false);
    }
  });

  it("rejects duplicate tags after NFKC and lowercase normalization", () => {
    expect(itemSchema.safeParse({ ...validItem, tags: ["ＦＯＯ", "foo"] }).success).toBe(false);
  });

  it("accepts all catalog types and rejects unknown types", () => {
    for (const type of ["agent", "skill", "prompt", "bundle"]) {
      expect(itemSchema.safeParse({ ...validItem, type }).success).toBe(true);
    }
    expect(itemSchema.safeParse({ ...validItem, type: "unknown" }).success).toBe(false);
  });

  it("accepts SemVer 2.0.0 versions and rejects invalid versions", () => {
    for (const version of ["0.0.0", "1.2.3-alpha.1+build.5"]) {
      expect(itemSchema.safeParse({ ...validItem, version }).success).toBe(true);
    }
    for (const version of ["01.2.3", "1.2", "1.2.3-01", "1.2.3\n"]) {
      expect(itemSchema.safeParse({ ...validItem, version }).success).toBe(false);
    }
  });

  it("accepts authors at the 1-50 character boundaries", () => {
    expect(itemSchema.safeParse({ ...validItem, author: "x" }).success).toBe(true);
    expect(itemSchema.safeParse({ ...validItem, author: "x".repeat(50) }).success).toBe(true);
  });

  it("rejects empty and overlong authors", () => {
    expect(itemSchema.safeParse({ ...validItem, author: "" }).success).toBe(false);
    expect(itemSchema.safeParse({ ...validItem, author: "x".repeat(51) }).success).toBe(false);
  });

  it("accepts real YYYY-MM-DD dates including leap days", () => {
    expect(itemSchema.safeParse({ ...validItem, updated: "2024-02-29" }).success).toBe(true);
  });

  it("rejects impossible and incorrectly formatted dates", () => {
    for (const updated of ["2025-02-29", "2024-04-31", "2024-2-01", "2024-02-29\n", "not-a-date"]) {
      expect(itemSchema.safeParse({ ...validItem, updated }).success).toBe(false);
    }
  });

  it("rejects unknown frontmatter keys", () => {
    expect(itemSchema.safeParse({ ...validItem, unknown: "not allowed" }).success).toBe(false);
  });
});
