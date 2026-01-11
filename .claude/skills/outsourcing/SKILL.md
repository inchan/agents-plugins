# Multi-Agent Router

자연어 요청을 분석하여 가장 적절한 AI CLI로 자동 라우팅하는 플러그인.

## Overview

사용자의 요청 특성(코드 작업, 분석, 창작 등)을 분석하여 최적의 AI를 선택합니다:
- **코드 작업** → Codex (함수 작성, 디버깅, 리팩토링)
- **분석/설명** → Claude (개념 설명, 리뷰, 분석)
- **테스트** → Echo (mock 테스트용)

## Triggers

이 스킬은 다음 상황에서 활성화됩니다:

- `/route` 커맨드 사용 시
- "다른 AI에게 물어봐", "codex로 해줘", "claude한테" 등의 표현

## Usage

### 자동 라우팅
```
/route "함수 작성해줘"
→ [Router] codex 선택 (code-tasks, 70%)
→ Codex 응답...
```

### 수동 CLI 지정
```
/route --cli claude "코드 리뷰해줘"
→ Claude 응답...
```

### 테스트 모드
```
/route --test "아무 프롬프트"
→ Echo mock 응답
```

## Routing Rules

| 우선순위 | 규칙 | 대상 CLI | 조건 |
|---------|------|---------|------|
| 100 | test-mode | echo | --test 플래그 |
| 80 | code-tasks | codex | 코드 관련 키워드 |
| 70 | speed-priority | codex | --speed 옵션 |
| 70 | quality-priority | claude | --quality 옵션 |
| 60 | analysis-tasks | claude | 분석/설명 키워드 |
| 50 | creative-tasks | claude | 창작/작문 키워드 |
| 0 | default | claude | 기본값 |

## Output Format

정규화된 JSON 형식으로 결과 반환:

```json
{
  "success": true,
  "content": "AI 응답 내용",
  "metadata": {
    "cli": "claude",
    "sessionId": "...",
    "usage": { "inputTokens": 100, "outputTokens": 50 },
    "costUsd": 0.01,
    "durationMs": 5000
  }
}
```

## Error Handling

에러 발생 시 분류 및 복구 가능 여부 제공:

| 에러 유형 | 복구 가능 | 설명 |
|----------|----------|------|
| CLI_NOT_FOUND | ❌ | CLI가 설치되지 않음 |
| TIMEOUT | ✅ | 실행 시간 초과 |
| AUTH_ERROR | ❌ | 인증 실패 |
| API_ERROR | ✅ | API 서버 오류 |
| RATE_LIMIT | ✅ | 요청 제한 |

## Files

- `router.ts` - 라우팅 로직
- `multi-cli-runner.ts` - CLI 실행 래퍼
- `result-extractor.ts` - 결과 정규화
- `commands/route.md` - /route 커맨드 정의
