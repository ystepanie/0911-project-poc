-- 팀 시드 데이터 (프론트 mock: inquiry-board/data/teams.json 과 동일한 키워드로 시작, 체크리스트 4-2)
-- chat_space_id는 Phase 6(Google Chat App 등록)에서 실제 스페이스 ID로 교체 필요

INSERT INTO teams (name, chat_space_id, keywords, description) VALUES
  ('회계팀', 'spaces/PLACEHOLDER_ACCOUNTING',
    ARRAY['법인카드', '정산', '세금계산서', '경비', '출장비', '영수증', '예산'],
    '법인카드 사용, 경비 정산, 세금계산서 발행/수취, 출장비, 예산 관련 업무를 담당하는 팀'),
  ('인사팀', 'spaces/PLACEHOLDER_HR',
    ARRAY['채용', '휴가', '연차', '급여명세서', '입사', '퇴사', '복리후생', '인사평가'],
    '채용, 휴가/연차 관리, 급여명세서, 입퇴사 처리, 복리후생, 인사평가를 담당하는 팀'),
  ('IT지원팀', 'spaces/PLACEHOLDER_IT',
    ARRAY['계정', '비밀번호', '노트북', '네트워크', 'vpn', '프린터', '소프트웨어', '장애'],
    '사내 계정/비밀번호, 노트북 지급, 네트워크/VPN, 프린터, 소프트웨어 설치, 장애 대응을 담당하는 팀'),
  ('총무팀', 'spaces/PLACEHOLDER_GA',
    ARRAY['회의실', '비품', '출입증', '주차', '사무용품', '택배', '시설'],
    '회의실 예약, 사무비품, 출입증, 주차, 택배, 사내 시설 관리를 담당하는 팀'),
  ('법무팀', 'spaces/PLACEHOLDER_LEGAL',
    ARRAY['계약서', '계약', '저작권', '라이선스', '소송', '법적', '약관'],
    '계약서 검토, 저작권/라이선스, 소송 대응, 약관 등 법적 이슈를 담당하는 팀');
