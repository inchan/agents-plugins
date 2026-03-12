# Phase 2: UI 브라우저 자동화 - Research

**Researched:** 2026-03-12
**Domain:** 브라우저 자동화 통합 (Playwright MCP / Chrome DevTools MCP / agent-browser), Before/After 스크린샷 비교
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**브라우저 도구 폴백 체인**
- 우선순위: Playwright MCP → Chrome DevTools MCP → agent-browser skill → 코드 수준 분석
- 각 도구 감지는 워크플로우 시작 시 1회 수행하고 결과를 캐싱
- 도구 실패 시 자동으로 다음 단계로 폴백하며, 폴백 로그를 `[WARN] [BROWSER]` 형태로 출력
- 모든 도구가 실패하면 코드 수준 분석(Phase 1에서 구현 완료)으로 최종 폴백 — 워크플로우가 중단되지 않음

**Playwright MCP 통합**
- `mcp__playwright__*` 도구 사용 — navigate, screenshot, click, fill, evaluate 등
- Shadow DOM 요소는 Playwright가 기본 지원하나, 실패 시 evaluate로 직접 접근 시도
- 스크린샷은 전체 페이지 + 영향받는 요소 2장 캡처 (Before/After 각각)
- maxDiffPixels 기반 시각적 비교 — 기본 임계값은 Claude 재량

**Chrome DevTools MCP 통합**
- `mcp__chrome-devtools__*` 도구 사용 — navigate_page, take_screenshot, click, evaluate_script 등
- Playwright MCP가 없거나 실패할 때 활성화
- 동일한 reproduction step 포맷을 사용하여 도구 간 전환이 투명하게 동작

**agent-browser 스킬 통합**
- 자연어 지시 기반 브라우저 조작
- Playwright/Chrome DevTools 모두 실패 시 사용
- 스크린샷 캡처 및 시각적 검증은 제한적일 수 있으나 재현 확인은 가능

**병렬 크로스체크 전략**
- 가용한 브라우저 도구가 2개 이상이면 병렬로 실행하여 크로스체크
- 두 도구의 재현 결과가 일치하면 신뢰도 높음으로 판정
- 불일치 시 두 결과를 모두 evidence에 포함하고 차이점을 로그
- 크로스체크는 선택적 최적화 — 도구가 1개만 가용하면 단독 실행

**Before/After 스크린샷 비교**
- Before: 수정 전 재현 시 캡처 (Phase 1 EVIDENCE 단계)
- After: 수정 후 동일 조건으로 재캡처 (Phase 6 VERIFY 단계)
- 비교 결과: 시각적 차이 유무, 수정 확인 여부를 구조화된 JSON으로 출력
- 스크린샷 파일은 임시 경로에 저장 — 워크플로우 완료 후 결과 리포트에 경로 포함

**browser-reproducer 에이전트 완성**
- Phase 1에서 스텁으로 생성된 `agents/browser-reproducer.md`를 완전히 구현
- tools: Bash, Read, Glob, Grep, WebFetch + 가용한 MCP 도구
- 에이전트가 reproduction step을 파싱하고 사용 가능한 브라우저 도구로 실행
- 출력: reproduction_status, method, screenshots, dom_evidence, console_errors

### Claude's Discretion
- maxDiffPixels 기본 임계값 결정
- 스크린샷 저장 경로 및 파일 명명 규칙
- 크로스체크 불일치 시 최종 판정 로직
- viewport 추론 실패 시 기본 해상도 선택
- 브라우저 도구 감지 순서 최적화 방법

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UIBR-01 | UI 이슈는 브라우저 자동화 도구로 재현하고 Before 스크린샷을 캡처한다 | browser-reproducer.md 스텁 완성 + browser-automation.md 폴백 체인 활용 |
| UIBR-02 | 수정 후 After 스크린샷을 캡처하여 Before와 비교 검증한다 | verification.md의 UI 검증 절차에 browser-reproducer After 캡처 통합 |
| UIBR-03 | 브라우저 도구를 병렬로 크로스체크한다 (가용한 도구 모두 활용) | 도구 감지 후 2개 이상 가용 시 병렬 Agent 디스패치 패턴 적용 |
| UIBR-04 | 브라우저 도구 폴백 체인을 지원한다 (Playwright → Chrome DevTools → agent-browser) | browser-automation.md에 이미 정의된 E_TOOL 기반 degradation chain 구현 |

