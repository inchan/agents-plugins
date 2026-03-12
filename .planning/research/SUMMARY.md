# Project Research Summary

**Project:** ticket-workflow (wf plugin)
**Domain:** Claude Code SKILL.md 기반 멀티페이즈 자동 버그 해결 플러그인
**Researched:** 2026-03-12
**Confidence:** HIGH

## Executive Summary

이 프로젝트는 Claude Code의 SKILL.md 플러그인 시스템 위에서 동작하는 자동화 버그 해결 워크플로우다. 외부 라이브러리를 작성하는 것이 아니라, 마크다운 + YAML frontmatter로 에이전트 동작을 명세하는 방식이 핵심이다. 이미 v0.2.0 구현체가 `plugins/ticket-workflow/`에 존재하고, 더 완성도 높은 v0.3.0 초안이 `plugins/wf/skills/ticket-workflow/SKILL.md`에 있다. 따라서 이 프로젝트는 신규 구축(greenfield)이 아닌, 두 버전의 통합 및 완성 작업이다.

권장 접근법은 6단계 상태 기계(Phase 1-6) 구조를 유지하면서, v0.2의 references/ 문서 체계와 v0.3의 SKILL.md 로직을 하나의 일관된 플러그인으로 통합하는 것이다. 브라우저 자동화(Playwright MCP)는 UI 버그 처리 경로에서만 선택적으로 활성화하며, Non-UI 완전 동작을 1차 목표로 삼고 UI 브라우저 자동화는 2차 목표로 분리해야 한다. 병렬 에이전트 디스패치, 재시도 시 전략 변경, UI/Non-UI 자동 분류의 조합이 이 스킬의 핵심 차별화 요소다.

가장 큰 위험은 세 가지다. 첫째, SKILL.md 비대화로 인한 컨텍스트 압력(지시 무시). 둘째, 병렬 에이전트 간 파일 쓰기 충돌. 셋째, 재시도 시 실질적 전략 변경 없이 반복. 이 세 함정은 이미 일부 예방 구조가 설계에 내재되어 있으나, references/ 분리 유지와 명시적 재시도 전략 정의를 통해 완전히 막아야 한다.

---

## Key Findings

### 권장 스택

Claude Code SKILL.md 플러그인 개발에서 "스택"이란 외부 라이브러리가 아니라 Claude Code 런타임이 제공하는 기능 조합이다. 코드를 작성하지 않고 마크다운으로 에이전트 동작을 명세한다. 브라우저 자동화는 Playwright MCP(Microsoft 공식, 접근성 트리 기반)를 1순위로 사용하고, Claude in Chrome(Beta)을 로그인 세션 재현 보조로, Chrome DevTools MCP를 성능/네트워크 디버깅 보조로 활용한다.

**핵심 기술:**
- `SKILL.md + references/ 분리`: 오케스트레이션 명세 — 컨텍스트 압력 방지
- `Playwright MCP (@playwright/mcp)`: UI 재현/검증 — Microsoft 공식, LLM 최적화
- `Sub-agents (agents/*.md)`: 병렬 증거 수집/탐색 — 토큰 효율 + 속도
- `Claude in Chrome (Beta)`: 로그인 세션 브라우저 자동화 — Anthropic 공식
- `Chrome DevTools MCP`: 성능/네트워크 분석 — Google 공식, 보조적 활용

**사용하지 않을 기술:**
- Puppeteer/Selenium: 레거시, LLM 비친화적
- `.claude/commands/` 레거시 경로: 신규는 `skills/` 사용
- `context: fork` 남용: 격리 필요한 태스크에만 사용

상세 내용: `.planning/research/STACK.md`

---

### 기대 기능

이 스킬은 v0.2 구현체를 기반으로 한다. 기능 분류는 "추가/유지/제거" 관점으로 이루어졌다.

