# Phase Orchestrator — Control Flow & State Machine

> This is the central orchestration reference for the ticket workflow. All phase transitions, state management, retry logic, and inter-phase data flow are defined here.

---

## 1. Workflow State Machine

The workflow is a sequential state machine with a single retry loop in the verification phase.

### State Diagram

```
                    ┌──────────────┐
                    │   INIT       │
                    │  Parse input │
                    └──────┬───────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  PHASE 1: EVIDENCE   │
                │  Collect & reproduce │
                └──────────┬───────────┘
                           │ evidence_report
                           ▼
                ┌──────────────────────┐
                │  PHASE 2: CLASSIFY   │
                │  UI vs non-UI        │
                └──────────┬───────────┘
                           │ classification
                           ▼
                ┌──────────────────────┐
                │  PHASE 3: EXPLORE    │
                │  Deep code analysis  │
                └──────────┬───────────┘
                           │ root_cause
                           ▼
                ┌──────────────────────┐
                │  PHASE 4: PLAN       │
                │  Design the fix      │
                └──────────┬───────────┘
                           │ implementation_plan
                           ▼
              ┌────────────────────────────┐
              │  PHASE 5: IMPLEMENT        │
         ┌───▶│  Apply the fix             │
         │    └────────────┬───────────────┘
         │                 │ code_changes
         │                 ▼
         │    ┌────────────────────────────┐
         │    │  PHASE 6: VERIFY           │
         │    │  Test & validate           │
         │    └────────────┬───────────────┘
         │                 │
         │          ┌──────┴──────┐
         │          │             │
         │        PASS          FAIL
         │          │             │
         │          ▼             ▼
         │    ┌──────────┐  ┌──────────────┐
         │    │  DONE    │  │  retry < 3?  │
         │    │  Report  │  └──────┬───────┘
         │    └──────────┘    YES  │    NO
         │                    │    │     │
         └────────────────────┘    │     ▼
                                   │  ┌──────────┐
                                   │  │  FAILED  │
                                   │  │  Report  │
                                   │  └──────────┘
                                   ▼
                              (back to PHASE 5
                               with targeted fix)
```

### State Definitions

| State | Phase | Entry Condition | Exit Condition |
|-------|-------|----------------|----------------|
| `INIT` | - | Command invoked with ticket input | Input parsed successfully |
| `EVIDENCE` | 1 | INIT complete | Evidence report produced |
| `CLASSIFY` | 2 | Evidence collected | Classification result with confidence >= 0.5 |
| `EXPLORE` | 3 | Classification done | Root cause analysis produced |
| `PLAN` | 4 | Exploration done | Implementation plan produced |
| `IMPLEMENT` | 5 | Plan approved (or retry triggered) | Code changes applied |
| `VERIFY` | 6 | Implementation done | PASS or FAIL (with retry budget) |
| `DONE` | - | Verification PASS | Final report produced |
| `FAILED` | - | Verification exhausted retries (3x) | Final report with failure details |

---

## 2. Phase Contract — Input/Output Specification

Each phase is a pure function: it receives a defined input and produces a defined output. The orchestrator passes outputs from one phase as inputs to the next.

### Phase 1: Evidence → Phase 2: Classify

```
Output: {
  evidence_report: {
    summary: string
    affected_files: string[]
    error_patterns: string[]
    reproduction_result: "success" | "partial" | "failed"
    git_history: string[]  // recent relevant commits
    external_evidence: string[]  // fetched URLs, screenshots
  }
  evidence_quality_score: float  // 0.0 - 1.0
}
```

### Phase 2: Classify → Phase 3: Explore

```
Output: {
  ticket_type: "ui" | "non-ui"
  confidence: float  // 0.0 - 1.0
  classification_signals: Signal[]
  ui_details: UIDetails | null  // only for UI tickets
}
```

### Phase 3: Explore → Phase 4: Plan

```
Output: {
  root_cause: string  // description of the root cause
  code_flow: string[]  // traced execution path
  related_patterns: string[]  // similar code/bugs found
  test_coverage: string[]  // existing tests for the area
  affected_files_deep: FileAnalysis[]
}
```

### Phase 4: Plan → Phase 5: Implement

```
Output: {
  approach: string  // "minimal" | "robust"
  changes: PlannedChange[]  // ordered list of changes
  verification_strategy: VerificationStrategy
  risks: string[]
  estimated_files: int
}
```

### Phase 5: Implement → Phase 6: Verify

```
Output: {
  modified_files: ModifiedFile[]
  tests_added: string[]
  change_summary: string
  implementation_quality_score: float
}
```

