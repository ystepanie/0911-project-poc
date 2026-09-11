# 문의 라우팅 자동화 — 백엔드 (스캐폴딩)

> 상세 설계: [../문의라우팅_백엔드_구현계획.md](../문의라우팅_백엔드_구현계획.md)
> 진행 상태: [../구현_체크리스트.md](../구현_체크리스트.md) Phase 4~9 참고

아직 로직이 구현되지 않은 자리표시자 상태입니다. 체크리스트 Phase 4(DB 스키마)부터 순차적으로 채워질 예정입니다.

## 예정 구조

```
backend/
  src/
    matching/       # CandidateFilter, LlmReranker(Mock/Live) 등 팀 매칭 파이프라인
    chat/           # Google Chat 연동 (전송, 이벤트 웹훅)
    scheduler/      # 무응답 타임아웃/리마인드 cron
    routes/         # Express 라우터 (문의/설문/관리자 API)
  migrations/       # PostgreSQL 스키마 마이그레이션
```

## 기술 스택

- Node.js + Express
- PostgreSQL
- node-cron