</phase_requirements>

---

## Summary

Phase 2는 Phase 1에서 스텁(stub)으로 남겨진 `browser-reproducer.md` 에이전트를 완성하고, UI 티켓 경로를 실제로 활성화하는 작업이다. 핵심 아키텍처(폴백 체인, 데이터 플로우, reproduction step 타입)는 이미 `browser-automation.md`에 완전히 정의되어 있으므로, 이 Phase의 실질적 작업은 "기존 설계를 실행 가능한 에이전트/참조 문서로 구체화"하는 것이다.

Phase 1에서 확립된 패턴(YAML frontmatter 에이전트 정의, references/ 위임, 로그 포맷)을 그대로 따른다. 새로운 패턴을 도입하지 않고 기존 컨벤션을 확장한다. 3개의 플랜으로 분리된다: (1) browser-reproducer 에이전트 완성 + Before 스크린샷, (2) After 스크린샷 + 비교 검증, (3) 병렬 크로스체크 + 폴백 체인.

의존성 위험은 낮다. `mcp__playwright__*`와 `mcp__chrome-devtools__*` 도구 형태는 이미 CONTEXT.md에 확정되었으며, 폴백 덕분에 MCP 미설치 환경에서도 워크플로우가 완전히 작동한다. 유일한 불확실성은 Playwright MCP Shadow DOM 처리의 실제 동작(STATE.md에 검증 필요로 기록됨)이나, 이것도 `evaluate`로 직접 접근하는 폴백이 이미 설계에 포함되어 있다.

**Primary recommendation:** `browser-reproducer.md`를 완전 구현하고, `evidence-collection.md`와 `verification.md`에 UI 브라우저 통합 절차를 주입하라.

---

## Standard Stack

### Core

| 구성 요소 | 현재 상태 | 용도 | 근거 |
|-----------|-----------|------|------|
| `mcp__playwright__*` | MCP 도구 (외부 서버 필요) | navigate, screenshot, click, fill, evaluate | CONTEXT.md에 확정된 1순위 도구 |
| `mcp__chrome-devtools__*` | MCP 도구 (Chrome 136+ 필요) | navigate_page, take_screenshot, click, evaluate_script | CONTEXT.md에 확정된 2순위 도구 |
| `agent-browser` 스킬 | 플러그인 (자연어 기반) | 자연어로 브라우저 조작 | 3순위 폴백 |
| 코드 수준 분석 | Phase 1에서 구현 완료 | Glob/Grep/Read로 CSS·컴포넌트 분석 | 최종 폴백, 항상 가용 |

### 폴백 체인 (Confidence: HIGH — CONTEXT.md 확정)

```
Playwright MCP ──▶ Chrome DevTools MCP ──▶ agent-browser ──▶ 코드 분석
(preferred)        (alternative)            (fallback)        (always)
```

### 스크린샷 비교 전략 (Confidence: MEDIUM)

| 접근 방식 | 방법 | 임계값 |
|-----------|------|--------|
| maxDiffPixels 비교 | Before/After 픽셀 차이 수 비교 | Claude 재량 (권장: 100px) |
| DOM 구조 비교 | evaluate로 DOM 상태 직렬화 비교 | 구조적 동일성 |
| 계산된 스타일 비교 | getComputedStyle 결과 JSON 비교 | 변경된 스타일 속성 유무 |

---

## Architecture Patterns

### 현재 파일 구조

