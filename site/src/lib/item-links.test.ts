import { describe, expect, it } from "vitest";
import { buildFileUrl, buildSourceUrl } from "./item-links";

const cfg = { owner: "o", repo: "r", ref: "main" };

describe("item-links", () => {
  it("builds the source tree URL", () => {
    expect(buildSourceUrl("my-item", cfg)).toBe("https://github.com/o/r/tree/main/catalog/my-item");
  });

  it("builds blob URLs with encoded path segments", () => {
    expect(buildFileUrl("my-item", "sub/a b.md", cfg)).toBe(
      "https://github.com/o/r/blob/main/catalog/my-item/sub/a%20b.md",
    );
  });
});
