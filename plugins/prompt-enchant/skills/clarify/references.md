# 연구 참조 문헌

## 핵심 논문

### 1. CLAMBER: A Benchmark of Identifying and Clarifying Ambiguous Information Needs in Large Language Models
- **학회**: ACL 2024 (Long Paper)
- **저자**: Tong Zhang, Peixin Qin, Yang Deng, Chen Huang, Wenqiang Lei, et al.
- **링크**: https://aclanthology.org/2024.acl-long.578/
- **GitHub**: https://github.com/zt991211/CLAMBER

**핵심 기여**:
- 모호성 분류 체계 (Taxonomy) 제안
  - Epistemic Misalignment: Contradiction, Unfamiliar
  - Linguistic Ambiguity: Lexical, Semantic
  - Aleatoric Output: What, Whom, When, Where
- 12K 고품질 데이터셋 구축
- 현재 LLM들의 한계 발견:
  - CoT/few-shot prompting의 효과 제한적
  - 오히려 과신(overconfidence) 유발
  - 에러 유형: Under-specified (52.25%), Over-specified, Wrong Aspect

**적용한 내용**:
- 모호성 분류 체계를 PTG Framework과 결합
- 질문 품질 평가 기준

---

### 2. Active Task Disambiguation with LLMs
- **학회**: ICLR 2025 (Spotlight)
- **저자**: Katarzyna Kobalczyk, Nicolas Astorga, Tennison Liu, Mihaela van der Schaar
- **링크**: https://openreview.net/forum?id=JAMxRSXLFz
- **GitHub**: https://github.com/kasia-kobalczyk/active-task-disambiguation

**핵심 기여**:
- Task ambiguity의 formal definition
- Bayesian Experimental Design 기반 질문 선택
- Information Gain 최대화 원칙
- 암시적 추론 → 명시적 추론 전환

**적용한 내용**:
- Information Gain 기반 질문 결정 원칙
- "가장 해소 효과가 큰 모호성에만 질문" 철학
- 질문 품질 기준 (상호 배타적 선택지)

---

### 3. Modeling Future Conversation Turns to Teach LLMs to Ask Clarifying Questions
- **학회**: ICLR 2025
- **저자**: Michael J.Q. Zhang et al.
- **링크**: https://arxiv.org/abs/2410.13788

**핵심 기여**:
- Double-turn preference labeling
- 미래 대화 턴 시뮬레이션으로 질문 효용성 평가
- 기존 RLHF의 한계 분석:
  - Single-turn 평가로는 clarifying question의 가치 평가 어려움
  - Annotator bias로 직접 응답 선호

**적용한 내용**:
- 질문의 장기적 효용성 고려
- "질문 후 결과"까지 고려한 질문 선택

---

### 4. 26 Principled Instructions for Prompting LLMs
- **저자**: Sondos Mahmoud Bsharat, Aidar Myrzakhan, Zhiqiang Shen
- **링크**: https://arxiv.org/pdf/2312.16171

**핵심 기여**:
- Principle 16: "Allow the model to elicit precise details and requirements by asking you questions until it has enough information"
- 57% 정확도 향상 달성

**적용한 내용**:
- 질문을 통한 정보 수집의 유효성 근거

---

## 관련 연구

### CLAM: Selective Clarification for Ambiguous Questions
- **링크**: https://openreview.net/pdf?id=VQWuqgSoVN
- **기여**: 선택적 명확화 전략, ambiguous vs unambiguous 분류

### ECLAIR: Enhanced Clarification for Interactive Responses
- **학회**: AAAI 2025
- **기여**: Sequential pipeline의 한계 지적, 맥락 정보 통합 필요성

### Teaching AI to Clarify: Handling Assumptions and Ambiguity
- **링크**: https://shanechang.com/p/training-llms-smarter-clarifying-ambiguity-assumptions/
- **기여**: 연구 동향 종합 정리

---

## 커뮤니티 인사이트

### Andrej Karpathy - Context Engineering
> "People associate prompts with short task descriptions. In industrial-strength LLM apps, **context engineering** is the delicate art of filling the context window with **just the right information** for the next step."
- 출처: X (Twitter), 2025년 6월

### OpenAI Cookbook - GPT-5 Prompting Guide
- Cursor의 경험: "maximize_context_understanding" 프롬프트가 오히려 역효과
- 도구별 불확실성 임계값 차별화 권장
- "Define when, if ever, it's acceptable for the model to hand back to the user"

### Simon Willison
> "If an LLM wrote every line of your code, but you've reviewed, tested, and understood it all, that's not vibe coding—that's using an LLM as a typing assistant."
- 맥락 이해와 검증의 중요성 강조

---

## 언어학적 배경

### A Taxonomy of Ambiguity Types for NLP
- **링크**: https://arxiv.org/html/2403.14072v1
- 11가지 모호성 유형 분류:
  - Lexical, Syntactic, Scopal, Elliptical
  - Collective/Distributive, Implicative, Presuppositional
  - Idiomatic, Coreferential, Generic/Non-generic, Type/Token

### 모호성 분류 (전통적)
| 유형 | 설명 | 예시 |
|------|------|------|
| Lexical | 단어 다의성 | "bank" (은행/강둑) |
| Syntactic | 문법 구조 | "I saw the man with the telescope" |
| Semantic | 의미 해석 | "John and Mary are married" |
| Referential | 대명사 참조 | "The car hit the pole while it was moving" |
| Pragmatic | 맥락 의존 | "Can you pass the salt?" |

---

## 데이터셋 참조

| 데이터셋 | 용도 | 링크 |
|---------|------|------|
| CLAMBER | 모호성 식별/해소 벤치마크 | https://github.com/zt991211/CLAMBER |
| AmbigQA | 모호한 질문 응답 | https://nlp.cs.washington.edu/ambigqa/ |
| CAMBIGNQ | 명확화 질문 생성 | EMNLP 2023 |
| (QA)² | 의심스러운 가정 처리 | ACL 2023 |
| AmbiCoref | 대명사 참조 모호성 | EACL 2023 |
