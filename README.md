# Claude Code Subagent → node agent.ts → claude -p --output-format json (Example)

이 예제 레포는 아래 흐름을 **작동 가능한 형태**로 최소 구현합니다.

1) (메인) Claude Code 실행
2) 서브에이전트(`claude-cli-runner`)가 Bash로 `node agent.ts` 실행
3) `agent.ts`가 `claude -p "<prompt>" --output-format json`를 비대화형으로 실행하고 JSON을 파싱
4) `agent.ts`가 **결정론 체크(파일 존재/정규식 매칭)** 로 성공/실패를 판정하고 JSON 리포트를 출력
5) 서브에이전트가 그 결과를 메인에게 보고

## 요구사항
- Claude Code CLI 설치 및 로그인 (`claude` 커맨드가 PATH에 있어야 함)
- Node.js 18+ (이 예제는 TS 실행을 위해 `tsx`를 사용합니다)

## 설치
```bash
npm install
```

## 터미널에서 바로 데모 실행
성공 데모:
```bash
npm run demo:success
```

실패 데모:
```bash
npm run demo:failure
```

## Claude Code에서 사용하기
1) 이 레포에서 Claude Code를 실행:
```bash
claude
```

2) `/agents`에서 `claude-cli-runner`가 보이는지 확인(프로젝트 레벨 `.claude/agents/`에 있음)

3) 커스텀 명령 실행:
```text
/delegate Create out/hello.txt containing the word hello --expect-file out/hello.txt --expect-regex out/hello.txt:hello
```

Claude는 `claude-cli-runner` 서브에이전트를 사용해 `npm run agent ...`를 실행하고,
`agent.ts`가 출력한 JSON 리포트(성공/실패, 체크 결과, session_id 등)를 되돌려줄 겁니다.

## agent.ts 사용법
```bash
node --import tsx agent.ts "<prompt>" \
  --expect-file out/hello.txt \
  --expect-regex out/hello.txt:hello
```

### 성공/실패 판정 규칙
- `claude` 실행이 실패(프로세스 에러/exit code != 0)하면 실패
- `--expect-file`, `--expect-regex` 체크 중 하나라도 실패하면 실패
- 그 외는 성공

## 참고
- `claude -p`와 `--output-format json`은 Claude Code의 비대화형 실행 및 JSON 출력 옵션입니다.
- 자동화에서 도구 승인을 줄이려면 `--allowedTools`를 활용합니다.

