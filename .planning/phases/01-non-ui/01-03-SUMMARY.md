---
phase: 01-non-ui
plan: 03
subsystem: workflow
tags: [ticket-workflow, slash-command, retry-strategy, state-machine, phase-orchestrator]

requires:
  - phase: 01-01
    provides: "plugins/wf/ 구조 — agents, skills, references 디렉토리 및 phase-orchestrator.md 기반"

provides:
  - "/ticket-workflow 슬래시 커맨드 진입점 (commands/ticket-workflow.md)"
  - "full→targeted→relaxed 3단계 재시도 전략 (phase-orchestrator.md 강화)"
  - "Non-UI 검증 절차 상세화 + 전략별 행동 분기 (verification.md 강화)"

affects:
  - 01-non-ui phase (02, 03이 동일 워크플로우 실행 시 진입점으로 사용)
  - 향후 UI 워크플로우 확장 시 동일 커맨드 파일에서 분기

tech-stack:
  added: []
  patterns:
    - "3단계 재시도 전략 패턴: full→targeted→relaxed (점진적 접근 완화)"
    - "한글+영어 혼용 로그 패턴: Retry N/3 -- 전략: <strategy>"
    - "Phase 1-4 불변 규칙: 재시도 시 Phase 5-6만 재실행"

key-files:
  created:
    - plugins/wf/commands/ticket-workflow.md
  modified:
    - plugins/wf/skills/ticket-workflow/references/phase-orchestrator.md
    - plugins/wf/skills/ticket-workflow/references/phases/verification.md

key-decisions:
  - "슬래시 커맨드 파일에서 오케스트레이터를 분리 — 커맨드는 진입점, 로직은 phase-orchestrator.md에 위임"
  - "full→targeted→relaxed 전략 순서 확정 — 점진적 범위 확대로 불필요한 변경 최소화"
  - "한글+영어 혼용 로그 패턴 채택 — 성공 기준 3항과 일치, 가독성 향상"

patterns-established:
  - "Retry log pattern: [INFO ] [VERIFY] +<time> -- Retry N/3 -- 전략: <strategy>"
  - "retry_context structure: { attempt, strategy, failure_reason, failed_test, previous_changes }"
  - "Phase immutability: Phases 1-4 outputs never modified during retries"

requirements-completed: [CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, CORE-07, CORE-08]

duration: 3min
completed: 2026-03-12
---

# Phase 01-non-ui Plan 03: Non-UI Workflow Summary

**`/ticket-workflow` 슬래시 커맨드 + full→targeted→relaxed 3단계 재시도 전략이 포함된 6단계 Non-UI 버그 워크플로우 완전 자동화 진입점 구현**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-12T05:50:28Z
- **Completed:** 2026-03-12T05:53:23Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `/ticket-workflow` 슬래시 커맨드 파일 생성 — 6단계 파이프라인, 에이전트 디스패치, 3단계 재시도 전략 완전 기술
- `phase-orchestrator.md` 강화 — full/targeted/relaxed 전략 분기 + `strategy` 필드 추가 + 한글 로그 패턴 명시
- `verification.md` 강화 — Non-UI 검증 절차 상세화 (assertion 분석, 로그 분석, 사이드이펙트 확인) + 전략별 행동 분기 테이블 추가

## Task Commits

각 태스크를 원자적으로 커밋:

1. **Task 1: commands/ticket-workflow.md 생성** - `14bfa49` (feat)
2. **Task 2: phase-orchestrator.md + verification.md 강화** - `8a2c566` (feat)

## Files Created/Modified

- `plugins/wf/commands/ticket-workflow.md` — `/ticket-workflow` 슬래시 커맨드 진입점. 6단계 파이프라인, 에이전트 디스패치, 3단계 재시도 전략 정의
- `plugins/wf/skills/ticket-workflow/references/phase-orchestrator.md` — 3단계 전략 분기(full/targeted/relaxed), retry_context에 strategy 필드 추가, 한글 로그 포맷 명시
- `plugins/wf/skills/ticket-workflow/references/phases/verification.md` — Non-UI 검증 상세화, 전략별 행동 분기, retry_context 입력 정의

## Decisions Made

- **커맨드-오케스트레이터 분리:** 커맨드 파일은 진입점과 흐름만 기술하고, 세부 상태 머신 로직은 phase-orchestrator.md에 위임 — 단일 책임 원칙 유지
- **점진적 전략 확대:** full→targeted→relaxed 순서는 "먼저 최소 변경, 그다음 범위 확대" 원칙을 구현 — 불필요한 코드 변경 최소화
- **한글+영어 혼용 로그 채택:** "Retry N/3 -- 전략: targeted" 패턴은 PLAN.md 성공 기준 3항과 완전 일치

## Deviations from Plan

없음 — 계획대로 정확히 실행됨.

## Issues Encountered

없음.

## User Setup Required

없음 — 외부 서비스 설정 불필요.

## Next Phase Readiness

- `/ticket-workflow` 커맨드 준비 완료 — 사용자가 `한 줄 커맨드`로 전체 워크플로우 실행 가능
- Non-UI 경로 완전 구현 — Phase 1~6 + 재시도 전략 모두 정의됨
- Phase 2 (UI 워크플로우) 착수 준비: browser-reproducer.md 통합 필요 (기존 Phase 2 블로커: Playwright MCP Shadow DOM 처리 검증 필요)

## Self-Check: PASSED

| Item | Status |
|------|--------|
| plugins/wf/commands/ticket-workflow.md | FOUND |
| phase-orchestrator.md | FOUND |
| verification.md | FOUND |
| 01-03-SUMMARY.md | FOUND |
| Commit 14bfa49 | FOUND |
| Commit 8a2c566 | FOUND |

---
*Phase: 01-non-ui*
*Completed: 2026-03-12*
