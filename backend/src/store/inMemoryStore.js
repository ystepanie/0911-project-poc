// PostgreSQL 연결 전까지 쓰는 임시 인메모리 저장소.
// 서버 프로세스를 재시작하면 데이터가 사라진다 — Phase 9(DB 연동)에서 실제 repository로 교체될 자리.
// 프론트 mock(inquiry-board/js/mock-data.js)의 localStorage 저장소와 동일한 역할을 서버 쪽에서 대신한다.

const { nowIso } = require("../utils/time");

const inquiries = [];
let seq = 0;

function nextInquiryId() {
  seq += 1;
  return `Q-${String(seq).padStart(4, "0")}`;
}

function create(inquiry) {
  inquiries.push(inquiry);
  return inquiry;
}

function getById(id) {
  return inquiries.find((item) => item.id === id) || null;
}

function list() {
  return inquiries;
}

function update(id, patch) {
  const inquiry = getById(id);
  if (!inquiry) return null;
  Object.assign(inquiry, patch);
  return inquiry;
}

// 상태 변경 이력 — 문의 하나의 전체 생명주기(접수/매칭/배정/담당자지정/완료/설문 등)를 로그로 남긴다.
function appendStatusLog(id, event, detail) {
  const inquiry = getById(id);
  if (!inquiry) return null;
  if (!inquiry.statusLog) inquiry.statusLog = [];
  inquiry.statusLog.push({ at: nowIso(), event, detail });
  return inquiry;
}

module.exports = { nextInquiryId, create, getById, list, update, appendStatusLog };
