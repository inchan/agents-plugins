# Technology Stack

**Project:** ticket-workflow (wf plugin)
**Researched:** 2026-03-12
**Confidence:** HIGH (공식 문서 직접 검증 완료)

---

## 개요

이 스택은 Claude Code `SKILL.md` 형식의 플러그인 개발에 특화되어 있습니다.
"스택"이라 함은 외부 라이브러리가 아니라 **Claude Code 런타임이 제공하는 기능 조합**입니다.
코드를 작성하지 않고, 마크다운 + YAML frontmatter로 에이전트 동작을 명세합니다.

---

## 핵심 플랫폼 (변경 불가)

| 기술 | 버전 | 역할 | 근거 |
|------|------|------|------|
| Claude Code | ≥2.0.73 | 스킬 실행 런타임 | 공식 Chrome 연동 최소 버전 |
| SKILL.md | Agent Skills 표준 | 워크플로우 명세 | agentskills.io 오픈 스탠다드 |
| plugin.json | `.claude-plugin/` | 플러그인 메타데이터 | Claude Code 공식 명세 |

---

## 브라우저 자동화 스택

### 1순위: Playwright MCP (UI 재현/검증 핵심 도구)

```
claude mcp add playwright npx @playwright/mcp@latest
```

| 항목 | 값 |
|------|----|
| 패키지 | `@playwright/mcp` |
| 설치 | `npx @playwright/mcp@latest` (npx, 설치 불필요) |
| 제공자 | Microsoft (playwright-mcp, GitHub 28.7k stars) |
| 접근 방식 | 접근성 트리(Accessibility Tree) 기반 — 스크린샷 불필요 |
| 지원 브라우저 | Chrome, Firefox, WebKit, Edge |
| Claude Code 연동 | `claude mcp add playwright npx @playwright/mcp@latest` |
| 신뢰도 | HIGH (Microsoft 공식, Claude Code 공식 문서 명시) |

**왜 1순위인가:** LLM에 최적화된 구조화 데이터 제공. 비전 모델 없이 동작. 결정론적 자동화. 공식 Claude Code 통합 지원.

**코딩 에이전트 주의사항:** Microsoft 공식 README에서 "코딩 에이전트에는 Playwright CLI + SKILL이 더 토큰 효율적"이라고 명시. 단, 스크린샷 비교/시각적 검증에는 MCP 접근이 필수.

### 2순위: Claude in Chrome (공식 네이티브 통합, Beta)

```bash
claude --chrome   # 세션 시작 시 Chrome 활성화
/chrome           # 세션 내 Chrome 토글
```

| 항목 | 값 |
|------|----|
| 확장 프로그램 | Claude in Chrome (v1.0.36+) |
| 지원 브라우저 | Google Chrome, Microsoft Edge 전용 |
| 특징 | 로그인 세션 공유, 실시간 브라우저 조작 |
| 제약 | Beta. Brave/Arc 미지원. WSL 미지원. Bedrock/Vertex 미지원 |
| 신뢰도 | HIGH (Anthropic 공식) |

**왜 2순위인가:** 로그인이 필요한 앱, 스크린샷/GIF 녹화, 실제 브라우저 환경 검증에 적합. 단, Beta이고 제약이 있어 Playwright MCP 보조 역할.

### 3순위: Chrome DevTools MCP

```
claude mcp add chrome-devtools npx chrome-devtools-mcp@latest
```

| 항목 | 값 |
|------|----|
| 패키지 | `chrome-devtools-mcp` |
| 제공자 | Google ChromeDevTools 팀 공식 (GitHub) |
| 특징 | 성능 트레이싱, 네트워크 분석, DOM 접근, Console 읽기 |
| 보안 제약 | Chrome 136+에서 기본 프로필 원격 디버깅 차단. 별도 프로필 필요 |
| 신뢰도 | HIGH (Google 공식) |

**왜 3순위인가:** Playwright로 커버되지 않는 DevTools 레벨 디버깅(성능, 네트워크, 콘솔)에 특화. 크로스체크용.

---

## SKILL.md 구조 (핵심 명세)

### 필수 frontmatter 필드

