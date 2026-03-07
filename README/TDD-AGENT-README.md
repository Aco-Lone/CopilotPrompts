# TDD オーケストレーションエージェント

詳細設計書（Markdown / AsciiDoc + PlantUML）からテストファーストで実装を自動化するカスタムエージェント群です。

## アーキテクチャ

```
User（設計書パス指定）
  └─► TDD Orchestrator             ← ユーザー起動エントリポイント
        ├─► Design Analyst          → .copilot-tdd/context.md
        │                           → .copilot-tdd/units.md
        ├─► [ユニットごとにループ]
        │     ├─► C# Test Writer    → テストコード (Red)
        │     │                     → .copilot-tdd/test-cases/[N]-{Class}.md
        │     ├─► C# Implementer    → 実装コード (Green)
        │     └─► Code Refactorer   → リファクタリング
        ├─► Code Reviewer           → .copilot-tdd/review-report.md
        └─► CI Verifier             → .copilot-tdd/ci-result.md
```

### コンテキスト管理方式

エージェント間のハンドオフはすべてファイル経由で行います。
オーケストレーターのコンテキストにはファイルパスのみが残り、設計書の内容は展開されません。

| 方式 | 内容 |
|------|------|
| **静的コンテキスト分離** | `context.md` に横断的制約を抽出。全サブエージェントが毎回読む軽量ファイル |
| **ソース参照トレース** | `units.md` には情報のコピーを持たず、設計書の該当セクションへのパス（ポインタ）のみ記載。各エージェントが原文を直接読む |
| **todo ベースループ** | ユニット進捗は `todo` ツールで管理。設計書のサイズに関わらずオーケストレーターのコンテキストが一定 |

---

## エージェント一覧

### TDD Orchestrator（`tdd-orchestrator.agent.md`）

**ユーザーが直接起動するエントリポイント。**

設計書パスを受け取り、全ステージを調整します。自分では実装・テストを書かず、サブエージェントへの委譲とフロー制御のみを行います。

- **起動方法**: エージェントピッカーから "TDD Orchestrator" を選択
- **引数**: 詳細設計書のファイルパス（例: `docs/design/order-service.md`）
- **ツール**: `agent`, `read`, `search`, `todo`

---

### Design Analyst（`design-analyst.agent.md`）

**設計書を解析して TDD に必要な 2 ファイルを生成する。**

設計書の内容をコピーせず、ポインタ形式の `units.md` と横断的制約をまとめた `context.md` のみを出力します。

- **入力**: 設計書ファイルパス
- **出力**:
  - `.copilot-tdd/context.md` — 命名規則・DI方針・共有型・エラー処理方針
  - `.copilot-tdd/units.md` — 各実装単位のソース参照ポインタ
- **ツール**: `read`, `search`, `edit`

**`units.md` エントリ形式:**

```markdown
## [1] OrderService::PlaceOrder
- source:     docs/design/order-service.md#place-order
- plantUML:   docs/design/diagrams/order-sequence.puml#PlaceOrder
- test_output:  src/MyProject.Tests/OrderServiceTests.cs
- impl_output:  src/MyProject/OrderService.cs
```

---

### C# Test Writer（`csharp-test-writer.agent.md`）

**TDD Red フェーズ: C# の失敗テストを生成する。**

`units.md` のエントリ（ポインタ）を受け取り、設計書原文を直接読んでテストを生成します。
`dotnet test` で失敗することを確認してから返却します。

- **カバレッジ基準**: C0（命令網羅）+ C1（分岐網羅）
- **テストFW自動検出**: `.csproj` の NuGet 参照から xUnit / NUnit / MSTest を判別
- **テストケースドキュメント**: `.copilot-tdd/test-cases/[N]-{ClassName}.md` に分岐一覧を生成
- **ツール**: `read`, `edit`, `search`, `execute`

**テストケースドキュメント形式:**

