# Scoring & Progress Visualization

## Phase Progress Tracking

Each phase reports a quality score (0.0 - 1.0) and completion status.

### Score Components

| Phase | Metrics | Formula |
|-------|---------|---------|
| Evidence | files_found, error_traced, reproduced, history_checked | weighted avg (30/25/25/20) |
| Planning | classification_conf, plan_complete, risk_assessed, verify_defined | weighted avg (25/30/20/25) |
| Implementation | plan_adherence, conventions, test_coverage, minimal_changes | weighted avg (25/25/25/25) |
| Verification | tests_pass, visual_match, no_regressions, first_attempt | weighted avg (30/25/25/20) |

### Overall Score

```
overall = (evidence * 0.20) + (planning * 0.20) + (implementation * 0.30) + (verification * 0.30)
```

## Visual Progress Format

### During Workflow (Phase Transitions)

Report this scorecard at each phase transition:

```
┌─────────────────────────────────────────────┐
│  🎫 Ticket Workflow Progress                │
├─────────────────────────────────────────────┤
│  Evidence    [████████████░░░░]  75%  ✓     │
│  Planning    [████████████████] 100%  ✓     │
│  Implement   [████████░░░░░░░░]  50%  ⧖     │
│  Verify      [░░░░░░░░░░░░░░░░]   0%  ·     │
├─────────────────────────────────────────────┤
│  Overall     [████████████░░░░]  56%        │
│  Type: UI  │  Retries: 0/3                  │
└─────────────────────────────────────────────┘
```

### Status Icons

| Icon | Meaning |
|------|---------|
| ✓ | Phase complete |
| ⧖ | Phase in progress |
| · | Phase not started |
| ✗ | Phase failed |
| ↻ | Phase retrying |

### Progress Bar Rendering

Map score to 16-character bar:

```
Score 0.00: [░░░░░░░░░░░░░░░░]
Score 0.25: [████░░░░░░░░░░░░]
Score 0.50: [████████░░░░░░░░]
Score 0.75: [████████████░░░░]
Score 1.00: [████████████████]
```

## Final Scorecard

At workflow completion, produce a comprehensive scorecard:

```
┌─────────────────────────────────────────────┐
│  🎫 Ticket Workflow — COMPLETE              │
├─────────────────────────────────────────────┤
│  Ticket: Button alignment broken on mobile  │
│  Type: UI  │  Classification: 0.85          │
├─────────────────────────────────────────────┤
│  Phase Scores:                              │
│  Evidence    [████████████████] 100%  ✓     │
│  Planning    [████████████████] 100%  ✓     │
│  Implement   [████████████░░░░]  75%  ✓     │
│  Verify      [████████████████] 100%  ✓     │
├─────────────────────────────────────────────┤
│  Overall     [██████████████░░]  94%        │
│  Verification: PASS (attempt 1/3)           │
│  Files changed: 3  │  Tests added: 1        │
├─────────────────────────────────────────────┤
│  Quality Breakdown:                         │
│  evidence_quality      ████████████ 1.00    │
│  classification_accuracy ██████████ 0.85    │
│  implementation_correct  █████████░ 0.75    │
│  verification_rigor    ████████████ 1.00    │
│  workflow_structure    ████████████ 1.00    │
└─────────────────────────────────────────────┘
```