```
plugins/wf/
├── agents/
│   ├── browser-reproducer.md     # Phase 2: 스텁 → 완전 구현 대상
│   ├── evidence-searcher.md      # Phase 1: 완료
│   ├── bug-tracer.md             # Phase 1: 완료
│   ├── planner.md                # Phase 1: 완료
│   ├── implementer.md            # Phase 1: 완료
│   └── verifier.md               # Phase 1: 완료 (UI 통합 필요)
├── commands/
│   └── ticket-workflow.md        # Phase 1: 완료 (UI 경로 활성화 필요)
└── skills/ticket-workflow/references/
    ├── browser-automation.md     # Phase 2: 완전 정의됨 — 그대로 활용
    ├── phase-orchestrator.md     # Phase 1: 완료
    ├── classification.md         # Phase 1: 완료
    └── phases/
        ├── evidence-collection.md  # Phase 2: UI 재현 절차 주입 필요
        └── verification.md         # Phase 2: UI 비교 검증 절차 주입 필요
```

### Pattern 1: 에이전트 YAML frontmatter 정의

**What:** 에이전트 파일은 YAML frontmatter + 마크다운 본문으로 구성
**When to use:** 모든 에이전트 파일에 적용

```yaml
# Source: plugins/wf/agents/evidence-searcher.md 참조
---
name: browser-reproducer
description: >
  Reproduces UI issues using browser automation — navigates to
  affected pages, executes reproduction steps, captures screenshots
tools: Bash, Read, Glob, Grep, WebFetch
model: inherit
color: blue
---
```

Phase 2에서 `browser-reproducer.md`를 완성할 때 위 패턴을 그대로 유지한다.

### Pattern 2: 도구 감지 및 캐싱

**What:** 워크플로우 시작 시 1회 도구 감지, 결과를 상태에 저장
**When to use:** browser-reproducer 에이전트의 INIT 단계

```
# 도구 감지 순서 (Claude Code에서 실행 가능한 방식)
1. mcp__playwright__* 도구가 호출 가능한지 시도
   → 성공: available_tools["playwright"] = true
   → 실패 (E_TOOL): available_tools["playwright"] = false

2. mcp__chrome-devtools__* 도구가 호출 가능한지 시도
   → 성공: available_tools["chrome_devtools"] = true
   → 실패 (E_TOOL): available_tools["chrome_devtools"] = false

3. agent-browser 스킬 존재 여부 Glob으로 확인
   → 발견: available_tools["agent_browser"] = true
   → 미발견: available_tools["agent_browser"] = false

# 결과 캐싱 — workflow_state에 저장
workflow_state.browser_tools = available_tools
workflow_state.primary_browser_tool = <첫 번째 true 도구>
```

### Pattern 3: Reproduction Step 파싱 및 실행

**What:** 티켓 텍스트에서 재현 단계를 파싱하고 도구별로 매핑
**When to use:** browser-reproducer 에이전트의 EXECUTE 단계

```
# Step 타입 → 도구 액션 매핑 (browser-automation.md에 정의됨)
navigate  → mcp__playwright__navigate(url)
click     → mcp__playwright__click(selector)
type      → mcp__playwright__fill(selector, text)
scroll    → mcp__playwright__evaluate("window.scrollBy(0, 500)")
hover     → mcp__playwright__hover(selector)
wait      → mcp__playwright__wait_for_timeout(ms)
screenshot→ mcp__playwright__screenshot(options)
assert_*  → mcp__playwright__evaluate(assertion_script)
```

### Pattern 4: 폴백 로그 표준 형식

**What:** 도구 실패 시 표준화된 로그 출력
**When to use:** E_TOOL 에러 발생 시

