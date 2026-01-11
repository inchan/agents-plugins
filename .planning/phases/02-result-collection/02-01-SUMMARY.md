# Phase 2 Plan 01: 결과 수집 검증 Summary

**CLI 실행 결과를 정규화하고 에러를 분류하는 유틸리티 구현 완료**

## Accomplishments

- `result-extractor.ts` 모듈 구현: NormalizedResult 타입과 ErrorType 분류 체계 정의
- 에러 분류 시스템: 7가지 에러 유형(CLI_NOT_FOUND, TIMEOUT, AUTH_ERROR, API_ERROR, PARSE_ERROR, RATE_LIMIT, UNKNOWN)과 복구 가능 여부 판별
- CLI별 결과 추출기: claude, codex, echo 각각의 파싱 로직 분리 구현
- `multi-cli-runner.ts` 연동: --normalize 플래그로 정규화된 JSON 출력 지원
- fake CLI 추가: 에러 테스트용 존재하지 않는 CLI 설정

## Files Created/Modified

- `result-extractor.ts` - 결과 추출/정규화 모듈 (신규) - commit: 68fb9bf
- `multi-cli-runner.ts` - --normalize 플래그 추가, fake CLI 설정 - commit: 2b61a8d

## Decisions Made

- **NormalizedResult 구조**: success, content, metadata(cli, sessionId, usage, costUsd, durationMs), error(type, message, recoverable) 형태로 통일
- **에러 복구 가능성 분류**: TIMEOUT, RATE_LIMIT, API_ERROR는 recoverable=true, CLI_NOT_FOUND, AUTH_ERROR, PARSE_ERROR는 recoverable=false
- **에러 패턴 매칭**: 정규식 기반으로 stderr/stdout/error 메시지에서 에러 유형 추론

## Verification Results

```bash
# 정상 케이스 - echo mock
$ node --import tsx multi-cli-runner.ts --cli echo "test" --normalize
{
  "success": true,
  "content": "test",
  "metadata": { "cli": "echo", "durationMs": 4 }
}

# 에러 케이스 - CLI 없음
$ node --import tsx multi-cli-runner.ts --cli fake "test" --normalize
{
  "success": false,
  "content": "",
  "metadata": { "cli": "fake", "durationMs": 2 },
  "error": {
    "type": "CLI_NOT_FOUND",
    "message": "spawnSync nonexistent-cli-for-testing ENOENT",
    "recoverable": false
  }
}
```

## Issues Encountered

- **TypeScript 타입 import 문제**: ErrorType을 직접 import 시 SyntaxError 발생 (타입은 런타임에 존재하지 않음). 함수만 import하여 해결.
- **timeout 명령어 부재**: macOS에 timeout 명령어 없음. 대체 검증 방법으로 진행.

## Next Phase Readiness

- Phase 3 (라우팅 로직) 준비 완료
- NormalizedResult.error.type으로 에러 기반 라우팅 가능
- NormalizedResult.metadata로 비용/성능 기반 라우팅 가능
