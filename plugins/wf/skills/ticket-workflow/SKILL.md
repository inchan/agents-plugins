---
name: ticket-workflow
description: This skill should be used when the user mentions "bug ticket", "ticket workflow", "process ticket", "fix ticket", "bug fix workflow", "UI bug", "visual bug", "non-UI bug", "API bug", or wants to systematically process a bug report through evidence collection, classification, exploration, planning, implementation, and verification phases with visual scoring.
version: 0.3.0
---

# Ticket Workflow Skill

Automated bug ticket processing through sequential phases with UI/non-UI classification, visual scoring, and retry-based verification.

## Overview

This skill orchestrates a complete bug fix workflow by executing sequential phases with a state machine controlling transitions and retries:

1. **Evidence Collection** — Gather codebase evidence, reproduce the issue, collect external artifacts
2. **Classification** — Analyze ticket content and classify as UI vs non-UI with confidence scoring
3. **Exploration** — Deep-dive into affected code with parallel agents
4. **Planning** — Design the fix with approach trade-offs and verification strategy
5. **Implementation** — Execute the fix following the plan
6. **Verification** — Validate with tests and visual comparison (up to 3 retries with strategy adjustment)

## When This Skill Applies

- User provides a bug ticket, issue description, or ticket URL
- User wants a systematic, automated bug fix workflow
- User mentions UI bugs requiring visual verification
- User mentions API/backend/logic bugs requiring functional verification
- User wants evidence-based bug resolution with progress tracking

---

## Phase 1: Evidence Collection

Launch 2 `evidence-searcher` agents in parallel to gather bug evidence:

- **Agent A**: Search for error patterns, stack traces, and affected source files
- **Agent B**: Check git history, find related components/modules, recent changes

**Actions**:
1. Parse ticket input (auto-detect: text / markdown / JSON / URL)
2. Extract `--type` override if present (sets classification with confidence 1.0)
3. Search codebase for error patterns, affected files, related code
4. Collect external evidence (URLs, screenshots, logs)
5. Attempt reproduction if steps are provided

**Produces**: `evidence_report`, `affected_files`, `evidence_quality_score`

See [Evidence Collection](references/phases/evidence-collection.md) for detailed procedure.

---

## Phase 2: Classification — UI vs Non-UI Analysis

**This phase analyzes ticket content and classifies the issue type to determine the verification strategy for all subsequent phases.**

### Classification Algorithm

The classifier uses a multi-dimensional signal analysis approach:

#### Signal Dimension 1: Explicit Override

If user provides `--type ui` or `--type non-ui`, use that classification directly with confidence 1.0.

#### Signal Dimension 2: Weighted Keyword Category Matching

Score ticket text against categorized keyword sets with diminishing returns per category.

**UI Keyword Categories** (category → weight):

| Category | Weight | Example Keywords |
|----------|--------|-----------------|
| `css_styling` | 0.8 | css, color, font, padding, margin, border, flexbox, tailwind |
| `layout` | 0.7 | layout, alignment, responsive, breakpoint, viewport, mobile, sidebar |
| `rendering_visual` | 0.6 | render, visual, display, visible, hidden, blank, overlapping, truncated |
| `ui_components` | 0.5 | button, modal, dialog, dropdown, form, tooltip, spinner, card, menu |
| `browser_specific` | 0.6 | chrome, firefox, safari, dom, html, canvas, svg, cross-browser |
| `screenshot_visual_evidence` | 0.9 | screenshot, visual bug, visual regression, figma, mockup, design |
| `interaction` | 0.4 | click, hover, focus, drag, scroll, tap, keyboard, cursor |
| `frontend_tech` | 0.3 | react, vue, angular, jsx, tsx, component, hook, redux |
| `accessibility` | 0.5 | a11y, aria, screen reader, wcag, contrast, tab order |

**Non-UI Keyword Categories** (category → weight):

| Category | Weight | Example Keywords |
|----------|--------|-----------------|
| `backend` | 0.7 | api, endpoint, database, query, migration, authentication, token |
| `infrastructure` | 0.8 | deploy, docker, kubernetes, aws, terraform, monitoring, logging |
| `data_logic` | 0.7 | calculation, algorithm, race condition, memory leak, exception, timeout |
| `cli_system` | 0.6 | cli, terminal, cron, daemon, queue, kafka, redis, cache |

**Scoring**: Each category contributes once with a multiplier based on match count:
- 1 match: full weight
- 2 matches: weight × 1.3
- 3+ matches: weight × 1.6 (capped)

#### Signal Dimension 3: Regex Contextual Pattern Matching

Match contextual phrases that strongly indicate UI issues:

| Pattern | Weight | Label |
|---------|--------|-------|
| `looks/appears/displays wrong/broken/incorrect` | 0.8 | visual_description |
| `css/style/class not applied/working/loading` | 0.9 | css_issue |
| `screen/page/view is blank/empty/white` | 0.7 | blank_screen |
| `responsive/mobile/tablet layout/view` | 0.8 | responsive_issue |
| `z-index/stacking/layer issue/problem` | 0.9 | stacking_issue |
| `.png/.jpg/.gif/.svg` file references | 0.7 | media_attachment |
| `dark/light mode/theme` | 0.6 | theme_issue |
| `hover/focus/active state` | 0.8 | interaction_state |

