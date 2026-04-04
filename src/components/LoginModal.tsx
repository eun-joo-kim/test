import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPhone, normalizePhone } from "@/hooks/useCloudSync";
import type { useCloudSync } from "@/hooks/useCloudSync";

type WB = ReturnType<typeof useCloudSync>;

interface LoginModalProps {
  wb: WB;
}

export default function LoginModal({ wb }: LoginModalProps) {
  const [tab, setTab]           = useState<"new" | "existing">("new");
  const [phoneInput, setPhoneInput] = useState("");
  const [pin, setPin]           = useState(["", "", "", ""]);
  const [pinConfirm, setPinConfirm] = useState(["", "", "", ""]);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState<string | null>(null);

  const pinRefs        = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const pinConfirmRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // 탭 전환 시 초기화
  useEffect(() => {
    setError(null);
    setPin(["","","",""]);
    setPinConfirm(["","","",""]);
    setSuccess(null);
  }, [tab]);

  // PIN 입력 처리
  const handlePinInput = (
    idx: number,
    value: string,
    arr: string[],
    setArr: (v: string[]) => void,
    refs: typeof pinRefs,
    nextGroupRef?: React.RefObject<HTMLInputElement>
  ) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...arr];
    next[idx] = digit;
    setArr(next);
    if (digit && idx < 3) {
      refs[idx + 1].current?.focus();
    } else if (digit && idx === 3 && nextGroupRef) {
      nextGroupRef.current?.focus();
    }
  };

  const handlePinKeyDown = (
    e: React.KeyboardEvent,
    idx: number,
    arr: string[],
    setArr: (v: string[]) => void,
    refs: typeof pinRefs
  ) => {
    if (e.key === "Backspace" && !arr[idx] && idx > 0) {
      refs[idx - 1].current?.focus();
      const next = [...arr];
      next[idx - 1] = "";
      setArr(next);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    const pinStr = pin.join("");
    const phone  = normalizePhone(phoneInput);

    if (phone.length < 10)  { setError("올바른 전화번호를 입력해 주세요."); return; }
    if (pinStr.length !== 4){ setError("PIN 4자리를 모두 입력해 주세요."); return; }

    if (tab === "new") {
      const confirmStr = pinConfirm.join("");
      if (confirmStr.length !== 4) { setError("PIN 확인을 입력해 주세요."); return; }
      if (pinStr !== confirmStr)    { setError("PIN이 일치하지 않아요. 다시 확인해 주세요."); return; }
    }

    setLoading(true);
    const result = await wb.login(phone, pinStr, tab === "new" ? "auto-detect" : "login");
    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "오류가 발생했어요.");
    } else {
      setSuccess(result.isNew ? "등록 완료! 워크북을 시작합니다 🎉" : "반갑습니다! 이전 기록을 불러왔어요 ✓");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary/95 to-accent/90 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* 헤더 */}
        <div className="bg-gradient-to-br from-primary to-accent px-6 pt-8 pb-6 text-center">
          <img src={`${import.meta.env.BASE_URL}nice_logo.png`} alt="NICE" className="h-10 w-auto mx-auto mb-3"
            style={{ filter: "brightness(0) invert(1)", opacity: 0.95 }} />
          <h1 className="text-white font-bold text-xl mb-1">NASA Discovery</h1>
          <p className="text-white/75 text-sm">실무 AI 내재화 워크북</p>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-border">
          {([["new", "처음 시작하기"], ["existing", "이어서 작성하기"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                tab === key
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="px-6 py-6">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div key="success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="text-center py-4">
                <div className="text-5xl mb-3">{success.includes("등록") ? "🎉" : "👋"}</div>
                <p className="font-semibold text-foreground mb-1">{success}</p>
                <p className="text-xs text-muted-foreground">잠시 후 워크북이 열립니다...</p>
              </motion.div>
            ) : (
              <motion.div key={tab} initial={{ opacity: 0, x: tab === "new" ? -10 : 10 }} animate={{ opacity: 1, x: 0 }}
                className="space-y-5">

                {/* 전화번호 */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    📱 휴대폰 번호
                  </label>
                  <input
                    type="tel" inputMode="numeric" maxLength={13}
                    placeholder="010-0000-0000"
                    value={phoneInput}
                    onChange={e => setPhoneInput(formatPhone(e.target.value))}
                    onKeyDown={e => e.key === "Enter" && pinRefs[0].current?.focus()}
                    className="w-full h-12 border border-border rounded-xl px-4 text-base font-mono tracking-wide focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  />
                </div>

                {/* PIN 설정 */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    🔒 {tab === "new" ? "PIN 설정" : "PIN 입력"} <span className="text-muted-foreground font-normal">(숫자 4자리)</span>
                  </label>
                  <div className="flex justify-center gap-3">
                    {pin.map((v, i) => (
                      <input key={i} ref={pinRefs[i]}
                        type="password" inputMode="numeric" maxLength={1}
                        value={v}
                        onChange={e => handlePinInput(i, e.target.value, pin, setPin, pinRefs,
                          tab === "new" ? pinConfirmRefs[0] : undefined)}
                        onKeyDown={e => handlePinKeyDown(e, i, pin, setPin, pinRefs)}
                        className="w-14 h-14 text-center text-2xl font-bold border-2 border-border rounded-2xl
                          focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors
                          bg-muted/30"
                      />
                    ))}
                  </div>
                </div>

                {/* PIN 확인 (신규만) */}
                <AnimatePresence>
                  {tab === "new" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        🔒 PIN 확인
                      </label>
                      <div className="flex justify-center gap-3">
                        {pinConfirm.map((v, i) => (
                          <input key={i} ref={pinConfirmRefs[i]}
                            type="password" inputMode="numeric" maxLength={1}
                            value={v}
                            onChange={e => handlePinInput(i, e.target.value, pinConfirm, setPinConfirm, pinConfirmRefs)}
                            onKeyDown={e => handlePinKeyDown(e, i, pinConfirm, setPinConfirm, pinConfirmRefs)}
                            onKeyPress={e => e.key === "Enter" && handleSubmit()}
                            className={`w-14 h-14 text-center text-2xl font-bold border-2 rounded-2xl
                              focus:outline-none focus:ring-2 transition-colors bg-muted/30
                              ${pinConfirm.join("").length === 4 && pinConfirm.join("") !== pin.join("")
                                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                                : "border-border focus:border-primary focus:ring-primary/20"}`}
                          />
                        ))}
                      </div>
                      {pinConfirm.join("").length === 4 && pinConfirm.join("") !== pin.join("") && (
                        <p className="text-red-500 text-xs text-center mt-2">PIN이 일치하지 않아요</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 에러 */}
                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-red-500 text-sm text-center bg-red-50 border border-red-100 rounded-xl py-2.5 px-3">
                    {error}
                  </motion.p>
                )}

                {/* 버튼 */}
                <button onClick={handleSubmit} disabled={loading}
                  className="w-full h-12 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-bold text-base rounded-xl transition-all shadow-sm flex items-center justify-center gap-2">
                  {loading
                    ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />확인 중...</>
                    : tab === "new" ? "워크북 시작하기 →" : "이어서 작성하기 →"}
                </button>

                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  {tab === "new"
                    ? "핸드폰 번호와 PIN으로 언제 어디서든\n이어서 작성할 수 있어요."
                    : "다른 기기에서 작성하던 내용을\n그대로 불러올 수 있어요."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
