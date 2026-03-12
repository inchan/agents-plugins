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

#### For UI Tickets — Before/After Visual Comparison

UI 티켓은 수정 전후의 시각적 상태를 비교하여 검증한다. browser-reproducer 에이전트의 도구 감지 결과를 재사용한다.

##### After 스크린샷 캡처 절차

1. **Before 경로 확인:** `phase_outputs["EVIDENCE"].screenshot_references`에서 Before 스크린샷 경로를 읽는다
   - `before_full`: `/tmp/wf_{ticket_id}/before_full.png`
   - `before_element`: `/tmp/wf_{ticket_id}/before_element.png`

2. **동일 도구 선택:** EVIDENCE 단계에서 캐싱된 `primary_tool` (browser-reproducer의 도구 감지 결과)을 재사용한다. 동일한 브라우저 도구로 일관된 비교를 보장한다.

3. **동일 URL 네비게이션:** EVIDENCE 단계와 동일한 URL로 navigate한다.

4. **동일 reproduction steps 재실행:** EVIDENCE 단계와 동일한 viewport, 동일한 steps를 순서대로 실행한다.

5. **After 스크린샷 캡처:** `wait_for_load_state("networkidle")` 후 캡처한다:
   - 전체 페이지: `/tmp/wf_{ticket_id}/after_full.png`
   - 영향받는 요소: `/tmp/wf_{ticket_id}/after_element.png`

6. **도구 실패 시 폴백:** browser-reproducer의 폴백 체인을 동일하게 적용한다:
   ```
   Playwright MCP → Chrome DevTools → Agent Browser → Code Analysis
   ```

##### Before/After 비교 로직

세 가지 비교 방법을 순차 실행하여 시각적 변화를 정량적으로 판정한다:

**1. maxDiffPixels 비교 (스크린샷 픽셀 비교)**

| 비교 대상 | maxDiffPixels 임계값 | 판정 |
|-----------|---------------------|------|
| element 스크린샷 (`before_element` vs `after_element`) | 100px | diff_pixels <= 100 → match |
| full page 스크린샷 (`before_full` vs `after_full`) | 500px | diff_pixels <= 500 → match |

**2. DOM 구조 비교**
```
evaluate로 관련 요소의 outerHTML을 직렬화하여 Before/After 비교
변화 유무: 구조적 변경(태그, 속성, 클래스) 감지
```

**3. 계산된 스타일 비교**
```
getComputedStyle 결과를 JSON으로 직렬화하여 Before/After 비교
변경된 CSS 속성 목록 출력
```

**판정 기준:** 세 가지 비교 중 하나라도 **개선(의도된 변화)**이 확인되면 `visual_comparison.status = "match"`로 판정한다.

##### 비교 결과 출력

browser-automation.md의 "Into Verification Report" JSON 구조를 그대로 사용한다:

```json
{
  "visual_comparison": {
    "status": "match | mismatch",
    "before_screenshot": "/tmp/wf_{ticket_id}/before_full.png",
    "after_screenshot": "/tmp/wf_{ticket_id}/after_full.png",
    "differences": ["DOM: class 'error' removed", "Style: margin-left changed 16px → 8px"],
    "diff_pixels": 42,
    "max_diff_pixels": 200,
    "assertions_passed": 3,
    "assertions_failed": 0
  }
}
```

##### 실패 처리

| 상황 | 처리 |
|------|------|
| `visual_comparison.status == "mismatch"` | `E_VERIFY` → 재시도 트리거 (즉각 FAILED가 아님) |
| 스크린샷 캡처 자체 실패 | DOM/스타일 기반 비교로 폴백, `[WARN ] [VERIFY] — Screenshot capture failed, falling back to DOM/style comparison` |
| Before 스크린샷이 없음 | DOM/스타일 비교만 수행, `[WARN ] [VERIFY] — No before screenshot found, using DOM/style only` |
| 모든 비교 방법 실패 | `E_VERIFY` → 코드 수준 분석으로 최종 폴백 |

```
UI Verification Checklist:
  □ After 스크린샷이 동일 URL/동일 steps로 캡처됨
  □ Before/After 픽셀 비교 완료 (maxDiffPixels 이내)
  □ DOM 구조 비교 완료
  □ 계산된 스타일 비교 완료
  □ visual_comparison JSON이 verification_report에 포함됨
  □ Page loads without errors
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

**For UI tickets** — Browser automation은 browser-reproducer 에이전트를 통해 통합됨. 상세 도구 정의는 `../browser-automation.md` 참조.

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
