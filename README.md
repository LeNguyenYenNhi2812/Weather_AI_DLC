# TCM Employee Portal — AI-DLC x Claude Code Starter (Bilingual KO/EN)

한 폴더로 한국어/영어 데모를 모두 진행할 수 있는 통합 스타터입니다.
Claude Code는 사용자가 쓴 언어(한국어/영어)로 응답합니다.

## 사용법 / How to use
1. 이 폴더에서 Claude Code 실행 / Run Claude Code here:  `claude`
2. 원하는 언어의 프롬프트를 입력 / Paste the prompt in your language:

[한국어]
  requirements/hr-portal-requirements-ko.md 와
  requirements/hr-portal-constraints-ko.md 를 기반으로
  AI-DLC 워크플로를 시작해줘. 신규(그린필드) 프로젝트야.

[English]
  Start the AI-DLC workflow based on
  requirements/hr-portal-requirements-en.md and
  requirements/hr-portal-constraints-en.md.
  This is a new (greenfield) project.

3. 질문 파일에 [Answer]: 로 답하고 승인하며 진행. 산출물은 aidlc-docs/ 에 쌓입니다.
   Answer each question file with [Answer]:, approve, and continue.

## 구성 / Contents
- .aidlc-rule-details/  : AI-DLC 규칙(.md) + core-workflow.md + guidance.md(언어 미러링)
- CLAUDE.md            : 사용자 언어로 응답하도록 설정
- requirements/        : 한국어(-ko) · 영어(-en) 요구사항
