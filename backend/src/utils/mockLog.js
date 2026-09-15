// Mock 클라이언트(mockChatClient.js, mockEmailClient.js)가 각자 구현하던
// "seq 증가 + 메시지ID 생성 + 로그 배열에 push + getLog()" 패턴을 하나로 묶는다.

const { nowIso } = require("./time");

function createMockLog(idPrefix) {
  let seq = 0;
  const log = [];

  // entry에 없는 messageId/sentAt을 채워 넣고 로그에 남긴 뒤, 호출부가 반환값으로 쓸 수 있게 그대로 돌려준다.
  function record(entry) {
    seq += 1;
    const full = { messageId: `${idPrefix}-${seq}`, sentAt: nowIso(), ...entry };
    log.push(full);
    return full;
  }

  function getLog() {
    return log;
  }

  return { record, getLog };
}

module.exports = { createMockLog };
