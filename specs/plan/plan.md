# Copilot カタログサイト実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `catalog/` の各配布アイテムを情報源とする Astro 静的カタログを構築し、既存のプロンプト資産を移行して GitHub Pages で公開する。

**Architecture:** `catalog/<slug>/README.md` を Content Collections で収集し、共有スキーマと独立した検証コマンドで全件を検証する。副作用のない `site/src/lib/` の関数で索引・検索・コマンド・リンクを生成し、Astro が一覧・詳細・404 を静的生成する。ブラウザー側 JavaScript は一覧の絞り込みとコピーに限定し、GitHub Actions は同じ検証・テスト・ビルド手順を PR と Pages デプロイに適用する。

**Tech Stack:** Astro static output, TypeScript `strict`, Astro Content Collections, Zod, unified (`remark-gfm` / `rehype-sanitize`), npm lockfile, Vitest, Playwright, axe-core, Lighthouse CI, GitHub Actions.

---

## 達成状況（停止時点: 2026-10-04 23:11 JST）

作業はユーザー指示により停止。Branch は `feat/catalog-site`、停止時の HEAD は `0eedf9d8c32ac283909b3ef306cebb3033422d1e`、作業ツリーは clean。

| Task | 状態 | 成果・検証 |
|---|---|---|
| 1. Astro 基盤 | 完了 | `9a08f3a`。`npm ci`、`npm run check`（診断 0）、静的 build 成功。仕様・品質レビュー通過。 |
| 2. コンテンツ検証 | 完了 | `a90799b`〜`62ca95b`。Zod schema、集約 validator、Content Collection loader。TDD 回帰テストを含む 48/48、check 成功。仕様・品質レビュー通過。 |
| 3. 共通ロジック | 完了 | `df24872`, `975706e`。索引、タグ件数、絞り込み、query、giget、URL、ファイル一覧。82/82、check 成功。仕様レビュー通過、品質レビューで重大な問題なし。 |
| 4. 既存資産移行 | 完了 | `91b5731`, `273ab22`。29 ファイルを 5 バンドルへ R100 移行、README 5 件作成、root README 更新。`npm run validate` 成功。仕様・品質レビュー通過。 |
| 5. Markdown renderer | 停止中・未最終レビュー | `f6f684a`〜`0eedf9d`。GFM、HTML allowlist sanitization、相対 URL 解決と複数の回帰修正を実装。最新 agent 報告は renderer 30/30、全体 112/112、check/validate/build 成功。 |
| 6. トップページ | 未着手 | 検索・種別/タグ絞り込み、URL 同期、a11y、no-JS 対応。 |
| 7. 詳細・404 ページ | 未着手 | README 表示、ダウンロード・コピー、ファイル一覧、404。 |
| 8. 品質ゲート | 未着手 | E2E 3 browser、axe、性能、サイズ、Lighthouse。 |
| 9. CI / Pages | 未着手 | PR 検証、GitHub Pages deploy、giget 実取得確認。 |

**停止位置の注意:** 最後の仕様レビューは `61dfcc5` を対象にし、タブを含む protocol-relative URL の `rel` と tab-prefixed HTTPS の扱いに不足を指摘した。実装 agent はこれを `0eedf9d` で修正したと報告しているが、その commit 自体の spec / code-quality 再レビューは未実施。再開時は Task 5 の最新 commit をレビューしてから Task 6 に進む。Pages は未公開で、root README の URL は初回デプロイ後に利用可能と明記済み。

---

## 計画作成時の現状・対象範囲

- 計画作成時のリポジトリは Markdown のプロンプト資産と `specs/` のみで、`site/`、`catalog/`、GitHub Actions のワークフローはまだなく、作業ツリーは clean だった。
- 移行前に、仕様に列挙された配布対象 29 件が追跡されていること、および対応表外のルート直下 `*.agent.md` / `*.prompt.md` / `agents-config.md` がないことを確認した。
- スコープは確認済みのとおり `specs/00`〜`specs/08` の全要件。既存 5 バンドルの移行、PR 検証、Pages 公開も含める。
- 画面・文言は日本語、実行時サーバーや外部 API は使用しない。リポジトリ設定に必要な Pages Source の切り替えはコード外の公開作業として最後に確認する。
- 仕様の構成例にある `astro.config.mjs` ではなく `astro.config.ts` を使う。`site/site.config.ts` を型安全に直接読み込み、`site` と `base` の値を二重定義しないための限定的な変更。

