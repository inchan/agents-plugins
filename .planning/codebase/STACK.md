# Technology Stack

**Analysis Date:** 2026-01-14

## Languages

**Primary:**
- Python 3 - `subagent-dispatch/scripts/agent.py` - Core execution logic
- Markdown - `subagent-dispatch/commands/*.md`, `subagent-dispatch/skills/*/SKILL.md` - Plugin definitions

**Secondary:**
- JSON - `plugin.json`, `marketplace.json` - Configuration
- TypeScript - Previously used, currently removed but referenced in planning docs

## Runtime

**Environment:**
- Node.js v18+ - Claude Code Plugin environment
- Python 3 - Required for `agent.py` execution

**Package Manager:**
- npm - Used for development scripts (package.json currently deleted but referenced in docs)

## Frameworks

**Core:**
- Claude Code Plugin Framework - Structure for Commands, Agents, Skills (`.claude-plugin/`)

**Testing:**
- None detected (Manual verification / Demo scripts only)

## Key Dependencies

**Critical:**
- Python Standard Library - `subprocess`, `json`, `sys`, `os`, `time` (No external Python dependencies)

**Infrastructure:**
- AI CLIs - `claude`, `codex`, `gemini`, `qwen` (External executables required on host)

## Configuration

**Environment:**
- Environment variables - `ORIGINAL_CWD` passed to script
- CLI arguments - Controlled via `agent.py` arguments dictionary

**Build:**
- None (Interpreted execution)

## Platform Requirements

**Development:**
- macOS/Linux/Windows (Any platform with Python 3 and Node.js)
- External CLIs installed and authenticated on PATH

**Production:**
- Claude Code environment with Python 3 available

---

*Stack analysis: 2026-01-14*
*Update after major dependency changes*
