// 문의자가 본인 문의 상세를 확인하는 읽기 전용 화면 (관리자 데모 섹션을 대체).
// admin-detail.html과 달리 완료 처리 등 액션 버튼은 없다 — 그건 팀(Chat 링크)이 하는 일이고,
// 여기서는 매칭/처리/설문 상태를 조회만 한다.

import { getInquiryByToken, resolveUploadUrl } from "./api.js";
import { statusDetails, renderStatusLogHtml, renderAttachmentHtml, escapeHtml } from "./inquiryStatus.js";

const detailEl = document.getElementById("detail");
const params = new URLSearchParams(window.location.search);
const token = params.get("token");

async function init() {
  if (!token) {
    detailEl.textContent = "링크가 올바르지 않습니다.";
    return;
  }

  let inquiry;
  try {
    inquiry = await getInquiryByToken(token);
  } catch (err) {
    detailEl.textContent = `문의를 불러오지 못했습니다: ${err.message}`;
    return;
  }

  const imageHtml = renderAttachmentHtml(resolveUploadUrl(inquiry.imageUrl));

  const statusHtml = statusDetails(inquiry)
    .map((line) => `<p class="status-line">${line}</p>`)
    .join("");

  detailEl.innerHTML = `
    <p><strong>문의 ID:</strong> ${escapeHtml(inquiry.id)}</p>
    <p><strong>제목:</strong> ${escapeHtml(inquiry.title)}</p>
    <p><strong>내용:</strong><br/>${escapeHtml(inquiry.content).replace(/\n/g, "<br/>")}</p>
    ${imageHtml}
    <hr />
    ${statusHtml}
    <h2>처리 이력</h2>
    ${renderStatusLogHtml(inquiry)}
  `;
}

init();
