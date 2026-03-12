# Ticket Workflow Skill

## What This Is

Claude Code 플러그인용 자동화된 티켓 워크플로우 스킬(SKILL.md). 사용자가 버그 티켓을 입력하면 증거수집 → 탐색/계획/구현 → 검증의 3단계를 완전 자동으로 수행하고, 각 단계별 점수와 종합 점수를 시각적 프로그레스 바로 출력한다. UI 이슈는 브라우저 자동화 도구로 재현/검증을 병렬 크로스체크한다.

## Core Value

티켓 하나를 입력하면 증거 기반으로 자동 분류하고, 코드를 수정하고, 검증까지 완료하는 end-to-end 자동화 워크플로우.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 티켓 내용을 분석하여 UI/로직/기능/리팩토링/성능으로 자동 분류
- [ ] 모든 티켓 유형에 대해 코드베이스에서 증거 수집
- [ ] UI 이슈는 브라우저 자동화 도구로 재현 및 스크린샷 캡처
- [ ] 브라우저 도구 병렬 크로스체크 (playwright, chrome devtools, agent-browser)
- [ ] 탐색 → 계획 → 구현 단계 순차 실행 (완전 자동)
- [ ] 테스트 및 통합 테스트로 검증
- [ ] UI 이슈는 before/after 스크린샷 비교로 시각적 검증
- [ ] 검증 실패 시 최대 3회 재시도 (매회 원인 분석 후 전략 수정)
- [ ] 단계별 + 종합 점수를 프로그레스 바로 시각적 출력
- [ ] 결과를 콘솔 출력 + 마크다운 파일로 저장

### Out of Scope

- 외부 티켓 시스템 연동 (Jira/Linear API) — v1은 텍스트 입력만 지원
- 티켓 우선순위/할당 관리 — 단일 티켓 처리에 집중
- 자동 PR 생성 — 구현까지만, PR은 별도

## Context

- 프로젝트 위치: `plugins/wf/skills/ticket-workflow/SKILL.md`
- 호스트 저장소: `inchan-plugins` (Claude Code 플러그인 모음)
- 기존 플러그인 패턴: `plugins/<name>/skills/<skill>/SKILL.md`
- 기존 플러그인: `agent-delegation`, `ex`
- 사용 가능한 브라우저 도구: playwright MCP, chrome-devtools MCP, agent-browser 스킬
- 스킬 호출: `/ticket-workflow <티켓 텍스트>`

## Constraints

- **형식**: Claude Code SKILL.md 형태 (마크다운 기반 스킬 정의)
- **실행 환경**: cwd가 대상 프로젝트 (스킬 실행 시 현재 디렉토리가 버그를 고칠 프로젝트)
- **워크플로우 순서**: 증거수집 → 탐색/계획/구현 → 검증 (순차적)
- **재시도 전략**: 매 실패마다 원인 분석 후 전략 변경
- **점수 시스템**: 목표 완료 여부 + 검증 프로세스 품질 기반

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SKILL.md 형태로 구현 | Claude Code 플러그인 생태계 호환 | — Pending |
| plugins/wf/ 플러그인으로 분리 | 독립적인 관심사 분리 | — Pending |
| 완전 자동 실행 | 사용자 개입 최소화가 목표 | — Pending |
| 브라우저 도구 병렬 크로스체크 | 단일 도구 의존 리스크 감소 | — Pending |
| 프로그레스 바 시각화 | 직관적 결과 파악 | — Pending |

---
*Last updated: 2026-03-12 after initialization*
