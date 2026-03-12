# Architecture Patterns

**Domain:** Claude Code SKILL.md 기반 멀티페이즈 자동화 워크플로우 스킬
**Researched:** 2026-03-12
**Source:** 레포지토리 내 기존 구현체 직접 분석 (HIGH confidence)

---

## 권장 아키텍처

이 프로젝트는 greenfield가 아니라, **이미 동작하는 구현체**가 존재한다.
`plugins/ticket-workflow/` (v0.2) 와 `plugins/wf/skills/ticket-workflow/` (v0.3)가 공존하며,
v0.3이 더 완성도 높은 최신 버전이다.

### 전체 플러그인 구조

```
plugins/ticket-workflow/
├── commands/
│   └── ticket.md            # /ticket 명령 진입점 (Claude Code slash-command)
├── skills/
│   └── ticket-workflow/
│       ├── SKILL.md         # 스킬 메인 정의 (트리거, 개요, 전체 절차)
│       └── references/      # 상세 참조 문서 (스킬이 읽고 따르는 문서들)
│           ├── phase-orchestrator.md
│           ├── classification.md
│           ├── scoring.md
│           ├── workflow-logger.md
│           ├── browser-automation.md
│           └── phases/
│               ├── evidence-collection.md
│               ├── exploration.md
│               ├── planning.md
│               ├── implementation.md
│               └── verification.md
├── agents/
│   ├── evidence-searcher.md   # 병렬 증거 수집 에이전트
│   ├── bug-tracer.md          # 병렬 코드 분석 에이전트
│   ├── planner.md             # 구현 계획 에이전트
│   ├── implementer.md         # 구현 에이전트
│   ├── verifier.md            # 검증 에이전트
│   ├── browser-reproducer.md  # UI 재현 에이전트
│   └── evidence-collector.md  # 증거 수집 보조 에이전트
└── lib/
    └── schemas/
        └── classification.md  # 분류 출력 스키마 정의
```

---

## SKILL.md 구조 — 핵심 컴포넌트

Claude Code SKILL.md의 구성요소는 다음과 같다.

### 1. YAML Frontmatter (메타데이터)

```yaml
---
name: ticket-workflow
description: >
  [트리거 문구 열거 — Claude가 자동으로 이 스킬을 발동할 조건]
version: 0.3.0
---
```

- `description`이 **트리거 인식 키워드** 역할을 한다.
- Claude는 사용자 입력이 description과 의미적으로 일치하면 스킬을 자동 실행한다.
- `name`은 `/name` slash-command 경로가 된다.

### 2. 개요(Overview) 섹션

- 스킬이 수행하는 단계를 번호 목록으로 나열
- 각 단계의 한 줄 설명 포함
- 스킬 실행 조건(When This Skill Applies) 명시

### 3. 페이즈별 절차 섹션

각 페이즈는 독립 섹션으로 분리되며 다음을 포함한다.

| 항목 | 역할 |
|------|------|
| 에이전트 디스패치 명세 | 어떤 에이전트를 몇 개 어떻게 실행할지 |
| 액션 목록 | 이 페이즈에서 수행할 구체적 단계 |
| Produces | 이 페이즈가 생성하는 출력 데이터 |
| 참조 링크 | 상세 절차가 담긴 references/ 문서 |

### 4. 오케스트레이션 섹션

- 상태 기계(state machine) 다이어그램 (ASCII)
- 컨트롤 플로우 규칙 목록 (번호 매긴 불변 조건)
- 재시도 로직 의사코드

### 5. 에러 처리 & 로깅 섹션

- 로그 포맷 명세: `[LEVEL] [PHASE] +M:SS — message`
- 에러 코드 표 (`E_TOOL`, `E_NOTFOUND`, 등)
- 참조 문서 링크

### 6. 사용법(Usage) & 출력(Output) 섹션

- slash-command 호출 예시
- 결과 출력 위치(콘솔, 파일)

### 7. 참조 문서 인덱스(Reference Documents)

- references/ 하위 문서 전체 목록 및 역할 설명
- SKILL.md는 "무엇을" 정의하고, references/는 "어떻게"를 정의하는 분리 구조

---

## 컴포넌트 경계

