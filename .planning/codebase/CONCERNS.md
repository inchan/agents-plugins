# Codebase Concerns

**Analysis Date:** 2026-01-14

## Security Considerations

**Dangerous CLI Flags:**
- **Issue:** `agent.py` uses `--dangerously-skip-permissions`, `-s danger-full-access`, and `--yolo` flags for external CLIs.
- **Why:** To bypass interactive permission prompts in non-interactive mode.
- **Risk:** High. Malicious prompts could potentially execute filesystem changes or access sensitive data without user confirmation.
- **Recommendations:** Remove blanket permission grants. Investigate safer non-interactive modes or restrict scope.

**Prompt Injection:**
- **Issue:** No sanitization of user prompts before passing to subprocess.
- **Risk:** High. Command injection possibilities if subprocess handling is not strictly array-based (currently uses list args, which is safer than shell=True, but input validation is still missing).

## Tech Debt

**Project Structure Mismatch:**
- **Issue:** Planning documents (`.planning/phases/*`) reference TypeScript files that have been deleted/replaced by Python.
- **Impact:** Confusion for new contributors or agents relying on outdated documentation.
- **Fix approach:** Update documentation to reflect the current Python-based architecture.

**Missing Dependency Management:**
- **Issue:** `package.json` was deleted, and no `requirements.txt` exists.
- **Impact:** No version pinning for tools. Unclear environment requirements.
- **Fix approach:** Restore `package.json` for development scripts or create `requirements.txt`/`pyproject.toml`.

**Error Handling:**
- **Issue:** `agent.py` catches broad `Exception`.
- **Impact:** Hides specific errors (like `FileNotFound` if CLI is missing), making debugging harder.
- **Fix approach:** Catch specific exceptions (`subprocess.TimeoutExpired`, `FileNotFoundError`) and provide distinct error codes/messages.

**Hardcoded Configuration:**
- **Issue:** Timeout (599s) and CLI configurations are hardcoded in `agent.py`.
- **Impact:** Inflexible.
- **Fix approach:** Move configuration to `plugin.json` or environment variables.

## Known Bugs

**Output Truncation:**
- **Issue:** `agent.py` truncates stdout to 5000 characters.
- **Impact:** Large responses from AI models (e.g., long code blocks) will be cut off, leading to invalid JSON or incomplete data.
- **Fix approach:** Increase limit or implement streaming/chunking.

## Missing Critical Features

**Environment Configuration:**
- **Problem:** No `.env.example` or documentation for required API keys (`GEMINI_API_KEY`, etc.).
- **Impact:** Users don't know how to set up the environment for external CLIs.

## Test Coverage Gaps

**Zero Tests:**
- **Problem:** No automated tests exist.
- **Risk:** High. Regressions in `agent.py` could break the entire plugin.
- **Priority:** High. Add basic unit tests for `agent.py`.

---

*Concerns audit: 2026-01-14*
*Update as issues are fixed or new ones discovered*