**반드시 있어야 할 것 (Table Stakes):**
- 티켓 텍스트 파싱 — 사용자 입력 진입점
- 코드베이스 증거 수집 (병렬 에이전트) — 근거 없는 수정은 의미 없음
- 근본 원인 탐색 — 증상이 아닌 원인 수정
- 수정 계획 수립 — 구현 전 설계 확정
- 자동 코드 수정 — 핵심 자동화 가치
- 테스트 실행 검증 — 수정이 실제로 동작하는지 확인
- 재시도 로직 (최대 3회, 전략 변경) — 1회 실패로 포기 불가
- 진행 상태 시각화 — 사용자가 현재 단계 인지
- 결과 리포트 저장 — 감사 추적
- 구조화된 에러 코드 + 로그 — 침묵 실패 방지

**경쟁 우위를 만드는 것 (Differentiators):**
- UI vs Non-UI 자동 분류 (신뢰도 점수 포함) — 분기 없이 플레이리스트 불가
- 브라우저 자동화 재현 (Playwright MCP) — 텍스트 분석만 하는 경쟁 도구와 차별화
- Before/After 스크린샷 비교 — 시각적 회귀 픽셀 수준 확인
- 브라우저 도구 폴백 체인 — 단일 도구 실패로 전체 중단 방지
- 단계별 품질 점수 — "완료"가 아닌 "얼마나 잘 완료됐는가"
- 재시도 시 전략 변경 — 동일 전략 반복이 아닌 접근법 전환
- 병렬 에이전트 실행 — 순차 실행 대비 속도 우위
- 불변 히스토리 (Phase 1-4 결과 재사용) — 중복 탐색 방지
- Graceful Degradation — CI/서버 환경 호환성

**v2+로 유보:**
- Jira/Linear API 연동 — v1 복잡도 폭발 유발
- 자동 PR 생성 — 사용자 확인 없는 remote push는 고위험
- 다중 티켓 배치 처리 — 컨텍스트 오염, 충돌 위험

**MVP 권장 분리:**
- Phase 1 타깃: Non-UI 완전 동작 (증거→분류→탐색→계획→구현→검증) + 재시도
- Phase 2 타깃: UI 분류 + 브라우저 자동화 + Before/After 스크린샷

상세 내용: `.planning/research/FEATURES.md`

---

### 아키텍처 접근법

이미 동작하는 구현체가 존재하며 핵심 아키텍처 패턴이 확립되어 있다. SKILL.md는 "무엇을(What)"만 정의하고, 상세 절차는 `references/` 하위 파일에 위임하는 분리 구조가 핵심이다. 6개 페이즈는 각각 순수 함수처럼 입력/출력 계약을 가지며, 상태 기계(ASCII 다이어그램)로 전체 흐름을 제어한다. 병렬 에이전트는 읽기 전용으로 설계하고, 오케스트레이터가 집계 후 단일 경로로 쓰기를 처리한다.

**주요 컴포넌트:**
1. `commands/ticket.md` — 슬래시 커맨드 진입점, 인자 파싱, 최종 보고서 출력
2. `skills/ticket-workflow/SKILL.md` — 트리거 정의, 6단계 개요, 에이전트 디스패치 명세
3. `references/phase-orchestrator.md` — 상태 기계, 페이즈 전환 규칙, 재시도 로직
4. `references/phases/*.md` — 각 페이즈 상세 실행 절차
5. `references/classification.md` — UI/Non-UI 분류 알고리즘 (7가지 신호 차원)
6. `references/browser-automation.md` — Playwright MCP / Chrome DevTools / 폴백 체인
7. `agents/*.md` — 역할 특화 서브에이전트 (evidence-searcher x2, bug-tracer x2-3, 등)
8. `lib/schemas/classification.md` — 분류 출력 JSON 스키마

**핵심 패턴:**
- SKILL.md + References 분리 (500줄 이하 유지)
- 페이즈 계약 (Input/Output 명시)
- 상태 기계 (명시적 전환 조건, 재시도 범위)
- 병렬 에이전트 디스패치 (읽기 전용)
- 점수 시스템 + 프로그레스 바

**버전 공존 현황 (통합 필요):**

| 경로 | 버전 | 상태 |
|------|------|------|
| `plugins/ticket-workflow/` | v0.2.0 | references/ 완성, agents/ 포함 |
| `plugins/wf/skills/ticket-workflow/SKILL.md` | v0.3.0 | SKILL.md 더 완성, references/ 없음 |

