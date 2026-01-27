# Qwen CLI

## 명령어 구조

```bash
qwen "<prompt>" -o json --yolo
```

### 파라미터

| 파라미터 | 설명 |
|----------|------|
| `"<prompt>"` | Positional argument (비대화 모드) |
| `-o json` | JSON 출력 (`--output-format`) |
| `--yolo` | 권한 확인 스킵 |

> **Note**: `-p` 플래그는 deprecated. Positional argument 사용 권장.

## 사용 예시

### 번역

```bash
qwen "이 에러 메시지들을 중국어로 번역해줘" -o json --yolo
```

### 다국어 문서

```bash
qwen "README를 중국어와 일본어로 번역해서 README.zh.md, README.ja.md를 만들어줘" -o json --yolo
```

### 하급 작업

```bash
qwen "이 함수에 JSDoc 주석을 추가해줘" -o json --yolo
```

## 시스템 프롬프트

프롬프트 앞에 `System: .../User: ...` 프리픽스를 붙입니다.

```bash
qwen "System: 당신은 전문 번역가입니다

User: 이 텍스트를 번역해줘" -o json --yolo
```

## 적합한 작업

- 번역 (특히 중국어)
- 다국어 문서 작업
- 간단한 코딩 작업
- 하급 반복 작업

## 제한사항

- **장시간 작업 미지원**: 백그라운드 실행 시 세션 종료와 함께 프로세스 종료
- 장시간 작업은 gemini 또는 codex 사용 권장
