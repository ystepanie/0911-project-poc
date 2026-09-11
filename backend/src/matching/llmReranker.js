// 2단계: 후보 팀 중 LLM 재판단 (문의라우팅_백엔드_구현계획.md 5.1절)
// PoC 단계는 실제 LLM API를 호출하지 않는 MockLlmReranker만 구현한다.
// 실 LLM 전환 시 이 파일과 동일한 인터페이스(rerank)를 가진 LiveLlmReranker로 교체하고
// 설정으로 스위칭하면 되도록, 호출부(matchInquiry)는 reranker를 인자로 주입받는 구조로 둔다.

const CONFIDENCE_THRESHOLD = 0.5;
const MATCHER_MODE = "llm_mock";

// interface LlmReranker { rerank(text, candidates): { teamId, teamName, confidence, reason, failed, failReason } }
function rerank(text, candidates) {
  const [top, second] = candidates;
  const diff = top.keywordScore - (second ? second.keywordScore : 0);

  let base;
  if (diff >= 0.3) {
    base = 0.85;
  } else if (diff >= 0.15) {
    base = 0.7;
  } else {
    base = 0.55;
  }
  // 절대 키워드 점수가 낮으면 과신하지 않도록 상한을 함께 적용
  const confidence = Math.min(base, Math.max(0.1, top.keywordScore + 0.2));

  const reason = second
    ? `키워드 점수 ${top.keywordScore.toFixed(2)}로 "${top.teamName}"이 1위 (2위 "${second.teamName}"와 점수차 ${diff.toFixed(2)})`
    : `후보가 "${top.teamName}" 1개뿐이며 키워드 점수 ${top.keywordScore.toFixed(2)}`;

  const failed = confidence < CONFIDENCE_THRESHOLD;

  return {
    teamId: top.teamId,
    teamName: top.teamName,
    confidence,
    reason,
    failed,
    failReason: failed ? "low_confidence" : null,
  };
}

module.exports = { rerank, CONFIDENCE_THRESHOLD, MATCHER_MODE };
