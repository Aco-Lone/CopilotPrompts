import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified, type Plugin } from "unified";
import { visit } from "unist-util-visit";
import { resolveRelativeUrl } from "./resolve-relative-url";
import type { SiteConfig } from "./types";

const safeMarkdownSchema: typeof defaultSchema = {
  allowComments: false,
  allowDoctypes: false,
  ancestors: {
    tbody: ["table"],
  },
  attributes: {
    "*": ["abbr", "title"],
    a: ["href", ["rel", "noopener", "noreferrer"]],
    code: [["className", /^language-[a-z0-9+._-]+$/iu]],
    img: ["src", "alt", "title", "width", "height"],
    input: [["type", "checkbox"], "checked", "disabled"],
    li: [["className", "task-list-item"]],
    ol: ["start"],
    ul: [["className", "contains-task-list"]],
  },
  clobber: ["id", "name"],
  clobberPrefix: "user-content-",
  protocols: {
    href: ["http", "https", "mailto"],
    src: ["http", "https"],
  },
  required: {
    input: {
      disabled: true,
      type: "checkbox",
    },
  },
  strip: ["embed", "iframe", "object", "script", "style"],
  tagNames: [
    "a",
    "abbr",
    "b",
    "blockquote",
    "br",
    "caption",
    "code",
    "dd",
    "del",
    "details",
    "div",
    "dl",
    "dt",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "i",
    "img",
    "input",
    "kbd",
    "li",
    "ol",
    "p",
    "pre",
    "s",
    "samp",
    "section",
    "small",
    "span",
    "strong",
    "sub",
    "summary",
    "sup",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "ul",
    "var",
  ],
};

interface ElementLike {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
}

function trimAsciiUrlWhitespace(url: string): string {
  // Unicode whitespace can be part of a catalog filename.
  return url.replace(/^[\t\n\f\r ]+|[\t\n\f\r ]+$/gu, "");
}

function shouldDeferUrlToSanitizer(url: string): boolean {
  const trimmedUrl = trimAsciiUrlWhitespace(url);
  return /^[a-z][a-z\d+.-]*:/iu.test(trimmedUrl) && !/^(?:https?:|mailto:)/iu.test(trimmedUrl);
}

function normalizeSafeUrlScheme(url: string): string {
  // The sanitizer checks protocol casing; lowercasing only the scheme preserves URL semantics.
  return url.replace(/^(https?|mailto):/iu, (scheme) => scheme.toLowerCase());
}

const rewriteItemRelativeUrls: Plugin<[slug: string, siteConfig: SiteConfig]> = (
  slug,
  siteConfig,
) => (tree) => {
  visit(tree, (node) => {
    const element = node as ElementLike;
    if (element.type !== "element") {
      return;
    }

    const kind = element.tagName === "a" ? "link" : element.tagName === "img" ? "image" : null;
    if (!kind || !element.properties) {
      return;
    }

    const property = kind === "link" ? "href" : "src";
    const url = element.properties[property];
    if (typeof url !== "string") {
      return;
    }

    const trimmedUrl = trimAsciiUrlWhitespace(url);
    if (shouldDeferUrlToSanitizer(trimmedUrl)) {
      return;
    }

    const hasScheme = /^[a-z][a-z\d+.-]*:/iu.test(trimmedUrl);
    const urlToResolve = hasScheme ? trimmedUrl : url;
    const resolvedUrl = resolveRelativeUrl(urlToResolve, slug, kind, siteConfig);
    element.properties[property] = hasScheme ? normalizeSafeUrlScheme(resolvedUrl) : resolvedUrl;
  });
};

const addExternalLinkRel: Plugin = () => (tree) => {
  visit(tree, (node) => {
    const element = node as ElementLike;
    if (element.type !== "element") {
      return;
    }

    if (element.tagName !== "a" || !element.properties) {
      return;
    }

    const href = element.properties.href;
    if (
      typeof href === "string" &&
      (/^(?:https?:|mailto:)/iu.test(href) || href.startsWith("//"))
    ) {
      element.properties.rel = ["noopener", "noreferrer"];
    }
  });
};

export function renderMarkdown(body: string, slug: string, siteConfig: SiteConfig): string {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rewriteItemRelativeUrls, slug, siteConfig)
    .use(addExternalLinkRel)
    .use(rehypeSanitize, safeMarkdownSchema)
    .use(rehypeStringify)
    .processSync(body)
    .toString();
}
