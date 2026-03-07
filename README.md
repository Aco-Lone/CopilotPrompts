# VS Code GitHub Copilot Prompts

GitHub Copilot のプロンプトライブラリ

---

## エージェント一覧

### TDD オーケストレーション

詳細設計書からテストファーストで実装を自動化するエージェント群。

| エージェント | 役割 |
|---|---|
| **TDD Orchestrator** | メインエントリポイント。Red-Green-Refactor サイクルを調整 |
| **Design Analyst** | 設計書を解析し `context.md` / `units.md` を生成 |
| **C# Test Writer** | TDD Red フェーズ。失敗テストを生成 |
| **C# Implementer** | TDD Green フェーズ。最小実装を生成 |
| **Code Refactorer** | TDD Refactor フェーズ。テスト維持しながらコードを整理 |
| **Code Reviewer** | 実装が設計書仕様に準拠しているか確認 |
| **CI Verifier** | `dotnet build` / `dotnet test` を実行し結果をフィードバック |

**使い方:**
```
@TDD Orchestrator docs/design/order-service.md
```

詳細: [README/TDD-AGENT-README.md](README/TDD-AGENT-README.md)

---

### リバースエンジニアリング設計書生成

ソースコードから AsciiDoc 設計書（PlantUML 図付き）を自動生成するエージェント群。

| エージェント | 役割 |
|---|---|
| **Design Reverser** | メインエントリポイント。全フェーズを調整 |
| **Reverse Architecture Analyst** | アーキテクチャ・レイヤー構造を解析 |
| **Reverse Static Analyst** | クラス・インターフェース・データ設計を解析 |
| **Reverse Dynamic Analyst** | シーケンス図・状態遷移図を生成 |
| **Reverse Exception Analyst** | 例外クラス・エラーハンドリングを解析 |
| **Reverse Doc Assembler** | 各セクションを統合して最終設計書を組み立て |

**使い方:**
```
@Design Reverser src/
```

詳細: [README/REVERSE-AGENT-README.md](README/REVERSE-AGENT-README.md)

---