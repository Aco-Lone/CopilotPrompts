# 02. ビルド（コンテンツ収集・検証・生成）

## 1. 構成

```text
<repo root>/
├── catalog/                 # 配布フォルダ群（01-content-model.md）
└── site/                    # Astro プロジェクト
    ├── astro.config.mjs
    ├── site.config.ts       # リポジトリ名・ブランチ・base パス等の一元設定
    └── src/
        ├── content.config.ts  # Content Collections 定義（itemSchema）
        ├── lib/               # buildCatalogIndex / buildGigetCommand / filterItems 等
        └── pages/
            ├── index.astro    # トップページ
            ├── items/[slug].astro  # 詳細ページ
            └── 404.astro
```

- Content Collections は glob ローダーで `catalog/*/README.md` を読み込む。
- ビルドコマンドは `site/` で `npm run build` とし、成果物は `site/dist/` に出力する。

## 2. 要件

### BLD-001 アイテムの収集

- パターン: ユビキタス
- EARS: ビルドは、`catalog/*/README.md` に一致するすべてのファイルをアイテムとして収集しなければならない。
- 事前条件: `catalog/` が存在する
- 事後条件: 収集したアイテム数 = README を持つ配布フォルダ数。各アイテムの id は配布フォルダ名（slug）である
- 不変条件: `catalog/README.md`（`catalog/` 直下）はアイテムとして収集しない。`catalog/` 配下のファイルを変更しない
- 検証: ビルド検証（フィクスチャ）

### BLD-002 スキーマ検証

- パターン: ユビキタス
- EARS: ビルドは、収集した全アイテムのフロントマターを `itemSchema` で検証しなければならない。
- 事前条件: BLD-001 が完了している
- 事後条件: 後続処理に渡るアイテムはすべて CNT-002〜CNT-010 を満たす
- 不変条件: なし
- 検証: ビルド検証

### BLD-003 検証失敗時のビルド中断

- パターン: 望ましくない振る舞い
- EARS: もしいずれかのアイテムが CNT-001〜CNT-010 のいずれかに違反するならば、ビルドは成果物を出力せずに非ゼロの終了コードで終了しなければならない。
- 事前条件: なし
- 事後条件: 不正なアイテムを含むサイトは生成・公開されない
- 不変条件: 前回デプロイ済みのサイトは変更されない（[06-deployment.md](./06-deployment.md) の DEP-004）
- 検証: ビルド検証（不正フィクスチャ）

### BLD-004 エラーの一括報告

- パターン: 望ましくない振る舞い
- EARS: もし検証エラーが複数存在するならば、ビルドは最初のエラーで停止せず、すべてのエラーを「ファイルパス・キー・違反内容」の形式で出力しなければならない。
- 事前条件: 検証が実行されている
- 事後条件: 作者は 1 回のビルドで全違反を把握できる
- 不変条件: なし
- 検証: ビルド検証

### BLD-005 YAML 解析失敗

- パターン: 望ましくない振る舞い
- EARS: もしアイテム README のフロントマターが YAML として解析できない、またはフロントマターが存在しないならば、ビルドは当該ファイルパスを示して失敗しなければならない。
- 事前条件: `README.md` が存在する
- 事後条件: BLD-003 と同じ
- 不変条件: なし
- 検証: ビルド検証

### BLD-006 README の欠落

- パターン: 望ましくない振る舞い
- EARS: もし `catalog/` 直下に `README.md` を持たないフォルダが存在するならば、ビルドは当該フォルダパスを示して失敗しなければならない。
- 事前条件: `catalog/` が存在する
- 事後条件: BLD-003 と同じ
- 不変条件: なし
- 検証: ビルド検証
- 備考: Content Collections の glob ローダーは README の無いフォルダを検出しないため、別途フォルダ走査で検査する

### BLD-007 カタログ索引の生成

- パターン: ユビキタス
- EARS: ビルドは、全アイテムから `buildCatalogIndex` によりカタログ索引を生成し、トップページへ埋め込まなければならない。
- 事前条件: BLD-002 が成功している
- 事後条件: 索引のエントリ数 = アイテム数。各エントリは `slug`・`title`・`summary`・`tags`・`normalizedTags`・`type`・`updated?` を持つ
- 不変条件: 索引に README 本文を含めない
- 検証: 単体テスト（`buildCatalogIndex`）

### BLD-008 詳細ページの生成

- パターン: ユビキタス
- EARS: ビルドは、アイテムごとに `/items/<slug>/` の静的 HTML を 1 つ生成しなければならない。
- 事前条件: BLD-002 が成功している
- 事後条件: 生成された詳細ページ数 = アイテム数
- 不変条件: なし
- 検証: ビルド検証

