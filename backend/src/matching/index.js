// 팀 매칭 파이프라인: 키워드 후보 추출 → LLM 재판단 (문의라우팅_백엔드_구현계획.md 5.1, 5.6절)

const { getCandidates } = require("./candidateFilter");
const llmReranker = require("./llmReranker");

function matchInquiry(text, teams, reranker = llmReranker) {
  const candidateTeams = getCandidates(text, teams);

  if (candidateTeams.length === 0) {
    return {
      candidateTeams,
      matchedTeamId: null,
      matchedTeamName: null,
      matchConfidence: 0,
      matchFailed: true,
      failReason: "no_candidate",
      matcherMode: reranker.MATCHER_MODE,
      reason: null,
    };
  }

  const result = reranker.rerank(text, candidateTeams);

  return {
    candidateTeams,
    matchedTeamId: result.teamId,
    matchedTeamName: result.teamName,
    matchConfidence: result.confidence,
    matchFailed: result.failed,
    failReason: result.failReason,
    matcherMode: reranker.MATCHER_MODE,
    reason: result.reason,
  };
}

module.exports = { matchInquiry };
