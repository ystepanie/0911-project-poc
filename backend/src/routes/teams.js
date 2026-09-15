// 팀 목록/설정 API — 관리자 팀 배정 드롭다운(Phase 10) + 팀 관리자 페이지(Phase 12)

const express = require("express");
const teamRepository = require("../teams/teamRepository");
const liveChatClient = require("../chat/liveChatClient");

const router = express.Router();

// ":id 파라미터 → 팀 조회 → 없으면 404"를 아래 라우트들이 각자 반복하던 것을 param 미들웨어로 통합.
// 통과하면 req.teamId(숫자)/req.team(팀 객체)을 각 핸들러가 그대로 쓴다.
router.param("id", (req, res, next, rawId) => {
  const id = Number(rawId);
  const team = teamRepository.getTeamById(id);
  if (!team) {
    return res.status(404).json({ error: "존재하지 않는 teamId입니다." });
  }
  req.teamId = id;
  req.team = team;
  next();
});

router.get("/", (req, res) => {
  res.json(teamRepository.getAllTeams().map(({ id, name }) => ({ id, name })));
});

// 12-4: 특정 팀의 keywords/description + 마스킹된 웹훅 상태
router.get("/:id/config", (req, res) => {
  res.json({ id: req.teamId, name: req.team.name, ...teamRepository.getTeamConfig(req.teamId) });
});

// 12-5: keywords/description/webhookUrl 저장 (webhookUrl 미전달 시 기존 값 유지)
router.put("/:id/config", (req, res) => {
  const { keywords, description, webhookUrl } = req.body || {};
  if (keywords !== undefined && !Array.isArray(keywords)) {
    return res.status(400).json({ error: "keywords는 배열이어야 합니다." });
  }

  const updated = teamRepository.saveTeamConfig(req.teamId, { keywords, description, webhookUrl });
  res.json({ id: req.teamId, name: req.team.name, ...updated });
});

// 담당자 배정 드롭다운용 — 해당 팀 소속 담당자 후보 목록 (지금은 team-members.json 하드코딩, 후속 과제로 실 DB 연동)
router.get("/:id/members", (req, res) => {
  res.json(teamRepository.getTeamMembers(req.teamId));
});

// 12-6: 저장된 웹훅으로 테스트 메시지 전송
router.post("/:id/test-webhook", async (req, res) => {
  try {
    await liveChatClient.sendTestMessage(req.team);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
