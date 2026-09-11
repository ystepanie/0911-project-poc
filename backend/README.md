# 문의 라우팅 자동화 — 백엔드 (스캐폴딩)

> 상세 설계: [../문의라우팅_백엔드_구현계획.md](../문의라우팅_백엔드_구현계획.md)
> 진행 상태: [../구현_체크리스트.md](../구현_체크리스트.md) Phase 4~9 참고

애플리케이션 로직은 아직 구현되지 않은 자리표시자 상태입니다. 체크리스트 Phase 5(매칭 파이프라인)부터 순차적으로 채워질 예정입니다.

## 현재 구조

```
backend/
  src/
    index.js        # Express 서버 진입점 (placeholder)
    matching/        # (Phase 5) CandidateFilter, LlmReranker(Mock/Live) 등 팀 매칭 파이프라인
    chat/            # (Phase 6) Google Chat 연동 (전송, 이벤트 웹훅)
    scheduler/       # (Phase 7) 무응답 타임아웃/리마인드 cron
    routes/          # (Phase 5~8) Express 라우터 (문의/설문/관리자 API)
  migrations/        # PostgreSQL 스키마 마이그레이션 (teams, inquiries, surveys, match_audit_log) — Phase 4 완료
  seeds/             # 팀 시드 데이터 — Phase 4 완료
```

## DB 초기화 (Phase 4)

`DATABASE_URL` 환경변수를 설정한 뒤 실행:

```bash
npm run migrate   # 스키마 생성
npm run seed       # 팀 R&R 시드 데이터 입력
```

시드 데이터의 `chat_space_id`는 `spaces/PLACEHOLDER_*` 자리표시자이며, Phase 6(Google Chat App 등록)에서 실제 스페이스 ID로 교체해야 한다.

## 기술 스택

- Node.js + Express
- PostgreSQL
- node-cron