## 変更対象ファイル

| 区分 | 主なファイル | 役割 |
|---|---|---|
| Astro 基盤 | `site/package.json`, `site/package-lock.json`, `site/.nvmrc`, `site/astro.config.ts`, `site/site.config.ts`, `site/tsconfig.json`, `site/.gitignore` | 静的ビルド、依存固定、strict 型検査、サイト設定 |
| コンテンツ検証 | `site/src/content.config.ts`, `site/src/lib/types.ts`, `site/src/lib/item-schema.ts`, `site/src/lib/catalog-validation.ts`, `site/scripts/validate-catalog.ts` | README 収集、スキーマ、slug・フォルダ規約、一括エラー報告 |
| 共通ロジック | `site/src/lib/catalog-index.ts`, `site/src/lib/filter-items.ts`, `site/src/lib/download-command.ts`, `site/src/lib/resolve-relative-url.ts`, `site/src/lib/list-item-files.ts`, `site/src/lib/site-urls.ts` | 索引、検索、URL・コマンド生成、ファイル一覧 |
| Markdown と画面 | `site/src/lib/render-markdown.ts`, `site/src/pages/index.astro`, `site/src/pages/items/[slug].astro`, `site/src/pages/404.astro`, `site/src/components/`, `site/src/scripts/`, `site/src/styles/global.css` | サニタイズ済み本文、一覧・詳細画面、コピー操作、レスポンシブ表示 |
| テスト・計測 | `site/src/lib/**/*.test.ts`, `site/tests/`, `site/scripts/check-client-size.ts`, `site/lighthouserc.cjs`, `site/playwright.config.ts`, `site/vitest.config.ts` | 契約テスト、E2E/a11y/性能、JS サイズと Lighthouse |
| コンテンツ移行 | `catalog/<slug>/`, ルート `README.md`, 既存のルート直下エージェント群と `README/` | 5 バンドルの配置、アイテム README、投稿者向け説明 |
| CI/CD | `.github/workflows/validate.yml`, `.github/workflows/deploy-pages.yml` | PR 検証、GitHub Pages 公開 |

## 実装タスク

### Task 1: Astro 基盤と単一サイト設定を用意する

**依存:** なし

**Files:**
- Create: `site/package.json`, `site/package-lock.json`, `site/.nvmrc`, `site/.gitignore`
- Create: `site/astro.config.ts`, `site/site.config.ts`, `site/tsconfig.json`
- Create: `site/src/lib/types.ts`, `site/src/layouts/SiteLayout.astro`, `site/src/pages/index.astro`

- [ ] Astro の静的出力プロジェクトを作り、TypeScript `strict` を有効にする。`site/site.config.ts` を唯一の `owner=Aco-Lone`, `repo=CopilotPrompts`, `ref=main`, `site=https://aco-lone.github.io`, `base=/CopilotPrompts` の情報源とし、`astro.config.ts` はそこから `site` と `base` を読む。
- [ ] `.nvmrc` に Node.js 24 LTS を指定し、Astro / TypeScript / `@astrojs/check` の依存を追加してロックファイルを生成する。`site/.gitignore` で `node_modules`, `.astro`, `dist`, `coverage`, `playwright-report`, `test-results` を除外する。
- [ ] 初期レイアウトに `<html lang="ja">` を置き、`dev`, `check`, `build`, `preview` の npm scripts を定義する。ここでは最小のトップページで静的生成まで通し、後続タスクでページ内容を置き換える。
- [ ] `Set-Location site; npm ci` と `npm run check`、`npm run build` を実行し、ロックファイルからの再現可能な導入、型検査、静的成果物生成が成功することを確認する。

### Task 2: Content Collection と全件検証コマンドを実装する

**依存:** Task 1

