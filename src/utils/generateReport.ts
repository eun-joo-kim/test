import type { WorkbookData } from "@/hooks/useCloudSync";
import { dayFields, submissionFields } from "@/data/fields";
import { days } from "@/data/workbook";

// ─── 헬퍼 ────────────────────────────────────────────────────
function esc(str: string): string {
  return (str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`;
  return phone;
}

const DAY_COLORS = ["#7C3AED","#2563EB","#059669","#D97706","#DB2777"];
const DAY_BG     = ["#F5F3FF","#EFF6FF","#ECFDF5","#FFFBEB","#FDF2F8"];
const DAY_BORDER = ["#DDD6FE","#BFDBFE","#A7F3D0","#FDE68A","#FBCFE8"];

const EVAL_COLORS: Record<string, { bg: string; color: string }> = {
  "실제 업무적용": { bg: "#EDE9FC", color: "#7C3AED" },
  "구체성":        { bg: "#DBEAFE", color: "#1D4ED8" },
  "재사용 가능성": { bg: "#D1FAE5", color: "#065F46" },
  "효과 명확성":   { bg: "#FEF3C7", color: "#92400E" },
};

// ─── CSS ─────────────────────────────────────────────────────
function buildCSS(): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Noto Sans KR', -apple-system, sans-serif;
      font-size: 10pt;
      color: #1e1a3c;
      background: #f0f0f5;
      line-height: 1.6;
    }

    /* ── 화면 레이아웃 ── */
    .print-toolbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 999;
      background: linear-gradient(135deg, #5b47e0, #0ea5e9);
      padding: 12px 24px;
      display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    }
    .toolbar-left { display: flex; align-items: center; gap: 12px; }
    .toolbar-title { color: #fff; font-size: 14px; font-weight: 600; }
    .toolbar-sub   { color: rgba(255,255,255,0.7); font-size: 12px; }
    .btn-print {
      background: #fff; color: #5b47e0;
      border: none; border-radius: 10px;
      padding: 10px 24px; font-size: 13px; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; gap: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
      transition: all .15s;
    }
    .btn-print:hover { background: #f0edff; transform: translateY(-1px); }
    .btn-close {
      background: rgba(255,255,255,0.2); color: #fff;
      border: 1px solid rgba(255,255,255,0.3); border-radius: 10px;
      padding: 10px 20px; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: all .15s;
    }
    .btn-close:hover { background: rgba(255,255,255,0.3); }

    .page-wrapper {
      margin-top: 64px;
      padding: 24px;
      display: flex; flex-direction: column; align-items: center; gap: 20px;
    }

    /* ── A4 페이지 ── */
    .page {
      width: 210mm;
      min-height: 297mm;
      background: #fff;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12);
      border-radius: 4px;
      padding: 20mm 18mm 18mm 18mm;
      position: relative;
      page-break-after: always;
    }

    /* ── 표지 ── */
    .cover { display: flex; flex-direction: column; justify-content: center; min-height: 257mm; }
    .cover-header {
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 2px solid #5b47e0; padding-bottom: 16px; margin-bottom: 32px;
    }
    .cover-logo { font-size: 13pt; font-weight: 800; color: #1e3a8a; letter-spacing: 2px; }
    .cover-date { font-size: 9pt; color: #6b6890; }
    .cover-body { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 40px 0; }
    .cover-tag {
      display: inline-block;
      background: #ede9fc; color: #5b47e0;
      font-size: 9pt; font-weight: 600; padding: 5px 14px;
      border-radius: 100px; margin-bottom: 24px;
    }
    .cover-title {
      font-size: 24pt; font-weight: 800; color: #1e3a8a;
      line-height: 1.3; margin-bottom: 12px;
    }
    .cover-subtitle { font-size: 13pt; color: #6b6890; margin-bottom: 48px; }
    .cover-divider { border: none; border-top: 1px solid #e5e3f5; margin: 32px 0; }
    .cover-info-grid {
      display: grid; grid-template-columns: 80px 1fr 80px 1fr;
      gap: 10px 0; border: 1px solid #e5e3f5; border-radius: 10px;
      overflow: hidden; max-width: 400px;
    }
    .info-label { background: #f8f7ff; padding: 8px 12px; font-size: 9pt; font-weight: 600; color: #6b6890; }
    .info-value { background: #fff; padding: 8px 12px; font-size: 9pt; color: #1e1a3c; border-left: 1px solid #e5e3f5; }
    .cover-footer {
      position: absolute; bottom: 14mm; left: 18mm; right: 18mm;
      display: flex; justify-content: space-between; align-items: center;
      border-top: 1px solid #e5e3f5; padding-top: 10px;
    }
    .cover-footer-text { font-size: 8pt; color: #9ca3af; }

    /* ── 섹션 헤더 ── */
    .section-header {
      display: flex; align-items: center; gap: 12px;
      margin-bottom: 20px; padding-bottom: 12px;
      border-bottom: 2px solid currentColor;
    }
    .section-emoji { font-size: 22pt; }
    .section-day-badge {
      font-size: 8pt; font-weight: 700; padding: 3px 10px;
      border-radius: 100px; white-space: nowrap;
    }
    .section-title { font-size: 15pt; font-weight: 800; }
    .section-subtitle { font-size: 9pt; color: #6b6890; margin-top: 2px; }

    /* ── 미션 박스 ── */
    .mission-box {
      background: #f0f9ff; border-left: 3px solid #0ea5e9;
      border-radius: 0 8px 8px 0; padding: 10px 14px; margin-bottom: 18px;
    }
    .mission-label { font-size: 8pt; font-weight: 700; color: #0ea5e9; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
    .mission-title { font-size: 10pt; font-weight: 700; color: #1e1a3c; }

    /* ── 필드 ── */
    .field-block { margin-bottom: 16px; }
    .field-label { font-size: 9pt; font-weight: 700; color: #1e1a3c; margin-bottom: 6px; }
    .field-value {
      background: #f9fafb; border: 1px solid #e5e7eb;
      border-radius: 6px; padding: 10px 12px;
      font-size: 9pt; color: #1e1a3c; line-height: 1.7;
      min-height: 36px; word-break: break-all;
    }
    .field-empty { color: #9ca3af; font-style: italic; }

    /* ── 공모 양식 ── */
    .form-header {
      background: linear-gradient(135deg, #5b47e0, #0ea5e9);
      border-radius: 8px; padding: 16px 20px; margin-bottom: 20px; color: #fff;
    }
    .form-header-title { font-size: 14pt; font-weight: 800; margin-bottom: 4px; }
    .form-header-sub   { font-size: 9pt; color: rgba(255,255,255,0.8); }

    .submitter-table {
      width: 100%; border-collapse: collapse;
      border: 1px solid #e5e7eb; border-radius: 8px;
      overflow: hidden; margin-bottom: 20px; font-size: 9pt;
    }
    .submitter-table th { background: #f3f4f6; padding: 8px 12px; font-weight: 600; color: #6b7280; text-align: left; width: 80px; }
    .submitter-table td { padding: 8px 12px; border-left: 1px solid #e5e7eb; color: #1e1a3c; }
    .submitter-table tr { border-bottom: 1px solid #e5e7eb; }
    .submitter-table tr:last-child { border-bottom: none; }

    .q-block { margin-bottom: 18px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .q-header { background: #f8f7ff; padding: 10px 14px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 10px; }
    .q-num { background: #5b47e0; color: #fff; width: 22px; height: 22px; border-radius: 50%; font-size: 9pt; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .q-title { font-size: 10pt; font-weight: 600; color: #1e1a3c; flex: 1; }
    .q-tag { font-size: 8pt; font-weight: 600; padding: 2px 8px; border-radius: 100px; white-space: nowrap; }
    .q-body { padding: 12px 14px; }

    /* ── 페이지 번호 ── */
    .page-num { position: absolute; bottom: 10mm; right: 18mm; font-size: 8pt; color: #9ca3af; }

    /* ── 인쇄 스타일 ── */
    @media print {
      @page { size: A4; margin: 0; }

      body { background: #fff; }
      .print-toolbar { display: none !important; }
      .page-wrapper { margin-top: 0; padding: 0; gap: 0; background: #fff; }
      .page {
        box-shadow: none; border-radius: 0;
        width: 210mm; min-height: 297mm;
        page-break-after: always;
        break-after: page;
      }
      .page:last-child { page-break-after: avoid; break-after: avoid; }
    }
  `;
}

// ─── 표지 HTML ────────────────────────────────────────────────
function buildCoverHTML(data: WorkbookData, phone: string): string {
  const { userInfo, completedDays } = data;
  const now = new Date();
  const dateStr = now.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  return `
  <div class="page">
    <div class="cover">
      <div class="cover-header">
        <div class="cover-logo">NICE GROUP</div>
        <div class="cover-date">작성일: ${dateStr}</div>
      </div>
      <div class="cover-body">
        <div>
          <span class="cover-tag">⚡ NASA Discovery Workbook</span>
        </div>
        <div class="cover-title">5일 만에 끝내는<br>실무 AI 내재화 프로젝트</div>
        <div class="cover-subtitle">회사의 생산성을 높이는 ChatGPT 활용법</div>

        <div class="cover-info-grid">
          <div class="info-label">이름</div>
          <div class="info-value">${esc(userInfo.name) || "-"}</div>
          <div class="info-label">부서</div>
          <div class="info-value">${esc(userInfo.dept) || "-"}</div>
          <div class="info-label">직급</div>
          <div class="info-value">${esc(userInfo.rank) || "-"}</div>
          <div class="info-label">연락처</div>
          <div class="info-value">${formatPhone(phone) || esc(userInfo.email) || "-"}</div>
        </div>

        <hr class="cover-divider">

        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          ${[1,2,3,4,5].map(d => `
            <div style="display:flex;align-items:center;gap:6px;background:${completedDays.includes(d) ? DAY_BG[d-1] : "#f9fafb"};border:1px solid ${completedDays.includes(d) ? DAY_BORDER[d-1] : "#e5e7eb"};border-radius:8px;padding:6px 12px;">
              <span style="font-size:11pt;">${days[d-1].emoji}</span>
              <span style="font-size:9pt;font-weight:600;color:${completedDays.includes(d) ? DAY_COLORS[d-1] : "#9ca3af"}">Day ${d}</span>
              <span style="font-size:9pt;color:${completedDays.includes(d) ? "#059669" : "#9ca3af"}">${completedDays.includes(d) ? "✓" : "○"}</span>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
    <div class="cover-footer">
      <span class="cover-footer-text">본 문서는 NICE그룹 AI 내재화 교육 프로그램의 일환으로 작성되었습니다.</span>
      <span class="cover-footer-text">1</span>
    </div>
  </div>`;
}

// ─── Day 섹션 HTML ────────────────────────────────────────────
function buildDayHTML(dayNum: number, dayData: Record<string, string>, pageNum: number): string {
  const mission  = days[dayNum - 1];
  const fields   = dayFields.find(d => d.day === dayNum)!.fields;
  const color    = DAY_COLORS[dayNum - 1];
  const bg       = DAY_BG[dayNum - 1];
  const border   = DAY_BORDER[dayNum - 1];

  const fieldsHTML = fields.map(field => {
    const value = dayData[field.id] ?? "";
    return `
      <div class="field-block">
        <div class="field-label">${esc(field.label.replace(/✱\s*/, ""))}</div>
        <div class="field-value ${!value.trim() ? "field-empty" : ""}">
          ${value.trim() ? esc(value) : "(미작성)"}
        </div>
      </div>`;
  }).join("");

  return `
  <div class="page">
    <div class="section-header" style="color:${color};border-color:${color};">
      <span class="section-emoji">${mission.emoji}</span>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="section-day-badge" style="background:${bg};color:${color};border:1px solid ${border}">Day ${dayNum}</span>
          <span style="font-size:9pt;color:#6b6890">${mission.subtitle}</span>
        </div>
        <div class="section-title" style="color:${color}">${esc(mission.title)}</div>
      </div>
    </div>

    <div class="mission-box">
      <div class="mission-label">✔ 오늘의 미션</div>
      <div class="mission-title">${esc(mission.missionTitle)}</div>
    </div>

    ${fieldsHTML}

    <div class="page-num">${pageNum}</div>
  </div>`;
}

// ─── 공모 양식 HTML ───────────────────────────────────────────
function buildSubmissionHTML(data: WorkbookData, startPage: number): string {
  const { userInfo, submission } = data;

  const qItems = submissionFields.map((field, i) => {
    const value = submission[field.id] ?? "";
    const tagStyle = EVAL_COLORS[field.evalTag] ?? { bg: "#f3f4f6", color: "#6b7280" };
    return `
      <div class="q-block">
        <div class="q-header">
          <div class="q-num">${i + 1}</div>
          <div class="q-title">${esc(field.label)}</div>
          <span class="q-tag" style="background:${tagStyle.bg};color:${tagStyle.color}">${field.evalTag}</span>
        </div>
        <div class="q-body">
          <div class="field-value ${!value.trim() ? "field-empty" : ""}">
            ${value.trim() ? esc(value) : "(미작성)"}
          </div>
        </div>
      </div>`;
  }).join("");

  return `
  <div class="page">
    <div class="form-header">
      <div class="form-header-title">🏆 NASA 디스커버리 업무 활용 사례 공모 양식</div>
      <div class="form-header-sub">업무 적용 후 실제 성과 지표와 함께 아래 내용을 작성하여 제출해 주세요.</div>
    </div>

    <table class="submitter-table">
      <tr>
        <th>이름</th><td>${esc(userInfo.name) || "-"}</td>
        <th>부서</th><td>${esc(userInfo.dept) || "-"}</td>
      </tr>
      <tr>
        <th>직급</th><td>${esc(userInfo.rank) || "-"}</td>
        <th>이메일</th><td>${esc(userInfo.email) || "-"}</td>
      </tr>
    </table>

    <div style="margin-bottom:14px;">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        ${Object.entries(EVAL_COLORS).map(([tag, c]) =>
          `<span style="font-size:8pt;font-weight:600;padding:3px 10px;border-radius:100px;background:${c.bg};color:${c.color}">✓ ${tag}</span>`
        ).join("")}
      </div>
    </div>

    ${qItems}

    <div class="page-num">${startPage}</div>
  </div>`;
}

// ─── 메인: HTML 문서 생성 후 새 창에서 인쇄 ─────────────────
export function printWorkbookReport(data: WorkbookData, phone: string): void {
  const coverHTML      = buildCoverHTML(data, phone);
  const day1HTML       = buildDayHTML(1, data.days[1] ?? {}, 2);
  const day2HTML       = buildDayHTML(2, data.days[2] ?? {}, 3);
  const day3HTML       = buildDayHTML(3, data.days[3] ?? {}, 4);
  const day4HTML       = buildDayHTML(4, data.days[4] ?? {}, 5);
  const day5HTML       = buildDayHTML(5, data.days[5] ?? {}, 6);
  const submissionHTML = buildSubmissionHTML(data, 7);

  const fullHTML = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NASA Discovery 워크북</title>
  <style>${buildCSS()}</style>
</head>
<body>
  <div class="print-toolbar">
    <div class="toolbar-left">
      <div>
        <div class="toolbar-title">📄 NASA Discovery 워크북</div>
        <div class="toolbar-sub">아래 '인쇄하기' 버튼을 누르거나, Ctrl+P (Mac: ⌘+P) 를 눌러 인쇄하세요</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;">
      <button class="btn-close" onclick="window.close()">✕ 닫기</button>
      <button class="btn-print" onclick="window.print()">🖨️ 인쇄 / PDF 저장</button>
    </div>
  </div>

  <div class="page-wrapper">
    ${coverHTML}
    ${day1HTML}
    ${day2HTML}
    ${day3HTML}
    ${day4HTML}
    ${day5HTML}
    ${submissionHTML}
  </div>

  <script>
    // 인쇄 대화상자 자동으로 열기 (선택적)
    // window.addEventListener('load', () => setTimeout(() => window.print(), 500));
  </script>
</body>
</html>`;

  const blob = new Blob([fullHTML], { type: "text/html;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, "_blank");
  if (!win) {
    alert("팝업이 차단되었습니다. 브라우저에서 팝업 허용 후 다시 시도해 주세요.");
  }
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
