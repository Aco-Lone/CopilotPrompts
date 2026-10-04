import type { CatalogQuery } from "./types";

export function emptyQuery(): CatalogQuery {
  return { q: "", type: "all", tags: [] };
}

export function isEmptyQuery(query: CatalogQuery): boolean {
  return query.q === "" && query.type === "all" && query.tags.length === 0;
}

export function toggleTag(tags: readonly string[], tag: string): string[] {
  return tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
}

export function countLabel(shown: number, total: number): string {
  return `${shown} 件 / 全 ${total} 件`;
}
