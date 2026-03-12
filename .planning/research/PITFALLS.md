# Domain Pitfalls

**Domain:** Claude Code 스킬/플러그인 기반 자동화 티켓 워크플로우 (브라우저 자동화 포함)
**Researched:** 2026-03-12

---

## 핵심 참고 정보

이 문서는 다음 두 도메인의 함정을 다룹니다:
1. **Claude Code SKILL.md 플러그인** — 스킬 정의, 컨텍스트 인젝션, 에이전트 라우팅
2. **LLM 에이전트 자동화 워크플로우** — 멀티에이전트 오케스트레이션, 브라우저 자동화, 검증 루프

---

## 치명적 함정 (Critical Pitfalls)

재작성 또는 심각한 장애를 유발하는 실수들.

---

### Pitfall 1: SKILL.md가 너무 방대해져 컨텍스트 압력으로 지시가 무시됨

**무엇이 잘못되는가:**
SKILL.md가 커질수록 Claude의 컨텍스트 창에서 스킬 지시가 대화 히스토리, 도구 결과, 기타 컨텍스트와 경쟁한다. 컨텍스트 압력이 높아지면 Claude는 스킬 지시를 부분적으로 따르거나 완전히 무시한다. 스킬 인젝션 자체가 턴당 ~1,500+ 토큰을 소비한다.

**왜 발생하는가:**
모든 절차 로직을 SKILL.md 하나에 담으려는 욕구. 6개 페이즈 × 각 상세 절차 = 컨텍스트 폭발.

**결과:**
- 특정 페이즈에서만 지시를 따르고 나머지는 임의 행동
- 로그 포맷, 에러 코드 같은 규약이 중간에 사라짐
- 재현 불가능한 동작 — 같은 티켓을 2번 실행해도 다른 결과

**예방:**
- SKILL.md는 핵심 오케스트레이션 로직만 유지 (목표: 500줄 이하)
- 상세 절차는 `references/phases/*.md`로 분리하고 링크로 참조
- **이 프로젝트는 이미 올바른 구조** (`references/` 사용) — 반드시 유지

**탐지 신호:**
- SKILL.md가 300줄 초과
- 동일 티켓의 반복 실행 결과가 일관되지 않음
- 로깅/에러코드 등 규약이 일부 페이즈에서만 적용됨

**관련 페이즈:** 전체 (구현 전 아키텍처 단계에서 예방)

---

### Pitfall 2: 병렬 에이전트가 동일 파일을 동시 수정해 충돌 발생

**무엇이 잘못되는가:**
Phase 1에서 2개 evidence-searcher 에이전트를, Phase 3에서 2~3개 bug-tracer 에이전트를 병렬 실행한다. 에이전트들이 같은 파일을 읽는 건 안전하지만, **쓰기 작업**이 섞이면 Race Condition이 발생한다. `workflow-result.json` 같은 공유 파일이나 임시 스크린샷 경로에서 충돌이 일어난다.

**왜 발생하는가:**
"읽기만 하는 에이전트"가 사실은 캐시, 임시 파일, 로그 등에 쓰기를 한다. 병렬 에이전트 간 격리가 암묵적으로 가정된다.

**결과:**
- evidence 보고서가 부분 데이터만 포함
- 스크린샷 파일이 덮어쓰여 before/after 비교 오염
- `workflow-result.json` 중간 상태로 저장

**예방:**
- 병렬 에이전트는 **읽기 전용**으로 설계 — 쓰기는 오케스트레이터가 집계 후 처리
- 스크린샷 경로에 에이전트 ID 포함: `screenshot_before_{agent_id}.png`
- 각 에이전트의 출력을 독립적 임시 경로로 격리

**탐지 신호:**
- evidence 보고서의 `affected_files` 목록이 실행마다 다름
- before 스크린샷이 구현 후 상태를 반영하는 이상한 경우

**관련 페이즈:** Phase 1 (증거 수집), Phase 3 (탐색)

---

### Pitfall 3: 검증 실패가 "다른 전략"이 아닌 같은 접근의 반복으로 처리됨

**무엇이 잘못되는가:**
재시도 로직은 "매 실패마다 원인 분석 후 전략 변경"을 명시하지만, LLM은 실패 원인 분석 없이 소폭 변형된 동일 구현을 반복하는 경향이 강하다. 3회 재시도가 실질적으로 1가지 전략의 3번 변형에 불과해진다.

