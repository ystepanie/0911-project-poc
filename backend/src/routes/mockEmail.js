// Mock 이메일 발송 로그 조회용 디버그 라우터 (체크리스트 9-4, 검증용, 정식 API 아님)

const express = require("express");
const emailClient = require("../email/mockEmailClient");

const router = express.Router();

router.get("/log", (req, res) => {
  res.json(emailClient.getLog());
});

module.exports = router;
