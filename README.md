# 문의 라우팅 자동화 (PoC)

문의 게시판에 등록된 문의를 키워드 매칭 + LLM 재판단으로 담당 팀에 자동 배정하고,
Chat(Slack/Google Chat 웹훅)으로 알림을 보낸 뒤 처리 상태를 추적하는 사내 자동화 PoC입니다.

- 프론트: 순수 HTML/JS (ES modules, 빌드 없음) — `inquiry-board/`
- 백엔드: Node.js + Express, 인메모리 저장소 — `backend/`
- 상세 설계/진행 상태: [업무자동화_PoC_세부구현계획.md](업무자동화_PoC_세부구현계획.md), [구현_체크리스트.md](구현_체크리스트.md)

## 1. 사전 요구사항

다른 컴퓨터에서 이 프로젝트를 그대로 실행하려면 아래가 필요합니다.

| 항목 | 버전/용도 | 확인 방법 |
|---|---|---|
| [Node.js](https://nodejs.org/) | 18 이상 (LTS 권장) — 백엔드가 내장 `fetch`, `crypto.randomUUID()` 등 Node 18+ API를 사용 | `node --version` |
| npm | Node.js 설치 시 함께 설치됨 | `npm --version` |
| 정적 파일 서버 | 프론트(`inquiry-board/`)를 서빙할 아무 도구 (아래 3-2절 참고). ES 모듈은 `file://`로 직접 열면 동작하지 않아 반드시 필요 | - |
| Git | 저장소 클론용 | `git --version` |

다음은 **선택 사항**이며, 없어도 Mock으로 자동 대체되어 PoC 전체가 정상 동작합니다.

- **Anthropic API 키** — 없으면 결정적 규칙 기반의 `MockLlmReranker`로 자동 전환됩니다 (`ANTHROPIC_API_KEY` 미설정 시).
- **Slack 또는 Google Chat 수신 웹훅 URL** — 팀별로 설정하지 않으면 콘솔 로그로 대체하는 `MockChatClient`가 대신 동작합니다.
- **PostgreSQL** — `backend/migrations`, `backend/seeds`에 스키마가 준비돼 있지만, 현재 실행되는 서버는 인메모리 저장소(`backend/src/store/inMemoryStore.js`)를 사용합니다. **지금 이 PoC를 실행하는 데는 PostgreSQL이 필요하지 않습니다** (서버 재시작 시 데이터가 초기화되는 점은 감안해야 합니다).

## 2. 저장소 받기

```bash
git clone https://github.com/ystepanie/0911-project-poc.git
cd 0911-project-poc
```

## 3. 설치 및 실행

### 3-1. 백엔드

```bash
cd backend
npm install
```

환경 설정 파일을 복사합니다 (`.env`는 git에 커밋되지 않습니다).

```bash
cp .env.example .env
```

`backend/.env`는 기본값(모두 Mock 모드)만으로도 바로 실행됩니다. 실제 LLM/알림을 쓰려면 아래를 채우세요.

```env
# 값이 있으면 실제 Claude API(LiveLlmReranker)를 호출합니다. 없으면 Mock 규칙으로 동작합니다.
ANTHROPIC_API_KEY=sk-ant-...

# 운영값으로 바꾸고 싶을 때만 주석 해제 (기본은 테스트용으로 짧게 설정돼 있음)
# REMINDER_TIMEOUT_MS=7200000
# ESCALATION_TIMEOUT_MS=7200000
```

팀별 키워드/설명/Chat 웹훅 설정 파일도 템플릿에서 복사합니다.

```bash
cp data/team-config.example.json data/team-config.json
```

`backend/data/team-config.json`에서 팀별 `keywords`(매칭용 키워드 배열), `description`(LLM 재판단용 설명), 필요하면 `webhookUrl`(Slack/Google Chat 수신 웹훅)을 채워 넣으세요. 웹훅을 비워두면 해당 팀은 자동으로 Mock 전송(콘솔 로그)으로 동작합니다. 이 파일은 서버 실행 중에는 관리자 페이지(`admin-teams.html`)에서도 수정할 수 있습니다 — 비밀번호는 `inquiry-board/js/admin-teams.js`의 `requireGatePassword({ password: ... })` 호출부에 하드코딩돼 있습니다(로그인 전까지의 임시 조치, 실제 보안장치 아님).

서버를 실행합니다.

```bash
npm start
# 또는: node src/index.js
```

`backend listening on port 3000`이 출력되면 정상입니다. `http://localhost:3000/health`로 접속해 `{"status":"ok"}`가 나오는지 확인할 수 있습니다.

### 3-2. 프론트엔드

`inquiry-board/`는 빌드 과정이 없는 순수 HTML/JS라, 정적 파일 서버로 열기만 하면 됩니다.
백엔드가 `http://localhost:3000`을 바라보도록 고정돼 있으므로(`inquiry-board/js/api.js`), 반드시 로컬에서 서빙해야 하며 아래 중 편한 방법을 쓰면 됩니다.

```bash
cd inquiry-board

# Python이 있다면
python -m http.server 8000

# Node.js만 있다면 (설치 없이 실행 가능)
npx serve -l 8000
```

브라우저에서 `http://localhost:8000/index.html`에 접속하면 문의 게시판이 열립니다.

> 포트를 8000이 아닌 다른 값으로 쓰고 싶다면 `backend/.env`에 `FRONTEND_BASE_URL=http://localhost:<포트>`를 추가하세요 — Chat 알림 메시지에 들어가는 "상세 확인" 링크가 이 값을 기준으로 만들어집니다.

### 3-3. 접속 페이지 요약

| 페이지 | 경로 | 용도 |
|---|---|---|
| 문의 게시판 | `index.html` | 문의 등록 |
| 내 문의 목록 | `my-inquiries.html` | 문의자가 자신이 등록한 문의 상태 조회 |
| 문의 상세(Chat 링크) | `admin-detail.html?token=...` | 담당자가 완료 처리·담당자 지정 |
| 팀 관리자 페이지 | `admin-teams.html` | 팀별 키워드/설명/웹훅 관리 (비밀번호 게이트) |

## 4. 정상 동작 확인

```bash
# 백엔드 매칭 파이프라인만 빠르게 확인하고 싶을 때
cd backend
node scripts/test-matching.js
```

## 5. 자주 발생하는 문제

- **`Cannot find module 'express'` 등** → `backend`에서 `npm install`을 실행했는지 확인하세요.
- **프론트에서 문의 등록이 안 됨(CORS/네트워크 에러)** → 백엔드(3000)와 프론트 서버(8000)가 둘 다 떠 있는지, `inquiry-board/js/api.js`의 `API_ORIGIN`이 백엔드 주소와 일치하는지 확인하세요.
- **`index.html`을 더블클릭해서 열었더니 빈 화면** → ES 모듈은 `file://`에서 동작하지 않습니다. 반드시 3-2절의 정적 서버로 열어야 합니다.
- **서버 재시작 후 등록했던 문의가 사라짐** → 의도된 동작입니다. 현재는 인메모리 저장소를 쓰고 있어 재시작하면 초기화됩니다(1절 참고).
- **포트 충돌** (`EADDRINUSE` 등) → 3000/8000 포트를 이미 쓰고 있는 프로세스가 있는지 확인 후 종료하세요.