**왜 발생하는가:**
LLM이 자신의 이전 구현에 앵커링됨. "전략 변경"이 구체적으로 무엇을 의미하는지 SKILL.md에 명확히 정의되지 않으면 LLM이 임의 해석.

**결과:**
- 3회 재시도 모두 소진하고도 동일한 근본 원인으로 실패
- 재시도 로그가 표면상으론 달라 보이지만 실질적 전략 변화 없음
- 사용자가 워크플로우 결과를 신뢰할 수 없게 됨

**예방:**
재시도별 전략을 SKILL.md에 **명시적**으로 정의:

```
시도 1: 계획대로 표준 구현
시도 2: 실패한 테스트 집중 공략 + 엣지 케이스 테스트 추가
시도 3: 구현 접근법 완전 전환 (예: 최소 수정 → 전면 리팩토링, 또는 반대)
         반드시 Phase 4 (계획) 출력의 대안 접근법을 사용할 것
```

**탐지 신호:**
- 재시도 2, 3의 `change_summary`가 재시도 1과 거의 동일
- `failure_reason`이 3회 모두 같은 테스트 실패를 가리킴

**관련 페이즈:** Phase 5 (구현), Phase 6 (검증) 재시도 루프

---

### Pitfall 4: 브라우저 자동화 도구가 Shadow DOM으로 인해 조용히 실패

**무엇이 잘못되는가:**
Playwright MCP와 유사 도구들은 Shoelace, Lit, Web Components 같은 Shadow DOM 기반 컴포넌트 라이브러리에서 요소를 찾지 못한다. 도구가 "버튼을 클릭했다"고 보고하지만 실제론 Shadow Root 3겹 아래의 요소에 접근하지 못해 아무 일도 일어나지 않는다. **에러가 발생하지 않아 탐지가 어렵다.**

**왜 발생하는가:**
Playwright의 접근성 트리 스냅샷이 Shadow DOM 내부를 노출하지 않거나 불완전하게 노출함. 도구 선택이 성공한 것처럼 보고되지만 실제 클릭은 발생하지 않음.

**결과:**
- UI 버그가 수정된 것처럼 보이지만 실제론 재현 자체가 실패
- before/after 스크린샷이 둘 다 "실패 상태"를 보여줌 (재현 실패)
- 검증이 통과로 처리되어 실제 버그가 미수정 상태로 전달됨

**예방:**
- 브라우저 재현 결과에 `interaction_confirmed: true/false` 필드 추가
- Shadow DOM 사용 여부를 증거 수집 단계에서 감지: `document.querySelectorAll('*')`로 shadowRoot 존재 확인
- 요소를 찾지 못했을 때 조용히 넘어가지 말고 `E_BROWSER` 에러로 처리
- Code Analysis fallback 시 "브라우저 재현 실패 — 코드 분석으로 대체" 명시

**탐지 신호:**
- 재현 단계 실행 후 UI 상태가 변하지 않음
- before/after 스크린샷이 동일
- `reproduction_result: "partial"` 반복

**관련 페이즈:** Phase 1 (증거 수집), Phase 6 (검증)

---

## 중등도 함정 (Moderate Pitfalls)

---

### Pitfall 5: 티켓 분류가 증거 부족으로 낮은 신뢰도를 반환, 이후 페이즈가 잘못된 전략으로 실행

**무엇이 잘못되는가:**
분류 신뢰도가 0.5 미만일 때 non-UI로 기본 설정하지만, 이 결정이 이후 Phase 3, 5, 6에서 브라우저 자동화를 완전히 생략하게 만든다. 실제로 UI 버그인데 non-UI로 잘못 분류되면 시각적 검증 없이 워크플로우가 완료된다.

**예방:**
- 신뢰도 < 0.6일 때 Phase 3에서 **두 경로 모두** 탐색: UI 컴포넌트 분석 + 코드 로직 분석
- 최종 보고서에 "분류 불확실 — 수동 검토 권장" 경고 포함
- `--type` 오버라이드 옵션을 사용자에게 명확히 안내

**관련 페이즈:** Phase 2 (분류), Phase 3 (탐색)

---

### Pitfall 6: Playwright MCP의 26개 도구 노출로 에이전트 의사결정 마비

**무엇이 잘못되는가:**
Playwright MCP는 26개 도구를 노출하지만 실제 필요한 도구는 8개 내외. 에이전트가 `browser_snapshot`과 `browser_take_screenshot` 중 선택하거나, 단순 클릭 후 불필요한 스크린샷을 반복 촬영해 토큰을 4배 이상 낭비한다.

