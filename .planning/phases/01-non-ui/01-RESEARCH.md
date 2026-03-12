# Phase 1: 플러그인 구조 통합 + Non-UI 핵심 워크플로우 - Research

**Researched:** 2026-03-12
**Domain:** Claude Code 플러그인 마크다운 명세 / 에이전트 오케스트레이션 / 상태 머신 워크플로우
**Confidence:** HIGH (기존 구현체 직접 분석 기반)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**통합 전략**
- v0.3(`plugins/wf/`) SKILL.md를 base로 사용 — 더 상세한 분류 알고리즘 포함
- v0.2(`plugins/ticket-workflow/`)의 에이전트 정의(6개 .md), references/(phase-orchestrator, classification, scoring, phases/), commands/ticket.md를 wf/로 이전
- 통합 완료 후 `plugins/ticket-workflow/` 구 경로는 제거
- SKILL.md 500줄 이하 유지, 상세 로직은 모두 `references/`로 위임

**Python lib 처리**
- Python 코드(classifier.py, workflow_state.py 등)는 포함하지 않음 — SKILL.md는 순수 마크다운 명세이며, Claude Code가 런타임에 Bash/도구를 직접 실행
- 분류 로직, 상태 관리, 증거 수집은 references/ 마크다운으로 에이전트에게 지시
- Python 테스트 파일들의 검증 시나리오는 references/에 테스트 기대치로 반영

**에이전트 구조**
- 6개 에이전트 유지: evidence-searcher, bug-tracer, planner, implementer, verifier, browser-reproducer(Phase 2용 스텁)
- evidence-searcher x2 병렬, bug-tracer x2-3 병렬은 SKILL.md에서 명시적 지시
- 서브에이전트 중첩 불가 제약 → SKILL.md 레벨에서 병렬화 조율

**재시도 전략 상세**
- Attempt 1 (full): 원래 계획 그대로 전체 구현 + 검증
- Attempt 2 (targeted): 실패 원인 분석 후 해당 부분만 수정. 이전 구현의 정상 부분은 유지
- Attempt 3 (relaxed): 접근 방식 자체를 변경. 다른 파일/함수를 수정하거나 우회 전략 적용
- 각 재시도 시작 시 이전 실패 원인을 명시적으로 로그

**분류 시스템**
- 7가지 신호 기반 분류: 키워드, 파일 경로, 에러 유형, 스택트레이스, 재현 단계, 첨부파일, 컴포넌트 언급
- 신뢰도 점수 0.0~1.0 산출
- `--type` 플래그로 수동 오버라이드 가능 (신뢰도 1.0)
- 분류 결과가 Phase 3 이후 모든 경로에 영향

