import { submitInquiry, resolveUploadUrl } from "./api.js";
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
  } catch (err) {
    resultBox.classList.remove("hidden", "success");
    resultBox.classList.add("fail");
    resultBox.textContent = `문의를 등록하지 못했습니다. ${err.message}`;
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
        : "담당 팀을 선택하기 어려웠습니다.";
    resultBox.innerHTML = `
      <p><strong>문의 ID: ${escapeHtml(inquiry.id)}</strong></p>
      <p>${reasonText} 미배정 건으로 기록되었습니다. 팀 알림은 보내지 않았습니다.</p>
      ${attachmentHtml}
    `;
    return;
  }

  const notificationFailed = Boolean(inquiry.chatSendError);
  const notificationSent = Boolean(inquiry.chatSentAt);
  const isMock = typeof inquiry.chatMessageId === "string" && inquiry.chatMessageId.startsWith("mock-msg-");
  const deliveryText = notificationFailed
    ? "팀 알림 전송에 실패했습니다. 문의 접수와 팀 배정은 유지되며, 알림은 자동으로 재전송되지 않습니다."
    : notificationSent
      ? isMock ? "팀 알림을 가상으로 처리했습니다. 실제 채팅 메시지는 보내지 않았습니다." : "팀 알림을 전송했습니다."
      : "팀 알림은 아직 전송되지 않았습니다.";
  resultBox.classList.add(notificationFailed ? "fail" : "success");
  resultBox.innerHTML = `
    <p><strong>문의 ID: ${escapeHtml(inquiry.id)}</strong></p>
    <p>문의가 접수되어 <span class="team">${escapeHtml(inquiry.matchedTeam)}</span>(으)로 배정되었습니다. (매칭 신뢰도: ${(inquiry.matchConfidence * 100).toFixed(0)}%)</p>
    <p class="muted">${deliveryText}</p>
    ${attachmentHtml}
  `;
}
