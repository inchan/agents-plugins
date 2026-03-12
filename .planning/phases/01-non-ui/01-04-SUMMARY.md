---
phase: 01-non-ui
plan: "04"
slug: classification-system
subsystem: ticket-workflow/classification
tags: [classification, sub_type, non-ui, branching, display-mapping]

dependency_graph:
  requires: [01-02, 01-03]
  provides: [sub_type-classification, display-type-mapping, sub_type-branching]
  affects: [phase-orchestrator, SKILL.md, all downstream phases]

tech_stack:
  added: []
  patterns:
    - "2-tier classification: ticket_type + sub_type 독립 분류"
    - "priority-ordered sub_type rules: refactoring > performance > logic > feature"
    - "Display Type Mapping: 분류 결과를 한글/영문 레이블로 변환"

key_files:
  created: []
  modified:
    - plugins/wf/skills/ticket-workflow/references/classification.md
    - plugins/wf/skills/ticket-workflow/SKILL.md
    - plugins/wf/skills/ticket-workflow/references/phase-orchestrator.md

decisions:
  - "sub_type 우선순위 규칙: refactoring > performance > logic > feature — 리팩토링 키워드 최우선 체크로 의도 명확화"
  - "--type 오버라이드 확장: logic/feature/refactoring/performance 직접 지정 지원"
  - "sub_type confidence는 ticket_type confidence와 독립 — Non-UI 확정 후 2차 분류"
  - "Display Type Mapping 테이블로 분류 결과를 사용자 친화적 한글/영문 레이블로 변환"

metrics:
  duration: "131s"
  completed_date: "2026-03-12"
  tasks_completed: 2
  files_modified: 3
---

# Phase 1 Plan 04: Classification System Summary

**One-liner:** 7차원 UI/Non-UI 분류에 sub_type(logic/feature/refactoring/performance) 2차 분류 레이어와 Display Type Mapping을 추가하여 성공 기준 2항 완전 충족

---

## What Was Built

classification.md에 Non-UI 하위 유형 분류 시스템을 추가하고, SKILL.md와 phase-orchestrator.md에 sub_type 기반 분기 규칙을 반영했다.

### classification.md 변경사항

1. **--type 오버라이드 확장** (Signal Dimension 1): `ui | non-ui` 외에 `logic | feature | refactoring | performance` 직접 지정 지원 (confidence 1.0)

2. **Classification Output Structure에 sub_type 추가**:
   ```json
   {
     "ticket_type": "non-ui",
     "sub_type": "logic",
     "confidence": 0.88,
     ...
   }
   ```
   - UI 티켓: `sub_type = null`
   - Non-UI 티켓: `sub_type = logic | feature | refactoring | performance`

3. **Non-UI Sub-Type Classification 섹션 신규 추가**:
   - 우선순위 규칙: `refactoring > performance > logic > feature`
   - refactoring: refactor/cleanup/tech debt 등 키워드 기반
   - performance: slow/latency/cache/optimize 등 키워드 기반
   - logic: backend + data_logic 신호 우세 시
   - feature: infrastructure + cli_system 신호 우세 또는 기본값

4. **Display Type Mapping 섹션 신규 추가**:
   | ticket_type | sub_type | 한글 | 영문 |
   |---|---|---|---|
   | ui | null | UI | UI |
   | non-ui | logic | 로직 | Logic |
   | non-ui | feature | 기능 | Feature |
   | non-ui | refactoring | 리팩토링 | Refactoring |
   | non-ui | performance | 성능 | Performance |

5. **Classification Impact 테이블 확장**: sub_type별 Phase 3/5/6 행동 가이드라인 완성

### SKILL.md 변경사항

- Phase 2 섹션: sub_type 언급 추가, 분류 결과 표현 업데이트 ("UI/로직/기능/리팩토링/성능")
- Control Flow Rule 4: `ticket_type + sub_type` 둘 다 이후 페이즈에 영향 명시
- Usage 예시: logic/feature/refactoring/performance --type 플래그 예시 4개 추가
- 줄 수: 247줄 (500줄 이하 유지)

### phase-orchestrator.md 변경사항

- Phase 2 출력 계약에 `sub_type` 필드 추가
- Rule 6 Type-Dependent Branching 테이블 전면 재작성: sub_type 기반 5행 매트릭스
- workflow_state에 `sub_type: null` 초기화 추가
- CLASSIFY 단계 post-processing에 sub_type 저장 추가
- Non-UI Phase 3 에이전트 dispatch에 sub_type별 지시문 추가
- Workflow Invariant #3에 sub_type 조항 추가

---

## Commits

| Task | Commit | Message |
|------|--------|---------|
| Task 1 | `6af02ae` | feat(01-04): extend classification.md with sub_type and Display Type Mapping |
| Task 2 | `18d8735` | feat(01-04): add sub_type branching to SKILL.md and phase-orchestrator.md |

---

## Verification Results

| Check | Result |
|-------|--------|
| sub_type count in classification.md >= 5 | 12 occurrences |
| logic/feature/refactoring/performance all present | PASS |
| Display Type Mapping section exists | PASS |
| sub_type in phase-orchestrator.md | PASS |
| SKILL.md <= 500 lines | 247 lines |
| confidence in classification.md | PASS |

---

## Deviations from Plan

None - plan executed exactly as written.

---

## Self-Check: PASSED

- `plugins/wf/skills/ticket-workflow/references/classification.md` — exists, contains sub_type + Display Type Mapping
- `plugins/wf/skills/ticket-workflow/SKILL.md` — exists, 247 lines, contains sub_type mention
- `plugins/wf/skills/ticket-workflow/references/phase-orchestrator.md` — exists, contains sub_type branching
- Commits `6af02ae` and `18d8735` — verified in git log
