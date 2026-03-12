---
phase: 01-non-ui
plan: 01
slug: structure-merge
subsystem: plugin-structure
tags: [migration, cleanup, plugin, agents, references]
dependency_graph:
  requires: []
  provides: [wf-plugin-structure]
  affects: [plugins/wf]
tech_stack:
  added: []
  patterns: [claude-plugin-standard-structure]
key_files:
  created:
    - plugins/wf/.claude-plugin/plugin.json
    - plugins/wf/agents/evidence-searcher.md
    - plugins/wf/agents/evidence-collector.md
    - plugins/wf/agents/bug-tracer.md
    - plugins/wf/agents/planner.md
    - plugins/wf/agents/implementer.md
    - plugins/wf/agents/verifier.md
    - plugins/wf/agents/browser-reproducer.md
    - plugins/wf/skills/ticket-workflow/references/phase-orchestrator.md
    - plugins/wf/skills/ticket-workflow/references/classification.md
    - plugins/wf/skills/ticket-workflow/references/scoring.md
    - plugins/wf/skills/ticket-workflow/references/workflow-logger.md
    - plugins/wf/skills/ticket-workflow/references/browser-automation.md
    - plugins/wf/skills/ticket-workflow/references/phases/evidence-collection.md
    - plugins/wf/skills/ticket-workflow/references/phases/exploration.md
    - plugins/wf/skills/ticket-workflow/references/phases/planning.md
    - plugins/wf/skills/ticket-workflow/references/phases/implementation.md
    - plugins/wf/skills/ticket-workflow/references/phases/verification.md
  modified:
    - plugins/wf/skills/ticket-workflow/SKILL.md
  deleted:
    - plugins/ticket-workflow/ (전체 디렉토리)
    - plugins/wf/lib/ (빈 스키마 디렉토리)
decisions:
  - "browser-reproducer.md를 Phase 2 스텁으로 처리 — Playwright MCP 통합 전까지 코드 수준 폴백"
  - "lib/schemas/classification.md 내용을 references/classification.md에 병합 — 단일 진실의 원천 확보"
  - "SKILL.md의 lib/schemas 경로 참조 제거 — 더 이상 존재하지 않는 경로 참조 정리"
metrics:
  duration: 219s
  completed_date: "2026-03-12T05:48:29Z"
  tasks_completed: 2
  files_created: 18
  files_modified: 1
  files_deleted: 50+
---

# Phase 1 Plan 01: Structure Merge Summary

v0.2(`plugins/ticket-workflow/`)의 7개 에이전트, 10개 references, Python lib/를 `plugins/wf/`로 이전하고 단일 플러그인 구조를 완성하여 단일 진실의 원천(single source of truth) 확립.

## Objective

v0.2/v0.3 두 경로를 하나로 통합하여 `plugins/wf/` 디렉토리에 표준 플러그인 구조를 완성하고, `plugins/ticket-workflow/` 구 경로를 완전 삭제한다.

## Tasks Completed

| Task | Description | Commit | Status |
|------|-------------|--------|--------|
| 1 | v0.2 에셋 이전 + plugin.json 생성 | 15b815e | DONE |
| 2 | plugins/ticket-workflow/ 삭제 + lib/schemas/ 통합 | f84869d | DONE |

## What Was Built

### Task 1: v0.2 에셋 이전

- `plugins/wf/.claude-plugin/plugin.json` 생성 (agent-delegation과 동일 구조)
- `plugins/ticket-workflow/agents/` 내 7개 에이전트 파일을 `plugins/wf/agents/`로 복사
- `browser-reproducer.md`를 Phase 2 스텁으로 재작성 (브라우저 자동화 통합은 Phase 2에서 구현 예정)
- `plugins/ticket-workflow/skills/.../references/` 내 10개 파일을 `plugins/wf/skills/.../references/`로 복사
- `browser-automation.md`에서 Python API 참조 제거, Claude Code 직접 실행 방식으로 대체
- `evidence-collection.md`에서 `BrowserAutomation` Python 모듈 참조 제거
- `SKILL.md`에서 `../../lib/schemas/classification.md` 경로 참조 제거

### Task 2: 구 경로 삭제 + 스키마 통합

- `lib/schemas/classification.md`의 `Classification Output Schema` 내용을 `references/classification.md` 하단에 병합
- `plugins/ticket-workflow/` 전체 삭제 (Python lib/*.py, __pycache__, test_*.py 포함)
- `plugins/wf/lib/` 빈 스키마 디렉토리 삭제

## Verification Results

| Check | Result |
|-------|--------|
| plugin.json 존재 | OK |
| 7개 에이전트 파일 존재 | OK |
| 10개 references 파일 존재 | OK |
| SKILL.md 377줄 (500 이하) | OK |
| plugins/ticket-workflow/ 삭제됨 | OK |
| plugins/wf/lib/ 삭제됨 | OK |
| Python .py 파일 0개 | OK |
| Python lib/ 참조 없음 | OK |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] SKILL.md의 lib/schemas 경로 참조 정리**
- **Found during:** Task 2
- **Issue:** SKILL.md에 `../../lib/schemas/classification.md` 참조가 2곳 존재 (삭제 예정 경로)
- **Fix:** 두 참조 모두 `references/classification.md`로 변경 또는 중복 항목 제거
- **Files modified:** `plugins/wf/skills/ticket-workflow/SKILL.md`
- **Commit:** 15b815e

None of the other items deviated from the plan — execution was straightforward.

## Self-Check

- [x] 생성된 파일 18개 모두 존재 확인
- [x] 커밋 해시 15b815e, f84869d 존재 확인
- [x] Python 파일 0개 확인
- [x] 구 경로 삭제 확인
