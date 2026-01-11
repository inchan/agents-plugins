# 디렉토리 구조

## 전체 구조

```
lab-workflow-spec-kit/
├── agent.ts                          # 비대화형 Claude 실행 wrapper (207줄)
├── package.json                      # npm 의존성 (tsx)
├── package-lock.json                 # 의존성 잠금
├── README.md                         # 프로젝트 설명 (한글)
│
├── .claude/
│   ├── settings.local.json           # 로컬 권한 설정
│   ├── agents/
│   │   └── claude-cli-runner.md      # Sub-agent 정의 (Bash 실행)
│   ├── commands/
│   │   └── delegate.md               # /delegate 커맨드
│   └── skills/
│       └── outsourcing/              # Multi-Agent Router 플러그인
│           ├── SKILL.md              # 플러그인 문서
│           ├── router.ts             # 자연어 → CLI 선택 (247줄)
│           ├── multi-cli-runner.ts   # CLI 실행 래퍼 (271줄)
│           ├── result-extractor.ts   # 결과 정규화 (248줄)
│           └── commands/
│               └── route.md          # /route 커맨드 정의
│
├── .claude-plugin/
│   └── plugin.json                   # 플러그인 메타데이터
│
├── .planning/
│   ├── PROJECT.md                    # 프로젝트 개요
│   ├── ROADMAP.md                    # 4단계 로드맵
│   ├── STATE.md                      # 현재 상태
│   ├── codebase/                     # 코드베이스 문서 (이 파일 포함)
│   │   ├── STACK.md
│   │   ├── ARCHITECTURE.md
│   │   ├── STRUCTURE.md
│   │   ├── CONVENTIONS.md
│   │   ├── TESTING.md
│   │   ├── INTEGRATIONS.md
│   │   └── CONCERNS.md
│   └── phases/
│       ├── 01-cli-execution-poc/     # Phase 1: CLI 실행 검증
│       ├── 02-result-collection/     # Phase 2: 결과 수집
│       ├── 03-routing-logic/         # Phase 3: 라우팅 로직
│       └── 04-plugin-integration/    # Phase 4: 플러그인 통합
│
└── out/                              # 데모 출력 디렉토리
```

## 핵심 파일

### TypeScript 소스 (973줄 총계)

| 파일 | 줄 수 | 역할 |
|------|-------|------|
| `agent.ts` | 207 | 비대화형 Claude 실행, 결과 검증 |
| `router.ts` | 247 | 자연어 분석, CLI 선택 로직 |
| `multi-cli-runner.ts` | 271 | CLI 프로세스 실행 래퍼 |
| `result-extractor.ts` | 248 | 결과 정규화, 에러 분류 |

### 설정 파일

| 파일 | 용도 |
|------|------|
| `package.json` | npm 프로젝트 설정, 스크립트 |
| `.claude/settings.local.json` | Claude Code 권한 설정 |
| `.claude-plugin/plugin.json` | 플러그인 메타데이터 |

### 커맨드/에이전트 정의

| 파일 | 용도 |
|------|------|
| `.claude/commands/delegate.md` | /delegate 슬래시 커맨드 |
| `.claude/skills/outsourcing/commands/route.md` | /route 슬래시 커맨드 |
| `.claude/agents/claude-cli-runner.md` | Sub-agent 정의 |
| `.claude/skills/outsourcing/SKILL.md` | 스킬 문서 |

## 명명 규칙

### 파일명
- **TypeScript**: kebab-case (`multi-cli-runner.ts`)
- **Markdown**: 대문자 or 소문자 (`SKILL.md`, `route.md`)
- **Planning 문서**: 단계번호-주제 (`01-01-PLAN.md`)

### 디렉토리
- **영문 소문자**: `.claude`, `.planning`, `skills`
- **하이픈 구분**: `cli-execution-poc`