로드맵은 v0.3 SKILL.md + v0.2 references/ 구조를 통합하는 작업을 포함해야 한다.

상세 내용: `.planning/research/ARCHITECTURE.md`

---

### 치명적 함정

총 12개 함정이 확인되었다 (치명 4, 중등도 5, 경미 3). 상위 우선순위:

1. **SKILL.md 비대화로 컨텍스트 압력 발생** — `references/` 분리 구조 반드시 유지. SKILL.md는 500줄 이하 목표. 이 프로젝트는 이미 올바른 구조를 갖추고 있음 — 파괴 금지.

2. **병렬 에이전트 간 파일 쓰기 충돌** — 병렬 에이전트는 읽기 전용 설계. 스크린샷 경로에 에이전트 ID 포함. 오케스트레이터가 집계 후 단일 경로에 쓰기.

3. **재시도 시 같은 전략 반복** — 3회 재시도 전략을 SKILL.md에 명시적으로 정의 (시도 1: 표준 구현 → 시도 2: 실패 테스트 집중 + 엣지 케이스 → 시도 3: 접근법 완전 전환). Phase 4 계획에 "대안 접근법" 섹션 필수화.

4. **Shadow DOM으로 브라우저 자동화 조용한 실패** — `interaction_confirmed` 필드 추가. Shadow DOM 감지 로직을 증거 수집 단계에 포함. 실패 시 `E_BROWSER`로 명시적 처리.

5. **분류 신뢰도 낮을 때 잘못된 전략으로 진행** — 신뢰도 < 0.6일 때 UI + Non-UI 양방향 탐색. 최종 보고서에 "분류 불확실" 경고 포함.

상세 내용: `.planning/research/PITFALLS.md`

---

## Implications for Roadmap

연구를 종합한 결과, 아래 4단계 페이즈 구조를 권장한다.

---

### Phase 1: 버전 통합 및 Non-UI 핵심 워크플로우 완성

**근거:** v0.2와 v0.3의 두 구현체가 공존하는 현재 상태가 가장 먼저 해결해야 할 기술 부채다. 통합 없이 기능을 추가하면 구조가 더 복잡해진다. Non-UI 경로는 이미 가장 많은 구현이 있어 완성 진입 비용이 낮다.

**산출물:**
- `plugins/wf/` 단일 경로로 통합된 플러그인 구조
- Non-UI 버그에 대한 완전한 6단계 워크플로우 (증거→분류→탐색→계획→구현→검증)
- 재시도 로직 완성 (3회, 각 시도별 전략 명시)
- 프로그레스 바 + 스코어카드 시각화
- 구조화된 에러 코드 (E_TOOL, E_VERIFY 등 8종)
- 타임스탬프 포함 결과 파일 저장

**다루는 기능 (FEATURES.md):** 모든 Table Stakes 기능
**피해야 할 함정 (PITFALLS.md):** Pitfall 1 (SKILL.md 비대화), Pitfall 3 (재시도 전략 반복), Pitfall 7 (재시도 시 변경 누적 오염), Pitfall 10 (cwd 경로 오류), Pitfall 11 (결과 파일 충돌)

**리서치 플래그:** 표준 패턴 — 추가 리서치 불필요. 기존 v0.2/v0.3 구현체가 충분한 참조 자료를 제공함.

---

### Phase 2: UI 분류 + 브라우저 자동화 재현

**근거:** Non-UI 경로가 안정화된 후 브라우저 자동화를 추가하는 것이 안전하다. UI 경로는 Playwright MCP 의존성이 있어 별도 통합 검증이 필요하다. Shadow DOM 함정, Playwright 도구 과다 노출 등 브라우저 특화 위험이 집중되어 있다.

**산출물:**
- UI vs Non-UI 자동 분류 완성 (7가지 신호 차원, 신뢰도 점수)
- Playwright MCP 통합 (7개 도구만 명시적 사용)
- 브라우저 재현 에이전트 (`browser-reproducer.md`) 완성
- Before 스크린샷 캡처 (Phase 1에서)
- `interaction_confirmed` 필드 + Shadow DOM 감지 로직
- 신뢰도 < 0.6 시 양방향 탐색 (Phase 3)

