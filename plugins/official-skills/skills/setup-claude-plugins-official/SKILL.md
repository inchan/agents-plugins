---
name: setup-claude-plugins-official
description: >
  anthropics/claude-plugins-official 마켓플레이스의 공식 플러그인을
  claude plugin install 명령으로 설치합니다.
  호출: /official-skills:setup-claude-plugins-official
  트리거: "공식 플러그인 설치", "official 플러그인 다운로드"
---

# Setup Claude Plugins Official

`claude-plugins-official` 마켓플레이스의 플러그인을 `claude plugin install` CLI로 설치합니다.
이 저장소의 항목들은 스킬이 아닌 **플러그인**이므로 Claude Code 플러그인 시스템을 통해 설치해야 합니다.

## 실행 절차

### Step 1. 플러그인 목록 수집

```bash
bash scripts/install-skills.sh --list
```

### Step 2. 설치 모드 선택 (AskUserQuestion)

```
question: "어떤 플러그인을 설치할까요?"
header: "설치 모드"
multiSelect: false
options:
  - label: "추천 플러그인 (Recommended)"
    description: "code-review, commit-commands, feature-dev, plugin-dev, skill-creator, typescript-lsp, security-guidance"
  - label: "개별 선택"
    description: "원하는 플러그인만 골라서 설치합니다"
  - label: "전체 설치"
    description: "모든 플러그인을 설치합니다 (30개)"
```

- **추천** → Step 3으로 (추천 목록으로 `--install`)
- **개별 선택** → Step 2.2로
- **전체** → Step 3으로 (`--install-all`)

### Step 2.2 개별 플러그인 선택 (AskUserQuestion 다중 라운드)

AskUserQuestion 제약: **질문당 2~4개 옵션**, **호출당 1~4개 질문**, **multiSelect: true**

플러그인 목록을 4개씩 그룹으로 나누어 배치합니다.

**그룹핑 예시** (30개 플러그인):

라운드 1:
```
Q1 header:"개발 도구"    — claude-code-setup, commit-commands, code-review, feature-dev
Q2 header:"플러그인 개발" — security-guidance, skill-creator, plugin-dev, pr-review-toolkit
Q3 header:"LSP 서버 1"  — clangd-lsp, csharp-lsp, gopls-lsp, jdtls-lsp
Q4 header:"LSP 서버 2"  — kotlin-lsp, lua-lsp, php-lsp, pyright-lsp
```

라운드 2:
```
Q1 header:"LSP 서버 3"  — ruby-lsp, rust-analyzer-lsp, swift-lsp, typescript-lsp
Q2 header:"출력/관리"    — explanatory-output-style, learning-output-style, claude-md-management, hookify
Q3 header:"프론트/기타"  — frontend-design, playground, example-plugin, ralph-loop
Q4 header:"SDK"         — agent-sdk-dev, code-simplifier
```

### Step 2.3 설치 scope 선택 (AskUserQuestion)

```
question: "설치 범위를 선택하세요"
header: "Scope"
multiSelect: false
options:
  - label: "user (Recommended)"
    description: "모든 프로젝트에서 사용 (~/.claude/settings.json)"
  - label: "project"
    description: "이 프로젝트에서 공유 (.claude/settings.json, git tracked)"
  - label: "local"
    description: "이 프로젝트 로컬 전용 (.claude/settings.local.json)"
```

### Step 3. 설치 실행

```bash
# 추천 플러그인
bash scripts/install-skills.sh --install "code-review,commit-commands,feature-dev,plugin-dev,skill-creator,typescript-lsp,security-guidance" --scope user

# 전체 설치
bash scripts/install-skills.sh --install-all --scope user

# 개별 선택
bash scripts/install-skills.sh --install "plugin1,plugin2" --scope user
```

### Step 4. 결과 보고

스크립트 출력을 사용자에게 보여줍니다.

## 참고: LSP 플러그인

LSP 플러그인 설치 후 **LSP 서버 바이너리도 별도 설치**가 필요합니다:
- typescript-lsp → `npm install -g typescript-language-server typescript`
- pyright-lsp → `pip install pyright`
- rust-analyzer-lsp → `rustup component add rust-analyzer`

바이너리 설치 안내는 각 플러그인의 README를 참고하세요.

## 필수 도구

- `claude` CLI
- `git` (목록 조회용)

## 소스 마켓플레이스

- https://github.com/anthropics/claude-plugins-official
