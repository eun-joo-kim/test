import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType, PageBreak,
} from "docx";
import type { WorkbookData } from "@/hooks/useCloudSync";
import { dayFields, submissionFields } from "@/data/fields";
import { days } from "@/data/workbook";

// ─── 브라우저 네이티브 다운로드 ──────────────────────────────
function downloadBlob(blob: Blob, filename: string) {
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ─── 색상 ───────────────────────────────────────────────────
const C = {
  primary: "1E3A8A", accent: "0EA5E9",
  day1: "7C3AED", day2: "2563EB", day3: "059669", day4: "D97706", day5: "DB2777",
  muted: "6B7280", white: "FFFFFF", black: "1E1A3C", gray: "9CA3AF",
};
const dayColor = (d: number) => [C.day1,C.day2,C.day3,C.day4,C.day5][d-1] ?? C.primary;

// ─── 헬퍼 ───────────────────────────────────────────────────
const gap = (after = 200) => new Paragraph({ spacing: { before: 0, after }, children: [] });

const h1 = (text: string, color = C.primary) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 160 },
    children: [new TextRun({ text, color, bold: true, size: 40 })],
  });

const h2 = (text: string) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 120 },
    children: [new TextRun({ text, bold: true, size: 28, color: C.black })],
  });

const body = (text: string, color = C.black, size = 22) =>
  new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size, color })],
  });

const fieldLabel = (text: string, color = C.primary) =>
  new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, size: 22, color })],
  });

function answerBox(value: string): Table {
  const lines = (value || "").trim().split("\n");
  const rowChildren = lines.length > 0 && lines[0] !== ""
    ? lines.map(line =>
        new Paragraph({
          spacing: { before: 0, after: 60 },
          indent: { left: 180 },
          children: [new TextRun({ text: line || " ", size: 21, color: C.black })],
        })
      )
    : [new Paragraph({
        indent: { left: 180 },
        children: [new TextRun({ text: "(미작성)", size: 21, color: C.gray, italics: true })],
      })];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top:              { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
      bottom:           { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
      left:             { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
      right:            { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
      insideHorizontal: { style: BorderStyle.NONE,   size: 0, color: "FFFFFF" },
      insideVertical:   { style: BorderStyle.NONE,   size: 0, color: "FFFFFF" },
    },
    rows: [new TableRow({
      children: [new TableCell({
        shading: { type: ShadingType.SOLID, color: "F9FAFB", fill: "F9FAFB" },
        margins: { top: 140, bottom: 140, left: 180, right: 180 },
        children: rowChildren,
      })],
    })],
  });
}

const divider = () =>
  new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" } },
    children: [],
  });

// ─── 커버 페이지 ─────────────────────────────────────────────
function buildCover(info: WorkbookData["userInfo"]): (Paragraph | Table)[] {
  const items: (Paragraph | Table)[] = [
    gap(1200),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 160 },
      children: [new TextRun({ text: "NICE GROUP", bold: true, size: 28, color: C.muted, characterSpacing: 300 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
      children: [new TextRun({ text: "5일 만에 끝내는 실무 AI 내재화 프로젝트", bold: true, size: 52, color: C.primary })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 600 },
      children: [new TextRun({ text: "회사의 생산성을 높이는 ChatGPT 활용법", size: 26, color: C.muted })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 80 },
      children: [new TextRun({ text: "NASA Discovery Workbook", bold: true, size: 24, color: C.accent })],
    }),
    gap(800),
  ];

  if (info.name) {
    items.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: [info.dept, info.rank, info.name].filter(Boolean).join("  |  "), size: 24, color: C.black })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 60 },
        children: [new TextRun({ text: info.email || "", size: 22, color: C.muted })],
      }),
    );
  }

  items.push(new Paragraph({ children: [new PageBreak()] }));
  return items;
}