| 컴포넌트 | 책임 | 통신 대상 |
|----------|------|-----------|
| `commands/ticket.md` | 진입점. 인자 파싱, 오케스트레이션 시작, 최종 보고서 출력 | SKILL.md, references/phase-orchestrator.md |
| `skills/ticket-workflow/SKILL.md` | 스킬 자동 발동 트리거 정의, 6단계 절차 전체 개요, 에이전트 디스패치 명세 | references/, agents/, lib/schemas/ |
| `references/phase-orchestrator.md` | 상태 기계, 페이즈 전환 규칙, 재시도 로직, 페이즈 간 계약(Input/Output) | workflow-logger.md, scoring.md |
| `references/phases/*.md` | 각 페이즈의 상세 실행 절차 (방법론적 세부사항) | agents/, lib/schemas/ |
| `references/classification.md` | UI vs Non-UI 분류 알고리즘 (7가지 신호 차원) | lib/schemas/classification.md |
| `references/browser-automation.md` | Playwright MCP / Chrome DevTools / agent-browser 통합 | 외부 MCP 툴 |
| `references/scoring.md` | 프로그레스 바 시각화, 품질 점수 산정 방식 | — |
| `references/workflow-logger.md` | 로그 포맷, 에러 코드, 에러 결정 트리 | — |
| `agents/evidence-searcher.md` | 코드베이스 증거 수집 (Glob, Grep, Read, Bash) | 코드베이스 파일 시스템 |
| `agents/bug-tracer.md` | 실행 경로 추적, 유사 패턴 탐색 | 코드베이스 파일 시스템 |
| `agents/planner.md` | 구현 계획 생성, 접근법 선택 | 코드베이스 파일 시스템 |
| `agents/browser-reproducer.md` | UI 이슈 브라우저 재현, 스크린샷 캡처 | Playwright MCP |
| `lib/schemas/classification.md` | 분류 출력 구조 정의 (JSON 스키마) | — |

---

## 데이터 흐름

### 순방향 데이터 흐름 (정상 경로)

```
사용자 입력 (티켓 텍스트/URL)
    │
    ▼ [INIT]
ticket_input { raw_text, type_override }
    │
    ▼ [Phase 1: EVIDENCE]  ← 2x evidence-searcher 병렬
evidence_report {
  summary, affected_files[], error_patterns[],
  reproduction_result, git_history[], evidence_quality_score
}
    │
    ▼ [Phase 2: CLASSIFY]
classification {
  ticket_type: "ui"|"non-ui",
  confidence: 0.0-1.0,
  classification_signals[],
  ui_details: UIDetails|null
}
    │         ← 분기점: ticket_type이 이후 모든 단계에 영향
    ▼ [Phase 3: EXPLORE]  ← 2-3x bug-tracer 병렬 (UI면 +Agent C)
exploration {
  root_cause, code_flow[], related_patterns[],
  test_coverage[], affected_files_deep[]
}
    │
    ▼ [Phase 4: PLAN]
implementation_plan {
  approach: "minimal"|"robust",
  changes: PlannedChange[],
  verification_strategy,
  risks[], planning_quality_score
}
    │
    ▼ [Phase 5: IMPLEMENT]
implementation {
  modified_files[], tests_added[],
  change_summary, implementation_quality_score
}
    │
    ▼ [Phase 6: VERIFY]  ← UI면 Playwright MCP / Chrome DevTools 추가
verification_result {
  status: "pass"|"fail",
  attempt: 1-3,
  test_results[],
  visual_comparison: VisualResult|null,
  verification_quality_score
}
    │
    ├── PASS → DONE → 최종 보고서 + workflow-result.json
    └── FAIL → retry (최대 3회) → Phase 5로 failure_context 전달
```

### 재시도 데이터 흐름 (검증 실패 시)

```
Phase 6 FAIL
    │
    ▼ retry_context {
        attempt: N,
        failure_reason: string,
        failed_test: string,
        previous_changes: ModifiedFile[]
      }
    │
    ▼ Phase 5 (targeted correction, NOT full reimplementation)
    │
    ▼ Phase 6 (full verification re-run)
    │
    ├── PASS → DONE
    └── FAIL (attempt 3) → FAILED → 실패 보고서
```

### 불변 원칙

