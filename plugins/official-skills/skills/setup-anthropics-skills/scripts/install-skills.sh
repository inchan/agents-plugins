#!/usr/bin/env bash
# official-skills:setup-anthropics-skills — anthropics/skills 스킬 설치 유틸리티
#
# 사용법:
#   bash install-skills.sh --list                          # 스킬 목록 출력
#   bash install-skills.sh --all <target_dir>              # 전체 설치
#   bash install-skills.sh --skills s1,s2,s3 <target_dir>  # 선택 설치
#
# SKILL.md가 Claude에게 AskUserQuestion으로 오케스트레이션을 지시하며,
# 이 스크립트는 비인터랙티브 유틸리티로만 동작합니다.

set -euo pipefail

REPO_URL="https://github.com/anthropics/skills.git"
REPO_NAME="anthropics-skills"
SKILLS_SUBDIR="skills"

# ── 인자 파싱 ─────────────────────────────────────────────
MODE=""
TARGET_DIR=""
SKILL_CSV=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --list)    MODE="list"; shift ;;
        --all)     MODE="all"; TARGET_DIR="${2:-}"; shift; shift ;;
        --skills)  MODE="skills"; SKILL_CSV="${2:-}"; TARGET_DIR="${3:-}"; shift; shift; shift ;;
        *)         TARGET_DIR="$1"; shift ;;
    esac
done

if [ -z "$MODE" ]; then
    echo "사용법:"
    echo "  bash install-skills.sh --list"
    echo "  bash install-skills.sh --all <target_dir>"
    echo "  bash install-skills.sh --skills s1,s2,s3 <target_dir>"
    exit 1
fi

# ── 도구 체크 ──────────────────────────────────────────────
command -v git >/dev/null 2>&1 || { echo "[ERROR] git이 설치되어 있지 않습니다"; exit 1; }

# ── shallow clone ──────────────────────────────────────────
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

if [ "$MODE" = "list" ]; then
    git clone --depth 1 --single-branch --branch main "$REPO_URL" "$TMPDIR/$REPO_NAME" 2>/dev/null
else
    echo "📦 ${REPO_NAME} shallow clone 중..."
    git clone --depth 1 --single-branch --branch main "$REPO_URL" "$TMPDIR/$REPO_NAME" 2>&1 | tail -1
fi

CLONE_DIR="$TMPDIR/$REPO_NAME"

if [ ! -d "$CLONE_DIR/$SKILLS_SUBDIR" ]; then
    echo "[ERROR] 저장소에 ${SKILLS_SUBDIR}/ 디렉토리가 없습니다"
    exit 1
fi

# ── 스킬 목록 추출 (setup 스킬 제외) ──────────────────────
SKILL_LIST=()
for dir in "$CLONE_DIR/$SKILLS_SUBDIR"/*/; do
    [ -d "$dir" ] || continue
    name=$(basename "$dir")
    [[ "$name" == setup* ]] && continue
    SKILL_LIST+=("$name")
done

# ── MODE: list ─────────────────────────────────────────────
if [ "$MODE" = "list" ]; then
    printf '%s\n' "${SKILL_LIST[@]}"
    exit 0
fi

# ── MODE: all / skills — 설치 대상 결정 ────────────────────
if [ -z "$TARGET_DIR" ]; then
    echo "[ERROR] TARGET_DIR이 필요합니다"
    exit 1
fi

INSTALL_LIST=()
if [ "$MODE" = "all" ]; then
    INSTALL_LIST=("${SKILL_LIST[@]}")
elif [ "$MODE" = "skills" ]; then
    IFS=',' read -ra INSTALL_LIST <<< "$SKILL_CSV"
fi

if [ ${#INSTALL_LIST[@]} -eq 0 ]; then
    echo "⚠️  설치할 스킬이 없습니다."
    exit 0
fi

# ── 복사 ───────────────────────────────────────────────────
COPY_COUNT=0
SKIP_COUNT=0

echo ""
echo "━━━ ${REPO_NAME} 스킬 설치 ━━━"
mkdir -p "$TARGET_DIR"

for skill in "${INSTALL_LIST[@]}"; do
    skill=$(echo "$skill" | xargs)  # trim
    [ -z "$skill" ] && continue
    SRC="$CLONE_DIR/$SKILLS_SUBDIR/$skill"
    DEST="$TARGET_DIR/$skill"

    if [ ! -d "$SRC" ]; then
        SKIP_COUNT=$((SKIP_COUNT + 1))
        echo "  ❌ $skill (소스 없음)"
        continue
    fi

    if cp -R "$SRC" "$DEST" 2>/dev/null; then
        COPY_COUNT=$((COPY_COUNT + 1))
        echo "  ✅ $skill"
    else
        SKIP_COUNT=$((SKIP_COUNT + 1))
        echo "  ❌ $skill (복사 실패)"
    fi
done

echo ""
echo "🧹 임시 클론 정리 완료"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 설치 결과 [${REPO_NAME}]"
echo "  성공: ${COPY_COUNT}개"
echo "  스킵: ${SKIP_COUNT}개"
echo "  설치 위치: ${TARGET_DIR}/"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
