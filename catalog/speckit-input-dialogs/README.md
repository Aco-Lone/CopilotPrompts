---
title: Speckit 入力整理ダイアログ
summary: constitution・spec・plan・tasks の前段の論点を対話形式で整理するエージェント群
tags: [speckit, requirements, dialog]
type: bundle
---

# Speckit 入力整理ダイアログ

Spec Kit の constitution・spec・plan・tasks に進む前に、入力や論点を対話形式で整理するエージェント群です。

## 含まれるファイル

- `spec-input-dialog.agent.md` — `/speckit.specify` の前に要件、scope、acceptance criteria などを整理します。
- `plan-input-dialog.agent.md` — `/speckit.plan` の前にアーキテクチャ、技術方針、research 観点などを整理します。
- `tasks-input-dialog.agent.md` — `/speckit.tasks` の前に user story 単位の分解、MVP、依存関係、並列化などを整理します。
- `constitution-facilitator.agent.md` — constitution の原則、workflow gate、architecture governance を対話で整理し、`speckit.constitution` への handoff を準備します。

## 使い方

次に行う Spec Kit の段階に合わせて該当するダイアログを起動し、対話で整理した内容を設定済みの handoff 先へ渡します。
