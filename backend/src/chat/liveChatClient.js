// 실제 Google Chat 수신 웹훅으로 메시지를 전송하는 클라이언트 (Phase 6 실 연동, 전송 전용).
// 수신 웹훅은 메시지 발신만 가능하고 리액션/이벤트를 받아올 수 없으므로, 완료 트리거(Phase 7)는
// 계속 Mock(`POST /api/chat/events` 단순화 페이로드)으로 처리한다 — 실 이벤트 수신은 Workspace Events API +
// Pub/Sub 구독이 필요한 별도 작업(후속 과제).

const { buildInitialMessage, buildReminderMessage } = require("./messageBuilder");
const { getWebhookUrl } = require("../teams/teamRepository");

async function postToWebhook(webhookUrl, text) {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google Chat 웹훅 전송 실패 (${res.status}): ${body}`);
  }
}

// interface ChatClient { sendMessage(team, inquiry): Promise<{ messageId, sentAt }> }
async function sendMessage(team, inquiry) {
  const webhookUrl = getWebhookUrl(team.id);
  await postToWebhook(webhookUrl, buildInitialMessage(inquiry));
  // 수신 웹훅 응답에는 메시지 ID가 없어 null로 둔다 (리액션 매칭이 필요 없는 전송 전용 구조라 문제 없음)
  return { messageId: null, sentAt: new Date().toISOString() };
}

async function sendReminder(team, inquiry) {
  const webhookUrl = getWebhookUrl(team.id);
  await postToWebhook(webhookUrl, buildReminderMessage(inquiry));
  return { messageId: null, sentAt: new Date().toISOString() };
}

// 관리자 페이지의 "테스트 전송" 버튼용 (체크리스트 12-6)
async function sendTestMessage(team) {
  const webhookUrl = getWebhookUrl(team.id);
  if (!webhookUrl) throw new Error("등록된 웹훅이 없습니다.");
  await postToWebhook(webhookUrl, `[테스트 메시지] "${team.name}" 채널 연결을 확인합니다.`);
}

module.exports = { sendMessage, sendReminder, sendTestMessage };
