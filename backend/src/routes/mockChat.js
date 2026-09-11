// Mock Chat 전송 로그 조회용 디버그 라우터 (체크리스트 Phase 6 검증용, 정식 API 아님)

const express = require("express");
const chatClient = require("../chat/mockChatClient");

const router = express.Router();

router.get("/log", (req, res) => {
  res.json(chatClient.getLog());
});

module.exports = router;
