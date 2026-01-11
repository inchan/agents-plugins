#!/usr/bin/env node
/**
 * multi-cli-runner.ts
 * - Runs multiple AI CLIs (codex, claude, echo-mock) via spawnSync
 * - Abstracts CLI execution with configurable parsers
 * - Returns JSON output for integration with router systems
 *
 * Usage:
 *   node --import tsx multi-cli-runner.ts --cli claude --prompt "say hello"
 *   node --import tsx multi-cli-runner.ts --cli codex --prompt "list files"
 *   node --import tsx multi-cli-runner.ts --cli echo --prompt "test message"
 */
import { spawnSync, SpawnSyncReturns } from "node:child_process";
import { extractResult, type NormalizedResult } from "./result-extractor.ts";
import { selectCLI, explainRouting } from "./router.ts";

// ============================================================================
// Types
// ============================================================================

interface CLIConfig {
  name: string;
  command: string;
  buildArgs: (prompt: string) => string[];
  parseOutput: (stdout: string) => any;
  timeout?: number; // ms
}

interface RunResult {
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

// ============================================================================
// CLI Configurations
// ============================================================================

function safeJsonParse(maybeJson: string): any {
  const first = maybeJson.indexOf("{");
  const last = maybeJson.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    return { raw: maybeJson.trim() };
  }
  try {
    return JSON.parse(maybeJson.slice(first, last + 1));
  } catch {
    return { raw: maybeJson.trim() };
  }
}

const CLI_CONFIGS: Record<string, CLIConfig> = {
  claude: {
    name: "claude",
    command: "claude",
    buildArgs: (prompt: string) => [
      "-p", prompt,
      "--output-format", "json",
      "--max-turns", "3"
    ],
    parseOutput: safeJsonParse,
    timeout: 120000, // 2 minutes
  },

  codex: {
    name: "codex",
    command: "codex",
    buildArgs: (prompt: string) => [
      "exec", prompt
    ],
    parseOutput: (stdout: string) => ({ result: stdout.trim() }),
    timeout: 120000,
  },

  gemini: {
    name: "gemini",
    command: "gemini",
    buildArgs: (prompt: string) => [
      "-p", prompt,
      "--output-format", "json"
    ],
    parseOutput: safeJsonParse,
    timeout: 120000,
  },

  // Echo mock for testing without AI CLIs
  echo: {
    name: "echo",
    command: "echo",
    buildArgs: (prompt: string) => [prompt],
    parseOutput: (stdout: string) => ({ echoed: stdout.trim() }),
    timeout: 5000,
  },

  // Fake CLI for error testing
  fake: {
    name: "fake",
    command: "nonexistent-cli-for-testing",
    buildArgs: (prompt: string) => [prompt],
    parseOutput: (stdout: string) => ({ result: stdout.trim() }),
    timeout: 5000,
  },
};

// ============================================================================
// Core Runner
// ============================================================================

function runCLI(config: CLIConfig, prompt: string): RunResult {
  const started = Date.now();
  const startedAt = new Date(started).toISOString();

  const args = config.buildArgs(prompt);

  let res: SpawnSyncReturns<string>;
  try {
    res = spawnSync(config.command, args, {
      encoding: "utf-8",
      timeout: config.timeout,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
  } catch (e: any) {
    const ended = Date.now();
    return {
      ok: false,
      cli: config.name,
      prompt,
      startedAt,
      endedAt: new Date(ended).toISOString(),
      durationMs: ended - started,
      output: {
        exitCode: null,
        error: `Failed to spawn: ${e?.message ?? String(e)}`,
      },
    };
  }

  const ended = Date.now();
  const exitCode = res.status;
  const stdout = res.stdout ?? "";
  const stderr = res.stderr ?? "";

  let parsed: any = undefined;
  let parseError: string | undefined;

  if (!res.error && exitCode === 0 && stdout) {
    try {
      parsed = config.parseOutput(stdout);
    } catch (e: any) {
      parseError = `Parse failed: ${e?.message ?? String(e)}`;
    }
  }

  const ok = !res.error && exitCode === 0;

  return {
    ok,
    cli: config.name,
    prompt,
    startedAt,
    endedAt: new Date(ended).toISOString(),
    durationMs: ended - started,
    output: {
      exitCode,
      stdout: stdout.slice(0, 5000),
      stderr: stderr.slice(0, 2000) || undefined,
      parsed,
      error: res.error?.message ?? parseError,
    },
  };
}

// ============================================================================
// CLI Interface
// ============================================================================

interface ParsedArgs {
  cli: string;
  prompt: string;
  normalize: boolean;
  auto: boolean;
  testMode: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = { cli: "", prompt: "", normalize: false, auto: false, testMode: false };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--cli" || a === "-c") {
      args.cli = argv[++i] ?? "";
    } else if (a === "--prompt" || a === "-p") {
      args.prompt = argv[++i] ?? "";
    } else if (a === "--normalize" || a === "-n") {
      args.normalize = true;
    } else if (a === "--auto" || a === "-a") {
      args.auto = true;
    } else if (a === "--test") {
      args.testMode = true;
    } else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    } else if (!a.startsWith("-") && !args.prompt) {
      args.prompt = a;
    }
  }

  if (!args.prompt) {
    console.error("Error: Missing prompt. Use --prompt or provide as argument.");
    printHelp();
    process.exit(1);
  }

  // Auto mode: 라우터가 CLI 선택
  if (args.auto) {
    const routing = selectCLI({ prompt: args.prompt, options: { testMode: args.testMode } });
    args.cli = routing.cli;
    console.error(`[Router] ${explainRouting(routing)}`);
  } else if (!args.cli) {
    args.cli = "echo"; // 기본값
  }

  if (!CLI_CONFIGS[args.cli]) {
    console.error(`Error: Unknown CLI "${args.cli}". Available: ${Object.keys(CLI_CONFIGS).join(", ")}`);
    process.exit(1);
  }

  return args;
}

function printHelp() {
  console.log(`
Multi-CLI Runner - Execute AI CLIs and collect results

Usage:
  node --import tsx multi-cli-runner.ts --cli <name> --prompt "<prompt>"
  node --import tsx multi-cli-runner.ts --auto "<prompt>"

Options:
  --cli, -c <name>       CLI to use: ${Object.keys(CLI_CONFIGS).join(", ")}
  --prompt, -p <prompt>  Prompt to send to CLI
  --auto, -a             Auto-select CLI based on prompt content
  --test                 Enable test mode (routes to echo)
  --normalize, -n        Output normalized result format
  -h, --help             Show this help

Examples:
  node --import tsx multi-cli-runner.ts --cli echo "hello world"
  node --import tsx multi-cli-runner.ts --auto "write a function"
  node --import tsx multi-cli-runner.ts --auto --test "any prompt"
  node --import tsx multi-cli-runner.ts --auto "hello" --normalize
`.trim());
}

function main() {
  const { cli, prompt, normalize } = parseArgs(process.argv.slice(2));
  const config = CLI_CONFIGS[cli];

  const result = runCLI(config, prompt);

  // Output as JSON - normalized or raw
  if (normalize) {
    const normalized = extractResult(result);
    process.stdout.write(JSON.stringify(normalized, null, 2) + "\n");
    process.exit(normalized.success ? 0 : 1);
  } else {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    process.exit(result.ok ? 0 : 1);
  }
}

main();
