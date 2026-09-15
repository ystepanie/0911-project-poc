// teamId → Google Chat 수신 웹훅 URL을 담은 환경변수 이름 매핑.
// 실제 URL 값은 backend/.env(git 미포함)에 채워 넣는다 — 값이 채워진 팀만 실제 전송(Live), 나머지는 Mock 유지.
// 1~2개 팀만 먼저 실 연동해보는 파일럿 방식(3.6절)과 자연스럽게 맞아떨어진다.

const WEBHOOK_ENV_KEYS = {
  1: "CHAT_WEBHOOK_ACCOUNTING", // 회계팀
  2: "CHAT_WEBHOOK_HR", // 인사팀
  3: "CHAT_WEBHOOK_IT", // IT지원팀
  4: "CHAT_WEBHOOK_GA", // 총무팀
  5: "CHAT_WEBHOOK_LEGAL", // 법무팀
};

function getWebhookUrl(teamId) {
  const key = WEBHOOK_ENV_KEYS[teamId];
  return key ? process.env[key] || null : null;
}

module.exports = { getWebhookUrl, WEBHOOK_ENV_KEYS };
