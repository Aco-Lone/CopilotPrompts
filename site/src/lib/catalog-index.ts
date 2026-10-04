import type { CatalogIndexEntry, CatalogItem } from "./types";

import { normalizeTag } from "./item-schema";

export function buildCatalogIndex(items: CatalogItem[]): CatalogIndexEntry[] {
  const seenSlugs = new Set<string>();
  const entries = items.map((item) => {
    if (seenSlugs.has(item.slug)) {
      throw new Error(`Duplicate catalog item slug: ${item.slug}`);
    }
    seenSlugs.add(item.slug);

    return {
      slug: item.slug,
      title: item.title,
      summary: item.summary,
      tags: [...item.tags],
      normalizedTags: item.tags.map(normalizeTag),
      type: item.type,
      ...(item.updated === undefined ? {} : { updated: item.updated }),
    };
  });

  return entries.sort((left, right) => {
    const titleOrder = left.title.localeCompare(right.title, "ja");
    if (titleOrder !== 0) {
      return titleOrder;
    }
    return left.slug < right.slug ? -1 : left.slug > right.slug ? 1 : 0;
  });
}
