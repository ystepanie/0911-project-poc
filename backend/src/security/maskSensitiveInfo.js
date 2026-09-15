// 정형 패턴 개인정보 마스킹 (문의라우팅_백엔드_구현계획.md 3.3절 / 이전 대화의 마스킹 전략 논의 반영).
//
// 문의 원문이 외부 LLM API로 나가는 지점(matching/liveLlmReranker.js)에만 적용한다.
// Chat 메시지·상세 페이지는 팀원이 실제로 처리해야 해서 원문이 필요하므로 마스킹하지 않는다.
//
// 자유 서술형 개인정보(이름, 인사평가 내용 등)는 정규식으로 못 잡는다 — 그건 여전히
// 3.3절 안내 문구 + 사람의 판단에 맡긴다 (PoC 범위 밖으로 이미 확정된 사항).

const PATTERNS = [
  { label: "주민번호", regex: /\b\d{6}[-\s]?[1-4]\d{6}\b/g },
  { label: "카드번호", regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g },
  { label: "전화번호", regex: /\b01[016789][-\s]?\d{3,4}[-\s]?\d{4}\b/g },
  { label: "이메일", regex: /\b[\w.-]+@[\w.-]+\.\w+\b/g },
];

function maskSensitiveInfo(text) {
  return PATTERNS.reduce((acc, { label, regex }) => acc.replace(regex, `[${label} 마스킹됨]`), text);
}

module.exports = { maskSensitiveInfo };