**다루는 기능 (FEATURES.md):** UI/Non-UI 자동 분류, 브라우저 자동화 재현
**피해야 할 함정 (PITFALLS.md):** Pitfall 4 (Shadow DOM 조용한 실패), Pitfall 5 (낮은 분류 신뢰도), Pitfall 6 (Playwright 26개 도구 남용), Pitfall 12 (인증 필요 URL)

**리서치 플래그:** Playwright MCP의 Shadow DOM 처리 방식 심화 확인 필요. `@playwright/mcp` 최신 버전에서의 접근성 트리 Shadow DOM 노출 범위를 실제 테스트로 검증 권장.

---

### Phase 3: Before/After 스크린샷 비교 + 폴백 체인

**근거:** Before/After 비교는 Phase 1의 Before 스크린샷에 의존하므로 Phase 2 이후에만 가능하다. 폴백 체인(Playwright → Chrome DevTools → agent-browser → Code Analysis)은 실전 안정성 요소로 핵심 기능 동작 이후 추가하는 것이 적합하다.

**산출물:**
- After 스크린샷 캡처 (Phase 6 검증 시)
- Before/After 시각적 비교 (`maxDiffPixels` 활용)
- 브라우저 도구 폴백 체인 완성
- Chrome DevTools MCP 통합 (성능/네트워크 분석)
- Claude in Chrome 조건부 활용 (로그인 세션)
- Graceful Degradation (브라우저 없는 환경 폴백)

**다루는 기능 (FEATURES.md):** Before/After 스크린샷 비교, 브라우저 폴백 체인, Graceful Degradation
**피해야 할 함정 (PITFALLS.md):** Pitfall 2 (병렬 에이전트 스크린샷 충돌), Pitfall 12 (인증 URL)

**리서치 플래그:** Chrome DevTools MCP Chrome 136+ 기본 프로필 원격 디버깅 차단 대응 방안 확인 필요.

---

### Phase 4: 품질 점수 고도화 + 마켓플레이스 등록

**근거:** 점수 시스템은 이미 설계(scoring.md)가 있으나 자가 보고 편향 문제가 있다. 결정론적 지표 기반으로 재설계한 후 플러그인을 마켓플레이스에 등록하는 것이 최종 목표다.

**산출물:**
- `verification_quality_score`를 결정론적 지표로만 계산 (자가 보고 편향 제거)
- 재시도 발생 시 자동 감점 로직
- `marketplace.json` 항목 완성 및 등록
- `plugin.json` 버전 최종화 (v1.0.0)
- 통합 테스트 시나리오 (버그 재현 + 회귀 방지 중심)

**다루는 기능 (FEATURES.md):** 단계별 품질 점수 고도화
**피해야 할 함정 (PITFALLS.md):** Pitfall 9 (자가 보고 점수 편향)

**리서치 플래그:** 표준 패턴 — 추가 리서치 불필요.

---

### 페이즈 순서 근거

- **버전 통합이 0순위:** 두 경로 공존은 유지보수 비용이 지속 발생. 기능 추가 전 통합이 선행되어야 한다.
- **Non-UI → UI 순서:** 브라우저 자동화 의존성이 없는 Non-UI 경로가 더 안정적. 핵심 워크플로우를 먼저 검증한 후 UI 경로를 추가하면 디버깅이 쉽다.
- **비교/폴백을 Phase 3로:** Before 스크린샷이 Phase 1에서 생성되어야 After와 비교할 수 있다. 두 페이즈에 걸친 의존성을 고려한 순서다.
- **품질/등록을 마지막으로:** 기능이 안정화된 후 점수 시스템 고도화와 공개 등록이 의미 있다.

---

### 리서치 플래그 요약

추가 리서치 필요:
- **Phase 2:** Playwright MCP Shadow DOM 처리 실제 동작 검증 (실험적 확인 권장)
- **Phase 3:** Chrome DevTools MCP Chrome 136+ 환경 설정 방법

표준 패턴 (추가 리서치 불필요):
- **Phase 1:** 기존 구현체 + 공식 문서로 충분히 커버됨
- **Phase 4:** 점수 시스템 재설계는 내부 설계 작업, 외부 리서치 불필요

