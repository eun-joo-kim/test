import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { days, processSteps, mindsetItems, promptGuide } from "@/data/workbook";
import { dayFields, submissionFields } from "@/data/fields";
import { useCloudSync } from "@/hooks/useCloudSync";
import { printWorkbookReport } from "@/utils/generateReport";
import LoginModal from "@/components/LoginModal";
import {
  ChevronDown, ChevronUp, BookOpen, Target, Lightbulb, Trophy,
  CheckCircle2, FileText, Star, BarChart3, Download,
  CheckCheck, Pencil, Cloud, RefreshCw, CloudOff, LogOut,
} from "lucide-react";

const dayColors: Record<number, { bg: string; border: string; badge: string; accent: string }> = {
  1: { bg: "from-violet-500/10 to-purple-500/10", border: "border-violet-200", badge: "bg-violet-100 text-violet-700", accent: "text-violet-600" },
  2: { bg: "from-blue-500/10 to-cyan-500/10",     border: "border-blue-200",   badge: "bg-blue-100 text-blue-700",     accent: "text-blue-600"   },
  3: { bg: "from-emerald-500/10 to-teal-500/10",  border: "border-emerald-200",badge: "bg-emerald-100 text-emerald-700",accent: "text-emerald-600"},
  4: { bg: "from-amber-500/10 to-orange-500/10",  border: "border-amber-200",  badge: "bg-amber-100 text-amber-700",   accent: "text-amber-600"  },
  5: { bg: "from-rose-500/10 to-pink-500/10",     border: "border-rose-200",   badge: "bg-rose-100 text-rose-700",     accent: "text-rose-600"   },
};

const dayAccentBg: Record<number, string> = {
  1: "bg-violet-600", 2: "bg-blue-600", 3: "bg-emerald-600", 4: "bg-amber-600", 5: "bg-rose-600",
};

const evalTagColors: Record<string, string> = {
  "실제 업무적용": "bg-violet-100 text-violet-700",
  "구체성":        "bg-blue-100 text-blue-700",
  "재사용 가능성": "bg-emerald-100 text-emerald-700",
  "효과 명확성":   "bg-amber-100 text-amber-700",
};

// ─── 저장 상태 배지 ──────────────────────────────────────────
// ─── 작성 영역 (Textarea) ───────────────────────────────────
function WriteArea({
  label, placeholder, rows, value, onChange, accent = "focus:border-primary",
}: {
  label: string; placeholder: string; rows: number;
  value: string; onChange: (v: string) => void; accent?: string;
}) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-foreground mb-2">{label}</label>
      <textarea
        className={`w-full px-4 py-3 text-sm text-foreground bg-background border border-border rounded-xl resize-y leading-relaxed
          placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 ${accent}
          transition-colors`}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

// ─── Day 진행 표시 도넛 ──────────────────────────────────────
function DayProgressRing({ pct, color }: { pct: number; color: string }) {
  const r = 14; const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" className="flex-shrink-0">
      <circle cx="18" cy="18" r={r} fill="none" stroke="#e5e7eb" strokeWidth="3" />
      <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform="rotate(-90 18 18)" />
      <text x="18" y="22" textAnchor="middle" fontSize="9" fontWeight="700" fill={color}>{pct}%</text>
    </svg>
  );
}

// ─── 동기화 상태 뱃지 ────────────────────────────────────────
function SyncBadge({ status, lastSaved }: { status: string; lastSaved: string | null }) {
  if (status === "saving")  return <span className="flex items-center gap-1 text-xs text-white/60"><RefreshCw className="w-3 h-3 animate-spin" />저장 중...</span>;
  if (status === "saved")   return <span className="flex items-center gap-1 text-xs text-emerald-300"><Cloud className="w-3 h-3" />저장됨 ✓</span>;
  if (status === "error")   return <span className="flex items-center gap-1 text-xs text-red-300"><CloudOff className="w-3 h-3" />저장 오류</span>;
  return lastSaved ? <span className="text-xs text-white/40">{lastSaved}</span> : null;
}

const dayRingColor = ["#7C3AED","#2563EB","#059669","#D97706","#DB2777"];

