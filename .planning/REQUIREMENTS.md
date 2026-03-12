# Requirements: Ticket Workflow Skill

**Defined:** 2026-03-12
**Core Value:** 티켓 하나를 입력하면 증거 기반으로 자동 분류하고, 코드를 수정하고, 검증까지 완료하는 end-to-end 자동화 워크플로우

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### 워크플로우 코어 (CORE)

- [ ] **CORE-01**: 사용자가 텍스트로 입력한 티켓을 파싱하여 버그 설명을 추출한다
- [ ] **CORE-02**: 코드베이스에서 관련 파일/함수를 증거로 수집한다 (Glob/Grep/Read)
- [ ] **CORE-03**: 수집된 증거를 기반으로 근본 원인을 탐색한다 (병렬 에이전트)
- [ ] **CORE-04**: 근본 원인 분석을 바탕으로 수정 계획을 수립한다
- [ ] **CORE-05**: 수정 계획에 따라 코드를 자동으로 수정한다
- [ ] **CORE-06**: 테스트 실행으로 수정이 동작하는지 검증한다
- [ ] **CORE-07**: 검증 실패 시 최대 3회 재시도하며, 매회 원인 분석 후 전략을 변경한다 (full → targeted → relaxed)
- [ ] **CORE-08**: 워크플로우 단계가 순차적으로 실행된다 (증거수집 → 탐색/계획/구현 → 검증)

### 분류 (CLSF)

- [ ] **CLSF-01**: 티켓 내용을 분석하여 UI/로직/기능/리팩토링/성능 유형으로 자동 분류한다
- [ ] **CLSF-02**: 분류 신뢰도 점수를 산출한다 (0.0~1.0)
- [ ] **CLSF-03**: 분류 결과에 따라 이후 워크플로우 경로가 분기된다 (UI vs Non-UI)

### UI 브라우저 자동화 (UIBR)

- [ ] **UIBR-01**: UI 이슈는 브라우저 자동화 도구로 재현하고 Before 스크린샷을 캡처한다
- [ ] **UIBR-02**: 수정 후 After 스크린샷을 캡처하여 Before와 비교 검증한다
- [ ] **UIBR-03**: 브라우저 도구를 병렬로 크로스체크한다 (가용한 도구 모두 활용)
- [ ] **UIBR-04**: 브라우저 도구 폴백 체인을 지원한다 (Playwright → Chrome DevTools → agent-browser)

### 점수 및 리포트 (SCOR)

- [ ] **SCOR-01**: 단계별 품질 점수를 프로그레스 바로 시각 출력한다 (0~100)
- [ ] **SCOR-02**: 종합 점수를 산출한다 (가중 평균: 증거 25%, 분류 15%, 구현 30%, 검증 20%, 구조 10%)
- [ ] **SCOR-03**: 결과 리포트를 콘솔에 출력한다
- [ ] **SCOR-04**: 결과 리포트를 마크다운 파일로 저장한다

### 플러그인 구조 (PLUG)

- [ ] **PLUG-01**: plugins/wf/ 디렉토리에 표준 플러그인 구조로 배치한다 (.claude-plugin/plugin.json + skills/ + agents/)
- [ ] **PLUG-02**: SKILL.md는 500줄 이하로 유지하고 상세 로직은 references/로 위임한다
- [ ] **PLUG-03**: 기존 v0.2/v0.3 구현을 통합하여 단일 버전으로 정리한다

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### 외부 연동

- **EXTL-01**: Jira/Linear API를 통한 티켓 자동 가져오기
- **EXTL-02**: 수정 완료 후 자동 PR 생성

### 고급 기능

- **ADVN-01**: 다중 티켓 배치 처리
- **ADVN-02**: 티켓 우선순위/스프린트 관리
- **ADVN-03**: CI/CD 파이프라인 통합

## Out of Scope

| Feature | Reason |
|---------|--------|
| 외부 티켓 시스템 연동 | v1 복잡도 폭발, OAuth/API 안정성 의존성 |
| 자동 PR 생성 | 사용자 확인 없이 remote push는 고위험 |
| 다중 티켓 배치 처리 | 컨텍스트 오염, 파일 충돌 리스크 |
| 의존성 자동 설치 | 보안 리스크 + 환경 파괴 가능성 |
| 인터랙티브 채팅형 UX | 완전 자동 실행이 설계 철학 |
| 커버리지 % 채우기 테스트 | 시나리오 커버리지 중심으로 검증 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLUG-01 | Phase 1 | Pending |
| PLUG-02 | Phase 1 | Pending |
| PLUG-03 | Phase 1 | Pending |
| CORE-01 | Phase 1 | Pending |
| CORE-02 | Phase 1 | Pending |
| CORE-03 | Phase 1 | Pending |
| CORE-04 | Phase 1 | Pending |
| CORE-05 | Phase 1 | Pending |
| CORE-06 | Phase 1 | Pending |
| CORE-07 | Phase 1 | Pending |
| CORE-08 | Phase 1 | Pending |
| CLSF-01 | Phase 1 | Pending |
| CLSF-02 | Phase 1 | Pending |
| CLSF-03 | Phase 1 | Pending |
| UIBR-01 | Phase 2 | Pending |
| UIBR-02 | Phase 2 | Pending |
| UIBR-03 | Phase 2 | Pending |
| UIBR-04 | Phase 2 | Pending |
| SCOR-01 | Phase 3 | Pending |
| SCOR-02 | Phase 3 | Pending |
| SCOR-03 | Phase 3 | Pending |
| SCOR-04 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-12*
*Last updated: 2026-03-12 — traceability updated after roadmap creation (PLUG → Phase 1)*