### BLD-009 本文の Markdown レンダリング

- パターン: ユビキタス
- EARS: ビルドは、アイテム README の本文を GitHub Flavored Markdown（表・タスクリスト・打ち消し線・自動リンク）として HTML に変換しなければならない。
- 事前条件: 本文が UTF-8 で読み込める
- 事後条件: 出力 HTML にフロントマターの YAML が含まれない
- 不変条件: なし
- 検証: 単体テスト、E2E テスト

### BLD-010 サイト設定の一元化

- パターン: ユビキタス
- EARS: ビルドは、リポジトリ所有者・リポジトリ名・参照ブランチ・サイト URL・base パスを `site/site.config.ts` からのみ取得しなければならない。
- 事前条件: なし
- 事後条件: リポジトリ名やブランチの変更は `site.config.ts` の 1 か所の修正で全ページに反映される
- 不変条件: ページ・コンポーネント内にリポジトリ名・ブランチ名を直書きしない
- 検証: コードレビュー
- 既定値: owner=`Aco-Lone`、repo=`CopilotPrompts`、ref=`main`、site=`https://aco-lone.github.io`、base=`/CopilotPrompts`

### BLD-011 本文内の相対リンクの解決

- パターン: イベント駆動
- EARS: 本文に配布フォルダ内を指す相対リンクまたは相対画像パスが含まれるとき、ビルドはそれを GitHub 上の URL に書き換えなければならない。
  - リンク: `https://github.com/<owner>/<repo>/blob/<ref>/catalog/<slug>/<path>`
  - 画像: `https://raw.githubusercontent.com/<owner>/<repo>/<ref>/catalog/<slug>/<path>`
- 事前条件: リンク先が `http(s):`・`mailto:`・`#` で始まらない
- 事後条件: 詳細ページ上の相対リンクがリンク切れにならない
- 不変条件: 絶対 URL とページ内アンカーは変更しない
- 検証: 単体テスト

### BLD-012 空のカタログ

- パターン: 状態駆動
- EARS: `catalog/` にアイテムが 1 つも存在しない間、ビルドは成功し、トップページに「アイテムがありません」と表示しなければならない。
- 事前条件: `catalog/` が存在する
- 事後条件: 索引のエントリ数 = 0
- 不変条件: なし
- 検証: ビルド検証

### BLD-013 決定的な出力

- パターン: ユビキタス
- EARS: ビルドは、同一の入力（`catalog/` と `site/`）に対して同一の索引とページ内容を出力しなければならない。
- 事前条件: 依存パッケージのバージョンがロックファイルで固定されている
- 事後条件: 索引のエントリ順は `title` の昇順（`ja` ロケール比較）、同値の場合は `slug` の昇順である
- 不変条件: ビルド日時など非決定的な値を索引に含めない
- 検証: 単体テスト

### BLD-014 ローカルでの検証コマンド

- パターン: ユビキタス
- EARS: サイトは、ページを生成せずにカタログ検証（BLD-002〜BLD-006）のみを行う `npm run validate` を提供しなければならない。
- 事前条件: 依存パッケージがインストール済みである
- 事後条件: 違反がなければ終了コード 0、あれば非ゼロを返し BLD-004 の形式で出力する
- 不変条件: ファイルを書き込まない
- 検証: ビルド検証

## 3. モジュール契約

### `buildCatalogIndex`

| 項目 | 内容 |
|---|---|
| シグネチャ | `buildCatalogIndex(items: CatalogItem[]): CatalogIndexEntry[]` |
| 事前条件 | 各 `items[i]` は `itemSchema` 検証済みである。slug は重複しない |
| 事後条件 | 戻り値の長さ = `items.length`。順序は BLD-013。各エントリの `normalizedTags[j] = normalizeTag(tags[j])` |
| 不変条件 | 入力配列と要素を変更しない |
| 違反時 | slug 重複を検出した場合はエラーを送出する |

### `resolveRelativeUrl`

| 項目 | 内容 |
|---|---|
| シグネチャ | `resolveRelativeUrl(url: string, slug: string, kind: "link" \| "image", config: SiteConfig): string` |
| 事前条件 | `slug` は CNT-002 を満たす |
| 事後条件 | BLD-011 の条件に該当する場合は書き換えた絶対 URL、該当しない場合は `url` をそのまま返す。`../` で配布フォルダ外を指す場合も `catalog/<slug>/` を基準に解決した URL を返す |
| 不変条件 | 副作用なし |
| 違反時 | `slug` が不正な場合はエラーを送出する |