- Phase 1-4 출력은 재시도 중에도 변경되지 않는다 (immutable history)
- Phase 6 실패 시 Phase 5만 재실행한다 (재시도 범위 최소화)
- ticket_type은 Phase 2 이후 항상 non-null이다
- 전체 진행률은 단조 증가한다 (재시도로 낮아지지 않음)

---

## 스킬 파일 관계 — 계층 구조

```
commands/ticket.md          ← 사용자 진입점 (slash-command)
    │ reads
    ▼
skills/ticket-workflow/SKILL.md  ← 트리거 + 전체 절차 개요
    │ references
    ├── references/phase-orchestrator.md  ← 상태 기계 (핵심 제어 로직)
    ├── references/phases/
    │   ├── evidence-collection.md
    │   ├── exploration.md
    │   ├── planning.md
    │   ├── implementation.md
    │   └── verification.md
    ├── references/classification.md
    ├── references/scoring.md
    ├── references/workflow-logger.md
    └── references/browser-automation.md
    │
    │ dispatches agents
    ├── agents/evidence-searcher.md (x2 parallel)
    ├── agents/bug-tracer.md (x2-3 parallel)
    ├── agents/planner.md
    ├── agents/implementer.md
    ├── agents/verifier.md
    └── agents/browser-reproducer.md (UI only)
    │
    │ uses schema
    └── lib/schemas/classification.md
```

---

## 따라야 할 패턴

### Pattern 1: SKILL.md + References 분리

**What:** SKILL.md는 "무엇을(What)"만 정의하고, 상세 절차는 references/ 하위 파일에 위임한다.

**When:** 스킬 로직이 길어질 때, 페이즈별 절차가 복잡할 때.

**Example:**
```markdown
## Phase 1: Evidence Collection

Read & follow `references/phases/evidence-collection.md`.

**Agent dispatch**: Launch 2 `evidence-searcher` agents in parallel
**Produces**: `evidence_report`, `affected_files`, `evidence_quality_score`

**▸ Log transition, render scorecard, proceed to Phase 2**
```

### Pattern 2: Agent.md — 역할 특화 에이전트

**What:** 각 에이전트는 독립 .md 파일로 정의. YAML frontmatter에 `tools:`, `model:`, `color:` 설정.

**When:** 병렬 실행이 필요한 단위 작업(증거 수집, 코드 추적 등).

**Example:**
```yaml
---
name: evidence-searcher
tools: Glob, Grep, Read, Bash
model: sonnet
color: cyan
---
```

### Pattern 3: 페이즈 계약 (Phase Contract)

**What:** 각 페이즈는 순수 함수처럼 동작. 입력 타입과 출력 타입이 명시적으로 정의됨.

**When:** 멀티페이즈 워크플로우에서 페이즈 간 결합도를 낮출 때.

### Pattern 4: 상태 기계(State Machine)

**What:** 워크플로우 상태를 명시적으로 정의. 전환 조건, 종료 조건, 재시도 범위를 ASCII 다이어그램으로 표현.

**When:** 조건 분기와 재시도가 있는 워크플로우.

### Pattern 5: 점수 시스템 + 프로그레스 바

**What:** 각 페이즈는 0.0-1.0 품질 점수를 생성. 페이즈 경계마다 시각적 scorecard 렌더링.

**When:** 사용자에게 진행 상황을 실시간으로 보여줄 때.

---

## 피해야 할 안티패턴

### Anti-Pattern 1: SKILL.md 비대화

**What:** 모든 상세 절차를 SKILL.md 한 파일에 넣는 것.

**Why bad:** 파일이 너무 길어지면 Claude의 컨텍스트 윈도우를 불필요하게 소비하고, 유지보수가 어려워진다.

**Instead:** SKILL.md는 개요만, 세부는 references/에 위임.

### Anti-Pattern 2: 페이즈 스킵 허용

**What:** 빠른 처리를 위해 일부 페이즈를 건너뛰는 로직 작성.

**Why bad:** 중간 페이즈의 출력이 이후 페이즈의 입력으로 사용됨. 스킵하면 데이터 의존성이 깨짐.

**Instead:** 모든 페이즈는 항상 실행. 빠른 경로가 필요하면 페이즈 내에서 최소 실행 모드를 구현.

### Anti-Pattern 3: 재시도 범위 확장

