# Phase 5: Implementation

> Sequential phase 5 of 6. Requires Planning output. Must complete before Verification phase.

## Purpose

Execute the implementation plan to fix the bug, following codebase conventions and the planned approach. On retries, apply targeted corrections based on verification failure context.

## Inputs (from Phase 4: Planning)

- `approach`: "minimal" or "robust"
- `changes`: Ordered list of planned changes
- `verification_strategy`: How verification will be performed
- `risks`: Identified risks
- `estimated_files`: Number of files to modify

### Retry Context (on retry from Phase 6)

When called as part of a retry loop (attempt > 1):

- `retry_context.attempt`: Current attempt number (2 or 3)
- `retry_context.failure_reason`: Why the previous verification failed
- `retry_context.failed_test`: The specific test that failed
- `retry_context.previous_changes`: What was changed in the last attempt

**Important**: On retry, apply a TARGETED correction — not a full re-implementation. Phases 1-4 outputs remain immutable.

## Procedure

### Step 1: Read All Affected Files

Before making any changes, read every file listed in the implementation plan to ensure full context:

```
For each file in planned changes:
  1. Read the complete file
  2. Understand surrounding code patterns
  3. Note conventions (naming, imports, formatting)
```

### Step 2: Implement Changes

Execute the plan in order. For each change:

1. **Read** the target file (if not already read)
2. **Edit** using precise, minimal changes
3. **Verify syntax** — ensure no parse errors introduced
4. **Follow conventions** — match existing code style exactly

**For UI fixes:**
- Match existing CSS/styling patterns
- Preserve responsive design conventions
- Use existing design tokens/variables where available
- Consider accessibility implications

**For non-UI fixes:**
- Match existing error handling patterns
- Preserve API contracts
- Maintain backward compatibility
- Follow existing data validation patterns

### Step 3: Write Regression Test

Create or update tests to prevent regression:

**For UI tickets:**
```
- Add visual regression test if framework supports it
- Add component test with the specific reproduction case
- Test across relevant viewports if responsive issue
```

**For non-UI tickets:**
```
- Add unit test covering the exact bug scenario
- Add edge case tests for related inputs
- Update integration tests if API behavior changed
```

### Step 4: Implementation Summary

```
┌─ Implementation Summary ──────────────────┐
│ Attempt: <N>/3                            │
│ Files Modified:                           │
│   ✓ src/components/Button.tsx (line 42)   │
│   ✓ src/styles/button.css (line 15)       │
│                                           │
│ Tests Added:                              │
│   ✓ src/__tests__/button-alignment.test   │
│                                           │
│ Changes: 3 files, +25/-8 lines           │
│ Convention compliance: ✓                  │
└───────────────────────────────────────────┘
```

## Error Handling

Follow the standard error handling patterns from [workflow-logger.md](../workflow-logger.md).

### Error Scenarios

| Error | Code | Recovery |
|-------|------|----------|
| Target file not found | `E_NOTFOUND` | Search for correct path, update plan |
| Edit tool fails (old_string mismatch) | `E_TOOL` | Re-read file, retry with updated content |
| Syntax error after edit | `E_TOOL` | Revert change, try alternative approach |
| Git conflict detected | `E_TOOL` | Log warning, apply changes carefully |
| Test file cannot be created | `E_TOOL` | Log warning, proceed without test |
| Lint/type-check fails | `E_TOOL` | Attempt auto-fix, then manual fix |

### Logging Examples

```
[INFO ] [IMPLEMENT  ] +2:00 — Phase started: Implementation
[INFO ] [IMPLEMENT  ] +2:05 — Reading affected files: 3 files
[INFO ] [IMPLEMENT  ] +2:10 — Modified: src/components/Button.tsx (fix: event handler binding)
[ERROR] [IMPLEMENT  ] +2:15 — Edit failed: old_string not found in button.css
  Code: E_TOOL
  Context: Attempting to fix line 42 of button.css
  Recovery: Re-reading file to get current content
[INFO ] [IMPLEMENT  ] +2:18 — Modified: src/styles/button.css (fix: flex alignment)
[INFO ] [IMPLEMENT  ] +2:25 — Added test: tests/Button.test.tsx (regression test)
[INFO ] [IMPLEMENT  ] +2:30 — Phase completed: Implementation (score: 85%)
```

### Retry-Specific Logging

```
[INFO ] [IMPLEMENT  ] +5:00 — Retry implementation (attempt 2/3)
[INFO ] [IMPLEMENT  ] +5:02 — Failure context: assertion error on margin-left value
[INFO ] [IMPLEMENT  ] +5:05 — Applying targeted fix to button.css:15
[INFO ] [IMPLEMENT  ] +5:10 — Phase completed: Implementation retry (score: 90%)
```

### Degradation Rules

| Failure | Degradation |
|---------|-------------|
| Cannot add tests | Log `[WARN]`, proceed without tests, flag for verification |
| Type-check unavailable | Skip type-check, rely on verification phase |
| Single file edit fails | Log warning, adjust plan to work around |
| Lint not configured | Skip lint step, note in output |

## Quality Criteria

| Metric | Weight | Description |
|--------|--------|-------------|
| Plan adherence | 25% | Changes match the implementation plan |
| Convention compliance | 25% | Code follows existing patterns |
| Test coverage | 25% | Regression test added |
| Minimal changes | 25% | Only necessary modifications made |

## Output

Pass to Phase 6 (Verification):
- `modified_files`: List of modified files with change descriptions
- `tests_added`: List of test files created/modified
- `change_summary`: Diff summary (+lines/-lines)
- `implementation_quality_score`: 0.0 - 1.0
