---
name: setup-anthropics-skills
description: >
  anthropics/skills 저장소의 공식 스킬을 설치합니다.
  AskUserQuestion으로 스킬을 선택합니다.
  호출: /official-skills:setup-anthropics-skills
  트리거: "anthropics 스킬 설치", "anthropics 스킬 업데이트"
---

# Setup Anthropics Skills

Claude가 AskUserQuestion 도구를 사용하여 사용자와 인터랙티브하게 스킬 설치를 진행합니다.
설치 위치는 이 스킬이 위치한 `plugins/official-skills/skills/`에 고정됩니다.

## 실행 절차

### Step 1. 스킬 목록 수집

```bash
bash scripts/install-skills.sh --list
```

### Step 2. 설치 모드 선택 (AskUserQuestion)

```
question: "어떤 스킬을 설치할까요?"
header: "설치 모드"
multiSelect: false
options:
  - label: "추천 스킬 (Recommended)"
    description: "webapp-testing, doc-coauthoring"
  - label: "개별 선택"
    description: "원하는 스킬만 골라서 설치합니다"
  - label: "전체 설치"
    description: "모든 스킬을 설치합니다 (17개)"
```

- **추천 스킬** → Step 4로 이동 (추천 목록으로 `--skills` 실행)
- **전체 설치** → Step 4로 이동 (`--all` 실행)
- **개별 선택** → Step 3으로 이동

### Step 3. 개별 스킬 선택 (AskUserQuestion 다중 라운드)

AskUserQuestion 제약: **질문당 2~4개 옵션**, **호출당 1~4개 질문**, **multiSelect: true**

스킬 목록을 4개씩 그룹으로 나누어, 한 번에 최대 4개 질문(=16개 스킬)을 배치합니다.

**그룹핑 규칙:**
- 의미 있는 카테고리 header 사용
- 추천 스킬은 label에 `(Recommended)` 표시
- 마지막 그룹이 1개뿐이면 이전 그룹에 병합 (2~4개 유지)

**그룹핑 예시** (17개 스킬):

라운드 1:
```
Q1 header:"문서 도구"  — pdf, docx, pptx, xlsx
Q2 header:"개발 도구"  — claude-api, frontend-design, mcp-builder, skill-creator
Q3 header:"테스트/앱"  — webapp-testing, web-artifacts-builder, slack-gif-creator, theme-factory
Q4 header:"콘텐츠"    — algorithmic-art, brand-guidelines, canvas-design, doc-coauthoring
```

라운드 2 (남은 1개):
```
→ 1개뿐이면 라운드 1의 Q4에 병합 (최대 4개 이내)
→ internal-comms를 Q4에 합쳐 5개가 되면, Q3과 Q4를 재배분
```

### Step 4. 설치 실행

```bash
# 추천 스킬
bash scripts/install-skills.sh --skills "webapp-testing,doc-coauthoring" "{SKILL_DIR}/.."

# 전체 설치
bash scripts/install-skills.sh --all "{SKILL_DIR}/.."

# 개별 선택
bash scripts/install-skills.sh --skills "skill1,skill2,skill3" "{SKILL_DIR}/.."
```

`{SKILL_DIR}/..`은 `plugins/official-skills/skills/`를 가리킵니다.

### Step 5. 결과 보고

스크립트 출력을 사용자에게 보여줍니다.

## 필수 도구

- `git`

## 소스 저장소

- https://github.com/anthropics/skills
