// Chat 메시지의 "상세 확인 및 완료 처리" 링크가 여는 페이지 (체크리스트 Phase 6-5).
// ✅ 리액션 대신, 이 페이지에서 전체 내용/이미지를 보고 완료 처리 버튼을 누르는 방식으로 완료 트리거를 대체한다.

import {
  getInquiryByToken,
  completeInquiry,
  resolveUploadUrl,
  getTeamMembers,
  assignInquiryOwner,
  cancelInquiry,
  CANCEL_REASON_OPTIONS,
} from "./api.js";
import { renderStatusLogHtml, renderAttachmentHtml, escapeHtml } from "./inquiryStatus.js";

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

  // 완료/취소는 상호 배타적인 최종 상태 — 취소된 건은 안내만, 완료된 건도 안내만, 그 외에만 액션 버튼을 보여준다.
  let statusHtml;
  if (inquiry.cancelledAt) {
    const reasonLabel =
      CANCEL_REASON_OPTIONS.find((o) => o.value === inquiry.cancelReason)?.label || inquiry.cancelReason;
    statusHtml = `<p class="muted">취소됨 (${new Date(inquiry.cancelledAt).toLocaleString()}, 사유: ${escapeHtml(reasonLabel)}${
      inquiry.cancelDetail ? ` - ${escapeHtml(inquiry.cancelDetail)}` : ""
    })</p>`;
  } else if (inquiry.completedAt) {
    statusHtml = `<p class="muted">완료 처리됨 (${new Date(inquiry.completedAt).toLocaleString()}, 처리자: ${escapeHtml(inquiry.completedBy) || "-"})</p>`;
  } else {
    const cancelOptions = CANCEL_REASON_OPTIONS.map(
      (o) => `<option value="${o.value}">${escapeHtml(o.label)}</option>`
    ).join("");
    statusHtml = `
      <button type="button" id="complete-btn">완료 처리</button>
      <button type="button" class="secondary" id="cancel-toggle-btn">취소</button>
      <div class="cancel-box hidden" id="cancel-box">
        <label for="cancel-category">취소 사유</label>
        <select id="cancel-category">
          <option value="">사유 선택</option>
          ${cancelOptions}
        </select>
        <label for="cancel-detail">상세 내용</label>
        <textarea id="cancel-detail" placeholder="취소 사유를 구체적으로 입력해주세요"></textarea>
        <button type="button" id="cancel-submit-btn">취소 확정</button>
        <p id="cancel-status" class="muted"></p>
      </div>
    `;
  }

  const reasonHtml = inquiry.matchReason
    ? `<p class="muted"><strong>매칭 판단 근거:</strong> ${escapeHtml(inquiry.matchReason)}</p>`
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
      ? `<p class="muted">현재 담당자: <strong>${escapeHtml(inquiry.assigneeName)}</strong> (${new Date(inquiry.assigneeAssignedAt).toLocaleString()} 지정)</p>`
      : `<p class="muted">현재 담당자: 미지정</p>`;

    // 취소된 문의는 담당자 재지정을 막고(백엔드도 409로 거부) 현재 담당자 표시만 남긴다.
    if (inquiry.cancelledAt) {
      assigneeHtml = `<div class="assignee-box">${currentLine}</div>`;
    } else {
      const options = members
        .map(
          (m) =>
            `<option value="${escapeHtml(m.id)}" ${m.id === inquiry.assigneeId ? "selected" : ""}>${escapeHtml(m.name)} (${escapeHtml(m.email)})</option>`
        )
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
  }

  detailEl.innerHTML = `
    <p><strong>문의 ID:</strong> ${escapeHtml(inquiry.id)}</p>
    <p><strong>작성자:</strong> ${escapeHtml(inquiry.author)} (${escapeHtml(inquiry.contact)})</p>
    <p><strong>제목:</strong> ${escapeHtml(inquiry.title)}</p>
    <p><strong>내용:</strong><br/>${escapeHtml(inquiry.content).replace(/\n/g, "<br/>")}</p>
    ${imageHtml}
    <p><strong>매칭 팀:</strong> ${escapeHtml(inquiry.matchedTeam) || "-"} (신뢰도 ${(inquiry.matchConfidence * 100).toFixed(0)}%)</p>
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

  const cancelToggleBtn = document.getElementById("cancel-toggle-btn");
  if (cancelToggleBtn) {
    cancelToggleBtn.addEventListener("click", () => {
      document.getElementById("cancel-box").classList.remove("hidden");
      cancelToggleBtn.disabled = true;
    });
  }

  const cancelSubmitBtn = document.getElementById("cancel-submit-btn");
  if (cancelSubmitBtn) {
    cancelSubmitBtn.addEventListener("click", async () => {
      const category = document.getElementById("cancel-category").value;
      const detail = document.getElementById("cancel-detail").value.trim();
      const cancelStatusEl = document.getElementById("cancel-status");

      if (!category) {
        cancelStatusEl.textContent = "취소 사유를 선택해주세요.";
        return;
      }

      cancelSubmitBtn.disabled = true;
      cancelStatusEl.textContent = "취소 처리 중...";
      try {
        await cancelInquiry(inquiry.id, { category, detail });
        await render();
      } catch (err) {
        cancelStatusEl.textContent = `취소 처리 실패: ${err.message}`;
        cancelSubmitBtn.disabled = false;
      }
    });
  }
}
