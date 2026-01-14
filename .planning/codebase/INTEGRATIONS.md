# External Integrations

**Analysis Date:** 2026-01-14

## APIs & External Services

**AI CLI Tools (Primary Integration):**
- **Claude CLI** - General purpose orchestration
  - Integration: `subprocess.run(["claude", ...])`
  - Auth: System authentication (relies on host `claude login`)
  - File: `subagent-dispatch/scripts/agent.py`

- **Codex CLI (Cursor)** - Complex reasoning
  - Integration: `subprocess.run(["codex", ...])`
  - Auth: System authentication (`danger-full-access` flag used)
  - File: `subagent-dispatch/scripts/agent.py`

- **Gemini CLI** - Web search, visual analysis
  - Integration: `subprocess.run(["gemini", ...])`
  - Auth: `GEMINI_API_KEY` or OAuth (implied by CLI usage)
  - File: `subagent-dispatch/scripts/agent.py`

- **Qwen CLI** - Multilingual, translation
  - Integration: `subprocess.run(["qwen", ...])`
  - Auth: `OPENAI_API_KEY` (implied for compatible API)
  - File: `subagent-dispatch/scripts/agent.py`

- **Echo CLI** - Testing
  - Integration: `subprocess.run(["echo", ...])`
  - Purpose: Mocking for tests

## Data Storage

**Filesystem:**
- Local filesystem access via CLI tools
- No external database connected directly

## Authentication & Identity

**Method:**
- Relies on pre-authenticated CLI tools in the host environment
- No internal auth management code in the plugin itself

## Monitoring & Observability

**Logging:**
- Standard Output (stdout) - JSON formatted results captured by agent
- Standard Error (stderr) - Error messages captured
- Integration: Captured by `subprocess` in `agent.py`

## CI/CD & Deployment

**Hosting:**
- Local execution as Claude Code Plugin

## Environment Configuration

**Development:**
- Required CLIs must be installed and on PATH
- Python 3 required
- API keys for specific CLIs (Gemini, Qwen) must be set in host environment

---

*Integration audit: 2026-01-14*
*Update when adding/removing external services*
