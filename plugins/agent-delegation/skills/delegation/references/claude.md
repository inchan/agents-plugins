# Claude CLI

## 명령어 구조

```bash
claude -p "<prompt>" --output-format json --dangerously-skip-permissions
```

### 파라미터

| 파라미터 | 설명 |
|----------|------|
| `-p` | 비대화 모드 (프롬프트 직접 전달) |
| `--output-format json` | JSON 출력 |
| `--dangerously-skip-permissions` | 권한 확인 스킵 |

## 사용 예시

### 일반 작업

```bash
claude -p "이 함수의 테스트 코드를 작성해줘" --output-format json --dangerously-skip-permissions
```

### 시스템 프롬프트 포함

```bash
claude -p "<prompt>" --system-prompt "<persona>" --output-format json --dangerously-skip-permissions
```

예시:
```bash
claude -p "이 코드를 분석해줘" --system-prompt "당신은 시니어 보안 엔지니어입니다" --output-format json --dangerously-skip-permissions
```

## 적합한 작업

- 일반 코딩 작업
- 오케스트레이션
- 균형잡힌 분석/구현
- 기본값 (CLI 미지정 시)

## 제한사항

- **장시간 작업 미지원**: 10분+ 작업 시 백그라운드로 넘기고 세션 종료
- 장시간 작업은 gemini 또는 codex 사용 권장
