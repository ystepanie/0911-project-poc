// 팀 데이터의 단일 창구 (체크리스트 Phase 12-2).
// 조직도(org-chart.json, git 추적 — "회사 DB에서 조회 가능"하지만 지금은 JSON 스켈레톤으로 대체, 후속 14-7)와
// 팀별 운영 설정(team-config.json, git 미추적 — 키워드/설명/웹훅 URL)을 병합해서 제공한다.
// 기존에 여러 파일이 각자 teams-seed.json을 직접 require하던 걸 이 모듈 하나로 교체했다.

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const ORG_CHART_PATH = path.join(DATA_DIR, "org-chart.json");
const TEAM_CONFIG_PATH = path.join(DATA_DIR, "team-config.json");
const TEAM_MEMBERS_PATH = path.join(DATA_DIR, "team-members.json");

// 세 데이터 파일 모두 실행 중에는 거의 안 바뀌는데 getAllTeams() 등이 요청마다 이 함수들을 호출하므로,
// 최초 1회만 읽고 캐싱한다. team-config.json은 이 모듈을 거쳐서만 쓰기 때문에 writeTeamConfig()에서
// 캐시를 함께 갱신하면 되지만, org-chart.json/team-members.json은 파일을 직접 수정한 경우
// 서버 재시작 전까지는 반영되지 않는다(둘 다 지금은 쓰기 API가 없는 정적 데이터라 이 제약이 실질적 문제는 아님).
let orgChartCache = null;
let teamConfigCache = null;
let teamMembersCache = null;

function readOrgChart() {
  if (!orgChartCache) {
    orgChartCache = JSON.parse(fs.readFileSync(ORG_CHART_PATH, "utf-8"));
  }
  return orgChartCache;
}

function readTeamConfig() {
  if (!teamConfigCache) {
    teamConfigCache = fs.existsSync(TEAM_CONFIG_PATH)
      ? JSON.parse(fs.readFileSync(TEAM_CONFIG_PATH, "utf-8"))
      : {};
  }
  return teamConfigCache;
}

function writeTeamConfig(config) {
  fs.writeFileSync(TEAM_CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
  teamConfigCache = config;
}

// 조직도(org-chart.json) 트리를 순회하는 공용 워커 — 리프(isTeam) 노드마다 mapLeaf(node)로 변환한
// 결과로 바꿔 끼우고, 그룹 노드는 children을 재귀적으로 변환한 새 트리를 반환한다.
// flattenLeaves()(평탄화)와 getOrgChartWithStatus()(hasConfig 주석 달기)가 각자 만들던
// 비슷한 재귀 순회 로직을 이걸로 통일한다.
function mapOrgTree(node, mapLeaf) {
  if (node.isTeam) return mapLeaf(node);
  if (node.children) return { ...node, children: node.children.map((child) => mapOrgTree(child, mapLeaf)) };
  return node;
}

function flattenLeaves(root) {
  const acc = [];
  mapOrgTree(root, (leaf) => {
    acc.push(leaf);
    return leaf;
  });
  return acc;
}

// 매칭/Chat 전송이 쓰는 평탄화된 팀 목록: { id, name, keywords, description }
function getAllTeams() {
  const config = readTeamConfig();
  return flattenLeaves(readOrgChart()).map((leaf) => {
    const teamConfig = config[leaf.id] || {};
    return {
      id: leaf.id,
      name: leaf.name,
      keywords: teamConfig.keywords || [],
      description: teamConfig.description || "",
    };
  });
}

function getTeamById(id) {
  return getAllTeams().find((team) => team.id === id) || null;
}

// 담당자 배정 드롭다운용 — 실제로는 회사 인사 DB에서 조회할 데이터를 team-members.json으로 하드코딩 대체 (테스트용, 후속 과제)
function getTeamMembers(id) {
  if (!teamMembersCache) {
    teamMembersCache = JSON.parse(fs.readFileSync(TEAM_MEMBERS_PATH, "utf-8"));
  }
  return teamMembersCache[id] || [];
}

// Chat 전송용 — 비밀값이라 getAllTeams()에는 포함하지 않고 이 함수로만 꺼낸다
function getWebhookUrl(id) {
  const config = readTeamConfig();
  return (config[id] && config[id].webhookUrl) || null;
}

// 관리자 페이지 트리 — 리프 노드에 hasConfig(키워드/웹훅 중 하나라도 등록됐는지) 플래그를 얹는다
function getOrgChartWithStatus() {
  const config = readTeamConfig();

  return mapOrgTree(readOrgChart(), (node) => {
    const teamConfig = config[node.id] || {};
    const hasConfig = Boolean((teamConfig.keywords && teamConfig.keywords.length) || teamConfig.webhookUrl);
    return { ...node, hasConfig };
  });
}

// 관리자 페이지 편집 폼이 쓰는 조회 — 웹훅은 마스킹된 미리보기만 내려준다
function getTeamConfig(id) {
  const config = readTeamConfig();
  const teamConfig = config[id] || {};
  return {
    keywords: teamConfig.keywords || [],
    description: teamConfig.description || "",
    hasWebhook: Boolean(teamConfig.webhookUrl),
    webhookPreview: teamConfig.webhookUrl ? `••••${teamConfig.webhookUrl.slice(-4)}` : null,
  };
}

// keywords/description/webhookUrl 중 전달된 값만 갱신 (webhookUrl 미전달 시 기존 값 유지 —
// 프론트가 마스킹된 값만 들고 있어서, 손대지 않은 필드를 실수로 지우지 않기 위함)
function saveTeamConfig(id, { keywords, description, webhookUrl }) {
  const config = readTeamConfig();
  const existing = config[id] || {};

  config[id] = {
    keywords: keywords !== undefined ? keywords : existing.keywords || [],
    description: description !== undefined ? description : existing.description || "",
    webhookUrl: webhookUrl !== undefined ? webhookUrl : existing.webhookUrl,
  };

  writeTeamConfig(config);
  return getTeamConfig(id);
}

module.exports = {
  getAllTeams,
  getTeamById,
  getTeamMembers,
  getWebhookUrl,
  getOrgChartWithStatus,
  getTeamConfig,
  saveTeamConfig,
};