#### Signal Dimension 4: Label Analysis

Direct label matching against known UI and non-UI label sets:
- **UI labels** (+1.0 each): `ui`, `frontend`, `css`, `design`, `visual`, `ux`, `accessibility`, `a11y`, `responsive`, `browser`, `layout`
- **Non-UI labels** (+1.0 each): `backend`, `api`, `database`, `infra`, `devops`, `security`, `performance`, `cli`, `data`

#### Signal Dimension 5: Attachment & Screenshot Heuristics

- Image attachments (.png, .jpg, .gif, .svg, .webp): +0.8 UI score per image
- Video attachments (.mp4, .mov, .webm): +0.6 UI score per video

#### Signal Dimension 6: Environment / Browser Hints

Browser-related environment keys (browser, user_agent, resolution, viewport, device): +0.5 UI score each.

#### Signal Dimension 7: Interaction Verb Density in Reproduction Steps

Count interaction verbs (click, tap, hover, scroll, drag, navigate, etc.) in steps-to-reproduce:
- 2+ verbs: boost UI score by 0.4 × min(count, 5)

### Classification Decision

```
ui_score = sum(all_ui_signals)
non_ui_score = sum(all_non_ui_signals)
total = ui_score + non_ui_score

if total == 0:
    type = "unknown", confidence = 0.0

elif ui_ratio (ui_score / total) >= 0.65:
    type = "ui"
    confidence = ui_ratio

elif ui_ratio <= 0.35:
    type = "non-ui"
    confidence = 1.0 - ui_ratio

else:  # ambiguous (0.35 < ui_ratio < 0.65)
    type = whichever score is higher
    confidence = abs(ui_ratio - 0.5) * 2  (low confidence)
```

### Confidence Thresholds & Actions

| Confidence | Level | Action |
|-----------|-------|--------|
| >= 0.8 | High | Proceed automatically |
| 0.6 – 0.8 | Medium | Proceed, note uncertainty in log |
| 0.5 – 0.6 | Low | Proceed with `[WARN] E_CLASSIFY` logged |
| < 0.5 | Very Low | Default to non-UI, log warning, collect more evidence |

### Classification Output Structure

```json
{
  "ticket_type": "ui" | "non-ui",
  "confidence": 0.92,
  "ui_score": 5.6,
  "non_ui_score": 0.7,
  "signals": [
    "ui:css_styling(css, color, background)",
    "ui:ui_components(button, modal)",
    "ui:screenshot_visual_evidence(screenshot)",
    "pattern:visual_description",
    "label:frontend",
    "attachment:image(bug.png)",
    "env:browser",
    "steps:interaction_verbs(3)",
    "non_ui:backend(api)"
  ],
  "reasoning": "Classified as UI issue (ui_score=5.6 vs non_ui=0.7). Strong UI signals across 8 indicators."
}
```

### Classification Impact on Subsequent Phases

| Aspect | UI Ticket | Non-UI Ticket |
|--------|-----------|---------------|
| **Phase 3 (Explore)** | Component tree + CSS cascade analysis agent | Standard code tracing agents |
| **Phase 5 (Implement)** | Visual, responsive, accessibility focus | Logic, data, API correctness focus |
| **Phase 6 (Verify)** | Tests + browser automation (Playwright MCP / Chrome DevTools / agent-browser) | Tests only |
| **Phase 6 fallback** | DOM analysis if browser tools unavailable | N/A |

**Produces**: `ticket_type`, `confidence`, `classification_signals`, `ui_details` (for UI tickets)

See [Classification Rules](references/classification.md) for full details.

---

## Phase 3: Exploration — Deep Code Analysis

Launch 2-3 `bug-tracer` agents in parallel:

- **Agent A**: Trace execution path from entry point to failure location
- **Agent B**: Find similar patterns in codebase and check existing test coverage
- **Agent C** (UI only): Analyze component tree, CSS cascade, and rendering flow

Read all key files identified by agents. Synthesize findings.

**Produces**: `root_cause`, `code_flow`, `related_patterns`, `affected_files_deep`

See [Exploration](references/phases/exploration.md) for detailed procedure.

---

## Phase 4: Planning — Design the Fix

- Synthesize root cause + exploration findings into concrete fix plan
- Choose approach: minimal fix vs robust fix (with trade-offs)
- Define verification strategy based on `ticket_type`
- Identify risks and side effects

**Produces**: `implementation_plan`, `verification_strategy`, `risks`, `planning_quality_score`

See [Planning](references/phases/planning.md) for detailed procedure.

---

## Phase 5: Implementation — Apply the Fix

- Read all affected files before editing
- Apply changes per plan, following codebase conventions
- Add regression test(s) covering the bug scenario
- UI tickets: handle responsive/accessibility edge cases

**Produces**: `modified_files`, `tests_added`, `change_summary`, `implementation_quality_score`

See [Implementation](references/phases/implementation.md) for detailed procedure.

---

