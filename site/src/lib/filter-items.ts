import { itemSchema, normalizeTag } from "./item-schema";
import type { CatalogIndexEntry, CatalogQuery, ItemType } from "./types";

function isItemType(value: unknown): value is ItemType {
  return itemSchema.shape.type.safeParse(value).success;
}

function normalizeSearchText(value: string): string {
  return value.length === 0 ? value : normalizeTag(value);
}

export function filterItems(
  entries: readonly CatalogIndexEntry[],
  query: CatalogQuery,
): CatalogIndexEntry[] {
  if (query.type !== "all" && !isItemType(query.type)) {
    throw new TypeError(`Invalid query type: ${String(query.type)}`);
  }

  const terms = normalizeSearchText(query.q)
    .trim()
    .split(/[\s\u3000]+/u)
    .filter(Boolean);
  const requiredTags = query.tags.map(normalizeTag);

  return entries.filter((entry) => {
    if (query.type !== "all" && entry.type !== query.type) {
      return false;
    }

    const entryTags = new Set(entry.normalizedTags);
    if (!requiredTags.every((tag) => entryTags.has(tag))) {
      return false;
    }

    const searchableText = [
      normalizeSearchText(entry.title),
      normalizeSearchText(entry.summary),
      ...entry.tags.map(normalizeSearchText),
    ];

    return terms.every((term) => searchableText.some((field) => field.includes(term)));
  });
}

export function parseQuery(search: string, knownTags: readonly string[]): CatalogQuery {
  const params = new URLSearchParams(search);
  const rawType = params.get("type");
  const type: CatalogQuery["type"] = isItemType(rawType) ? rawType : "all";
  const knownNormalizedTags = new Set(knownTags.map(normalizeTag));
  const tags: string[] = [];

  for (const value of params.getAll("tags")) {
    for (const rawTag of value.split(",")) {
      const tag = rawTag.trim();
      if (tag.length === 0) {
        continue;
      }

      const normalizedTag = normalizeTag(tag);
      if (knownNormalizedTags.has(normalizedTag) && !tags.includes(normalizedTag)) {
        tags.push(normalizedTag);
      }
    }
  }

  return {
    q: params.get("q") ?? "",
    type,
    tags,
  };
}

export function serializeQuery(query: CatalogQuery): string {
  if (query.type !== "all" && !isItemType(query.type)) {
    throw new TypeError(`Invalid query type: ${String(query.type)}`);
  }

  const params = new URLSearchParams();
  if (query.q !== "") {
    params.set("q", query.q);
  }
  if (query.type !== "all") {
    params.set("type", query.type);
  }
  if (query.tags.length > 0) {
    params.set("tags", query.tags.join(","));
  }
  return params.toString();
}
