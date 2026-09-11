// POST /api/inquiries — 등록 + 매칭 파이프라인 실행 (체크리스트 5-4)
// 응답 형태는 프론트 mock(inquiry-board/js/api.js: submitInquiry)의 반환 객체와 동일하게 맞춰,
// Phase 9(DB/실 서버 연동)에서 프론트가 fetch 호출로만 바꾸면 되도록 한다.

const express = require("express");
const teams = require("../matching/teams-seed.json");
const { matchInquiry } = require("../matching");
const store = require("../store/inMemoryStore");

const router = express.Router();

router.post("/", (req, res) => {
  const { author, contact, title, content } = req.body || {};

  if (!author || !contact || !title || !content) {
    return res.status(400).json({ error: "author, contact, title, content는 필수입니다." });
  }

  const match = matchInquiry(`${title} ${content}`, teams);

  const inquiry = {
    id: store.nextInquiryId(),
    author,
    contact,
    title,
    content,
    createdAt: new Date().toISOString(),

    candidateTeams: match.candidateTeams,
    matchedTeam: match.matchedTeamName,
    matchConfidence: match.matchConfidence,
    matchFailed: match.matchFailed,
    failReason: match.failReason,
    matcherMode: match.matcherMode,

    chatSentAt: match.matchFailed ? null : new Date().toISOString(),
    completedAt: null,

    surveyReady: false,
    surveyReadyAt: null,
    survey: {
      satisfaction: null,
      matchCorrect: null,
      comment: null,
      answeredAt: null,
    },
  };

  store.create(inquiry);

  res.status(201).json(inquiry);
});

router.get("/:id", (req, res) => {
  const inquiry = store.getById(req.params.id);
  if (!inquiry) {
    return res.status(404).json({ error: "존재하지 않는 문의 ID입니다." });
  }
  res.json(inquiry);
});

module.exports = router;
