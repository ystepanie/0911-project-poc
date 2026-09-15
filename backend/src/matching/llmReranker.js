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
  // 상한은 "매칭 비율(keywordScore)"이 아니라 "매칭된 키워드 개수(keywordHits)"로 건다.
  // 비율로 상한을 걸면 키워드를 많이 등록해둔 팀일수록 손해를 보는 구조적 편향이 생긴다
  // (예: 7개 중 2개 매칭 = 0.29 vs 3개 중 1개 매칭 = 0.33 — 매칭 개수는 후자가 더 적은데 비율은 더 높음).
  const confidence = Math.min(base, Math.max(0.1, 0.3 + 0.15 * top.keywordHits));

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