**Files:**
- Create: `site/src/lib/item-schema.ts`, `site/src/lib/catalog-validation.ts`
- Create: `site/src/content.config.ts`, `site/scripts/validate-catalog.ts`
- Create: `site/src/lib/item-schema.test.ts`, `site/src/lib/catalog-validation.test.ts`, `site/vitest.config.ts`
- Modify: `site/package.json`, `site/package-lock.json`

- [ ] 先に `validateSlug` / `normalizeTag` / `itemSchema` のテストを書く。slug は `^[a-z0-9]+(-[a-z0-9]+)*$` と 1〜64 文字、title は trim 後 1〜80 文字、summary は trim 後 1〜200 文字かつ改行なし、tags は 1〜10 件で各 1〜30 文字・空白/カンマなし・正規化後重複なし、type は `agent` / `skill` / `prompt` / `bundle`、version は SemVer 2.0.0、author は 1〜50 文字、updated は実在する `YYYY-MM-DD` 日付を検査する。title/summary の trim 後の値を返し、入力を変更しないこともテストする。
- [ ] 一時ディレクトリを使う検証テストを追加し、YAML 欠落・構文エラー、README 欠落、catalog 直下の余分なファイル、未知キー、必須ファイル不足、skill 名不一致、複数エラーの一括報告、空カタログ成功、検証によるファイル変更なしを確認する。種別ごとに `agent` は直下 `*.agent.md` 1 件以上、`prompt` は直下 `*.prompt.md` 1 件以上、`skill` は直下 `SKILL.md` 1 件かつ frontmatter の `name=slug`、`bundle` は README 以外のファイル 1 件以上（再帰対象）を検証する。`validateSlug` の非文字列は `TypeError`、`normalizeTag` の空文字列は `RangeError` とし、要件 ID をテスト名またはコメントに含める。
- [ ] テストを実行して未実装による失敗を確認する。
- [ ] strict な Zod スキーマと共通型を実装し、Astro の glob Content Collection から `catalog/*/README.md` を収集して ID を slug にする。`catalog/README.md` はアイテムに含めない。
- [ ] `validateCatalog(root)` を作り、全フォルダを走査して schema・slug・catalog 直下の配置・種別別必須ファイル・skill 名を検証する。YAML/スキーマ違反はファイルパス・キー・違反内容を集約して返し、CLI は成功時 0、違反時非 0 で終了する。予期しない I/O エラーは黙殺しない。
- [ ] `npm run validate` を追加し、`npm run build` は同じ検証を先に実行して不正なカタログを生成しないようにする。現時点では実データが未移行のため、一時フィクスチャに対する `npm exec vitest -- run src/lib/item-schema.test.ts src/lib/catalog-validation.test.ts` と `npm run check` を成功させる。

### Task 3: 索引・検索・コマンド・相対 URL の純粋関数を実装する

**依存:** Task 2

**Files:**
- Create: `site/src/lib/catalog-index.ts`, `site/src/lib/filter-items.ts`
- Create: `site/src/lib/download-command.ts`, `site/src/lib/resolve-relative-url.ts`
- Create: `site/src/lib/list-item-files.ts`, `site/src/lib/site-urls.ts`
- Create: 各 `site/src/lib/*.test.ts`

- [ ] 各関数の契約テストを先に作る。`buildCatalogIndex` は ja ロケール title 順・slug 同値順、slug 重複時エラー、入力を変更しないことを確認する。`filterItems` は NFKC+小文字化、半角/全角空白区切りキーワード AND、title/summary/tags 内 OR、type 条件、全選択タグ AND を検証する。
- [ ] TOP-008 用に正規化タグごとの総件数を返す小さな純粋関数を用意し、同一アイテム内ではタグを一度だけ数え、件数降順・同数時は正規化タグ名昇順となる unit test を追加する。
- [ ] `parseQuery` / `serializeQuery` の往復性、無効な type/tag の除去と既定値の URL 除去、`buildGigetCommand` の出力 `npx giget@latest gh:${owner}/${repo}/catalog/${slug}#${ref} ./${slug}`、owner/repo の `^[A-Za-z0-9_.-]+$`、ref の `^[A-Za-z0-9._/-]+$`、無効キー名付きエラー、`--force` 不含有をテストする。
- [ ] `resolveRelativeUrl` が相対リンクを GitHub `blob` URL、相対画像を `raw.githubusercontent.com` URL に変換し、`../` を item directory 基準で解決し、絶対 URL・`mailto:`・アンカーを保つことをテストする。`listItemFiles` は README を含む全ファイルを `/` 区切り昇順で返し、存在しない directory ではエラーを送出することを確認する。
- [ ] テストを失敗させた後に実装する。owner/repo/ref は仕様の正規表現で検証し、URL 生成は base 設定から行い、内部リンクに `/` 始まりの直書きを使わない。
- [ ] `npm exec vitest -- run src/lib` と `npm run check` を実行する。全関数が入力を変更せず、同じ入力から同じ結果を返すことを確認する。

