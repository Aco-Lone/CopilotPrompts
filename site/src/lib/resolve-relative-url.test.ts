import { describe, expect, it } from "vitest";
import { resolveRelativeUrl } from "./resolve-relative-url";
import type { CatalogRepositoryConfig } from "./types";

const config: CatalogRepositoryConfig = {
  owner: "Aco-Lone",
  repo: "CopilotPrompts",
  ref: "feature/catalog-v2",
};

describe("resolveRelativeUrl [BLD-011, OVR-003]", () => {
  it("resolves links under catalog item folders and percent-encodes path content [BLD-011]", () => {
    expect(resolveRelativeUrl("docs/guide 日本語.md", "review-agent", "link", config)).toBe(
      "https://github.com/Aco-Lone/CopilotPrompts/blob/feature/catalog-v2/catalog/review-agent/docs/guide%20%E6%97%A5%E6%9C%AC%E8%AA%9E.md",
    );
  });

  it("resolves image paths to raw.githubusercontent.com [BLD-011]", () => {
    expect(resolveRelativeUrl("images/team logo.png", "review-agent", "image", config)).toBe(
      "https://raw.githubusercontent.com/Aco-Lone/CopilotPrompts/feature/catalog-v2/catalog/review-agent/images/team%20logo.png",
    );
  });

  it("resolves parent-relative paths against the catalog folder [BLD-011]", () => {
    expect(resolveRelativeUrl("../shared/guide.md", "review-agent", "link", config)).toBe(
      "https://github.com/Aco-Lone/CopilotPrompts/blob/feature/catalog-v2/catalog/shared/guide.md",
    );
  });

  it.each([
    "https://example.com/path with spaces",
    "http://example.com/guide",
    "mailto:team@example.com",
    "#installation",
  ])("preserves absolute and page-anchor URLs unchanged [BLD-011]", (url) => {
    expect(resolveRelativeUrl(url, "review-agent", "link", config)).toBe(url);
  });

  it("throws for an invalid item slug [BLD-011]", () => {
    expect(() => resolveRelativeUrl("../other.md", "../escape", "link", config)).toThrow(/slug/i);
  });

  it("does not mutate config or treat path text as HTML [BLD-011]", () => {
    const frozenConfig = Object.freeze({ ...config });
    const path = "folder/<script>alert(1)</script>.md";

    const resolved = resolveRelativeUrl(path, "review-agent", "link", frozenConfig);

    expect(resolved).toContain("%3Cscript%3Ealert(1)%3C/script%3E.md");
    expect(resolved).not.toMatch(/[<>]/u);
    expect(frozenConfig).toEqual(config);
    expect(path).toBe("folder/<script>alert(1)</script>.md");
  });
});
