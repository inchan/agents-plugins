# Phase 2: UI 브라우저 자동화 - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

UI 유형으로 분류된 버그 티켓에서 브라우저 자동화 도구(Playwright MCP, Chrome DevTools MCP, agent-browser)로 버그를 재현하고, Before/After 스크린샷으로 시각적 검증을 완료한다. Phase 1에서 구축한 6단계 워크플로우의 UI 경로를 활성화하는 것이 목적이며, Non-UI 워크플로우나 점수 시스템(Phase 3)은 범위 밖이다.

</domain>

<decisions>
## Implementation Decisions

### 브라우저 도구 폴백 체인
- 우선순위: Playwright MCP → Chrome DevTools MCP → agent-browser skill → 코드 수준 분석
- 각 도구 감지는 워크플로우 시작 시 1회 수행하고 결과를 캐싱
- 도구 실패 시 자동으로 다음 단계로 폴백하며, 폴백 로그를 `[WARN] [BROWSER]` 형태로 출력
- 모든 도구가 실패하면 코드 수준 분석(Phase 1에서 구현 완료)으로 최종 폴백 — 워크플로우가 중단되지 않음

### Playwright MCP 통합
- `mcp__playwright__*` 도구 사용 — navigate, screenshot, click, fill, evaluate 등
- Shadow DOM 요소는 Playwright가 기본 지원하나, 실패 시 evaluate로 직접 접근 시도
- 스크린샷은 전체 페이지 + 영향받는 요소 2장 캡처 (Before/After 각각)
- maxDiffPixels 기반 시각적 비교 — 기본 임계값은 Claude 재량

### Chrome DevTools MCP 통합
- `mcp__chrome-devtools__*` 도구 사용 — navigate_page, take_screenshot, click, evaluate_script 등
- Playwright MCP가 없거나 실패할 때 활성화
- 동일한 reproduction step 포맷을 사용하여 도구 간 전환이 투명하게 동작

### agent-browser 스킬 통합
- 자연어 지시 기반 브라우저 조작
- Playwright/Chrome DevTools 모두 실패 시 사용
- 스크린샷 캡처 및 시각적 검증은 제한적일 수 있으나 재현 확인은 가능

### 병렬 크로스체크 전략
- 가용한 브라우저 도구가 2개 이상이면 병렬로 실행하여 크로스체크
- 두 도구의 재현 결과가 일치하면 신뢰도 높음으로 판정
- 불일치 시 두 결과를 모두 evidence에 포함하고 차이점을 로그
- 크로스체크는 선택적 최적화 — 도구가 1개만 가용하면 단독 실행

### Before/After 스크린샷 비교
- Before: 수정 전 재현 시 캡처 (Phase 1 EVIDENCE 단계)
- After: 수정 후 동일 조건으로 재캡처 (Phase 6 VERIFY 단계)
- 비교 결과: 시각적 차이 유무, 수정 확인 여부를 구조화된 JSON으로 출력
- 스크린샷 파일은 임시 경로에 저장 — 워크플로우 완료 후 결과 리포트에 경로 포함

### browser-reproducer 에이전트 완성
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

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `plugins/wf/agents/browser-reproducer.md`: Phase 2 스텁 — YAML frontmatter 완비, 폴백 동작 정의
- `plugins/wf/skills/ticket-workflow/references/browser-automation.md`: 폴백 체인, URL 추출, viewport 추론, reproduction step types, 에러 처리, 데이터 플로우 전체 정의 완비
- `plugins/wf/skills/ticket-workflow/references/classification.md`: UI vs Non-UI 분류 결과 구조 — ticket_type="ui" 시 Phase 2 경로 활성화
- `plugins/wf/skills/ticket-workflow/references/phase-orchestrator.md`: Rule 6 Type-Dependent Branching — UI 경로의 분기 규칙 정의

### Established Patterns
- MCP 도구 호출 패턴: `mcp__<서버명>__<도구명>` 형식
- 에이전트 정의: YAML frontmatter(name, description, tools, model, color) + 마크다운 본문
- references/ 위임 패턴: SKILL.md에서 상세 로직을 references/로 링크
- 로그 포맷: `[LEVEL] [PHASE] +<time> -- <message>`

### Integration Points
- `commands/ticket-workflow.md` Phase 1 EVIDENCE: 2x evidence-searcher 후 UI 분류 시 browser-reproducer 추가 디스패치
- `commands/ticket-workflow.md` Phase 6 VERIFY: UI 티켓이면 Before/After 비교 추가
- `references/phase-orchestrator.md`: CLASSIFY → EXPLORE 전환 시 UI 분기 경로
- `references/phases/evidence-collection.md`: 브라우저 재현 절차 통합 포인트
- `references/phases/verification.md`: UI 검증 절차 통합 포인트

</code_context>

<specifics>
## Specific Ideas

- browser-automation.md에 이미 reproduction step types(navigate, click, type, scroll, hover, wait, resize, screenshot, assert_visible, assert_text, assert_style)가 완전히 정의되어 있으므로 그대로 활용
- Phase 1에서 정의된 UI 재현 데이터 플로우(Into Evidence Report, Into Verification Report) JSON 구조를 유지
- 폴백 체인의 degradation 로그 패턴이 browser-automation.md에 이미 정의됨

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-ui*
*Context gathered: 2026-03-12*
