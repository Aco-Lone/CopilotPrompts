import { defineConfig } from "astro/config";
import siteConfig from "./site.config";

export default defineConfig({
  output: "static",
  site: siteConfig.site,
  base: siteConfig.base,
});
