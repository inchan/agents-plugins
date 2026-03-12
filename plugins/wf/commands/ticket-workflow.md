---
description: "Process a bug ticket through evidence collection, classification, exploration, planning, implementation, and verification phases"
argument-hint: "[--type ui|non-ui] <ticket description or URL>"
allowed-tools: Bash, Read, Edit, Write, Glob, Grep, Agent, WebFetch, WebSearch
---

# /ticket-workflow -- Bug Ticket Workflow Entry Point

> Non-UI 및 UI 티켓을 증거 수집 → 분류 → 탐색 → 계획 → 구현 → 검증의 6단계로 완전 자동 처리한다.
> 사용자는 `/ticket-workflow "버그 설명"` 한 번으로 개입 없이 전체 워크플로우를 완료할 수 있다.

## INIT — Workflow Initialization

Parse $ARGUMENTS to extract the ticket description and optional --type flag:

```
1. If $ARGUMENTS starts with "--type ui"   → force ticket_type = "ui"
2. If $ARGUMENTS starts with "--type non-ui" → force ticket_type = "non-ui"
3. Otherwise → ticket_type = null (auto-detect in Phase 2)
4. Remaining text after flags = ticket description
```

Print start banner:

```
[INFO ] [WORKFLOW] +0:00 -- Initializing 6 workflow phases...

╔══════════════════════════════════════════╗
║  TICKET WORKFLOW STARTED                 ║
║  Input: <first 60 chars of input>...     ║
╚══════════════════════════════════════════╝
```

Initialize workflow state:

```
workflow_state = {
  phase: "INIT",
  ticket_type: <parsed or null>,
  retry_count: 0,
  max_retries: 3,
  verification_strategy: "full",
  phase_outputs: {},
  phase_scores: {},
  errors: [],
  warnings: []
}
```

---

## Reference Map

All phase behavior is defined in the following reference documents:

| Reference | Path | Purpose |
|-----------|------|---------|
| Phase Orchestrator | `skills/ticket-workflow/references/phase-orchestrator.md` | State machine + control flow + retry logic |
| Classification | `skills/ticket-workflow/references/classification.md` | UI vs Non-UI classification rules |
| Browser Automation | `skills/ticket-workflow/references/browser-automation.md` | UI verification tools |
| Scoring | `skills/ticket-workflow/references/scoring.md` | Progress scorecard rendering |
| Workflow Logger | `skills/ticket-workflow/references/workflow-logger.md` | Log format standards |
| Phase: Evidence | `skills/ticket-workflow/references/phases/evidence-collection.md` | Phase 1 procedure |
| Phase: Classification | `skills/ticket-workflow/references/classification.md` | Phase 2 classification rules |
| Phase: Exploration | `skills/ticket-workflow/references/phases/exploration.md` | Phase 3 procedure |
| Phase: Planning | `skills/ticket-workflow/references/phases/planning.md` | Phase 4 procedure |
| Phase: Implementation | `skills/ticket-workflow/references/phases/implementation.md` | Phase 5 procedure |
| Phase: Verification | `skills/ticket-workflow/references/phases/verification.md` | Phase 6 procedure |

**Load the orchestrator first:** Read `skills/ticket-workflow/references/phase-orchestrator.md` before executing any phase.

---

## Phase Pipeline — 6-Stage Sequential Execution

Execute all 6 phases in strict order. No phase may begin until the previous phase completes and produces its output.

### Phase 1: EVIDENCE — Evidence Collection

**Agents:** Dispatch 2x `evidence-searcher` agents in parallel:

```
Agent A (evidence-searcher):
  Task: "Search for error patterns: '<errors from ticket>' in the codebase"
  Tools: Glob, Grep, Read, Bash
  Timeout: 19 minutes 59 seconds

Agent B (evidence-searcher):
  Task: "Find files related to '<components from ticket>' and check git history"
  Tools: Glob, Grep, Read, Bash
  Timeout: 19 minutes 59 seconds
```

After agents return: synthesize findings into `evidence_report`.

