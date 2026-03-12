# Phase 4: Verification

> Sequential phase 6 of 6. Requires Implementation output. Retries up to 3 times on failure.
> On retry, strategy escalates: full → targeted → relaxed. Phases 1-4 outputs remain immutable.

## Purpose

Validate that the implementation correctly resolves the reported bug through automated tests and, for UI tickets, visual comparison using browser automation.

## Inputs (from Phase 5 Implementation)

- `ticket_type`: "ui" or "non-ui"
- `files_modified`: List of changed files
- `tests_added`: Test files to execute
- `change_summary`: What was changed
- `verification_strategy`: From Phase 4 Plan
- `retry_context` (optional — only on retry attempts):
  - `attempt`: 1-3
  - `strategy`: "full" | "targeted" | "relaxed"
  - `failure_reason`: What failed in the previous attempt
  - `failed_test`: Specific test that failed
  - `previous_changes`: Phase 5 output from previous attempt

## Retry Policy

```
Max retries: 3
Strategy escalation: full → targeted → relaxed

Retry flow:
  Attempt 1 (full)     → FAIL → Retry 1/3 -- 전략: targeted
  Attempt 2 (targeted) → FAIL → Retry 2/3 -- 전략: relaxed
  Attempt 3 (relaxed)  → FAIL → All attempts exhausted -> FAILED

On failure:
  1. Analyze failure reason in detail
  2. Return to Implementation phase with retry_context
  3. Implementation applies strategy-appropriate fix
  4. Re-run verification
```

**Phases 1-4 outputs remain immutable during all retries.**

## Procedure

### Step 0: Check Retry Context (if retry_context present)

If `retry_context` is provided, apply strategy-specific behavior before running verification:

```
strategy = retry_context.strategy

if strategy == "targeted":
  # Targeted fix: focus only on the specific failure point
  # - Read retry_context.failed_test to understand what exactly failed
  # - Check only files modified that relate to the failure
  # - Do NOT re-verify passing tests immediately (focus on failing ones first)
  Focus: retry_context.failed_test and retry_context.failure_reason

elif strategy == "relaxed":
  # Relaxed approach: full reconsideration of verification method
  # - The implementation may have taken a different path entirely
  # - Re-run full verification with fresh perspective
  # - Consider alternative verification approaches if standard tests are insufficient
  Focus: Full verification with adjusted expectations based on new implementation approach
```

### Step 1: Run Automated Tests

Execute all relevant tests in order:

```bash
# 1. Run the specific regression test added in Phase 3
<test runner> <test file>

# 2. Run the broader test suite for the affected area
<test runner> <affected directory>

# 3. Run the assertion results analysis
# - Check which assertions passed and failed
# - Note any unexpected assertion values

# 4. Analyze test logs
# - Look for error messages, stack traces, unexpected output
# - Identify root cause of any failure

# 5. Check side effects
# - Verify no previously passing tests are now failing
# - Run the full test suite if any doubts exist
<test runner> --all  # or equivalent
```

**Pass criteria:**
- All new tests pass
- No existing tests broken (side effect check)
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

1. **Test execution** — Run all relevant tests; check assertion results

2. **Assertion result analysis:**
   - Verify expected values match actual values
   - Identify any partial passes (some assertions pass, others fail)

3. **Log analysis:**
   - Review test output logs for unexpected errors or warnings
   - Look for stack traces indicating root cause

4. **Side effect check:**
   - Run the broader test suite to confirm no regressions
   - Pay attention to tests in related modules

5. **Edge case verification:**
   - Test boundary conditions specified in Phase 4 plan
   - Verify error handling paths work correctly

```
Non-UI Verification Checklist:
  □ Regression test passes (new tests added in Phase 3)
  □ Existing test suite passes (no regressions / side effects)
  □ Assertion results match expected values
  □ Logs show no unexpected errors
  □ Reproduction steps no longer trigger bug
  □ Edge cases handled correctly
  □ No performance regression
```

**For UI tickets** — Browser automation is integrated in Phase 2 (browser-reproducer). See `../browser-automation.md`.
<!-- Phase 2 UI: browser-reproducer 통합 예정 — Playwright MCP 통합 전까지 코드 수준 폴백 사용 -->

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

Each retry attempt uses a different strategy. Strategy determines how Phase 5 (Implement) behaves on re-execution:

```
Attempt 1 (strategy: full):
  Full verification — all tests + visual if UI
  → Implementation uses original plan unchanged
  ↓ failure
  [WARN ] [VERIFY] +<time> -- Attempt 1/3 failed: <reason>. Retry strategy: targeted
  [INFO ] [VERIFY] +<time> -- Retry 1/3 -- 전략: targeted

Attempt 2 (strategy: targeted):
  Targeted fix — identify specific failure, fix only that part
  → Implementation: read failure_reason, modify only failing file/function
  → Preserve all working changes from Attempt 1
  ↓ failure
  [WARN ] [VERIFY] +<time> -- Attempt 2/3 failed: <reason>. Retry strategy: relaxed
  [INFO ] [VERIFY] +<time> -- Retry 2/3 -- 전략: relaxed

Attempt 3 (strategy: relaxed):
  Approach change — reconsider entire implementation strategy
  → Implementation: try different files, use alternative algorithm, apply workaround
  → Phases 1-4 remain immutable; only Phase 5-6 re-execute
  ↓ failure
  [ERROR] [VERIFY] +<time> -- All attempts exhausted -> FAILED
    Code: E_VERIFY
    Context: 3/3 attempts failed
    Recovery: Manual review required
```

**Verification behavior by strategy:**

| Strategy | Test Focus | Scope | Action on Failure |
|----------|-----------|-------|-------------------|
| `full` | All tests + regression | Complete | Return full failure report |
| `targeted` | failed_test only first, then expand | Specific failure point | Focus analysis on failure_reason |
| `relaxed` | Full re-verification | Complete | Accept alternative implementation approach |

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
