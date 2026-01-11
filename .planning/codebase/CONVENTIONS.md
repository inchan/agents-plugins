# 코딩 컨벤션

## 코드 스타일

### 인덴테이션
- **스타일**: 2칸 스페이스 (Space 2)
- **탭**: 사용 안 함

### 따옴표
- **문자열**: 이중 따옴표 (`"`) 선호
- **예외**: 작은 따옴표도 일부 사용됨 (일관성 개선 필요)

### 세미콜론
- **규칙**: 모든 문장 끝에 세미콜론 필수

### 라인 길이
- **최대**: 약 100-120자 (엄격한 제한 없음)

## 명명 규칙

### 파일명
```
kebab-case.ts          # TypeScript 파일
UPPER_CASE.md          # 주요 문서
lower-case.md          # 커맨드 정의
```

### 변수/함수
```typescript
const lowerCamelCase = "value";     // 변수
function lowerCamelCase() {}        // 함수
const UPPER_SNAKE_CASE = [];        // 상수 배열/설정
```

### 타입/인터페이스
```typescript
interface PascalCase {}             // 인터페이스
type PascalCase = {};               // 타입
```

## 함수 패턴

### 타입 정의
```typescript
// 공용 (export)
export interface RoutingRequest {
  prompt: string;
  options?: { ... };
}

// 내부 (no export)
interface CLIConfig {
  name: string;
  command: string;
}
```

### Union Types
```typescript
type CheckResult =
  | { type: "fileExists"; path: string; ok: boolean }
  | { type: "regex"; path: string; pattern: string; ok: boolean };
```

### 기본값 처리
```typescript
export function selectCLI(
  request: RoutingRequest,
  rules: RoutingRule[] = DEFAULT_RULES  // 기본값
): RoutingResult
```

### 옵셔널 체이닝
```typescript
sessionId = rawJson?.session_id ?? rawJson?.sessionId;
const usage = parsed.usage ? { ... } : undefined;
```

## 에러 처리

### Try-catch with 기본값
```typescript
try {
  content = readFileSync(path, "utf-8");
} catch {
  checks.push({ ... });
  continue;
}
```

### Safe 래퍼 함수
```typescript
function safeJsonParse(maybeJson: string) {
  const first = maybeJson.indexOf("{");
  if (first === -1) throw new Error("...");
  return JSON.parse(slice);
}
```

## 문서화

### 파일 헤더
```typescript
/**
 * filename.ts
 * - 한 줄 설명
 * - 다른 기능
 * - 사용 방법
 */
```

### 섹션 분리
```typescript
// ============================================================================
// Types
// ============================================================================

// ============================================================================
// Utility Functions
// ============================================================================
```

### 인라인 주석
```typescript
// 우선순위 내림차순 정렬
const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);
```

## 한글/영문 혼용

- **코드 주석**: 한글 + 영문 혼용
- **문서**: 한글 우선
- **키워드 배열**: 영문 + 한글 모두 포함
  ```typescript
  const CODE_KEYWORDS = [
    'function', 'class', 'code',  // 영문
    '코드', '함수', '클래스',      // 한글
  ];
  ```

## 린팅/포맷팅

**현재 상태**: 설정 파일 없음
- ESLint: 미설정
- Prettier: 미설정
- tsconfig.json: 미설정

**추론된 컨벤션** (코드에서 일관됨):
- 2칸 스페이스
- 이중 따옴표
- 세미콜론 필수
- camelCase/PascalCase 일관성