```yaml
---
name: ticket-workflow          # 슬래시 커맨드명 (/ticket-workflow)
description: >                 # Claude가 자동 호출 여부 판단에 사용
  사용자가 "bug ticket", "티켓 처리" 등을 언급할 때...
version: 0.3.0                 # 선택. 버전 관리용
disable-model-invocation: true # 수동 호출만 원할 때 (자동 호출 방지)
allowed-tools: >               # 이 스킬 활성화 시 허용할 도구 목록
  Bash, Read, Write, Edit, Grep, Glob
context: fork                  # 서브에이전트로 실행 (격리 컨텍스트)
agent: general-purpose         # context: fork 시 사용할 에이전트 타입
---
```

### 지원 frontmatter 전체 목록 (2025 현재)

| 필드 | 타입 | 용도 |
|------|------|------|
| `name` | string | 슬래시 커맨드명 (kebab-case, 64자 제한) |
| `description` | string | Claude 자동 호출 판단 기준 |
| `argument-hint` | string | 자동완성 힌트 (예: `[issue-number]`) |
| `disable-model-invocation` | bool | true = 사용자 수동 호출만 허용 |
| `user-invocable` | bool | false = /메뉴에서 숨김 (Claude만 호출) |
| `allowed-tools` | string | 스킬 활성 시 자동 승인할 도구 |
| `model` | string | 이 스킬 활성 시 사용할 모델 |
| `context` | string | `fork` = 서브에이전트 격리 실행 |
| `agent` | string | fork 시 에이전트 타입 |
| `hooks` | object | 스킬 라이프사이클 훅 |

### 동적 컨텍스트 인젝션 (핵심 패턴)

```yaml
---
name: ticket-workflow
---
## 현재 상태
- Git 변경사항: !`git diff --stat`
- 최근 커밋: !`git log --oneline -5`

$ARGUMENTS 티켓을 처리합니다.
```

`!`` `` `` `` command `` `` `` ````` 문법: Claude가 프롬프트를 받기 전에 셸 명령이 실행되고 출력이 삽입됨. 전처리이므로 토큰 효율적.

### 변수 치환

| 변수 | 설명 |
|------|------|
| `$ARGUMENTS` | 스킬 호출 시 전달된 모든 인수 |
| `$ARGUMENTS[N]` | N번째 인수 (0-based) |
| `$N` | `$ARGUMENTS[N]` 단축형 |
| `${CLAUDE_SESSION_ID}` | 현재 세션 ID |
| `${CLAUDE_SKILL_DIR}` | SKILL.md가 위치한 디렉토리 절대경로 |

---

## 서브에이전트 스택 (병렬 에이전트 디스패치)

### 빌트인 에이전트 타입

| 타입 | 모델 | 도구 | 용도 |
|------|------|------|------|
| `Explore` | Haiku (빠름) | Read 전용 | 코드베이스 탐색, 파일 검색 |
| `Plan` | Inherit | Read 전용 | 플랜 모드에서 컨텍스트 수집 |
| `general-purpose` | Inherit | 전체 | 복합 작업, 코드 수정 포함 |

### 에이전트 파일 형식 (agents/xxx.md)

```markdown
---
name: evidence-searcher
description: 버그 증거 수집 전문 에이전트. 에러 패턴, 스택 트레이스, 관련 파일 탐색.
tools: Read, Grep, Glob, Bash
model: haiku
---

에이전트 시스템 프롬프트...
```

### 병렬 디스패치 패턴

스킬에서 여러 에이전트를 병렬 실행하려면 명시적으로 지시해야 함:

```
"Agent A와 Agent B를 병렬로 실행하세요:
- Agent A: 에러 패턴, 스택 트레이스 탐색
- Agent B: git 히스토리, 관련 컴포넌트 탐색"
```

**주의:** 서브에이전트는 다른 서브에이전트를 스폰할 수 없음. 중첩 위임 불가. 병렬화는 반드시 메인 스킬(또는 메인 컨텍스트)에서 조율해야 함.

---

## 플러그인 디렉토리 구조 (표준)

```
plugins/wf/
├── .claude-plugin/
│   └── plugin.json              # 플러그인 메타데이터 (유일한 위치)
├── skills/
│   └── ticket-workflow/
│       ├── SKILL.md             # 메인 스킬 (500줄 이하 권장)
│       └── references/          # 상세 레퍼런스 문서
│           ├── phase-orchestrator.md
│           ├── browser-automation.md
│           └── phases/
├── agents/
│   ├── evidence-searcher.md     # 증거 수집 에이전트
│   └── bug-tracer.md            # 코드 트레이스 에이전트
├── hooks/
│   └── hooks.json               # 선택적 훅 설정
└── lib/
    └── schemas/                 # 분류 스키마 등
```