**예방:**
- `browser-automation.md`에서 사용할 도구를 명시적으로 열거: navigate, click, type, screenshot, assert_visible, assert_text, close (7개)
- "스크린샷은 재현 완료 후 1번만" 규칙을 명시
- 에이전트 프롬프트에서 도구 선택 지침을 명확히 기술

**관련 페이즈:** Phase 1 (증거 수집), Phase 6 (검증)

---

### Pitfall 7: 재시도 루프에서 이전 구현의 부분 변경이 누적되어 코드베이스가 오염됨

**무엇이 잘못되는가:**
재시도 시 "targeted correction"을 하지만 이전 시도의 불완전한 변경이 취소되지 않고 남아 있을 수 있다. 3번 재시도 후에는 여러 접근법의 잔재가 섞인 코드가 된다.

**예방:**
- Phase 5 재시도 진입 전, 이전 시도의 `modified_files`를 명시적으로 git stash 또는 되돌리기
- "재시도는 이전 변경 위에 추가하지 않고 처음부터 재작성"을 SKILL.md에 명시
- `change_summary`에 "이전 시도에서 제거한 변경" 섹션 포함

**관련 페이즈:** Phase 5 (구현) 재시도

---

### Pitfall 8: 스킬 설명(description)이 모호해 Claude가 스킬을 자동 인식하지 못함

**무엇이 잘못되는가:**
Claude Code의 스킬 선택은 순수 LLM 추론 기반 — 알고리즘 라우팅이나 패턴 매칭이 없다. SKILL.md frontmatter의 `description`이 모호하면 사용자가 "버그 수정해줘"라고 해도 스킬이 발동되지 않는다.

**예방:**
- `description`에 trigger 키워드를 명시적으로 나열: "bug ticket", "ticket workflow", "UI bug", "fix ticket"
- CLAUDE.md에 스킬 목록을 직접 언급: "버그 티켓이 언급되면 /ticket-workflow 스킬 사용"
- 현재 SKILL.md의 description 필드가 이미 잘 작성됨 — 유지

**관련 페이즈:** 스킬 초기 로드

---

### Pitfall 9: 점수 시스템이 검증 프로세스를 측정하지 못하고 완료 여부만 측정

**무엇이 잘못되는가:**
quality_score를 각 페이즈 완료 시 계산하지만, LLM이 점수를 자가 보고하는 구조에서는 "페이즈를 완료했는가"와 "페이즈를 제대로 수행했는가"를 구분하지 못한다. LLM이 높은 점수를 생성하도록 암묵적으로 편향될 수 있다.

**예방:**
- `verification_quality_score`는 테스트 결과, 스크린샷 비교 등 **결정론적 지표**로만 계산
- 주관적 품질 판단은 점수에서 분리하거나 별도 `notes` 필드로 이동
- 재시도가 발생하면 `verification_rigor` 점수는 자동으로 감점 (재시도 = 품질 저하 신호)

**관련 페이즈:** Phase 6 (검증), 최종 보고서

---

## 경미한 함정 (Minor Pitfalls)

---

### Pitfall 10: cwd 가정 실패 — 스킬이 다른 프로젝트에서 실행될 때 증거 수집 경로 오류

**무엇이 잘못되는가:**
SKILL.md는 `cwd`가 항상 대상 프로젝트라고 가정하지만, inchan-plugins 자체 디렉토리에서 실수로 실행하거나, 서브모듈 구조에서 cwd가 예상과 다를 수 있다.

**예방:**
- 워크플로우 INIT 단계에서 `cwd` 확인 로그 출력: `[INFO] [INIT] Working directory: <cwd>`
- 증거 수집 시 상대경로 대신 `$PWD` 기반 절대경로 사용

**관련 페이즈:** Phase 1 (증거 수집)

---

### Pitfall 11: `workflow-result.json` 파일명 충돌 — 동일 프로젝트에서 반복 실행

**무엇이 잘못되는가:**
결과 파일을 `workflow-result.json`으로 고정하면 연속 실행 시 이전 결과를 덮어쓴다. 비교나 디버깅이 불가능해진다.

**예방:**
- 파일명에 타임스탬프 포함: `workflow-result-{YYYYMMDD-HHMMSS}.json`
- 또는 최신 결과는 `workflow-result-latest.json`, 히스토리는 `workflow-results/` 디렉토리에 보관

