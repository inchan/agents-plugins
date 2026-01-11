# 테스팅

## 현재 상태

| 항목 | 상태 |
|------|------|
| 테스트 파일 | ❌ 없음 |
| 테스트 프레임워크 | ❌ 미지정 |
| 테스트 커버리지 | 0% |
| CI/CD 파이프라인 | ❌ 없음 |

## 검증 메커니즘

### 수동 CLI 검증 (현재 방식)

**agent.ts의 검증 플래그**:

```bash
# 파일 존재 확인
--expect-file <path>

# 정규식 매칭 확인
--expect-regex <path>:<pattern>
```

**예시**:
```bash
node --import tsx ./agent.ts "Create out/hello.txt containing hello" \
  --expect-file out/hello.txt \
  --expect-regex out/hello.txt:hello
```

### npm 스크립트

```json
{
  "demo:success": "node --import tsx ./agent.ts \"Create out/hello.txt containing the word hello\" --expect-file out/hello.txt --expect-regex out/hello.txt:hello",
  "demo:failure": "node --import tsx ./agent.ts \"Do nothing\" --expect-file out/should-not-exist.txt"
}
```

## 테스트 모드

### echo CLI (Mock)

**용도**: AI CLI 없이 라우팅 로직 테스트

```bash
# 테스트 모드 활성화
node --import tsx multi-cli-runner.ts --test --prompt "hello"

# 또는
node --import tsx multi-cli-runner.ts --cli echo --prompt "hello"
```

**응답**:
```json
{
  "success": true,
  "content": "Echo: hello",
  "metadata": { "cli": "echo", "durationMs": 0 }
}
```

### fake CLI (에러 테스트)

**용도**: 에러 분류 로직 테스트

```bash
node --import tsx multi-cli-runner.ts --cli fake --prompt "test"
```

## 테스트가 필요한 영역

### 1. 라우팅 로직 (router.ts)

| 테스트 케이스 | 우선순위 |
|---------------|----------|
| 우선순위 규칙 충돌 | 높음 |
| 키워드 매칭 정확도 | 높음 |
| 신뢰도 계산 | 중간 |
| 한글 키워드 인식 | 중간 |

### 2. 에러 분류 (result-extractor.ts)

| 테스트 케이스 | 우선순위 |
|---------------|----------|
| 에러 타입 분류 | 높음 |
| 복구 가능성 판정 | 높음 |
| 에러 패턴 매칭 | 중간 |

### 3. CLI 실행 (multi-cli-runner.ts)

| 테스트 케이스 | 우선순위 |
|---------------|----------|
| 타임아웃 처리 | 높음 |
| JSON 파싱 실패 | 중간 |
| 버퍼 오버플로우 | 낮음 |

## 권장 테스트 프레임워크

### Vitest (권장)

```bash
npm install -D vitest
```

**이유**:
- tsx와 호환성 좋음
- ESM 지원 우수
- 빠른 실행 속도

### 테스트 파일 구조 (권장)

```
.claude/skills/outsourcing/
├── router.ts
├── router.test.ts          # 라우팅 테스트
├── multi-cli-runner.ts
├── multi-cli-runner.test.ts
├── result-extractor.ts
└── result-extractor.test.ts
```

## 테스트 예시 (권장)

```typescript
// router.test.ts
import { describe, it, expect } from 'vitest';
import { selectCLI, DEFAULT_RULES } from './router';

describe('selectCLI', () => {
  it('should route code tasks to codex', () => {
    const result = selectCLI({ prompt: 'write a function' });
    expect(result.cli).toBe('codex');
  });

  it('should route test mode to echo', () => {
    const result = selectCLI({
      prompt: 'hello',
      options: { testMode: true }
    });
    expect(result.cli).toBe('echo');
  });
});
```