After evidence-searcher agents return:
  If ticket_type == "ui" OR classification hint suggests UI:
    Dispatch browser-reproducer agent:

```
Agent C (browser-reproducer):
  Task: "Reproduce UI bug at <url> with viewport <viewport>: <reproduction_steps>"
  Tools: Bash, Read, Glob, Grep, WebFetch + available MCP tools
  Timeout: 19 minutes 59 seconds
```

Merge browser-reproducer output into evidence_report:
```
evidence_report.screenshot_references = agent_c.screenshots
evidence_report.browser_method = agent_c.method
evidence_report.reproduction_status = agent_c.reproduction_status
```

**Log:**
```
[INFO ] [EVIDENCE  ] +<time> -- Phase started: Evidence Collection
[INFO ] [EVIDENCE  ] +<time> -- Dispatching 2x evidence-searcher agents in parallel...
[INFO ] [EVIDENCE  ] +<time> -- Phase completed: Evidence Collection (score: <N>%)
```

See full procedure: `skills/ticket-workflow/references/phases/evidence-collection.md`

---

### Phase 2: CLASSIFY — Ticket Classification

Classify the ticket as `ui` or `non-ui` using the classification rules.

**Reference:** `skills/ticket-workflow/references/classification.md`

**Log:**
```
[INFO ] [CLASSIFY  ] +<time> -- Phase started: Classification
[INFO ] [CLASSIFY  ] +<time> -- Ticket classified as: <ui|non-ui> (confidence: <N>%)
[INFO ] [CLASSIFY  ] +<time> -- Phase completed: Classification (score: <N>%)
```

See full procedure: `skills/ticket-workflow/references/classification.md`

---

### Phase 3: EXPLORE — Root Cause Exploration

**Agents:** Dispatch 2-3x `bug-tracer` agents in parallel:

```
Agent A (bug-tracer):
  Task: "Trace the execution path for '<bug scenario>' from entry to failure"
  Tools: Glob, Grep, Read, Bash
  Timeout: 19 minutes 59 seconds

Agent B (bug-tracer):
  Task: "Find similar patterns and existing tests for '<affected area>'"
  Tools: Glob, Grep, Read, Bash
  Timeout: 19 minutes 59 seconds

Agent C (bug-tracer) — UI tickets only:
  Task: "Analyze component tree and CSS cascade for '<UI component>'"
  Tools: Glob, Grep, Read, Bash
  Timeout: 19 minutes 59 seconds
```

After agents return: synthesize findings into `root_cause` report.

**Log:**
```
[INFO ] [EXPLORE   ] +<time> -- Phase started: Exploration
[INFO ] [EXPLORE   ] +<time> -- Dispatching <N>x bug-tracer agents in parallel...
[INFO ] [EXPLORE   ] +<time> -- Phase completed: Exploration (score: <N>%)
```

See full procedure: `skills/ticket-workflow/references/phases/exploration.md`

---

### Phase 4: PLAN — Implementation Planning

Design the fix based on root cause analysis.

**Reference:** `skills/ticket-workflow/references/phases/planning.md`

**Log:**
```
[INFO ] [PLAN      ] +<time> -- Phase started: Planning
[INFO ] [PLAN      ] +<time> -- Approach selected: <minimal|robust>
[INFO ] [PLAN      ] +<time> -- Phase completed: Planning (score: <N>%)
```

> **IMMUTABILITY BOUNDARY:** After Phase 4 completes, Phases 1-4 outputs remain immutable during retries. Only Phases 5-6 re-execute.

---

### Phase 5: IMPLEMENT — Code Implementation

Apply the fix according to the implementation plan.

**Reference:** `skills/ticket-workflow/references/phases/implementation.md`

**Log:**
```
[INFO ] [IMPLEMENT ] +<time> -- Phase started: Implementation
[INFO ] [IMPLEMENT ] +<time> -- Applying changes to <N> files...
[INFO ] [IMPLEMENT ] +<time> -- Phase completed: Implementation (score: <N>%)
```

