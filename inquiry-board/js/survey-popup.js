// 게시판 접속 시 "설문 발송이 확정됐고 아직 응답하지 않은" 내 문의가 있으면 팝업(모달)으로 노출
// 식별자는 로그인(SSO) 연동 전까지 문의 작성 시 입력한 연락처(myContact)를 임시로 사용 (5.5절)

import { getPendingSurvey, submitSurvey } from "./api.js";

const modal = document.getElementById("survey-modal");
const form = document.getElementById("survey-modal-form");
const summaryEl = document.getElementById("survey-modal-summary");

export async function checkAndShowSurveyPopup() {
  const contact = localStorage.getItem("myContact");
  if (!contact) return;

  const inquiry = await getPendingSurvey(contact);
  if (!inquiry) return;

  summaryEl.textContent = `문의 ID: ${inquiry.id} · 제목: ${inquiry.title}`;
  form.dataset.inquiryId = inquiry.id;
  modal.classList.remove("hidden");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const inquiryId = form.dataset.inquiryId;
  const satisfaction = Number(form.satisfaction.value);
  const matchCorrect = form.matchCorrect.value === "yes";
  const comment = document.getElementById("survey-modal-comment").value.trim();

  const submitBtn = form.querySelector("button[type=submit]");
  submitBtn.disabled = true;

  await submitSurvey(inquiryId, { satisfaction, matchCorrect, comment });

  modal.classList.add("hidden");
  form.reset();
  submitBtn.disabled = false;
});
