// 각 Day별 사용자 작성 필드 정의

export interface WorkbookField {
  id: string;
  label: string;
  placeholder: string;
  rows: number;
  required?: boolean;
}

export interface DayFields {
  day: number;
  fields: WorkbookField[];
}

export const dayFields: DayFields[] = [
  {
    day: 1,
    fields: [
      {
        id: "goal",
        label: "💬 강의 당일 설정한 나의 목표",
        placeholder: "예) 매주 반복되는 ○○ 업무에 AI를 활용하여 작성 시간을 단축하고, 품질을 높인다.",
        rows: 3,
        required: true,
      },
      {
        id: "asis",
        label: "📌 As-Is: 현재 상태 (지금 이 업무에 얼마나 시간/노력이 드나요?)",
        placeholder: "• ○○ 업무 소요 시간: 약 __시간\n• 주요 어려움: \n• 오류/반복 발생 빈도: ",
        rows: 5,
        required: true,
      },
      {
        id: "tobe",
        label: "🎯 To-Be: 목표 상태 (AI 활용 후 달성하고 싶은 수치)",
        placeholder: "• ○○ 업무 소요 시간: __시간 이내\n• 오류 발생 건수: 0건\n• 기타 개선 목표: ",
        rows: 4,
        required: true,
      },
      {
        id: "measurement",
        label: "📏 측정 방법 (Day 4에서 어떻게 비교할 건가요?)",
        placeholder: "예) Day 4에서 실제 업무 수행 후 소요 시간을 타이머로 측정하여 위 수치와 비교한다.",
        rows: 3,
      },
    ],
  },
  {
    day: 2,
    fields: [
      {
        id: "before_process",
        label: "🔄 기존 업무 처리 방식 (Before) — 단계별로 적어보세요",
        placeholder: "[1단계] — 소요: \n[2단계] — 소요: \n[3단계] — 소요: \n→ 합계 총 소요: ",
        rows: 6,
        required: true,
      },
      {
        id: "problems",
        label: "⚠️ 한계점 및 문제점",
        placeholder: "• \n• \n• ",
        rows: 4,
        required: true,
      },
      {
        id: "after_plan",
        label: "✨ AI 활용 방안 (After) — 어떻게 바꿀 건가요?",
        placeholder: "• \n• \n예상 소요 시간: ",
        rows: 4,
        required: true,
      },
      {
        id: "prompt",
        label: "📝 설계한 프롬프트 (6대 요소: 역할/지시문/맥락/출력형식/제한조건/톤)",
        placeholder: "#역할: \n#지시문: \n#맥락: \n#출력 형식: \n#제한 조건: \n#톤앤매너: ",
        rows: 8,
        required: true,
      },
    ],
  },
  {
    day: 3,
    fields: [
      {
        id: "ai_output",
        label: "🤖 AI가 생성한 결과물 (초안 전체 또는 핵심 부분을 붙여넣으세요)",
        placeholder: "ChatGPT / Claude 등에서 생성된 결과물을 그대로 붙여넣으세요.\n\n---\n\n",
        rows: 10,
        required: true,
      },
      {
        id: "time_taken",
        label: "⏱️ 생성 소요 시간",
        placeholder: "예) 약 3분 / 총 2번 시도, 합계 약 10분",
        rows: 2,
      },
      {
        id: "first_impression",
        label: "💭 첫인상 및 소감 (솔직하게!)",
        placeholder: "생각보다 잘 됐나요? 아니면 예상과 달랐나요? 솔직한 첫인상을 기록하세요.",
        rows: 4,
        required: true,
      },
      {
        id: "improvements",
        label: "🔧 아쉬웠던 점 (Day 4에서 개선할 내용)",
        placeholder: "• \n• \n• ",
        rows: 4,
      },
    ],
  },
  {
    day: 4,
    fields: [
      {
        id: "revision_process",
        label: "✏️ 수정 및 보완 과정 (AI 초안을 어떻게 다듬었나요?)",
        placeholder: "• \n• \n• ",
        rows: 5,
        required: true,
      },
      {
        id: "my_tip",
        label: "⭐ 나만의 팁 (이 방법으로 더 잘 되더라!)",
        placeholder: "예) '위 내용을 유지하되, ○○만 바꿔줘' 방식이 전체 재작성보다 훨씬 빠르고 정확했다.",
        rows: 3,
      },
      {
        id: "quantitative",
        label: "📊 정량적 효과 — Day 1 지표 대비 실제 달성 수치",
        placeholder: "• 목표: __ → 실제: __ (✅/❌)\n• 총 작업 시간: 기존 __분 → __분 (약 __%  단축)\n• 오류 건수: __건 → __건",
        rows: 5,
        required: true,
      },
      {
        id: "qualitative",
        label: "💬 정성적 효과 (숫자 외에 느낀 변화)",
        placeholder: "• \n• \n• ",
        rows: 4,
        required: true,
      },
    ],
  },
  {
    day: 5,
    fields: [
      {
        id: "retrospective",
        label: "🔍 5일간의 경험 종합 회고",
        placeholder: "• 가장 인상적이었던 순간:\n• 예상보다 어려웠던 점:\n• 가장 큰 배움:\n• 한 줄 소감: ",
        rows: 6,
        required: true,
      },
      {
        id: "reusable_form",
        label: "♻️ 재사용 가능한 형태로 구현 (어떻게 저장/정리했나요?)",
        placeholder: "예) GPTs 제작 완료 / Custom Instructions 등록 / 팀 공유 문서 작성\n\n구체적인 내용: ",
        rows: 4,
      },
      {
        id: "expansion_plan",
        label: "📈 확장 및 개선 계획",
        placeholder: "• 다음에 적용할 업무: \n• 개선하고 싶은 부분: \n• 목표 시기: ",
        rows: 4,
      },
      {
        id: "team_spread",
        label: "🤝 팀 내 확산 방안",
        placeholder: "예) 팀 내 공유 세션 진행 예정 / 프롬프트 템플릿 팀 드라이브 업로드\n\n구체적인 계획: ",
        rows: 3,
      },
    ],
  },
];

