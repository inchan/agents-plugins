# Ticket Classification: UI vs Non-UI

Complete 7-dimension classification algorithm for ticket type determination.

---

## Classification Algorithm

The classifier uses a multi-dimensional signal analysis approach across 7 signal dimensions.

### Signal Dimension 1: Explicit Override

Supported `--type` values:

| Flag | ticket_type | sub_type | confidence |
|------|-------------|----------|------------|
| `--type ui` | `ui` | `null` | 1.0 |
| `--type non-ui` | `non-ui` | auto-classified | 1.0 (ticket_type only) |
| `--type logic` | `non-ui` | `logic` | 1.0 |
| `--type feature` | `non-ui` | `feature` | 1.0 |
| `--type refactoring` | `non-ui` | `refactoring` | 1.0 |
| `--type performance` | `non-ui` | `performance` | 1.0 |

If user provides any of the above flags, use that classification directly with confidence 1.0.

### Signal Dimension 2: Weighted Keyword Category Matching

Score ticket text against categorized keyword sets with diminishing returns per category.

**UI Keyword Categories** (category → weight):

| Category | Weight | Example Keywords |
|----------|--------|-----------------|
| `css_styling` | 0.8 | css, color, font, padding, margin, border, flexbox, tailwind |
| `layout` | 0.7 | layout, alignment, responsive, breakpoint, viewport, mobile, sidebar |
| `rendering_visual` | 0.6 | render, visual, display, visible, hidden, blank, overlapping, truncated |
| `ui_components` | 0.5 | button, modal, dialog, dropdown, form, tooltip, spinner, card, menu |
| `browser_specific` | 0.6 | chrome, firefox, safari, dom, html, canvas, svg, cross-browser |
| `screenshot_visual_evidence` | 0.9 | screenshot, visual bug, visual regression, figma, mockup, design |
| `interaction` | 0.4 | click, hover, focus, drag, scroll, tap, keyboard, cursor |
| `frontend_tech` | 0.3 | react, vue, angular, jsx, tsx, component, hook, redux |
| `accessibility` | 0.5 | a11y, aria, screen reader, wcag, contrast, tab order |

**Non-UI Keyword Categories** (category → weight):

| Category | Weight | Example Keywords |
|----------|--------|-----------------|
| `backend` | 0.7 | api, endpoint, database, query, migration, authentication, token |
| `infrastructure` | 0.8 | deploy, docker, kubernetes, aws, terraform, monitoring, logging |
| `data_logic` | 0.7 | calculation, algorithm, race condition, memory leak, exception, timeout |
| `cli_system` | 0.6 | cli, terminal, cron, daemon, queue, kafka, redis, cache |

**Scoring**: Each category contributes once with a multiplier based on match count:
- 1 match: full weight
- 2 matches: weight × 1.3
- 3+ matches: weight × 1.6 (capped)

### Signal Dimension 3: Regex Contextual Pattern Matching

Match contextual phrases that strongly indicate UI issues:

| Pattern | Weight | Label |
|---------|--------|-------|
| `looks/appears/displays wrong/broken/incorrect` | 0.8 | visual_description |
| `css/style/class not applied/working/loading` | 0.9 | css_issue |
| `screen/page/view is blank/empty/white` | 0.7 | blank_screen |
| `responsive/mobile/tablet layout/view` | 0.8 | responsive_issue |
| `z-index/stacking/layer issue/problem` | 0.9 | stacking_issue |
| `.png/.jpg/.gif/.svg` file references | 0.7 | media_attachment |
| `dark/light mode/theme` | 0.6 | theme_issue |
| `hover/focus/active state` | 0.8 | interaction_state |

### Signal Dimension 4: Label Analysis

Direct label matching against known UI and non-UI label sets:
- **UI labels** (+1.0 each): `ui`, `frontend`, `css`, `design`, `visual`, `ux`, `accessibility`, `a11y`, `responsive`, `browser`, `layout`
- **Non-UI labels** (+1.0 each): `backend`, `api`, `database`, `infra`, `devops`, `security`, `performance`, `cli`, `data`

### Signal Dimension 5: Attachment & Screenshot Heuristics

- Image attachments (.png, .jpg, .gif, .svg, .webp): +0.8 UI score per image
- Video attachments (.mp4, .mov, .webm): +0.6 UI score per video

### Signal Dimension 6: Environment / Browser Hints

Browser-related environment keys (browser, user_agent, resolution, viewport, device): +0.5 UI score each.

### Signal Dimension 7: Interaction Verb Density in Reproduction Steps

Count interaction verbs (click, tap, hover, scroll, drag, navigate, etc.) in steps-to-reproduce:
- 2+ verbs: boost UI score by 0.4 × min(count, 5)

---

## Classification Decision

