---
phase: 2
slug: ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | 없음 — 마크다운 기반 AI 에이전트 정의 파일 (grep smoke check) |
| **Config file** | N/A |
| **Quick run command** | `ls plugins/wf/agents/browser-reproducer.md && wc -l plugins/wf/agents/browser-reproducer.md` |
| **Full suite command** | `cat plugins/wf/agents/browser-reproducer.md && cat plugins/wf/skills/ticket-workflow/references/browser-automation.md` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** `ls plugins/wf/agents/browser-reproducer.md && wc -l plugins/wf/agents/browser-reproducer.md`
- **After every plan wave:** Full content review + grep smoke checks for all modified files
- **Before `/gsd:verify-work`:** All UIBR-01~04 manual verification complete
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-T1 | 01 | 1 | UIBR-01 | manual-only | `cat plugins/wf/agents/browser-reproducer.md \| grep -c "playwright"` | ❌ W0 | ⬜ pending |
| 02-01-T2 | 01 | 1 | UIBR-01 | manual-only | `cat plugins/wf/skills/ticket-workflow/references/phases/evidence-collection.md \| grep -c "browser-reproducer"` | ❌ W0 | ⬜ pending |
| 02-02-T1 | 02 | 2 | UIBR-02 | manual-only | `cat plugins/wf/skills/ticket-workflow/references/phases/verification.md \| grep -c "after_screenshot"` | ❌ W0 | ⬜ pending |
| 02-03-T1 | 03 | 2 | UIBR-03 | manual-only | `cat plugins/wf/agents/browser-reproducer.md \| grep -c "parallel\|cross-check"` | ❌ W0 | ⬜ pending |
| 02-03-T2 | 03 | 2 | UIBR-04 | manual-only | `cat plugins/wf/agents/browser-reproducer.md \| grep -c "E_TOOL\|fallback\|Degraded"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements — 마크다운 파일 편집이므로 테스트 인프라 설치가 불필요.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| browser-reproducer가 Playwright MCP로 재현 단계 실행 + Before 스크린샷 캡처 | UIBR-01 | AI 에이전트 정의 파일은 실행 환경에서만 검증 가능 | browser-reproducer.md에 playwright 관련 지시문 존재 확인 |
| verification.md에서 After 스크린샷 캡처 후 Before와 비교 | UIBR-02 | 실제 브라우저 실행 필요 | verification.md에 visual_comparison 출력 구조 정의 확인 |
| 가용 도구 2개 이상 시 병렬 Agent 디스패치 크로스체크 | UIBR-03 | 멀티 MCP 환경에서만 검증 가능 | browser-reproducer.md에 병렬 실행 지시문 확인 |
| 폴백 체인 각 단계의 [WARN][BROWSER] 로그 출력 | UIBR-04 | 도구 미설치 환경에서만 폴백 경로 검증 가능 | browser-reproducer.md에 E_TOOL → 폴백 체인 정의 확인 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
