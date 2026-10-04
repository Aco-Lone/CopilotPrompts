---
description: "spec と plan が完了した feature を初回実装から進めるとき、または task slice と quality loop を継続するときに使う。"
agent: harness.orchestrator
argument-hint: "spec/plan 完了済みの feature context、tasks context、task slice、validation failure、または review context"
---

次の対象について、spec と plan 完了後の Speckit ベース harness engineering workflow を開始または続行してください。

```text
$ARGUMENTS
```

task の修正（順序変更・分割・統合・acceptance 変更・spec 不整合解消）が必要と判定した場合は自動進行を停止し、変更案をまとめて handoff でユーザーの承認を求めてください。承認なしに task を再生成・再構成して継続しないでください。

task 修正が不要な場合は、承認済み task slice の選択・implementation・focused validation と repair・review・context sync（knowledge がなければ no-op 記録）を 1 セットとして、残り task がなくなるまで自動継続してください。