```markdown
# テストケース: OrderService::PlaceOrder

## テストケース一覧
| # | テストメソッド名 | シナリオ | 入力 | 期待結果 | 種別 |
|---|----------------|---------|------|---------|------|
| 1 | PlaceOrder_正常系_注文IDが返る | ... | ... | OrderId | 正常系 |

## カバレッジ確認
| 基準 | 充足 |
|------|------|
| C0（命令網羅） | ✓ |
| C1（分岐網羅） | ✓ |

### C1 分岐一覧
| # | 分岐箇所 | 真ケース（テスト#） | 偽ケース（テスト#） |
```

---

### C# Implementer（`csharp-implementer.agent.md`）

**TDD Green フェーズ: 失敗テストをパスする最小実装を生成する。**

`units.md` のポインタと `context.md` の制約に従い、**テストが要求する以上の実装は行いません**。
`dotnet test` でグリーンになることを確認してから返却します。

- **ツール**: `read`, `edit`, `search`, `execute`

---

### Code Refactorer（`code-refactorer.agent.md`）

**TDD Refactor フェーズ: テストを壊さずコードを改善する。**

DRY 原則・SOLID 原則・`context.md` のアーキテクチャ方針に従いリファクタリングします。
1変更ごとに `dotnet test` を実行してグリーンを確認します。改善不要な場合は変更しません。

- **言語依存度**: 低（コマンドを `dotnet test` から差し替えれば他言語でも流用可）
- **ツール**: `read`, `edit`, `execute`

---

### Code Reviewer（`code-reviewer.agent.md`）

**設計書と実装の整合性を確認する。**

`units.md` の全エントリの `source:` を巡回し、設計書原文と実装を**直接**突き合わせてレビューします。
実装ファイルは編集しません（`read` のみ）。

- **チェック項目**: クラス名・メソッドシグネチャ・依存IF・エラー処理・命名規則・責務範囲
- **出力**: `.copilot-tdd/review-report.md`（重大・軽微の問題点を番号付きで列挙）
- **ツール**: `read`, `search`, `edit`（結果ファイルのみ）

---

### CI Verifier（`ci-verifier.agent.md`）

**全体ビルド・テスト実行を確認する。**

`dotnet build` と `dotnet test` を実行し、結果をファイルに記録します。
失敗した場合は対応する `units.md` のユニット番号を特定してオーケストレーターにフィードバックします。

- **出力**: `.copilot-tdd/ci-result.md`
- **ツール**: `execute`, `read`, `edit`

---

## 作業ディレクトリ `.copilot-tdd/`

実行後にワークスペースの `.copilot-tdd/` に以下のファイルが生成されます。

```
.copilot-tdd/
├── context.md            # 横断的制約（全エージェントが参照）
├── units.md              # 実装単位のソース参照ポインタ
├── review-report.md      # Code Reviewer の出力
├── ci-result.md          # CI Verifier の出力
└── test-cases/
    ├── 1-OrderService.md # C# Test Writer のテストケース一覧
    └── 2-...
```

---

## 言語スワップ

C# 以外の言語に対応するには `{lang}-test-writer.agent.md` と `{lang}-implementer.agent.md` を追加するだけです。
**オーケストレーターの変更は不要です。**

オーケストレーターはワークスペースのプロジェクトファイルから言語を自動検出し、
`description` のキーワードマッチでサブエージェントを委譲します。

| プロジェクトファイル | 検出言語 |
|---------------------|---------|
| `*.csproj` | C# |
| `package.json` | Node.js / TypeScript |
| `pyproject.toml`, `setup.py` | Python |

---

## 拡張候補

- **ワークスペース固有の規約**: `.github/instructions/tdd-style.instructions.md` でプロジェクト固有の命名規則・アーキテクチャ方針を追加
- **自動フォーマット**: `.github/hooks/` の `PostToolUse` フックで `dotnet format` を自動実行
- **他言語サポート**: `python-test-writer.agent.md` + `python-implementer.agent.md` を追加
