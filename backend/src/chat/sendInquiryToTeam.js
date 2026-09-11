// 매칭 성공(자동 또는 관리자 수동 배정) 시 팀 스페이스로 Chat 메시지를 보내는 공용 로직.
// POST /api/inquiries(자동 매칭 성공)와 POST /api/admin/inquiries/:id/assign-team(수동 배정) 양쪽에서 재사용한다.

const teams = require("../matching/teams-seed.json");
const chatClient = require("./mockChatClient");

function sendInquiryToTeam(inquiry, teamId) {
  const team = teams.find((t) => t.id === teamId);
  const { messageId, sentAt } = chatClient.sendMessage(team.chatSpaceId, inquiry);
  return { chatMessageId: messageId, chatSentAt: sentAt };
}

module.exports = { sendInquiryToTeam };
