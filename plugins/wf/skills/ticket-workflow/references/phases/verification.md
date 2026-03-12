# Phase 4: Verification

> Sequential phase 4 of 4. Requires Implementation output. Retries up to 3 times on failure.

## Purpose

Validate that the implementation correctly resolves the reported bug through automated tests and, for UI tickets, visual comparison using browser automation.

## Inputs (from Phase 3)

- `ticket_type`: "ui" or "non-ui"
- `files_modified`: List of changed files
- `tests_added`: Test files to execute
- `change_summary`: What was changed
- `verification_strategy`: From Phase 2

## Retry Policy

```
Max retries: 3
On failure:
  1. Analyze failure reason
  2. Return to Implementation phase for targeted fix
  3. Re-run verification

Retry flow:
  Attempt 1 → FAIL → fix → Attempt 2 → FAIL → fix → Attempt 3 → FAIL → REPORT
```

## Procedure

### Step 1: Run Automated Tests

Execute all relevant tests:

```bash
# Run the specific regression test added in Phase 3
<test runner> <test file>

# Run the broader test suite for the affected area
<test runner> <affected directory>
```

**Pass criteria:**
- All new tests pass
- No existing tests broken
- Exit code 0

### Step 2: Type-Specific Verification

#### For UI Tickets — Browser Automation

Use available browser tools in priority order:

1. **Playwright MCP** (preferred)
   - Navigate to the affected page
   - Capture "after" screenshot
   - Compare with "before" screenshot from evidence phase
   - Validate DOM structure matches expectations

2. **Chrome DevTools** (alternative)
   - Open the affected page
   - Inspect computed styles
   - Verify layout metrics

3. **agent-browser skill** (fallback)
   - Navigate and capture visual state
   - Verify visual correctness

```
UI Verification Checklist:
  □ Page loads without errors
  □ Affected element renders correctly
  □ Layout matches expected behavior
  □ No visual regressions in surrounding elements
  □ Responsive behavior correct (if applicable)
```

#### For Non-UI Tickets — Functional Verification

1. **Test execution** — All tests pass
2. **Manual verification** — Run the reproduction steps
3. **Edge case check** — Test boundary conditions

```
Non-UI Verification Checklist:
  □ Regression test passes
  □ Existing test suite passes
  □ Reproduction steps no longer trigger bug
  □ Edge cases handled correctly
  □ No performance regression
```

### Step 3: Verification Report

```
┌─ Verification Report ─────────────────────┐
│ Status: ✅ PASS (attempt 1/3)             │
│ Type: UI                                  │
│                                           │
│ Tests:                                    │
│   ✓ button-alignment.test.ts (3/3 pass)  │
│   ✓ button.test.ts (12/12 pass)          │
│                                           │
│ Visual Check:                             │
│   ✓ Screenshot comparison: MATCH          │
│   ✓ Layout metrics: VALID                 │
│   ✓ Responsive: OK                        │
│                                           │
│ Verification Quality: ██████████ 100%     │
└───────────────────────────────────────────┘
```

### On Failure — Retry Logic

When verification fails:

```
┌─ Verification FAILED ─────────────────────┐
│ Status: ❌ FAIL (attempt 1/3)             │
│ Failure: button-alignment.test.ts         │
│ Reason: Expected margin-left: 8px,        │
│         got margin-left: 16px             │
│                                           │
│ Action: Returning to Implementation       │
│         for targeted fix...               │
└───────────────────────────────────────────┘
```

1. Parse the failure reason
2. Identify the specific fix needed
3. Apply minimal correction (back to Phase 3, targeted)
4. Re-run verification (increment attempt counter)

If all 3 attempts fail:

```
┌─ Verification EXHAUSTED ──────────────────┐
│ Status: ⚠️ FAILED after 3 attempts        │
│                                           │
│ Attempts:                                 │
│   1: margin-left mismatch                 │
│   2: z-index conflict                     │
│   3: responsive breakpoint miss           │
│                                           │
│ Recommendation: Manual review required    │
└───────────────────────────────────────────┘
```

## Error Handling

Follow the standard error handling patterns from [workflow-logger.md](../workflow-logger.md).

### Error Scenarios

| Error | Code | Recovery |
|-------|------|----------|
| Test runner not found | `E_TOOL` | Try common runners (jest, pytest, vitest), then skip |
| Test execution timeout | `E_TIMEOUT` | Retry with shorter test subset |
| Browser launch fails | `E_BROWSER` | Fall back to DOM-based or test-only verification |
| Screenshot capture fails | `E_BROWSER` | Fall back to computed style comparison |
| Visual diff mismatch | `E_VERIFY` | Retry with adjusted thresholds |
| All tests pass but visual fails | `E_VERIFY` | Log partial pass, retry visual only |
| No test framework detected | `E_TOOL` | Use code-level analysis as verification |

### Retry Strategies

Each retry attempt uses a different strategy:

```
Attempt 1: Full verification (all tests + visual if UI)
  ↓ failure
  [WARN ] [VERIFY] +<time> — Verification attempt 1/3 failed: <reason>
  [INFO ] [VERIFY] +<time> — Retrying with strategy: targeted_fix

Attempt 2: Targeted fix + re-verify (fix specific failure, re-run)
  ↓ failure
  [WARN ] [VERIFY] +<time> — Verification attempt 2/3 failed: <reason>
  [INFO ] [VERIFY] +<time> — Retrying with strategy: relaxed_verification

Attempt 3: Relaxed verification (broader tolerances, smoke test)
  ↓ failure
  [ERROR] [VERIFY] +<time> — All verification attempts exhausted
    Code: E_VERIFY
    Context: 3/3 attempts failed
    Recovery: Manual review required
```

### Logging Examples

```
[INFO ] [VERIFY    ] +4:00 — Phase started: Verification
[INFO ] [VERIFY    ] +4:05 — Running test suite: jest --testPathPattern=Button
[INFO ] [VERIFY    ] +4:20 — Tests passed: 15/15
[INFO ] [VERIFY    ] +4:22 — Starting browser verification (Playwright MCP)...
[WARN ] [VERIFY    ] +4:30 — Degraded mode: Playwright unavailable
  Original: Browser screenshot comparison
  Fallback: DOM structure validation via test assertions
[INFO ] [VERIFY    ] +4:35 — DOM validation passed
[INFO ] [VERIFY    ] +4:36 — Phase completed: Verification (score: 90%, attempt 1/3)
```

### Degradation Rules

| Failure | Degradation |
|---------|-------------|
| Playwright/browser unavailable | Fall back to test-only verification |
| Screenshot comparison unavailable | Fall back to DOM assertion verification |
| Test runner not configured | Use code-level analysis (read tests, verify logic) |
| Visual diff tool unavailable | Compare computed styles programmatically |

## Quality Criteria

| Metric | Weight | Description |
|--------|--------|-------------|
| Test pass rate | 30% | All tests passing |
| Visual match (UI) | 25% | Screenshot/DOM comparison passes |
| No regressions | 25% | Existing tests unbroken |
| First-attempt success | 20% | Resolved without retries |

## Output

Final workflow output:
- `verification_status`: "pass" | "fail"
- `attempt_count`: 1-3
- `test_results`: Detailed test outcomes
- `visual_comparison` (UI only): Screenshot diff results
- `verification_quality_score`: 0.0 - 1.0
- `final_scorecard`: Complete workflow score visualization
