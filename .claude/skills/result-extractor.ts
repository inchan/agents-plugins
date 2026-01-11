/**
 * result-extractor.ts
 * - Extracts and normalizes results from various AI CLIs
 * - Classifies errors into recoverable categories
 * - Provides unified interface for routing logic
 */

// ============================================================================
// Types (imported pattern from multi-cli-runner.ts)
// ============================================================================

export interface RunResult {
  ok: boolean;
  cli: string;
  prompt: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  output: {
    exitCode: number | null;
    stdout?: string;
    stderr?: string;
    parsed?: any;
    error?: string;
  };
}

export type ErrorType =
  | 'CLI_NOT_FOUND'    // CLI가 PATH에 없음
  | 'TIMEOUT'          // 실행 시간 초과
  | 'AUTH_ERROR'       // 인증 실패
  | 'API_ERROR'        // API 호출 실패
  | 'PARSE_ERROR'      // 출력 파싱 실패
  | 'RATE_LIMIT'       // 요청 제한
  | 'UNKNOWN';         // 기타

export interface NormalizedResult {
  success: boolean;
  content: string;          // AI 응답 텍스트
  metadata: {
    cli: string;
    sessionId?: string;
    usage?: { inputTokens: number; outputTokens: number };
    costUsd?: number;
    durationMs: number;
  };
  error?: {
    type: ErrorType;
    message: string;
    recoverable: boolean;
  };
}

// ============================================================================
// Error Classification
// ============================================================================

const ERROR_PATTERNS: { pattern: RegExp; type: ErrorType; recoverable: boolean }[] = [
  // CLI not found
  { pattern: /command not found|ENOENT|not found in PATH/i, type: 'CLI_NOT_FOUND', recoverable: false },
  { pattern: /spawn .* ENOENT/i, type: 'CLI_NOT_FOUND', recoverable: false },

  // Timeout
  { pattern: /timeout|ETIMEDOUT|timed out/i, type: 'TIMEOUT', recoverable: true },
  { pattern: /SIGTERM|killed/i, type: 'TIMEOUT', recoverable: true },

  // Auth errors
  { pattern: /unauthorized|401|authentication|not authenticated|invalid.*key/i, type: 'AUTH_ERROR', recoverable: false },
  { pattern: /forbidden|403|access denied/i, type: 'AUTH_ERROR', recoverable: false },

  // Rate limiting
  { pattern: /rate limit|429|too many requests|quota exceeded/i, type: 'RATE_LIMIT', recoverable: true },

  // API errors
  { pattern: /500|502|503|504|internal server error|bad gateway|service unavailable/i, type: 'API_ERROR', recoverable: true },
  { pattern: /ECONNREFUSED|ECONNRESET|network error/i, type: 'API_ERROR', recoverable: true },

  // Parse errors
  { pattern: /parse|JSON|syntax error|unexpected token/i, type: 'PARSE_ERROR', recoverable: false },
];

export function classifyError(runResult: RunResult): { type: ErrorType; recoverable: boolean } {
  const errorText = [
    runResult.output.error,
    runResult.output.stderr,
    runResult.output.stdout,
  ].filter(Boolean).join(' ');

  for (const { pattern, type, recoverable } of ERROR_PATTERNS) {
    if (pattern.test(errorText)) {
      return { type, recoverable };
    }
  }

  return { type: 'UNKNOWN', recoverable: false };
}

// ============================================================================
// CLI-specific Extractors
// ============================================================================

function extractClaudeResult(parsed: any): Partial<NormalizedResult> {
  if (!parsed) {
    return { success: false, content: '' };
  }

  const content = parsed.result ?? parsed.raw ?? '';
  const usage = parsed.usage ? {
    inputTokens: (parsed.usage.input_tokens ?? 0) +
                 (parsed.usage.cache_read_input_tokens ?? 0) +
                 (parsed.usage.cache_creation_input_tokens ?? 0),
    outputTokens: parsed.usage.output_tokens ?? 0,
  } : undefined;

  return {
    success: !parsed.is_error,
    content,
    metadata: {
      cli: 'claude',
      sessionId: parsed.session_id,
      usage,
      costUsd: parsed.total_cost_usd,
      durationMs: parsed.duration_ms ?? 0,
    },
  };
}

function extractCodexResult(parsed: any): Partial<NormalizedResult> {
  if (!parsed) {
    return { success: false, content: '' };
  }

  return {
    success: true,
    content: parsed.result ?? parsed.raw ?? '',
    metadata: {
      cli: 'codex',
      durationMs: 0,
    },
  };
}

function extractEchoResult(parsed: any): Partial<NormalizedResult> {
  if (!parsed) {
    return { success: false, content: '' };
  }

  return {
    success: true,
    content: parsed.echoed ?? parsed.raw ?? '',
    metadata: {
      cli: 'echo',
      durationMs: 0,
    },
  };
}

function extractGenericResult(cli: string, parsed: any): Partial<NormalizedResult> {
  if (!parsed) {
    return { success: false, content: '' };
  }

  const content = parsed.result ?? parsed.output ?? parsed.raw ??
                  (typeof parsed === 'string' ? parsed : JSON.stringify(parsed));

  return {
    success: true,
    content,
    metadata: {
      cli,
      durationMs: 0,
    },
  };
}

// ============================================================================
// Main Extractor
// ============================================================================

export function extractResult(runResult: RunResult): NormalizedResult {
  // Handle error cases first
  if (!runResult.ok) {
    const { type, recoverable } = classifyError(runResult);
    return {
      success: false,
      content: '',
      metadata: {
        cli: runResult.cli,
        durationMs: runResult.durationMs,
      },
      error: {
        type,
        message: runResult.output.error ?? runResult.output.stderr ?? 'Unknown error',
        recoverable,
      },
    };
  }

  // Extract based on CLI type
  const parsed = runResult.output.parsed;
  let extracted: Partial<NormalizedResult>;

  switch (runResult.cli) {
    case 'claude':
      extracted = extractClaudeResult(parsed);
      break;
    case 'codex':
      extracted = extractCodexResult(parsed);
      break;
    case 'echo':
      extracted = extractEchoResult(parsed);
      break;
    default:
      extracted = extractGenericResult(runResult.cli, parsed);
  }

  // Merge with base result
  return {
    success: extracted.success ?? runResult.ok,
    content: extracted.content ?? '',
    metadata: {
      ...extracted.metadata,
      cli: runResult.cli,
      durationMs: runResult.durationMs,
    },
    error: extracted.error,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

export function isRecoverable(result: NormalizedResult): boolean {
  return result.error?.recoverable ?? false;
}

export function getErrorMessage(result: NormalizedResult): string | undefined {
  return result.error?.message;
}

export function formatUsage(result: NormalizedResult): string {
  if (!result.metadata.usage) {
    return 'N/A';
  }
  const { inputTokens, outputTokens } = result.metadata.usage;
  return `${inputTokens} in / ${outputTokens} out`;
}
