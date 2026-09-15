// 문의자가 본인이 제출한 문의를 확인하는 목록 화면 (관리자 데모 섹션을 대체).
// 로그인 전까지는 본인 확인 수단이 없어, 고정된 데모 사용자 한 명(DEMO_CONTACT)의 이메일로만 조회한다.
// 실제 로그인(SSO) 연동 시 이 상수 대신 로그인 세션의 이메일을 쓰면 된다.

import { listMyInquiries } from "./api.js";
import { summaryLabel } from "./inquiryStatus.js";

const DEMO_CONTACT = "demo-user@example.com";

document.getElementById("demo-contact-label").textContent = DEMO_CONTACT;

const listEl = document.getElementById("list");

async function init() {
  const items = await listMyInquiries(DEMO_CONTACT);

  if (items.length === 0) {
    listEl.innerHTML = `<p class="muted">"${DEMO_CONTACT}"로 제출한 문의가 없습니다.</p>`;
    return;
  }

  listEl.innerHTML = items
    .map(
      (item) => `
        <a class="list-row" href="my-inquiry-detail.html?token=${encodeURIComponent(item.accessToken)}">
          <span class="list-row-title">${item.id} · ${item.title}</span>
          <p class="muted">${summaryLabel(item)} · ${new Date(item.createdAt).toLocaleString()}</p>
        </a>
      `
    )
    .join("");
}

init();
