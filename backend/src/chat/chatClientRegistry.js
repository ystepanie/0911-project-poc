// teamId에 웹훅이 설정돼 있으면 liveChatClient, 없으면 mockChatClient를 골라준다.
// 팀별로 섞어 쓸 수 있어(파일럿 팀만 실 연동), 3.6절 소프트 런칭 방식과 자연스럽게 맞는다.

const mockChatClient = require("./mockChatClient");
const liveChatClient = require("./liveChatClient");
const { getWebhookUrl } = require("./webhookConfig");

function getChatClient(teamId) {
  return getWebhookUrl(teamId) ? liveChatClient : mockChatClient;
}

module.exports = { getChatClient };
