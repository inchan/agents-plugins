---
name: ticket-workflow
description: This skill should be used when the user mentions "bug ticket", "ticket workflow", "process ticket", "fix ticket", "bug fix workflow", "UI bug", "visual bug", "non-UI bug", "API bug", or wants to systematically process a bug report through evidence collection, classification, exploration, planning, implementation, and verification phases with visual scoring.
version: 0.3.0
---

# Ticket Workflow Skill

Automated bug ticket processing through sequential phases with UI/non-UI classification, visual scoring, and retry-based verification.

## Overview

This skill orchestrates a complete bug fix workflow by executing sequential phases with a state machine controlling transitions and retries:

1. **Evidence Collection** — Gather codebase evidence, reproduce the issue, collect external artifacts
2. **Classification** — Analyze ticket content and classify as UI vs non-UI with confidence scoring
3. **Exploration** — Deep-dive into affected code with parallel agents
4. **Planning** — Design the fix with approach trade-offs and verification strategy
5. **Implementation** — Execute the fix following the plan
6. **Verification** — Validate with tests and visual comparison (up to 3 retries with strategy adjustment)

## When This Skill Applies

- User provides a bug ticket, issue description, or ticket URL
- User wants a systematic, automated bug fix workflow
- User mentions UI bugs requiring visual verification
- User mentions API/backend/logic bugs requiring functional verification
- User wants evidence-based bug resolution with progress tracking

---

## Phase 1: Evidence Collection

Launch 2 `evidence-searcher` agents in parallel to gather bug evidence:

- **Agent A**: Search for error patterns, stack traces, and affected source files
- **Agent B**: Check git history, find related components/modules, recent changes

**Actions**:
1. Parse ticket input (auto-detect: text / markdown / JSON / URL)
2. Extract `--type` override if present (sets classification with confidence 1.0)
3. Search codebase for error patterns, affected files, related code
4. Collect external evidence (URLs, screenshots, logs)
5. Attempt reproduction if steps are provided

**Produces**: `evidence_report`, `affected_files`, `evidence_quality_score`

See [Evidence Collection](references/phases/evidence-collection.md) for detailed procedure.

---

## Phase 2: Classification -- UI vs Non-UI Analysis

7차원 신호 분석으로 티켓을 UI vs Non-UI로 분류하고 신뢰도 점수(0.0~1.0)를 산출한다.

- `--type` 오버라이드: `ui | non-ui | logic | feature | refactoring | performance` 직접 지정 시 confidence 1.0
- 7가지 신호: 키워드, 파일 경로, 에러 유형, 스택트레이스, 재현 단계, 첨부파일, 컴포넌트 언급
- 신뢰도 >= 0.8: 자동 진행 / 0.6~0.8: 불확실성 로그 / < 0.5: non-UI 기본값
- Non-UI 티켓은 추가로 `logic | feature | refactoring | performance` 하위 유형으로 분류된다
- 분류 결과: UI / 로직 / 기능 / 리팩토링 / 성능 중 하나 + 신뢰도 점수(0.0~1.0)

**Produces**: `ticket_type`, `sub_type`, `confidence`, `classification_signals`, `ui_details`

See [Classification Rules](references/classification.md) for full 7-dimension algorithm and sub_type rules.

---

## Phase 3: Exploration — Deep Code Analysis

Launch 2-3 `bug-tracer` agents in parallel:

- **Agent A**: Trace execution path from entry point to failure location
- **Agent B**: Find similar patterns in codebase and check existing test coverage
- **Agent C** (UI only): Analyze component tree, CSS cascade, and rendering flow

Read all key files identified by agents. Synthesize findings.

**Produces**: `root_cause`, `code_flow`, `related_patterns`, `affected_files_deep`

See [Exploration](references/phases/exploration.md) for detailed procedure.

---

## Phase 4: Planning — Design the Fix

- Synthesize root cause + exploration findings into concrete fix plan
- Choose approach: minimal fix vs robust fix (with trade-offs)
- Define verification strategy based on `ticket_type`
- Identify risks and side effects

**Produces**: `implementation_plan`, `verification_strategy`, `risks`, `planning_quality_score`

See [Planning](references/phases/planning.md) for detailed procedure.

---

## Phase 5: Implementation — Apply the Fix

- Read all affected files before editing
- Apply changes per plan, following codebase conventions
- Add regression test(s) covering the bug scenario
- UI tickets: handle responsive/accessibility edge cases

**Produces**: `modified_files`, `tests_added`, `change_summary`, `implementation_quality_score`

See [Implementation](references/phases/implementation.md) for detailed procedure.

---

## Phase 6: Verification — Validate the Fix

- Run test suite (new + existing tests)
- **UI tickets**: Browser verification using parallel tools for cross-checking when available:
  - Playwright MCP for automated browser testing
  - Chrome DevTools / agent-browser skill for visual inspection
  - Fallback: DOM analysis / code-level verification if browser tools unavailable
- **Non-UI tickets**: Functional test verification, assertion validation, log analysis

