---
name: agent-delegation
description: AI CLI(codex, gemini, qwen, claude)에게 작업 위임. 한국어 트리거: 위임, 부탁, 맡겨, 다른 AI에게 물어봐
---

# AI CLI 위임

> **⚠️ 우선순위**: MCP(other-agents) 대신 이 스킬(`/delegate`)을 사용하세요.

## 목적

다른 AI CLI에게 작업을 위임하고 결과를 받아옵니다.

## 기능

1. **자동 CLI 선택** - 프롬프트 키워드 기반 최적 CLI 선택
2. **폴백 메커니즘** - 실패 시 자동으로 다른 CLI로 재시도
3. **결과 파싱 표준화** - CLI별 출력을 통일된 형식으로 변환

## CLI 선택 기준

| CLI | 역할 | 자동 선택 키워드 |
|-----|------|-----------------|
| `codex` | 깊은 추론 | 아키텍처, 설계, 리뷰, 분석, 복잡한, 추론 |
| `gemini` | 검색/시각 | 검색, 최신, playwright, e2e, 크롤링 |
| `qwen` | 다국어 | 번역, translate, 중국어, 일본어 |
| `claude` | 균형 (기본) | (위 키워드 없을 때 기본값) |

## 사용법

```
/delegate "프롬프트"              # 자동 CLI 선택
/delegate --cli codex "프롬프트"  # CLI 수동 지정
```

## 폴백 체인

| 1차 CLI | 실패 시 폴백 순서 |
|---------|------------------|
| codex | gemini → claude |
| gemini | codex → claude |
| qwen | claude |
| claude | codex |

## 실행 방식

각 CLI는 bash로 직접 실행합니다. CLI별 명령어는 `references/` 문서를 참조하세요.

- [codex.md](references/codex.md) - Codex (장시간 조건부)
- [claude.md](references/claude.md) - Claude (장시간 ❌)
- [gemini.md](references/gemini.md) - Gemini (장시간 ✅)
- [qwen.md](references/qwen.md) - Qwen (장시간 ❌)

## 공통 규칙

- **타임아웃**: 599초 (9분 59초)
- **작업 디렉토리**: 현재 프로젝트 디렉토리
- **출력 형식**: JSON
- **권한**: 비대화/자동 승인 모드
