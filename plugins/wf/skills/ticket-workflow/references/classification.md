# Ticket Classification: UI vs Non-UI

## Classification Algorithm

### Priority 1: Explicit Override

If user provides `--type ui` or `--type non-ui`, use that classification directly with confidence 1.0.

### Priority 2: File-Based Signals

Score based on affected file types:

| File Pattern | Signal | Weight |
|-------------|--------|--------|
| `*.css`, `*.scss`, `*.less`, `*.styled.*` | UI | +0.3 |
| `*.tsx`, `*.jsx` (with render/return JSX) | UI | +0.2 |
| `*.vue`, `*.svelte` (template section) | UI | +0.2 |
| `*.test.ts`, `*.spec.ts` (non-visual) | Non-UI | +0.1 |
| `*.py`, `*.go`, `*.rs` (backend) | Non-UI | +0.3 |
| `*api*`, `*route*`, `*handler*` | Non-UI | +0.2 |
| `*controller*`, `*service*`, `*model*` | Non-UI | +0.2 |

### Priority 3: Keyword Signals

Score based on ticket description keywords:

**UI indicators** (+0.15 each):
- layout, alignment, margin, padding, spacing
- color, font, typography, style, theme
- responsive, viewport, mobile, desktop, breakpoint
- render, display, visible, hidden, overflow
- animation, transition, hover, focus
- screenshot, visual, pixel, design
- button, modal, dialog, dropdown, menu, tooltip
- CSS, HTML, DOM, element

**Non-UI indicators** (+0.15 each):
- API, endpoint, request, response, status code
- database, query, migration, schema
- error, exception, crash, timeout, 500, 404
- authentication, authorization, token, session
- performance, memory, CPU, latency
- data, payload, serialization, parsing
- log, metric, monitoring
- CLI, command, argument, flag

### Classification Decision

```
ui_score = sum(ui_signals)
non_ui_score = sum(non_ui_signals)
total = ui_score + non_ui_score

if total == 0:
  type = "non-ui"  # default
  confidence = 0.5
else:
  if ui_score > non_ui_score:
    type = "ui"
    confidence = ui_score / total
  else:
    type = "non-ui"
    confidence = non_ui_score / total
```

### Confidence Thresholds

| Confidence | Action |
|-----------|--------|
| >= 0.8 | High confidence, proceed automatically |
| 0.6 - 0.8 | Medium confidence, note uncertainty |
| < 0.6 | Low confidence, consider asking user |

## Classification Impact

The ticket type determines:
1. **Evidence collection** — UI: capture screenshots; Non-UI: capture logs/errors
2. **Verification method** — UI: browser automation; Non-UI: test execution
3. **Tool selection** — UI: Playwright MCP / Chrome DevTools; Non-UI: test runner