```
[WARN ] [BROWSER] +<time> — Degraded mode: Playwright MCP unavailable
  Original: Browser screenshot comparison
  Fallback: Trying Chrome DevTools Protocol

[WARN ] [BROWSER] +<time> — Degraded mode: Chrome DevTools unavailable
  Original: Chrome DevTools visual check
  Fallback: Trying agent-browser skill

[WARN ] [BROWSER] +<time> — Degraded mode: No browser tools available
  Original: Browser-based reproduction
  Fallback: Code-level analysis only
```

### Pattern 5: Before/After 스크린샷 데이터 플로우

**What:** 스크린샷을 Evidence Report → Verification Report로 전달
**When to use:** UI 티켓의 전체 생명주기

```
Phase 1 EVIDENCE:
  browser-reproducer 실행
  → screenshot_before_full = mcp__playwright__screenshot({fullPage: true})
  → screenshot_before_element = mcp__playwright__screenshot({selector: affected_element})
  → evidence_report.screenshot_path = "/tmp/wf_{ticket_id}/before_full.png"

Phase 6 VERIFY:
  동일 도구, 동일 URL, 동일 reproduction steps 재실행
  → screenshot_after_full = mcp__playwright__screenshot({fullPage: true})
  → screenshot_after_element = mcp__playwright__screenshot({selector: affected_element})
  → visual_comparison = compare(before, after)
  → 출력: {status, before_screenshot, after_screenshot, differences}
```

### Anti-Patterns to Avoid

- **도구 감지를 매 스텝마다 반복하지 않는다:** 워크플로우 시작 시 1회 캐싱이 원칙
- **스크린샷 경로를 하드코딩하지 않는다:** ticket_id 기반 동적 경로 생성
- **크로스체크를 필수로 만들지 않는다:** 도구 1개만 가용하면 단독 실행이 정상 경로
- **Visual 검증 실패가 워크플로우를 중단시키지 않는다:** E_VERIFY는 재시도 트리거이지 즉각 FAILED가 아님

---

## Don't Hand-Roll

| 문제 | 직접 만들지 말 것 | 사용할 것 | 이유 |
|------|-------------------|-----------|------|
| 브라우저 폴백 로직 | 커스텀 폴백 체인 | `browser-automation.md`의 기존 정의 | 이미 완전히 설계됨 |
| Reproduction step 파싱 | 커스텀 파서 | `browser-automation.md` Step Types 테이블 | 11가지 타입 이미 정의 |
| URL 추출 | 정규식 커스텀 로직 | `browser-automation.md` URL Extraction 우선순위 | 4단계 우선순위 이미 정의 |
| Viewport 추론 | 커스텀 매핑 | `browser-automation.md` Viewport Inference 테이블 | 6가지 신호 이미 정의 |
| 에러 코드 체계 | 커스텀 에러 코드 | 기존 `E_BROWSER`, `E_TOOL`, `E_TIMEOUT`, `E_NOTFOUND` | Phase 1에서 확립됨 |
| 로그 포맷 | 커스텀 로그 형식 | `[LEVEL] [PHASE] +<time> -- <message>` 패턴 | Phase 1에서 확립됨 |
| Evidence/Verification JSON | 커스텀 출력 구조 | `browser-automation.md`의 Data Flow 스키마 | Into Evidence Report / Into Verification Report 이미 정의 |

**Key insight:** `browser-automation.md`는 이미 Phase 2 전체 설계를 담고 있다. 이 Phase의 실제 작업은 설계를 에이전트 파일과 참조 문서에 "활성화"하는 것이지, 새로운 로직을 발명하는 것이 아니다.

---

## Common Pitfalls

### Pitfall 1: 도구 감지 순서 혼동

**What goes wrong:** Playwright MCP 감지 실패를 "에러"로 처리하여 워크플로우 중단
**Why it happens:** 도구 미설치를 예외 상황으로 잘못 분류
**How to avoid:** 도구 감지 실패는 E_TOOL(정상 폴백 트리거)로 처리, E_UNKNOWN(치명적 에러)이 아님
**Warning signs:** 로그에 `[ERROR]` 대신 `[WARN]` 이 찍혀야 함