**What:** 검증 실패 시 Phase 1-4까지 재실행.

**Why bad:** 증거, 분류, 탐색, 계획은 원인 분석이 완료된 결과다. 재실행해도 새로운 정보를 얻기 어렵고 비효율적.

**Instead:** Phase 5(구현)만 targeted correction으로 재실행. Phase 1-4 출력은 불변.

### Anti-Pattern 4: 에이전트 직렬 실행

**What:** evidence-searcher, bug-tracer 등을 순차 실행.

**Why bad:** 병렬 실행 가능한 독립 탐색 작업을 직렬화하면 전체 실행 시간이 증가.

**Instead:** 동일 페이즈 내 에이전트는 병렬 실행 (Phase 1: 2x 병렬, Phase 3: 2-3x 병렬).

---

## 빌드 순서 (Build Order)

컴포넌트 의존성 기반 추천 빌드 순서.

### 1단계: 기반 인프라 (다른 모든 것이 의존)

```
lib/schemas/classification.md
references/workflow-logger.md
references/scoring.md
```

이유: 분류 스키마와 로깅 포맷은 모든 페이즈에서 참조된다.

### 2단계: 에이전트 정의

```
agents/evidence-searcher.md
agents/bug-tracer.md
agents/planner.md
agents/browser-reproducer.md
agents/implementer.md
agents/verifier.md
```

이유: 에이전트는 서로 독립적이므로 병렬 개발 가능. 단, Phase orchestrator보다 먼저 정의되어야 한다.

### 3단계: 페이즈 참조 문서

```
references/classification.md        (Phase 2 알고리즘)
references/phases/evidence-collection.md
references/phases/exploration.md
references/phases/planning.md
references/phases/implementation.md
references/phases/verification.md
references/browser-automation.md    (Phase 6 UI 경로)
```

이유: 각 페이즈 문서는 해당 에이전트와 스키마가 정의된 후 작성.

### 4단계: 오케스트레이터

```
references/phase-orchestrator.md
```

이유: 모든 페이즈 문서와 스키마가 정의된 후 전체 상태 기계 + 계약 명세 작성.

### 5단계: 스킬 진입점

```
skills/ticket-workflow/SKILL.md
commands/ticket.md
```

이유: references/ 전체가 완성된 후 SKILL.md와 command를 작성해야 정확한 참조 링크를 포함할 수 있다.

### 6단계: 플러그인 메타데이터

```
.claude-plugin/plugin.json  (혹은 marketplace.json 항목)
```

이유: 완성된 플러그인을 Claude Code 생태계에 등록.

---

## 버전 공존 현황

현재 두 버전이 공존하고 있다.

| 경로 | 버전 | 상태 |
|------|------|------|
| `plugins/ticket-workflow/` | v0.2.0 | 참조 문서 구조 완성, commands/agents 포함 |
| `plugins/wf/skills/ticket-workflow/SKILL.md` | v0.3.0 | Phase 2 분류 알고리즘 인라인 포함, 더 상세 |

v0.3이 v0.2의 SKILL.md를 대체하는 것으로 보이나, references/ 문서들은 v0.2 경로에만 존재한다.
로드맵은 두 경로를 통합하거나 명확히 분리하는 작업을 포함해야 한다.

---

## Sources

- `/Users/chans/workspace/inchan-plugins/plugins/ticket-workflow/skills/ticket-workflow/SKILL.md` (v0.2, 직접 분석)
- `/Users/chans/workspace/inchan-plugins/plugins/wf/skills/ticket-workflow/SKILL.md` (v0.3, 직접 분석)
- `/Users/chans/workspace/inchan-plugins/plugins/ticket-workflow/skills/ticket-workflow/references/phase-orchestrator.md` (직접 분석)
- `/Users/chans/workspace/inchan-plugins/plugins/ticket-workflow/commands/ticket.md` (직접 분석)
- `/Users/chans/workspace/inchan-plugins/plugins/ticket-workflow/agents/evidence-searcher.md` (직접 분석)
- `/Users/chans/workspace/inchan-plugins/plugins/ticket-workflow/lib/schemas/classification.md` (직접 분석)
- `/Users/chans/workspace/inchan-plugins/plugins/agent-delegation/skills/delegation/SKILL.md` (패턴 참조)