**중요 제약:** `.claude-plugin/`에는 `plugin.json`만. `skills/`, `agents/`, `hooks/`는 반드시 플러그인 루트에 위치.

---

## plugin.json 명세

```json
{
  "name": "wf",
  "version": "0.3.0",
  "description": "Automated ticket workflow with browser automation",
  "author": {
    "name": "inchan",
    "email": "inchan@augmentedwe.com"
  },
  "skills": "./skills/",
  "agents": "./agents/",
  "hooks": "./hooks/hooks.json"
}
```

`${CLAUDE_PLUGIN_ROOT}` 환경변수: hooks, MCP 서버 설정의 스크립트 경로에 반드시 사용.

---

## 사용하지 않을 기술 (Anti-Stack)

| 기술 | 이유 |
|------|------|
| Puppeteer | Playwright가 더 표준. Claude Code 공식 통합 없음 |
| Selenium | 구식. LLM 친화적 설계 없음 |
| Node.js/Python 직접 작성 | SKILL.md는 코드 작성이 아닌 마크다운 명세. 스크립트는 보조적으로만 사용 |
| MCP everything 번들링 | 필요한 MCP만 선택적 사용. 항상 로드는 컨텍스트 낭비 |
| `.claude/commands/` | 레거시. 신규 개발은 `skills/` 사용 |
| context: fork 남용 | 단순 지식/컨벤션 스킬에는 불필요. 격리가 필요한 태스크 스킬에만 사용 |

---

## MCP 설정 위치 (플러그인 번들 vs 사용자 설정)

### 방법 1: 사용자가 직접 MCP 추가 (권장 — ticket-workflow에 적합)

```bash
# 사용자 환경에서 실행
claude mcp add playwright npx @playwright/mcp@latest
claude mcp add chrome-devtools npx chrome-devtools-mcp@latest
```

SKILL.md에서 `mcp__playwright__*`, `mcp__chrome_devtools__*` 도구 참조.

### 방법 2: 플러그인에 .mcp.json 번들 (외부 MCP 서버 포함 시)

```json
// plugins/wf/.mcp.json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

**결정:** 방법 1 사용. Playwright/Chrome DevTools MCP는 이미 존재할 가능성이 높고, 중복 설치 방지. SKILL.md에서 도구 가용성을 조건부 처리하는 것이 더 견고함.

---

## 지원 파일 패턴

SKILL.md를 500줄 이하로 유지하려면 상세 내용을 분리:

```
skills/ticket-workflow/
├── SKILL.md                    # 개요 + 단계 요약 + 레퍼런스 링크
└── references/
    ├── phase-orchestrator.md   # 상태 머신 전체 명세
    ├── classification.md       # 분류 알고리즘
    ├── browser-automation.md   # 브라우저 도구 통합 절차
    └── phases/
        ├── evidence-collection.md
        ├── exploration.md
        ├── planning.md
        ├── implementation.md
        └── verification.md
```

Claude가 "필요할 때만" 레퍼런스 파일을 로드하도록 SKILL.md에서 링크만 제시.

---

## 버전 확인 방법

각 기술의 현재 버전 확인:

```bash
# Claude Code 버전
claude --version

# Playwright MCP 최신 버전
npm view @playwright/mcp version

# Chrome DevTools MCP 최신 버전
npm view chrome-devtools-mcp version
```

---

## Sources

- [Claude Code Skills 공식 문서](https://code.claude.com/docs/en/skills) — HIGH confidence
- [Claude Code Plugins Reference](https://code.claude.com/docs/en/plugins-reference) — HIGH confidence
- [Claude Code Sub-Agents 공식 문서](https://code.claude.com/docs/en/sub-agents) — HIGH confidence
- [Claude Code Chrome Integration](https://code.claude.com/docs/en/chrome) — HIGH confidence
- [Microsoft Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp) — HIGH confidence
- [ChromeDevTools/chrome-devtools-mcp GitHub](https://github.com/ChromeDevTools/chrome-devtools-mcp) — HIGH confidence
