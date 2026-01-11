# Roadmap: Multi-Agent Router Plugin

## Overview

Claude Code 서브에이전트에서 외부 AI CLI를 실행하는 가능성을 검증하고, 성공 시 자연어 기반 라우팅 시스템으로 확장하는 탐색적 실험 프로젝트. CLI 실행 검증 → 결과 수집 → 라우팅 로직 → 플러그인 통합 순서로 진행.

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: CLI 실행 검증** - 서브에이전트에서 외부 AI CLI 실행 가능 여부 검증
- [x] **Phase 2: 결과 수집 검증** - CLI 실행 결과를 서브에이전트가 수집하는 구조 검증
- [ ] **Phase 3: 라우팅 로직** - 자연어에서 적절한 AI를 선택하는 로직 구현
- [ ] **Phase 4: 플러그인 통합** - Skill + Sub-agent + Command 구조로 통합

## Phase Details

### Phase 1: CLI 실행 검증
**Goal**: 서브에이전트가 Bash를 통해 외부 AI CLI(`codex exec`, `claude -p` 등)를 실행할 수 있는지 검증
**Depends on**: Nothing (first phase)
**Research**: Likely (서브에이전트 CLI 실행 패턴, 기술적 제약 확인 필요)
**Research topics**: Claude Code 서브에이전트 Bash 실행 권한, 외부 CLI 호출 방법, TypeScript 래퍼 구조
**Plans**: TBD

Plans:
- [x] 01-01: 최소 PoC - 단일 CLI 실행 테스트

### Phase 2: 결과 수집 검증
**Goal**: CLI 실행 결과를 서브에이전트가 받아와 처리할 수 있는지 검증
**Depends on**: Phase 1
**Research**: Unlikely (Phase 1에서 검증된 패턴 확장)
**Plans**: TBD

Plans:
- [x] 02-01: stdout/stderr 캡처 및 파싱

### Phase 3: 라우팅 로직
**Goal**: 자연어 요청을 분석하여 적절한 AI를 선택하는 로직 구현
**Depends on**: Phase 2
**Research**: Unlikely (내부 로직, 기존 패턴 활용)
**Plans**: TBD

Plans:
- [x] 03-01: AI 선택 로직 구현
- [ ] 03-02: 라우팅 규칙 설정 (deferred - 기본 규칙으로 충분)

### Phase 4: 플러그인 통합
**Goal**: Skill + Sub-agent + Command + Hook 구조로 완성된 플러그인 통합
**Depends on**: Phase 3
**Research**: Likely (플러그인 구조 이해 필요)
**Research topics**: Claude Code Skill/Command/Hook 구조, SKILL.md 작성 패턴, 서브에이전트 등록 방법
**Plans**: TBD

Plans:
- [ ] 04-01: 플러그인 구조 설계 및 통합

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. CLI 실행 검증 | 1/1 | Complete | 2026-01-12 |
| 2. 결과 수집 검증 | 1/1 | Complete | 2026-01-12 |
| 3. 라우팅 로직 | 1/1 | Complete | 2026-01-12 |
| 4. 플러그인 통합 | 0/1 | Not started | - |
