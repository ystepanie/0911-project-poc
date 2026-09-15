// 팀 매칭 파이프라인: 키워드 후보 추출 → LLM 재판단 (문의라우팅_백엔드_구현계획.md 5.1, 5.6절)

const { getCandidates } = require("./candidateFilter");
const { getReranker } = require("./rerankerRegistry");

// 반환 필드명을 라우트가 저장하는 inquiry 객체의 필드명과 그대로 맞춘다(matchedTeam/matchReason 등) —
// routes/inquiries.js가 이름을 다시 매핑하지 않고 `...match`로 바로 합칠 수 있게 하기 위함.
async function matchInquiry(text, teams, reranker = getReranker()) {
  const candidateTeams = getCandidates(text, teams);

  if (candidateTeams.length === 0) {
    return {
      candidateTeams,
      matchedTeamId: null,
      matchedTeam: null,
      matchConfidence: 0,
      matchFailed: true,
      failReason: "no_candidate",
      matcherMode: null, // 후보가 없어 재판단기를 아예 호출하지 않았다
      matchReason: null,
    };
  }

  const result = await reranker.rerank(text, candidateTeams);

  return {
    candidateTeams,
    matchedTeamId: result.teamId,
    matchedTeam: result.teamName,
    matchConfidence: result.confidence,
    matchFailed: result.failed,
    failReason: result.failReason,
    matcherMode: result.matcherMode,
    matchReason: result.reason,
  };
}

module.exports = { matchInquiry };
