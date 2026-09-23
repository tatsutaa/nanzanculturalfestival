"use client";

import React, { useState, useEffect } from "react";
import { db } from "../../firebase"; // 💡 パスがずれる場合は環境に合わせて調整してください
import { ref, onValue, set } from "firebase/database";

export default function AdminTicketPage() {
  const [currentNumber, setCurrentNumber] = useState(0);
  const [lastIssued, setLastIssued] = useState(0);

  // 🔒 パスワード保護用の状態管理
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // 🔑 設定したい管理用パスワード（好きな文字に変えてください）
  const ADMIN_PASSWORD = "secret-admin-pass";

  useEffect(() => {
    // 💡 一度パスワードを正しく入力した人は、リロードしても鍵が開いたままにする記憶機能
    const savedAuth = localStorage.getItem("is_admin_authenticated");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
    }

    // クラウド上のデータをリアルタイム監視
    const currentRef = ref(db, "current_called_number");
    const lastRef = ref(db, "last_issued_number");

    const unsubCurrent = onValue(currentRef, (snapshot) => {
      setCurrentNumber(snapshot.val() || 0);
    });

    const unsubLast = onValue(lastRef, (snapshot) => {
      setLastIssued(snapshot.val() || 0);
    });

    return () => {
      unsubCurrent();
      unsubLast();
    };
  }, []);

  // 🔐 パスワードチェックの処理
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault(); // ページのリロードを防ぐ
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem("is_admin_authenticated", "true"); // 認証成功を記憶
      setErrorMessage("");
    } else {
      setErrorMessage("❌ パスワードが間違っています");
    }
  };

  // 🚪 ログアウト（再度ロックをかける）
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("is_admin_authenticated");
    setPasswordInput("");
  };

  // 次の客を呼び出す
  const handleNextCall = () => {
    const nextNumber = currentNumber + 1;
    set(ref(db, "current_called_number"), nextNumber);
  };

  // 全リセット
  const handleResetAll = () => {
    if (confirm("全ての整理券データをリセットして1番からに戻しますか？")) {
      set(ref(db, "current_called_number"), 0);
      set(ref(db, "last_issued_number"), 0);
    }
  };

  // ========================================================
  // 🔒 まだログインしていない場合は「パスワード入力画面」を表示する
  // ========================================================
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto min-h-screen p-6 bg-gray-100 flex flex-col justify-center">
        <div className="p-6 bg-white rounded-2xl shadow-xl border border-gray-200">
          <h1 className="text-xl font-black text-gray-850 mb-2 text-center">🔐 管理者認証</h1>
          <p className="text-xs text-gray-400 text-center mb-6">ここから先は店員専用画面です</p>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="パスワードを入力..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="p-3 border rounded-xl bg-gray-50 focus:outline-none focus:border-red-400 font-sans"
            />
            {errorMessage && <p className="text-xs text-red-500 font-bold text-center">{errorMessage}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              ロックを解除
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ========================================================
  // 👨‍🍳 ログイン済みの場合は「本来の管理画面」を表示する
  // ========================================================
  return (
    <div className="max-w-md mx-auto min-h-screen p-6 bg-red-50/50 flex flex-col justify-center等">
      <div className="p-6 bg-white rounded-2xl shadow-xl border border-red-100">
        <div className="flex justify-between items-center mb-6">
          <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 font-bold">認証済み</span>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500 underline">
            🚪 ログアウト
          </button>
        </div>

        <h1 className="text-xl font-black text-red-600 mb-6 text-center">👨‍🍳 店員専用 管理画面</h1>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center bg-gray-50 p-4 rounded-xl border">
            <p className="text-xs text-gray-400 font-bold">現在のお呼び出し</p>
            <p className="text-3xl font-black text-red-500">{currentNumber} 番</p>
          </div>
          <div className="text-center bg-gray-50 p-4 rounded-xl border">
            <p className="text-xs text-gray-400 font-bold">発券済みの最新番号</p>
            <p className="text-3xl font-black text-gray-700">{lastIssued} 番</p>
          </div>
        </div>

        <button
          onClick={handleNextCall}
          disabled={currentNumber >= lastIssued && lastIssued > 0}
          className="w-full py-5 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-md text-lg mb-8"
        >
          📢 次のお客様を呼び出す
        </button>

        <div className="border-t border-gray-150 pt-4 text-center">
          <p className="text-xs text-gray-400 font-bold mb-2">待ち人数: {Math.max(0, lastIssued - currentNumber)} 人</p>
          <button onClick={handleResetAll} className="px-3 py-1 bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 text-xs font-bold rounded">
            🛠️ 本日の番号を全リセット
          </button>
        </div>
      </div>
    </div>
  );
}
