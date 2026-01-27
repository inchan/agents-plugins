# Codex CLI

## 명령어 구조

```bash
codex exec "<request>" --json -s danger-full-access --skip-git-repo-check
```

### 파라미터

| 파라미터 | 설명 |
|----------|------|
| `exec` | 비대화 실행 모드 |
| `--json` | JSON 출력 |
| `-s danger-full-access` | 전체 권한 (샌드박스 없음) |
| `--skip-git-repo-check` | git repo 체크 스킵 |

## 사용 예시

### 코드 리뷰

```bash
codex exec "이 PR의 변경사항을 리뷰해줘. 보안 취약점과 성능 이슈를 중점적으로 봐줘" --json -s danger-full-access --skip-git-repo-check
```

### 아키텍처 분석

```bash
codex exec "현재 프로젝트의 아키텍처를 분석하고 개선점을 제안해줘" --json -s danger-full-access --skip-git-repo-check
```

### 버그 조사

```bash
codex exec "사용자 인증이 간헐적으로 실패하는 원인을 조사해줘" --json -s danger-full-access --skip-git-repo-check
```

### 리팩토링 제안

```bash
codex exec "이 모듈의 코드 유지보수성을 개선할 리팩토링 방안을 제안해줘" --json -s danger-full-access --skip-git-repo-check
```

## 적합한 작업

- 아키텍처 설계/리뷰
- 복잡한 버그 조사
- 코드 리뷰 (보안, 성능)
- 리팩토링 계획
- 깊은 추론이 필요한 문제

## Read-only 모드

파일 수정 없이 분석만 필요할 때:

```bash
codex exec "<request>" --json -s read-only --skip-git-repo-check
```

## 장시간 작업

- 명시적 명령 (`sleep 650 && date`): ✅ 지원
- 반복 루프 작업: ⚠️ "오래 걸리니 생략" 판단할 수 있음
- 10분+ 작업 시 명시적으로 "반드시 실행해" 요청 권장