### Pitfall 2: Before 스크린샷을 Phase 6까지 전달하지 못함

**What goes wrong:** Phase 1에서 캡처한 Before 스크린샷 경로가 Phase 6 Verify에 전달되지 않음
**Why it happens:** phase-orchestrator의 데이터 플로우에 `screenshot_references` 필드를 포함하지 않음
**How to avoid:** `evidence_report`에 `screenshot_references` 배열 명시; `phase_outputs["EVIDENCE"]`를 VERIFY에 전달
**Warning signs:** verification.md의 `visual_comparison` 출력에 before_screenshot이 null

### Pitfall 3: 크로스체크를 직렬로 실행

**What goes wrong:** 병렬 크로스체크를 순차 실행하여 시간 낭비
**Why it happens:** Agent 병렬 디스패치를 잊고 순차 구현
**How to avoid:** 가용 도구 2개 이상 시 반드시 `Agent` 도구로 병렬 디스패치
**Warning signs:** 실행 로그에 도구 A 완료 후 도구 B 시작이 보임

### Pitfall 4: Shadow DOM 요소에서 click/fill 실패

**What goes wrong:** Playwright가 Shadow DOM 내부 요소를 찾지 못해 E_NOTFOUND
**Why it happens:** Shadow DOM은 표준 CSS selector로 접근 불가
**How to avoid:** 실패 시 `evaluate`로 직접 접근 시도:
```javascript
document.querySelector('host-element').shadowRoot.querySelector('inner-element')
```
**Warning signs:** `E_NOTFOUND` 직후 evaluate 폴백 없이 다음 도구로 넘어감

### Pitfall 5: 스크린샷 비교에서 false negative

**What goes wrong:** 애니메이션/타이밍 차이로 인해 버그가 수정됐음에도 mismatch 판정
**Why it happens:** maxDiffPixels 임계값이 너무 낮거나, 스크린샷 타이밍 미세 차이
**How to avoid:** `wait_for_load_state("networkidle")` 후 캡처; maxDiffPixels 기본값을 너무 엄격하게 설정하지 않음 (권장: 100-500px)
**Warning signs:** Visual 검증만 실패하고 테스트는 모두 통과하는 패턴

---

## Code Examples

### browser-reproducer 에이전트 완성 골격

```markdown
# Source: plugins/wf/agents/browser-reproducer.md (완성 형태)
---
name: browser-reproducer
description: >
  Reproduces UI issues using browser automation.
  Detects available tools (Playwright MCP → Chrome DevTools → agent-browser),
  executes reproduction steps, captures Before screenshots and DOM state.
tools: Bash, Read, Glob, Grep, WebFetch
model: inherit
color: blue
---

# Browser Reproducer Agent

## INIT: 도구 감지

1. Playwright MCP 감지 시도 (mcp__playwright__ 네임스페이스)
2. Chrome DevTools MCP 감지 시도 (mcp__chrome-devtools__ 네임스페이스)
3. agent-browser 스킬 Glob 검색
4. 감지 결과 캐싱 → primary_tool 결정

## EXTRACT: 티켓에서 정보 추출

URL 추출 (browser-automation.md 우선순위)
Viewport 추론 (browser-automation.md 신호 테이블)
Reproduction steps 파싱 (Step Types 테이블 기반)

## EXECUTE: 재현 단계 실행

primary_tool로 각 step 실행
실패 시 E_TOOL → 폴백 로그 출력 → 다음 도구로 전환

## CAPTURE: Before 스크린샷

전체 페이지 스크린샷 → /tmp/wf_{ticket_id}/before_full.png
영향받는 요소 스크린샷 → /tmp/wf_{ticket_id}/before_element.png

## OUTPUT: 구조화된 결과

reproduction_status: success|partial|failed
method: browser:playwright_mcp|browser:chrome_devtools|browser:agent_browser|code-analysis
screenshots: [before_full_path, before_element_path]
dom_evidence: <DOM 상태>
console_errors: [<콘솔 에러 목록>]
```

