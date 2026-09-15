// survey.js(단독 페이지)/survey-popup.js(팝업 모달)가 공유하는 설문 제출 로직.
// 폼에서 satisfaction/matchCorrect/comment를 읽어 submitSurvey를 호출하는 부분만 뽑아내고,
// 제출 후 UI 처리(폼 숨기기 vs 모달 닫기)는 다르므로 onSubmitted 콜백으로 호출부에 맡긴다.

import { submitSurvey } from "./api.js";

export function bindSurveyForm(form, commentInputId, getInquiryId, onSubmitted) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const inquiryId = getInquiryId();
    const satisfaction = Number(form.satisfaction.value);
    const matchCorrect = form.matchCorrect.value === "yes";
    const comment = document.getElementById(commentInputId).value.trim();

    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;

    await submitSurvey(inquiryId, { satisfaction, matchCorrect, comment });

    onSubmitted(submitBtn);
  });
}
