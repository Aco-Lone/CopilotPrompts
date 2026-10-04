export interface SiteConfig {
  owner: string;
  repo: string;
  ref: string;
  site: string;
  base: string;
}

export interface CatalogDiagnostic {
  path: string;
  key?: string;
  message: string;
}

export interface CatalogValidationResult {
  valid: boolean;
  diagnostics: CatalogDiagnostic[];
}