### Evidence Report 스크린샷 필드 통합

```json
// Source: browser-automation.md Data Flow — Into Evidence Report
{
  "status": "success",
  "method": "browser:playwright_mcp",
  "details": "Executed 5/5 steps. URL: http://localhost:3000/page",
  "error_output": "",
  "screenshot_path": "/tmp/wf_ABC123/before_full.png",
  "screenshot_element_path": "/tmp/wf_ABC123/before_element.png"
}
```

### Verification Report 비교 결과 필드

```json
// Source: browser-automation.md Data Flow — Into Verification Report
{
  "visual_comparison": {
    "status": "match",
    "before_screenshot": "/tmp/wf_ABC123/before_full.png",
    "after_screenshot": "/tmp/wf_ABC123/after_full.png",
    "differences": [],
    "diff_pixels": 0,
    "max_diff_pixels": 200,
    "assertions_passed": 3,
    "assertions_failed": 0
  }
}
```

### 병렬 크로스체크 Agent 디스패치 패턴

```
# 가용 도구가 2개 이상일 때 병렬 실행
if len(available_tools) >= 2:
    Agent A (browser-reproducer):
      Task: "Reproduce using Playwright MCP: {reproduction_steps}"
      Tool: Playwright MCP
      Timeout: 19 minutes 59 seconds

    Agent B (browser-reproducer):
      Task: "Reproduce using Chrome DevTools: {reproduction_steps}"
      Tool: Chrome DevTools MCP
      Timeout: 19 minutes 59 seconds

    # 결과 집계
    if A.result == B.result:
        confidence = "HIGH"
    else:
        # 불일치 — 두 결과 모두 evidence에 포함
        log "[WARN] [BROWSER] — Cross-check mismatch: tools disagree"
        confidence = "MEDIUM"
        include both results in evidence
```

---

## State of the Art

| 이전 상태 | Phase 2 이후 상태 | 변경 내용 |
|-----------|-------------------|-----------|
| browser-reproducer.md: 스텁 (NO_BROWSER 상태만 반환) | 완전 구현 (4개 도구 지원) | Playwright/CDP/agent-browser 통합 |
| evidence-collection.md: "Phase 2 Note" 주석만 | 실제 브라우저 재현 절차 활성화 | browser-reproducer 디스패치 완전 구현 |
| verification.md: "Phase 2에서 구현 예정" 주석 | Before/After 비교 검증 활성화 | visual_comparison 출력 완전 구현 |
| UI 경로: 분기 있으나 미활성화 | UI 티켓 전체 경로 작동 | UIBR-01~04 모두 구현 완료 |

---

## Open Questions

1. **Playwright MCP Shadow DOM 처리 실제 동작**
   - What we know: Playwright는 Shadow DOM을 기본 지원하나, piercing selector 방식은 버전별로 다름
   - What's unclear: Claude Code 환경의 Playwright MCP가 `>>` (shadow piercing) 선택자를 지원하는지
   - Recommendation: evaluate 폴백을 항상 구현하여 Shadow DOM 실패 시 JavaScript로 직접 접근

2. **maxDiffPixels 기본 임계값**
   - What we know: 매우 낮으면 false negative (버그 수정됐는데 mismatch), 높으면 false positive (버그 남았는데 match)
   - What's unclear: 대상 프로젝트의 UI 특성에 따라 다름
   - Recommendation: 100px (element 스크린샷), 500px (full page 스크린샷) — Phase 3 이후 튜닝 가능

