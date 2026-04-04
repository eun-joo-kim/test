import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "nice-nasa-workbook-v1";

export interface UserInfo {
  name: string;
  dept: string;
  rank: string;
  email: string;
}

export interface WorkbookData {
  userInfo: UserInfo;
  days: Record<number, Record<string, string>>;   // day → fieldId → value
  submission: Record<string, string>;             // submissionFieldId → value
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

function loadFromStorage(): WorkbookData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    return { ...defaultData, ...JSON.parse(raw) };
  } catch {
    return defaultData;
  }
}

export function useWorkbookData() {
  const [data, setData] = useState<WorkbookData>(loadFromStorage);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 자동 저장 (디바운스 1.5초)
  const persistData = useCallback((nextData: WorkbookData) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setSaveStatus("saving");
    autoSaveTimer.current = setTimeout(() => {
      const withTimestamp = { ...nextData, lastSaved: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(withTimestamp));
      setData(withTimestamp);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 1500);
  }, []);

  // 수동 저장
  const saveNow = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    const withTimestamp = { ...data, lastSaved: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(withTimestamp));
    setData(withTimestamp);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2500);
  }, [data]);

  // 필드 업데이트
  const updateDayField = useCallback((day: number, fieldId: string, value: string) => {
    setData(prev => {
      const next = {
        ...prev,
        days: {
          ...prev.days,
          [day]: { ...(prev.days[day] ?? {}), [fieldId]: value },
        },
      };
      persistData(next);
      return next;
    });
  }, [persistData]);

  // 제출 양식 필드 업데이트
  const updateSubmission = useCallback((fieldId: string, value: string) => {
    setData(prev => {
      const next = { ...prev, submission: { ...prev.submission, [fieldId]: value } };
      persistData(next);
      return next;
    });
  }, [persistData]);

  // 유저 정보 업데이트
  const updateUserInfo = useCallback((field: keyof UserInfo, value: string) => {
    setData(prev => {
      const next = { ...prev, userInfo: { ...prev.userInfo, [field]: value } };
      persistData(next);
      return next;
    });
  }, [persistData]);

  // Day 완료 처리
  const markDayComplete = useCallback((day: number) => {
    setData(prev => {
      const completed = prev.completedDays.includes(day)
        ? prev.completedDays
        : [...prev.completedDays, day].sort((a, b) => a - b);
      const next = { ...prev, completedDays: completed };
      persistData(next);
      return next;
    });
  }, [persistData]);

  // 마지막 저장 시간 포맷
  const lastSavedText = data.lastSaved
    ? `마지막 저장: ${new Date(data.lastSaved).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
    : null;

  // Day 작성 완료율 계산
  const getDayProgress = useCallback((day: number, requiredFieldCount: number): number => {
    const dayData = data.days[day] ?? {};
    const filled = Object.values(dayData).filter(v => v.trim().length > 0).length;
    return Math.min(100, Math.round((filled / requiredFieldCount) * 100));
  }, [data]);

  return {
    data,
    saveStatus,
    lastSavedText,
    saveNow,
    updateDayField,
    updateSubmission,
    updateUserInfo,
    markDayComplete,
    getDayProgress,
  };
}
