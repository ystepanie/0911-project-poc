import { submitInquiry, completeInquiry, resolveUploadUrl } from "./api.js";
import { renderAttachmentHtml, escapeHtml } from "./inquiryStatus.js";

const form = document.getElementById("inquiry-form");
const resultBox = document.getElementById("result");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const author = document.getElementById("author").value.trim();
  const contact = document.getElementById("contact").value.trim();
  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  const imageFile = document.getElementById("image").files[0] || null;

  if (!author || !contact || !title || !content) {
    return;
  }

  const submitBtn = form.querySelector("button[type=submit]");
  submitBtn.disabled = true;

  try {
    const inquiry = await submitInquiry({ author, contact, title, content, imageFile });
    localStorage.setItem("myContact", contact);
    renderResult(inquiry);
    form.reset();
  } finally {
    submitBtn.disabled = false;
  }
});

function renderResult(inquiry) {
  resultBox.classList.remove("hidden", "success", "fail");

  const attachmentHtml = renderAttachmentHtml(resolveUploadUrl(inquiry.imageUrl));

  if (inquiry.matchFailed) {
    resultBox.classList.add("fail");
    const reasonText =
      inquiry.failReason === "no_candidate"
        ? "관련 팀을 자동으로 찾지 못했습니다."
        : `가장 가까운 팀(추정: ${escapeHtml(inquiry.matchedTeam)})은 찾았지만 확신도가 낮습니다.`;
    resultBox.innerHTML = `
      <p><strong>문의 ID: ${escapeHtml(inquiry.id)}</strong></p>
      <p>${reasonText} 담당자가 확인 후 다시 안내드리겠습니다.</p>
      ${attachmentHtml}
    `;
    return;
  }

  resultBox.classList.add("success");
  resultBox.innerHTML = `
    <p><strong>문의 ID: ${escapeHtml(inquiry.id)}</strong></p>
    <p>문의가 <span class="team">${escapeHtml(inquiry.matchedTeam)}</span>(으)로 전달되었습니다. (매칭 신뢰도: ${(inquiry.matchConfidence * 100).toFixed(0)}%)</p>
    <p class="muted">Google Chat 전송 완료로 처리되었습니다. (mock)</p>
    ${attachmentHtml}
    <button type="button" id="complete-btn">완료 처리 시뮬레이션</button>
  `;

  document.getElementById("complete-btn").addEventListener("click", async (ev) => {
    ev.target.disabled = true;
    await completeInquiry(inquiry.id);
    ev.target.outerHTML =
      '<p class="muted">완료 처리되었습니다. 관리자가 설문 발송을 확정하면 다음 접속 시 만족도 조사가 안내됩니다.</p>';
  });
}
