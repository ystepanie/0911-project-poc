// Chat 메시지의 "상세 확인 및 완료 처리" 링크가 여는 페이지 (체크리스트 Phase 6-5).
// ✅ 리액션 대신, 이 페이지에서 전체 내용/이미지를 보고 완료 처리 버튼을 누르는 방식으로 완료 트리거를 대체한다.

import { getInquiryByToken, completeInquiry, resolveUploadUrl, getTeamMembers, assignInquiryOwner } from "./api.js";
import { renderStatusLogHtml, renderAttachmentHtml } from "./inquiryStatus.js";

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

  const imageHtml = renderAttachmentHtml(resolveUploadUrl(inquiry.imageUrl));

  const statusHtml = inquiry.completedAt
    ? `<p class="muted">완료 처리됨 (${new Date(inquiry.completedAt).toLocaleString()}, 처리자: ${inquiry.completedBy ?? "-"})</p>`
    : `<button type="button" id="complete-btn">완료 처리</button>`;

  const reasonHtml = inquiry.matchReason
    ? `<p class="muted"><strong>매칭 판단 근거:</strong> ${inquiry.matchReason}</p>`
    : "";

  // 담당자 배정 UI — 매칭된 팀이 있을 때만 노출, 완료 처리와 순서 무관하게 언제든 지정 가능
  let assigneeHtml = "";
  let members = [];
  if (!inquiry.matchFailed && inquiry.matchedTeamId) {
    try {
      members = await getTeamMembers(inquiry.matchedTeamId);
    } catch (err) {
      members = [];
    }
    const currentLine = inquiry.assigneeName
      ? `<p class="muted">현재 담당자: <strong>${inquiry.assigneeName}</strong> (${new Date(inquiry.assigneeAssignedAt).toLocaleString()} 지정)</p>`
      : `<p class="muted">현재 담당자: 미지정</p>`;
    const options = members
      .map((m) => `<option value="${m.id}" ${m.id === inquiry.assigneeId ? "selected" : ""}>${m.name} (${m.email})</option>`)
      .join("");
    assigneeHtml = `
      <div class="assignee-box">
        ${currentLine}
        <select id="assignee-select">
          <option value="">담당자 선택</option>
          ${options}
        </select>
        <button type="button" id="assign-btn">담당자 지정</button>
      </div>
    `;
  }

  detailEl.innerHTML = `
    <p><strong>문의 ID:</strong> ${inquiry.id}</p>
    <p><strong>작성자:</strong> ${inquiry.author} (${inquiry.contact})</p>
    <p><strong>제목:</strong> ${inquiry.title}</p>
    <p><strong>내용:</strong><br/>${inquiry.content.replace(/\n/g, "<br/>")}</p>
    ${imageHtml}
    <p><strong>매칭 팀:</strong> ${inquiry.matchedTeam ?? "-"} (신뢰도 ${(inquiry.matchConfidence * 100).toFixed(0)}%)</p>
    ${reasonHtml}
    ${assigneeHtml}
    ${statusHtml}
    <h2>처리 이력</h2>
    ${renderStatusLogHtml(inquiry)}
  `;

  const completeBtn = document.getElementById("complete-btn");
  if (completeBtn) {
    completeBtn.addEventListener("click", async () => {
      completeBtn.disabled = true;
      await completeInquiry(inquiry.id);
      await render();
    });
  }

  const assignBtn = document.getElementById("assign-btn");
  if (assignBtn) {
    assignBtn.addEventListener("click", async () => {
      const select = document.getElementById("assignee-select");
      if (!select.value) return;
      assignBtn.disabled = true;
      await assignInquiryOwner(inquiry.id, select.value);
      await render();
    });
  }
}
