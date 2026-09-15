// 매칭 성공(자동 또는 관리자 수동 배정) 시 팀 스페이스로 Chat 메시지를 보내는 공용 로직.
// POST /api/inquiries(자동 매칭 성공)와 POST /api/admin/inquiries/:id/assign-team(수동 배정) 양쪽에서 재사용한다.
// 팀별로 웹훅이 설정돼 있으면 실제 Google Chat으로, 없으면 Mock으로 전송한다 (chatClientRegistry 참고).

const teams = require("../matching/teams-seed.json");
const { getChatClient } = require("./chatClientRegistry");

async function sendInquiryToTeam(inquiry, teamId) {
  const team = teams.find((t) => t.id === teamId);
  const chatClient = getChatClient(teamId);
  const { messageId, sentAt } = await chatClient.sendMessage(team, inquiry);
  return { chatMessageId: messageId, chatSentAt: sentAt };
}

module.exports = { sendInquiryToTeam };
