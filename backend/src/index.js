const express = require("express");
const inquiriesRouter = require("./routes/inquiries");
const mockChatRouter = require("./routes/mockChat");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/inquiries", inquiriesRouter);
app.use("/api/mock-chat", mockChatRouter); // Phase 6 검증용 (Google Chat 미연동 상태)

// 인메모리 저장소(src/store/inMemoryStore.js) 사용 중 — Phase 9(DB 연동)에서 실제 repository로 교체 예정
// 체크리스트 Phase 7~8에 따라 완료 트리거/스케줄러/관리자 API가 순차적으로 추가될 예정
// 참고: ../문의라우팅_백엔드_구현계획.md

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`backend listening on port ${PORT}`);
});
