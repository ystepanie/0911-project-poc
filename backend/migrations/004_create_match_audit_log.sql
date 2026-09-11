-- 매칭 정확도 편향 보정용 수동 감사 로그 (문의라우팅_백엔드_구현계획.md 3.4절, 4.2절)
CREATE TABLE match_audit_log (
  id           SERIAL PRIMARY KEY,
  inquiry_id   VARCHAR(20) REFERENCES inquiries(id),
  audited_by   VARCHAR(200),
  audit_result BOOLEAN,             -- 수동 감사 결과: 실제 매칭이 맞았는지
  note         TEXT,
  audited_at   TIMESTAMPTZ DEFAULT now()
);
