/**
 * router.ts
 * - 자연어 요청을 분석하여 적절한 AI CLI 선택
 * - 확장 가능한 라우팅 규칙 시스템
 * - 우선순위 기반 매칭
 */

// ============================================================================
// Types
// ============================================================================

export interface RoutingRequest {
  prompt: string;
  options?: {
    preferSpeed?: boolean;    // 속도 우선
    preferQuality?: boolean;  // 품질 우선
    preferCost?: boolean;     // 비용 우선
    domain?: string;          // 특정 도메인 (code, writing, analysis, etc.)
    testMode?: boolean;       // 테스트 모드
  };
}

export interface RoutingRule {
  name: string;
  priority: number;           // 높을수록 먼저 평가
  match: (request: RoutingRequest) => boolean;
  target: string;             // CLI 이름
  fallback?: string;          // 실패 시 대체 CLI
  description?: string;
}

export interface RoutingResult {
  cli: string;
  rule: string;               // 매칭된 규칙 이름
  fallback?: string;          // 실패 시 대체 CLI
  confidence: number;         // 0-1 매칭 신뢰도
}

// ============================================================================
// Keyword Patterns
// ============================================================================

const CODE_KEYWORDS = [
  // 영어 키워드
  'function', 'class', 'code', 'debug', 'fix', 'bug', 'error',
  'implement', 'refactor', 'test', 'unit test', 'api', 'endpoint',
  'typescript', 'javascript', 'python', 'rust', 'go',
  'compile', 'build', 'deploy', 'git', 'commit',
  // 한글 키워드
  '코드', '함수', '클래스', '디버그', '버그', '에러', '오류',
  '구현', '리팩토링', '테스트', '빌드', '배포',
];

const ANALYSIS_KEYWORDS = [
  'analyze', 'analysis', 'explain', 'review', 'audit',
  '분석', '설명', '리뷰', '검토',
];

const CREATIVE_KEYWORDS = [
  'write', 'create', 'generate', 'draft', 'compose',
  '작성', '생성', '만들어', '써줘',
];

// ============================================================================
// Utility Functions
// ============================================================================

function containsKeyword(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(kw => lowerText.includes(kw.toLowerCase()));
}

function calculateConfidence(request: RoutingRequest, keywords: string[]): number {
  const lowerPrompt = request.prompt.toLowerCase();
  const matchCount = keywords.filter(kw =>
    lowerPrompt.includes(kw.toLowerCase())
  ).length;

  // 매칭된 키워드 수에 따른 신뢰도 (최대 1.0)
  return Math.min(matchCount * 0.2 + 0.5, 1.0);
}

// ============================================================================
// Default Routing Rules
// ============================================================================

export const DEFAULT_RULES: RoutingRule[] = [
  // 테스트 모드 - 최우선
  {
    name: 'test-mode',
    priority: 100,
    match: (req) => req.options?.testMode === true,
    target: 'echo',
    description: '테스트 모드 활성화시 echo 사용',
  },

  // 코드 관련 작업 - codex 우선
  {
    name: 'code-tasks',
    priority: 80,
    match: (req) => containsKeyword(req.prompt, CODE_KEYWORDS),
    target: 'codex',
    fallback: 'claude',
    description: '코드 관련 작업은 codex로 라우팅',
  },

  // 속도 우선 옵션
  {
    name: 'speed-priority',
    priority: 70,
    match: (req) => req.options?.preferSpeed === true,
    target: 'codex',
    fallback: 'claude',
    description: '속도 우선시 codex 사용',
  },

  // 품질 우선 옵션
  {
    name: 'quality-priority',
    priority: 70,
    match: (req) => req.options?.preferQuality === true,
    target: 'claude',
    description: '품질 우선시 claude 사용',
  },

  // 분석 작업
  {
    name: 'analysis-tasks',
    priority: 60,
    match: (req) => containsKeyword(req.prompt, ANALYSIS_KEYWORDS),
    target: 'claude',
    description: '분석/설명 작업은 claude로 라우팅',
  },

  // 창작 작업
  {
    name: 'creative-tasks',
    priority: 50,
    match: (req) => containsKeyword(req.prompt, CREATIVE_KEYWORDS),
    target: 'claude',
    description: '창작/작문 작업은 claude로 라우팅',
  },

  // 기본 규칙 - 항상 매칭
  {
    name: 'default',
    priority: 0,
    match: () => true,
    target: 'claude',
    description: '기본값: claude 사용',
  },
];

// ============================================================================
// Router Functions
// ============================================================================

/**
 * 요청을 분석하여 적절한 CLI 선택
 */
export function selectCLI(
  request: RoutingRequest,
  rules: RoutingRule[] = DEFAULT_RULES
): RoutingResult {
  // 우선순위 내림차순 정렬
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    if (rule.match(request)) {
      // 코드 작업인 경우 신뢰도 계산
      const confidence = rule.name === 'code-tasks'
        ? calculateConfidence(request, CODE_KEYWORDS)
        : rule.name === 'default' ? 0.5 : 0.8;

      return {
        cli: rule.target,
        rule: rule.name,
        fallback: rule.fallback,
        confidence,
      };
    }
  }

  // 이론상 도달 불가 (default 규칙이 항상 매칭)
  return {
    cli: 'claude',
    rule: 'fallback',
    confidence: 0.3,
  };
}

/**
 * 라우팅 결과를 사람이 읽기 쉬운 형태로 출력
 */
export function explainRouting(result: RoutingResult): string {
  const parts = [
    `CLI: ${result.cli}`,
    `Rule: ${result.rule}`,
    `Confidence: ${(result.confidence * 100).toFixed(0)}%`,
  ];

  if (result.fallback) {
    parts.push(`Fallback: ${result.fallback}`);
  }

  return parts.join(' | ');
}

/**
 * 규칙 목록 조회
 */
export function listRules(rules: RoutingRule[] = DEFAULT_RULES): void {
  const sorted = [...rules].sort((a, b) => b.priority - a.priority);
  console.log('\n=== Routing Rules ===\n');
  for (const rule of sorted) {
    console.log(`[${rule.priority}] ${rule.name} → ${rule.target}`);
    if (rule.description) {
      console.log(`    ${rule.description}`);
    }
    if (rule.fallback) {
      console.log(`    fallback: ${rule.fallback}`);
    }
    console.log();
  }
}

// ============================================================================
// CLI Interface (for testing)
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const prompt = process.argv[2] ?? 'hello world';
  const testMode = process.argv.includes('--test');
  const preferSpeed = process.argv.includes('--speed');
  const preferQuality = process.argv.includes('--quality');

  const request: RoutingRequest = {
    prompt,
    options: { testMode, preferSpeed, preferQuality },
  };

  console.log(`\nPrompt: "${prompt}"`);
  console.log(`Options: ${JSON.stringify(request.options)}\n`);

  const result = selectCLI(request);
  console.log(`Result: ${explainRouting(result)}`);
}
