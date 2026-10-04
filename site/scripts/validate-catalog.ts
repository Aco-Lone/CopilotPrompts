import { fileURLToPath } from "node:url";
import { validateCatalog } from "../src/lib/catalog-validation";

const catalogRoot = fileURLToPath(new URL("../../catalog/", import.meta.url));
const result = await validateCatalog(catalogRoot);

if (result.valid) {
  console.log("Catalog validation passed.");
} else {
  for (const diagnostic of result.diagnostics) {
    const path = diagnostic.path === "." ? "catalog" : `catalog/${diagnostic.path}`;
    const key = diagnostic.key ? ` [${diagnostic.key}]` : "";
    console.error(`${path}${key}: ${diagnostic.message}`);
  }
  process.exitCode = 1;
}