### Phase 6: Verify → DONE/RETRY

```
Output: {
  status: "pass" | "fail"
  attempt: int  // 1-3
  strategy: "full" | "targeted" | "relaxed"  // strategy used in this attempt
  test_results: TestResult[]
  visual_comparison: VisualResult | null  // UI only
  failure_reason: string | null  // only on fail
  failed_test: string | null  // specific test that failed
  verification_quality_score: float
}
```

---

## 3. Control Flow Rules

### Rule 1: Strict Sequential Execution

Phases execute in order: 1 → 2 → 3 → 4 → 5 → 6. No phase may begin until the previous phase has produced its output.

**Enforcement**: Before starting phase N, check that phase N-1 output exists.

### Rule 2: No Skipping

Every phase must execute. Even if the ticket is obviously UI or non-UI, classification still runs (it just confirms with high confidence).

### Rule 3: Retry Scope is Limited

Only the VERIFY → IMPLEMENT → VERIFY loop retries. Phases 1-4 never re-execute.

**Phases 1-4 outputs remain immutable during retries. Only Phases 5-6 re-execute.**

On retry, apply the 3-stage strategy progression:

| Attempt | Strategy | Action |
|---------|----------|--------|
| 1 | `full` | 원래 계획 그대로. `verification_strategy` 변경 없음 |
| 2 | `targeted` | `failure_reason`에서 실패 지점 식별. 해당 파일/함수만 수정. 이전 정상 변경은 유지 |
| 3 | `relaxed` | 접근 방식 자체를 변경. 다른 파일 수정, 우회 전략, 또는 대안 알고리즘 적용 |

Each retry begins with a log entry:
```
[INFO ] [VERIFY] +<time> -- Retry N/3 -- 전략: <targeted|relaxed>
```

Phase 5 receives failure context from Phase 6 on each retry:
```
retry_context = {
  attempt: <1|2|3>,
  strategy: <"full"|"targeted"|"relaxed">,
  failure_reason: <string>,
  failed_test: <specific test that failed>,
  previous_changes: <Phase 5 output from previous attempt>
}
```

### Rule 4: Progress Reporting at Boundaries

At every phase boundary, the orchestrator:
1. Logs the transition: `[INFO] [WORKFLOW] +<time> — Phase transition: <FROM> → <TO>`
2. Renders the progress scorecard (see [scoring.md](scoring.md))
3. Passes outputs to the next phase

### Rule 5: Error Propagation

Errors within a phase are handled per the [workflow-logger.md](workflow-logger.md) error decision tree:
- **Recoverable errors**: Degrade gracefully, log `[WARN]` with error code, continue
- **Fatal errors in phases 1-4**: Log `[ERROR]` with code + context + recovery, set workflow result to PARTIAL, continue with degraded data
- **Fatal errors in phases 5-6**: Log `[ERROR]`, trigger retry (if budget remains) or fail workflow

All errors MUST follow the standard error format:
```
[ERROR] [<PHASE>] +<time> — <description>
  Code: <E_xxx>
  Context: <what was being attempted>
  Recovery: <action taken>
```

All degradations MUST follow the standard degradation format:
```
[WARN ] [<PHASE>] +<time> — Degraded mode: <description>
  Original: <what was planned>
  Fallback: <what is being done instead>
```

Standard error codes: `E_TOOL`, `E_NOTFOUND`, `E_TIMEOUT`, `E_PARSE`, `E_VERIFY`, `E_BROWSER`, `E_CLASSIFY`, `E_UNKNOWN`

### Rule 6: Type-Dependent Branching

After classification (Phase 2), the ticket type influences:

| Aspect | UI | Non-UI |
|--------|-----|--------|
| Phase 3 agents | Include component tree + CSS analysis | Standard code tracing |
| Phase 5 focus | Visual, responsive, accessibility | Logic, data, API correctness |
| Phase 6 method | Tests + browser automation | Tests only |
| Phase 6 fallback | DOM analysis if browser unavailable | - |

---

## 4. Orchestrator Entry Point Protocol

When the `/ticket` command is invoked:

### Step 1: Initialize Workflow

```
1. Parse $ARGUMENTS to get raw ticket input
2. Start elapsed time counter
3. Log workflow start:
   ╔══════════════════════════════════════════╗
   ║  TICKET WORKFLOW STARTED                 ║
   ║  Input: <first 60 chars of input>...     ║
   ╚══════════════════════════════════════════╝
4. Initialize state:
   workflow_state = {
     phase: "INIT",
     ticket_type: null,
     retry_count: 0,
     max_retries: 3,
     phase_outputs: {},
     phase_scores: {},
     errors: [],
     warnings: []
   }
```

