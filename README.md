# capzang-plugins

**Claude Code를 위한 멀티 에이전트 오케스트레이션 플러그인**

이 플러그인은 Claude Code 환경에서 다른 AI CLI(Codex, Gemini, Qwen 등)에게 작업을 위임하고 결과를 통합하는 기능을 제공합니다.

## 주요 기능

- **작업 위임**: `/delegate` 명령어로 특정 AI에게 작업 요청
- **자동 라우팅**: "codex", "gemini" 등 키워드 감지 시 자동 위임
- **결과 통합**: 다양한 CLI의 출력을 통일된 JSON 형식으로 변환

## 포함된 플러그인

### agent-delegation

핵심 위임 기능을 담당하는 플러그인입니다.

- **명령어**: `/delegate`
- **스킬**: `delegation` (자동 트리거)
- **에이전트**: `delegate-runner`
- **실행기**: `agent.py` (Python 기반)

### official-skills

Anthropic 공식 마켓플레이스의 플러그인/스킬을 설치하는 플러그인입니다.

- **스킬**: `setup-claude-plugins-official` — [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) 플러그인 설치
- **스킬**: `setup-anthropics-skills` — [anthropics/skills](https://github.com/anthropics/skills) 스킬 설치

## 시작하기

1. 이 저장소를 클론하거나 플러그인으로 설치합니다.
2. 필요한 AI CLI 도구들을 설치하고 인증합니다 (`claude`, `codex`, `gemini`, `qwen`).
3. Claude Code에서 `/delegate` 명령을 사용해 보세요.

자세한 내용은 [agent-delegation/README.md](agent-delegation/README.md)를 참조하세요.
