-- 만족도 조사 (문의라우팅_백엔드_구현계획.md 3.3절)
CREATE TABLE surveys (
  inquiry_id      VARCHAR(20) PRIMARY KEY REFERENCES inquiries(id),
  satisfaction    SMALLINT CHECK (satisfaction BETWEEN 1 AND 5),
  match_correct   BOOLEAN,          -- 4.1절 골드 라벨의 핵심 필드
  comment         TEXT,
  answered_at     TIMESTAMPTZ
);
