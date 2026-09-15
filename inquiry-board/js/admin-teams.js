// 팀 관리자 페이지 (체크리스트 Phase 12) — 조직도에서 팀을 선택해 키워드/설명/Chat 웹훅을 등록한다.

import { getOrgChart, getTeamConfig, saveTeamConfig, testTeamWebhook } from "./api.js";
import { escapeHtml } from "./inquiryStatus.js";
import { requireGatePassword } from "./adminGate.js";

requireGatePassword({
  password: "team-admin-2026", // ⚠️ 로그인(SSO) 붙기 전까지의 임시 접근 제어, 실제 보안장치가 아니다 (12-8)
  storageKey: "adminTeamsAuthed",
  gateEl: document.getElementById("password-gate"),
  appEl: document.getElementById("app"),
  passwordInputId: "password",
  submitBtnId: "password-submit",
  errorId: "password-error",
  onUnlock: loadOrgTree,
});

const treeEl = document.getElementById("org-tree");
const formPanelEl = document.getElementById("team-form-panel");
let selectedTeamId = null;

async function loadOrgTree() {
  const orgChart = await getOrgChart();
  treeEl.innerHTML = "";
  treeEl.appendChild(renderNode(orgChart));
}

function renderNode(node) {
  const wrapper = document.createElement("div");
  wrapper.className = "org-node";

  if (node.isTeam) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "org-leaf";
    item.textContent = `${node.hasConfig ? "🟢" : "⚪"} ${node.name}`;
    item.addEventListener("click", () => selectTeam(node.id, node.name));
    wrapper.appendChild(item);
    return wrapper;
  }

  const label = document.createElement("div");
  label.className = "org-group";
  label.textContent = node.name;
  wrapper.appendChild(label);

  if (node.children) {
    const childList = document.createElement("div");
    childList.className = "org-children";
    node.children.forEach((child) => childList.appendChild(renderNode(child)));
    wrapper.appendChild(childList);
  }

  return wrapper;
}

async function selectTeam(teamId, teamName) {
  selectedTeamId = teamId;
  formPanelEl.innerHTML = "불러오는 중...";

  const config = await getTeamConfig(teamId);
  renderForm(teamId, teamName, config);
}

function renderForm(teamId, teamName, config) {
  const keywords = [...config.keywords];

  formPanelEl.innerHTML = `
    <h2>${escapeHtml(teamName)}</h2>

    <label>키워드</label>
    <div class="chip-input" id="chip-input">
      <div class="chip-list" id="chip-list"></div>
      <input type="text" id="chip-text" placeholder="키워드 입력 후 Enter" />
    </div>

    <label for="description">설명 (LLM 재판단에 사용될 예정 — 지금은 Mock이라 미반영)</label>
    <textarea id="description">${escapeHtml(config.description)}</textarea>

    <label>Chat 웹훅</label>
    <p class="muted" id="webhook-preview">${config.hasWebhook ? `등록됨 (${escapeHtml(config.webhookPreview)})` : "등록 안 됨"}</p>
    <input type="text" id="webhook-input" class="hidden" placeholder="https://hooks.slack.com/services/..." />
    <button type="button" class="secondary" id="webhook-change-btn">웹훅 변경</button>
    <button type="button" class="secondary" id="test-webhook-btn" ${config.hasWebhook ? "" : "disabled"}>테스트 전송</button>

    <div>
      <button type="button" id="save-btn">저장</button>
    </div>
    <p id="save-status" class="muted"></p>
  `;

  // innerHTML을 새로 그릴 때마다 이 호출 안에서만 쓸 참조를 한 번씩만 조회해 캐싱한다
  // (매 핸들러마다 document.getElementById를 반복하지 않도록).
  const chipTextEl = document.getElementById("chip-text");
  const chipListEl = document.getElementById("chip-list");
  const webhookInputEl = document.getElementById("webhook-input");
  const descriptionEl = document.getElementById("description");
  const saveStatusEl = document.getElementById("save-status");

  renderChips(keywords);

  chipTextEl.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const value = e.target.value.trim();
    if (value && !keywords.includes(value)) {
      keywords.push(value);
      renderChips(keywords);
    }
    e.target.value = "";
  });

  function renderChips(list) {
    chipListEl.innerHTML = list
      .map(
        (kw, i) =>
          `<span class="chip">${escapeHtml(kw)}<button type="button" class="chip-remove" data-index="${i}">×</button></span>`
      )
      .join("");
    chipListEl.querySelectorAll(".chip-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        list.splice(Number(btn.dataset.index), 1);
        renderChips(list);
      });
    });
  }

  document.getElementById("webhook-change-btn").addEventListener("click", () => {
    webhookInputEl.classList.remove("hidden");
    webhookInputEl.focus();
  });

  document.getElementById("test-webhook-btn").addEventListener("click", async (e) => {
    e.target.disabled = true;
    try {
      await testTeamWebhook(teamId);
      saveStatusEl.textContent = "테스트 메시지를 전송했습니다.";
    } catch (err) {
      saveStatusEl.textContent = `테스트 전송 실패: ${err.message}`;
    } finally {
      e.target.disabled = false;
    }
  });

  document.getElementById("save-btn").addEventListener("click", async () => {
    const description = descriptionEl.value.trim();
    const webhookUrl = webhookInputEl.classList.contains("hidden") ? undefined : webhookInputEl.value.trim();

    saveStatusEl.textContent = "저장 중...";

    try {
      const updated = await saveTeamConfig(teamId, { keywords, description, webhookUrl });
      saveStatusEl.textContent = "저장했습니다.";
      renderForm(teamId, teamName, updated);
      await loadOrgTree(); // 트리의 hasConfig 표시 갱신
    } catch (err) {
      saveStatusEl.textContent = `저장 실패: ${err.message}`;
    }
  });
}
