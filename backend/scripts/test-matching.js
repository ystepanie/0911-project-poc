// DB 없이 매칭 파이프라인(키워드 후보 추출 + Mock LLM 재판단) 결과를 빠르게 확인하는 스크립트.
// 실행: node scripts/test-matching.js
// 팀 데이터는 backend/data/org-chart.json + team-config.json(teamRepository)에서 가져온다 (Phase 12).
// PostgreSQL이 준비되면 이 데이터도 실제 teams 테이블 조회로 교체된다 (후속 과제).

const teamRepository = require("../src/teams/teamRepository");
const { matchInquiry } = require("../src/matching");
const teams = teamRepository.getAllTeams();

const samples = [
  { title: "법인카드 정산 문의", content: "지난달 법인카드 정산 세금계산서 처리 관련 문의드립니다." },
  { title: "연차 사용 문의", content: "이번 달 남은 연차가 며칠인지 확인하고 싶습니다." },
  { title: "회의실 예약 및 계약서 검토", content: "3층 회의실을 예약하고 싶고, 협력사 계약서도 같이 검토받고 싶어요." },
  { title: "기타 문의", content: "오늘 날씨가 좋네요 감사합니다" },
];

for (const sample of samples) {
  const result = matchInquiry(`${sample.title} ${sample.content}`, teams);
  console.log("----------------------------------------");
  console.log(`제목: ${sample.title}`);
  console.log(`후보군 (${result.candidateTeams.length}개):`, result.candidateTeams);
  console.log(`매칭 결과: ${result.matchedTeamName ?? "(없음)"}`);
  console.log(`confidence: ${result.matchConfidence}`);
  console.log(`실패 여부: ${result.matchFailed} (${result.failReason ?? "-"})`);
  console.log(`재판단 사유: ${result.reason ?? "-"}`);
}
