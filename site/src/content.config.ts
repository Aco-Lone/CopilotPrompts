import { defineCollection } from "astro:content";
import { catalogContentLoader } from "./lib/catalog-content-loader";
import { itemSchema } from "./lib/item-schema";

const items = defineCollection({
  loader: catalogContentLoader,
  schema: itemSchema,
});

export const collections = { items };
