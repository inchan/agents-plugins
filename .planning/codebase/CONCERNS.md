# 기술 부채 및 우려사항

## 요약

| 항목 | 심각도 | 상태 |
|------|--------|------|
| 타입 안정성 | 🟡 중간 | `any` 타입 과용 |
| 테스트 커버리지 | 🔴 높음 | 0% |
| 에러 처리 | 🟡 중간 | Silent catch |
| 입력 검증 | 🟡 중간 | 키워드 매칭 부정확 |
| 코드 중복 | 🟢 낮음 | JSON 파싱 로직 |

## 상세 분석

### 1. 타입 안정성 (심각도: 중간)

**문제점**: `any` 타입의 과도한 사용

**위치**:
- `multi-cli-runner.ts`: 라인 25, 40, 49, 121, 142, 148
- `result-extractor.ts`: 라인 102, 128, 143, 158
- `agent.ts`: 라인 30, 137, 148

**예시**:
```typescript
// multi-cli-runner.ts:49-60
function safeJsonParse(maybeJson: string): any {
  // ...
  return JSON.parse(slice);  // any 반환
}
```

**권장**: Type guards 및 strict TypeScript 설정 추가

---

### 2. 테스트 커버리지 (심각도: 높음)

**문제점**: 테스트 파일 없음 (0% 커버리지)

**영향받는 로직**:
- 우선순위 규칙 충돌 (router.ts)
- 에러 분류 정확도 (result-extractor.ts)
- 신뢰도 계산 (router.ts:73-81)

**권장**: Vitest로 핵심 로직 테스트 추가

---

### 3. 에러 처리 (심각도: 중간)

**문제점**: Silent catch로 에러 정보 손실

**위치**:
- `agent.ts:122` - mkdirSync 에러 무시
  ```typescript
  try { mkdirSync("out", { recursive: true }); } catch {}
  ```
- `agent.ts:169-170` - 파일 읽기 실패 상세 정보 부족

**권장**: 로깅 추가 또는 예외 전파

---

### 4. 입력 검증 (심각도: 중간)

**문제점**: 키워드 매칭이 원시적

**위치**: `router.ts:68-76`

```typescript
function containsKeyword(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(kw => lowerText.includes(kw.toLowerCase()));
}
```

**문제**: "test"가 "protest", "latest"에도 매칭 (거짓 양성)

**권장**: word boundary 정규표현식 사용
```typescript
const pattern = new RegExp(`\\b${kw}\\b`, 'i');
```

---

### 5. JSON 파싱 엣지 케이스 (심각도: 낮음)

**문제점**: 중첩된 JSON 객체 처리 불완전

**위치**: `agent.ts:105-114`

```typescript
function safeJsonParse(maybeJson: string) {
  const first = maybeJson.indexOf("{");
  const last = maybeJson.lastIndexOf("}");
  // 중첩 객체에서 최후의 } 사용 → 잘못된 추출 가능
}
```

---

### 6. UTF-8 버퍼 절단 (심각도: 낮음)

**문제점**: 멀티바이트 문자 경계 고려 안 함

**위치**: `multi-cli-runner.ts:145-151`

```typescript
stdout: stdout.slice(0, 5000),  // UTF-8 문자 중간에서 절단 가능
```

**권장**: Buffer 모듈 또는 TextDecoder 사용

---

### 7. 코드 중복 (심각도: 낮음)

**문제점**: JSON 안전 파싱 로직 중복

**위치**:
- `agent.ts:105-114` (safeJsonParse)
- `multi-cli-runner.ts:49-60` (safeJsonParse)

두 구현이 약간 다름

**권장**: 공유 유틸 모듈로 통합

---

### 8. 문서화 부족 (심각도: 낮음)

**문제점**: 일부 로직 주석 부족

**위치**: `router.ts:170-173`
```typescript
const confidence = rule.name === 'code-tasks'
  ? calculateConfidence(request, CODE_KEYWORDS)
  : rule.name === 'default' ? 0.5 : 0.8;  // 왜 0.8?
```

---

## 보안 상태

| 항목 | 상태 |
|------|------|
| 하드코딩된 비밀 | ✅ 없음 |
| 환경 변수 오용 | ✅ 없음 |
| 명령 주입 위험 | ✅ spawnSync 배열 사용 |
| 의존성 취약점 | ⚠️ 스캔 미설정 |

---

## 권장 조치 (우선순위)

| 순위 | 항목 | 조치 |
|------|------|------|
| 1 | 테스트 | Vitest 설정 + 핵심 로직 테스트 |
| 2 | 타입 안정성 | tsconfig.json strict 모드 |
| 3 | 입력 검증 | word boundary 정규표현식 |
| 4 | 에러 처리 | 로깅 추가 |
| 5 | 코드 중복 | 공유 유틸 모듈 추출 |

---

## 엔트로피 경로 점수

| 항목 | 점수 |
|------|------|
| 기술 부채 | 35/100 🟡 |
| 코드 품질 | 72/100 🟢 |
| 테스트 커버리지 | 0/100 🔴 |
| **종합** | **36/100** 🟡 |

**상태**: 개선 권장 - 프로토타입 단계에서는 허용 가능하나, 프로덕션 전 테스트 추가 필수
