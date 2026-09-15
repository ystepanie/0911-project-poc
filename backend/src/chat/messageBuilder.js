// Chat 메시지 문구 조립 — Mock/Live 클라이언트가 동일한 문구를 쓰도록 공용으로 분리 (문의라우팅_백엔드_구현계획.md 5.2절)
//
// Phase 6-5: 완료 트리거를 ✅ 리액션이 아니라 "상세 페이지 링크 클릭"으로 바꿨다.
// 수신 웹훅은 리액션 이벤트를 받아올 수 없다는 한계(Phase 6-4)를 아예 우회하고,
// 스크린샷 전체 보기/상태 관리도 페이지 안에서 처리할 수 있어 더 간단하다.
//
// Phase 6-6: 링크에 순차 ID(Q-0001) 대신 랜덤 accessToken을 써서, 다른 문의 번호를 순회해
// 열람하는 걸 막는다 (로그인 붙기 전까지의 임시 보완책 — 후속 SSO 연동 시 대체될 자리).

const { FRONTEND_BASE_URL } = require("../config");

function buildDetailUrl(inquiry) {
  return `${FRONTEND_BASE_URL}/admin-detail.html?token=${encodeURIComponent(inquiry.accessToken)}`;
}

const CONTENT_PREVIEW_LENGTH = 50;

// 문의 내용을 Chat 메시지에 통째로 넣으면 가독성이 떨어져(22절 참고), 앞부분만 미리보기로 보여주고
// 전체 내용은 상세 페이지 링크에서 확인하게 한다.
function buildContentPreview(content) {
  const singleLine = content.replace(/\s+/g, " ").trim();
  return singleLine.length > CONTENT_PREVIEW_LENGTH
    ? `${singleLine.slice(0, CONTENT_PREVIEW_LENGTH)}...`
    : singleLine;
}

function buildInitialMessage(inquiry) {
  const lines = [
    `[${inquiry.id}] ${inquiry.title}`,
    `작성자: ${inquiry.author}`,
    `문의 ID: ${inquiry.id}`,
    `내용: ${buildContentPreview(inquiry.content)}`,
  ];
  if (inquiry.imageUrl) {
    lines.push(`📎 첨부 이미지 있음`);
  }
  lines.push(`상세 확인 및 완료 처리 → ${buildDetailUrl(inquiry)}`);
  return lines.join("\n");
}

function buildReminderMessage(inquiry) {
  return `@팀장님 [${inquiry.id}] "${inquiry.title}" 문의가 아직 처리되지 않았습니다.\n${buildDetailUrl(inquiry)}`;
}

module.exports = { buildInitialMessage, buildReminderMessage, buildDetailUrl };
