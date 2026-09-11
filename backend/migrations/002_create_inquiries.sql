-- 문의 (문의라우팅_백엔드_구현계획.md 3.2절)
CREATE TABLE inquiries (
  id              VARCHAR(20) PRIMARY KEY,       -- 'Q-0001' 형식
  author_name     VARCHAR(100) NOT NULL,
  author_email    VARCHAR(200) NOT NULL,
  title           VARCHAR(300) NOT NULL,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),

  candidate_teams   JSONB,                          -- 1단계 키워드 후보군 3~5개 + 각 점수 (감사/디버깅용)
  matched_team_id   INTEGER REFERENCES teams(id),    -- 2단계 LLM 재판단 결과 (수동 배정 시에도 이 컬럼에 반영)
  match_confidence  NUMERIC(4,3),
  match_failed      BOOLEAN DEFAULT false,
  fail_reason       VARCHAR(30),                    -- 'no_candidate' | 'no_team_found' | 'low_confidence'
  matcher_mode      VARCHAR(20) DEFAULT 'llm_mock',  -- 'llm_mock' | 'llm_live' — 어떤 재판단기가 처리했는지 기록
  assigned_manually BOOLEAN DEFAULT false,           -- 관리자가 매칭 실패 건을 수동 배정했는지 (5.6절)

  chat_message_id VARCHAR(200),                   -- Chat 메시지 링크/ID
  chat_sent_at    TIMESTAMPTZ,

  completed_at    TIMESTAMPTZ,
  completed_by    VARCHAR(200),                    -- 완료 처리한 사용자(리액션 누른 사람)

  reminder_sent_at TIMESTAMPTZ,                    -- 무응답 리마인드 발송 시각
  escalated_at     TIMESTAMPTZ,                     -- 관리자 페이지 노출 시각

  survey_ready     BOOLEAN DEFAULT false,           -- 관리자가 설문 발송을 확정했는지
  survey_ready_at  TIMESTAMPTZ,
  survey_ready_by  VARCHAR(200)                     -- 발송 확정한 관리자
);

CREATE INDEX idx_inquiries_matched_team ON inquiries(matched_team_id);
CREATE INDEX idx_inquiries_match_failed ON inquiries(match_failed);
CREATE INDEX idx_inquiries_survey_ready ON inquiries(survey_ready);
CREATE INDEX idx_inquiries_author_email ON inquiries(author_email);
