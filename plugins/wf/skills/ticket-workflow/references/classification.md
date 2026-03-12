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

---

## Classification Output Schema

Defines the output structure for ticket type classification (UI vs non-UI).

### `TicketClassification`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ticket_id` | string | yes | Identifier of the ticket being classified |
| `classification` | `TicketType` | yes | The determined ticket type |
| `confidence` | number (0.0-1.0) | yes | Confidence score for the classification |
| `reasoning` | `ClassificationReasoning` | yes | Evidence and logic behind the classification |
| `ui_details` | `UIDetails \| null` | no | Additional UI-specific metadata (present only when `classification` is `ui`) |
| `timestamp` | string (ISO 8601) | yes | When the classification was performed |

### `TicketType` (enum)

| Value | Description |
|-------|-------------|
| `ui` | Ticket involves visual, layout, styling, interaction, or browser-rendered behavior |
| `non-ui` | Ticket involves backend logic, data processing, API, CLI, or non-visual behavior |

### `ClassificationReasoning`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `signals` | `ClassificationSignal[]` | yes | Individual signals that informed the classification |
| `summary` | string | yes | Human-readable explanation of the classification decision |
| `dominant_category` | string | yes | The primary signal category that most influenced the result |

### `ClassificationSignal`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `category` | `SignalCategory` | yes | The type of signal detected |
| `indicator` | string | yes | The specific evidence or keyword found |
| `source` | `SignalSource` | yes | Where this signal was found |
| `weight` | number (0.0-1.0) | yes | How strongly this signal influences the classification |
| `direction` | `ui \| non-ui` | yes | Which classification this signal supports |

### `SignalCategory` (enum)

| Value | Description |
|-------|-------------|
| `keyword` | UI/non-UI keywords found in ticket text (e.g., "button", "CSS", "API", "database") |
| `file_reference` | File paths mentioned that indicate UI or non-UI code (e.g., `.tsx`, `.css` vs `.py`, `.sql`) |
| `component_reference` | References to UI components, pages, or backend services |
| `error_type` | Type of error described (visual glitch vs exception/logic error) |
| `reproduction_context` | How the bug is reproduced (browser interaction vs API call/CLI) |
| `screenshot_present` | Whether screenshots or visual artifacts are attached |
| `stack_trace` | Stack trace contents indicating frontend or backend origin |

### `SignalSource` (enum)

| Value | Description |
|-------|-------------|
| `title` | Ticket title |
| `description` | Ticket description/body |
| `labels` | Ticket labels or tags |
| `attachments` | Attached files, screenshots, or logs |
| `comments` | Ticket comments or discussion |
| `linked_code` | Referenced source files or PRs |

### `UIDetails`

Present only when `classification` is `ui`. Provides metadata needed for browser-based verification.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `affected_components` | string[] | yes | UI components, pages, or views affected |
| `affected_files` | string[] | yes | Source files likely involved (e.g., `.tsx`, `.css`, `.html`) |
| `viewport_relevant` | boolean | no | Whether the issue is viewport/responsive-specific |
| `browser_specific` | string \| null | no | Browser name if issue is browser-specific |
| `visual_regression` | boolean | no | Whether this is a visual regression (style/layout change) |
| `interaction_required` | boolean | no | Whether user interaction is needed to reproduce |
| `target_url` | string \| null | no | URL or route where the issue manifests |

### Confidence Score Guidelines

| Range | Meaning | Action |
|-------|---------|--------|
| **0.9-1.0** | Very high confidence | Proceed with classification |
| **0.7-0.89** | High confidence | Proceed, note minor ambiguity |
| **0.5-0.69** | Moderate confidence | Flag for review, may need more evidence |
| **0.3-0.49** | Low confidence | Collect additional evidence before proceeding |
| **0.0-0.29** | Very low confidence | Cannot classify; escalate or request clarification |

A minimum confidence of **0.5** is required to proceed with classification.
