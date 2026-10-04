# Copilot カタログサイト 仕様書

カスタムエージェント / Skills / プロンプトを配布単位で共有する GitHub Pages サイトの仕様書。
要件は **EARS 記法** と **Design by Contract（DbC）** を組み合わせて記述する。記法の詳細は [00-overview.md](./00-overview.md) を参照。

## ファイル一覧

| ファイル | ジャンル | 要件 ID 接頭辞 |
|---|---|---|
| [00-overview.md](./00-overview.md) | 目的・スコープ・用語・記法規約 | `OVR` |
| [01-content-model.md](./01-content-model.md) | 配布フォルダ構造・README フロントマター | `CNT` |
| [02-build.md](./02-build.md) | Astro によるコンテンツ収集・検証・生成 | `BLD` |
| [03-top-page.md](./03-top-page.md) | トップページ（一覧・検索・絞り込み） | `TOP` |
| [04-detail-page.md](./04-detail-page.md) | 詳細ページ（README 表示・ダウンロードコマンド） | `DTL` |
| [05-download-command.md](./05-download-command.md) | giget ダウンロードコマンド生成規則 | `CMD` |
| [06-deployment.md](./06-deployment.md) | GitHub Actions / GitHub Pages デプロイ | `DEP` |
| [07-migration.md](./07-migration.md) | 既存ファイルの `catalog/` への移行 | `MIG` |
| [08-non-functional.md](./08-non-functional.md) | 非機能要件（性能・a11y・セキュリティ・保守性） | `NFR` |

## 読む順序

1. [00-overview.md](./00-overview.md) で用語と記法を把握する
2. [01-content-model.md](./01-content-model.md) でデータ（配布フォルダ・フロントマター）を把握する
3. 関心のあるジャンルのファイルを読む
