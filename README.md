# VS Code GitHub Copilot Prompts

GitHub Copilot 向けのエージェント・プロンプトを配布するカタログです。

公開 URL（初回の GitHub Pages デプロイ後に利用可能）: [https://aco-lone.github.io/CopilotPrompts/](https://aco-lone.github.io/CopilotPrompts/)

> デプロイ前提: リポジトリの Settings → Pages → Build and deployment → Source を **GitHub Actions** に設定してください（未設定だと `deploy-pages` が 404 で失敗します）。

## カタログ構成

`catalog/<slug>/` の各フォルダが 1 つのカタログアイテムです。フォルダにはアイテム情報を記載する `README.md` と、配布するエージェント・プロンプトなどのファイルを置きます。アイテムの説明とメタデータは、それぞれのフォルダ内の `README.md` を参照してください。

## アイテムの追加

1. `catalog/` に小文字英数字とハイフンで slug を付けたフォルダを作成します。
2. フォルダ直下に `README.md` を作成し、必須の `title`・`summary`・`tags`・`type` とアイテムの説明を記載します。
3. `type` に対応する配布ファイルを同じフォルダに追加します。
4. `site/` で `npm run validate` を実行し、カタログを検証します。

フロントマターの形式・制約と配布フォルダの詳細は、[コンテンツモデル](specs/01-content-model.md)を参照してください。
