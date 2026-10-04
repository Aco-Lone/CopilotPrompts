import { describe, expect, it } from "vitest";
import siteConfig from "../../site.config";
import { siteUrl } from "./site-urls";

describe("siteUrl [OVR-003]", () => {
  it("uses the configured Astro base for internal paths", () => {
    const base = siteConfig.base.replace(/\/+$/u, "");

    expect(siteUrl("/catalog/review-agent/")).toBe(`${base}/catalog/review-agent/`);
  });

  it("returns the configured base root when no path is provided", () => {
    const base = siteConfig.base.replace(/\/+$/u, "");

    expect(siteUrl("")).toBe(`${base}/`);
  });
});
