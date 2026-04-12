#!/usr/bin/env bash
# official-skills:setup-claude-plugins-official — claude-plugins-official 플러그인 설치 유틸리티
#
# 사용법:
#   bash install-skills.sh --list                                    # 플러그인 목록 출력
#   bash install-skills.sh --install p1,p2,p3 [--scope user]        # 선택 설치
#   bash install-skills.sh --install-all [--scope user]              # 전체 설치
#   bash install-skills.sh --ensure-marketplace                      # 마켓플레이스 등록 확인
#
# 이 스크립트는 `claude plugin install` CLI를 사용합니다.

set -euo pipefail

MARKETPLACE_NAME="claude-plugins-official"
MARKETPLACE_REPO="anthropics/claude-plugins-official"
MARKETPLACE_URL="https://github.com/${MARKETPLACE_REPO}"

# ── 인자 파싱 ─────────────────────────────────────────────
MODE=""
PLUGIN_CSV=""
SCOPE="user"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --list)               MODE="list"; shift ;;
        --install)            MODE="install"; PLUGIN_CSV="${2:-}"; shift; shift ;;
        --install-all)        MODE="install-all"; shift ;;
        --ensure-marketplace) MODE="ensure-mp"; shift ;;
        --scope)              SCOPE="${2:-user}"; shift; shift ;;
        *)                    shift ;;
    esac
done

if [ -z "$MODE" ]; then
    echo "사용법:"
    echo "  bash install-skills.sh --list"
    echo "  bash install-skills.sh --install p1,p2,p3 [--scope user|project|local]"
    echo "  bash install-skills.sh --install-all [--scope user|project|local]"
    echo "  bash install-skills.sh --ensure-marketplace"
    exit 1
fi

# ── 도구 체크 ──────────────────────────────────────────────
command -v claude >/dev/null 2>&1 || { echo "[ERROR] claude CLI가 설치되어 있지 않습니다"; exit 1; }

# ── 마켓플레이스 등록 확인/추가 ────────────────────────────
ensure_marketplace() {
    local mp_list
    mp_list=$(claude plugin marketplace list 2>&1)

    if echo "$mp_list" | grep -q "$MARKETPLACE_NAME"; then
        echo "✅ 마켓플레이스 '${MARKETPLACE_NAME}' 이미 등록됨"
        return 0
    fi

    echo "📦 마켓플레이스 '${MARKETPLACE_NAME}' 등록 중..."
    claude plugin marketplace add "$MARKETPLACE_URL" 2>&1
    echo "✅ 마켓플레이스 등록 완료"
}

# ── 플러그인 목록 조회 (GitHub API) ────────────────────────
list_plugins() {
    command -v git >/dev/null 2>&1 || { echo "[ERROR] git이 필요합니다"; exit 1; }

    local tmpdir
    tmpdir=$(mktemp -d)
    trap 'rm -rf "$tmpdir"' RETURN

    git clone --depth 1 --single-branch --branch main \
        "https://github.com/${MARKETPLACE_REPO}.git" "$tmpdir/repo" 2>/dev/null

    for dir in "$tmpdir/repo/plugins"/*/; do
        [ -d "$dir" ] || continue
        basename "$dir"
    done
}

# ── MODE: ensure-marketplace ───────────────────────────────
if [ "$MODE" = "ensure-mp" ]; then
    ensure_marketplace
    exit 0
fi

# ── MODE: list ─────────────────────────────────────────────
if [ "$MODE" = "list" ]; then
    list_plugins
    exit 0
fi

# ── MODE: install / install-all ────────────────────────────
ensure_marketplace

INSTALL_LIST=()
if [ "$MODE" = "install-all" ]; then
    while IFS= read -r p; do
        [ -n "$p" ] && INSTALL_LIST+=("$p")
    done < <(list_plugins)
elif [ "$MODE" = "install" ]; then
    IFS=',' read -ra INSTALL_LIST <<< "$PLUGIN_CSV"
fi

if [ ${#INSTALL_LIST[@]} -eq 0 ]; then
    echo "⚠️  설치할 플러그인이 없습니다."
    exit 0
fi

# ── 설치 실행 ──────────────────────────────────────────────
SUCCESS_COUNT=0
FAIL_COUNT=0

echo ""
echo "━━━ ${MARKETPLACE_NAME} 플러그인 설치 (scope: ${SCOPE}) ━━━"

for plugin in "${INSTALL_LIST[@]}"; do
    plugin=$(echo "$plugin" | xargs)  # trim
    [ -z "$plugin" ] && continue

    echo ""
    echo "🔽 ${plugin} 설치 중..."
    if claude plugin install "${plugin}@${MARKETPLACE_NAME}" --scope "$SCOPE" 2>&1; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        echo "  ✅ ${plugin}"
    else
        FAIL_COUNT=$((FAIL_COUNT + 1))
        echo "  ❌ ${plugin} (설치 실패)"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 설치 결과 [${MARKETPLACE_NAME}]"
echo "  성공: ${SUCCESS_COUNT}개"
echo "  실패: ${FAIL_COUNT}개"
echo "  scope: ${SCOPE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
