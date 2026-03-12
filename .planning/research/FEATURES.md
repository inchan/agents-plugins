# Feature Landscape

**Domain:** 자동화된 티켓 워크플로우 / 버그 해결 스킬 (Claude Code SKILL.md)
**Researched:** 2026-03-12
**Confidence:** HIGH (기존 구현 직접 검토 + 외부 생태계 리서치 병행)

---

## 컨텍스트 메모

이 프로젝트는 **greenfield가 아님**. `plugins/ticket-workflow/`에 v0.2.0 구현이 이미 존재한다.
`plugins/wf/skills/ticket-workflow/SKILL.md`는 별도의 초안 경로다.
Feature 분류는 "무엇을 추가/유지/제거할지"를 결정하는 데 초점을 맞춘다.

---

## Table Stakes (없으면 사용자가 떠난다)

사용자가 자동화된 버그 워크플로우 도구에 기본으로 기대하는 기능들.

| Feature | 왜 기대하는가 | 복잡도 | 현재 구현 상태 |
|---------|-------------|--------|--------------|
| 티켓 입력 파싱 | 텍스트에서 버그 설명 추출 | Low | `plugins/ticket-workflow/commands/ticket.md` |
| 코드베이스 증거 수집 | 수동 grep 대체 — 근거 없는 수정은 의미 없음 | Medium | Phase 1 (evidence-searcher x2 병렬) |
| 근본 원인 탐색 | 증상이 아닌 원인 수정 | Medium | Phase 3 (bug-tracer x2-3 병렬) |
| 수정 계획 수립 | 구현 전 설계 방향 확정 | Low | Phase 4 (planner) |
| 자동 코드 수정 | 핵심 자동화 가치 — 수동 수정이면 도구가 필요 없음 | High | Phase 5 (implementer) |
| 테스트 실행으로 검증 | 수정이 실제로 동작하는지 확인 | Medium | Phase 6 (verifier, 테스트 실행) |
| 실패 시 재시도 | 1회 실패로 전체 워크플로우 포기는 허용 불가 | Medium | 최대 3회 재시도 (Attempt 1→2→3) |
| 진행 상태 표시 | 사용자가 현재 단계를 알아야 함 | Low | 프로그레스 바 스코어카드 |
| 결과 리포트 저장 | 재현/감사 추적 필요 | Low | 마크다운 파일 출력 |
| 오류 처리 + 로그 | 도구 실패 시 침묵하면 신뢰를 잃음 | Medium | 에러 코드 체계 (E_TOOL, E_VERIFY 등) |

---

## Differentiators (경쟁 우위를 만드는 기능)

기대하지는 않지만, 있으면 명확하게 가치를 더하는 기능들.

| Feature | 가치 제안 | 복잡도 | 현재 구현 상태 | 비고 |
|---------|----------|--------|--------------|------|
| **UI vs Non-UI 자동 분류** | 버그 유형마다 검증 방식이 다름 — 분류 없이 플레이리스트 불가 | Medium | `references/classification.md` (신뢰도 점수 포함) | Differentiator: 신뢰도 기반 자동 분기가 차별화 |
| **브라우저 자동화 재현** | UI 버그를 실제로 재현하고 시각 증거 수집 | High | Phase 1 + 6 (Playwright MCP / Chrome DevTools / agent-browser) | 경쟁 도구 대부분 텍스트 분석만 함 |
| **Before/After 스크린샷 비교** | 수정 전후 시각적 회귀를 픽셀 수준에서 확인 | High | Phase 6 (UI 검증, screenshot comparison) | Playwright MCP의 maxDiffPixels 활용 |
| **브라우저 도구 폴백 체인** | 단일 도구 실패로 전체 중단 방지 | Medium | Playwright → Chrome DevTools → agent-browser 순 폴백 | 실전 안정성 높음 |
| **단계별 품질 점수** | "완료"가 아닌 "얼마나 잘 완료됐는가"를 수치화 | Medium | scoring.md (evidence 30%, planning 20%, impl 30%, verify 30%) | 재시도 전략 결정에도 활용 |
| **재시도 시 전략 변경** | 같은 전략으로 3번 재시도는 의미 없음 | High | Attempt 1: full → Attempt 2: targeted fix → Attempt 3: relaxed | 단순 재시도 대비 성공률 향상 |
| **병렬 에이전트 실행** | 증거 수집과 탐색을 병렬화하여 지연 최소화 | Medium | evidence-searcher x2, bug-tracer x2-3 병렬 | 단일 에이전트 순차 실행 대비 속도 우위 |
| **불변 히스토리 (Immutable Phase Outputs)** | 재시도 시 1-4 단계 결과 재사용 — 중복 탐색 방지 | Low | 상태 머신에서 Phase 1-4 출력 고정 | 토큰/시간 효율화 |
| **Graceful Degradation** | 브라우저 없는 환경에서도 비UI 검증으로 폴백 | Medium | 각 페이즈의 degradation rule 테이블 | CI/서버 환경 호환성 |
| **구조화된 에러 코드** | 실패 원인 분류 → 자동 복구 전략 선택 가능 | Low | E_TOOL, E_VERIFY, E_BROWSER 등 8종 | 로그 기반 디버깅 용이 |

---

## Anti-Features (의도적으로 빌드하지 않을 것들)

