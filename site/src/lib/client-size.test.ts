import { describe, expect, it } from "vitest";
import { extractScriptSrcs } from "./client-size";

describe("extractScriptSrcs", () => {
  it("returns module script and modulepreload sources", () => {
    const html = `<script type="module" src="/b/_astro/a.js"></script><link rel="modulepreload" href="/b/_astro/c.js"><script src="https://x.test/e.js"></script><script>inline()</script>`;
    expect(extractScriptSrcs(html)).toEqual(["/b/_astro/a.js", "/b/_astro/c.js"]);
  });
});
