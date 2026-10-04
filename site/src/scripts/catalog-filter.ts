import { emptyQuery, countLabel, isEmptyQuery, toggleTag } from "../lib/catalog-view";
import { filterItems, parseQuery, serializeQuery } from "../lib/filter-items";
import type { CatalogIndexEntry, CatalogQuery } from "../lib/types";

const index: CatalogIndexEntry[] = JSON.parse(
  document.getElementById("catalog-index")!.textContent ?? "[]",
);
const knownTags = index.flatMap((e) => e.normalizedTags);
const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

const filters = $("#filters");
const input = $<HTMLInputElement>("#q");
const count = $("#count");
const empty = $("#empty");
const cards = Array.from(document.querySelectorAll<HTMLElement>("#cards > .card"));
const radios = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="type"]'));
const filterTagButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-filter-tag]"));
const cardTagButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".card [data-tag]"));

let query: CatalogQuery = parseQuery(location.search, knownTags);

function render(updateUrl: boolean): void {
  const matched = new Set(filterItems(index, query).map((e) => e.slug));
  for (const card of cards) card.hidden = !matched.has(card.dataset.slug!);
  input.value = query.q;
  for (const r of radios) r.checked = r.value === query.type;
  const pressed = (b: HTMLButtonElement, tag?: string) =>
    b.setAttribute("aria-pressed", String(query.tags.includes(tag ?? "")));
  for (const b of filterTagButtons) pressed(b, b.dataset.filterTag);
  for (const b of cardTagButtons) pressed(b, b.dataset.tag);
  count.textContent = countLabel(matched.size, index.length);
  empty.hidden = matched.size > 0;
  if (updateUrl) {
    const qs = serializeQuery(query);
    history.replaceState(null, "", `${location.pathname}${qs ? `?${qs}` : ""}${location.hash}`);
  }
}

input.addEventListener("input", () => { query = { ...query, q: input.value }; render(true); });
$("#clear-search").addEventListener("click", () => { query = { ...query, q: "" }; render(true); input.focus(); });
for (const r of radios) {
  r.addEventListener("change", () => {
    if (r.checked) { query = { ...query, type: r.value as CatalogQuery["type"] }; render(true); }
  });
}
for (const b of filterTagButtons) {
  b.addEventListener("click", () => { query = { ...query, tags: toggleTag(query.tags, b.dataset.filterTag!) }; render(true); });
}
for (const b of cardTagButtons) {
  b.addEventListener("click", () => {
    const tag = b.dataset.tag!;
    if (!query.tags.includes(tag)) query = { ...query, tags: [...query.tags, tag] };
    render(true);
  });
}
$("#reset-all").addEventListener("click", () => { query = emptyQuery(); render(true); input.focus(); });

filters.hidden = false;
render(!isEmptyQuery(query) || location.search !== "");
