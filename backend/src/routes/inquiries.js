// POST /api/inquiries — 등록 + 매칭 파이프라인 실행 (체크리스트 5-4)
// 응답 형태는 프론트 mock(inquiry-board/js/api.js: submitInquiry)의 반환 객체와 동일하게 맞춰,
// Phase 9(DB/실 서버 연동)에서 프론트가 fetch 호출로만 바꾸면 되도록 한다.

const express = require("express");
const crypto = require("crypto");
const teamRepository = require("../teams/teamRepository");
const { matchInquiry } = require("../matching");
const store = require("../store/inMemoryStore");
const { sendInquiryToTeam } = require("../chat/sendInquiryToTeam");
const { upload } = require("../upload/uploadMiddleware"); // 11-2: 이미지 첨부 (JSON 요청이면 그냥 통과됨)
const { requireInquiry } = require("./helpers");
const { nowIso } = require("../utils/time");

const router = express.Router();

router.post("/", upload.single("image"), async (req, res) => {
  const { author, contact, title, content } = req.body || {};

  if (!author || !contact || !title || !content) {
    return res.status(400).json({ error: "author, contact, title, content는 필수입니다." });
  }

  // 이미지는 매칭 파이프라인 입력에 포함시키지 않는다 (제목+내용 텍스트만 사용) — Phase 11 설계 원칙
  const match = await matchInquiry(`${title} ${content}`, teamRepository.getAllTeams());

  const inquiry = {
    id: store.nextInquiryId(),
    accessToken: crypto.randomUUID(), // 상세 페이지 링크용 — 순차 ID 대신 이걸로 조회해 다른 문의 순회를 막는다
    author,
    contact,
    title,
    content,
    imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
    createdAt: nowIso(),

    // candidateTeams/matchedTeamId/matchedTeam/matchConfidence/matchFailed/failReason/matcherMode/matchReason
    // matchInquiry()의 반환 필드명이 inquiry 객체 필드명과 동일하게 맞춰져 있어 그대로 펼치면 된다 (matching/index.js 참고).
    ...match,

    assignedManually: false,

    assigneeId: null, // 담당자 배정 (팀 배정 → 완료 사이 단계)
    assigneeName: null,
    assigneeAssignedAt: null,

    chatMessageId: null,
    chatSentAt: null,
    chatSendError: null,
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

    // 문의 하나의 전체 생명주기를 시간순으로 남기는 로그 (사용자 요청사항) — 아래에서 store.appendStatusLog로 채운다.
    statusLog: [],
  };

  // 스토어에 먼저 등록해야 이후 store.appendStatusLog/sendInquiryToTeam이 id로 조회할 수 있다.
  store.create(inquiry);
  store.appendStatusLog(inquiry.id, "created", `문의 접수 (작성자: ${author})`);
  store.appendStatusLog(
    inquiry.id,
    match.matchFailed ? "match_failed" : "matched",
    match.matchFailed
      ? `매칭 실패 (사유: ${match.failReason})`
      : `${match.matchedTeam}으로 자동 매칭 (신뢰도 ${(match.matchConfidence * 100).toFixed(0)}%)`
  );

  // 문의 결과는 이 응답으로 화면에 바로 표시되므로, 제출 시점에는 이메일을 보내지 않는다.
  // 실패 건이 관리자 수동 배정으로 해결됐을 때만 이메일 발송 (routes/admin.js assign-team 참고).
  // Chat 전송 성공/실패 처리는 sendInquiryToTeam 내부에서 스토어에 직접 반영한다.
  if (!match.matchFailed) {
    await sendInquiryToTeam(inquiry, match.matchedTeamId);
  }

  res.status(201).json(inquiry);
});

// "내 문의 목록"(my-inquiries.html)용 — contact(임시 식별자) 기준으로 본인이 제출한 문의 전체 조회.
// 로그인 전까지는 본인 확인 수단이 없어, 실제로는 고정된 데모 사용자 한 명의 이메일로만 조회한다.
router.get("/", (req, res) => {
  const { contact } = req.query;
  if (!contact) {
    return res.status(400).json({ error: "contact 쿼리 파라미터는 필수입니다." });
  }

  const items = store
    .list()
    .filter((item) => item.contact === contact)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(items);
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

// 상세 페이지(admin-detail.html)가 사용하는 조회 경로 — 순차 ID가 아니라 랜덤 accessToken으로 찾는다.
// "/:id"보다 먼저 선언해야 "by-token"이 :id로 잡히지 않는다.
router.get("/by-token/:token", (req, res) => {
  const inquiry = store.list().find((item) => item.accessToken === req.params.token);
  if (!inquiry) {
    return res.status(404).json({ error: "존재하지 않거나 만료된 링크입니다." });
  }
  res.json(inquiry);
});

router.get("/:id", (req, res) => {
  const inquiry = requireInquiry(req, res);
  if (!inquiry) return;
  res.json(inquiry);
});

// 담당자 배정 (팀 배정 → 완료 사이 단계, 순서 강제 없음 — 완료 처리 전/후 아무 때나 호출 가능)
// 담당자 후보 명단은 teamRepository.getTeamMembers()가 제공 (지금은 team-members.json 하드코딩, 후속 과제로 실 DB 연동)
router.post("/:id/assignee", (req, res) => {
  const { assigneeId } = req.body || {};
  const inquiry = requireInquiry(req, res);
  if (!inquiry) return;

  if (inquiry.matchFailed || !inquiry.matchedTeamId) {
    return res.status(409).json({ error: "팀이 배정되지 않은 문의에는 담당자를 지정할 수 없습니다." });
  }

  const members = teamRepository.getTeamMembers(inquiry.matchedTeamId);
  const member = members.find((m) => m.id === assigneeId);
  if (!member) {
    return res.status(400).json({ error: "존재하지 않는 담당자입니다." });
  }

  store.update(inquiry.id, {
    assigneeId: member.id,
    assigneeName: member.name,
    assigneeAssignedAt: nowIso(),
  });
  store.appendStatusLog(inquiry.id, "assignee_assigned", `담당자로 ${member.name} 지정`);

  res.json(inquiry);
});

// 8-4: 관리자가 설문 발송을 확정 (자동 발송 대신 수동 확정)
router.post("/:id/survey-ready", (req, res) => {
  const { adminEmail } = req.body || {};
  const inquiry = requireInquiry(req, res);
  if (!inquiry) return;

  if (!inquiry.completedAt) {
    return res.status(409).json({ error: "완료 처리되지 않은 문의는 설문을 발송할 수 없습니다." });
  }

  store.update(inquiry.id, {
    surveyReady: true,
    surveyReadyAt: nowIso(),
    surveyReadyBy: adminEmail || null,
  });
  store.appendStatusLog(inquiry.id, "survey_ready", "만족도 조사 발송 확정");

  res.json(inquiry);
});

router.post("/:id/survey", (req, res) => {
  const { satisfaction, matchCorrect, comment } = req.body || {};
  const inquiry = requireInquiry(req, res);
  if (!inquiry) return;

  if (!inquiry.surveyReady) {
    return res.status(409).json({ error: "설문 발송이 확정되지 않은 문의입니다." });
  }

  store.update(inquiry.id, {
    survey: {
      satisfaction,
      matchCorrect,
      comment: comment || "",
      answeredAt: nowIso(),
    },
  });
  store.appendStatusLog(inquiry.id, "survey_answered", `만족도 조사 응답 완료 (만족도 ${satisfaction})`);

  res.json(inquiry);
});

module.exports = router;