### Step 2: Execute Phase Pipeline

```
for phase in [EVIDENCE, CLASSIFY, EXPLORE, PLAN, IMPLEMENT, VERIFY]:
    workflow_state.phase = phase

    # Log transition
    log_transition(previous_phase, phase)

    # Execute phase (following its reference document)
    output = execute_phase(phase, workflow_state.phase_outputs)

    # Store output
    workflow_state.phase_outputs[phase] = output
    workflow_state.phase_scores[phase] = output.quality_score

    # Render progress scorecard
    render_scorecard(workflow_state)

    # Phase-specific post-processing
    if phase == CLASSIFY:
        workflow_state.ticket_type = output.ticket_type
    if phase == VERIFY:
        handle_verification_result(output, workflow_state)
```

### Step 3: Handle Verification Result

```
def get_retry_strategy(retry_count):
    if retry_count == 1: return "full"
    if retry_count == 2: return "targeted"
    if retry_count == 3: return "relaxed"

def handle_verification_result(output, state):
    if output.status == "pass":
        state.phase = "DONE"
        render_final_report(state)
    elif state.retry_count < state.max_retries:
        state.retry_count += 1
        strategy = get_retry_strategy(state.retry_count)

        # Log retry with strategy (한글+영어 혼용 포맷)
        log(f"[WARN ] [VERIFY] +<time> -- Attempt {state.retry_count-1}/3 failed: {output.failure_reason}. Retry strategy: {strategy}")
        log(f"[INFO ] [VERIFY] +<time> -- Retry {state.retry_count}/3 -- 전략: {strategy}")

        # Determine implementation behavior based on strategy:
        # - full (attempt 1): Re-execute with original plan unchanged
        # - targeted (attempt 2): Fix only the specific failure point; preserve working changes
        # - relaxed (attempt 3): Change approach entirely; try different files/functions/algorithms

        # Re-execute IMPLEMENT with failure context
        # IMPORTANT: Phases 1-4 outputs remain immutable. Only re-execute Phase 5+.
        implement_input = {
            ...state.phase_outputs["PLAN"],
            retry_context: {
                attempt: state.retry_count,
                strategy: strategy,
                failure_reason: output.failure_reason,
                failed_test: output.failed_test,
                previous_changes: state.phase_outputs["IMPLEMENT"]
            }
        }
        new_impl = execute_phase(IMPLEMENT, implement_input)
        state.phase_outputs["IMPLEMENT"] = new_impl

        # Re-execute VERIFY
        new_verify = execute_phase(VERIFY, state.phase_outputs)
        handle_verification_result(new_verify, state)  # recursive
    else:
        state.phase = "FAILED"
        log(f"[ERROR] [VERIFY] +<time> -- All attempts exhausted -> FAILED")
        render_final_report(state)
```

### Step 4: Render Final Report

Produce the complete workflow report per [scoring.md](scoring.md) and [workflow-logger.md](workflow-logger.md) section 5c.

---

## 5. Agent Dispatch Protocol

The orchestrator spawns agents during specific phases:

### Phase 1: Evidence Collection Agents

```
Agent: evidence-searcher (x2 parallel)
  Agent A: "Search for error patterns: '<errors>' in the codebase"
  Agent B: "Find files related to '<components>' and check git history"
```

### Phase 3: Exploration Agents

```
Agent: bug-tracer (x2 parallel)
  Agent A: "Trace the execution path for '<bug scenario>' from entry to failure"
  Agent B: "Find similar patterns and existing tests for '<affected area>'"

For UI tickets, add:
  Agent C: "Analyze component tree and CSS cascade for '<UI component>'"
```

### Agent Result Integration

After agents return:
1. Read all key files identified by agents
2. Synthesize findings into the phase output
3. Log agent results at DEBUG level

---

## 6. Workflow Invariants

These conditions must hold throughout the workflow:

1. **Phase outputs are immutable** — Once produced, a phase's output is never modified (retries produce new IMPLEMENT/VERIFY outputs, but phases 1-4 outputs persist)
2. **Retry count never exceeds 3** — `0 <= retry_count <= max_retries`
3. **Type is set after Phase 2** — `ticket_type` is null before Phase 2 and always non-null after
4. **Progress is monotonic** — Overall progress percentage never decreases (retries don't reduce it)
5. **Every phase produces a quality score** — No phase completes without a 0.0-1.0 quality score
6. **Scorecard renders at every boundary** — The progress visualization appears between every phase
