// POST /api/inquiries — 등록 + 매칭 파이프라인 실행 (체크리스트 5-4)
// 응답 형태는 프론트 mock(inquiry-board/js/api.js: submitInquiry)의 반환 객체와 동일하게 맞춰,
// Phase 9(DB/실 서버 연동)에서 프론트가 fetch 호출로만 바꾸면 되도록 한다.

const express = require("express");
const teams = require("../matching/teams-seed.json");
const { matchInquiry } = require("../matching");
const store = require("../store/inMemoryStore");
const { sendInquiryToTeam } = require("../chat/sendInquiryToTeam");
const { notifyMatchSuccess, notifyMatchFailure } = require("../email/notifyInquirer"); // Phase 9: 문의자 이메일 알림 (Mock)

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
    matchedTeamId: match.matchedTeamId, // 스케줄러가 리마인드 보낼 스페이스를 찾는 데 사용 (내부용)
    matchedTeam: match.matchedTeamName,
    matchConfidence: match.matchConfidence,
    matchFailed: match.matchFailed,
    failReason: match.failReason,
    matcherMode: match.matcherMode,
    matchReason: match.reason, // 관리자 화면(8-1)에서 low_confidence 사유 확인용

    assignedManually: false,

    chatMessageId: null,
    chatSentAt: null,
    completedAt: null,
    completedBy: null,

    reminderSentAt: null,
    escalatedAt: null,

    surveyReady: false,
    surveyReadyAt: null,
    surveyReadyBy: null,
    survey: {
      satisfaction: null,
      matchCorrect: null,
      comment: null,
      answeredAt: null,
    },
  };

  if (!match.matchFailed) {
    Object.assign(inquiry, sendInquiryToTeam(inquiry, match.matchedTeamId));
    notifyMatchSuccess(inquiry); // 9-2
  } else {
    notifyMatchFailure(inquiry); // 9-3
  }

  store.create(inquiry);

  res.status(201).json(inquiry);
});

// 8-5: 접속 시 팝업 노출 여부 판단용 — surveyReady=true && 미응답인 문의를 contact(임시 식별자) 기준으로 조회
// "/:id"보다 먼저 선언해야 "pending-survey"가 :id로 잡히지 않는다.
router.get("/pending-survey", (req, res) => {
  const { contact } = req.query;
  if (!contact) {
    return res.status(400).json({ error: "contact 쿼리 파라미터는 필수입니다." });
  }

  const inquiry = store
    .list()
    .find((item) => item.contact === contact && item.surveyReady && !item.survey.answeredAt);

  res.json(inquiry || null);
});

router.get("/:id", (req, res) => {
  const inquiry = store.getById(req.params.id);
  if (!inquiry) {
    return res.status(404).json({ error: "존재하지 않는 문의 ID입니다." });
  }
  res.json(inquiry);
});

// 8-4: 관리자가 설문 발송을 확정 (자동 발송 대신 수동 확정)
router.post("/:id/survey-ready", (req, res) => {
  const { adminEmail } = req.body || {};
  const inquiry = store.getById(req.params.id);

  if (!inquiry) {
    return res.status(404).json({ error: "존재하지 않는 문의 ID입니다." });
  }
  if (!inquiry.completedAt) {
    return res.status(409).json({ error: "완료 처리되지 않은 문의는 설문을 발송할 수 없습니다." });
  }

  store.update(inquiry.id, {
    surveyReady: true,
    surveyReadyAt: new Date().toISOString(),
    surveyReadyBy: adminEmail || null,
  });

  res.json(store.getById(inquiry.id));
});

router.post("/:id/survey", (req, res) => {
  const { satisfaction, matchCorrect, comment } = req.body || {};
  const inquiry = store.getById(req.params.id);

  if (!inquiry) {
    return res.status(404).json({ error: "존재하지 않는 문의 ID입니다." });
  }
  if (!inquiry.surveyReady) {
    return res.status(409).json({ error: "설문 발송이 확정되지 않은 문의입니다." });
  }

  store.update(inquiry.id, {
    survey: {
      satisfaction,
      matchCorrect,
      comment: comment || "",
      answeredAt: new Date().toISOString(),
    },
  });

  res.json(store.getById(inquiry.id));
});

module.exports = router;
