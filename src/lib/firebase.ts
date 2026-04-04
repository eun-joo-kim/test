// ─────────────────────────────────────────────────────────────
//  Firebase 설정 파일
//  아래 firebaseConfig 값을 Firebase 콘솔에서 복사한 값으로 교체하세요.
// ─────────────────────────────────────────────────────────────
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ⬇️ 여기에 Firebase 콘솔에서 복사한 값을 붙여넣으세요
export const firebaseConfig = {
  apiKey:            "AIzaSyB6WCeIOzT1dIlm5_UQyt2EHbGT8tcBaX0",
  authDomain:        "nice-workbook.firebaseapp.com",
  projectId:         "nice-workbook",
  storageBucket:     "nice-workbook.firebasestorage.app",
  messagingSenderId: "527911466200",
  appId:             "1:527911466200:web:3617935dbcedc5c31253ad",
};

// Firebase 앱 초기화 (중복 방지)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Firestore DB 인스턴스 export
export const db = getFirestore(app);

// Firebase 설정이 완료되었는지 확인
export const isFirebaseConfigured =
  firebaseConfig.apiKey !== "REPLACE_WITH_YOUR_API_KEY";
