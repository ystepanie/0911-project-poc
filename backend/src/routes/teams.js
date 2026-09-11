// GET /api/teams — 팀 목록 조회 (관리자 화면의 팀 배정 드롭다운 등에서 사용, Phase 10 연동용)

const express = require("express");
const teams = require("../matching/teams-seed.json");

const router = express.Router();

router.get("/", (req, res) => {
  res.json(teams.map(({ id, name }) => ({ id, name })));
});

module.exports = router;
