// ANTHROPIC_API_KEY가 .env에 있으면 LiveLlmReranker, 없으면 MockLlmReranker를 쓴다.
// 팀별 Chat 웹훅을 .env 유무로 자동 분기하던 것(chatClientRegistry.js)과 동일한 패턴.

const mockLlmReranker = require("./llmReranker");
const liveLlmReranker = require("./liveLlmReranker");

function getReranker() {
  return process.env.ANTHROPIC_API_KEY ? liveLlmReranker : mockLlmReranker;
}

module.exports = { getReranker };
