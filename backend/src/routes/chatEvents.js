// POST /api/chat/events — 체크리스트 7-1 (문의라우팅_백엔드_구현계획.md 5.3절)
//
// 실제로는 Google Chat이 리액션(✅)/슬래시 명령 이벤트를 이 엔드포인트로 웹훅 전송하지만,
// Google Chat App이 아직 등록되지 않아(Phase 6 참고) 그 페이로드를 받을 수 없다.
// 지금은 { inquiryId, actorEmail } 형태의 단순화된 Mock 페이로드를 받아 완료 처리만 검증한다.
// 실 연동 시 이 라우트 핸들러 내부에서 Google Chat 이벤트 JSON을 파싱해
// inquiryId/actorEmail을 뽑아내는 부분만 교체하면 된다.

const express = require("express");
const store = require("../store/inMemoryStore");

const router = express.Router();

router.post("/", (req, res) => {
  const { inquiryId, actorEmail } = req.body || {};

  if (!inquiryId || !actorEmail) {
    return res.status(400).json({ error: "inquiryId, actorEmail은 필수입니다." });
  }

  const inquiry = store.getById(inquiryId);
  if (!inquiry) {
    return res.status(404).json({ error: "존재하지 않는 문의 ID입니다." });
  }

  if (inquiry.matchFailed) {
    return res.status(409).json({ error: "매칭 실패 건은 완료 처리할 수 없습니다. 먼저 팀을 배정해주세요." });
  }
  if (inquiry.completedAt) {
    return res.json(inquiry); // 이미 완료 처리된 건 — 멱등하게 그대로 반환
  }

  store.update(inquiryId, {
    completedAt: new Date().toISOString(),
    completedBy: actorEmail,
  });
  store.appendStatusLog(inquiryId, "completed", `완료 처리 (처리자: ${actorEmail})`);

  res.json(store.getById(inquiryId));
});

module.exports = router;
