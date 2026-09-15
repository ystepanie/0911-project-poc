// Phase 10: 백엔드(backend/) 실 서버와 fetch로 연동. 더 이상 localStorage/mock-data.js를 쓰지 않는다.
// 서버 주소가 다르면 이 상수만 바꾸면 된다.

const API_ORIGIN = "http://localhost:3000";
const API_BASE = `${API_ORIGIN}/api`;

// 첨부 이미지(imageUrl)는 서버가 "/uploads/..." 형태의 상대 경로로 내려주므로, 화면에 링크로 쓸 절대 URL로 바꿀 때 사용
export function resolveUploadUrl(imageUrl) {
  return imageUrl ? `${API_ORIGIN}${imageUrl}` : null;
}

// 완료 트리거(Chat 리액션) 액션을 누른 "사람"을 이 데모에서는 입력받지 않으므로,
// 실제로는 로그인(Google Chat 계정)에서 가져올 값을 임시 고정값으로 대체한다.
const DEMO_ACTOR_EMAIL = "team-demo@example.com";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `요청 실패 (${res.status})`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function submitInquiry({ author, contact, title, content, imageFile }) {
  // 이미지 첨부가 있으면 multipart/form-data로, 없으면 기존처럼 JSON으로 보낸다 (11-2)
  if (!imageFile) {
    return request("/inquiries", {
      method: "POST",
      body: JSON.stringify({ author, contact, title, content }),
    });
  }

  const formData = new FormData();
  formData.append("author", author);
  formData.append("contact", contact);
  formData.append("title", title);
  formData.append("content", content);
  formData.append("image", imageFile);

  const res = await fetch(`${API_BASE}/inquiries`, { method: "POST", body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `요청 실패 (${res.status})`);
  }
  return res.json();
}

export async function getInquiry(inquiryId) {
  return request(`/inquiries/${encodeURIComponent(inquiryId)}`);
}

// 상세 페이지(admin-detail.html)용 — 순차 ID 대신 랜덤 accessToken으로 조회 (다른 문의 순회 방지)
export async function getInquiryByToken(token) {
  return request(`/inquiries/by-token/${encodeURIComponent(token)}`);
}

export async function completeInquiry(inquiryId) {
  return request("/chat/events", {
    method: "POST",
    body: JSON.stringify({ inquiryId, actorEmail: DEMO_ACTOR_EMAIL }),
  });
}

// 담당자 배정용 — 매칭된 팀 소속 담당자 후보 목록 (team-members.json 하드코딩 기반)
export async function getTeamMembers(teamId) {
  return request(`/teams/${encodeURIComponent(teamId)}/members`);
}

export async function assignInquiryOwner(inquiryId, assigneeId) {
  return request(`/inquiries/${encodeURIComponent(inquiryId)}/assignee`, {
    method: "POST",
    body: JSON.stringify({ assigneeId }),
  });
}

export async function submitSurvey(inquiryId, { satisfaction, matchCorrect, comment }) {
  return request(`/inquiries/${encodeURIComponent(inquiryId)}/survey`, {
    method: "POST",
    body: JSON.stringify({ satisfaction, matchCorrect, comment }),
  });
}

// contact(연락처) 기준으로 발송 확정되었고 아직 응답하지 않은 설문이 있는지 조회
// 게시판 접속 시 팝업 노출 여부를 판단하는 데 사용 (5.5절 참고)
export async function getPendingSurvey(contact) {
  if (!contact) return null;
  return request(`/inquiries/pending-survey?contact=${encodeURIComponent(contact)}`);
}

// "내 문의 목록"(my-inquiries.html)용 — contact 기준으로 본인이 제출한 문의 전체 조회
export async function listMyInquiries(contact) {
  return request(`/inquiries?contact=${encodeURIComponent(contact)}`);
}

// 팀 관리자 페이지(admin-teams.html)용 — Phase 12

export async function getOrgChart() {
  return request("/org-chart");
}

export async function getTeamConfig(teamId) {
  return request(`/teams/${encodeURIComponent(teamId)}/config`);
}

export async function saveTeamConfig(teamId, { keywords, description, webhookUrl }) {
  const body = { keywords, description };
  if (webhookUrl !== undefined) body.webhookUrl = webhookUrl;
  return request(`/teams/${encodeURIComponent(teamId)}/config`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function testTeamWebhook(teamId) {
  return request(`/teams/${encodeURIComponent(teamId)}/test-webhook`, { method: "POST" });
}
