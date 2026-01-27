# Task Completion Checklist

Before considering a task complete, ensure the following:

- [ ] Code follows Python type hinting and docstring conventions.
- [ ] New features or bug fixes have corresponding tests in `tests/`.
- [ ] All tests pass: `pytest plugins/agent-delegation/tests`.
- [ ] The output of `agent.py` remains a valid JSON object.
- [ ] Timeouts and error cases are handled gracefully.
- [ ] No sensitive information (API keys, etc.) is logged or printed.
- [ ] Integration with Claude Code (plugin.json, commands, agents) is updated if necessary.