// NASA 디스커버리 공모 양식 필드
export interface FormField {
  id: string;
  label: string;
  placeholder: string;
  rows: number;
  evalTag: string;
}

export const submissionFields: FormField[] = [
  {
    id: "q1_review",
    label: "Q1. 실제 업무 적용 후기",
    placeholder: "AI를 실제 업무에 적용하면서 느낀 점, 달라진 점, 인상적이었던 순간 등을 자유롭게 작성해 주세요.",
    rows: 5,
    evalTag: "실제 업무적용",
  },
  {
    id: "q2_specific",
    label: "Q2. 구체성: 교육내용 업무활용 목표 정의",
    placeholder: "어떤 업무에, 어떤 AI 기능을, 어떤 방식으로 적용했는지 구체적으로 설명해 주세요. Day 2에서 설계한 프롬프트와 활용 시나리오를 포함하면 더욱 좋습니다.",
    rows: 6,
    evalTag: "구체성",
  },
  {
    id: "q3_reuse",
    label: "Q3. 재사용/확장성: 구현의 형태",
    placeholder: "이번에 만든 프롬프트나 활용 방법을 어떤 형태로 저장/공유했나요? (예: GPTs 제작, Custom Instructions 등록, 팀 공유 문서화 등)",
    rows: 5,
    evalTag: "재사용 가능성",
  },
  {
    id: "q4_effect",
    label: "Q4. 효과: 업무효율 개선 지표",
    placeholder: "Day 1에서 설정한 지표 대비 실제 달성 수치를 기록해 주세요. (예: 목표 1일 이내 → 실제 55분 달성, 93% 시간 단축)",
    rows: 5,
    evalTag: "효과 명확성",
  },
];
