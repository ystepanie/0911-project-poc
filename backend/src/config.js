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

module.exports = { REMINDER_TIMEOUT_MS, ESCALATION_TIMEOUT_MS, SCHEDULER_INTERVAL_MS };
