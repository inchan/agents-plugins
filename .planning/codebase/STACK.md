# 기술 스택

## 언어

| 언어 | 용도 | 파일 수 |
|------|------|---------|
| TypeScript | 핵심 로직 | 4개 (973줄) |
| Markdown | 문서/커맨드 정의 | 다수 |

## 런타임

- **Node.js 18+** (암시적 요구사항)
- **ES Modules** (`"type": "module"` in package.json)

## 패키지 매니저

- **npm** (package.json + package-lock.json)

## 주요 의존성

### 런타임 의존성
없음 - 순수 Node.js built-in 모듈만 사용

### 개발 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| tsx | ^4.19.2 | TypeScript 직접 실행 |

## Node.js Built-in 모듈

- `node:child_process` - CLI 프로세스 실행 (spawnSync)
- `node:fs` - 파일 시스템 작업
- `node:path` - 경로 처리

## 빌드 도구

- **tsx**: TypeScript를 별도 컴파일 없이 직접 실행
- **tsconfig.json**: 없음 (tsx 기본 설정 사용)

## 실행 방법

```bash
# 메인 에이전트 실행
node --import tsx agent.ts "<prompt>"

# CLI 러너 실행
node --import tsx .claude/skills/outsourcing/multi-cli-runner.ts --cli claude --prompt "hello"

# 데모 실행
npm run demo:success
npm run demo:failure
```

## 외부 CLI 의존성

| CLI | 용도 | 필수 여부 |
|-----|------|----------|
| claude | Claude Code CLI | 선택적 |
| codex | OpenAI Codex CLI | 선택적 |

## 프로젝트 메타정보

```json
{
  "name": "claude-subagent-headless-example",
  "version": "1.0.0",
  "type": "module"
}
```
