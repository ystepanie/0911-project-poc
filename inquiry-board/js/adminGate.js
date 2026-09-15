// 공유 비밀번호 기반 임시 접근 게이트 — 로그인(SSO) 붙기 전까지의 최소 진입장벽.
// ⚠️ 비밀번호가 소스에 그대로 노출되므로 실제 보안장치가 아니다 (12-8).
// admin-teams.html에서 쓰던 로직을 뽑아, 관리자 페이지가 늘어나도 게이트를 새로 짜지 않게 한다.

export function requireGatePassword({
  password,
  storageKey,
  gateEl,
  appEl,
  passwordInputId,
  submitBtnId,
  errorId,
  onUnlock,
}) {
  const passwordInput = document.getElementById(passwordInputId);
  const passwordError = document.getElementById(errorId);

  function unlock() {
    gateEl.classList.add("hidden");
    appEl.classList.remove("hidden");
    onUnlock();
  }

  function checkPassword() {
    if (passwordInput.value === password) {
      sessionStorage.setItem(storageKey, "1");
      unlock();
    } else {
      passwordError.classList.remove("hidden");
    }
  }

  document.getElementById(submitBtnId).addEventListener("click", checkPassword);
  passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") checkPassword();
  });

  if (sessionStorage.getItem(storageKey) === "1") {
    unlock();
  }
}
