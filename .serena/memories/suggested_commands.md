# Suggested Commands

## Development & Execution
- **Run the agent**: `python3 plugins/agent-delegation/scripts/agent.py "Your prompt here"`
- **Run with specific CLI**: `python3 plugins/agent-delegation/scripts/agent.py --cli gemini "Find latest news"`
- **Run with system prompt**: `python3 plugins/agent-delegation/scripts/agent.py --cli claude --system-prompt "Be concise" "Hello"`

## Testing
- **Run all tests**: `pytest plugins/agent-delegation/tests`
- **Run fast tests only**: `pytest plugins/agent-delegation/tests -m "not slow"`
- **Run specific test file**: `pytest plugins/agent-delegation/tests/test_arg_parsing.py`

## Linting & Formatting (Standard Python tools)
- **Lint**: `ruff check .` or `flake8 .` (if installed)
- **Format**: `black .` or `ruff format .` (if installed)