### Task 4: 既存ファイルを 5 つの catalog アイテムへ移行する

**依存:** Task 2

**Files:**
- Move: 下記 29 ファイルを各 `catalog/<slug>/` へ `git mv`
- Create: `catalog/<slug>/README.md` を 5 件
- Modify: ルート `README.md`
- Delete: `README/TDD-AGENT-README.md`, `README/REVERSE-AGENT-README.md`（内容を移した後）

- [ ] 移行前にルート直下の `*.agent.md`, `*.prompt.md`, `agents-config.md` を再確認し、対応表外のファイルがあれば移行を止めて対応表の判断を得る。
- [ ] `catalog/tdd-orchestration/` に `tdd-orchestrator.agent.md`, `design-analyst.agent.md`, `csharp-test-writer.agent.md`, `csharp-implementer.agent.md`, `code-refactorer.agent.md`, `code-reviewer.agent.md`, `ci-verifier.agent.md` を移す。
- [ ] `catalog/reverse-engineering-docs/` に `design-reverser.agent.md`, `reverse-architecture-analyst.agent.md`, `reverse-static-analyst.agent.md`, `reverse-dynamic-analyst.agent.md`, `reverse-exception-analyst.agent.md`, `reverse-doc-assembler.agent.md` を移す。
- [ ] `catalog/csharp-impl-orchestration/` に `impl-orchestrator.agent.md`, `impl-design-analyzer.agent.md`, `impl-class-implementer.agent.md`, `impl-build-verifier.agent.md`, `impl-integration-checker.agent.md`, `impl-reviewer.agent.md`, `agents-config.md` を移す。
- [ ] `catalog/speckit-harness/` に `harness.orchestrator.agent.md`, `harness.orchestrator.prompt.md`, `harness.review.agent.md`, `harness.repair.agent.md`, `harness.context-sync.agent.md` を移す。
- [ ] `catalog/speckit-input-dialogs/` に `spec-input-dialog.agent.md`, `plan-input-dialog.agent.md`, `tasks-input-dialog.agent.md`, `constitution-facilitator.agent.md` を移す。
- [ ] 各 README に `specs/07-migration.md` の title/summary/tags と `type: bundle` を設定する。TDD と reverse-engineering の本文には既存 README の説明・表・コード例を欠落なく移し、他の 3 件は各エージェントの description と既存説明から作る。
- [ ] 5 件の frontmatter は移行仕様の値をそのまま使う。`tdd-orchestration`: 「TDD オーケストレーション」/ tags `tdd,csharp,orchestration,testing`; `reverse-engineering-docs`: 「リバースエンジニアリング設計書生成」/ `reverse-engineering,design-doc,asciidoc,plantuml,orchestration`; `csharp-impl-orchestration`: 「設計書ベース C# 実装」/ `csharp,implementation,design-doc,orchestration`; `speckit-harness`: 「Speckit ハーネス」/ `speckit,harness,orchestration,review`; `speckit-input-dialogs`: 「Speckit 入力整理ダイアログ」/ `speckit,requirements,dialog`。各 summary も `specs/07-migration.md` の表と一致させ、5 件すべて `type: bundle` とする。
- [ ] ルート README をサイト URL、`catalog/` の構造、アイテム追加手順、`specs/01-content-model.md` へのリンクを含む案内に置き換える。個別アイテムの説明表は残さない。移した README と空の `README/` は削除する。
- [ ] `npm run validate` を実行し、5 アイテムが全件検証を通ること、ルート直下に配布対象ファイルが残らないこと、移動した 29 ファイルが `git diff --stat --find-renames=100%` で内容変更なしの rename として検出されることを確認する。