```
ui_score = sum(all_ui_signals)
non_ui_score = sum(all_non_ui_signals)
total = ui_score + non_ui_score

if total == 0:
    type = "unknown", confidence = 0.0

elif ui_ratio (ui_score / total) >= 0.65:
    type = "ui"
    confidence = ui_ratio

elif ui_ratio <= 0.35:
    type = "non-ui"
    confidence = 1.0 - ui_ratio

else:  # ambiguous (0.35 < ui_ratio < 0.65)
    type = whichever score is higher
    confidence = abs(ui_ratio - 0.5) * 2  (low confidence)
```

## Confidence Thresholds & Actions

| Confidence | Level | Action |
|-----------|-------|--------|
| >= 0.8 | High | Proceed automatically |
| 0.6 – 0.8 | Medium | Proceed, note uncertainty in log |
| 0.5 – 0.6 | Low | Proceed with `[WARN] E_CLASSIFY` logged |
| < 0.5 | Very Low | Default to non-UI, log warning, collect more evidence |

## Classification Output Structure

```json
{
  "ticket_type": "ui" | "non-ui",
  "sub_type": null | "logic" | "feature" | "refactoring" | "performance",
  "confidence": 0.92,
  "ui_score": 5.6,
  "non_ui_score": 0.7,
  "signals": [
    "ui:css_styling(css, color, background)",
    "ui:ui_components(button, modal)",
    "ui:screenshot_visual_evidence(screenshot)",
    "pattern:visual_description",
    "label:frontend",
    "attachment:image(bug.png)",
    "env:browser",
    "steps:interaction_verbs(3)",
    "non_ui:backend(api)"
  ],
  "reasoning": "Classified as UI issue (ui_score=5.6 vs non_ui=0.7). Strong UI signals across 8 indicators."
}
```

**Field rules:**
- `ticket_type="ui"` → `sub_type` is always `null` (Phase 2에서 확장 가능)
- `ticket_type="non-ui"` → `sub_type`는 `logic | feature | refactoring | performance` 중 하나

---

## Non-UI Sub-Type Classification

### Overview

Non-UI 티켓으로 분류된 후 2차 분류로 `sub_type`을 결정한다. `sub_type` confidence는 `ticket_type` confidence와 독립적으로 산출된다.

### Sub-Type Rules

**1. `refactoring` (최우선 체크)**

다음 키워드가 존재하면 `sub_type="refactoring"`:

| Keywords |
|----------|
| refactor, cleanup, tech debt, code smell, rename, extract, simplify, reorganize, restructure, dead code, unused, decouple, modularize |

> 리팩토링은 기능 변경 없이 구조 개선이므로 최우선 판별.

**2. `performance` (2순위)**

다음 키워드가 존재하면 `sub_type="performance"`:

| Keywords |
|----------|
| performance, slow, latency, memory leak, cache, optimize, bottleneck, profiling, throughput, benchmark, timeout, OOM, out of memory |

**3. `logic` (3순위 — backend + data_logic 신호 우세)**

Non-UI 키워드 중 `backend` 또는 `data_logic` 카테고리 가중치 합계가 `infrastructure + cli_system` 합계보다 클 때:

| Primary signals |
|-----------------|
| backend(api, endpoint, database, query, migration, authentication, token) |
| data_logic(calculation, algorithm, race condition, memory leak, exception, timeout) |

→ `sub_type="logic"`

**4. `feature` (4순위 — infrastructure + cli_system 신호 우세 또는 기본값)**

`infrastructure` 또는 `cli_system` 카테고리 가중치 합계가 우세하거나, 위 3가지에 해당하지 않을 때:

| Primary signals |
|-----------------|
| infrastructure(deploy, docker, kubernetes, aws, terraform, monitoring, logging) |
| cli_system(cli, terminal, cron, daemon, queue, kafka, redis, cache) |

→ `sub_type="feature"`

### Sub-Type Priority Order

```
refactoring > performance > logic > feature
```

위 순서로 체크하여 첫 번째 매칭 sub_type을 사용한다.

---

## Display Type Mapping

분류 결과를 사용자에게 표시할 때 사용하는 매핑 테이블:

| ticket_type | sub_type | Display Label (한글) | Display Label (영문) |
|-------------|----------|---------------------|---------------------|
| `ui` | `null` | UI | UI |
| `non-ui` | `logic` | 로직 | Logic |
| `non-ui` | `feature` | 기능 | Feature |
| `non-ui` | `refactoring` | 리팩토링 | Refactoring |
| `non-ui` | `performance` | 성능 | Performance |

**사용 예시:**

```
[INFO ] [CLASSIFY] +0:12 — 분류 완료: 로직 (신뢰도: 0.88)
[INFO ] [CLASSIFY] +0:05 — 분류 완료: UI (신뢰도: 1.00) [--type override]
```

## Classification Impact on Subsequent Phases

