#!/usr/bin/env node
/**
 * agent.ts
 * - Runs Claude Code in non-interactive mode: `claude -p "<prompt>" --output-format json`
 * - Parses JSON output (result + session_id + metadata)
 * - Performs deterministic success/failure checks (expected files / regex)
 *
 * Requires:
 *   - Claude Code CLI installed and authenticated (`claude` on PATH)
 *   - Node 18+ (example uses: `node --import tsx agent.ts`)
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

type CheckResult =
  | { type: "fileExists"; path: string; ok: boolean; message?: string }
  | { type: "regex"; path: string; pattern: string; ok: boolean; message?: string };

type Report = {
  ok: boolean;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  prompt: string;
  claude: {
    exitCode: number | null;
    session_id?: string;
    result?: string;
    rawJson?: any;
    stderr?: string;
  };
  checks: CheckResult[];
  notes?: string[];
};

function parseArgs(argv: string[]) {
  // Positional: first non-flag token is prompt; remaining prompt tokens allowed until a flag starts.
  const args = { prompt: "", expectFiles: [] as string[], expectRegex: [] as { path: string; pattern: string }[], allowedTools: "Bash,Read,Edit", maxTurns: "10" };
  const rest = [...argv];

  // If user passed `--` before prompt, ignore it.
  if (rest[0] === "--") rest.shift();

  // Prompt: first token that doesn't start with '-' and everything until a flag that matches known flags
  // Simpler: if first token doesn't start with '-', treat it as entire prompt; else require --prompt
  if (rest.length && !rest[0].startsWith("-")) {
    args.prompt = rest.shift()!;
  }

  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--prompt") {
      args.prompt = rest[++i] ?? "";
    } else if (a === "--expect-file") {
      args.expectFiles.push(rest[++i] ?? "");
    } else if (a === "--expect-regex") {
      const v = rest[++i] ?? "";
      const idx = v.indexOf(":");
      if (idx === -1) throw new Error(`--expect-regex must be "path:regex", got: ${v}`);
      args.expectRegex.push({ path: v.slice(0, idx), pattern: v.slice(idx + 1) });
    } else if (a === "--allowedTools") {
      args.allowedTools = rest[++i] ?? args.allowedTools;
    } else if (a === "--max-turns") {
      args.maxTurns = rest[++i] ?? args.maxTurns;
    } else if (a === "--help" || a === "-h") {
      printHelpAndExit(0);
    } else if (a.startsWith("-")) {
      // Unknown flag
      throw new Error(`Unknown flag: ${a}`);
    } else {
      // If prompt contained spaces and wasn't quoted, append
      if (!args.prompt) args.prompt = a;
      else args.prompt += " " + a;
    }
  }

  if (!args.prompt) {
    printHelpAndExit(1, "Missing prompt. Provide a quoted prompt or use --prompt.");
  }
  return args;
}

function printHelpAndExit(code: number, msg?: string) {
  if (msg) console.error(msg);
  console.error(`
Usage:
  node --import tsx agent.ts "<prompt>" [options]

Options:
  --prompt "<prompt>"                 Provide prompt (if not positional)
  --expect-file <path>                Expect file to exist after Claude run (repeatable)
  --expect-regex <path:regex>         Expect file content to match regex (repeatable)
  --allowedTools "Bash,Read,Edit"     Auto-approve tools in -p mode (default: Bash,Read,Edit)
  --max-turns <N>                     Limit agentic turns (default: 10)
  -h, --help                          Show this help

Examples:
  node --import tsx agent.ts "Create out/hello.txt containing hello" --expect-file out/hello.txt --expect-regex out/hello.txt:hello
  node --import tsx agent.ts "Do nothing" --expect-file out/missing.txt
`.trim());
  process.exit(code);
}

function safeJsonParse(maybeJson: string) {
  // Claude -p --output-format json should return pure JSON, but be defensive.
  const first = maybeJson.indexOf("{");
  const last = maybeJson.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("Could not locate JSON object in stdout.");
  }
  const slice = maybeJson.slice(first, last + 1);
  return JSON.parse(slice);
}

function run() {
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  const { prompt, expectFiles, expectRegex, allowedTools, maxTurns } = parseArgs(process.argv.slice(2));

  // Ensure out/ exists for demos (non-fatal).
  try { mkdirSync("out", { recursive: true }); } catch {}

  const cmd = "claude";
  const cliArgs = [
    "-p", prompt,
    "--output-format", "json",
    "--allowedTools", allowedTools,
    "--max-turns", maxTurns
  ];

  const res = spawnSync(cmd, cliArgs, { encoding: "utf-8" });

  const checks: CheckResult[] = [];
  const notes: string[] = [];

  let rawJson: any | undefined;
  let resultText: string | undefined;
  let sessionId: string | undefined;

  if (res.error) {
    notes.push(`Failed to run '${cmd}'. Is Claude Code installed and on PATH?`);
  } else {
    try {
      rawJson = safeJsonParse(res.stdout ?? "");
      resultText = rawJson?.result;
      sessionId = rawJson?.session_id ?? rawJson?.sessionId;
    } catch (e: any) {
      notes.push(`Failed to parse JSON output: ${e?.message ?? String(e)}`);
    }
  }

  // Deterministic checks: file existence
  for (const p of expectFiles) {
    if (!p) continue;
    const ok = existsSync(p);
    checks.push({ type: "fileExists", path: p, ok, message: ok ? "exists" : "missing" });
  }

  // Deterministic checks: regex match
  for (const r of expectRegex) {
    const { path, pattern } = r;
    if (!path) continue;
    if (!existsSync(path)) {
      checks.push({ type: "regex", path, pattern, ok: false, message: "file missing" });
      continue;
    }
    let content = "";
    try { content = readFileSync(path, "utf-8"); }
    catch { checks.push({ type: "regex", path, pattern, ok: false, message: "read failed" }); continue; }

    let ok = false;
    try { ok = new RegExp(pattern, "m").test(content); }
    catch { ok = false; }
    checks.push({ type: "regex", path, pattern, ok, message: ok ? "matched" : "no match" });
  }

  const exitCode = res.status;
  const hardFail = !!res.error || exitCode !== 0 || !rawJson;
  const checkFail = checks.some(c => !c.ok);
  const ok = !(hardFail || checkFail);

  const ended = Date.now();
  const report: Report = {
    ok,
    startedAt,
    endedAt: new Date(ended).toISOString(),
    durationMs: ended - started,
    prompt,
    claude: {
      exitCode,
      session_id: sessionId,
      result: typeof resultText === "string" ? resultText.slice(0, 5000) : undefined,
      rawJson,
      stderr: res.stderr?.slice(0, 5000) || undefined
    },
    checks,
    notes: notes.length ? notes : undefined
  };

  // Print a single JSON object to stdout for easy parsing
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  process.exit(ok ? 0 : 1);
}

run();

