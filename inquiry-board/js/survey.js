import { getInquiry } from "./api.js";
import { bindSurveyForm } from "./surveyForm.js";

const params = new URLSearchParams(window.location.search);
const inquiryId = params.get("id");

const summaryEl = document.getElementById("inquiry-summary");
const form = document.getElementById("survey-form");
const resultBox = document.getElementById("result");

init();

async function init() {
  if (!inquiryId) {
    summaryEl.textContent = "문의 ID가 없습니다. 링크를 다시 확인해주세요.";
    form.classList.add("hidden");
    return;
  }

  const inquiry = await getInquiry(inquiryId);
  if (!inquiry) {
    summaryEl.textContent = `문의 ID(${inquiryId})를 찾을 수 없습니다.`;
    form.classList.add("hidden");
    return;
  }

  summaryEl.textContent = `문의 ID: ${inquiry.id} · 제목: ${inquiry.title}`;
}

bindSurveyForm(form, "comment", () => inquiryId, () => {
  form.classList.add("hidden");
  resultBox.classList.remove("hidden");
});
