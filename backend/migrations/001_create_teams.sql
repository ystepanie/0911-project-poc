-- 팀 R&R 문서 (문의라우팅_백엔드_구현계획.md 3.1절)
CREATE TABLE teams (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL UNIQUE,
  chat_space_id VARCHAR(200) NOT NULL,   -- Google Chat space ID (Phase 6에서 실제 값으로 교체)
  keywords      TEXT[] NOT NULL,          -- 키워드 규칙 매칭용 (2단계에서 embedding 컬럼 추가 예정)
  description   TEXT,                    -- LLM 재판단 프롬프트에 사용되는 R&R 설명
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
