# Workflow Logger — Standard Logging & Error Handling Reference

This reference defines the **canonical patterns** for logging, error handling, and status reporting used across every phase of the ticket workflow. All agents and commands MUST follow these patterns for consistency.

---

## 1. Log Levels

Every log entry uses one of four severity levels:

| Level | Icon | When to use |
|-------|------|-------------|
| `INFO` | `[INFO]` | Normal progress updates, phase transitions, decisions made |
| `WARN` | `[WARN]` | Recoverable issues, fallback triggered, degraded results |
| `ERROR` | `[ERROR]` | Phase failure, unrecoverable within current attempt |
| `DEBUG` | `[DEBUG]` | Detailed diagnostic info (file paths searched, tool outputs) |

### Log Entry Format

```
[<LEVEL>] [<PHASE>] <timestamp_relative> — <message>
```

- **PHASE**: One of `EVIDENCE`, `CLASSIFY`, `EXPLORE`, `PLAN`, `IMPLEMENT`, `VERIFY`, `WORKFLOW`
- **timestamp_relative**: Elapsed time since workflow start (e.g., `+0:00`, `+2:15`)

### Examples

```
[INFO]  [WORKFLOW]   +0:00 — Workflow started for ticket #1234
[INFO]  [EVIDENCE]   +0:05 — Collecting codebase evidence...
[DEBUG] [EVIDENCE]   +0:12 — Found 3 files matching error pattern: auth.ts, login.tsx, session.ts
[WARN]  [CLASSIFY]   +0:30 — No explicit UI indicators found; defaulting to non-UI classification
[ERROR] [VERIFY]     +5:20 — Verification attempt 2/3 failed: test assertion error on line 42
[INFO]  [WORKFLOW]   +6:00 — Workflow completed with status: SUCCESS
```

---

## 2. Phase Status Tracking

Each phase reports its status using a standard structure:

### Phase Lifecycle

```
PHASE_START  → PHASE_PROGRESS → PHASE_COMPLETE | PHASE_FAILED | PHASE_SKIPPED
```

### Phase Report Template

```
┌─────────────────────────────────────────┐
│ Phase: <PHASE_NAME>                     │
│ Status: <PENDING|RUNNING|SUCCESS|FAILED|SKIPPED> │
│ Duration: <elapsed>                     │
│ Details: <summary>                      │
│ Artifacts: <list of outputs>            │
└─────────────────────────────────────────┘
```

### Phase Status Values

| Status | Meaning |
|--------|---------|
| `PENDING` | Not yet started |
| `RUNNING` | Currently executing |
| `SUCCESS` | Completed without errors |
| `FAILED` | Completed with unrecoverable errors |
| `SKIPPED` | Intentionally bypassed (e.g., UI verify on non-UI ticket) |
| `RETRY` | Failed but retrying (verification phase only) |

---

## 3. Error Handling Patterns

### 3a. Error Classification

All errors must be classified into one of these categories:

| Category | Code | Recovery |
|----------|------|----------|
| `TOOL_ERROR` | `E_TOOL` | Retry with fallback tool or approach |
| `NOT_FOUND` | `E_NOTFOUND` | Expand search scope, then warn |
| `TIMEOUT` | `E_TIMEOUT` | Retry with shorter scope or skip |
| `PARSE_ERROR` | `E_PARSE` | Log raw output, attempt alternative parsing |
| `VERIFICATION_FAIL` | `E_VERIFY` | Retry up to 3 times with adjusted strategy |
| `BROWSER_ERROR` | `E_BROWSER` | Fallback to non-visual verification |
| `CLASSIFICATION_ERROR` | `E_CLASSIFY` | Default to non-UI, log warning |
| `UNKNOWN` | `E_UNKNOWN` | Log full context, fail phase gracefully |

### 3b. Error Report Format

```
[ERROR] [<PHASE>] +<time> — <message>
  Code: <error_code>
  Context: <what was being attempted>
  Recovery: <action taken or suggested>
```

### Example

```
[ERROR] [VERIFY] +4:30 — Browser screenshot comparison failed
  Code: E_BROWSER
  Context: Comparing before/after screenshots of login form
  Recovery: Falling back to DOM-based verification
```

### 3c. Retry Logic (Verification Phase)

The verification phase supports up to **3 retry attempts** on failure:

```
Attempt 1: Standard verification (tests + visual if UI)
  ↓ failure
Attempt 2: Adjusted verification (relaxed thresholds, alternative assertions)
  ↓ failure
Attempt 3: Minimal verification (smoke test only)
  ↓ failure
PHASE_FAILED — all retries exhausted
```

Each retry must log:

```
[WARN] [VERIFY] +<time> — Verification attempt <N>/3 failed: <reason>
[INFO] [VERIFY] +<time> — Retrying with strategy: <strategy_name>
```

### 3d. Graceful Degradation

When a non-critical step fails, the workflow should **degrade gracefully** rather than abort:

| Failure | Degradation |
|---------|-------------|
| UI screenshot capture fails | Fall back to DOM assertion |
| Browser automation unavailable | Skip visual verify, use test-only verify |
| Evidence search finds nothing | Log warning, proceed with ticket description only |
| Planning agent timeout | Use simplified inline planning |

Report degradation as:

```
[WARN] [<PHASE>] +<time> — Degraded mode: <description>
  Original: <what was planned>
  Fallback: <what is being done instead>
```

---

## 4. Workflow Progress Scorecard

At any point (and always at workflow end), produce a visual progress scorecard:

### Scorecard Format

