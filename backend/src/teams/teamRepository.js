// 팀 데이터의 단일 창구 (체크리스트 Phase 12-2).
// 조직도(org-chart.json, git 추적 — "회사 DB에서 조회 가능"하지만 지금은 JSON 스켈레톤으로 대체, 후속 14-7)와
// 팀별 운영 설정(team-config.json, git 미추적 — 키워드/설명/웹훅 URL)을 병합해서 제공한다.
// 기존에 여러 파일이 각자 teams-seed.json을 직접 require하던 걸 이 모듈 하나로 교체했다.

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const ORG_CHART_PATH = path.join(DATA_DIR, "org-chart.json");
const TEAM_CONFIG_PATH = path.join(DATA_DIR, "team-config.json");

function readOrgChart() {
  return JSON.parse(fs.readFileSync(ORG_CHART_PATH, "utf-8"));
}

function readTeamConfig() {
  if (!fs.existsSync(TEAM_CONFIG_PATH)) return {};
  return JSON.parse(fs.readFileSync(TEAM_CONFIG_PATH, "utf-8"));
}

function writeTeamConfig(config) {
  fs.writeFileSync(TEAM_CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

function flattenLeaves(node, acc = []) {
  if (node.isTeam) acc.push(node);
  if (node.children) node.children.forEach((child) => flattenLeaves(child, acc));
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

// Chat 전송용 — 비밀값이라 getAllTeams()에는 포함하지 않고 이 함수로만 꺼낸다
function getWebhookUrl(id) {
  const config = readTeamConfig();
  return (config[id] && config[id].webhookUrl) || null;
}

// 관리자 페이지 트리 — 리프 노드에 hasConfig(키워드/웹훅 중 하나라도 등록됐는지) 플래그를 얹는다
function getOrgChartWithStatus() {
  const config = readTeamConfig();

  function annotate(node) {
    if (node.isTeam) {
      const teamConfig = config[node.id] || {};
      const hasConfig = Boolean((teamConfig.keywords && teamConfig.keywords.length) || teamConfig.webhookUrl);
      return { ...node, hasConfig };
    }
    if (node.children) return { ...node, children: node.children.map(annotate) };
    return node;
  }

  return annotate(readOrgChart());
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
  getWebhookUrl,
  getOrgChartWithStatus,
  getTeamConfig,
  saveTeamConfig,
};
