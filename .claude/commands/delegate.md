---
description: Delegate a task to the claude-cli-runner subagent which runs `node agent.ts` to invoke `claude -p --output-format json` and returns a machine-readable success/failure report.
argument-hint: <task prompt> [--expect-file path] [--expect-regex path:regex]
allowed-tools: Bash, Read
---
Use the **claude-cli-runner** subagent to execute this task headlessly via `agent.ts`.

1) Run:
   - `npm run agent -- "<TASK>" --expect-file <path> [--expect-regex <path:regex>]`

2) Report back:
   - SUCCESS/FAILURE (based on agent.ts exit code and checks)
   - The JSON report (or key fields: ok, checks, claude.session_id)

Task:
$ARGUMENTS