```
╔══════════════════════════════════════════════════════╗
║            TICKET WORKFLOW SCORECARD                  ║
║  Ticket: <ticket_id> — <title>                       ║
║  Type: <UI|NON_UI>                                   ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  Evidence Collection    [████████░░]  80%  SUCCESS    ║
║  Classification         [██████████]  100% SUCCESS    ║
║  Exploration            [██████████]  100% SUCCESS    ║
║  Planning               [██████████]  100% SUCCESS    ║
║  Implementation         [██████░░░░]  60%  RUNNING    ║
║  Verification           [░░░░░░░░░░]  0%   PENDING   ║
║                                                      ║
║  Overall Progress:      [██████░░░░]  68%             ║
║  Elapsed Time:          3m 42s                       ║
║  Errors: 0 | Warnings: 2 | Retries: 0               ║
╚══════════════════════════════════════════════════════╝
```

### Progress Bar Rendering

Use `█` for filled and `░` for empty, always 10 characters wide:

| Percentage | Bar |
|-----------|-----|
| 0% | `[░░░░░░░░░░]` |
| 10% | `[█░░░░░░░░░]` |
| 20% | `[██░░░░░░░░]` |
| 30% | `[███░░░░░░░]` |
| 40% | `[████░░░░░░]` |
| 50% | `[█████░░░░░]` |
| 60% | `[██████░░░░]` |
| 70% | `[███████░░░]` |
| 80% | `[████████░░]` |
| 90% | `[█████████░]` |
| 100% | `[██████████]` |

### Phase Weights for Overall Progress

| Phase | Weight |
|-------|--------|
| Evidence Collection | 10% |
| Classification | 5% |
| Exploration | 15% |
| Planning | 15% |
| Implementation | 35% |
| Verification | 20% |

---

## 5. Status Reporting Protocol

### 5a. Phase Transition Reports

At every phase boundary, output:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[INFO] [WORKFLOW] +<time> — Phase transition: <FROM> → <TO>
<previous phase summary>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 5b. Workflow Start Report

```
╔══════════════════════════════════════════╗
║  TICKET WORKFLOW STARTED                 ║
║  Ticket: <id> — <title>                  ║
║  Source: <ticket_source>                 ║
║  Time: <start_time>                      ║
╚══════════════════════════════════════════╝

[INFO] [WORKFLOW] +0:00 — Initializing workflow phases...
```

### 5c. Workflow End Report

```
╔══════════════════════════════════════════════════════╗
║  TICKET WORKFLOW COMPLETE                            ║
║  Ticket: <id> — <title>                              ║
║  Result: <SUCCESS|PARTIAL|FAILED>                    ║
║  Duration: <total_time>                              ║
╠══════════════════════════════════════════════════════╣
║  Phases:                                             ║
║    Evidence:       SUCCESS  (12 artifacts)            ║
║    Classification: SUCCESS  (type: UI)                ║
║    Planning:       SUCCESS  (3 steps planned)         ║
║    Implementation: SUCCESS  (4 files modified)        ║
║    Verification:   SUCCESS  (attempt 1/3)             ║
╠══════════════════════════════════════════════════════╣
║  Summary:                                            ║
║    Errors: 0 | Warnings: 1 | Retries: 0             ║
║    Files modified: 4                                 ║
║    Tests added/modified: 2                           ║
╚══════════════════════════════════════════════════════╝
```

### 5d. Final Workflow Result

| Result | Condition |
|--------|-----------|
| `SUCCESS` | All phases completed successfully |
| `PARTIAL` | Workflow completed but with degraded verification or warnings |
| `FAILED` | One or more critical phases failed after all retries |

---

## 6. Error Handling Decision Tree

```
Error occurs in phase
  │
  ├─ Is it a known error category? (E_TOOL, E_NOTFOUND, etc.)
  │   ├─ YES → Apply category-specific recovery
  │   │   ├─ Recovery succeeds → Log [WARN], continue
  │   │   └─ Recovery fails → Is this the VERIFY phase?
  │   │       ├─ YES → Retry (up to 3x)
  │   │       │   ├─ Retry succeeds → Log [WARN], continue
  │   │       │   └─ All retries fail → PHASE_FAILED
  │   │       └─ NO → Can we degrade gracefully?
  │   │           ├─ YES → Log [WARN], degrade, continue
  │   │           └─ NO → PHASE_FAILED
  │   └─ NO → Log [ERROR] with full context
  │       └─ Can we degrade gracefully?
  │           ├─ YES → Log [WARN], degrade, continue
  │           └─ NO → PHASE_FAILED
  │
  └─ PHASE_FAILED
      ├─ Is it a critical phase? (IMPLEMENT, VERIFY)
      │   ├─ YES → Workflow result = FAILED
      │   └─ NO → Workflow result = PARTIAL, continue remaining phases
      └─ Log final phase report
```

---

## 7. Consistent Reporting Helpers

When producing any log or report, use these conventions:

- **Timestamps**: Always relative to workflow start (`+M:SS` format)
- **Phase names**: Always UPPERCASE (`EVIDENCE`, `CLASSIFY`, `PLAN`, `IMPLEMENT`, `VERIFY`)
- **Error codes**: Always prefixed with `E_`
- **Counts**: Always format as `N <noun>` (e.g., `3 files`, `2 retries`)
- **File lists**: Always as bullet points with relative paths
- **Tool outputs**: Wrap in DEBUG-level logs, never in user-facing reports
- **Unicode box drawing**: Use for scorecards and reports only, not for logs
