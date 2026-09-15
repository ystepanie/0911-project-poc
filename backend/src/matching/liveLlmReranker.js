// 2단계 LLM 재판단 — 실제 Anthropic Claude API 호출 (체크리스트 후속 과제였던 14-2 실 연동).
// MockLlmReranker와 동일한 인터페이스(rerank(text, candidates))를 유지해서, 호출부(matching/index.js)는
// 어떤 재판단기를 쓰는지 몰라도 되게 한다. API 호출이 실패하면 MockLlmReranker로 폴백한다.
//
// 문의 원문이 여기서 실제로 회사 밖(Anthropic)으로 나가므로, 프롬프트에 넣기 전 정형 개인정보를
// maskSensitiveInfo로 마스킹한다 (자유 서술형 개인정보는 여전히 못 잡음 — 3.3절 안내 문구가 1차 방어선).

const Anthropic = require("@anthropic-ai/sdk");
const teamRepository = require("../teams/teamRepository");
const mockLlmReranker = require("./llmReranker");
const { maskSensitiveInfo } = require("../security/maskSensitiveInfo");
const { CONFIDENCE_THRESHOLD, deriveFailure } = require("./rerankResult");

const MODEL = "claude-haiku-4-5-20251001"; // 후보 3~5개 중 하나를 고르는 짧은 분류 작업이라 가벼운 모델로 충분
const MATCHER_MODE = "llm_live";

let client = null;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

const SELECT_TEAM_TOOL = {
  name: "select_team",
  description: "후보 팀 중 이 문의를 처리해야 할 팀을 하나 선택하고 확신도를 매긴다.",
  input_schema: {
    type: "object",
    properties: {
      teamId: { type: "integer", description: "선택한 팀의 id" },
      confidence: { type: "number", description: "0과 1 사이의 확신도. 애매하면 낮게 준다." },
      reason: { type: "string", description: "왜 이 팀을 골랐는지 한 문장 이유" },
    },
    required: ["teamId", "confidence", "reason"],
  },
};

function buildPrompt(maskedText, candidates) {
  const candidateLines = candidates
    .map((c) => {
      const team = teamRepository.getTeamById(c.teamId);
      const description = team?.description || "(등록된 설명 없음)";
      return `- id=${c.teamId}, 이름="${c.teamName}", 담당 업무 설명="${description}"`;
    })
    .join("\n");

  return [
    "다음은 사내 문의 게시판에 올라온 문의입니다.",
    `문의 내용: "${maskedText}"`,
    "",
    "아래는 키워드 매칭으로 추려진 후보 팀 목록입니다. 이 중 문의를 처리해야 할 팀을 하나만 골라주세요.",
    candidateLines,
  ].join("\n");
}

// interface LlmReranker { rerank(text, candidates): Promise<{ teamId, teamName, confidence, reason, failed, failReason, matcherMode }> }
async function rerank(text, candidates) {
  try {
    const maskedText = maskSensitiveInfo(text);
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 300,
      temperature: 0,
      tools: [SELECT_TEAM_TOOL],
      tool_choice: { type: "tool", name: "select_team" },
      messages: [{ role: "user", content: buildPrompt(maskedText, candidates) }],
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse) throw new Error("응답에서 구조화 출력을 찾지 못했습니다.");

    const { teamId, confidence, reason } = toolUse.input;
    const matched = candidates.find((c) => c.teamId === teamId);
    if (!matched) throw new Error(`LLM이 후보에 없는 teamId(${teamId})를 반환했습니다.`);

    return {
      teamId: matched.teamId,
      teamName: matched.teamName,
      confidence,
      reason,
      ...deriveFailure(confidence),
      matcherMode: MATCHER_MODE,
    };
  } catch (err) {
    console.error(`[LiveLlmReranker] 호출 실패, Mock으로 폴백: ${err.message}`);
    return mockLlmReranker.rerank(text, candidates);
  }
}

module.exports = { rerank, MATCHER_MODE, CONFIDENCE_THRESHOLD };
