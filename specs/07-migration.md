# 07. 既存ファイルの移行

## 1. 背景

移行前は、エージェント・プロンプトがリポジトリ直下にフラットに配置され、説明は直下の `README.md` と `README/` フォルダに分散している。
本章では、これらを [01-content-model.md](./01-content-model.md) の配布フォルダ構造へ移す規則を定める。

## 2. 移行対応表

| slug | type | 移行するファイル（リポジトリ直下から） | 本文の出典 |
|---|---|---|---|
| `tdd-orchestration` | bundle | `tdd-orchestrator.agent.md`, `design-analyst.agent.md`, `csharp-test-writer.agent.md`, `csharp-implementer.agent.md`, `code-refactorer.agent.md`, `code-reviewer.agent.md`, `ci-verifier.agent.md` | `README/TDD-AGENT-README.md` |
| `reverse-engineering-docs` | bundle | `design-reverser.agent.md`, `reverse-architecture-analyst.agent.md`, `reverse-static-analyst.agent.md`, `reverse-dynamic-analyst.agent.md`, `reverse-exception-analyst.agent.md`, `reverse-doc-assembler.agent.md` | `README/REVERSE-AGENT-README.md` |
| `csharp-impl-orchestration` | bundle | `impl-orchestrator.agent.md`, `impl-design-analyzer.agent.md`, `impl-class-implementer.agent.md`, `impl-build-verifier.agent.md`, `impl-integration-checker.agent.md`, `impl-reviewer.agent.md`, `agents-config.md` | 新規作成（各エージェントの `description` と直下 `README.md` の該当節から構成） |
| `speckit-harness` | bundle | `harness.orchestrator.agent.md`, `harness.orchestrator.prompt.md`, `harness.review.agent.md`, `harness.repair.agent.md`, `harness.context-sync.agent.md` | 新規作成（同上） |
| `speckit-input-dialogs` | bundle | `spec-input-dialog.agent.md`, `plan-input-dialog.agent.md`, `tasks-input-dialog.agent.md`, `constitution-facilitator.agent.md` | 新規作成（同上） |

### フロントマター案

| slug | title | summary | tags |
|---|---|---|---|
| `tdd-orchestration` | TDD オーケストレーション | 詳細設計書からテストファーストで C# 実装を自動化するエージェント群 | `tdd`, `csharp`, `orchestration`, `testing` |
| `reverse-engineering-docs` | リバースエンジニアリング設計書生成 | ソースコードから PlantUML 図付き AsciiDoc 設計書を生成するエージェント群 | `reverse-engineering`, `design-doc`, `asciidoc`, `plantuml`, `orchestration` |
| `csharp-impl-orchestration` | 設計書ベース C# 実装 | クラス図・アクティビティ図から C# の新規実装・ビルド確認・レビューを行うエージェント群 | `csharp`, `implementation`, `design-doc`, `orchestration` |
| `speckit-harness` | Speckit ハーネス | spec/plan 完了後の実装・検証・レビュー・修復ループを調停するエージェントとプロンプト | `speckit`, `harness`, `orchestration`, `review` |
| `speckit-input-dialogs` | Speckit 入力整理ダイアログ | constitution・spec・plan・tasks の前段の論点を対話形式で整理するエージェント群 | `speckit`, `requirements`, `dialog` |

## 3. 要件

### MIG-001 対応表に従った移動

- パターン: ユビキタス
- EARS: 移行作業は、「2. 移行対応表」の各ファイルを `catalog/<slug>/` 直下へ `git mv` で移動しなければならない。
- 事前条件: 移行対象ファイルがリポジトリ直下に存在する
- 事後条件: 各ファイルは対応表のいずれか 1 つの配布フォルダにのみ存在する。Git 上で移動として履歴を追跡できる
- 不変条件: 移動したファイルの内容はバイト単位で変更しない
- 検証: `git diff --stat -M` で 100% の rename として検出されること

### MIG-002 移行の網羅性

- パターン: ユビキタス
- EARS: 移行完了後、リポジトリ直下に `*.agent.md`・`*.prompt.md`・`agents-config.md` が存在してはならない。
- 事前条件: MIG-001 が完了している
- 事後条件: 移行前の直下の配布対象ファイル数 = 移行後の `catalog/` 配下の同ファイル数
- 不変条件: なし
- 検証: ファイル数の比較

### MIG-003 対応表に無いファイル

- パターン: 望ましくない振る舞い
- EARS: もし移行時点でリポジトリ直下に対応表に記載の無い `*.agent.md` または `*.prompt.md` が存在するならば、移行作業は当該ファイルを移動せずに中断し、所属先を保守者に確認しなければならない。
- 事前条件: なし
- 事後条件: 確認結果を対応表に追記してから移行を再開する
- 不変条件: 未確認のファイルを推測で配布フォルダへ割り当てない
- 検証: レビュー

### MIG-004 アイテム README の作成

- パターン: ユビキタス
- EARS: 移行作業は、各配布フォルダに「フロントマター案」の値を持つ `README.md` を作成しなければならない。
- 事前条件: 配布フォルダが作成されている
- 事後条件: 各 README は CNT-004〜CNT-010 を満たし、`npm run validate`（BLD-014）が成功する
- 不変条件: なし
- 検証: `npm run validate`

### MIG-005 既存説明の本文への移設

- パターン: オプション
- EARS: 対応表の「本文の出典」に既存ファイルが指定されている場合、移行作業はその内容をアイテム README の本文として移し、元ファイルを削除しなければならない。
- 事前条件: 出典ファイルが存在する
- 事後条件: 出典ファイルの内容（見出し・表・コード例）が本文に欠落なく含まれる。`README/` フォルダは空になり削除される
- 不変条件: 本文中のリンクは BLD-011 で解決できる相対パス、または絶対 URL である
- 検証: レビュー、E2E テスト（詳細ページでのリンク切れ確認）

### MIG-006 ルート README の更新

- パターン: ユビキタス
- EARS: 移行作業は、リポジトリ直下の `README.md` を、カタログサイトの URL・`catalog/` の構成・アイテムの追加手順（フロントマター規約へのリンクを含む）を記載した内容に更新しなければならない。
- 事前条件: MIG-001〜MIG-005 が完了している
- 事後条件: ルート README にアイテム個別の説明表を残さない（OVR-002 の単一の情報源）
- 不変条件: なし
- 検証: レビュー

### MIG-007 移行後のビルド成功

- パターン: ユビキタス
- EARS: 移行作業の完了時点で、`site/` のビルド（DEP-003 の全手順）は成功しなければならない。
- 事前条件: サイトの実装が完了している
- 事後条件: 公開サイトのトップページに 5 件のアイテムが表示される
- 不変条件: なし
- 検証: ビルド検証、E2E テスト
