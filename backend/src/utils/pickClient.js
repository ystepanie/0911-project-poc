// live/mock 자동 분기 레지스트리 공용 팩토리.
// "조건이 참이면 live, 아니면 mock을 쓴다"는 동일한 패턴이
// matching/rerankerRegistry.js(ANTHROPIC_API_KEY 유무)와 chat/chatClientRegistry.js(팀별 웹훅 유무)에서
// 반복돼 하나로 묶는다. isLiveAvailable에는 호출 시 인자(예: teamId)가 그대로 전달된다.
function createRegistry(isLiveAvailable, liveClient, mockClient) {
  return (...args) => (isLiveAvailable(...args) ? liveClient : mockClient);
}

module.exports = { createRegistry };
