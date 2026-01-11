# Phase 5 Research: 새 CLI 통합

## 연구 목표

Gemini, Qwen, Rovo Dev CLI를 multi-cli-runner에 통합하기 위한 기술 조사

## CLI 비교 요약

| CLI | 설치 | 명령어 | Non-interactive | JSON 출력 | 인증 |
|-----|------|--------|-----------------|-----------|------|
| Gemini CLI | `npm i -g @google/gemini-cli` | `gemini` | `-p "prompt"` | `--output-format json` | OAuth/API Key |
| Qwen Code | `npm i -g @qwen-code/qwen-code` | `qwen` | `-p "prompt"` | ❌ 없음 | OAuth/API Key |
| Rovo Dev | ACLI 확장 | `acli rovodev run` | ❌ interactive only | ❌ 없음 | Atlassian API Token |

## 1. Gemini CLI

### 설치

```bash
npm install -g @google/gemini-cli
# 또는
brew install gemini-cli
# 또는 (설치 없이)
npx @google/gemini-cli
```

### 사용법

```bash
# Interactive 모드
gemini

# Non-interactive 모드 (우리가 필요한 것)
gemini -p "prompt text"

# JSON 출력 (핵심!)
gemini -p "prompt" --output-format json

# 스트리밍 JSON
gemini -p "prompt" --output-format stream-json

# 모델 지정
gemini -p "prompt" -m gemini-2.5-flash
```

### 인증 옵션

| 방식 | 환경변수 | 무료 한도 |
|------|----------|----------|
| OAuth (Google 로그인) | - | 60 req/min, 1000 req/day |
| Gemini API Key | `GEMINI_API_KEY` | 100 req/day |
| Vertex AI | `GOOGLE_API_KEY` + `GOOGLE_GENAI_USE_VERTEXAI=true` | 유료 |

### 통합 용이성: ⭐⭐⭐⭐⭐ (최상)

- `--output-format json` 지원 → 기존 패턴과 완벽 호환
- `-p` 플래그로 non-interactive 모드 지원
- Claude CLI와 거의 동일한 인터페이스

### 예상 설정

```typescript
{
  name: "gemini",
  command: "gemini",
  buildArgs: (prompt) => [
    "-p", prompt,
    "--output-format", "json"
  ],
  parseOutput: safeJsonParse,
  timeout: 120000
}
```

---

## 2. Qwen Code CLI

### 설치

```bash
npm install -g @qwen-code/qwen-code

# Node.js 20+ 필요
```

### 사용법

```bash
# Interactive 모드
qwen

# Non-interactive (headless) 모드
qwen -p "prompt text"
```

### 인증 옵션

| 방식 | 환경변수 | 무료 한도 |
|------|----------|----------|
| Qwen OAuth | - | 2000 req/day |
| OpenAI-compatible API | `OPENAI_API_KEY`, `OPENAI_BASE_URL` | 설정에 따름 |

### 설정 파일

- 사용자: `~/.qwen/settings.json`
- 프로젝트: `.qwen/settings.json`

### 통합 용이성: ⭐⭐⭐ (중간)

**장점:**
- `-p` 플래그 지원 (Gemini CLI 포크)
- 무료 2000 req/day

**단점:**
- `--output-format json` 미지원 → stdout 파싱 필요
- 출력 형식 문서화 부족

### 예상 설정

```typescript
{
  name: "qwen",
  command: "qwen",
  buildArgs: (prompt) => ["-p", prompt],
  parseOutput: (stdout) => ({ content: stdout.trim() }), // 단순 텍스트
  timeout: 120000
}
```

### 조사 필요 사항

- [ ] 실제 출력 형식 테스트 필요
- [ ] 에러 시 exit code 및 stderr 확인

---

## 3. Rovo Dev CLI

### 설치

```bash
# 1. ACLI 설치 (Atlassian CLI)
# macOS/Linux/Windows별 설치 문서 참조

# 2. 인증
acli rovodev auth login

# 3. 실행
acli rovodev run
```

### 사전 요구사항

- Atlassian 사이트에 Rovo Dev 활성화 필요
- Rovo Dev 크레딧 할당 필요
- API 토큰 생성 (Admin/Chat/Read/Write 권한)

### 통합 용이성: ⭐ (낮음 - 권장하지 않음)

**문제점:**
1. **Interactive only** - `-p` 플래그 없음
2. **Atlassian 종속** - 사이트, 크레딧, 토큰 필요
3. **기업용** - 개인 개발자 사용 어려움
4. **JSON 출력 없음**

### 권장사항

