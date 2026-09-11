// 관리자 API — 매칭 실패 운영(8-1, 8-2), 설문 발송 대기 목록(8-3)
// 정식 관리자 페이지는 아직 없음 (프론트 관리자 데모 섹션이 이 API들을 사용할 예정, Phase 9)

const express = require("express");
const teams = require("../matching/teams-seed.json");
const store = require("../store/inMemoryStore");
const { sendInquiryToTeam } = require("../chat/sendInquiryToTeam");
const { ADMIN_ASSIGN_SLA_MS } = require("../config");

const router = express.Router();

// 8-1: 매칭 실패 후 미배정 목록 (SLA 경과 여부 포함)
router.get("/unassigned", (req, res) => {
  const now = Date.now();

  const items = store
    .list()
    .filter((item) => item.matchFailed && !item.assignedManually)
    .map((item) => ({
      ...item,
      slaExceeded: now - new Date(item.createdAt).getTime() >= ADMIN_ASSIGN_SLA_MS,
    }));

  res.json(items);
});

// 8-2: 관리자 수동 팀 배정 → 정상 플로우(Chat 전송) 재진입
router.post("/inquiries/:id/assign-team", (req, res) => {
  const { teamId } = req.body || {};
  const inquiry = store.getById(req.params.id);

  if (!inquiry) {
    return res.status(404).json({ error: "존재하지 않는 문의 ID입니다." });
  }
  if (!inquiry.matchFailed) {
    return res.status(409).json({ error: "이미 매칭된 문의입니다." });
  }
  const team = teams.find((t) => t.id === teamId);
  if (!team) {
    return res.status(400).json({ error: "존재하지 않는 teamId입니다." });
  }

  store.update(inquiry.id, {
    matchedTeamId: team.id,
    matchedTeam: team.name,
    matchFailed: false,
    failReason: null,
    assignedManually: true,
  });

  const chatInfo = sendInquiryToTeam(store.getById(inquiry.id), team.id);
  store.update(inquiry.id, chatInfo);

  res.json(store.getById(inquiry.id));
});

// 8-3: 완료됐지만 설문 미발송인 건 목록
router.get("/survey-pending", (req, res) => {
  const items = store.list().filter((item) => item.completedAt && !item.surveyReady);
  res.json(items);
});

module.exports = router;
