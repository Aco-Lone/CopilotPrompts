---
title: 設計書ベース C# 実装
summary: クラス図・アクティビティ図から C# の新規実装・ビルド確認・レビューを行うエージェント群
tags: [csharp, implementation, design-doc, orchestration]
type: bundle
---

# 設計書ベース C# 実装

クラス設計書・アクティビティ図を基に、新規 C# 実装・ビルド確認・レビューを進めるためのエージェント群です。`Impl Orchestrator` がサブエージェントへ処理を委譲し、各ステージを調整します。

## 含まれるファイル

- `impl-orchestrator.agent.md` — 設計書を基に新規実装を調整するオーケストレーター。
- `impl-design-analyzer.agent.md` — クラス設計書・アクティビティ図を解析し、`.copilot-impl/design-parsed.json` と trace を生成します。
- `impl-class-implementer.agent.md` — 解析結果のクラス定義に基づいて C# ソースを生成し、ビルドエラー修正モードにも対応します。
- `impl-build-verifier.agent.md` — `dotnet build` を実行し、結果やエラーを記録してオーケストレーターへ返します。
- `impl-integration-checker.agent.md` — クラス間の依存関係とインターフェース整合性を確認します。
- `impl-reviewer.agent.md` — 実装と設計書・アクティビティ図の準拠をレビューします。
- `agents-config.md` — プロジェクト設定、パス、フロー、ビルドの設定項目です。

## 使い方

必要に応じて `agents-config.md` をプロジェクトに合わせて編集し、`Impl Orchestrator` を起動して設計書のファイルパスを指定します。
