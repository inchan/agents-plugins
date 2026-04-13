---
name: delegation
description: >
  AI CLI(codex, gemini, claude, qwen, kimi)에게 작업 위임. 3개 전문 에이전트 + 1개 만능 에이전트로 구성.
  한국어 트리거: 위임, 부탁, 맡겨, 다른 AI에게 물어봐, codex로, gemini로, kimi로, qwen으로
  Do NOT trigger for simple tasks that Claude can handle directly.
  IMPORTANT: When delegating to external AI CLIs (codex, gemini, qwen, kimi), ALWAYS use this skill's agents.
  NEVER call codex/gemini/qwen/kimi directly via Bash — the agents handle correct flags, output parsing, and error handling.
---

# AI CLI 위임

3개 전문 에이전트 + 1개 만능 에이전트로 작업을 위임합니다.

## 서브에이전트

| 에이전트 | 전담 CLI | 역할 |
|----------|----------|------|
| `codex` | codex | 깊은 추론 — 아키텍처, 코드 리뷰, 버그 조사, 리팩토링 |
| `gemini` | gemini | 검색/시각 — 웹 검색, E2E 테스트, 문서 작성, 장시간 작업(10분+) |
| `claude-code` | claude | 범용 코딩 — 일반 구현, 오케스트레이션, 균형잡힌 분석 |
| `generalist` | **자동 선택** | 만능 — 번역(→qwen), 장문 코딩(→kimi), 기타 특수 작업 |

## 선택 기준

| 우선순위 | 키워드 | 에이전트 |
|---------|--------|----------|
| 1 | 검색, search, 최신, 뉴스, playwright, e2e, 크롤링 | `gemini` |
| 2 | 아키텍처, 설계, 리뷰, 분석, 복잡한, 추론, 계획 | `codex` |
| 3 | 번역, translate, 중국어, 일본어, kimi, moonshot, 대용량, 장문 | `generalist` |
| 4 | (기본값) | `claude-code` |

## 사용 흐름

1. 사용자가 작업을 설명하면 스킬이 적합한 에이전트를 선택
2. 사용자가 CLI를 직접 지정할 수도 있음 ("codex로 리뷰해줘", "gemini로 검색해줘")
3. 선택된 에이전트를 spawn하여 작업 실행
4. 에이전트가 결과를 보고

## 공통 규칙

- **타임아웃**: 599초 (9분 59초)
- **출력 형식**: JSON
- **권한**: 비대화/자동 승인 모드
- **병렬 실행**: 독립 작업은 여러 에이전트를 동시에 spawn 가능