**Retry logic** (up to 3 attempts with strategy adjustment per attempt):

| Attempt | Strategy |
|---------|----------|
| 1 | Standard verification — run tests, check results |
| 2 | Targeted fix — focus on specific failure, add edge case tests |
| 3 | Alternative approach — rethink implementation strategy, broader test coverage |

**Produces**: `verification_status`, `attempt_count`, `test_results`, `visual_comparison`

See [Verification](references/phases/verification.md) for detailed procedure.

---

## Phase Orchestration

### State Machine

```
INIT → EVIDENCE → CLASSIFY → EXPLORE → PLAN → IMPLEMENT → VERIFY → DONE
                                                    ↑          │
                                                    └── retry ──┘ (max 3x)
```

### Control Flow Rules

1. **Strict order**: No phase skipping. Each phase requires the previous output.
2. **Immutable history**: Phases 1-4 outputs persist through retries.
3. **Retry scope**: Only Phases 5→6 loop on verification failure.
4. **Type branching**: After Phase 2, `ticket_type` + `sub_type` both influence Phases 3, 5, and 6.
5. **Progress reporting**: Scorecard renders at every phase boundary.
6. **Graceful degradation**: Non-critical failures degrade rather than abort.

See [Phase Orchestrator](references/phase-orchestrator.md) for full state machine specification.

---

## Progress Visualization & Scoring

The workflow produces a visual scorecard at each phase transition:

```
╔══════════════════════════════════════════════════════╗
║            TICKET WORKFLOW SCORECARD                  ║
╠══════════════════════════════════════════════════════╣
║  Evidence    [████████████████] 100%  ✓              ║
║  Classify    [████████████████] 100%  ✓              ║
║  Explore     [████████████████] 100%  ✓              ║
║  Plan        [██████████░░░░░░]  60%  ⧖              ║
║  Implement   [░░░░░░░░░░░░░░░░]   0%  ·              ║
║  Verify      [░░░░░░░░░░░░░░░░]   0%  ·              ║
╠══════════════════════════════════════════════════════╣
║  Overall:    [████████░░░░░░░░]  53%                 ║
║  Type: UI | Retries: 0/3                             ║
╚══════════════════════════════════════════════════════╝
```

### Quality Scoring Dimensions

| Dimension | Weight | Description |
|-----------|--------|-------------|
| `implementation_correctness` | 30% | Whether the fix properly resolves the reported issue |
| `evidence_quality` | 20% | Thoroughness of collected evidence |
| `verification_rigor` | 25% | Quality of verification through tests and visual comparison |
| `classification_accuracy` | 10% | Correctness of UI/non-UI classification |
| `workflow_structure` | 15% | Cleanliness and modularity of workflow execution |

See [Scoring & Progress](references/scoring.md) for visualization details.

---

## Error Handling & Logging

### Log Format
```
[<LEVEL>] [<PHASE>] +<M:SS> — <message>
```

### Error Codes

| Code | Meaning |
|------|---------|
| `E_TOOL` | Tool execution failure |
| `E_NOTFOUND` | File/pattern not found |
| `E_TIMEOUT` | Operation timeout |
| `E_PARSE` | Input parsing failure |
| `E_VERIFY` | Verification assertion failure |
| `E_BROWSER` | Browser automation failure |
| `E_CLASSIFY` | Classification ambiguity |
| `E_UNKNOWN` | Unrecognized error |

See [Workflow Logger](references/workflow-logger.md) for full error handling protocol.

---

## Usage

```
/ticket-workflow <ticket description or URL>
/ticket-workflow --type ui "Button alignment broken on mobile viewport"
/ticket-workflow --type non-ui "API returns 500 on empty payload"
/ticket-workflow --type logic "Race condition in payment processing"
/ticket-workflow --type feature "Add Kafka consumer for order events"
/ticket-workflow --type refactoring "Extract auth logic into service layer"
/ticket-workflow --type performance "Optimize slow database queries"
```

## Output

Results are output to both:
- **Console**: Real-time progress scorecard and final report
- **File**: `workflow-result.json` with full structured output

---

## Reference Documents

| Reference | Purpose |
|-----------|---------|
| [Phase Orchestrator](references/phase-orchestrator.md) | State machine, control flow, inter-phase contracts |
| [Evidence Collection](references/phases/evidence-collection.md) | Phase 1 procedure |
| [Classification Rules](references/classification.md) | Phase 2 classification algorithm |
| [Exploration](references/phases/exploration.md) | Phase 3 procedure |
| [Planning](references/phases/planning.md) | Phase 4 procedure |
| [Implementation](references/phases/implementation.md) | Phase 5 procedure |
| [Verification](references/phases/verification.md) | Phase 6 procedure + retries |
| [Workflow Logger](references/workflow-logger.md) | Logging, errors, status reporting |
| [Scoring & Progress](references/scoring.md) | Visual progress and quality scoring |
| [Browser Automation](references/browser-automation.md) | Browser integration for UI verification |
