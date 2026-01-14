# Coding Conventions

**Analysis Date:** 2026-01-14

## Naming Patterns

**Files:**
- `kebab-case.md` for Plugin/Command definitions (e.g., `delegate.md`, `delegate-runner.md`)
- `snake_case.py` for Python scripts (e.g., `agent.py`)
- `kebab-case.json` for configurations (e.g., `plugin.json`)
- `UPPERCASE.md` for documentation and special files (`README.md`, `SKILL.md`)

**Functions (Python):**
- `snake_case` for function names (e.g., `def main():`)
- `snake_case` for variables (e.g., `cmd`, `cli`)

**Constants:**
- `UPPER_SNAKE_CASE` for global constants (e.g., `CLIS`)

**Directories:**
- `kebab-case` for feature modules (e.g., `subagent-dispatch`)
- Plural nouns for collections (e.g., `commands`, `agents`, `skills`)

## Code Style

**Python:**
- **Indentation:** 4 spaces
- **Quotes:** Double quotes (`"`) preferred
- **Structure:**
  1. Shebang
  2. Docstring
  3. Imports (Standard library first)
  4. Global Constants
  5. Functions
  6. `if __name__ == "__main__":` block
- **Minimalism:** Use standard libraries only (`subprocess`, `json`, `sys`, `os`, `time`) to avoid external dependencies.

**Markdown/Documentation:**
- **Language:** Korean preferred for documentation and descriptions.
- **Frontmatter:** YAML frontmatter required for Plugin definition files.

## Import Organization

**Python:**
- Standard library imports at the top.
- Multiple imports per line allowed for brevity in this specific project (e.g., `import subprocess, json...`).

## Error Handling

**Strategy:**
- Capture all exceptions in the main execution block.
- Return JSON object with `ok: false` and `error` field.
- Do not crash the process; always output valid JSON to stdout if possible.

## Logging

**Output Format:**
- **Standard Output (stdout):** Strictly for the final JSON result.
- **Standard Error (stderr):** For debug logs or error messages from subprocesses.

## Comments

**Docstrings:**
- Module-level docstring required at top of script.

**Documentation:**
- `README.md` required at project root and plugin root.

## Module Design

**Single Responsibility:**
- `agent.py` handles execution only.
- `delegate.md` handles user interface only.
- `delegate-runner.md` handles orchestration only.

---

*Convention analysis: 2026-01-14*
*Update when patterns change*
