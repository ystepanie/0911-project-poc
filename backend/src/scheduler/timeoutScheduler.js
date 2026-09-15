// 무응답 타임아웃 / 리마인드 스케줄러 (체크리스트 7-2, 문의라우팅_백엔드_구현계획.md 5.4절)
//
// ⚠️ PoC 테스트 모드: config.js의 타임아웃/주기 값이 운영값(2시간, 15분)이 아니라
// 빠른 동작 확인을 위해 5초/1초로 줄어 있다 (config.js 상단 주석 참고). 운영 배포 전 교체 필요.
//
// 흐름: 전송(chatSentAt) 후 REMINDER_TIMEOUT_MS 경과 && 미완료 → 팀장 멘션 리마인드
//       리마인드(reminderSentAt) 후 ESCALATION_TIMEOUT_MS 추가 경과 && 미완료 → escalatedAt 기록(관리자 페이지 노출 대상)

const store = require("../store/inMemoryStore");
const { getChatClient } = require("../chat/chatClientRegistry");
const teams = require("../matching/teams-seed.json");
const { REMINDER_TIMEOUT_MS, ESCALATION_TIMEOUT_MS, SCHEDULER_INTERVAL_MS } = require("../config");

async function checkTimeouts(now = new Date()) {
  const nowMs = now.getTime();

  for (const inquiry of store.list()) {
    if (inquiry.matchFailed || inquiry.completedAt || !inquiry.chatSentAt) continue;

    if (!inquiry.reminderSentAt) {
      const elapsed = nowMs - new Date(inquiry.chatSentAt).getTime();
      if (elapsed >= REMINDER_TIMEOUT_MS) {
        const team = teams.find((t) => t.id === inquiry.matchedTeamId);
        try {
          await getChatClient(team.id).sendReminder(team, inquiry);
        } catch (err) {
          console.error(`[TimeoutScheduler] 리마인드 전송 실패 (${inquiry.id}): ${err.message}`);
        }
        store.update(inquiry.id, { reminderSentAt: now.toISOString() });
      }
      continue;
    }

    if (!inquiry.escalatedAt) {
      const elapsedSinceReminder = nowMs - new Date(inquiry.reminderSentAt).getTime();
      if (elapsedSinceReminder >= ESCALATION_TIMEOUT_MS) {
        store.update(inquiry.id, { escalatedAt: now.toISOString() });
        console.log(`[TimeoutScheduler] ${inquiry.id} 무응답 지속 — 관리자 페이지 노출 대상으로 전환`);
      }
    }
  }
}

let timer = null;

function start() {
  if (timer) return; // 중복 시작 방지
  timer = setInterval(() => {
    checkTimeouts().catch((err) => console.error(`[TimeoutScheduler] ${err.message}`));
  }, SCHEDULER_INTERVAL_MS);
}

function stop() {
  clearInterval(timer);
  timer = null;
}

module.exports = { checkTimeouts, start, stop };
