# Phase 1: 플러그인 구조 통합 + Non-UI 핵심 워크플로우 - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

v0.2(`plugins/ticket-workflow/`)와 v0.3(`plugins/wf/`)를 `plugins/wf/` 단일 경로로 통합하고, Non-UI 버그 티켓이 `/ticket-workflow <텍스트>` 한 번으로 6단계(증거수집→분류→탐색→계획→구현→검증) 완전 자동 실행을 달성한다. UI 브라우저 자동화(Phase 2)와 점수 시각화(Phase 3)는 이 페이즈 범위 밖이다.

</domain>

<decisions>
## Implementation Decisions

### 통합 전략
- v0.3(`plugins/wf/`) SKILL.md를 base로 사용 — 더 상세한 분류 알고리즘 포함
- v0.2(`plugins/ticket-workflow/`)의 에이전트 정의(6개 .md), references/(phase-orchestrator, classification, scoring, phases/), commands/ticket.md를 wf/로 이전
- 통합 완료 후 `plugins/ticket-workflow/` 구 경로는 제거
- SKILL.md 500줄 이하 유지, 상세 로직은 모두 `references/`로 위임

### Python lib 처리
- Python 코드(classifier.py, workflow_state.py 등)는 **포함하지 않음** — SKILL.md는 순수 마크다운 명세이며, Claude Code가 런타임에 Bash/도구를 직접 실행
- 분류 로직, 상태 관리, 증거 수집은 references/ 마크다운으로 에이전트에게 지시
- Python 테스트 파일들의 검증 시나리오는 references/에 테스트 기대치로 반영

### 에이전트 구조
- 6개 에이전트 유지: evidence-searcher, bug-tracer, planner, implementer, verifier, browser-reproducer(Phase 2용 스텁)
- evidence-searcher x2 병렬, bug-tracer x2-3 병렬은 SKILL.md에서 명시적 지시
- 서브에이전트 중첩 불가 제약 → SKILL.md 레벨에서 병렬화 조율

### 재시도 전략 상세
- Attempt 1 (full): 원래 계획 그대로 전체 구현 + 검증
- Attempt 2 (targeted): 실패 원인 분석 후 해당 부분만 수정. 이전 구현의 정상 부분은 유지
- Attempt 3 (relaxed): 접근 방식 자체를 변경. 다른 파일/함수를 수정하거나 우회 전략 적용
- 각 재시도 시작 시 이전 실패 원인을 명시적으로 로그

### 분류 시스템
- 7가지 신호 기반 분류: 키워드, 파일 경로, 에러 유형, 스택트레이스, 재현 단계, 첨부파일, 컴포넌트 언급
- 신뢰도 점수 0.0~1.0 산출
- `--type` 플래그로 수동 오버라이드 가능 (신뢰도 1.0)
- 분류 결과가 Phase 3 이후 모든 경로에 영향

### Claude's Discretion
- 구체적인 에이전트 프롬프트 내용과 도구 허용 목록
- references/ 파일 분리 세분화 수준
- 상태 머신 전환 시 정확한 출력 포맷
- 에러 코드 체계 설계 (E_TOOL, E_VERIFY 등)
- Graceful degradation 규칙 상세

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `plugins/ticket-workflow/skills/ticket-workflow/SKILL.md` (v0.2): 완성된 6단계 워크플로우 정의, 500줄 이하
- `plugins/wf/skills/ticket-workflow/SKILL.md` (v0.3): 더 상세한 분류 알고리즘, 개선된 설명문
- `plugins/ticket-workflow/agents/` (6개): evidence-searcher, bug-tracer, planner, implementer, verifier, browser-reproducer
- `plugins/ticket-workflow/skills/ticket-workflow/references/`: phase-orchestrator.md, classification.md, scoring.md, workflow-logger.md, browser-automation.md, phases/ (4개)
- `plugins/ticket-workflow/commands/ticket.md`: 슬래시 커맨드 진입점

### Established Patterns
- YAML frontmatter에 name, description, version 정의
- references/ 디렉토리로 상세 로직 위임 (SKILL.md를 경량 유지)
- 에이전트는 독립 .md 파일로 agents/ 디렉토리에 배치
- 상태 머신: INIT → EVIDENCE → CLASSIFY → EXPLORE → PLAN → IMPLEMENT → VERIFY → DONE

### Integration Points
- `.claude-plugin/plugin.json` — 플러그인 등록
- `skills/ticket-workflow/SKILL.md` — 스킬 진입점
- `commands/ticket.md` — 슬래시 커맨드 바인딩
- 기존 `agent-delegation` 플러그인과 동일한 디렉토리 패턴

</code_context>

<specifics>
## Specific Ideas

- v0.2의 상태 머신 다이어그램과 retry 루프 설계가 잘 되어 있으므로 그대로 가져감
- v0.3의 분류 알고리즘 상세화(7가지 신호)가 더 나으므로 분류 부분은 v0.3 기반
- 완전 자동 실행이 핵심 — 중간에 사용자 질문 없이 end-to-end로 동작

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-non-ui*
*Context gathered: 2026-03-12*