// ─── Day 섹션 ─────────────────────────────────────────────────
function buildDay(dayNum: number, dayData: Record<string, string>): (Paragraph | Table)[] {
  const mission = days.find(d => d.day === dayNum)!;
  const fields  = dayFields.find(d => d.day === dayNum)!.fields;
  const color   = dayColor(dayNum);

  const items: (Paragraph | Table)[] = [
    h1(`Day ${dayNum}  ${mission.emoji}  ${mission.title}`, color),
    body(mission.description, C.muted, 21),
    gap(80),
    new Paragraph({
      spacing: { before: 120, after: 80 },
      border: { left: { style: BorderStyle.SINGLE, size: 20, color: C.accent } },
      indent: { left: 180, right: 180 },
      shading: { type: ShadingType.SOLID, color: "EFF6FF", fill: "EFF6FF" },
      children: [
        new TextRun({ text: "✔ 오늘의 미션  |  ", bold: true, color: C.accent, size: 22 }),
        new TextRun({ text: mission.missionTitle, bold: true, color: C.black, size: 22 }),
      ],
    }),
    body(mission.missionDesc, C.muted),
    gap(100),
  ];

  fields.forEach(field => {
    items.push(fieldLabel(field.label, color), answerBox(dayData[field.id] ?? ""));
  });

  items.push(divider(), new Paragraph({ children: [new PageBreak()] }));
  return items;
}

// ─── 공모 양식 섹션 ──────────────────────────────────────────
function buildSubmission(info: WorkbookData["userInfo"], sub: Record<string, string>): (Paragraph | Table)[] {
  const tagColor: Record<string, string> = {
    "실제 업무적용": C.day1, "구체성": C.day2,
    "재사용 가능성": C.day3, "효과 명확성": C.day4,
  };
  const borderOpts = {
    top:              { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
    bottom:           { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
    left:             { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
    right:            { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
    insideVertical:   { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
  };

  const cell = (text: string, isHeader = false) =>
    new TableCell({
      margins: { top: 100, bottom: 100, left: 160, right: 160 },
      shading: isHeader ? { type: ShadingType.SOLID, color: "F3F4F6", fill: "F3F4F6" } : undefined,
      children: [new Paragraph({ children: [new TextRun({ text: text || "-", size: 22, bold: isHeader })] })],
    });

  const items: (Paragraph | Table)[] = [
    h1("NASA 디스커버리 업무 활용 사례 공모 양식", C.primary),
    body("업무에 일정 기간 적용한 뒤, 실제 성과 지표와 함께 아래 내용을 작성하여 제출해 주세요.", C.muted),
    gap(160),
    h2("제출자 정보"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borderOpts,
      rows: [
        new TableRow({ children: [cell("이름", true), cell(info.name), cell("부서", true), cell(info.dept)] }),
        new TableRow({ children: [cell("직급", true), cell(info.rank), cell("이메일", true), cell(info.email)] }),
      ],
    }),
    gap(200),
  ];

  submissionFields.forEach((field, i) => {
    const tc = tagColor[field.evalTag] ?? C.primary;
    items.push(
      new Paragraph({
        spacing: { before: 280, after: 80 },
        children: [
          new TextRun({ text: `Q${i + 1}.  `, bold: true, size: 26, color: tc }),
          new TextRun({ text: field.label, bold: true, size: 26, color: C.black }),
          new TextRun({ text: `  [${field.evalTag}]`, size: 20, color: tc }),
        ],
      }),
      answerBox(sub[field.id] ?? ""),
      gap(80),
    );
  });

  return items;
}

// ─── 메인 export ─────────────────────────────────────────────
export async function generateWorkbookDocx(data: WorkbookData): Promise<void> {
  const children: (Paragraph | Table)[] = [
    ...buildCover(data.userInfo),
    ...buildDay(1, data.days[1] ?? {}),
    ...buildDay(2, data.days[2] ?? {}),
    ...buildDay(3, data.days[3] ?? {}),
    ...buildDay(4, data.days[4] ?? {}),
    ...buildDay(5, data.days[5] ?? {}),
    ...buildSubmission(data.userInfo, data.submission ?? {}),
  ];

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "맑은 고딕", size: 22 } },
      },
    },
    sections: [{
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      children,
    }],
  });

  try {
    // ✅ 브라우저 호환 방식: toBase64String → Uint8Array → Blob
    const base64 = await Packer.toBase64String(doc);
    const binary  = atob(base64);
    const bytes   = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const now  = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}`;
    const name = data.userInfo.name ? `_${data.userInfo.name}` : "";
    downloadBlob(blob, `NICE_AI워크북${name}_${date}.docx`);

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[generateDoc] 실패:", msg);
    alert(`Word 파일 생성 실패: ${msg}`);
    throw err;
  }
}