### Task 5: GFM 本文の変換・サニタイズを実装する

**依存:** Task 3

**Files:**
- Create: `site/src/lib/render-markdown.ts`
- Create: `site/src/lib/render-markdown.test.ts`
- Modify: `site/package.json`, `site/package-lock.json`

- [ ] `renderMarkdown` のテストを先に作り、表・タスクリスト・打ち消し線・自動リンク・画像・通常リンクが保持され、frontmatter が出力に混入しないことを確認する。
- [ ] 悪性 Markdown のテストで `<script>`, `<iframe>`, `<object>`, `<embed>`, `<style>`, `on*` 属性、`javascript:` / `data:` URL が出力されないこと、別オリジンのリンクに `rel="noopener noreferrer"` が付くことを確認する。
- [ ] unified + `remark-gfm` で GFM を処理し、item の slug を渡して AST 上で相対リンク先を Task 3 の関数により解決し、明示的な許可リストを持つ `rehype-sanitize` の後で HTML に変換する。未サニタイズ HTML を `set:html` に渡さない。
- [ ] `npm exec vitest -- run src/lib/render-markdown.test.ts` と `npm run check` を実行し、通常要素の保持と不許可要素の除去を確認する。

### Task 6: 検索・絞り込み可能なトップページを作る

**依存:** Task 3、Task 4

**Files:**
- Create/Modify: `site/src/pages/index.astro`, `site/src/components/ItemCard.astro`
- Create: `site/src/components/FilterControls.astro`, `site/src/scripts/catalog-filter.ts`
- Create/Modify: `site/src/styles/global.css`, `site/src/layouts/SiteLayout.astro`

- [ ] 静的 HTML に全アイテムを索引順で出し、title・summary・種別・README 表記の tags を表示する。`buildCatalogIndex` の索引を安全に JSON 化して埋め込む。JSON 内の `<` はスクリプト終端にならない形にし、HTML/属性の値は文脈に応じてエスケープする。
- [ ] JavaScript 有効時に検索・種別・タグフィルターを表示する。JavaScript 無効時は全カードとリンクを残し、検索・フィルター UI を表示しない。
- [ ] `<input type="search">` とクリアボタン、単一選択の種別ラジオ、複数選択タグボタン（`aria-pressed`）を実装する。タグは正規化値で重複を統合し、全件基準の件数降順、同数なら正規化タグ名昇順で並べる。件数は「N 件 / 全 M 件」、0 件時は「条件に一致するアイテムはありません」と全条件解除ボタンを表示する。解除時は検索空・種別すべて・タグ未選択に戻す。
- [ ] 検索・条件は Task 3 の `filterItems` を使い、カードの相対順序を維持する。タイトルとカード本体から詳細へ遷移できるリンクを用意し、タグボタンはそのリンクの外側に置いてタグ押下で遷移させない。
- [ ] URL query の `q`, `type`, `tags` の読み込み・更新を実装する。条件変更は `history.replaceState` で再読み込みや履歴増加を避け、空 query / `type=all` / 未選択 tags を URL から除去する。無効な type/tag は無視して URL からも除去する。カードのタグ押下は選択済み条件へ追加する。
- [ ] `aria-live="polite"` で件数・0 件状態を通知し、検索欄の可視ラベル、視認できる focus、視覚順と一致したキーボード順を用意する。カードの遷移リンクとタグボタンは入れ子にせず、タグ操作で詳細へ遷移させない。
- [ ] `npm run check` と `npm exec vitest -- run src/lib/filter-items.test.ts` を実行する。画面の E2E は Task 8 で実データを使って確認する。

### Task 7: 詳細ページ・コピー操作・404 を作る

**依存:** Task 3、Task 4、Task 5

