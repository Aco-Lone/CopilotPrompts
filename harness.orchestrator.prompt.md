---
description: "spec と plan が完了した feature を初回実装から進めるとき、または task slice と quality loop を継続するときに使う。"
agent: harness.orchestrator
argument-hint: "spec/plan 完了済みの feature context、tasks context、task slice、validation failure、または review context"
---

次の対象について、spec と plan 完了後の Speckit ベース harness engineering workflow を開始または続行してください。

```text
$ARGUMENTS
```

task generation、implementation、focused validation と repair、review、shared context sync のうち、必要な subagent を自動 handoff しながら最小の次の一手を進めてください。shared context sync では、必要に応じて reusable な workflow、design、review knowledge を shared Copilot instructions に反映してください。