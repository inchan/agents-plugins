# Style and Conventions

## Python
- **Type Hints**: Use type hints for all function signatures.
- **Docstrings**: Use Google-style or Sphinx-style docstrings for functions and classes.
- **Data Containers**: Prefer `dataclasses` for simple data structures.
- **Error Handling**: Use custom exception classes for specific error types (e.g., `ParseError`).
- **Formatting**: Adhere to standard Python formatting (PEP 8).

## Communication
- Standard output should be a single valid JSON object representing the execution result.
- Error messages should be descriptive and truncated if too long.

## Testing
- Use `pytest`.
- Separate unit tests (fast) from integration/real CLI tests (marked with `@pytest.mark.slow`).
- Mock subprocesses where possible to avoid expensive/external API calls in CI.
