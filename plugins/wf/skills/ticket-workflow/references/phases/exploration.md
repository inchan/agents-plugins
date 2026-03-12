# Phase 3: Exploration

> Sequential phase 3 of 6. Requires Classification output. Must complete before Planning phase.

## Purpose

Perform deep code analysis to identify the root cause, trace execution flow, and understand the full impact of the bug. This phase dispatches parallel bug-tracer agents for comprehensive codebase understanding.

## Inputs (from Phase 2: Classification)

- `ticket_type`: "ui" or "non-ui"
- `confidence`: Classification confidence score
- `evidence_report`: Structured evidence from Phase 1
- `affected_files`: Files identified during evidence collection

## Procedure

### Step 1: Dispatch Bug Tracer Agents

Launch 2-3 `bug-tracer` agents in parallel based on ticket type:

**Agent A — Execution Path Tracer**:
- Trace the execution path from the entry point (API route, event handler, component render) to the failure location
- Map the full call chain with data transformations at each step
- Identify exactly where behavior diverges from expected

**Agent B — Pattern & Coverage Analyzer**:
- Search for similar bugs/fixes in git history
- Find related code patterns that may share the same issue
- Identify existing test coverage for the affected area
- Flag any copy-paste patterns that might propagate the bug

**Agent C — UI Component Analyzer (UI tickets only)**:
- Trace the component tree: parent → child → target component
- Analyze CSS cascade and specificity conflicts
- Check responsive breakpoints and viewport-dependent logic
- Map props/state/context flow to the affected component

### Step 2: Synthesize Agent Findings

After all agents complete:

1. **Read key files** identified by all agents
2. **Merge findings** — Combine execution traces, patterns, and component analysis
3. **Identify root cause** — Determine the primary source of the bug
4. **Map affected scope** — Full list of files that need changes or review

### Step 3: Exploration Summary

```
┌─ Exploration Report ──────────────────────┐
│ Root Cause: <description>                 │
│                                           │
│ Execution Flow:                           │
│   1. <entry point> → <intermediate>       │
│   2. <intermediate> → <failure point>     │
│                                           │
│ Affected Scope:                           │
│   • <file> — <primary fix target>         │
│   • <file> — <supporting change>          │
│   • <file> — <test addition>              │
│                                           │
│ Similar Patterns: <count>                 │
│ Test Coverage: <existing test count>      │
│ Exploration Quality: ████████░░ 80%       │
└───────────────────────────────────────────┘
```

## Error Handling

Follow the standard error handling patterns from [workflow-logger.md](../workflow-logger.md).

### Error Scenarios

| Error | Code | Recovery |
|-------|------|----------|
| Bug tracer agent timeout | `E_TIMEOUT` | Use partial trace results, continue with available data |
| Entry point not found | `E_NOTFOUND` | Search for alternative entry points, broaden scope |
| Execution trace broken (missing file) | `E_NOTFOUND` | Note gap in trace, continue from next known point |
| CSS analysis inconclusive (UI) | `E_TOOL` | Report findings so far, flag uncertainty |
| Component tree too deep to trace | `E_TIMEOUT` | Trace top 3 levels, note incomplete coverage |
| No similar patterns found | `E_NOTFOUND` | Mark as potentially novel issue, proceed |

### Logging Examples

```
[INFO ] [EXPLORE    ] +1:00 — Phase started: Exploration
[INFO ] [EXPLORE    ] +1:02 — Dispatching 2 bug-tracer agents (non-UI ticket)
[DEBUG] [EXPLORE    ] +1:05 — Agent A: Tracing execution from api/users.ts:handleRequest
[DEBUG] [EXPLORE    ] +1:08 — Agent B: Searching for similar patterns in auth/ directory
[INFO ] [EXPLORE    ] +1:30 — Agent A complete: traced 5-step call chain to failure
[INFO ] [EXPLORE    ] +1:35 — Agent B complete: found 2 similar patterns, 3 existing tests
[WARN ] [EXPLORE    ] +1:36 — Degraded mode: No Agent C dispatched (non-UI ticket)
  Original: Component tree analysis
  Fallback: Skipped — not applicable for non-UI ticket
[INFO ] [EXPLORE    ] +1:40 — Root cause identified: missing null check in data.ts:42
[INFO ] [EXPLORE    ] +1:42 — Phase completed: Exploration (score: 85%)
```

### Degradation Rules

| Failure | Degradation |
|---------|-------------|
| Agent A times out | Use evidence-phase file list as basis for root cause |
| Agent B finds no patterns | Mark as novel, proceed with evidence only |
| Agent C unavailable (UI) | Skip CSS analysis, rely on component logic trace |
| All agents fail | Fall back to direct file reading and inline analysis |

## Quality Criteria

| Metric | Weight | Description |
|--------|--------|-------------|
| Root cause identified | 35% | Clear identification of the bug source |
| Execution flow traced | 25% | Full path from trigger to failure documented |
| Similar patterns found | 20% | Related code and past fixes identified |
| Agent coverage | 20% | All dispatched agents returned useful results |

## Output

Pass to Phase 4 (Planning):
- `root_cause`: Clear description of the root cause
- `code_flow`: Traced execution path from entry to failure
- `related_patterns`: Similar code/bugs found in codebase
- `test_coverage`: Existing tests for the affected area
- `affected_files_deep`: Comprehensive list with analysis detail
- `exploration_quality_score`: 0.0 - 1.0