See full procedure: `skills/ticket-workflow/references/phases/implementation.md`

---

### Phase 6: VERIFY — Verification & Validation

Run tests and validate the fix.

**Reference:** `skills/ticket-workflow/references/phases/verification.md`

**Log:**
```
[INFO ] [VERIFY    ] +<time> -- Phase started: Verification
[INFO ] [VERIFY    ] +<time> -- Running test suite...
[INFO ] [VERIFY    ] +<time> -- Phase completed: Verification (score: <N>%, attempt <N>/3)
```

For UI tickets: Also run browser-based Before/After comparison. See `verification.md` Step 2 UI section.

See full procedure: `skills/ticket-workflow/references/phases/verification.md`

---

## Retry Control Flow — 3-Stage Strategy

When Phase 6 verification fails, apply the retry strategy progression:

```
Attempt 1 (full): 원래 계획 그대로 전체 구현 + 검증
  verification_strategy = "full"
  → Execute Phase 5 and Phase 6 with original plan

  FAIL → [WARN ] [VERIFY] +<time> -- Attempt 1/3 failed: {reason}. Retry strategy: targeted
         [INFO ] [VERIFY] +<time> -- Retry 1/3 -- 전략: targeted

Attempt 2 (targeted): 실패 원인 분석 후 해당 부분만 수정. 정상 부분 유지
  verification_strategy = "targeted"
  → Identify specific failure point from failure_reason
  → Modify only the failing file/function
  → Preserve all working changes from Attempt 1

  FAIL → [WARN ] [VERIFY] +<time> -- Attempt 2/3 failed: {reason}. Retry strategy: relaxed
         [INFO ] [VERIFY] +<time> -- Retry 2/3 -- 전략: relaxed

Attempt 3 (relaxed): 접근 방식 변경. 다른 파일/함수 수정 또는 우회 전략
  verification_strategy = "relaxed"
  → Change the implementation approach entirely
  → Modify different files, use alternative algorithm, or apply workaround strategy
  → Phase 1-4 outputs still remain immutable

  FAIL → [ERROR] [VERIFY] +<time> -- All attempts exhausted -> FAILED
```

**Invariant:** Phases 1-4 outputs remain immutable during retries. Only Phases 5-6 re-execute.

### Retry Context Passed to Phase 5

On each retry, pass the following context to the implementer:

```
retry_context = {
  attempt: <1|2|3>,
  strategy: <"full"|"targeted"|"relaxed">,
  failure_reason: <string from previous verify output>,
  failed_test: <specific test that failed>,
  previous_changes: <Phase 5 output from previous attempt>
}
```

---

## Orchestrator Reference

For the complete state machine, control flow rules, and inter-phase data contracts, read:

**`skills/ticket-workflow/references/phase-orchestrator.md`**

This reference defines:
- State diagram: INIT → EVIDENCE → CLASSIFY → EXPLORE → PLAN → IMPLEMENT → VERIFY → DONE/FAILED
- Phase input/output contracts
- Control flow rules (sequential execution, no skipping, retry scope)
- Agent dispatch protocol
- Workflow invariants

---

## Agent Registry

Agents available for this workflow:

| Agent | File | Used In | Tools |
|-------|------|---------|-------|
| `evidence-searcher` | `agents/evidence-searcher.md` | Phase 1 (x2 parallel) | Glob, Grep, Read, Bash |
| `bug-tracer` | `agents/bug-tracer.md` | Phase 3 (x2-3 parallel) | Glob, Grep, Read, Bash |
| `planner` | `agents/planner.md` | Phase 4 | Read, Glob, Grep |
| `implementer` | `agents/implementer.md` | Phase 5 | Bash, Read, Edit, Write, Glob, Grep |
| `verifier` | `agents/verifier.md` | Phase 6 | Bash, Read, Glob, Grep |
| `browser-reproducer` | `agents/browser-reproducer.md` | Phase 1 (UI tickets), Phase 6 (UI verify) | Bash, Read, Glob, Grep, WebFetch |
