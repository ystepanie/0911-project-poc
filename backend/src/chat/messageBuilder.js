// Chat 메시지 문구 조립 — Mock/Live 클라이언트가 동일한 문구를 쓰도록 공용으로 분리 (문의라우팅_백엔드_구현계획.md 5.2절)

function buildInitialMessage(inquiry) {
  const lines = [
    `[${inquiry.id}] ${inquiry.title}`,
    `작성자: ${inquiry.author}`,
    `문의 ID: ${inquiry.id}`,
  ];
  if (inquiry.imageUrl) {
    lines.push(`첨부 이미지: ${inquiry.imageUrl}`); // Phase 11: 매칭에는 안 쓰지만 Chat 메시지에는 링크로 노출
  }
  lines.push(`완료 처리 시 이 메시지에 ✅ 리액션을 남겨주세요.`);
  return lines.join("\n");
}

function buildReminderMessage(inquiry) {
  return `@팀장님 [${inquiry.id}] "${inquiry.title}" 문의가 아직 처리되지 않았습니다. 확인 부탁드립니다.`;
}

module.exports = { buildInitialMessage, buildReminderMessage };