**관련 페이즈:** 최종 보고서 저장

---

### Pitfall 12: 인증이 필요한 URL에서 브라우저 자동화 중단

**무엇이 잘못되는가:**
실제 프로젝트의 UI 버그는 로그인 후 페이지에서 발생하는 경우가 많다. Playwright가 로그인 상태 없이 빈 화면이나 로그인 페이지를 스크린샷으로 캡처해 "재현 성공"으로 잘못 기록한다.

**예방:**
- 브라우저 세션에서 HTTP 응답 코드 확인 (401, 403 → `E_BROWSER` + 경고)
- 로그인 페이지 감지 패턴 추가: URL에 `login`, `signin`, `auth`가 있거나 타이틀에 "Login" 포함 시 경고
- 사용자에게 인증 필요 여부를 INIT 단계에서 물어보거나 환경 변수로 쿠키/세션 전달 지원

**관련 페이즈:** Phase 1 (브라우저 재현), Phase 6 (시각적 검증)

---

## 페이즈별 위험 매핑

| 페이즈 | 가장 위험한 함정 | 완화 방법 |
|--------|----------------|----------|
| Phase 1 (증거 수집) | Shadow DOM 조용한 실패 (Pitfall 4) | interaction_confirmed 필드 + 실패 시 명시적 에러 |
| Phase 2 (분류) | 낮은 신뢰도 → 잘못된 전략 (Pitfall 5) | 불확실 시 양방향 탐색 |
| Phase 3 (탐색) | 병렬 에이전트 파일 충돌 (Pitfall 2) | 읽기 전용 에이전트 설계 |
| Phase 4 (계획) | 대안 접근법 정의 누락 → 재시도 전략 실패 (Pitfall 3) | 계획에 "대안 접근법" 섹션 필수화 |
| Phase 5 (구현) | 재시도 시 이전 변경 누적 오염 (Pitfall 7) | 재시도 전 변경 롤백 |
| Phase 6 (검증) | 자가 보고 점수의 편향 (Pitfall 9) | 결정론적 지표만 점수에 반영 |
| 전체 | SKILL.md 비대화로 컨텍스트 압력 (Pitfall 1) | references/ 분리 구조 유지 |

---

## 이 프로젝트에 이미 올바르게 처리된 사항

(함정 발생 전 예방 조치가 설계에 내재됨)

- **references/ 분리 구조** — Pitfall 1 예방. SKILL.md는 오케스트레이션만, 상세는 references에
- **브라우저 도구 폴백 체인** — Pitfall 4 부분 완화. Playwright → Chrome DevTools → agent-browser → Code Analysis
- **`--type` 오버라이드** — Pitfall 5 완화. 분류 불확실 시 사용자가 명시 가능
- **description 트리거 키워드** — Pitfall 8 예방. frontmatter에 명확한 트리거 조건 명시
- **재시도별 전략 차별화 테이블** — Pitfall 3 부분 완화. 단, "완전 전환"의 구체적 기준이 더 명확해야 함

---

## 출처

- [Claude Agent Skills: A First Principles Deep Dive](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/) — 컨텍스트 인젝션 토큰 오버헤드, 동시성 안전성 문제 (HIGH confidence)
- [Why less is more: The Playwright proliferation problem](https://www.speakeasy.com/blog/playwright-tool-proliferation) — 26개 도구 노출 문제, 의사결정 마비 (HIGH confidence)
- [Multi-agent workflows often fail — GitHub Blog](https://github.blog/ai-and-ml/generative-ai/multi-agent-workflows-often-fail-heres-how-to-engineer-ones-that-dont/) — 비구조화 통신, 암묵적 상태 가정 (HIGH confidence)
- [LLM-based Agents for Automated Bug Fixing (arXiv)](https://arxiv.org/html/2411.10213v2) — 버그 재현 품질 의존성, 패치 완전성 검증 실패 (HIGH confidence)
- [Extend Claude with skills — Claude Code Docs](https://code.claude.com/docs/en/skills) — SKILL.md 공식 구조 (HIGH confidence)
- [I Watched 100+ People Hit the Same Claude Skills Problems](https://natesnewsletter.substack.com/p/i-watched-100-people-hit-the-same) — 실제 사용자 공통 실수 (MEDIUM confidence)
- [Claude Code issues — anthropics/claude-code #22758](https://github.com/anthropics/claude-code/issues/22758) — 재시도 루프 무한 반복 실사례 (HIGH confidence)
