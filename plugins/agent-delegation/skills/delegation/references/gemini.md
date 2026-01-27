# Gemini CLI

## 명령어 구조

```bash
gemini "<prompt>" -o json --yolo
```

### 파라미터

| 파라미터 | 설명 |
|----------|------|
| `"<prompt>"` | Positional argument (비대화 모드) |
| `-o json` | JSON 출력 (`--output-format`) |
| `--yolo` | 권한 확인 스킵 |

> **Note**: `-p` 플래그는 deprecated. Positional argument 사용 권장.

## 사용 예시

### 웹 검색

```bash
gemini "2024년 React 19의 새로운 기능을 검색해서 정리해줘" -o json --yolo
```

### 문서 업데이트

```bash
gemini "README.md를 최신 변경사항에 맞게 업데이트해줘" -o json --yolo
```

### 테스트 작성

```bash
gemini "이 컴포넌트의 E2E 테스트를 Playwright로 작성해줘" -o json --yolo
```

## 시스템 프롬프트

환경변수 `GEMINI_SYSTEM_MD`로 system.md 파일 경로를 지정합니다.

```bash
# 임시 system.md 생성 후 실행
echo "당신은 QA 엔지니어입니다" > /tmp/system.md
GEMINI_SYSTEM_MD=/tmp/system.md gemini "<prompt>" -o json --yolo
```

## 적합한 작업

- 웹 검색/리서치
- 문서 작성/업데이트
- 테스트 마스터 (E2E, Playwright)
- 시각적 분석
- 최신 정보가 필요한 작업
- **장시간 작업** (10분+ 안정적 지원)

## 장시간 작업

- 명시적 명령: ✅ 지원
- 반복 루프 작업: ✅ 지원
- 10분+ 작업에 가장 안정적인 CLI
