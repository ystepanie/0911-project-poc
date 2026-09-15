// Chat 메시지 문구 조립 — Mock/Live 클라이언트가 동일한 문구를 쓰도록 공용으로 분리 (문의라우팅_백엔드_구현계획.md 5.2절)

const CONTENT_PREVIEW_LIMIT = 200; // 이보다 길면 Chat 가독성을 위해 잘라낸다 (전체 내용은 문의 ID로 다시 조회 가능)

function previewContent(content) {
  if (content.length <= CONTENT_PREVIEW_LIMIT) return content;
  return `${content.slice(0, CONTENT_PREVIEW_LIMIT)}… (문의 ID로 전체 내용 확인 가능)`;
}

function buildInitialMessage(inquiry) {
  const lines = [
    `[${inquiry.id}] ${inquiry.title}`,
    `작성자: ${inquiry.author}`,
    `문의 ID: ${inquiry.id}`,
    `내용: ${previewContent(inquiry.content)}`,
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