> ⚠️ **Rovo Dev CLI는 통합 대상에서 제외 권장**
>
> 이유:
> - Non-interactive 모드 미지원
> - Atlassian 생태계 종속성
> - 개인 개발자 접근성 낮음
>
> 대안: Gemini + Qwen 2개 CLI로 충분한 다양성 확보

---

## 통합 우선순위

| 순위 | CLI | 이유 |
|------|-----|------|
| 1 | **Gemini CLI** | JSON 출력, 동일 인터페이스, 쉬운 통합 |
| 2 | **Qwen Code** | 무료 한도 높음, `-p` 지원, 출력 파싱 필요 |
| 3 | ~~Rovo Dev~~ | 제외 권장 (interactive only, 기업 종속) |

---

## 구현 계획

### Phase 5-01: Gemini CLI 통합

1. CLI 설정 추가 (`multi-cli-runner.ts`)
2. JSON 파싱 (기존 패턴 재사용)
3. 라우팅 규칙 추가 (`router.ts`)

### Phase 5-02: Qwen Code 통합

1. CLI 설정 추가
2. stdout 텍스트 파싱 로직 구현
3. 라우팅 규칙 추가

### Phase 5-03: 라우팅 규칙 확장

```typescript
// 예상 규칙
{
  name: 'multilingual',
  keywords: ['번역', '다국어', 'translate', 'chinese', 'korean'],
  target: 'qwen',
  priority: 85
},
{
  name: 'google-integration',
  keywords: ['google', 'gmail', 'drive', 'sheets', 'docs'],
  target: 'gemini',
  priority: 85
}
```

---

## 기술 스택 요약

### 필수 의존성

```bash
# Gemini CLI
npm install -g @google/gemini-cli
export GEMINI_API_KEY="your-key"  # 또는 OAuth 로그인

# Qwen Code
npm install -g @qwen-code/qwen-code
# OAuth 로그인 또는 OPENAI_API_KEY 설정
```

### 환경 변수

| CLI | 환경 변수 | 용도 |
|-----|----------|------|
| Gemini | `GEMINI_API_KEY` | API 인증 |
| Gemini | `GOOGLE_GENAI_USE_VERTEXAI` | Vertex AI 사용 시 |
| Qwen | `OPENAI_API_KEY` | API 인증 (선택) |
| Qwen | `OPENAI_BASE_URL` | 커스텀 엔드포인트 (선택) |

---

## 공통 패턴 및 주의사항

### 1. Gemini CLI 포크 관계

```
Gemini CLI (Google)
    └── Qwen Code (Alibaba) - 포크 + Qwen 모델 최적화
```

두 CLI가 유사한 인터페이스를 가지므로 통합 패턴 공유 가능

### 2. 에러 패턴 확장

```typescript
// result-extractor.ts에 추가 필요
const GEMINI_ERROR_PATTERNS = [
  { pattern: /quota exceeded/i, type: 'RATE_LIMIT', recoverable: true },
  { pattern: /invalid api key/i, type: 'AUTH_ERROR', recoverable: false },
];

const QWEN_ERROR_PATTERNS = [
  { pattern: /authentication failed/i, type: 'AUTH_ERROR', recoverable: false },
  { pattern: /rate limit/i, type: 'RATE_LIMIT', recoverable: true },
];
```

### 3. 타임아웃 설정

| CLI | 권장 타임아웃 | 이유 |
|-----|-------------|------|
| Gemini | 120s | 복잡한 작업 지원 |
| Qwen | 180s | 480B 모델 응답 지연 가능성 |

---

## 참고 자료

- [Gemini CLI GitHub](https://github.com/google-gemini/gemini-cli)
- [Qwen Code GitHub](https://github.com/QwenLM/qwen-code)
- [Qwen3-Coder 공식 블로그](https://qwenlm.github.io/blog/qwen3-coder/)
- [Rovo Dev 설치 문서](https://support.atlassian.com/rovo/docs/install-and-run-rovo-dev-cli-on-your-device/)

---

## 결론

**권장 접근 방식:**

1. **Gemini CLI 먼저 통합** - 가장 쉬움, JSON 출력 지원
2. **Qwen Code 이어서 통합** - 출력 파싱 추가 작업 필요
3. **Rovo Dev 제외** - 요구사항 불충족 (non-interactive 미지원)

**예상 작업량:**
- Gemini CLI: ~30분 (기존 패턴 재사용)
- Qwen Code: ~1시간 (출력 파싱 구현)
- 라우팅 규칙: ~30분

**엔트로피 경로 점수: 25/100** ✅ (낮음 - 기존 패턴 활용으로 복잡도 최소화)
