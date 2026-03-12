# Browser Automation Integration

> Reference document for UI issue reproduction and verification via browser automation tools.

> **Phase 2 Note**: Full browser automation integration (Playwright MCP, Chrome DevTools) is planned for Phase 2.
> Currently, browser-based reproduction falls back to code-level analysis.

## Overview

UI tickets require browser-based reproduction and verification. This module provides a unified interface over three browser automation backends, with automatic detection and graceful fallback.

## Tool Priority Chain

```
Playwright MCP   ──▶  Chrome DevTools  ──▶  Agent Browser  ──▶  Code Analysis
(preferred)           (alternative)         (fallback)           (always avail)
     ▲ FAIL                ▲ FAIL               ▲ FAIL
     └────────────────────└────────────────────└──── degradation chain
```

### 1. Playwright MCP (preferred)

- Full browser control via MCP tool calls
- Supports navigation, interaction, screenshots, DOM inspection
- Requires: `playwright` npm package or Playwright MCP server configured
- **Phase 2에서 구현 예정**

### 2. Chrome DevTools Protocol (alternative)

- Direct Chrome/Chromium control via CDP
- Supports page navigation, JS evaluation, screenshots
- Requires: Chrome/Chromium binary or puppeteer
- **Phase 2에서 구현 예정**

### 3. Agent Browser Skill (fallback)

- Delegates to an agent-browser plugin for visual interaction
- Natural language instructions for each step
- Requires: `agent-browser` plugin installed

### 4. Code Analysis (always available)

- No browser needed — analyzes code directly
- Reads component files, CSS, test assertions
- Produces code-level evidence instead of visual evidence

## Integration Points

### Phase 1: Evidence Collection (Reproduction)

During evidence collection, if the ticket is classified as UI:

```
1. Detect available browser tools
2. Extract reproduction URL from ticket
3. Infer viewport from ticket context (mobile/tablet/desktop)
4. Parse reproduction steps from ticket
5. Launch browser session (or fall back to code analysis)
6. Execute reproduction steps
7. Capture "before" state (screenshots, DOM, styles)
8. Record reproduction result in evidence
```

**Agent**: `browser-reproducer` — executes the reproduction plan

### Phase 6: Verification (Post-fix Check)

After implementation, for UI tickets:

```
1. Use the same tool detected in Phase 1
2. Navigate to the same URL
3. Execute the same reproduction steps
4. Capture "after" state
5. Compare "before" vs "after" captures
6. Run visual assertions (element visibility, style values)
7. Report visual verification pass/fail
```

## URL Extraction

URLs are extracted from ticket data in priority order:

| Source | Priority | Example |
|--------|----------|---------|
| Explicit URL field | 1 | `url: "http://localhost:3000/page"` |
| localhost/dev URLs in text | 2 | Found in description or steps |
| Steps to reproduce | 3 | "Go to http://example.com/page" |
| Any URL in ticket text | 4 | First URL found anywhere |

## Viewport Inference

The viewport is inferred from ticket context:

| Signal | Viewport | Resolution |
|--------|----------|------------|
| "mobile", "iPhone", "Android" | Mobile | 375x812 |
| "tablet", "iPad" | Tablet | 768x1024 |
| "landscape" | Mobile Landscape | 812x375 |
| Explicit `viewport:` or `resolution:` | Custom | As specified |
| Default | Desktop | 1280x720 |

## Reproduction Step Types

| Type | Trigger Keywords | Example |
|------|-----------------|---------|
| `navigate` | go to, open, visit, load | "Go to /dashboard" |
| `click` | click, tap, press | "Click the submit button" |
| `type` | type, enter, input | "Type 'hello' in search" |
| `scroll` | scroll | "Scroll down" |
| `hover` | hover, mouse over | "Hover over the menu" |
| `wait` | wait, wait for | "Wait 2 seconds" |
| `resize` | resize, set viewport | "Resize to 375x812" |
| `screenshot` | (auto-added) | Capture final state |
| `assert_visible` | verify visible | "Verify modal is visible" |
| `assert_text` | verify text | "Verify 'Error' in alert" |
| `assert_style` | verify style | "Verify margin-left: 8px" |

## Error Handling

### Error Codes

| Code | Meaning | Recovery |
|------|---------|----------|
| `E_BROWSER` | Browser launch/interaction failure | Fall back to next tool |
| `E_TIMEOUT` | Page load or step timeout | Retry once, then skip |
| `E_NOTFOUND` | Element not found in DOM | Try alternative selector |
| `E_TOOL` | Tool not available | Fall back in priority chain |

### Degradation Chain

```
[WARN ] [BROWSER] — Degraded mode: Playwright MCP unavailable
  Original: Browser screenshot comparison
  Fallback: Trying Chrome DevTools Protocol

[WARN ] [BROWSER] — Degraded mode: Chrome DevTools unavailable
  Original: Chrome DevTools visual check
  Fallback: Trying agent-browser skill

[WARN ] [BROWSER] — Degraded mode: No browser tools available
  Original: Browser-based reproduction
  Fallback: Code-level analysis only
```

## Data Flow

### Into Evidence Report

Browser reproduction produces structured evidence:

```
{
    "status": "success" | "partial" | "failed",
    "method": "browser:playwright_mcp",
    "details": "Executed 5/5 steps. Tool: playwright_mcp. URL: http://...",
    "error_output": "",
    "screenshot_path": "/tmp/screenshot_before.png"
}
```

### Into Verification Report

Post-fix verification produces:

```
visual_comparison: {
    "status": "match" | "mismatch",
    "before_screenshot": "...",
    "after_screenshot": "...",
    "differences": [...],
    "assertions_passed": 3,
    "assertions_failed": 0
}
```

## Claude Code Direct Execution

Browser automation steps are executed directly via Claude Code tools:

```
# Detect browser tools
Use Bash tool: check if playwright, puppeteer, or chrome-devtools are available

# Extract URL from ticket
Parse ticket description for URL patterns using Read tool

# Build reproduction plan
Analyze ticket steps and map to browser actions

# Execute reproduction
Use available MCP tools or fall back to code analysis via Read/Grep/Glob
```
