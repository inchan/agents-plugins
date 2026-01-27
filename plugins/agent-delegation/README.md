# agent-delegation

AI CLI(Codex, Claude, Gemini, Qwen)에게 작업을 위임하는 플러그인

## 사용법

```
/delegate "프롬프트"              # 자동 CLI 선택
/delegate --cli codex "프롬프트"  # CLI 수동 지정
```

## 기능

1. **자동 CLI 선택** - 키워드 기반 최적 CLI 자동 선택
2. **폴백 메커니즘** - 실패 시 다른 CLI로 자동 재시도
3. **결과 파싱 표준화** - CLI별 출력을 통일된 형식으로 변환

## 자동 CLI 선택

| 키워드 | CLI | 역할 |
|--------|-----|------|
| 번역, 중국어, 일본어 | qwen | 다국어 |
| 검색, 최신, playwright | gemini | 웹/검색 |
| 아키텍처, 리뷰, 분석 | codex | 깊은 추론 |
| (기본값) | claude | 균형 |

## 폴백 체인

| 1차 CLI | 실패 시 |
|---------|--------|
| codex | gemini → claude |
| gemini | codex → claude |
| qwen | claude |
| claude | codex |

## 장시간 작업 지원

| CLI | 10분+ 작업 |
|-----|-----------|
| gemini | ✅ 완전 지원 |
| codex | ⚠️ 조건부 |
| claude | ❌ 미지원 |
| qwen | ❌ 미지원 |

## 구조

```
agent-delegation/
├── .claude-plugin/plugin.json
├── commands/delegate.md
├── agents/delegator.md
└── skills/delegation/
    ├── SKILL.md
    └── references/
        ├── codex.md
        ├── claude.md
        ├── gemini.md
        └── qwen.md
```

## 요구사항

사용할 AI CLI 설치:
- `claude`: `npm i -g @anthropic-ai/claude-code`
- `codex`: Cursor CLI
- `gemini`: `npm i -g @google/gemini-cli`
- `qwen`: `npm i -g @qwen-code/qwen-code`

## 참고

- **타임아웃**: 599초 (9분 59초)
- **권한**: 비대화/자동 승인 모드로 실행
- **보안**: `dangerously-skip-permissions` 등 사용 - 신뢰 환경에서만 사용