## Phase 6: Verification — Validate the Fix

- Run test suite (new + existing tests)
- **UI tickets**: Browser verification using parallel tools for cross-checking when available:
  - Playwright MCP for automated browser testing
  - Chrome DevTools / agent-browser skill for visual inspection
  - Fallback: DOM analysis / code-level verification if browser tools unavailable
- **Non-UI tickets**: Functional test verification, assertion validation, log analysis

**Retry logic** (up to 3 attempts with strategy adjustment per attempt):

| Attempt | Strategy |
|---------|----------|
| 1 | Standard verification — run tests, check results |
| 2 | Targeted fix — focus on specific failure, add edge case tests |
| 3 | Alternative approach — rethink implementation strategy, broader test coverage |

**Produces**: `verification_status`, `attempt_count`, `test_results`, `visual_comparison`

See [Verification](references/phases/verification.md) for detailed procedure.

---

## Phase Orchestration

### State Machine

```
INIT → EVIDENCE → CLASSIFY → EXPLORE → PLAN → IMPLEMENT → VERIFY → DONE
                                                    ↑          │
                                                    └── retry ──┘ (max 3x)
```

### Control Flow Rules

1. **Strict order**: No phase skipping. Each phase requires the previous output.
2. **Immutable history**: Phases 1-4 outputs persist through retries.
3. **Retry scope**: Only Phases 5→6 loop on verification failure.
4. **Type branching**: After Phase 2, ticket type influences Phases 3, 5, and 6.
5. **Progress reporting**: Scorecard renders at every phase boundary.
6. **Graceful degradation**: Non-critical failures degrade rather than abort.

See [Phase Orchestrator](references/phase-orchestrator.md) for full state machine specification.

---

## Progress Visualization & Scoring

The workflow produces a visual scorecard at each phase transition:

```
╔══════════════════════════════════════════════════════╗
║            TICKET WORKFLOW SCORECARD                  ║
╠══════════════════════════════════════════════════════╣
║  Evidence    [████████████████] 100%  ✓              ║
║  Classify    [████████████████] 100%  ✓              ║
║  Explore     [████████████████] 100%  ✓              ║
║  Plan        [██████████░░░░░░]  60%  ⧖              ║
║  Implement   [░░░░░░░░░░░░░░░░]   0%  ·              ║
║  Verify      [░░░░░░░░░░░░░░░░]   0%  ·              ║
╠══════════════════════════════════════════════════════╣
║  Overall:    [████████░░░░░░░░]  53%                 ║
║  Type: UI | Retries: 0/3                             ║
╚══════════════════════════════════════════════════════╝
```

### Quality Scoring Dimensions

| Dimension | Weight | Description |
|-----------|--------|-------------|
| `implementation_correctness` | 30% | Whether the fix properly resolves the reported issue |
| `evidence_quality` | 20% | Thoroughness of collected evidence |
| `verification_rigor` | 25% | Quality of verification through tests and visual comparison |
| `classification_accuracy` | 10% | Correctness of UI/non-UI classification |
| `workflow_structure` | 15% | Cleanliness and modularity of workflow execution |

See [Scoring & Progress](references/scoring.md) for visualization details.

---

## Error Handling & Logging

### Log Format
```
[<LEVEL>] [<PHASE>] +<M:SS> — <message>
```

### Error Codes

| Code | Meaning |
|------|---------|
| `E_TOOL` | Tool execution failure |
| `E_NOTFOUND` | File/pattern not found |
| `E_TIMEOUT` | Operation timeout |
| `E_PARSE` | Input parsing failure |
| `E_VERIFY` | Verification assertion failure |
| `E_BROWSER` | Browser automation failure |
| `E_CLASSIFY` | Classification ambiguity |
| `E_UNKNOWN` | Unrecognized error |

See [Workflow Logger](references/workflow-logger.md) for full error handling protocol.

---

## Usage

```
/ticket <ticket description or URL>
/ticket --type ui "Button alignment broken on mobile viewport"
/ticket --type non-ui "API returns 500 on empty payload"
```

## Output

Results are output to both:
- **Console**: Real-time progress scorecard and final report
- **File**: `workflow-result.json` with full structured output

---

## Reference Documents

| Reference | Purpose |
|-----------|---------|
| [Phase Orchestrator](references/phase-orchestrator.md) | State machine, control flow, inter-phase contracts |
| [Evidence Collection](references/phases/evidence-collection.md) | Phase 1 procedure |
| [Classification Rules](references/classification.md) | Phase 2 classification algorithm |
| [Exploration](references/phases/exploration.md) | Phase 3 procedure |
| [Planning](references/phases/planning.md) | Phase 4 procedure |
| [Implementation](references/phases/implementation.md) | Phase 5 procedure |
| [Verification](references/phases/verification.md) | Phase 6 procedure + retries |
| [Workflow Logger](references/workflow-logger.md) | Logging, errors, status reporting |
| [Scoring & Progress](references/scoring.md) | Visual progress and quality scoring |
| [Browser Automation](references/browser-automation.md) | Browser integration for UI verification |
| [Classification Rules](references/classification.md) | Classification algorithm and output structure |
