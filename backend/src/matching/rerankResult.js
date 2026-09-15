// Mock/Live 재판단기(llmReranker.js, liveLlmReranker.js)가 공유하는 결과 판정 로직.
// confidence 하나로부터 "실패 처리할지/왜 실패인지"를 정하는 기준을 한 곳에 모아서
// 두 재판단기가 각자 복붙하지 않도록 한다.

const CONFIDENCE_THRESHOLD = 0.5;

function deriveFailure(confidence) {
  const failed = confidence < CONFIDENCE_THRESHOLD;
  return { failed, failReason: failed ? "low_confidence" : null };
}

module.exports = { CONFIDENCE_THRESHOLD, deriveFailure };
