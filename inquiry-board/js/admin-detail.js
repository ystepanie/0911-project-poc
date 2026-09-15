// Chat 메시지의 "상세 확인 및 완료 처리" 링크가 여는 페이지 (체크리스트 Phase 6-5).
// ✅ 리액션 대신, 이 페이지에서 전체 내용/이미지를 보고 완료 처리 버튼을 누르는 방식으로 완료 트리거를 대체한다.

import { getInquiryByToken, completeInquiry, resolveUploadUrl } from "./api.js";

const detailEl = document.getElementById("detail");
const params = new URLSearchParams(window.location.search);
const token = params.get("token");

init();

async function init() {
  if (!token) {
    detailEl.textContent = "링크가 올바르지 않습니다. Chat 메시지의 링크를 다시 확인해주세요.";
    return;
  }
  await render();
}

async function render() {
  let inquiry;
  try {
    inquiry = await getInquiryByToken(token);
  } catch (err) {
    detailEl.textContent = `문의를 불러오지 못했습니다: ${err.message}`;
    return;
  }

  const imageUrl = resolveUploadUrl(inquiry.imageUrl);
  const imageHtml = imageUrl
    ? `<p><a href="${imageUrl}" target="_blank" rel="noopener"><img src="${imageUrl}" alt="첨부 이미지" style="max-width:100%;border-radius:4px;" /></a></p>`
    : "";

  const statusHtml = inquiry.completedAt
    ? `<p class="muted">완료 처리됨 (${new Date(inquiry.completedAt).toLocaleString()}, 처리자: ${inquiry.completedBy ?? "-"})</p>`
    : `<button type="button" id="complete-btn">완료 처리</button>`;

  detailEl.innerHTML = `
    <p><strong>문의 ID:</strong> ${inquiry.id}</p>
    <p><strong>작성자:</strong> ${inquiry.author} (${inquiry.contact})</p>
    <p><strong>제목:</strong> ${inquiry.title}</p>
    <p><strong>내용:</strong><br/>${inquiry.content.replace(/\n/g, "<br/>")}</p>
    ${imageHtml}
    <p><strong>매칭 팀:</strong> ${inquiry.matchedTeam ?? "-"} (신뢰도 ${(inquiry.matchConfidence * 100).toFixed(0)}%)</p>
    ${statusHtml}
  `;

  const completeBtn = document.getElementById("complete-btn");
  if (completeBtn) {
    completeBtn.addEventListener("click", async () => {
      completeBtn.disabled = true;
      await completeInquiry(inquiry.id);
      await render();
    });
  }
}
