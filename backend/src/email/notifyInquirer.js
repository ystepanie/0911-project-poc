// 문의자에게 이메일로 알리는 도메인 로직.
// 문의 제출 직후 결과(성공/실패)는 웹페이지 응답으로 바로 보여주므로 이 시점엔 메일을 보내지 않는다.
// 매칭 실패 건을 관리자가 수동으로 배정해 해결했을 때만 발송한다 (routes/admin.js assign-team).

const emailClient = require("./mockEmailClient");

function notifyTeamAssigned(inquiry) {
  const subject = `[문의 ${inquiry.id}] "${inquiry.title}"가 ${inquiry.matchedTeam}으로 전달되었습니다`;
  const body = [
    `${inquiry.author}님, 문의하신 내용이 ${inquiry.matchedTeam}으로 전달되었습니다.`,
    `문의 ID: ${inquiry.id}`,
    `해당 팀에서 확인 후 처리해드릴 예정입니다.`,
  ].join("\n");

  return emailClient.sendEmail(inquiry.contact, subject, body);
}

module.exports = { notifyTeamAssigned };
