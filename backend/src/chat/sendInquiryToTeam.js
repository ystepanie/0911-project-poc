// 매칭 성공(자동 또는 관리자 수동 배정) 시 팀 스페이스로 Chat 메시지를 보내는 공용 로직.
// POST /api/inquiries(자동 매칭 성공)와 POST /api/admin/inquiries/:id/assign-team(수동 배정) 양쪽에서 재사용한다.
// 팀별로 웹훅이 설정돼 있으면 실제 Google Chat으로, 없으면 Mock으로 전송한다 (chatClientRegistry 참고).
//
// 전송 실패(네트워크/URL 오류 등)도 이 함수 안에서 처리한다 — 문의 자체는 이미 등록된 상태이므로
// 예외를 던지지 않고 chatSendError/상태 로그만 남겨 관리자가 나중에 확인하게 한다.
// 호출부(routes/inquiries.js, routes/admin.js)가 각자 try/catch로 복붙하던 실패 처리를 여기 하나로 통일.

const teamRepository = require("../teams/teamRepository");
const { getChatClient } = require("./chatClientRegistry");
const store = require("../store/inMemoryStore");

async function sendInquiryToTeam(inquiry, teamId) {
  const team = teamRepository.getTeamById(teamId);
  const chatClient = getChatClient(teamId);

  try {
    const { messageId, sentAt } = await chatClient.sendMessage(team, inquiry);
    store.update(inquiry.id, { chatMessageId: messageId, chatSentAt: sentAt, chatSendError: null });
  } catch (err) {
    console.error(`[sendInquiryToTeam] Chat 전송 실패: ${err.message}`);
    store.update(inquiry.id, { chatSendError: err.message });
    store.appendStatusLog(inquiry.id, "chat_send_failed", `Chat 전송 실패 (${err.message})`);
  }

  return store.getById(inquiry.id);
}

module.exports = { sendInquiryToTeam };
