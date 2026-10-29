const assert = require("node:assert/strict");
const { once } = require("node:events");
const { test } = require("node:test");
const express = require("express");
const teamRepository = require("../src/teams/teamRepository");
const store = require("../src/store/inMemoryStore");
const chatRegistry = require("../src/chat/chatClientRegistry");

test("팀 설정: 잘못된 키워드는 저장하지 않고 정상 요청은 계속 처리한다", async (t) => {
  const originalSave = teamRepository.saveTeamConfig;
  const originalGetTeam = teamRepository.getTeamById;
  const saved = [];
  teamRepository.getTeamById = () => ({ id: 1, name: "검증팀" });
  teamRepository.saveTeamConfig = (id, config) => {
    saved.push({ id, config });
    return config;
  };
  t.after(() => {
    teamRepository.saveTeamConfig = originalSave;
    teamRepository.getTeamById = originalGetTeam;
  });

  const app = express();
  app.use(express.json());
  app.use("/api/teams", require("../src/routes/teams"));
  const server = app.listen(0, "127.0.0.1");
  t.after(() => new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections();
  }));
  await once(server, "listening");
  const url = `http://127.0.0.1:${server.address().port}/api/teams/1/config`;

  for (const keywords of [[123], [null], [{}], [" "], "정산"]) {
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords }),
    });
    assert.equal(response.status, 400);
    assert.equal(typeof (await response.json()).error, "string");
  }
  assert.equal(saved.length, 0);

  for (const body of [{ description: {} }, { webhookUrl: [] }]) {
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    assert.equal(response.status, 400);
  }
  assert.equal(saved.length, 0);

  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keywords: ["정산"], description: "정산 업무" }),
  });
  assert.equal(response.status, 200);
  assert.equal(saved.length, 1);
  assert.deepEqual((await response.json()).keywords, ["정산"]);
});

test("지연 확인: 취소 건은 알림과 추가 지연 기록에서 제외한다", async (t) => {
  const originalClient = chatRegistry.getChatClient;
  let reminders = 0;
  chatRegistry.getChatClient = () => ({ sendReminder: async () => { reminders += 1; } });
  // 스케줄러가 실제 외부 알림 클라이언트 대신 검증용 클라이언트를 참조하게 한다.
  delete require.cache[require.resolve("../src/scheduler/timeoutScheduler")];
  const { checkTimeouts } = require("../src/scheduler/timeoutScheduler");
  const originalGetTeam = teamRepository.getTeamById;
  teamRepository.getTeamById = () => ({ id: 1, name: "검증팀" });
  t.after(() => {
    chatRegistry.getChatClient = originalClient;
    teamRepository.getTeamById = originalGetTeam;
    store.list().splice(0);
    delete require.cache[require.resolve("../src/scheduler/timeoutScheduler")];
  });

  const base = { matchedTeamId: 1, chatSentAt: new Date(0).toISOString(), statusLog: [] };
  const cancelled = store.create({ ...base, id: "CANCELLED", cancelledAt: new Date(1).toISOString() });
  const alreadyReminded = store.create({ ...base, id: "CANCELLED-REMINDED", cancelledAt: new Date(2).toISOString(), reminderSentAt: new Date(1).toISOString() });
  const active = store.create({ ...base, id: "ACTIVE", statusLog: [] });
  await checkTimeouts(new Date(8640000000000000));

  assert.equal(reminders, 1, "진행 중 문의에만 알림을 보낸다");
  assert.equal(cancelled.reminderSentAt, undefined);
  assert.equal(cancelled.escalatedAt, undefined);
  assert.equal(alreadyReminded.escalatedAt, undefined);
  assert.ok(active.reminderSentAt);
});