**Files:**
- Create: `site/src/pages/items/[slug].astro`, `site/src/pages/404.astro`
- Create: `site/src/components/CopyButton.astro`, `site/src/scripts/copy-command.ts`
- Modify: `site/src/styles/global.css`

- [ ] slug ごとの静的詳細ページを生成し、パンくず、title、summary、type、tags、指定された optional metadata、ソースリンク、Markdown 本文、同梱ファイル一覧を表示する。本文が空なら「説明はありません」を表示する。
- [ ] ダウンロード欄に `buildGigetCommand` の 1 行を折り返しなしで表示し、ブロック内スクロールを有効にする。Node.js 要件、作成されるフォルダ、既存フォルダでは失敗すること、手動で `--force` を追加できる注意を表示し、コピー文字列には注意を含めない。
- [ ] CopyButton は押下時のみ `navigator.clipboard.writeText` を使う。成功時は近くの `aria-live` 領域に「コピーしました」を 2 秒表示する。API 不在・拒否時は「コピーできませんでした。コマンドを選択してコピーしてください」と表示し、表示中の command 全体（prompt 記号や前後の空白・改行なし）を選択する。空 command は生成時にエラーとする。
- [ ] ソースリンクと同梱ファイルリンクを BLD-010 の owner/repo/ref から生成する。ソースは `https://github.com/<owner>/<repo>/tree/<ref>/catalog/<slug>`、ファイルは昇順の相対パスで `blob` URL にする。外部リンクには `rel="noopener noreferrer"` を付け、ソースリンクは新しいタブで開く。タグリンクは base 配下のトップページに正規化 tag を渡す。
- [ ] 詳細ページの `<title>` は「`<title> | <サイト名>`」、meta description は summary とし、updated を `YYYY-MM-DD` で表示する。`404.astro` を配置して「アイテムが見つかりません」とトップページへのリンクを表示し、`site/dist/404.html` と HTTP 404 応答を後続のビルド/E2E で確認する。
- [ ] `npm run check` と `npm exec vitest -- run src/lib` を実行する。コピー API 成功・失敗・不在、メタ情報の有無、空本文、ファイル一覧、コマンド表示の E2E は Task 8 で確認する。

### Task 8: E2E、アクセシビリティ、性能・互換性ゲートを完成させる

**依存:** Task 3、Task 4、Task 5、Task 6、Task 7

**Files:**
- Create: `site/playwright.config.ts`, `site/tests/e2e/`, `site/tests/performance/`
- Create: `site/scripts/check-client-size.ts`, `site/lighthouserc.cjs`
- Modify: `site/package.json`, `site/package-lock.json`, `site/vitest.config.ts`

- [ ] Playwright を Chromium / Firefox / WebKit で設定し、`npm test` が `astro check`、Vitest、Playwright を順に実行するよう scripts を統合する。Vitest coverage は契約のある `src/lib/` の各ファイルで行カバレッジ 90% 以上を fail 条件にする。
- [ ] E2E で TOP-001〜014 と DTL-001〜012 の表示・遷移・検索・フィルター・URL 復元/補正・クリップボード成功/失敗・404・base パスを検証する。各テスト名またはコメントに要件 ID を付ける。
- [ ] `@axe-core/playwright` で各ページの違反 0 件を検査し、Tab/Shift+Tab/Enter/Space の操作、focus 表示、`aria-live`, `aria-pressed`, ラジオグループ、可視ラベルを検証する。
- [ ] JavaScript 無効で全カードと詳細リンクが使えること、悪意ある title/summary に `<script>` や `</script>` を含めても実行されず表示文字列は保持されること、ページロード時に外部要求・Cookie・CDN/外部フォントがないこと、外部 Markdown リンクの `rel` と許可された画像通信だけがあることを検証する。
- [ ] 360 / 768 / 1280 px で document 全体の横 overflow がなく、コマンド・コードブロックのみ内部横スクロールになることを検査する。Chromium / Firefox / WebKit の全テストを実行する。
- [ ] Playwright 専用 fixture generator で 500 アイテム・200 種類のタグを用意する。Chromium の CPU slowdown を 4 倍にし、Performance API で入力開始から DOM 更新までを計測し 100 ms 以下を assert する。
- [ ] ビルド成果物から各ページが読み込む JS を gzip 計測し合計 50 KiB 以下を assert する。Lighthouse CI はモバイル設定でトップ・詳細を計測し Performance 90 以上を必須にする。これらのコマンドは `npm run build` 成功後にも実行可能にする。
- [ ] `npm test` を実行し、unit coverage、型検査、3 エンジン E2E、a11y、性能閾値を確認する。続けて `npm run validate` と `npm run build` を実行し、実カタログ 5 件の静的出力、base 配下のリンク、`404.html` を確認する。

