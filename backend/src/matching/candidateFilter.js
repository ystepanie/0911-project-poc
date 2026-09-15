// 1단계: 키워드 규칙 매칭으로 후보 팀 3~5개 추출 (문의라우팅_백엔드_구현계획.md 5.1절)
// DB(teams 테이블)가 아직 연결되지 않아, 지금은 teams-seed.json(backend/seeds/001_teams.sql과 동일 내용)을 사용한다.
// Phase 9(프론트-백엔드 연동)에서 teams 리포지토리로 교체될 자리.

const MAX_CANDIDATES = 5;

function scoreTeam(text, team) {
  const normalized = text.toLowerCase();
  const hits = team.keywords.filter((kw) => normalized.includes(kw.toLowerCase()));
  return { score: hits.length / team.keywords.length, hits: hits.length };
}

// interface CandidateFilter { getCandidates(text, teams): Array<{ teamId, teamName, keywordScore, keywordHits }> }
function getCandidates(text, teams) {
  return teams
    .map((team) => {
      const { score, hits } = scoreTeam(text, team);
      return { teamId: team.id, teamName: team.name, keywordScore: score, keywordHits: hits };
    })
    .filter((candidate) => candidate.keywordScore > 0)
    .sort((a, b) => b.keywordScore - a.keywordScore)
    .slice(0, MAX_CANDIDATES);
}

module.exports = { getCandidates, MAX_CANDIDATES };
