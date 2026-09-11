// 실제 API 붙일 때 이 파일 내부 함수들만 fetch 호출로 교체하면 되도록 구성.
// 지금은 mock-data.js + localStorage로 흉내낸다.

import { mockData } from "./mock-data.js";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function submitInquiry({ author, contact, title, content }) {
  await delay(300);

  const match = mockData.matchTeam(`${title} ${content}`);
  const inquiry = {
    id: mockData.nextInquiryId(),
    author,
    contact,
    title,
    content,
    createdAt: new Date().toISOString(),
    matchedTeam: match.matchedTeam,
    matchConfidence: match.matchConfidence,
    matchFailed: match.matchFailed,
    failReason: match.failReason,
    chatSentAt: match.matchFailed ? null : new Date().toISOString(),
    completedAt: null,
    surveyReady: false,
    surveyReadyAt: null,
    survey: {
      satisfaction: null,
      matchCorrect: null,
      comment: null,
      answeredAt: null,
    },
  };

  const list = mockData.loadInquiries();
  list.push(inquiry);
  mockData.saveInquiries(list);

  return inquiry;
}

export async function getInquiry(inquiryId) {
  await delay(100);
  const list = mockData.loadInquiries();
  return list.find((item) => item.id === inquiryId) || null;
}

export async function completeInquiry(inquiryId) {
  await delay(100);
  const list = mockData.loadInquiries();
  const inquiry = list.find((item) => item.id === inquiryId);
  if (inquiry) {
    inquiry.completedAt = new Date().toISOString();
    mockData.saveInquiries(list);
  }
  return inquiry;
}

export async function submitSurvey(inquiryId, { satisfaction, matchCorrect, comment }) {
  await delay(300);
  const list = mockData.loadInquiries();
  const inquiry = list.find((item) => item.id === inquiryId);
  if (!inquiry) {
    throw new Error("존재하지 않는 문의 ID입니다.");
  }
  inquiry.survey = {
    satisfaction,
    matchCorrect,
    comment: comment || "",
    answeredAt: new Date().toISOString(),
  };
  mockData.saveInquiries(list);
  return inquiry;
}

// 관리자가 설문 발송을 확정하는 액션 (Mock: 정식 관리자 페이지 대신 데모 버튼에서 호출)
export async function markSurveyReady(inquiryId) {
  await delay(100);
  const list = mockData.loadInquiries();
  const inquiry = list.find((item) => item.id === inquiryId);
  if (inquiry) {
    inquiry.surveyReady = true;
    inquiry.surveyReadyAt = new Date().toISOString();
    mockData.saveInquiries(list);
  }
  return inquiry;
}

// contact(연락처) 기준으로 발송 확정되었고 아직 응답하지 않은 설문이 있는지 조회
// 게시판 접속 시 팝업 노출 여부를 판단하는 데 사용 (5.5절 참고)
export async function getPendingSurvey(contact) {
  await delay(100);
  if (!contact) return null;
  const list = mockData.loadInquiries();
  return (
    list.find(
      (item) =>
        item.contact === contact &&
        item.surveyReady &&
        !item.survey.answeredAt
    ) || null
  );
}

// 완료됐지만 설문 발송이 아직 확정되지 않은 건 목록 (관리자 데모 화면용)
export async function listSurveyPending() {
  await delay(100);
  const list = mockData.loadInquiries();
  return list.filter((item) => item.completedAt && !item.surveyReady);
}

// 매칭 실패로 미배정 상태인 건 목록 (관리자 데모 화면용)
export async function listUnassigned() {
  await delay(100);
  const list = mockData.loadInquiries();
  return list.filter((item) => item.matchFailed && !item.assignedManually);
}

// 관리자가 매칭 실패 건에 팀을 수동 지정 → 정상 플로우(Chat 전송) 재진입 (5.6절)
export async function assignTeam(inquiryId, teamName) {
  await delay(200);
  const list = mockData.loadInquiries();
  const inquiry = list.find((item) => item.id === inquiryId);
  if (inquiry) {
    inquiry.matchedTeam = teamName;
    inquiry.matchFailed = false;
    inquiry.failReason = null;
    inquiry.assignedManually = true;
    inquiry.chatSentAt = new Date().toISOString();
    mockData.saveInquiries(list);
  }
  return inquiry;
}
