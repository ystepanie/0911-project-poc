// 팀 목록/설정 API — 관리자 팀 배정 드롭다운(Phase 10) + 팀 관리자 페이지(Phase 12)

const express = require("express");
const teamRepository = require("../teams/teamRepository");
const liveChatClient = require("../chat/liveChatClient");

const router = express.Router();

router.get("/", (req, res) => {
  res.json(teamRepository.getAllTeams().map(({ id, name }) => ({ id, name })));
});

// 12-4: 특정 팀의 keywords/description + 마스킹된 웹훅 상태
router.get("/:id/config", (req, res) => {
  const id = Number(req.params.id);
  const team = teamRepository.getTeamById(id);
  if (!team) {
    return res.status(404).json({ error: "존재하지 않는 teamId입니다." });
  }
  res.json({ id, name: team.name, ...teamRepository.getTeamConfig(id) });
});

// 12-5: keywords/description/webhookUrl 저장 (webhookUrl 미전달 시 기존 값 유지)
router.put("/:id/config", (req, res) => {
  const id = Number(req.params.id);
  const team = teamRepository.getTeamById(id);
  if (!team) {
    return res.status(404).json({ error: "존재하지 않는 teamId입니다." });
  }

  const { keywords, description, webhookUrl } = req.body || {};
  if (keywords !== undefined && !Array.isArray(keywords)) {
    return res.status(400).json({ error: "keywords는 배열이어야 합니다." });
  }

  const updated = teamRepository.saveTeamConfig(id, { keywords, description, webhookUrl });
  res.json({ id, name: team.name, ...updated });
});

// 담당자 배정 드롭다운용 — 해당 팀 소속 담당자 후보 목록 (지금은 team-members.json 하드코딩, 후속 과제로 실 DB 연동)
router.get("/:id/members", (req, res) => {
  const id = Number(req.params.id);
  const team = teamRepository.getTeamById(id);
  if (!team) {
    return res.status(404).json({ error: "존재하지 않는 teamId입니다." });
  }
  res.json(teamRepository.getTeamMembers(id));
});

// 12-6: 저장된 웹훅으로 테스트 메시지 전송
router.post("/:id/test-webhook", async (req, res) => {
  const id = Number(req.params.id);
  const team = teamRepository.getTeamById(id);
  if (!team) {
    return res.status(404).json({ error: "존재하지 않는 teamId입니다." });
  }

  try {
    await liveChatClient.sendTestMessage(team);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
