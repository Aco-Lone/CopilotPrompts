import type { CatalogRepositoryConfig } from "./types";

import { validateSlug } from "./item-schema";

export type RelativeUrlKind = "link" | "image";

function encodePathSegments(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

function isPreservedUrl(value: string): boolean {
  return value.startsWith("#") || value.startsWith("//") || /^(?:https?:|mailto:)/iu.test(value);
}

export function resolveRelativeUrl(
  url: string,
  slug: string,
  kind: RelativeUrlKind,
  config: CatalogRepositoryConfig,
): string {
  if (!validateSlug(slug)) {
    throw new Error(`Invalid slug: ${slug}`);
  }
  if (kind !== "link" && kind !== "image") {
    throw new TypeError(`Invalid URL kind: ${String(kind)}`);
  }
  if (isPreservedUrl(url)) {
    return url;
  }

  const owner = encodeURIComponent(config.owner);
  const repo = encodeURIComponent(config.repo);
  const ref = encodePathSegments(config.ref);
  const base =
    kind === "link"
      ? new URL(`https://github.com/${owner}/${repo}/blob/${ref}/catalog/${slug}/`)
      : new URL(`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/catalog/${slug}/`);
  const resolved = new URL(url, base);

  if (resolved.origin !== base.origin) {
    throw new Error("Relative catalog URL must not change the repository origin");
  }

  return resolved.href;
}
