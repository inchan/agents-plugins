# Project Overview: agent-delegation

## Purpose
A multi-agent orchestration plugin for AI CLIs (Claude Code/Gemini CLI). It allows dispatching tasks to various sub-agents/CLIs like Codex, Gemini, Claude, and Qwen, standardizing their output into a unified JSON format.

## Tech Stack
- **Language**: Python 3.9+ (Core logic), Node.js (Plugin environment)
- **AI CLIs Integration**: `claude`, `codex`, `gemini`, `qwen`
- **Testing**: `pytest`
- **Communication**: JSON via stdout/stderr

## Architecture
- `scripts/agent.py`: The main execution script that handles argument parsing, command building, and subprocess execution.
- `commands/`: Markdown files defining the CLI commands (e.g., `/delegate`).
- `agents/`: Agent personas and definitions.
- `skills/`: Automated skill triggers.
- `tests/`: Pytest suite covering unit, integration, and edge cases.

## Key Features
- **Cli Selection**: Choose which AI to use via `--cli`.
- **System Prompting**: Native support for system prompts or prefix-based emulation.
- **Unified Result**: Standardized JSON output with `ok`, `cli`, `durationMs`, and `result`/`error`.
- **Safety**: Non-interactive execution with configurable timeouts.
