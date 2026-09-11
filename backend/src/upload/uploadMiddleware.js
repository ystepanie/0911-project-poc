// 문의 첨부 이미지(오류 메시지 스크린샷 등) 업로드 미들웨어 (체크리스트 11-2).
// 매칭 로직에는 관여하지 않고, Chat 전달용으로만 저장한다 — 이미지 내용 자동 인식(OCR/비전)은 후속 과제(13-6).
// 지금은 로컬 디스크(backend/uploads/)에 저장한다. DB/오브젝트 스토리지 연동은 Phase 4 DB 연동 시 함께 재검토.

const path = require("path");
const multer = require("multer");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("이미지 파일만 첨부할 수 있습니다."));
  }
  cb(null, true);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

module.exports = { upload, UPLOAD_DIR };
