// "내 문의 목록"/"문의 상세"가 공유하는 상태 표시 로직 — 관리자 데모 섹션을 대체한 읽기 전용 상태 조회.

const FAIL_REASON_LABELS = {
  no_candidate: "관련 팀 없음",
  low_confidence: "확신도 낮음",
};

function labelFailReason(code) {
  return FAIL_REASON_LABELS[code] || code;
}

// 목록 화면에서 한 줄로 보여줄 요약
export function summaryLabel(inquiry) {
  if (inquiry.matchFailed) return "담당자 배정 대기중";
  if (!inquiry.completedAt) return `처리중 (담당팀: ${inquiry.matchedTeam})`;
  if (!inquiry.surveyReady) return "처리 완료 (설문 발송 대기)";
  if (!inquiry.survey.answeredAt) return "처리 완료 (설문 응답 대기)";
  return "처리 완료 (설문 제출 완료)";
}

// 상세 화면에서 보여줄 상태 설명 줄들
export function statusDetails(inquiry) {
  const lines = [];

  if (inquiry.matchFailed) {
    lines.push(
      `매칭 실패 (사유: ${labelFailReason(inquiry.failReason)}) — 담당자가 확인 후 팀을 배정할 예정입니다.`
    );
  } else {
    lines.push(`매칭 팀: ${inquiry.matchedTeam} (신뢰도 ${(inquiry.matchConfidence * 100).toFixed(0)}%)`);
    if (inquiry.matchReason) {
      lines.push(`AI 판단 근거: ${inquiry.matchReason}`);
    }
    if (inquiry.assignedManually) {
      lines.push("관리자가 수동으로 배정한 건입니다.");
    }
    lines.push(
      inquiry.assigneeName
        ? `담당자: ${inquiry.assigneeName} (${new Date(inquiry.assigneeAssignedAt).toLocaleString()} 지정)`
        : "담당자: 미지정"
    );
    lines.push(
      inquiry.chatSendError
        ? `팀 전달 실패: ${inquiry.chatSendError}`
        : inquiry.chatSentAt
          ? `팀 전달 완료 (${new Date(inquiry.chatSentAt).toLocaleString()})`
          : "팀 전달 대기중"
    );
    lines.push(
      inquiry.completedAt
        ? `처리 완료 (${new Date(inquiry.completedAt).toLocaleString()})`
        : "처리 진행중"
    );
    if (inquiry.completedAt) {
      if (!inquiry.surveyReady) {
        lines.push("만족도 설문: 관리자 발송 확정 대기중");
      } else if (!inquiry.survey.answeredAt) {
        lines.push("만족도 설문: 발송 확정됨 — 문의게시판 재접속 시 팝업으로 안내됩니다.");
      } else {
        lines.push(`만족도 설문: 제출 완료 (${new Date(inquiry.survey.answeredAt).toLocaleString()})`);
      }
    }
  }

  return lines;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// 문의 전체 생명주기 로그(statusLog)를 상세 화면에 그대로 보여주기 위한 HTML — admin-detail.js/my-inquiry-detail.js 공용
export function renderStatusLogHtml(inquiry) {
  const log = inquiry.statusLog || [];
  if (!log.length) return "<p>기록된 이력이 없습니다.</p>";

  const items = log
    .map(
      (entry) =>
        `<li><span class="status-log-time">${new Date(entry.at).toLocaleString()}</span> — ${escapeHtml(entry.detail)}</li>`
    )
    .join("");

  return `<ul class="status-log">${items}</ul>`;
}
