// 문의자에게 매칭 성공/실패 결과를 이메일로 알리는 도메인 로직 (체크리스트 9-2, 9-3).
// POST /api/inquiries(자동 매칭)와 POST /api/admin/inquiries/:id/assign-team(수동 배정)에서 재사용 가능하도록
// mockEmailClient(범용 발송 클라이언트)와 분리해둔다.

const emailClient = require("./mockEmailClient");

function notifyMatchSuccess(inquiry) {
  const subject = `[문의 ${inquiry.id}] "${inquiry.title}"가 ${inquiry.matchedTeam}으로 전달되었습니다`;
  const body = [
    `${inquiry.author}님, 문의하신 내용이 ${inquiry.matchedTeam}으로 전달되었습니다.`,
    `문의 ID: ${inquiry.id}`,
    `해당 팀에서 확인 후 처리해드릴 예정입니다.`,
  ].join("\n");

  return emailClient.sendEmail(inquiry.contact, subject, body);
}

function notifyMatchFailure(inquiry) {
  const subject = `[문의 ${inquiry.id}] "${inquiry.title}" 접수 확인`;
  const body = [
    `${inquiry.author}님, 문의를 접수했습니다.`,
    `문의 ID: ${inquiry.id}`,
    `관련 팀을 자동으로 찾지 못해 담당자가 확인 중입니다. 확인 후 다시 안내드리겠습니다.`,
  ].join("\n");

  return emailClient.sendEmail(inquiry.contact, subject, body);
}

module.exports = { notifyMatchSuccess, notifyMatchFailure };