### Claude's Discretion
- 구체적인 에이전트 프롬프트 내용과 도구 허용 목록
- references/ 파일 분리 세분화 수준
- 상태 머신 전환 시 정확한 출력 포맷
- 에러 코드 체계 설계 (E_TOOL, E_VERIFY 등)
- Graceful degradation 규칙 상세

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLUG-01 | plugins/wf/ 디렉토리에 표준 플러그인 구조로 배치 (.claude-plugin/plugin.json + skills/ + agents/) | agent-delegation 플러그인이 표준 구조 레퍼런스로 존재. wf/ 이미 SKILL.md 보유 |
| PLUG-02 | SKILL.md는 500줄 이하 유지하고 상세 로직은 references/로 위임 | v0.2 SKILL.md 130줄 (간결), v0.3 SKILL.md 378줄 (상세 분류 포함). references/에 7개 파일 완비 |
| PLUG-03 | 기존 v0.2/v0.3 구현을 통합하여 단일 버전으로 정리 | v0.2: agents/7개 + references/8개 + commands/1개 완비. v0.3: SKILL.md만 존재. 병합 전략 명확 |
| CORE-01 | 사용자가 텍스트로 입력한 티켓을 파싱하여 버그 설명을 추출 | commands/ticket.md INIT 섹션에 파싱 로직 완비 (text/markdown/JSON/URL 자동 감지) |
| CORE-02 | 코드베이스에서 관련 파일/함수를 증거로 수집 (Glob/Grep/Read) | evidence-searcher.md 에이전트 완비, evidence-collection.md 상세 절차 완비 |
| CORE-03 | 수집된 증거를 기반으로 근본 원인을 탐색 (병렬 에이전트) | bug-tracer.md 에이전트 완비, exploration.md 상세 절차 완비. 2-3x 병렬 지시 패턴 확립 |
| CORE-04 | 근본 원인 분석을 바탕으로 수정 계획을 수립 | planning.md 상세 절차 완비 (minimal/robust 접근, 리스크 평가) |
| CORE-05 | 수정 계획에 따라 코드를 자동으로 수정 | implementer.md 에이전트 완비, implementation.md 상세 절차 완비 |
| CORE-06 | 테스트 실행으로 수정이 동작하는지 검증 | verifier.md 에이전트 완비, verification.md Non-UI 검증 절차 완비 |
| CORE-07 | 검증 실패 시 최대 3회 재시도, 매회 원인 분석 후 전략 변경 (full → targeted → relaxed) | phase-orchestrator.md 재시도 루프 완비. CONTEXT.md에서 3단계 전략 상세 확정 |
| CORE-08 | 워크플로우 단계가 순차적으로 실행 (증거수집 → 탐색/계획/구현 → 검증) | 상태 머신 INIT→EVIDENCE→CLASSIFY→EXPLORE→PLAN→IMPLEMENT→VERIFY→DONE 완비 |
| CLSF-01 | 티켓 내용을 분석하여 UI/로직/기능/리팩토링/성능 유형으로 자동 분류 | v0.3 SKILL.md에 7차원 신호 분류 알고리즘 완비. classification.md에 상세 규칙 완비 |
| CLSF-02 | 분류 신뢰도 점수를 산출 (0.0~1.0) | classification 알고리즘에 ui_ratio 기반 신뢰도 산출 공식 완비 |
| CLSF-03 | 분류 결과에 따라 이후 워크플로우 경로가 분기 (UI vs Non-UI) | phase-orchestrator.md Rule 6 Type-Dependent Branching 완비 |
</phase_requirements>

---

## Summary

Phase 1의 핵심 작업은 새로운 코드 작성보다 **기존 v0.2/v0.3 구현체의 병합**이다. v0.2(`plugins/ticket-workflow/`)에는 에이전트 7개, references 8개, commands 1개로 구성된 완전한 워크플로우 구현이 존재한다. v0.3(`plugins/wf/`)에는 더 상세한 7차원 분류 알고리즘을 담은 SKILL.md 하나만 존재한다. 통합 전략은 v0.3 SKILL.md를 base로 하고, v0.2의 나머지 에셋을 `plugins/wf/`로 이전하는 것이다.

가장 중요한 아키텍처 결정은 **Python 코드를 완전히 제거**하는 것이다. `plugins/ticket-workflow/lib/`에는 classifier.py, workflow_state.py 등 Python 구현체가 존재하지만, Claude Code 플러그인은 런타임에 Bash/도구를 직접 실행하는 마크다운 명세 방식으로 동작한다. Python 코드는 이전 설계 접근법의 잔재이며 이번 Phase에서 제거된다. 대신 해당 로직은 references/ 마크다운 문서로 대체된다.

Non-UI 완전 자동 실행을 위해서는 `commands/ticket-workflow.md`(슬래시 커맨드 진입점)가 새로 필요하다. 기존 `commands/ticket.md`는 `/ticket` 커맨드이지만 성공 기준에서는 `/ticket-workflow` 커맨드를 요구한다. 또한 v0.3 SKILL.md의 분류 알고리즘은 Phase 2 성공 기준인 "UI/로직/기능/리팩토링/성능 유형 분류"를 지원하도록 확장이 필요하다 — 현재는 UI vs Non-UI 이분법만 존재한다.

**Primary recommendation:** v0.2 에셋을 wf/로 이전 + v0.3 분류 알고리즘 병합 + Python lib 제거 + ticket-workflow 커맨드 추가 순서로 진행한다.

---

## Standard Stack

### Core