### Task 9: PR 検証と GitHub Pages デプロイを設定する

**依存:** Task 8

**Files:**
- Create: `.github/workflows/validate.yml`, `.github/workflows/deploy-pages.yml`
- Modify if needed: `site/package.json`, `site/package-lock.json`

- [ ] `validate.yml` を `main` 向け PR の `catalog/**` または `site/**` 変更で起動し、Pages 公開なし・`contents: read` のみで Node を `.nvmrc` から設定し、`site/` で `npm ci` → `npm run validate` → `npm test` → `npm run build` を実行する。
- [ ] `deploy-pages.yml` を `main` への `catalog/**`, `site/**`, または当該 workflow の変更 push と `workflow_dispatch` で起動する。checkout は常に `main` を指定し、手動実行でも `main` の最新コミットを公開する。権限を `contents: read`, `pages: write`, `id-token: write` に限定し、`concurrency: { group: pages, cancel-in-progress: false }` を設定する。
- [ ] デプロイ workflow は `npm ci` → `npm run validate` → `npm test` → `npm run build` の順を守る。ビルド後に JS gzip と Lighthouse のゲートを実行し、失敗時は後続の Pages 公開に進まない。成功時のみ `site/dist/` を `actions/upload-pages-artifact` で上げ、`actions/deploy-pages` で公開する。
- [ ] GitHub Pages の Source が「GitHub Actions」であることを確認する。初回公開後、代表アイテムで仕様の `npx giget@latest gh:Aco-Lone/CopilotPrompts/catalog/tdd-orchestration#main ./tdd-orchestration` を実行し、取得ファイル集合が同一 ref の `catalog/tdd-orchestration/` と一致することを手動確認する。

## 要件トレーサビリティ

| 仕様 | 主な実装タスク |
|---|---|
| `OVR-001`〜`OVR-003` | 1, 2, 5〜9 |
| `CNT-001`〜`CNT-010` | 2, 4 |
| `BLD-001`〜`BLD-014` | 1〜3, 5, 8 |
| `TOP-001`〜`TOP-014` | 3, 6, 8 |
| `DTL-001`〜`DTL-012` | 3, 5, 7, 8 |
| `CMD-001`〜`CMD-007` | 3, 7, 8 |
| `DEP-001`〜`DEP-008` | 9 |
| `MIG-001`〜`MIG-007` | 4, 8 |
| `NFR-001`〜`NFR-017` | 1〜3, 5〜9 |

## 完了判定

1. `site/` で `npm ci`, `npm run validate`, `npm test`, `npm run build` が成功する。
2. `npm test` に含まれる各契約テストで `site/src/lib/` の対象ファイルが 90% 以上の行カバレッジを満たす。
3. Playwright が Chromium / Firefox / WebKit で成功し、axe 違反 0 件、500 アイテムの応答 100 ms 以下、各ページの gzip JS 50 KiB 以下、Lighthouse モバイル Performance 90 以上を満たす。
4. 5 アイテムが一覧と詳細ページに出力され、全内部リンクが `/CopilotPrompts` base を尊重し、404・README サニタイズ・コピー失敗時の選択・JavaScript 無効時の閲覧が仕様どおり動く。
5. 29 個の配布ファイルが内容を変えず `catalog/` に移り、ルート README がカタログ案内になり、ルートに配布ファイルが残らない。
6. PR 検証は Pages に公開せず、デプロイは全ゲート成功時だけ公開する。代表アイテムの giget 取得内容が配布フォルダと一致する。