3. **agent-browser 스킬의 스크린샷 캡처 능력**
   - What we know: 자연어 기반이라 캡처 능력이 제한적일 수 있다고 CONTEXT.md에 명시
   - What's unclear: agent-browser가 실제로 screenshot 파일을 어떤 경로에 저장하는지
   - Recommendation: agent-browser 사용 시 스크린샷 경로를 명시적으로 지시문에 포함

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | 없음 — 이 플러그인은 마크다운 기반 AI 에이전트 정의 파일 |
| Config file | N/A |
| Quick run command | `ls plugins/wf/agents/ && grep -l "browser" plugins/wf/agents/*.md` |
| Full suite command | `cat plugins/wf/agents/browser-reproducer.md && cat plugins/wf/skills/ticket-workflow/references/browser-automation.md` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UIBR-01 | browser-reproducer.md가 Playwright MCP로 재현 단계를 실행하고 Before 스크린샷을 캡처 | manual-only | `cat plugins/wf/agents/browser-reproducer.md \| grep -c "playwright"` | ❌ Wave 0 |
| UIBR-02 | verification.md의 UI 경로에서 After 스크린샷 캡처 후 Before와 비교 결과 출력 | manual-only | `cat plugins/wf/skills/ticket-workflow/references/phases/verification.md \| grep -c "after_screenshot"` | ❌ Wave 0 |
| UIBR-03 | 가용 도구 2개 이상 시 병렬 Agent 디스패치로 크로스체크 | manual-only | `cat plugins/wf/agents/browser-reproducer.md \| grep -c "parallel\|cross-check"` | ❌ Wave 0 |
| UIBR-04 | 폴백 체인 각 단계의 [WARN][BROWSER] 로그 출력 | manual-only | `cat plugins/wf/agents/browser-reproducer.md \| grep -c "E_TOOL\|fallback\|Degraded"` | ❌ Wave 0 |

> **Note:** 이 플러그인은 마크다운 기반 AI 에이전트 정의 파일이므로, 자동화 단위 테스트는 파일 내용 검증(grep 기반 smoke check)으로 대체한다. 실제 기능 검증은 수동 실행으로만 가능하다.

### Sampling Rate

- **Per task commit:** `ls plugins/wf/agents/browser-reproducer.md && wc -l plugins/wf/agents/browser-reproducer.md`
- **Per wave merge:** 모든 관련 파일 내용 리뷰 + grep 기반 smoke check
- **Phase gate:** UIBR-01~04 수동 검증 완료 후 `/gsd:verify-work`

### Wave 0 Gaps

- [ ] 없음 — 이 Phase는 마크다운 파일 편집이므로 테스트 인프라 설치가 불필요

---

## Sources

### Primary (HIGH confidence)
- `plugins/wf/skills/ticket-workflow/references/browser-automation.md` — 폴백 체인, URL 추출, Viewport 추론, Step Types, 에러 코드, 데이터 플로우 전체
- `plugins/wf/agents/browser-reproducer.md` — 현재 스텁 구조 확인
- `.planning/phases/02-ui/02-CONTEXT.md` — 확정된 구현 결정사항 전체
- `plugins/wf/skills/ticket-workflow/references/phases/evidence-collection.md` — Phase 1 통합 포인트
- `plugins/wf/skills/ticket-workflow/references/phases/verification.md` — Phase 6 통합 포인트
- `plugins/wf/skills/ticket-workflow/references/phase-orchestrator.md` — Rule 6 Type-Dependent Branching

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — Phase 1 완료 상태, Phase 2 블로커(Shadow DOM 검증 필요)
- `plugins/wf/commands/ticket-workflow.md` — 에이전트 레지스트리, 6단계 파이프라인 구조

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — CONTEXT.md에 도구 이름/네임스페이스까지 확정
- Architecture: HIGH — 기존 파일에서 직접 추출, 새로운 설계 없음
- Pitfalls: MEDIUM — 실제 MCP 환경 실행 검증 없이 설계 분석 기반
- Validation: HIGH — 마크다운 파일이므로 grep smoke check으로 충분

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (안정적 — MCP 도구 네임스페이스 변경 없는 한 유효)
