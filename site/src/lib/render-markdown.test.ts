import { describe, expect, it } from "vitest";
import { parseMarkdownFrontmatter } from "./markdown-frontmatter";
import { renderMarkdown } from "./render-markdown";
import type { SiteConfig } from "./types";

const siteConfig: SiteConfig = {
  owner: "Aco-Lone",
  repo: "CopilotPrompts",
  ref: "feature/catalog-v2",
  site: "https://prompts.example",
  base: "/",
};

describe("renderMarkdown [BLD-009, BLD-011, NFR-008/011, OVR-003]", () => {
  it("retains GFM tables and checkbox task lists [NFR-008, OVR-003]", () => {
    const html = renderMarkdown(
      "| Name | Value |\n| --- | --- |\n| one | two |\n\n- [x] complete\n- [ ] pending",
      "review-agent",
      siteConfig,
    );

    expect(html).toContain("<table>");
    expect(html).toContain("<th>Name</th>");
    expect(html).toContain("<td>two</td>");
    expect(html).toMatch(/<input\b[^>]*\btype="checkbox"[^>]*\bdisabled\b/u);
    expect(html).toMatch(/<input\b[^>]*\bchecked\b/u);
  });

  it("retains strikethrough, autolinks, headings, and inline and fenced code [NFR-008, OVR-003]", () => {
    const html = renderMarkdown(
      "# Overview\n\n~~deprecated~~ https://example.com\n\nUse `inline`.\n\n```ts\nconst answer = 42;\n```",
      "review-agent",
      siteConfig,
    );

    expect(html).toContain("<h1>Overview</h1>");
    expect(html).toContain("<del>deprecated</del>");
    expect(html).toContain('<a href="https://example.com" rel="noopener noreferrer">');
    expect(html).toContain("<code>inline</code>");
    expect(html).toContain('<pre><code class="language-ts">');
    expect(html).toContain("const answer = 42;");
  });

  it("retains blockquotes, ordinary lists, and paragraphs [NFR-008, OVR-003]", () => {
    const html = renderMarkdown(
      "> quoted text\n\n1. first item\n2. second item\n\nA regular paragraph.",
      "review-agent",
      siteConfig,
    );

    expect(html).toContain("<blockquote>");
    expect(html).toContain("<ol>");
    expect(html).toContain("<li>first item</li>");
    expect(html).toContain("<p>A regular paragraph.</p>");
  });

  it("resolves item-relative Markdown links and images with the shared URL resolver [BLD-011, OVR-003]", () => {
    const html = renderMarkdown(
      "[guide](docs/guide%20%E6%97%A5%E6%9C%AC%E8%AA%9E.md)\n\n![team](images/team%20logo.png \"Team logo\")",
      "review-agent",
      siteConfig,
    );

    expect(html).toContain(
      'href="https://github.com/Aco-Lone/CopilotPrompts/blob/feature/catalog-v2/catalog/review-agent/docs/guide%20%E6%97%A5%E6%9C%AC%E8%AA%9E.md"',
    );
    expect(html).toContain(
      'src="https://raw.githubusercontent.com/Aco-Lone/CopilotPrompts/feature/catalog-v2/catalog/review-agent/images/team%20logo.png"',
    );
    expect(html).toContain('alt="team"');
    expect(html).toContain('title="Team logo"');
  });

  it("resolves relative href values in raw HTML with the shared URL resolver [BLD-011, OVR-003]", () => {
    const html = renderMarkdown(
      '<a href="docs/guide.md">Guide</a>',
      "review-agent",
      siteConfig,
    );

    expect(html).toContain(
      'href="https://github.com/Aco-Lone/CopilotPrompts/blob/feature/catalog-v2/catalog/review-agent/docs/guide.md"',
    );
  });

  it("resolves relative src values in raw HTML with the shared URL resolver [BLD-011, OVR-003]", () => {
    const html = renderMarkdown(
      '<img src="images/example.png" alt="Example">',
      "review-agent",
      siteConfig,
    );

    expect(html).toContain(
      'src="https://raw.githubusercontent.com/Aco-Lone/CopilotPrompts/feature/catalog-v2/catalog/review-agent/images/example.png"',
    );
  });

  it("preserves a leading NBSP in raw relative href paths [BLD-011, OVR-003]", () => {
    const html = renderMarkdown(
      '<a href="\u00a0guide.md">Guide</a>',
      "review-agent",
      siteConfig,
    );

    expect(html).toContain(
      'href="https://github.com/Aco-Lone/CopilotPrompts/blob/feature/catalog-v2/catalog/review-agent/%C2%A0guide.md"',
    );
  });

  it("preserves a trailing NBSP in raw relative image paths [BLD-011, OVR-003]", () => {
    const html = renderMarkdown(
      '<img src="images/example.png\u00a0" alt="Example">',
      "review-agent",
      siteConfig,
    );

    expect(html).toContain(
      'src="https://raw.githubusercontent.com/Aco-Lone/CopilotPrompts/feature/catalog-v2/catalog/review-agent/images/example.png%C2%A0"',
    );
  });

  it("keeps whitespace-wrapped absolute HTTPS raw links external with safe rel [BLD-011, NFR-011, OVR-003]", () => {
    const html = renderMarkdown(
      '<a href=" https://example.com/path ">Example</a>',
      "review-agent",
      siteConfig,
    );

    expect(html).toContain(
      'href="https://example.com/path" rel="noopener noreferrer"',
    );
    expect(html).not.toContain("github.com");
  });

  it("keeps whitespace-wrapped absolute HTTPS raw images external [BLD-011, OVR-003]", () => {
    const html = renderMarkdown(
      '<img src=" https://example.com/image.png " alt="Example">',
      "review-agent",
      siteConfig,
    );

    expect(html).toContain('src="https://example.com/image.png"');
    expect(html).not.toContain("raw.githubusercontent.com");
  });

  it("passes whitespace-prefixed unsafe schemes through to the sanitizer [NFR-008, BLD-011, OVR-003]", () => {
    const html = renderMarkdown(
      '<a href=" javascript:alert(1) ">Unsafe link</a>\n\n<img src=" data:image/png;base64,AAAA " alt="Unsafe image">',
      "review-agent",
      siteConfig,
    );

    expect(html).toContain("Unsafe link");
    expect(html).not.toMatch(/(?:href|src)="[^"]*(?:javascript|data):/iu);
    expect(html).not.toMatch(/(?:javascript|data):/iu);
  });

  it("preserves mixed-case HTTPS links through sanitization [BLD-011, NFR-011, OVR-003]", () => {
    const html = renderMarkdown(
      '<a href="HTTPS://Example.COM/SomePath?Key=MiXeD">HTTPS</a>',
      "review-agent",
      siteConfig,
    );

    expect(html).toContain(
      'href="https://Example.COM/SomePath?Key=MiXeD" rel="noopener noreferrer"',
    );
    expect(html).not.toContain("github.com");
  });

  it("preserves mixed-case HTTP links through sanitization [BLD-011, NFR-011, OVR-003]", () => {
    const html = renderMarkdown(
      '<a href="Http://Example.COM/SomePath?Key=MiXeD">HTTP</a>',
      "review-agent",
      siteConfig,
    );

    expect(html).toContain(
      'href="http://Example.COM/SomePath?Key=MiXeD" rel="noopener noreferrer"',
    );
    expect(html).not.toContain("github.com");
  });

  it("preserves mixed-case MAILTO links through sanitization [BLD-011, NFR-011, OVR-003]", () => {
    const html = renderMarkdown(
      '<a href="MAILTO:Team@Example.COM?subject=MiXeD">Email</a>',
      "review-agent",
      siteConfig,
    );

    expect(html).toContain(
      'href="mailto:Team@Example.COM?subject=MiXeD" rel="noopener noreferrer"',
    );
  });

  it("preserves mixed-case HTTPS image URLs through sanitization [BLD-011, OVR-003]", () => {
    const html = renderMarkdown(
      '<img src="HTTPS://Images.Example.COM/path/Logo.PNG?Width=Large" alt="Logo">',
      "review-agent",
      siteConfig,
    );

    expect(html).toContain(
      'src="https://Images.Example.COM/path/Logo.PNG?Width=Large"',
    );
  });

  it("continues to remove mixed-case javascript and data URLs [NFR-008, OVR-003]", () => {
    const html = renderMarkdown(
      '<a href="JaVaScRiPt:alert(1)">Unsafe link</a>\n\n<img src="DaTa:image/png;base64,AAAA" alt="Unsafe image">',
      "review-agent",
      siteConfig,
    );

    expect(html).toContain("Unsafe link");
    expect(html).not.toMatch(/(?:href|src)="[^"]*(?:javascript|data):/iu);
    expect(html).not.toMatch(/(?:javascript|data):/iu);
  });

  it("preserves absolute HTTPS, mailto, and same-page anchor destinations [BLD-011, OVR-003]", () => {
    const html = renderMarkdown(
      "[web](https://example.com/path) [email](mailto:team@example.com) [section](#installation)",
      "review-agent",
      siteConfig,
    );

    expect(html).toContain('href="https://example.com/path"');
    expect(html).toContain('href="mailto:team@example.com"');
    expect(html).toContain('href="#installation"');
  });

  it("removes dangerous raw HTML, event handlers, and unsafe link or image schemes [NFR-008, OVR-003]", () => {
    const html = renderMarkdown(
      [
        "<script>alert(1)</script>",
        '<iframe src="https://evil.example"></iframe>',
        '<object data="https://evil.example"></object>',
        '<embed src="https://evil.example">',
        "<style>body { display: none }</style>",
        '<img src="https://example.com/image.png" onerror="alert(1)" onload="alert(2)">',
        '<a href="javascript:alert(1)" onclick="alert(3)">unsafe link</a>',
        '<a href="data:text/html,unsafe">unsafe data link</a>',
        "",
        "![unsafe](javascript:alert%281%29)",
        "![unsafe data](data:image/png;base64,AAAA)",
      ].join("\n"),
      "review-agent",
      siteConfig,
    );

    expect(html).not.toMatch(/<(?:script|iframe|object|embed|style)\b/iu);
    expect(html).not.toMatch(/\son[a-z]+\s*=/iu);
    expect(html).not.toMatch(/(?:javascript|data):/iu);
    expect(html).toContain("unsafe link");
  });

  it("adds safe rel tokens to external links while keeping same-page anchors functional [NFR-011, OVR-003]", () => {
    const html = renderMarkdown(
      '[external](https://example.com) [file](docs/guide.md) [anchor](#installation) <a href="https://example.org" rel="opener">raw external</a>',
      "review-agent",
      siteConfig,
    );

    expect(html).toContain(
      'href="https://example.com" rel="noopener noreferrer"',
    );
    expect(html).toContain(
      'href="https://github.com/Aco-Lone/CopilotPrompts/blob/feature/catalog-v2/catalog/review-agent/docs/guide.md" rel="noopener noreferrer"',
    );
    expect(html).toContain('href="https://example.org" rel="noopener noreferrer"');
    expect(html).toContain('href="#installation"');
    expect(html).not.toContain('href="#installation" rel=');
    expect(html).not.toContain('rel="opener"');
  });

  it("renders the already-parsed Markdown body without displaying YAML frontmatter [BLD-009, DTL-003, OVR-003]", () => {
    const parsed = parseMarkdownFrontmatter(
      "---\ntitle: Internal frontmatter title\ntags: [hidden]\n---\n# Visible README body\n\nThe catalog loader supplies this parsed body.",
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      throw new Error("Expected valid shared YAML frontmatter.");
    }

    const html = renderMarkdown(parsed.body, "review-agent", siteConfig);

    expect(html).toContain("<h1>Visible README body</h1>");
    expect(html).toContain("The catalog loader supplies this parsed body.");
    expect(html).not.toContain("Internal frontmatter title");
    expect(html).not.toContain("hidden");
  });
});
