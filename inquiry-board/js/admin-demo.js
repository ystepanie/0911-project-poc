// 정식 관리자 페이지가 아직 없어, 흐름 검증용으로 문의 작성 화면 하단에 두는 임시 데모 섹션.
// 3-1: 완료됐지만 설문 미발송인 건 → "설문 발송 확정" 버튼
// 3-2: 매칭 실패(미배정) 건 → 팀 수동 배정 버튼

import { listSurveyPending, listUnassigned, markSurveyReady, assignTeam, getTeams } from "./api.js";

const surveyPendingEl = document.getElementById("admin-survey-pending");
const unassignedEl = document.getElementById("admin-unassigned");

// 백엔드가 내려주는 실패 사유 코드(영문)를 관리자 화면에는 한글로 표시 (5.6절 recall/precision 구분 유지)
const FAIL_REASON_LABELS = {
  no_candidate: "관련 팀 없음",
  low_confidence: "확신도 낮음",
};

function labelFailReason(code) {
  return FAIL_REASON_LABELS[code] || code;
}

export async function refreshAdminDemo() {
  await renderSurveyPending();
  await renderUnassigned();
}

async function renderSurveyPending() {
  const items = await listSurveyPending();

  if (items.length === 0) {
    surveyPendingEl.innerHTML = '<p class="muted">완료됐지만 설문 미발송인 건이 없습니다.</p>';
    return;
  }

  surveyPendingEl.innerHTML = items
    .map(
      (item) => `
        <div class="admin-row" data-id="${item.id}">
          <span>${item.id} · ${item.title} (완료: ${new Date(item.completedAt).toLocaleString()})</span>
          <button type="button" class="ready-btn" data-id="${item.id}">설문 발송 확정</button>
        </div>
      `
    )
    .join("");

  surveyPendingEl.querySelectorAll(".ready-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      await markSurveyReady(btn.dataset.id);
      await renderSurveyPending();
    });
  });
}

async function renderUnassigned() {
  const items = await listUnassigned();

  if (items.length === 0) {
    unassignedEl.innerHTML = '<p class="muted">매칭 실패(미배정) 건이 없습니다.</p>';
    return;
  }

  const teams = await getTeams();
  const teamOptions = teams.map((t) => `<option value="${t.id}">${t.name}</option>`).join("");

  unassignedEl.innerHTML = items
    .map((item) => {
      const reasonDetail = item.matchReason ? ` — ${item.matchReason}` : "";
      return `
        <div class="admin-row" data-id="${item.id}">
          <span>${item.id} · ${item.title} (사유: ${labelFailReason(item.failReason)}${reasonDetail})</span>
          <select class="team-select" data-id="${item.id}">
            <option value="">팀 선택</option>
            ${teamOptions}
          </select>
          <button type="button" class="assign-btn" data-id="${item.id}">배정</button>
        </div>
      `;
    })
    .join("");

  unassignedEl.querySelectorAll(".assign-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const select = unassignedEl.querySelector(`.team-select[data-id="${btn.dataset.id}"]`);
      if (!select.value) return;
      btn.disabled = true;
      await assignTeam(btn.dataset.id, Number(select.value));
      await renderUnassigned();
    });
  });
}