| 요소 | 버전/형식 | 목적 | 표준인 이유 |
|------|----------|------|------------|
| SKILL.md | YAML frontmatter + 마크다운 | 스킬 진입점 및 오케스트레이션 명세 | Claude Code 플러그인 생태계 표준 형식 |
| agents/*.md | YAML frontmatter + 마크다운 | 서브에이전트 역할/도구/프롬프트 정의 | agent-delegation 플러그인과 동일 패턴 |
| commands/*.md | YAML frontmatter + 마크다운 | 슬래시 커맨드 바인딩 및 진입점 | ticket.md, delegate.md 기존 패턴 |
| references/*.md | 순수 마크다운 | 상세 로직 위임 (SKILL.md 경량 유지) | v0.2 references/ 8개 파일 패턴 |
| .claude-plugin/plugin.json | JSON | 플러그인 등록 메타데이터 | agent-delegation plugin.json과 동일 구조 |

### Supporting

| 요소 | 형식 | 목적 | 사용 시점 |
|------|------|------|----------|
| lib/schemas/classification.md | 마크다운 스키마 | 분류 출력 구조 정의 | classification 단계에서 출력 포맷 참조 |
| references/phases/*.md | 마크다운 | 각 페이즈별 상세 절차 | 각 페이즈 실행 시 에이전트가 참조 |

### Alternatives Considered

| 표준 | 대안 | 트레이드오프 |
|------|------|------------|
| 마크다운 명세 | Python lib (classifier.py 등) | Python은 Claude Code 플러그인과 맞지 않음 — SKILL.md가 주 실행 경로 |
| references/ 위임 | SKILL.md 단일 파일 | 500줄 제약 충족 불가, 유지보수 어려움 |

---

## Architecture Patterns

### 권장 프로젝트 구조

```
plugins/wf/
├── .claude-plugin/
│   └── plugin.json              # 플러그인 등록 (name, version, description, author)
├── agents/
│   ├── evidence-searcher.md     # Phase 1: 증거 수집 (tools: Glob, Grep, Read, Bash)
│   ├── bug-tracer.md            # Phase 3: 버그 추적 (tools: Glob, Grep, Read, Bash)
│   ├── planner.md               # Phase 4: 수정 계획 수립
│   ├── implementer.md           # Phase 5: 코드 수정 (tools: Bash, Read, Edit, Write, Glob, Grep)
│   ├── verifier.md              # Phase 6: 검증 (tools: Bash, Read, Glob, Grep)
│   └── browser-reproducer.md    # Phase 2용 스텁 (Phase 2에서 완성)
├── commands/
│   └── ticket-workflow.md       # /ticket-workflow 슬래시 커맨드 (신규 생성)
└── skills/
    └── ticket-workflow/
        ├── SKILL.md             # 스킬 진입점 (500줄 이하)
        └── references/
            ├── phase-orchestrator.md   # 상태 머신, 제어 흐름, 재시도 로직
            ├── classification.md       # Phase 2 분류 규칙 (v0.3 알고리즘)
            ├── workflow-logger.md      # 로깅, 에러 처리, 상태 리포팅
            ├── scoring.md             # 진행 시각화
            ├── browser-automation.md  # Phase 2용 스텁
            └── phases/
                ├── evidence-collection.md
                ├── exploration.md
                ├── planning.md
                ├── implementation.md
                └── verification.md
```

### Pattern 1: SKILL.md YAML Frontmatter 패턴

**What:** SKILL.md 파일 상단에 name, description, version을 YAML frontmatter로 정의
**When to use:** 모든 SKILL.md 파일 생성 시

```yaml
---
name: ticket-workflow
description: This skill should be used when the user mentions "bug ticket",
  "ticket workflow", "process ticket", "fix ticket", "bug fix workflow",
  "UI bug", "visual bug", "non-UI bug", "API bug", or wants to systematically
  process a bug report through evidence collection, classification, exploration,
  planning, implementation, and verification phases with visual scoring.
version: 1.0.0
---
```

### Pattern 2: Agent 정의 YAML Frontmatter 패턴

**What:** agents/*.md 파일에 name, description, tools, model, color를 정의
**When to use:** 모든 에이전트 파일 생성 시

```yaml
---
name: evidence-searcher
description: Searches codebase for evidence related to a bug ticket by finding
  error patterns, affected files, and git history. Returns structured findings
  with key file paths.
tools: Glob, Grep, Read, Bash
model: sonnet
color: cyan
---
```

### Pattern 3: Commands 파일 패턴

**What:** commands/*.md에 description, argument-hint, allowed-tools를 정의하고 실행 절차 기술
**When to use:** 슬래시 커맨드 정의 시

```yaml
---
description: "Process a bug ticket through evidence collection, classification,
  exploration, planning, implementation, and verification phases"
argument-hint: "[--type ui|non-ui] <ticket description or URL>"
allowed-tools: Bash, Read, Edit, Write, Glob, Grep, Agent, WebFetch, WebSearch
---
```

### Pattern 4: 상태 머신 전환 패턴

**What:** 8개 상태를 순차적으로 진행하며 각 경계에서 스코어카드를 렌더링
**When to use:** Phase 오케스트레이션 구현 시

```
INIT → EVIDENCE → CLASSIFY → EXPLORE → PLAN → IMPLEMENT → VERIFY → DONE
                                                    ↑          │
                                                    └── retry ──┘ (max 3x)
```

각 전환 시:
1. `[INFO] [WORKFLOW] +<time> — Phase transition: <FROM> → <TO>` 로그
2. 스코어카드 렌더링
3. 이전 페이즈 출력을 다음 페이즈 입력으로 전달

### Pattern 5: 재시도 전략 분기 패턴

**What:** 검증 실패 시 3단계 전략으로 재시도
**When to use:** VERIFY 페이즈 실패 시

```
Attempt 1 (full): 원래 계획 그대로 전체 구현 + 검증
  ↓ FAIL → [WARN] [VERIFY] — Attempt 1/3 failed: <reason>. Retry strategy: targeted
Attempt 2 (targeted): 실패 원인 분석, 해당 부분만 수정. 정상 부분 유지
  ↓ FAIL → [WARN] [VERIFY] — Attempt 2/3 failed: <reason>. Retry strategy: relaxed
Attempt 3 (relaxed): 접근 방식 변경. 다른 파일/함수 수정 또는 우회 전략
  ↓ FAIL → [ERROR] [VERIFY] — All attempts exhausted → FAILED
```

### Pattern 6: 병렬 에이전트 디스패치 패턴

**What:** SKILL.md에서 동일 에이전트를 복수로 병렬 실행 지시
**When to use:** 증거 수집(Phase 1), 탐색(Phase 3)

```markdown
**Agent dispatch**: Launch 2 `evidence-searcher` agents in parallel:
- Agent A: Search for error patterns and affected source files
- Agent B: Check git history and find related components/modules
```

### Anti-Patterns to Avoid

- **Python 코드 포함:** lib/*.py는 Claude Code 플러그인 실행 경로가 아님. 마크다운 명세로 대체
- **SKILL.md 500줄 초과:** 상세 로직은 반드시 references/로 위임
- **에이전트 중첩 호출:** 서브에이전트에서 추가 에이전트 호출 불가. SKILL.md 레벨에서 병렬화 조율
- **Phase 1-4 재실행:** 재시도 루프는 IMPLEMENT→VERIFY만 해당. Phase 1-4 출력은 불변

---

## Don't Hand-Roll

| 문제 | 직접 구현 금지 | 사용할 것 | 이유 |
|------|--------------|----------|------|
| 분류 알고리즘 | 신규 분류 로직 작성 | v0.3 SKILL.md의 7차원 신호 알고리즘 | 이미 완성된 상세 구현 존재 |
| 에이전트 프롬프트 | 새 에이전트 명세 작성 | v0.2 agents/*.md 6개 파일 | 완성된 에이전트 정의 이전만 필요 |
| 상태 머신 로직 | 새 오케스트레이션 설계 | v0.2 phase-orchestrator.md | 상태 다이어그램, 전환 규칙, 불변 조건 완비 |
| 에러 처리 체계 | 새 에러 코드 설계 | v0.2 workflow-logger.md | E_TOOL/E_NOTFOUND/E_VERIFY 등 완비 |
| 스코어카드 포맷 | 새 시각화 설계 | v0.2 scoring.md | ╔══╗ 박스 드로잉 포맷 완비 |
| Phase 상세 절차 | 새 Phase 명세 작성 | v0.2 references/phases/*.md 5개 | evidence-collection/exploration/planning/implementation/verification 완비 |

---

## Common Pitfalls

### Pitfall 1: /ticket vs /ticket-workflow 커맨드명 불일치

**What goes wrong:** 기존 v0.2의 커맨드는 `/ticket`이지만 성공 기준은 `/ticket-workflow`를 요구
**Why it happens:** v0.2 `commands/ticket.md`는 `/ticket` 바인딩. 성공 기준과 불일치
**How to avoid:** `commands/ticket-workflow.md`를 신규 생성하거나 기존 `ticket.md`를 복사 후 커맨드명 변경
**Warning signs:** ticket.md의 frontmatter에 슬래시 커맨드명이 description 필드로 암묵적으로 정해짐

### Pitfall 2: v0.3 SKILL.md 분류 유형 vs 성공 기준 불일치

**What goes wrong:** v0.3 SKILL.md는 UI vs Non-UI 이분법. 성공 기준은 "UI/로직/기능/리팩토링/성능 5가지 유형"을 요구
**Why it happens:** CONTEXT.md의 분류 시스템 결정 사항에 7가지 신호 기반 분류가 있지만 유형은 UI/non-UI 이진 분류로 기술
**How to avoid:** 성공 기준 2항 "UI/로직/기능/리팩토링/성능 중 하나"를 non-UI 하위 유형으로 처리하거나, 분류 결과에 sub-type 필드 추가. 계획 단계에서 이 사항을 명확히 정의
**Warning signs:** REQUIREMENTS.md CLSF-01 "UI/로직/기능/리팩토링/성능 유형"과 v0.3의 이진 분류 간 불일치

### Pitfall 3: browser-reproducer 에이전트 Phase 1 완성 오류

**What goes wrong:** browser-reproducer.md가 Phase 2 기능을 이미 구현하려는 시도
**Why it happens:** v0.2의 evidence-collection.md가 브라우저 재현 절차를 상세히 정의함
**How to avoid:** browser-reproducer.md는 Phase 2용 스텁만 작성. evidence-collection.md에서 UI 재현 섹션은 "Phase 2 구현 예정" 주석으로 처리
**Warning signs:** browser-reproducer.md에 Playwright MCP 실행 코드나 스크린샷 캡처 로직 포함 시

### Pitfall 4: Python lib 참조 잔존

**What goes wrong:** references/*.md 파일 내 Python 모듈 참조가 남아있음 (예: `lib/browser_automation.py`)
**Why it happens:** v0.2 evidence-collection.md에 `BrowserAutomation 모듈 (lib/browser_automation.py)` 참조가 명시적으로 존재
**How to avoid:** 이전 시 references/*.md에서 `lib/*.py` 참조를 모두 제거하고 Claude Code 직접 실행 방식으로 대체
**Warning signs:** `lib/` 디렉토리 참조, Python import 문법, `.py` 파일 경로

### Pitfall 5: SKILL.md 줄 수 초과

**What goes wrong:** v0.3 SKILL.md가 378줄이고 v0.2 분류 알고리즘을 병합 시 500줄 초과 가능
**Why it happens:** v0.3 SKILL.md가 분류 알고리즘 상세 내용을 SKILL.md 본문에 직접 포함
**How to avoid:** v0.3 SKILL.md의 분류 알고리즘 상세 내용은 `references/classification.md`로 이동하고 SKILL.md에서는 요약만 유지. v0.2의 classification.md와 병합
**Warning signs:** SKILL.md가 400줄 이상으로 증가 시

### Pitfall 6: 재시도 시 Phase 1-4 출력 변경

**What goes wrong:** 검증 실패 재시도 시 증거 재수집이나 재분류를 시도
**Why it happens:** "더 많은 정보가 있으면 더 잘 고칠 수 있다"는 직관
**How to avoid:** phase-orchestrator.md Rule 3을 commands/ticket-workflow.md에 명시: "Phases 1-4 outputs remain immutable during retries"
**Warning signs:** retry_context에 re-evidence, re-classify 플래그 포함 시도

---

## Code Examples

### 슬래시 커맨드 파일 구조 (commands/ticket-workflow.md)

```yaml
---
description: "Process a bug ticket through evidence collection, classification,
  exploration, planning, implementation, and verification phases"
argument-hint: "[--type ui|non-ui] <ticket description or URL>"
allowed-tools: Bash, Read, Edit, Write, Glob, Grep, Agent, WebFetch, WebSearch
---

# /ticket-workflow — Bug Ticket Workflow Entry Point

Process a bug ticket through the automated 6-phase workflow.

**CRITICAL**: Follow the phase orchestrator state machine in
`skills/ticket-workflow/references/phase-orchestrator.md` for all
control flow decisions.

## Input

```
$ARGUMENTS
```
```

### 재시도 전략 변경 로그 패턴 (성공 기준 3항 충족)

```
[WARN ] [VERIFY    ] +5:20 — Attempt 1/3 failed: assertion error on margin-left
[INFO ] [VERIFY    ] +5:21 — Retry 2/3 — 전략: targeted
[INFO ] [IMPLEMENT ] +5:22 — Retry implementation (attempt 2/3)
[INFO ] [IMPLEMENT ] +5:22 — Failure context: assertion error on margin-left value
[INFO ] [IMPLEMENT ] +5:25 — Applying targeted fix to button.css:15

[WARN ] [VERIFY    ] +6:10 — Attempt 2/3 failed: z-index conflict
[INFO ] [VERIFY    ] +6:11 — Retry 3/3 — 전략: relaxed
[INFO ] [IMPLEMENT ] +6:12 — Retry implementation (attempt 3/3)
[INFO ] [IMPLEMENT ] +6:12 — Strategy changed: alternative approach, different files
```

### 분류 출력 구조 (Non-UI 예시)

```json
{
  "ticket_type": "non-ui",
  "confidence": 0.88,
  "ui_score": 0.7,
  "non_ui_score": 5.6,
  "signals": [
    "non_ui:backend(api, endpoint)",
    "non_ui:data_logic(calculation, exception)",
    "pattern:error_type",
    "file:backend(services/pricing/calculator.py)"
  ],
  "reasoning": "Classified as non-UI issue (non_ui_score=5.6 vs ui=0.7). Strong non-UI signals across 4 indicators."
}
```

### plugin.json 구조

```json
{
  "name": "wf",
  "version": "1.0.0",
  "description": "Automated bug ticket workflow: evidence collection, classification, exploration, planning, implementation, and verification with UI/non-UI classification",
  "author": {
    "name": "inchan",
    "email": "inchan@augmentedwe.com"
  }
}
```

---

## State of the Art

| 이전 접근 | 현재 접근 | 변경 이유 | 영향 |
|----------|----------|----------|------|
| Python lib (classifier.py 등) | 순수 마크다운 명세 | Claude Code 플러그인은 SKILL.md 기반 실행 | Python 코드 전체 제거 |
| /ticket 커맨드 | /ticket-workflow 커맨드 | 성공 기준에서 /ticket-workflow 명시 | commands/ 파일 신규 생성 필요 |
| v0.2/v0.3 분리 경로 | plugins/wf/ 단일 경로 | 관심사 분리, 단일 진실의 원천 | ticket-workflow/ 경로 제거 |
| 이진 분류 (UI/non-UI) | 7차원 신호 분류 + 이진 결과 | 더 정확한 신뢰도 산출 | classification.md 고도화 |

**Deprecated/outdated:**
- `plugins/ticket-workflow/lib/*.py`: Python 구현체 전체 — 마크다운 명세로 대체
- `plugins/ticket-workflow/` 경로: 통합 완료 후 제거

---

## Open Questions

1. **CLSF-01의 "로직/기능/리팩토링/성능" 유형 처리**
   - What we know: v0.3 분류는 UI vs Non-UI 이진 분류. 성공 기준은 5가지 유형 요구
   - What's unclear: non-UI 하위 유형(logic/feature/refactoring/performance)을 SKILL.md 레벨에서 구현할지, Phase 3 성공 기준 검증에서만 확인할지
   - Recommendation: 분류 결과에 optional `sub_type` 필드 추가. `ticket_type: "non-ui"` + `sub_type: "logic|feature|refactoring|performance"` 구조로 확장. confidence 산출에는 영향 없음

2. **browser-reproducer.md 스텁 수준**
   - What we know: Phase 2용으로 남겨야 함. evidence-collection.md에 브라우저 재현 절차 상세 내용 존재
   - What's unclear: Phase 1에서 browser-reproducer.md를 완전 빈 스텁으로 할지, 인터페이스 정의만 할지
   - Recommendation: YAML frontmatter + "Phase 2에서 구현 예정" 주석 + 향후 구현할 인터페이스 스케치만 포함

3. **구 ticket-workflow/ 경로 처리 시점**
   - What we know: 성공 기준 5항: "plugins/ticket-workflow/ 구 경로가 제거되거나 wf/로 통합 완료"
   - What's unclear: 4개 플랜 중 어느 플랜에서 삭제할지
   - Recommendation: 01-01 플랜(통합) 완료 후 삭제. ROADMAP 계획 순서대로 마지막에 처리

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | 없음 — 순수 마크다운 명세 프로젝트, 자동화 테스트 프레임워크 미존재 |
| Config file | 해당 없음 |
| Quick run command | 수동 검증: `/ticket-workflow "API returns 500 on empty payload"` |
| Full suite command | 성공 기준 5개 항목 체크리스트 수동 검증 |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLUG-01 | plugins/wf/ 표준 구조 파일 존재 | 구조 검증 | `find plugins/wf -type f \| sort` | ❌ Wave 0 |
| PLUG-02 | SKILL.md 500줄 이하 | 줄 수 검증 | `wc -l plugins/wf/skills/ticket-workflow/SKILL.md` | ❌ Wave 0 |
| PLUG-03 | ticket-workflow/ 제거 확인 | 경로 검증 | `ls plugins/ticket-workflow 2>&1` | ❌ Wave 0 |
| CORE-01 | /ticket-workflow 커맨드 실행 진입 | manual | `/ticket-workflow "API returns 500"` | ❌ Wave 0 |
| CORE-07 | 검증 실패 시 재시도 전략 변경 로그 | manual | 검증 실패 티켓으로 실행 후 로그 확인 | ❌ Wave 0 |
| CLSF-01 | 분류 결과 + 신뢰도 점수 출력 | manual | 분류 결과 콘솔 출력 확인 | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `find plugins/wf -type f | sort && wc -l plugins/wf/skills/ticket-workflow/SKILL.md`
- **Per wave merge:** 위 구조 검증 + SKILL.md 줄 수 검증 전체
- **Phase gate:** 성공 기준 5개 항목 체크리스트 수동 검증

### Wave 0 Gaps

- [ ] 구조 검증 스크립트 — PLUG-01, PLUG-02, PLUG-03 커버
- [ ] 자동화 테스트 프레임워크 없음 — 마크다운 명세 특성상 대부분 수동 검증

---

## Sources

### Primary (HIGH confidence)

- `/Users/chans/workspace/inchan-plugins/plugins/ticket-workflow/skills/ticket-workflow/SKILL.md` — v0.2 전체 워크플로우 구조
- `/Users/chans/workspace/inchan-plugins/plugins/wf/skills/ticket-workflow/SKILL.md` — v0.3 분류 알고리즘
- `/Users/chans/workspace/inchan-plugins/plugins/ticket-workflow/commands/ticket.md` — 커맨드 파일 패턴
- `/Users/chans/workspace/inchan-plugins/plugins/ticket-workflow/skills/ticket-workflow/references/phase-orchestrator.md` — 상태 머신 완전 명세
- `/Users/chans/workspace/inchan-plugins/plugins/ticket-workflow/agents/` — 6개 에이전트 정의
- `/Users/chans/workspace/inchan-plugins/plugins/agent-delegation/.claude-plugin/plugin.json` — 플러그인 JSON 구조 레퍼런스
- `/Users/chans/workspace/inchan-plugins/.planning/phases/01-non-ui/01-CONTEXT.md` — 확정된 구현 결정사항

### Secondary (MEDIUM confidence)

- `/Users/chans/workspace/inchan-plugins/.planning/REQUIREMENTS.md` — 요구사항 추적
- `/Users/chans/workspace/inchan-plugins/.planning/ROADMAP.md` — 플랜 분해 (01-01~01-04)

---

## Metadata

**Confidence breakdown:**
- 플러그인 구조: HIGH — agent-delegation, ticket-workflow 기존 구현체 직접 분석
- 통합 전략: HIGH — CONTEXT.md 확정 결정사항 기반
- 분류 알고리즘: HIGH — v0.3 SKILL.md 직접 분석
- 재시도 패턴: HIGH — phase-orchestrator.md + CONTEXT.md 재시도 전략 상세 확인
- CLSF-01 sub-type 처리: MEDIUM — 성공 기준과 현재 구현 간 불일치 발견, 해결 방향 제안

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (마크다운 명세 기반, 안정적)
