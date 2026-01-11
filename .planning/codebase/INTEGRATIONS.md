# 외부 통합

## AI CLI 통합

### Claude Code CLI

**명령어**: `claude -p <prompt> --output-format json`

**설정** (multi-cli-runner.ts:63-72):
```typescript
{
  name: "claude",
  command: "claude",
  buildArgs: (prompt) => [
    "-p", prompt,
    "--output-format", "json",
    "--verbose"
  ],
  parseOutput: safeJsonParse,
  timeout: 120000  // 2분
}
```

**출력 형식**:
```json
{
  "session_id": "...",
  "result": "응답 내용",
  "usage": {
    "input_tokens": 100,
    "output_tokens": 50
  },
  "cost_usd": 0.001,
  "duration_ms": 3000
}
```

### Codex CLI (OpenAI)

**명령어**: `codex exec <prompt>`

**설정** (multi-cli-runner.ts:75-83):
```typescript
{
  name: "codex",
  command: "codex",
  buildArgs: (prompt) => ["exec", prompt],
  parseOutput: safeJsonParse,
  timeout: 120000  // 2분
}
```

### Echo Mock

**명령어**: 내장 mock (CLI 호출 없음)

**설정** (multi-cli-runner.ts:86-92):
```typescript
{
  name: "echo",
  command: "echo",
  buildArgs: (prompt) => [],
  parseOutput: (stdout) => ({ echoed: stdout }),
  timeout: 5000  // 5초
}
```

**용도**: 테스트 모드, AI CLI 없이 라우팅 검증

## Claude Code 플러그인 시스템

### Skill 등록

**위치**: `.claude-plugin/plugin.json`

```json
{
  "name": "lab-workflow-spec-kit",
  "version": "1.0.0",
  "description": "자연어 요청을 분석하여 가장 적절한 AI CLI로 자동 라우팅하는 플러그인",
  "skills": ["../.claude/skills/outsourcing/"],
  "commands": ["../.claude/commands/"]
}
```

### Sub-agent 정의

**위치**: `.claude/agents/claude-cli-runner.md`

**역할**: `node agent.ts` 실행 및 결과 보고
**권한**: Bash, Read 전용
**결과 형식**: JSON 성공/실패 리포트

### 권한 설정

**위치**: `.claude/settings.local.json`

```json
{
  "permissions": {
    "allow": [
      "Skill(gsd:plan-phase)",
      "Skill(gsd:execute-plan)",
      "Bash(node --import tsx:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)"
    ]
  }
}
```

## 슬래시 커맨드

### /route

**위치**: `.claude/skills/outsourcing/commands/route.md`

**사용법**:
```
/route <prompt>              # 자동 라우팅
/route --cli claude <prompt> # 수동 지정
/route --test <prompt>       # 테스트 모드
```

### /delegate

**위치**: `.claude/commands/delegate.md`

**사용법**:
```
/delegate <task> --expect-file <path> --expect-regex <path:regex>
```

## 통합 메커니즘

### 프로세스 실행

```typescript
// multi-cli-runner.ts:115-140
const proc = spawnSync(config.command, args, {
  encoding: "utf-8",
  timeout: config.timeout,
  maxBuffer: 10 * 1024 * 1024,  // 10MB
});
```

### 타임아웃 관리

| CLI | 타임아웃 | 용도 |
|-----|---------|------|
| claude | 2분 | 복잡한 작업 |
| codex | 2분 | 코드 생성 |
| echo | 5초 | 테스트 |
| fake | 5초 | 에러 테스트 |

### 결과 버퍼

```typescript
// 출력 크기 제한
stdout: stdout.slice(0, 5000),
stderr: stderr.slice(0, 2000),
```

## 에러 처리

### 에러 타입 분류 (result-extractor.ts)

| 에러 타입 | 복구 가능 | 패턴 |
|----------|----------|------|
| CLI_NOT_FOUND | ❌ | `command not found`, `ENOENT` |
| TIMEOUT | ✅ | `timeout`, `ETIMEDOUT` |
| AUTH_ERROR | ❌ | `authentication`, `unauthorized` |
| API_ERROR | ✅ | `api error`, `500` |
| RATE_LIMIT | ✅ | `rate limit`, `429` |
| PARSE_ERROR | ❌ | JSON 파싱 실패 |

### 폴백 전략

**라우팅 실패 시**:
- 기본값: claude
- 규칙별 폴백 설정 가능

```typescript
{
  name: 'code-tasks',
  target: 'codex',
  fallback: 'claude',  // codex 실패 시
}
```