// ─── 메인 컴포넌트 ───────────────────────────────────────────
export default function WorkbookPage() {
  const [openDay, setOpenDay] = useState<number | null>(1);
  const [activeSection, setActiveSection] = useState<string>("intro");
  const [isPrinting, setIsPrinting] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);

  const wb = useCloudSync();


  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setActiveSection(id);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    try { printWorkbookReport(wb.data, wb.phone); }
    finally { setTimeout(() => setIsPrinting(false), 1000); }
  };
    

  const totalFilled = [1,2,3,4,5].reduce((acc, d) => {
    const filled = Object.values(wb.data.days[d] ?? {}).filter(v => v.trim()).length;
    return acc + filled;
  }, 0);
  const totalFields = dayFields.reduce((acc, d) => acc + d.fields.length, 0);
  const overallPct = Math.round((totalFilled / totalFields) * 100);

  return (
    <div className="min-h-screen bg-background">

      {/* ── 로그인 모달 ── */}
      {wb.authState === "unauthenticated" && <LoginModal wb={wb} />}
      {wb.authState === "checking" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary/95 to-accent/90">
          <div className="flex flex-col items-center gap-4">
            <span className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-white font-medium">불러오는 중...</p>
          </div>
        </div>
      )}

      {/* ── 사이드바 ── */}
      <nav className="hidden lg:flex fixed left-0 top-0 h-full w-60 flex-col bg-sidebar border-r border-sidebar-border z-40 pt-6 pb-6">
        <div className="px-5 mb-6">
          <div className="flex items-center gap-2.5 mb-1">
            <img src="/nice_logo.png" alt="NICE" className="w-7 h-7 object-contain" />
            <span className="font-bold text-sm text-sidebar-foreground">NASA Discovery</span>
          </div>
          <p className="text-xs text-muted-foreground">NICE그룹 실무 AI 내재화 프로젝트</p>

          {/* 전체 진행률 */}
          <div className="mt-4 bg-muted/40 rounded-xl p-3 border border-border">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-medium text-foreground">전체 작성 진행률</span>
              <span className="text-xs font-bold text-primary">{overallPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${overallPct}%` }} />
            </div>
            <SyncBadge status={wb.syncStatus} lastSaved={wb.lastSavedText} />
          </div>
        </div>

        <div className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {[
            { id: "intro",       label: "시작하기 전에",      icon: <BookOpen className="w-4 h-4" /> },
            { id: "prompt-guide",label: "프롬프트 가이드",     icon: <Lightbulb className="w-4 h-4" /> },
            { id: "process",     label: "워크북 활용 프로세스",icon: <Target className="w-4 h-4" /> },
            { id: "day1",        label: "Day 1 · 지표 설정",   icon: <span className="text-sm">📊</span>, day: 1 },
            { id: "day2",        label: "Day 2 · 솔루션 설계", icon: <span className="text-sm">🗺️</span>, day: 2 },
            { id: "day3",        label: "Day 3 · 첫 실행",     icon: <span className="text-sm">🚀</span>, day: 3 },
            { id: "day4",        label: "Day 4 · 효과 측정",   icon: <span className="text-sm">✏️</span>, day: 4 },
            { id: "day5",        label: "Day 5 · 최종 완성",   icon: <span className="text-sm">🏆</span>, day: 5 },
            { id: "complete",    label: "수고 많으셨습니다",   icon: <Star className="w-4 h-4" /> },
            { id: "form",        label: "공모 양식",           icon: <FileText className="w-4 h-4" /> },
          ].map((item) => {
            const pct = item.day ? wb.getDayProgress(item.day, dayFields.find(d => d.day === item.day)!.fields.length) : null;
            return (
              <button key={item.id} onClick={() => scrollToSection(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                  activeSection === item.id ? "bg-primary/10 text-primary font-medium" : "text-sidebar-foreground hover:bg-muted/50"
                }`}>
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1 truncate">{item.label}</span>
                {pct !== null && pct > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${pct === 100 ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                    {pct === 100 ? "✓" : `${pct}%`}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 다운로드 버튼 */}
        <div className="px-4 pt-4 border-t border-border mt-2">
          <button onClick={handlePrint} disabled={isPrinting}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60
              text-primary-foreground text-sm font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm">
            {isPrinting ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />준비 중...</>
            ) : (
              <><Download className="w-4 h-4" />최종 결과물 출력하기</>
            )}
          </button>
          <p className="text-xs text-muted-foreground text-center mt-1.5">새 창에서 인쇄 또는 PDF 저장</p>
        </div>
      </nav>

      {/* ── 메인 ── */}
      <main className="lg:pl-60">

        {/* ── 히어로 ── */}
        <header className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
          <div className="relative container mx-auto px-6 py-14 max-w-5xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="flex items-center gap-3 mb-4">
                <img src="/nice_logo.png" alt="NICE" className="h-9 w-auto" style={{ filter: "brightness(0) invert(1)", opacity: 0.9 }} />
                <span className="text-white/40 text-xl">|</span>
                <span className="text-white/80 text-sm font-semibold tracking-wide">NICE Group AI Discovery</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full mb-4 backdrop-blur-sm border border-white/30">
                ⚡ 하루 20분 · 5일 완성 프로그램
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
                5일 만에 끝내는<br />
                <span className="text-white/80">실무 AI 내재화 프로젝트</span>
              </h1>
              <p className="text-white/90 text-lg font-medium mb-1">회사의 생산성을 높이는 ChatGPT 활용법</p>

              {/* 로그인 사용자 정보 + 동기화 상태 */}
              <div className="mt-5 mb-3 flex items-center justify-between bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl px-5 py-3 max-w-xl">
                <div>
                  <p className="text-white/60 text-xs mb-0.5">현재 로그인</p>
                  <p className="text-white font-mono font-semibold text-base tracking-wider">
                    📱 {wb.phone.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <SyncBadge status={wb.syncStatus} lastSaved={wb.lastSavedText} />
                  <button onClick={wb.logout}
                    className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white/70 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-all">
                    <LogOut className="w-3 h-3" />로그아웃
                  </button>
                </div>
              </div>

              {/* 히어로 내 전체 진행률 + 다운로드 */}
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm border border-white/25 rounded-xl px-4 py-2.5">
                  <div className="text-white/70 text-xs">전체 작성률</div>
                  <div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${overallPct}%` }} />
                  </div>
                  <div className="text-white font-bold text-sm">{overallPct}%</div>
                </div>
                <button onClick={handlePrint} disabled={isPrinting}
                  className="flex items-center gap-2 bg-white text-primary font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm hover:bg-white/90 disabled:opacity-60 transition-all">
                  {isPrinting
                    ? <><span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />준비 중...</>
                    : <><Download className="w-4 h-4" />최종 결과물 출력하기</>}
                </button>
                <button onClick={() => setShowUserForm(v => !v)}
                  className="flex items-center gap-2 bg-white/20 text-white font-medium text-sm px-4 py-2.5 rounded-xl border border-white/25 hover:bg-white/30 transition-all">
                  👤 내 정보 입력
                </button>
              </div>

              {/* 내 정보 입력 패널 */}
              <AnimatePresence>
                {showUserForm && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="mt-4 bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl p-5">
                    <p className="text-white/80 text-xs mb-3">최종 결과물 출력하기 시 문서 표지에 표시됩니다</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(["name","dept","rank","email"] as const).map((field) => {
                        const labels: Record<string, string> = { name: "이름", dept: "부서", rank: "직급", email: "이메일" };
                        return (
                          <div key={field}>
                            <label className="block text-white/70 text-xs mb-1">{labels[field]}</label>
                            <input className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/60"
                              placeholder={labels[field]}
                              value={wb.data.userInfo[field]}
                              onChange={e => wb.updateUserInfo(field, e.target.value)} />
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2 mt-6">
                {days.map((d) => {
                  const pct = wb.getDayProgress(d.day, dayFields.find(f => f.day === d.day)!.fields.length);
                  return (
                    <button key={d.day} onClick={() => scrollToSection(`day${d.day}`)} className="flex flex-col items-center gap-1 group">
                      <div className="relative w-11 h-11 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 flex items-center justify-center text-lg transition-all group-hover:scale-110">
                        {d.emoji}
                        {pct === 100 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center text-white text-xs">✓</span>
                        )}
                      </div>
                      <span className="text-white/60 text-xs">Day {d.day}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </header>

        <div className="container mx-auto px-4 md:px-6 max-w-5xl py-10 space-y-14">

          {/* ── 시작하기 전에 ── */}
          <section id="intro">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <SectionTitle icon={<BookOpen className="w-5 h-5" />} title="시작하기 전에" />
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm mb-6">
                <p className="text-foreground leading-relaxed mb-6 text-sm">
                  본 워크북은 교육장에서 배운 AI 활용 스킬이 일회성 경험으로 끝나지 않도록 돕는{" "}
                  <strong className="text-primary">'실무 밀착 가이드'</strong>입니다. 각 Day의 미션을 작성하고
                  저장하면, 5일 후 <strong>최종 보고서로 출력</strong>할 수 있습니다.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {mindsetItems.map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                      className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 rounded-xl p-5">
                      <div className="text-2xl mb-2">{item.emoji}</div>
                      <p className="font-semibold text-foreground text-sm mb-1">{item.text}</p>
                      <p className="text-muted-foreground text-xs leading-relaxed">{item.sub}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </section>

          {/* ── 프롬프트 가이드 ── */}
          <section id="prompt-guide">
            <SectionTitle icon={<Lightbulb className="w-5 h-5" />} title="바로 쓰는 프롬프트 가이드" />
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-6 py-4 border-b border-border flex items-center gap-3">
                <Lightbulb className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-semibold text-foreground text-sm">프롬프트 6대 구성 요소</div>
                  <div className="text-xs text-muted-foreground">미션 수행 시 아래 요소를 참고해 프롬프트를 설계하세요</div>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {promptGuide.principles.map((p, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                    className="bg-muted/40 rounded-xl p-4 border border-border hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{p.icon}</span>
                      <span className="font-semibold text-foreground text-sm">{p.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{p.desc}</p>
                    <div className="bg-primary/5 border border-primary/10 rounded-lg px-2.5 py-1.5">
                      <p className="text-xs text-primary font-mono">{p.example}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ── 프로세스 ── */}
          <section id="process">
            <SectionTitle icon={<Target className="w-5 h-5" />} title="워크북 활용 프로세스" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {processSteps.map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                  className="relative bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                  {i < processSteps.length - 1 && <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-muted-foreground text-sm">→</div>}
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl mb-4">{step.icon}</div>
                  <div className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{step.step}</div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">{step.title}</h3>
                  <div className="inline-block bg-accent/10 text-accent text-xs font-medium px-2 py-0.5 rounded-full mb-3">{step.label}</div>
                  <p className="text-muted-foreground text-xs leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── Day 미션 ── */}
          <section>
            <SectionTitle icon={<BarChart3 className="w-5 h-5" />} title="5일간의 미션" />
            <div className="space-y-4">
              {days.map((d, i) => {
                const colors  = dayColors[d.day];
                const fields  = dayFields.find(f => f.day === d.day)!.fields;
                const pct     = wb.getDayProgress(d.day, fields.length);
                const isOpen  = openDay === d.day;
                const dayData = wb.data.days[d.day] ?? {};

                return (
                  <motion.div key={d.day} id={`day${d.day}`}
                    initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                    className={`rounded-2xl border ${colors.border} overflow-hidden shadow-sm`}>

                    {/* 헤더 */}
                    <button className={`w-full bg-gradient-to-r ${colors.bg} p-5 flex items-center gap-4 text-left`}
                      onClick={() => setOpenDay(isOpen ? null : d.day)}>
                      <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl">{d.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>Day {d.day}</span>
                          <span className="text-xs text-muted-foreground">{d.subtitle}</span>
                          {pct === 100 && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">✓ 완료</span>}
                        </div>
                        <h2 className="font-bold text-foreground text-base md:text-lg">{d.title}</h2>
                      </div>
                      <DayProgressRing pct={pct} color={dayRingColor[d.day - 1]} />
                      <div className="flex-shrink-0 text-muted-foreground">
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                          <div className="bg-card p-5 md:p-6 border-t border-border">

                            {/* 설명 + 프레임워크 노트 */}
                            <p className="text-foreground text-sm leading-relaxed mb-4">{d.description}</p>
                            <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex gap-3 mb-5">
                              <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-primary text-xs font-bold">i</span>
                              </div>
                              <p className="text-sm text-foreground/80 leading-relaxed">{d.frameworkNote}</p>
                            </div>

                            {/* 미션 박스 */}
                            <div className="bg-gradient-to-r from-accent/5 to-primary/5 border border-accent/20 rounded-xl p-5 mb-5">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="w-4 h-4 text-accent" />
                                <span className="text-xs font-bold text-accent uppercase tracking-wider">오늘의 미션</span>
                              </div>
                              <h4 className="font-semibold text-foreground mb-1">{d.missionTitle}</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">{d.missionDesc}</p>
                            </div>

                            {/* Tip */}
                            <div className="mb-5">
                              <div className="flex items-center gap-2 mb-3">
                                <Lightbulb className="w-4 h-4 text-amber-500" />
                                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">작성 Tip</span>
                              </div>
                              <ul className="space-y-2">
                                {d.tips.map((tip, ti) => (
                                  <li key={ti} className="flex gap-2 text-sm text-muted-foreground leading-relaxed">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center font-medium mt-0.5">{ti + 1}</span>
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* 노하우 */}
                            {d.knowhow && (
                              <div className="mb-5">
                                <div className="flex items-center gap-2 mb-3">
                                  <Star className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-bold text-primary uppercase tracking-wider">노하우</span>
                                </div>
                                <ul className="space-y-2">
                                  {d.knowhow.map((k, ki) => (
                                    <li key={ki} className="flex gap-2 text-sm text-foreground leading-relaxed">
                                      <span className="text-primary mt-1">▸</span>{k}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* 예시 */}
                            <div className="mb-6">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">예시</span>
                              </div>
                              <div className="bg-muted/50 rounded-xl overflow-hidden border border-border">
                                <div className="bg-muted px-4 py-2.5 border-b border-border">
                                  <span className="text-xs font-medium text-muted-foreground">[예시] {d.example.label}</span>
                                </div>
                                <pre className="p-4 text-xs text-foreground font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto">{d.example.content}</pre>
                              </div>
                            </div>

                            {/* ✏️ 작성 영역 */}
                            <div className={`border-t-2 border-dashed pt-6 mt-2`} style={{ borderColor: `${dayRingColor[d.day-1]}40` }}>
                              <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-lg ${dayAccentBg[d.day]} flex items-center justify-center`}>
                                    <Pencil className="w-3.5 h-3.5 text-white" />
                                  </div>
                                  <span className="font-bold text-foreground text-sm">나의 Day {d.day} 작성하기</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <SyncBadge status={wb.syncStatus} lastSaved={null} />
                                </div>
                              </div>

                              {fields.map(field => (
                                <WriteArea
                                  key={field.id}
                                  label={`${field.required ? "✱ " : ""}${field.label}`}
                                  placeholder={field.placeholder}
                                  rows={field.rows}
                                  value={dayData[field.id] ?? ""}
                                  onChange={v => wb.updateDayField(d.day, field.id, v)}
                                  accent={`focus:border-${["violet","blue","emerald","amber","rose"][d.day-1]}-400`}
                                />
                              ))}

                              {/* Day 완료 버튼 */}
                              <div className="flex justify-end mt-2">
                                <button
                                  onClick={() => { wb.markDayComplete(d.day); }}
                                  className={`flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm
                                    ${pct === 100
                                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                      : `${dayAccentBg[d.day]} text-white hover:opacity-90`}`}>
                                  {pct === 100
                                    ? <><CheckCheck className="w-4 h-4" />Day {d.day} 완료!</>
                                    : <>💾 저장하기</>}
                                </button>
                              </div>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* ── 수고 배너 ── */}
          <section id="complete">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-2xl p-8 md:p-10 text-center shadow-sm">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="font-bold text-foreground text-2xl mb-3">수고 많으셨습니다!</h3>
              <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto mb-6 text-sm">
                Day 1부터 Day 5까지의 미션을 모두 완료하셨군요.<br />
                아래 공모 양식을 작성하신 뒤, <strong className="text-foreground">최종 보고서로 출력</strong>하여 제출해 주세요.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {["실제 업무적용","구체성","재사용 가능성","효과 명확성"].map(tag => (
                  <span key={tag} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${evalTagColors[tag] ?? "bg-muted text-muted-foreground"}`}>✓ {tag}</span>
                ))}
              </div>
              <button onClick={handlePrint} disabled={isPrinting}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-7 py-3 rounded-xl shadow-md hover:bg-primary/90 disabled:opacity-60 transition-all">
                {isPrinting
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />준비 중...</>
                  : <><Download className="w-4 h-4" />최종 결과물 출력하기</>}
              </button>
            </motion.div>
          </section>

          {/* ── 공모 양식 ── */}
          <section id="form">
            <SectionTitle icon={<FileText className="w-5 h-5" />} title="NASA 디스커버리 업무 활용 사례 공모 양식" />
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-primary to-accent p-6 md:p-8 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-6 h-6 text-white/80" />
                  <span className="text-white/80 text-sm font-medium">성과 측정 제출 양식</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold mb-1">{"<NASA 디스커버리>"}</h2>
                <p className="text-white/80 text-sm">업무 적용 후 실제 성과 지표와 함께 아래 내용을 작성하여 제출해 주세요.</p>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                {/* 제출자 정보 */}
                <div className="bg-muted/40 rounded-xl p-5 border border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>
                    제출자 정보
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(["name","dept","rank","email"] as const).map(field => {
                      const labels: Record<string, string> = { name: "이름", dept: "부서", rank: "직급", email: "이메일" };
                      return (
                        <div key={field}>
                          <label className="text-xs font-medium text-muted-foreground block mb-1">{labels[field]}</label>
                          <input className="w-full h-9 bg-background border border-border rounded-lg px-3 text-sm focus:outline-none focus:border-primary transition-colors"
                            placeholder={`${labels[field]}을(를) 입력하세요`}
                            value={wb.data.userInfo[field]}
                            onChange={e => wb.updateUserInfo(field, e.target.value)} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 평가 기준 */}
                <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/15 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">평가 기준</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { tag: "실제 업무적용", desc: "실제로 써봤는가" },
                      { tag: "구체성",        desc: "내용이 얼마나 구체적인가" },
                      { tag: "재사용 가능성", desc: "반복 활용 가능한 형태인가" },
                      { tag: "효과 명확성",   desc: "수치로 효과를 입증할 수 있는가" },
                    ].map((item, i) => (
                      <div key={i} className="bg-white/60 rounded-lg p-3 border border-border text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${evalTagColors[item.tag] ?? ""}`}>{item.tag}</span>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Q1~Q4 작성 영역 */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">2</span>
                    활용 사례 정보 작성
                  </h3>
                  <div className="space-y-4">
                    {submissionFields.map((sf, i) => (
                      <motion.div key={sf.id} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                        className="border border-border rounded-xl overflow-hidden">
                        <div className="bg-muted/30 px-4 py-3 flex items-center gap-3 border-b border-border">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{sf.id.replace("q","").replace("_review","").replace("_specific","").replace("_reuse","").replace("_effect","")}</span>
                          <div className="flex-1 flex flex-wrap items-center gap-2">
                            <div className="font-medium text-foreground text-sm">{sf.label}</div>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${evalTagColors[sf.evalTag] ?? ""}`}>{sf.evalTag}</span>
                          </div>
                        </div>
                        <div className="p-4">
                          <textarea
                            className="w-full px-4 py-3 text-sm text-foreground bg-background border border-border rounded-xl resize-y leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            rows={sf.rows}
                            placeholder={sf.placeholder}
                            value={wb.data.submission[sf.id] ?? ""}
                            onChange={e => wb.updateSubmission(sf.id, e.target.value)}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* 최종 다운로드 버튼 */}
                <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    5일간의 기록을 최종 결과물로 출력해 제출해 주세요.
                  </div>
                  <button onClick={handlePrint} disabled={isPrinting}
                    className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-6 py-3 rounded-xl shadow-sm hover:bg-primary/90 disabled:opacity-60 transition-all">
                    {isPrinting
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />준비 중...</>
                      : <><Download className="w-4 h-4" />최종 결과물 출력하기</>}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ── 푸터 ── */}
          <footer className="border-t border-border pt-8 pb-12 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <img src="/nice_logo.png" alt="NICE" className="h-7 w-auto opacity-60" />
              <span className="text-muted-foreground/40 text-lg">|</span>
              <span className="font-semibold text-sm text-foreground">NASA Discovery</span>
            </div>
            <p className="text-xs text-muted-foreground">5일 만에 끝내는 실무 AI 내재화 프로젝트</p>
          </footer>

        </div>
      </main>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
    </div>
  );
}
