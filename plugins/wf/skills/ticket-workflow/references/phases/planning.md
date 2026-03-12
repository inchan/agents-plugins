# Phase 4: Planning

> Sequential phase 4 of 6. Requires Exploration output. Must complete before Implementation phase.

## Purpose

Synthesize the root cause analysis and exploration findings into a concrete, actionable implementation plan. Define the fix approach, enumerate specific changes, assess risks, and establish the verification strategy.

## Inputs (from Phase 3: Exploration)

- `root_cause`: Clear description of the root cause
- `code_flow`: Traced execution path from entry to failure
- `related_patterns`: Similar code/bugs found in codebase
- `test_coverage`: Existing tests for the affected area
- `affected_files_deep`: Comprehensive list with analysis detail
- `ticket_type`: "ui" or "non-ui" (from Phase 2)

## Procedure

### Step 1: Synthesize Root Cause + Exploration

Review all exploration outputs and form a clear understanding:

1. **Confirm root cause** — Validate the root cause identified in exploration
2. **Assess scope** — Determine if a minimal fix or broader refactoring is needed
3. **Check constraints** — Existing patterns, conventions, backward compatibility

### Step 2: Choose Approach

Select between two fix strategies:

| Approach | When | Trade-offs |
|----------|------|------------|
| **Minimal fix** | Root cause is isolated, low risk | Fast, but may miss related issues |
| **Robust fix** | Root cause is systemic, related patterns exist | Thorough, but higher risk and effort |

Document the decision and rationale.

### Step 3: Generate Implementation Plan

Create an ordered list of specific changes:

```
┌─ Implementation Plan ─────────────────────┐
│ Ticket: <summary>                         │
│ Type: <UI|non-UI>                         │
│ Approach: <minimal|robust>                │
│                                           │
│ Changes (in order):                       │
│  1. [<file>] <specific change>            │
│  2. [<file>] <specific change>            │
│  3. [<test file>] Add regression test     │
│                                           │
│ Risk: <Low|Medium|High>                   │
│ Estimated files: <count>                  │
└───────────────────────────────────────────┘
```

Each change entry must include:
- **File path** — exact file to modify
- **Change description** — what to change and why
- **Line reference** — approximate location (from exploration)
- **Convention notes** — existing patterns to follow

### Step 4: Define Verification Strategy

Based on ticket type, define how the fix will be validated:

**UI tickets:**
- Screenshot comparison (before/after)
- DOM structure validation
- Cross-viewport checks (if responsive issue)
- Browser tool priority: Playwright MCP → Chrome DevTools → agent-browser

**Non-UI tickets:**
- Unit test assertions
- Integration test execution
- API response validation
- Log analysis

### Step 5: Identify Risks

Document risks and mitigation strategies:

| Risk | Impact | Mitigation |
|------|--------|------------|
| Side effect on related component | Medium | Run broader test suite |
| Backward compatibility break | High | Check API consumers |
| Performance regression | Low | Benchmark before/after |

## Error Handling

Follow the standard error handling patterns from [workflow-logger.md](../workflow-logger.md).

### Error Scenarios

| Error | Code | Recovery |
|-------|------|----------|
| Exploration data incomplete | `E_NOTFOUND` | Plan with available info, flag uncertainty |
| No similar fixes found in history | `E_NOTFOUND` | Design from first principles, note as novel |
| Conflicting fix approaches | `E_CLASSIFY` | Choose minimal approach, document alternative |
| Cannot determine verification strategy | `E_UNKNOWN` | Default to test-based verification |

### Logging Examples

```
[INFO ] [PLAN       ] +1:50 — Phase started: Planning
[INFO ] [PLAN       ] +1:52 — Synthesizing root cause: missing null check in data.ts:42
[INFO ] [PLAN       ] +1:55 — Approach selected: minimal fix (isolated root cause)
[DEBUG] [PLAN       ] +1:58 — Planning 3 changes across 2 files
[WARN ] [PLAN       ] +2:00 — Degraded mode: No similar fixes found in git history
  Original: Reference past fix patterns
  Fallback: Designing fix from first principles
[INFO ] [PLAN       ] +2:10 — Verification strategy: unit tests + integration tests
[INFO ] [PLAN       ] +2:15 — Phase completed: Planning (score: 90%)
```

### Degradation Rules

| Failure | Degradation |
|---------|-------------|
| Root cause unclear | Plan for investigation + fix, flag for exploration retry |
| No code history available | Plan based on current codebase only |
| Cannot determine verification | Default to test-based verification |
| Exploration data partial | Plan with available data, note assumptions |

## Quality Criteria

| Metric | Weight | Description |
|--------|--------|-------------|
| Plan completeness | 30% | All affected files and changes listed |
| Risk assessment | 25% | Risks identified with mitigations |
| Verification defined | 25% | Clear verification steps for the ticket type |
| Approach rationale | 20% | Clear reasoning for chosen approach |

## Output

Pass to Phase 5 (Implementation):
- `approach`: "minimal" or "robust"
- `changes`: Ordered list of planned changes with file paths and descriptions
- `verification_strategy`: How to verify the fix based on ticket type
- `risks`: Identified risks with mitigation strategies
- `estimated_files`: Number of files to modify
- `planning_quality_score`: 0.0 - 1.0
