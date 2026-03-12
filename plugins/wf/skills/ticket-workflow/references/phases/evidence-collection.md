# Phase 1: Evidence Collection

> Sequential phase 1 of 4. Must complete before Planning phase.

## Purpose

Gather all relevant evidence from the codebase and runtime environment to understand the bug thoroughly before attempting a fix.

## Inputs

- Ticket description (text, URL, or structured issue)
- Optional: `--type ui|non-ui` override

## Procedure

### Step 1: Parse Ticket

Extract from the ticket description:
- **Summary**: One-line bug description
- **Symptoms**: What the user observes
- **Expected behavior**: What should happen instead
- **Reproduction steps**: How to trigger the bug
- **Environment**: Browser, OS, version, viewport (if UI)
- **Severity**: Critical / High / Medium / Low

### Step 2: Codebase Evidence Search

Launch exploration agents to find relevant code:

1. **Error trace agent** — Search for error messages, stack traces, log patterns mentioned in the ticket
2. **Component agent** — Identify the affected files, components, and modules
3. **History agent** — Check git log for recent changes to affected files

```
Agent prompts:
- "Search codebase for error patterns: '<error from ticket>'. Find all files containing related logic."
- "Identify the component tree and dependencies for '<affected area>'. List the 5-10 most relevant files."
- "Check git log for recent changes to files in '<affected area>'. Identify potential regression commits."
```

### Step 3: Reproduce the Issue (if possible)

**For UI tickets:**
- Dispatch a `browser-reproducer` agent to drive the browser session (see `agents/browser-reproducer.md`)
- Use available browser tools (Playwright MCP preferred) to detect tools and build a reproduction plan
- See [browser-automation.md](../browser-automation.md) for full integration reference
- Capture screenshots at key reproduction steps:
  1. **INITIAL_STATE** — Page loaded before interaction
  2. **PRE_ACTION** — State right before triggering the bug
  3. **BUG_REPRODUCED** — Bug visible / reproduced state
  4. **ERROR_STATE** — Error messages or broken UI visible (if applicable)
- Screenshots are saved to `{output_dir}/{ticket_id}/screenshots/` with structured filenames
- Supports multiple viewports (desktop and mobile) for responsive UI bugs
- Record DOM state and computed styles if relevant

> **Phase 2 Note**: Full browser automation (Playwright MCP screenshot capture) is implemented in Phase 2.
> Currently falls back to code-level analysis when browser tools are unavailable.

**For non-UI tickets:**
- Run relevant test suite to confirm failure
- Execute the reproduction steps via CLI/API calls
- Capture error output and logs

### Step 4: Evidence Summary

Produce a structured evidence report:

```
+- Evidence Report -----------------------------------------+
| Ticket: <summary>                                         |
| Type: <UI|non-UI|pending classification>                  |
|                                                           |
| Affected Files:                                           |
|   * src/components/Button.tsx                             |
|   * src/styles/button.css                                 |
|                                                           |
| Error Pattern: <matched patterns>                         |
| Recent Changes: <relevant commits>                        |
| Reproduction: <success|partial|failed>                    |
|                                                           |
| Evidence Quality: ???????? 80%                            |
+-----------------------------------------------------------+
```

## Error Handling

Follow the standard error handling patterns from [workflow-logger.md](../workflow-logger.md).

### Error Scenarios

| Error | Code | Recovery |
|-------|------|----------|
| Ticket text is empty/unparseable | `E_PARSE` | Log warning, ask user for clarification |
| Grep/Glob finds no matching files | `E_NOTFOUND` | Broaden search terms, try alternative keywords |
| Git log command fails | `E_TOOL` | Skip history check, log warning, continue |
| WebFetch for URL fails | `E_TIMEOUT` | Log warning, proceed without external evidence |
| Browser reproduction fails (UI) | `E_BROWSER` | Fall back to code-level reproduction |
| Agent timeout during exploration | `E_TIMEOUT` | Use simplified inline search |

### Logging Examples

```
[INFO ] [EVIDENCE   ] +0:00 — Phase started: Evidence Collection
[INFO ] [EVIDENCE   ] +0:05 — Parsing ticket description...
[DEBUG] [EVIDENCE   ] +0:08 — Extracted keywords: ["button", "alignment", "mobile"]
[INFO ] [EVIDENCE   ] +0:10 — Searching codebase for evidence...
[DEBUG] [EVIDENCE   ] +0:15 — Found 4 files matching: Button.tsx, button.css, Button.test.tsx, layout.tsx
[WARN ] [EVIDENCE   ] +0:20 — Degraded mode: git log failed for Button.tsx
  Original: Check recent changes to Button.tsx
  Fallback: Proceeding without history analysis
[INFO ] [EVIDENCE   ] +0:30 — Phase completed: Evidence Collection (score: 80%)
```

### Degradation Rules

| Failure | Degradation |
|---------|-------------|
| No codebase matches found | Proceed with ticket description only, score reduced |
| Reproduction fails | Mark reproduction as "not confirmed", continue with code analysis |
| External URL unreachable | Skip external evidence, note in report |
| Agent exploration timeout | Use direct Grep/Glob instead of agent |

## Quality Criteria

| Metric | Weight | Description |
|--------|--------|-------------|
| Files identified | 30% | Relevant source files found |
| Error traced | 25% | Root cause error pattern located |
| Reproduction | 25% | Bug successfully reproduced |
| History checked | 20% | Recent changes analyzed |

## Output

Pass to Phase 2 (Planning):
- `evidence_report`: Structured evidence summary
- `affected_files`: List of files to modify
- `ticket_type_hint`: UI or non-UI classification hint
- `reproduction_result`: Success/failure of reproduction
- `evidence_quality_score`: 0.0 - 1.0
- `screenshot_references`: List of screenshot file paths and metadata (UI tickets only)
- `screenshot_summary`: Capture summary with step coverage and file sizes
