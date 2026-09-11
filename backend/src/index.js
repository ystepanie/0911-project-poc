const express = require("express");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// 체크리스트 Phase 4~8에 따라 라우터/매칭/Chat 연동/스케줄러가 순차적으로 추가될 예정
// 참고: ../문의라우팅_백엔드_구현계획.md

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`backend listening on port ${PORT}`);
});
