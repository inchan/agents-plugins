# Roadmap: Ticket Workflow Skill

## Overview

v0.2/v0.3 두 버전의 구현체를 단일 플러그인으로 통합하고, Non-UI 완전 자동화 워크플로우를 완성한 뒤 UI 브라우저 자동화와 점수/리포트 시스템을 순차적으로 추가한다. 각 페이즈는 독립적으로 검증 가능한 완전한 기능을 전달한다.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: 플러그인 구조 통합 + Non-UI 핵심 워크플로우** - v0.2/v0.3 통합, 티켓 파싱부터 검증까지 Non-UI 완전 자동 실행
- [ ] **Phase 2: UI 브라우저 자동화** - UI 이슈 분류 경로에서 브라우저 도구로 재현/검증
- [ ] **Phase 3: 점수 시스템 + 리포트 완성** - 단계별 품질 점수 시각화 및 결과 파일 저장

## Phase Details

### Phase 1: 플러그인 구조 통합 + Non-UI 핵심 워크플로우
**Goal**: Non-UI 버그 티켓 하나를 `/ticket-workflow` 에 입력하면 증거 수집 → 분류 → 탐색/계획/구현 → 검증까지 완전 자동으로 실행된다
**Depends on**: Nothing (first phase)
**Requirements**: PLUG-01, PLUG-02, PLUG-03, CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, CORE-07, CORE-08, CLSF-01, CLSF-02, CLSF-03
**Success Criteria** (what must be TRUE):
  1. `/ticket-workflow <버그 텍스트>` 를 실행하면 사용자 개입 없이 6단계(증거수집→분류→탐색→계획→구현→검증)가 순차적으로 완료된다
  2. 분류 결과로 UI/로직/기능/리팩토링/성능 중 하나와 신뢰도 점수(0.0~1.0)가 출력된다
  3. 검증 실패 시 콘솔에 "Retry 2/3 — 전략: targeted" 형태로 재시도 전략 변경이 표시된다
  4. plugins/wf/ 하나의 경로에 표준 플러그인 구조(.claude-plugin/plugin.json + skills/ + agents/ + references/)가 존재하며 SKILL.md는 500줄 이하다
  5. plugins/ticket-workflow/ 구(舊) 경로가 제거되거나 wf/로 통합 완료 상태다
**Plans**: TBD

Plans:
- [ ] 01-01: v0.2/v0.3 구현체 통합 — plugins/wf/ 단일 구조로 병합
- [ ] 01-02: SKILL.md + references/ 분리 구조 완성 — 오케스트레이터/페이즈 상세/분류 알고리즘
- [ ] 01-03: Non-UI 완전 워크플로우 구현 — CORE-01~08 6단계 + 재시도 전략
- [ ] 01-04: 분류 시스템 구현 — CLSF-01~03 (7가지 신호, 신뢰도, UI/Non-UI 분기)

### Phase 2: UI 브라우저 자동화
**Goal**: UI 유형으로 분류된 버그 티켓에서 브라우저 도구로 재현하고 Before/After 스크린샷으로 시각적 검증이 완료된다
**Depends on**: Phase 1
**Requirements**: UIBR-01, UIBR-02, UIBR-03, UIBR-04
**Success Criteria** (what must be TRUE):
  1. UI 유형 티켓 실행 시 Playwright MCP가 자동으로 버그를 재현하고 Before 스크린샷이 캡처된다
  2. 수정 완료 후 After 스크린샷이 캡처되어 Before와 나란히 비교 결과가 출력된다
  3. Playwright MCP가 없는 환경에서도 Chrome DevTools → agent-browser 순으로 폴백되어 워크플로우가 중단되지 않는다
  4. 브라우저 도구 병렬 크로스체크 결과가 하나의 검증 결론으로 집계된다
**Plans**: TBD

Plans:
- [ ] 02-01: Playwright MCP 통합 — browser-reproducer 에이전트 + Before 스크린샷 캡처
- [ ] 02-02: After 스크린샷 + Before/After 비교 검증 — UIBR-02
- [ ] 02-03: 브라우저 병렬 크로스체크 + 폴백 체인 — UIBR-03, UIBR-04

### Phase 3: 점수 시스템 + 리포트 완성
**Goal**: 워크플로우 완료 후 단계별 품질 점수가 프로그레스 바로 시각화되고 결과 리포트가 파일로 저장된다
**Depends on**: Phase 1
**Requirements**: SCOR-01, SCOR-02, SCOR-03, SCOR-04
**Success Criteria** (what must be TRUE):
  1. 워크플로우 완료 시 콘솔에 각 단계(증거/분류/구현/검증/구조)별 점수가 프로그레스 바 형태로 출력된다
  2. 종합 점수가 가중 평균(증거 25% + 분류 15% + 구현 30% + 검증 20% + 구조 10%)으로 산출되어 표시된다
  3. 타임스탬프가 포함된 마크다운 결과 파일이 자동 저장되며 경로가 콘솔에 출력된다
**Plans**: TBD

Plans:
- [ ] 03-01: 단계별 점수 산출 + 프로그레스 바 시각화 — SCOR-01, SCOR-02
- [ ] 03-02: 결과 리포트 콘솔 출력 + 마크다운 파일 저장 — SCOR-03, SCOR-04

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. 플러그인 구조 통합 + Non-UI 핵심 워크플로우 | 0/4 | Not started | - |
| 2. UI 브라우저 자동화 | 0/3 | Not started | - |
| 3. 점수 시스템 + 리포트 완성 | 0/2 | Not started | - |
