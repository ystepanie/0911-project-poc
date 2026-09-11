const express = require("express");
const inquiriesRouter = require("./routes/inquiries");
const mockChatRouter = require("./routes/mockChat");
const chatEventsRouter = require("./routes/chatEvents");
const adminRouter = require("./routes/admin");
const mockEmailRouter = require("./routes/mockEmail");
const timeoutScheduler = require("./scheduler/timeoutScheduler");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/inquiries", inquiriesRouter);
app.use("/api/mock-chat", mockChatRouter); // Phase 6 검증용 (Google Chat 미연동 상태)
app.use("/api/chat/events", chatEventsRouter); // Phase 7: 완료 트리거 (Mock 페이로드)
app.use("/api/admin", adminRouter); // Phase 8: 매칭 실패 운영 + 설문 발송 확정
app.use("/api/mock-email", mockEmailRouter); // Phase 9 검증용 (Gmail API 미연동 상태)

// 인메모리 저장소(src/store/inMemoryStore.js) 사용 중 — Phase 10(DB 연동)에서 실제 repository로 교체 예정
// 참고: ../문의라우팅_백엔드_구현계획.md

timeoutScheduler.start(); // ⚠️ PoC 테스트값(config.js): 5초 리마인드/에스컬레이션, 1초 주기 — 운영값 아님

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`backend listening on port ${PORT}`);
});
