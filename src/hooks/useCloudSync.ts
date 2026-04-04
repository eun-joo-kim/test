import { useState, useEffect, useCallback, useRef } from "react";
import {
  doc, getDoc, setDoc, onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";

// ─── 타입 ───────────────────────────────────────────────────
export interface UserInfo {
  name: string; dept: string; rank: string; email: string;
}

export interface WorkbookData {
  userInfo: UserInfo;
  days: Record<number, Record<string, string>>;
  submission: Record<string, string>;
  lastSaved: string | null;
  completedDays: number[];
}

const defaultData: WorkbookData = {
  userInfo: { name: "", dept: "", rank: "", email: "" },
  days: { 1: {}, 2: {}, 3: {}, 4: {}, 5: {} },
  submission: {},
  lastSaved: null,
  completedDays: [],
};

// ─── 로컬스토리지 키 ─────────────────────────────────────────
const LS_PHONE  = "nice-nasa-phone";
const LS_PIN    = "nice-nasa-pin";
const LS_DATA   = "nice-nasa-workbook-v1";

// ─── 핸드폰 번호 정규화 (숫자만) ────────────────────────────
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

// ─── 핸드폰 번호 포맷 (표시용) ──────────────────────────────
export function formatPhone(raw: string): string {
  const digits = normalizePhone(raw);
  if (digits.length <= 3)  return digits;
  if (digits.length <= 7)  return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

function loadLocal(): WorkbookData {
  try {
    const raw = localStorage.getItem(LS_DATA);
    return raw ? { ...defaultData, ...JSON.parse(raw) } : defaultData;
  } catch { return defaultData; }
}

function saveLocal(data: WorkbookData) {
  localStorage.setItem(LS_DATA, JSON.stringify(data));
}

// ─── 훅 상태 타입 ────────────────────────────────────────────
export type AuthState   = "checking" | "unauthenticated" | "authenticated";
export type SyncStatus  = "idle" | "saving" | "saved" | "error";

export function useCloudSync() {
  const [authState, setAuthState]     = useState<AuthState>("checking");
  const [phone, setPhone]             = useState("");       // 인증된 폰
  const [data, setData]               = useState<WorkbookData>(loadLocal);
  const [syncStatus, setSyncStatus]   = useState<SyncStatus>("idle");
  const [lastSavedText, setLastSavedText] = useState<string | null>(null);

  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unsubRef     = useRef<Unsubscribe | null>(null);
  const isSyncingRef = useRef(false);

  // ── 앱 시작: 로컬에 저장된 인증 정보 확인 ──────────────────
  useEffect(() => {
    const savedPhone = localStorage.getItem(LS_PHONE);
    const savedPin   = localStorage.getItem(LS_PIN);
    if (savedPhone && savedPin) {
      // 저장된 인증 정보 있으면 자동 로그인
      setPhone(savedPhone);
      setAuthState("authenticated");
      if (isFirebaseConfigured) subscribeDoc(savedPhone);
    } else {
      setAuthState("unauthenticated");
    }
    return () => { unsubRef.current?.(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Firestore 실시간 구독 ────────────────────────────────────
  function subscribeDoc(phoneKey: string) {
    unsubRef.current?.();
    const ref = doc(db, "workbooks", phoneKey);
    unsubRef.current = onSnapshot(ref,
      (snap) => {
        if (snap.exists()) {
          const remote = snap.data() as WorkbookData & { pin?: string };
          // pin 필드는 데이터에서 제외
          const { ...workbookData } = remote;
          delete (workbookData as Record<string, unknown>).pin;
          isSyncingRef.current = true;
          const merged = { ...defaultData, ...workbookData };
          setData(merged);
          saveLocal(merged);
          if (merged.lastSaved) {
            setLastSavedText(`저장: ${new Date(merged.lastSaved).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`);
          }
          isSyncingRef.current = false;
          setSyncStatus("saved");
          setTimeout(() => setSyncStatus("idle"), 2000);
        }
      },
      () => setSyncStatus("error")
    );
  }

  // ── Firestore 저장 (디바운스 1.5초) ─────────────────────────
  const pushToCloud = useCallback((nextData: WorkbookData, phoneKey: string) => {
    if (!isFirebaseConfigured || isSyncingRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSyncStatus("saving");
    debounceRef.current = setTimeout(async () => {
      try {
        const ref = doc(db, "workbooks", phoneKey);
        await setDoc(ref, {
          ...nextData,
          lastSaved: new Date().toISOString(),
        }, { merge: true });
        const ts = new Date().toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
        setLastSavedText(`저장: ${ts}`);
        setSyncStatus("saved");
        setTimeout(() => setSyncStatus("idle"), 2000);
      } catch {
        setSyncStatus("error");
      }
    }, 1500);
  }, []);

  // ── 로그인 / 신규 등록 통합 함수 ────────────────────────────
  const login = useCallback(async (
    rawPhone: string,
    pin: string,
    mode: "auto-detect" | "register" | "login" = "auto-detect"
  ): Promise<{ ok: boolean; error?: string; isNew?: boolean }> => {
    if (!isFirebaseConfigured) {
      // Firebase 미설정 시 로컬 전용 모드
      localStorage.setItem(LS_PHONE, rawPhone);
      localStorage.setItem(LS_PIN, pin);
      setPhone(rawPhone);
      setAuthState("authenticated");
      return { ok: true, isNew: true };
    }

    const phoneKey = normalizePhone(rawPhone);
    if (phoneKey.length < 10) return { ok: false, error: "올바른 전화번호를 입력해 주세요." };
    if (pin.length !== 4)     return { ok: false, error: "PIN은 4자리 숫자입니다." };

    try {
      const ref  = doc(db, "workbooks", phoneKey);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        // 기존 사용자 → PIN 확인
        const storedPin = snap.data().pin as string;
        if (storedPin !== pin) {
          return { ok: false, error: "PIN이 맞지 않아요. 다시 확인해 주세요." };
        }
        // 인증 성공 → 데이터 로드
        localStorage.setItem(LS_PHONE, phoneKey);
        localStorage.setItem(LS_PIN, pin);
        setPhone(phoneKey);
        setAuthState("authenticated");
        subscribeDoc(phoneKey);
        return { ok: true, isNew: false };
      } else {
        // 신규 사용자 → 등록
        if (mode === "login") {
          return { ok: false, error: "등록된 전화번호가 없어요. '처음 시작하기'를 눌러 등록해 주세요." };
        }
        await setDoc(ref, { ...defaultData, pin, lastSaved: new Date().toISOString() });
        localStorage.setItem(LS_PHONE, phoneKey);
        localStorage.setItem(LS_PIN, pin);
        setPhone(phoneKey);
        setAuthState("authenticated");
        subscribeDoc(phoneKey);
        return { ok: true, isNew: true };
      }
    } catch {
      return { ok: false, error: "네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요." };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 로그아웃 ────────────────────────────────────────────────
  const logout = useCallback(() => {
    unsubRef.current?.();
    localStorage.removeItem(LS_PHONE);
    localStorage.removeItem(LS_PIN);
    setPhone("");
    setData(defaultData);
    setAuthState("unauthenticated");
  }, []);

  // ── 데이터 변경 공통 ─────────────────────────────────────────
  const applyChange = useCallback((updater: (prev: WorkbookData) => WorkbookData) => {
    setData(prev => {
      const next = updater(prev);
      saveLocal(next);
      pushToCloud(next, phone);
      return next;
    });
  }, [pushToCloud, phone]);

  const updateDayField = useCallback((day: number, fieldId: string, value: string) => {
    applyChange(prev => ({
      ...prev,
      days: { ...prev.days, [day]: { ...(prev.days[day] ?? {}), [fieldId]: value } },
    }));
  }, [applyChange]);

  const updateSubmission = useCallback((fieldId: string, value: string) => {
    applyChange(prev => ({ ...prev, submission: { ...prev.submission, [fieldId]: value } }));
  }, [applyChange]);

  const updateUserInfo = useCallback((field: keyof UserInfo, value: string) => {
    applyChange(prev => ({ ...prev, userInfo: { ...prev.userInfo, [field]: value } }));
  }, [applyChange]);

  const markDayComplete = useCallback((day: number) => {
    applyChange(prev => {
      const completed = prev.completedDays.includes(day)
        ? prev.completedDays
        : [...prev.completedDays, day].sort((a, b) => a - b);
      return { ...prev, completedDays: completed };
    });
  }, [applyChange]);

  const getDayProgress = useCallback((day: number, total: number): number => {
    const filled = Object.values(data.days[day] ?? {}).filter(v => v.trim()).length;
    return Math.min(100, Math.round((filled / total) * 100));
  }, [data]);

  return {
    authState, phone, data, syncStatus, lastSavedText,
    login, logout,
    updateDayField, updateSubmission, updateUserInfo,
    markDayComplete, getDayProgress,
  };
}
