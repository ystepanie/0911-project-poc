// 라우트 핸들러 공용 헬퍼 — 여러 라우트 파일(inquiries.js, admin.js)에서 반복되던
// ":id로 조회 → 없으면 404" 보일러플레이트를 하나로 모은다.

const store = require("../store/inMemoryStore");

// 문의를 조회해 반환하거나, 없으면 404 응답을 직접 보내고 null을 반환한다.
// 호출부는 `const inquiry = requireInquiry(req, res); if (!inquiry) return;` 형태로 쓰면 된다.
function requireInquiry(req, res) {
  const inquiry = store.getById(req.params.id);
  if (!inquiry) {
    res.status(404).json({ error: "존재하지 않는 문의 ID입니다." });
    return null;
  }
  return inquiry;
}

module.exports = { requireInquiry };
