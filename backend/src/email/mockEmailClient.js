// Gmail API 연동 전까지 쓰는 Mock 이메일 클라이언트 (체크리스트 Phase 9).
// 실제 API를 호출하지 않고, 발송했다고 가정한 메일을 인메모리 로그에 남기고 console에 출력한다.
// 실 연동 시 이 파일과 동일한 인터페이스(sendEmail)를 가진 LiveEmailClient(Gmail API)로 교체하면 되도록 둔다.
// 실 연동은 Google Chat App(Phase 6)과 마찬가지로 사내 Workspace 관리자의 OAuth/서비스 계정 승인이 필요하다.

const { createMockLog } = require("../utils/mockLog");

const mockLog = createMockLog("mock-mail");

// interface EmailClient { sendEmail(to, subject, body): { messageId, sentAt } }
function sendEmail(to, subject, body) {
  const { messageId, sentAt } = mockLog.record({ to, subject, body });

  console.log(`[MockEmailClient] → ${to}\n제목: ${subject}\n${body}\n`);

  return { messageId, sentAt };
}

function getLog() {
  return mockLog.getLog();
}

module.exports = { sendEmail, getLog };
