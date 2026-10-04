import { normalizeTag } from "./item-schema";
import type { CatalogIndexEntry, CatalogItem, CatalogTagCount } from "./types";

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

export function buildTagCounts(entries: readonly CatalogIndexEntry[]): CatalogTagCount[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of new Set(entry.normalizedTags)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(counts, ([tag, count]) => ({ tag, count })).sort(
    (left, right) =>
      right.count - left.count || (left.tag < right.tag ? -1 : left.tag > right.tag ? 1 : 0),
  );
}
