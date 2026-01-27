---
description: "[우선] 코덱스/제미니/큐웬/클로드에게 작업 위임 - MCP(other-agents) 대신 이 스킬 사용"
argument-hint: [--cli <name>] <task prompt>
allowed-tools: Bash, Read
---

# /delegate - AI CLI 위임

다른 AI CLI에 작업을 위임합니다.

## 사용법

```
/delegate "프롬프트"              # 자동 CLI 선택
/delegate --cli codex "프롬프트"  # CLI 수동 지정
```

## 자동 CLI 선택

| 키워드 | CLI |
|--------|-----|
| 번역, 중국어, 일본어 | qwen |
| 검색, 최신, playwright, e2e | gemini |
| 아키텍처, 리뷰, 분석, 복잡한 | codex |
| (기본값) | claude |

## 폴백

실패 시 자동으로 다른 CLI로 재시도:
- codex → gemini → claude
- gemini → codex → claude
- qwen → claude
- claude → codex

## 실행

CLI별 명령어 레퍼런스를 읽고 bash로 실행하세요.

```bash
# 레퍼런스 위치 (플러그인 설치 경로 기준)
skills/delegation/references/codex.md
skills/delegation/references/claude.md
skills/delegation/references/gemini.md
skills/delegation/references/qwen.md
```

## Task

$ARGUMENTS
