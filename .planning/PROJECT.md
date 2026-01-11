# Multi-Agent Router Plugin

## What This Is

Claude Code에서 자연어로 요청하면 적절한 외부 AI(Codex, Claude, Qwen, Gemini 등)의 CLI를 자동으로 선택하고 실행하는 플러그인. 서브에이전트가 TypeScript를 통해 외부 AI CLI를 실행하고 결과를 반환하는 메타-에이전트 오케스트레이션 시스템.

## Core Value

**자연어 → 적절한 AI로 자동 라우팅**: 사용자가 "코덱스에게 리뷰 요청해줘"라고 말하면, 시스템이 자동으로 올바른 AI CLI를 선택하고 실행한다.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 서브에이전트에서 외부 AI CLI 실행 가능성 검증
- [ ] TypeScript 래퍼를 통한 CLI 실행 구조 설계
- [ ] 자연어 요청에서 AI 선택 로직 구현
- [ ] Skill + Sub-agent + Command + Hook 플러그인 구조 설계
- [ ] 결과 수집 및 반환 메커니즘

### Out of Scope

- API 직접 호출 — CLI 실행 방식으로 통일
- GUI/웹 인터페이스 — CLI 플러그인에 집중
- Windows 지원 — 초기엔 macOS/Linux만 (검증 후 확장 가능)

## Context

**탐색적 실험 프로젝트**: 이 플러그인이 기술적으로 가능한지 검증하는 것이 1차 목표. 가능성이 확인되면 기능을 확장.

**기존 환경**:
- Claude Code 플러그인 생태계 (skills, sub-agents, commands, hooks)
- 외부 AI CLI 도구들: `codex exec`, `claude -p`, 기타

**핵심 가설**:
1. Claude Code 서브에이전트가 Bash를 통해 외부 CLI를 실행할 수 있는가?
2. 실행 결과를 서브에이전트가 받아올 수 있는가?
3. 자연어에서 적절한 AI를 선택하는 로직이 동작하는가?

**검증 우선순위**:
1. CLI 실행 가능성 (첫 번째 검증 대상)
2. 결과 수집 가능성
3. 엔드투엔드 라우팅 흐름

## Constraints

- **통합 방식**: CLI 실행만 사용 (API 호출 없음)
- **실험적 성격**: 제약사항은 실험 결과에 따라 발견될 예정

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CLI 실행 방식 선택 | API보다 설정이 단순하고, 기존 CLI 도구 활용 가능 | — Pending |
| 멀티 AI 지원 | 특정 AI에 종속되지 않고 유연성 확보 | — Pending |

---
*Last updated: 2026-01-12 after initialization*
