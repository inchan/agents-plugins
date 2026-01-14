# Testing Patterns

**Analysis Date:** 2026-01-14

## Test Framework

**Current Status:**
- No formal test framework (e.g., pytest, jest) is currently installed or configured.
- Testing is performed via manual verification scripts or direct execution.

## Test File Organization

**Location:**
- No `tests/` directory currently exists.
- Previous patterns suggests `npm run demo` scripts (now deleted) were used.

## Test Structure

**Manual Verification Pattern:**
```bash
# Execute the agent script directly
python3 subagent-dispatch/scripts/agent.py --cli [cli_name] "[prompt]"

# Verify JSON output
# Check "ok": true/false
```

## Mocking

**Echo CLI:**
- The `echo` CLI configuration in `agent.py` serves as a mock for testing the pipeline without calling external AI tools.
```python
"echo": ["echo", "{}"]
```

## Coverage

**Requirements:**
- No formal coverage tracking.
- Verification relies on ensuring the JSON output structure is correct for success and error cases.

## Common Patterns

**Integration Testing:**
- Running the full command chain via `node` (previously) or `python` (currently) to verify the subprocess execution and JSON parsing.

---

*Testing analysis: 2026-01-14*
*Update when test patterns change*
