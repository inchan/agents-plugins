#!/bin/bash
# UserPromptSubmit hook - triggers clarify skill
# Exit 0 = success, stdout is added to Claude's context

cat << 'EOF'
## 프롬프트 명확화 (clarify)

### 처리 순서

1. **추론 먼저** - 컨텍스트(열린 파일, 에러, 대화 이력)에서 추론
2. **가정 명시** - 추론했다면 "~라고 가정하고 진행합니다"
3. **필요시 질문** - 결과가 크게 달라질 때만, 필요한 만큼(1~3개)

### 질문 조건

- ✅ 질문: P-S-O(목적/주제/목표) 중 2개+ 불명확, 또는 결과가 완전히 다른 해석 가능
- ❌ 바로 진행: 추론 가능, 기본값 존재, 세부사항만 불명확

### 질문 시

- AskUserQuestion 도구 사용
- 2-3개 선택지 + "제가 판단해서 진행" 옵션
- 분석 과정 출력 금지

Skill: skills/clarify/SKILL.md
EOF
