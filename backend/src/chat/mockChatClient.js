// Google Chat 웹훅이 설정되지 않은 팀(체크리스트 부록 참고)에 쓰는 Mock 클라이언트.
// 실제 API를 호출하지 않고, 전송했다고 가정한 메시지를 인메모리 로그에 남기고 console에 출력한다.
// liveChatClient.js와 동일한 인터페이스(sendMessage/sendReminder(team, inquiry))를 유지한다.

const { buildInitialMessage, buildReminderMessage } = require("./messageBuilder");

let seq = 0;
const log = [];

// interface ChatClient { sendMessage(team, inquiry): Promise<{ messageId, sentAt }> }
async function sendMessage(team, inquiry) {
  seq += 1;
  const messageId = `mock-msg-${seq}`;
  const sentAt = new Date().toISOString();
  const text = buildInitialMessage(inquiry);

  log.push({ type: "initial", messageId, team: team.name, inquiryId: inquiry.id, text, sentAt });
  console.log(`[MockChatClient] → ${team.name}\n${text}\n`);

  return { messageId, sentAt };
}

// 무응답 타임아웃 리마인드 (5.4절) — 팀장 멘션 메시지를 같은 스페이스에 추가 전송
async function sendReminder(team, inquiry) {
  seq += 1;
  const messageId = `mock-msg-${seq}`;
  const sentAt = new Date().toISOString();
  const text = buildReminderMessage(inquiry);

  log.push({ type: "reminder", messageId, team: team.name, inquiryId: inquiry.id, text, sentAt });
  console.log(`[MockChatClient][reminder] → ${team.name}\n${text}\n`);

  return { messageId, sentAt };
}

function getLog() {
  return log;
}

module.exports = { sendMessage, sendReminder, getLog };