| Anti-Feature | 왜 피해야 하는가 | 대신 할 것 |
|-------------|--------------|----------|
| **외부 티켓 시스템 연동 (Jira/Linear API)** | v1 복잡도를 폭발적으로 증가시킴. OAuth, 페이로드 파싱, 타사 API 안정성 의존성 추가 | 텍스트 입력만 지원. API 연동은 v2 이후 |
| **티켓 우선순위 / 스프린트 관리** | 단일 티켓 처리에 집중이 핵심 가치. PM 도구를 대체할 이유 없음 | 단일 티켓 end-to-end 자동화에 집중 |
| **자동 PR 생성** | 사용자 확인 없이 remote push는 신뢰를 깨는 고위험 액션 | 구현까지 자동화. PR은 사용자가 직접 생성 |
| **다중 티켓 배치 처리** | 컨텍스트 오염, 파일 충돌, 추적 복잡도 급증 | 1번에 1티켓. 배치 처리는 반복 호출로 해결 |
| **의존성 자동 설치** | 보안 리스크 + 프로젝트 환경 파괴 가능성 | 필요한 경우 사용자에게 알리고 멈춤 |
| **인터랙티브 채팅형 UX** | 완전 자동 실행이 설계 철학. 중간 질문은 자동화 가치를 희석 | 모호한 경우는 분류 신뢰도 낮게 표시하고 진행 |
| **커버리지 % 채우기 테스트** | 의미 없는 테스트는 오히려 신뢰도를 떨어뜨림 | 시나리오 커버리지 (버그 재현 + 회귀 방지) 중심 |

---

## Feature Dependencies

```
티켓 입력 파싱
  └→ 코드베이스 증거 수집
       ├→ UI/Non-UI 자동 분류
       │    ├→ [UI] 브라우저 자동화 재현 (Before 스크린샷)
       │    └→ [Non-UI] 로그/에러 수집
       └→ 근본 원인 탐색 (병렬 에이전트)
            └→ 수정 계획 수립
                 └→ 자동 코드 수정
                      └→ 테스트 실행 검증
                           ├→ [UI] Before/After 스크린샷 비교
                           │    └→ 브라우저 도구 폴백 체인
                           └→ [실패] 재시도 (전략 변경, 최대 3회)
                                └→ 단계별 품질 점수 + 최종 리포트
```

**핵심 의존 관계:**
- 브라우저 자동화 재현은 UI 분류 결과에 의존
- Before/After 비교는 Phase 1의 Before 스크린샷에 의존 (없으면 비교 불가)
- 재시도 전략 변경은 단계별 에러 코드에 의존
- 병렬 에이전트는 상위 페이즈 출력(파일 목록, 오류 맥락)에 의존

---

## MVP 권장사항

### 우선 구현 (Phase 1 타깃)

1. **증거 수집 → 분류 → 탐색 → 계획 → 구현 → 검증** 6단계 순차 워크플로우 (Non-UI 완전 동작)
2. **재시도 로직** (3회, 전략 변경)
3. **프로그레스 바 시각화 + 최종 스코어카드**
4. **구조화된 에러 코드 + 로그**

### Phase 2 타깃

5. **UI 분류 + 브라우저 자동화 재현** (Playwright MCP)
6. **Before/After 스크린샷 비교**
7. **브라우저 폴백 체인** (Playwright → Chrome DevTools → agent-browser)

### 유보 (Out of Scope 유지)

- Jira/Linear API 연동
- 자동 PR 생성
- 다중 티켓 배치 처리

---

## 생태계 비교 메모

| 도구/접근법 | 공통점 | 차별화 포인트 |
|-----------|--------|-------------|
| SWE-agent (GitHub) | 자동 코드 수정, 테스트 실행 | 이 스킬은 UI 버그 + 브라우저 재현에 특화 |
| Pimzino/claude-code-spec-workflow | 4단계 버그 워크플로우 | 이 스킬은 분류/재시도 전략/품질 점수 추가 |
| Harness AI (SWE-bench 1위) | 자율 패치 생성 | 이 스킬은 Claude Code 생태계 내 플러그인으로 동작 |
| Copilot Agent + Playwright MCP | 브라우저 확인 | 이 스킬은 폴백 체인 + 시각적 diff 추가 |

**핵심 차별화 조합:** UI/Non-UI 자동 분류 + 브라우저 폴백 체인 + 재시도 시 전략 변경 + 단계별 품질 점수를 하나의 Claude Code 스킬에 통합한 것은 현재 생태계에서 유사 사례가 없음. (MEDIUM confidence — 공식 Claude Skills 마켓플레이스 전수 검색 불가)

---

## Sources

- [SWE-agent GitHub Repo](https://github.com/SWE-agent/SWE-agent) — 자율 버그 수정 에이전트 참고
- [Pimzino/claude-code-spec-workflow](https://github.com/Pimzino/claude-code-spec-workflow) — Claude Code 버그 워크플로우 패턴
- [Playwright MCP Visual Testing](https://pasqualepillitteri.it/en/news/205/ai-blind-playwright-mcp-invisible-bugs) — 브라우저 자동화 + AI 통합
- [Multi-agent Workflow Failure Patterns](https://github.blog/ai-and-ml/generative-ai/multi-agent-workflows-often-fail-heres-how-to-engineer-ones-that-dont/) — 재시도/폴백 전략 근거
- [AI Bug Resolution Tools 2025](https://bugpilot.io/2025/10/28/ai-bug-reporting-automate-bug-reports-with-ai-agent-tools/) — 도구 생태계 현황
- [Claude Code Workflow Automation Guide](https://www.devonel.com/blog/claude-code-workflow-automation-guide) — Claude Code 스킬 패턴
- 내부 구현 직접 검토: `plugins/ticket-workflow/skills/ticket-workflow/SKILL.md` (v0.2.0)
