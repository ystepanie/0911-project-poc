// GET /api/org-chart — 팀 관리자 페이지의 트리 뷰용 (체크리스트 12-3)

const express = require("express");
const teamRepository = require("../teams/teamRepository");

const router = express.Router();

router.get("/", (req, res) => {
  res.json(teamRepository.getOrgChartWithStatus());
});

module.exports = router;
