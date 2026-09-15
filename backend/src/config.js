// 무응답 타임아웃 설정값 (문의라우팅_백엔드_구현계획.md 5.4절)
//
// ⚠️ PoC 테스트 모드: 아래 기본값은 실제 운영값(근무시간 기준 2시간)이 아니라,
// 빠른 동작 확인을 위해 임시로 5초로 줄인 값이다. 실제 배포 전 반드시 운영값으로 교체할 것.
//   - 운영 목표값: REMINDER_TIMEOUT_MS = 7200000 (2시간), ESCALATION_TIMEOUT_MS = 7200000 (리마인드 후 추가 2시간)
//   - SCHEDULER_INTERVAL_MS도 운영에서는 15분(900000) 주기가 기준 (5.4절 cron)
// 환경변수로 덮어쓸 수 있게 해, 운영 배포 시 .env 값만 바꾸면 되도록 한다.

const REMINDER_TIMEOUT_MS = Number(process.env.REMINDER_TIMEOUT_MS) || 5000; // PoC 테스트값: 5초 (운영: 7200000)
const ESCALATION_TIMEOUT_MS = Number(process.env.ESCALATION_TIMEOUT_MS) || 5000; // PoC 테스트값: 5초 (운영: 7200000)
const SCHEDULER_INTERVAL_MS = Number(process.env.SCHEDULER_INTERVAL_MS) || 1000; // PoC 테스트값: 1초 (운영: 900000 = 15분)

// 매칭 실패(미배정) 건 관리자 수동 배정 SLA (문의라우팅_백엔드_구현계획.md 5.6절: "예 1영업일 이내")
// ⚠️ PoC 테스트값: 5초. 운영 목표값은 1영업일(대략 28800000 = 8시간 근무 기준, 정책에 따라 조정)
const ADMIN_ASSIGN_SLA_MS = Number(process.env.ADMIN_ASSIGN_SLA_MS) || 5000; // PoC 테스트값: 5초 (운영: 1영업일)

// 프론트(inquiry-board)를 서빙하는 주소 — Chat 메시지에 상세 페이지 링크를 넣을 때 사용 (Phase 6-5)
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "http://localhost:8000";

module.exports = {
  REMINDER_TIMEOUT_MS,
  ESCALATION_TIMEOUT_MS,
  SCHEDULER_INTERVAL_MS,
  ADMIN_ASSIGN_SLA_MS,
  FRONTEND_BASE_URL,
};
