# Architecture

**Analysis Date:** 2026-01-14

## Pattern Overview

**Overall:** Plugin-based Wrapper Architecture

**Key Characteristics:**
- **Proxy/Facade Pattern:** Wraps complex external CLIs into a unified interface
- **Command-Subagent Pattern:** Uses Claude Code's native agent system for orchestration
- **Stateless Execution:** Each execution is independent via `subprocess`
- **Minimalist:** Core logic compressed into a single Python script

## Layers

**User Interface Layer:**
- Purpose: Receive user intent and route to appropriate agent
- Contains: Command definitions, Skill triggers
- Location: `subagent-dispatch/commands/delegate.md`, `subagent-dispatch/skills/delegation/SKILL.md`
- Depends on: Orchestration Layer

**Orchestration Layer:**
- Purpose: Manage the execution environment and report results
- Contains: Subagent definitions
- Location: `subagent-dispatch/agents/delegate-runner.md`
- Depends on: Execution Layer via Bash

**Execution Layer:**
- Purpose: Actual process execution and output formatting
- Contains: Core Python logic, CLI configurations
- Location: `subagent-dispatch/scripts/agent.py`
- Depends on: External System Layer

**External System Layer:**
- Purpose: Perform the actual intelligence tasks
- Contains: External CLI tools (`claude`, `codex`, `gemini`, `qwen`)
- Depends on: Host system binaries

## Data Flow

**Command Execution:**

1. **Trigger:** User runs `/delegate` or uses a keyword like "codex"
2. **Parsing:** Claude Code parses arguments (`--cli`, `prompt`)
3. **Dispatch:** Subagent `delegate-runner` is initialized
4. **Execution:** Subagent runs `python3 agent.py` via Bash
5. **Processing:** `agent.py` constructs CLI command based on configuration
6. **Integration:** `subprocess.run` executes external CLI (e.g., `gemini -p ...`)
7. **Normalization:** `agent.py` captures stdout/stderr and formats as JSON
8. **Output:** Subagent reads JSON and reports result to user

## Key Abstractions

**CLIS Configuration:**
- Purpose: Define how to invoke each external tool
- Pattern: Dictionary mapping CLI names to command argument lists
- Location: `subagent-dispatch/scripts/agent.py`

**Normalized Result:**
- Purpose: Uniform output format regardless of the underlying tool
- Pattern: JSON object with `ok`, `cli`, `result`/`error`, `durationMs`
- Location: `subagent-dispatch/scripts/agent.py` output

## Entry Points

**User Entry Point:**
- Location: `subagent-dispatch/commands/delegate.md`
- Triggers: `/delegate` slash command
- Responsibilities: Parse arguments, instantiate subagent

**Execution Entry Point:**
- Location: `subagent-dispatch/scripts/agent.py`
- Triggers: Called by subagent
- Responsibilities: Validate CLI, execute subprocess, handle timeout, format output

## Error Handling

**Strategy:** Capture-and-Report
- Python script captures all exceptions (broad `except Exception`)
- Returns `{"ok": false, "error": "..."}` JSON
- Subagent displays error message to user

**Patterns:**
- **Timeout:** Hardcoded 599s limit to prevent hanging processes
- **Exit Codes:** Non-zero exit codes from CLIs result in error state
- **Fallback:** No automatic retry logic currently implemented

## Cross-Cutting Concerns

**Security:**
- **Sandboxing:** Currently relies on host permissions (using flags like `--dangerously-skip-permissions`)
- **Isolation:** Subprocesses run in current working directory

**Compatibility:**
- **Platform:** Relies on `python3` being available on PATH
- **Dependencies:** Relies on external CLIs being installed and authenticated

---

*Architecture analysis: 2026-01-14*
*Update when major patterns change*