---

## Confidence Assessment

| 영역 | 신뢰도 | 근거 |
|------|--------|------|
| Stack | HIGH | Claude Code 공식 문서, Microsoft Playwright MCP GitHub, Google ChromeDevTools GitHub 직접 검증 |
| Features | HIGH | 기존 v0.2 구현체 직접 검토 + 외부 생태계 비교 병행 |
| Architecture | HIGH | 레포지토리 내 구현체 직접 분석 (v0.2, v0.3) |
| Pitfalls | HIGH | 공식 문서, GitHub 실사례 이슈, arXiv 논문, 사용자 관찰 보고서 복수 출처 교차 검증 |

**전체 신뢰도: HIGH**

### 해결이 필요한 갭

- **Shadow DOM 실제 동작:** Playwright MCP의 Shadow DOM 접근성 트리 노출 범위는 공식 문서에 명확히 명세되지 않음. Phase 2에서 실제 테스트로 검증 필요.
- **marketplace.json 최신 스키마:** Claude Code 마켓플레이스 등록 형식이 계속 변화 중. Phase 4 전에 최신 명세 확인 필요.
- **Claude in Chrome Beta 안정성:** Beta 상태로 동작이 불안정할 수 있음. Phase 3에서 실제 환경 검증 후 의존도 결정 필요.
- **컨텍스트 포크 격리 한계:** `context: fork` 서브에이전트가 부모 컨텍스트와 얼마나 격리되는지 공식 문서에 상세 명세 없음. 병렬 쓰기 충돌 실제 발생 조건 확인 필요.

---

## Sources

### 1차 출처 (HIGH confidence)

- [Claude Code Skills 공식 문서](https://code.claude.com/docs/en/skills) — SKILL.md 구조, frontmatter 전체 명세
- [Claude Code Plugins Reference](https://code.claude.com/docs/en/plugins-reference) — plugin.json 명세, 디렉토리 구조
- [Claude Code Sub-Agents 공식 문서](https://code.claude.com/docs/en/sub-agents) — 에이전트 타입, 병렬 디스패치 패턴
- [Claude Code Chrome Integration](https://code.claude.com/docs/en/chrome) — Claude in Chrome, 최소 버전
- [Microsoft Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp) — 도구 목록, LLM 최적화 접근법
- [ChromeDevTools/chrome-devtools-mcp GitHub](https://github.com/ChromeDevTools/chrome-devtools-mcp) — Chrome 136+ 보안 제약
- 내부 구현 직접 분석: `plugins/ticket-workflow/` (v0.2), `plugins/wf/skills/ticket-workflow/SKILL.md` (v0.3)

### 2차 출처 (HIGH confidence)

- [Claude Agent Skills: A First Principles Deep Dive](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/) — 컨텍스트 인젝션 토큰 오버헤드
- [Why less is more: The Playwright proliferation problem](https://www.speakeasy.com/blog/playwright-tool-proliferation) — 도구 과다 노출 문제
- [Multi-agent workflows often fail — GitHub Blog](https://github.blog/ai-and-ml/generative-ai/multi-agent-workflows-often-fail-heres-how-to-engineer-ones-that-dont/) — 비구조화 통신, 암묵적 상태 가정
- [LLM-based Agents for Automated Bug Fixing (arXiv)](https://arxiv.org/html/2411.10213v2) — 버그 재현 품질 의존성
- [Claude Code issues #22758](https://github.com/anthropics/claude-code/issues/22758) — 재시도 루프 무한 반복 실사례

### 3차 출처 (MEDIUM confidence)

- [SWE-agent GitHub](https://github.com/SWE-agent/SWE-agent) — 자율 버그 수정 에이전트 생태계 비교
- [Pimzino/claude-code-spec-workflow](https://github.com/Pimzino/claude-code-spec-workflow) — Claude Code 버그 워크플로우 패턴
- [I Watched 100+ People Hit the Same Claude Skills Problems](https://natesnewsletter.substack.com/p/i-watched-100-people-hit-the-same) — 실제 사용자 공통 실수

---
*Research completed: 2026-03-12*
*Ready for roadmap: yes*
