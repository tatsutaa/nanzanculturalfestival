import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // 💡 データベース用のツールを読み込む

const firebaseConfig = {
  apiKey: "AIzaSyBs2Fm33hl_nhpKbv9Vx18Sm2Pe1Fs6B1g",
  authDomain: "my-ticket-app-5b992.firebaseapp.com",
  // 👇 ここが重要です！あなたのプロジェクトIDを元に自動生成されるURLを追加しました
  databaseURL: "https://my-ticket-app-5b992-default-rtdb.firebaseio.com/", 
  projectId: "my-ticket-app-5b992",
  storageBucket: "my-ticket-app-5b992.firebasestorage.app",
  messagingSenderId: "825896838698",
  appId: "1:825896838698:web:8800f62570070b48e54553",
  measurementId: "G-FWL7NHZ59Y"
};

// サーバーサイドでの二重初期化を防ぐNext.js用の設定
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app, firebaseConfig.databaseURL); 

export { db }; // 💡 他のファイル（page.tsx）で使えるように「db」を外に公開する
