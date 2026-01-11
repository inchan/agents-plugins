# /route

자연어 요청을 적절한 AI CLI로 라우팅하여 실행합니다.

## Usage

```
/route <prompt>
/route --cli <name> <prompt>
/route --test <prompt>
```

## Arguments

| 인자 | 필수 | 설명 |
|-----|-----|------|
| `prompt` | ✅ | AI에게 전달할 요청 |
| `--cli <name>` | ❌ | CLI 수동 지정 (claude, codex, echo) |
| `--test` | ❌ | 테스트 모드 (echo 사용) |
| `--normalize` | ❌ | 정규화된 JSON 출력 |

## Examples

### 자동 라우팅
```
/route "배열 정렬 함수 작성해줘"
```
→ 코드 키워드 감지 → codex로 라우팅

### 수동 지정
```
/route --cli claude "이 코드 리뷰해줘"
```
→ claude로 직접 라우팅

### 테스트
```
/route --test "테스트 메시지"
```
→ echo mock으로 라우팅

## Execution

```typescript
// 내부 실행 흐름
import { selectCLI } from './router.ts';
import { spawnSync } from 'node:child_process';
import { extractResult } from './result-extractor.ts';

// 1. CLI 선택
const routing = selectCLI({ prompt, options: { testMode } });
console.log(`[Router] ${routing.cli} (${routing.rule})`);

// 2. CLI 실행
const result = spawnSync('node', [
  '--import', 'tsx',
  'multi-cli-runner.ts',
  '--cli', routing.cli,
  '--prompt', prompt,
  '--normalize'
]);

// 3. 결과 반환
const normalized = JSON.parse(result.stdout);
return normalized;
```

## Output

### 성공 시
```json
{
  "success": true,
  "content": "AI 응답 내용...",
  "metadata": {
    "cli": "codex",
    "durationMs": 3500
  }
}
```

### 실패 시
```json
{
  "success": false,
  "content": "",
  "metadata": { "cli": "codex", "durationMs": 120000 },
  "error": {
    "type": "TIMEOUT",
    "message": "Command timed out",
    "recoverable": true
  }
}
```

## Integration

이 커맨드는 다음 모듈을 사용합니다:

1. **router.ts**: 요청 분석 및 CLI 선택
2. **multi-cli-runner.ts**: CLI 프로세스 실행
3. **result-extractor.ts**: 결과 정규화 및 에러 분류

## See Also

- [SKILL.md](../SKILL.md) - 플러그인 전체 문서
- [router.ts](../router.ts) - 라우팅 로직 상세
