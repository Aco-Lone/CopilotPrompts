---
title: Speckit ハーネス
summary: spec/plan 完了後の実装・検証・レビュー・修復ループを調停するエージェントとプロンプト
tags: [speckit, harness, orchestration, review]
type: bundle
---

# Speckit ハーネス

spec と plan の完了後に、実装・検証・レビュー・修復などの harness engineering workflow を調停するエージェントとプロンプトです。オーケストレーター自身はコードを編集せず、サブエージェントに処理を委譲します。

## 含まれるファイル

- `harness.orchestrator.agent.md` — task、実装、validation、review、repair、shared context sync のフローを調停します。
- `harness.orchestrator.prompt.md` — workflow を開始・継続するプロンプトです。task の変更が必要な場合は停止して承認を求め、変更不要の場合は承認済み task slice の処理を進めます。
- `harness.review.agent.md` — validation 通過後に最新の実装結果を findings-first 形式でレビューします。
- `harness.repair.agent.md` — 対象を絞った validation と原因修正を行い、同じ validation を再実行します。
- `harness.context-sync.agent.md` — validation と review が clean になった後、再利用可能な知識を shared Copilot instructions に同期します。

## 使い方

spec と plan が完了した feature の context、tasks context、task slice、validation failure、または review context を `harness.orchestrator.prompt.md` に渡して workflow を開始・継続します。
