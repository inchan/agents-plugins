# 아키텍처

## 개요

**패턴**: 메타-에이전트 오케스트레이션 + CLI 래퍼 + 자동 라우팅

Claude Code 플러그인 생태계 내에서 여러 외부 AI CLI(Codex, Claude 등)를 자동으로 선택하고 실행하는 메타-에이전트 시스템.

## 개념적 계층

```
┌─────────────────────────────────────────┐
│  User Interface Layer                   │
│  - /route command (route.md)            │
│  - Claude Code Native Interface         │
├─────────────────────────────────────────┤
│  Routing & Decision Layer               │
│  - router.ts (자연어 → CLI 선택)        │
│  - Keyword matching (영/한글)           │
│  - Priority-based rule system           │
├─────────────────────────────────────────┤
│  Execution Layer                        │
│  - multi-cli-runner.ts (CLI 실행)       │
│  - spawnSync wrapper                    │
│  - CLI configurations                   │
├─────────────────────────────────────────┤
│  Result Processing Layer                │
│  - result-extractor.ts (정규화)         │
│  - Error classification                 │
│  - Format transformation                │
├─────────────────────────────────────────┤
│  Integration Layer                      │
│  - agent.ts (Entry point)               │
│  - Sub-agent orchestration              │
│  - JSON report generation               │
└─────────────────────────────────────────┘
```

## 데이터 흐름

```
User Prompt
    ↓
/route 커맨드
    ↓
multi-cli-runner.ts --auto/--cli 호출
    ↓
[Router] selectCLI()
  - 키워드 분석
  - 규칙 기반 매칭 (우선순위)
  - 신뢰도 계산 (confidence: 0-1)
    ↓
선택된 CLI 실행 (runCLI)
  - spawnSync로 프로세스 시작
  - stdout/stderr 캡처
  - JSON/Raw 파싱
    ↓
extractResult() [result-extractor.ts]
  - CLI별 파싱 로직 적용
  - 에러 분류 (타입 + 복구 가능성)
  - 정규화된 JSON 생성
    ↓
NormalizedResult JSON 반환
```

## 핵심 추상화

### 1. 라우팅 규칙 시스템 (router.ts)

**선언적 규칙 기반 라우팅**:

```typescript
interface RoutingRule {
  name: string;              // 규칙 이름
  priority: number;          // 우선순위 (높을수록 먼저)
  match: (request) => boolean;  // 조건
  target: string;            // 대상 CLI
  fallback?: string;         // 폴백
}
```

**기본 규칙 (우선순위 순)**:
1. `test-mode` (100) → echo
2. `code-tasks` (80) → codex
3. `speed-priority` (70) → codex
4. `quality-priority` (70) → claude
5. `analysis-tasks` (60) → claude
6. `creative-tasks` (50) → claude
7. `default` (0) → claude

### 2. CLI 실행 추상화 (multi-cli-runner.ts)

**설정 기반 CLI 래퍼**:

```typescript
interface CLIConfig {
  name: string;
  command: string;
  buildArgs: (prompt: string) => string[];
  parseOutput: (stdout: string) => any;
  timeout?: number;
}
```

**지원 CLI**: claude, codex, echo (mock), fake (에러 테스트)

### 3. 결과 정규화 (result-extractor.ts)

**통일된 출력 형식**:

```typescript
interface NormalizedResult {
  success: boolean;
  content: string;
  metadata: {
    cli: string;
    sessionId?: string;
    usage?: { inputTokens, outputTokens };
    costUsd?: number;
    durationMs: number;
  };
  error?: {
    type: ErrorType;
    message: string;
    recoverable: boolean;
  };
}
```

## 모듈 경계

| 모듈 | 책임 | 의존성 |
|------|------|--------|
| router.ts | 자연어 분석, CLI 선택 | 없음 |
| multi-cli-runner.ts | CLI 프로세스 실행 | router.ts, result-extractor.ts |
| result-extractor.ts | 결과 파싱, 에러 분류 | 없음 |
| agent.ts | 비대화형 실행 wrapper | 없음 |

## 설계 결정

| 결정 | 근거 |
|------|------|
| CLI 기반 실행 | API보다 설정 단순, 기존 CLI 활용 |
| 우선순위 기반 라우팅 | 확장 가능, 선언적 규칙 |
| JSON 정규화 | CLI별 포맷 차이 흡수 |
| 한글 + 영문 키워드 | 사용자 편의성 |
