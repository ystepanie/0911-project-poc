// Mock 데이터 및 저장소 (localStorage 기반)
// 실제 백엔드 연동 시 이 파일 전체가 서버 로직으로 대체됨.
// teams.json과 동일한 내용을 file:// 환경(fetch 불가)에서도 동작하도록 인라인으로 둔다.

const TEAMS = [
  { name: "회계팀", keywords: ["법인카드", "정산", "세금계산서", "경비", "출장비", "영수증", "예산"] },
  { name: "인사팀", keywords: ["채용", "휴가", "연차", "급여명세서", "입사", "퇴사", "복리후생", "인사평가"] },
  { name: "IT지원팀", keywords: ["계정", "비밀번호", "노트북", "네트워크", "vpn", "프린터", "소프트웨어", "장애"] },
  { name: "총무팀", keywords: ["회의실", "비품", "출입증", "주차", "사무용품", "택배", "시설"] },
  { name: "법무팀", keywords: ["계약서", "계약", "저작권", "라이선스", "소송", "법적", "약관"] },
];

const MATCH_THRESHOLD = 0.3;
const STORAGE_KEY = "inquiries";
const SEQ_KEY = "inquirySeq";

function loadInquiries() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveInquiries(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function nextInquiryId() {
  const seq = Number(localStorage.getItem(SEQ_KEY) || "0") + 1;
  localStorage.setItem(SEQ_KEY, String(seq));
  return `Q-${String(seq).padStart(4, "0")}`;
}

// 매우 단순한 키워드 겹침 기반 mock 매칭 (실제 RAG 매칭의 자리표시자)
function matchTeam(text) {
  const normalized = text.toLowerCase();
  let best = null;
  let bestScore = 0;

  for (const team of TEAMS) {
    const hits = team.keywords.filter((kw) => normalized.includes(kw.toLowerCase()));
    const score = hits.length / team.keywords.length;
    if (score > bestScore) {
      bestScore = score;
      best = team.name;
    }
  }

  if (!best) {
    return { matchedTeam: null, matchConfidence: 0, matchFailed: true, failReason: "no_team_found" };
  }
  if (bestScore < MATCH_THRESHOLD) {
    return { matchedTeam: best, matchConfidence: bestScore, matchFailed: true, failReason: "low_confidence" };
  }
  return { matchedTeam: best, matchConfidence: bestScore, matchFailed: false, failReason: null };
}

export const mockData = {
  loadInquiries,
  saveInquiries,
  nextInquiryId,
  matchTeam,
  TEAMS,
};