| ticket_type | sub_type | Phase 3 (Explore) | Phase 5 (Implement) | Phase 6 (Verify) |
|-------------|----------|-------------------|---------------------|------------------|
| `ui` | `null` | 컴포넌트 트리 + CSS cascade 분석 에이전트 | 시각적/반응형/접근성 중심 | 테스트 + 브라우저 자동화 (Playwright MCP / Chrome DevTools) |
| `non-ui` | `logic` | 실행 경로 추적 + 데이터 플로우 분석 | 로직/알고리즘 수정, API 정합성 | 기능 테스트, 단위 테스트, assertion 검증 |
| `non-ui` | `feature` | 기능 흐름 분석 + 인프라/CLI 구조 탐색 | 기능 구현/수정, 인프라 변경 | 통합 테스트, E2E 흐름 검증 |
| `non-ui` | `refactoring` | 코드 구조 분석 + 의존성 그래프 탐색 | 리팩토링 적용 (동작 변경 없음) | 회귀 테스트, 동작 동등성 검증 |
| `non-ui` | `performance` | 프로파일링 포인트 식별 + 병목 추적 | 최적화 적용 (캐시/알고리즘/쿼리) | 벤치마크 검증, 성능 기준값 비교 |

**Phase 6 fallback (UI only):** 브라우저 도구 미사용 시 DOM 분석 / 코드 레벨 폴백

---

## Classification Output Schema

Defines the typed output structure for ticket type classification.

### `TicketClassification`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ticket_id` | string | yes | Identifier of the ticket being classified |
| `classification` | `TicketType` | yes | The determined ticket type |
| `confidence` | number (0.0-1.0) | yes | Confidence score for the classification |
| `reasoning` | `ClassificationReasoning` | yes | Evidence and logic behind the classification |
| `ui_details` | `UIDetails \| null` | no | Additional UI-specific metadata (present only when `classification` is `ui`) |
| `timestamp` | string (ISO 8601) | yes | When the classification was performed |

### `TicketType` (enum)

| Value | Description |
|-------|-------------|
| `ui` | Ticket involves visual, layout, styling, interaction, or browser-rendered behavior |
| `non-ui` | Ticket involves backend logic, data processing, API, CLI, or non-visual behavior |

### `ClassificationReasoning`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `signals` | `ClassificationSignal[]` | yes | Individual signals that informed the classification |
| `summary` | string | yes | Human-readable explanation of the classification decision |
| `dominant_category` | string | yes | The primary signal category that most influenced the result |

### `ClassificationSignal`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `category` | `SignalCategory` | yes | The type of signal detected |
| `indicator` | string | yes | The specific evidence or keyword found |
| `source` | `SignalSource` | yes | Where this signal was found |
| `weight` | number (0.0-1.0) | yes | How strongly this signal influences the classification |
| `direction` | `ui \| non-ui` | yes | Which classification this signal supports |

### `SignalCategory` (enum)

| Value | Description |
|-------|-------------|
| `keyword` | UI/non-UI keywords found in ticket text (e.g., "button", "CSS", "API", "database") |
| `file_reference` | File paths mentioned that indicate UI or non-UI code (e.g., `.tsx`, `.css` vs `.py`, `.sql`) |
| `component_reference` | References to UI components, pages, or backend services |
| `error_type` | Type of error described (visual glitch vs exception/logic error) |
| `reproduction_context` | How the bug is reproduced (browser interaction vs API call/CLI) |
| `screenshot_present` | Whether screenshots or visual artifacts are attached |
| `stack_trace` | Stack trace contents indicating frontend or backend origin |

### `SignalSource` (enum)

| Value | Description |
|-------|-------------|
| `title` | Ticket title |
| `description` | Ticket description/body |
| `labels` | Ticket labels or tags |
| `attachments` | Attached files, screenshots, or logs |
| `comments` | Ticket comments or discussion |
| `linked_code` | Referenced source files or PRs |

### `UIDetails`

Present only when `classification` is `ui`. Provides metadata needed for browser-based verification.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `affected_components` | string[] | yes | UI components, pages, or views affected |
| `affected_files` | string[] | yes | Source files likely involved (e.g., `.tsx`, `.css`, `.html`) |
| `viewport_relevant` | boolean | no | Whether the issue is viewport/responsive-specific |
| `browser_specific` | string \| null | no | Browser name if issue is browser-specific |
| `visual_regression` | boolean | no | Whether this is a visual regression (style/layout change) |
| `interaction_required` | boolean | no | Whether user interaction is needed to reproduce |
| `target_url` | string \| null | no | URL or route where the issue manifests |

### Confidence Score Guidelines

| Range | Meaning | Action |
|-------|---------|--------|
| **0.9-1.0** | Very high confidence | Proceed with classification |
| **0.7-0.89** | High confidence | Proceed, note minor ambiguity |
| **0.5-0.69** | Moderate confidence | Flag for review, may need more evidence |
| **0.3-0.49** | Low confidence | Collect additional evidence before proceeding |
| **0.0-0.29** | Very low confidence | Cannot classify; escalate or request clarification |

A minimum confidence of **0.5** is required to proceed with classification.
