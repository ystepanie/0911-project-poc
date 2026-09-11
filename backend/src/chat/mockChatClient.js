// Google Chat App 등록 전까지 쓰는 Mock 클라이언트 (체크리스트 Phase 6, 문의라우팅_백엔드_구현계획.md 5.2절).
// 실제 API를 호출하지 않고, 전송했다고 가정한 메시지를 인메모리 로그에 남기고 console에 출력한다.
// 실 연동 시 이 파일과 동일한 인터페이스(sendMessage)를 가진 LiveChatClient로 교체하면 되도록 둔다.

let seq = 0;
const log = [];

function buildMessageText(inquiry) {
  return [
    `[${inquiry.id}] ${inquiry.title}`,
    `작성자: ${inquiry.author}`,
    `문의 ID: ${inquiry.id}`,
    `완료 처리 시 이 메시지에 ✅ 리액션을 남겨주세요.`,
  ].join("\n");
}

// interface ChatClient { sendMessage(spaceId, inquiry): { messageId, sentAt } }
function sendMessage(spaceId, inquiry) {
  seq += 1;
  const messageId = `mock-msg-${seq}`;
  const sentAt = new Date().toISOString();
  const text = buildMessageText(inquiry);

  log.push({ type: "initial", messageId, spaceId, inquiryId: inquiry.id, text, sentAt });
  console.log(`[MockChatClient] → ${spaceId}\n${text}\n`);

  return { messageId, sentAt };
}

// 무응답 타임아웃 리마인드 (5.4절) — 팀장 멘션 메시지를 같은 스페이스에 추가 전송
function sendReminder(spaceId, inquiry) {
  seq += 1;
  const messageId = `mock-msg-${seq}`;
  const sentAt = new Date().toISOString();
  const text = `@팀장님 [${inquiry.id}] "${inquiry.title}" 문의가 아직 처리되지 않았습니다. 확인 부탁드립니다.`;

  log.push({ type: "reminder", messageId, spaceId, inquiryId: inquiry.id, text, sentAt });
  console.log(`[MockChatClient][reminder] → ${spaceId}\n${text}\n`);

  return { messageId, sentAt };
}

function getLog() {
  return log;
}

module.exports = { sendMessage, sendReminder, getLog };
