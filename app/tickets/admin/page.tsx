"use client";

import React, { useState, useEffect } from "react";
import { db } from "../../firebase"; 
import { ref, onValue, set } from "firebase/database";

export default function AdminTicketPage() {
  const [currentNumber, setCurrentNumber] = useState(0);
  const [lastIssued, setLastIssued] = useState(0);

  // 🔒 セキュリティと電卓用の状態管理
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [calculatorInput, setCalculatorInput] = useState(""); // 電卓の入力値

  const ADMIN_PASSWORD = "Tacchan";

  useEffect(() => {
    const savedAuth = localStorage.getItem("is_admin_authenticated");
    if (savedAuth === "true") setIsAuthenticated(true);

    const currentRef = ref(db, "current_called_number");
    const lastRef = ref(db, "last_issued_number");

    onValue(currentRef, (snapshot) => setCurrentNumber(snapshot.val() || 0));
    onValue(lastRef, (snapshot) => setLastIssued(snapshot.val() || 0));
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem("is_admin_authenticated", "true");
    } else {
      setErrorMessage("❌ パスワードが間違っています");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("is_admin_authenticated");
    setPasswordInput("");
  };

  // 📢 電卓で指定した番号を直接呼び出す
  const handleDirectCall = () => {
    const targetNumber = Number(calculatorInput);
    if (!targetNumber || targetNumber <= 0) {
      alert("有効な番号を入力してください");
      return;
    }
    if (targetNumber > lastIssued) {
      alert(`まだ ${targetNumber} 番は発券されていません（現在 ${lastIssued} 番まで発券中）`);
      return;
    }
    
    // Firebaseの現在呼び出し番号を、指定した番号に書き換える
    set(ref(db, "current_called_number"), targetNumber);
    setCalculatorInput(""); // 電卓の画面をクリア
  };

  // 電卓のボタンを押した時の処理
  const handleKeyPress = (num: string) => {
    setCalculatorInput((prev) => prev + num);
  };

  // 電卓のクリア（C）ボタン
  const handleClear = () => {
    setCalculatorInput("");
  };

  const handleNextCall = () => {
    set(ref(db, "current_called_number"), currentNumber + 1);
  };

  const handleResetAll = () => {
    if (confirm("全ての整理券データをリセットして1番からに戻しますか？")) {
      set(ref(db, "current_called_number"), 0);
      set(ref(db, "last_issued_number"), 0);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto min-h-screen p-6 bg-gray-100 flex flex-col justify-center">
        <div className="p-6 bg-white rounded-2xl shadow-xl border border-gray-200">
          <h1 className="text-xl font-black text-center mb-6">🔐 管理者認証</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="パスワードを入力..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="p-3 border rounded-xl bg-gray-50 focus:outline-none focus:border-red-400"
            />
            {errorMessage && <p className="text-xs text-red-500 font-bold text-center">{errorMessage}</p>}
            <button type="submit" className="w-full py-3 bg-red-500 text-white font-bold rounded-xl shadow-md">ロックを解除</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen p-6 bg-red-50/30 flex flex-col justify-center">
      <div className="p-6 bg-white rounded-2xl shadow-xl border border-red-100">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 font-bold">管理ボード</span>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500 underline">🚪 ログアウト</button>
        </div>

        {/* 📊 現在のステータス表示 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center bg-red-50/50 p-3 rounded-xl border border-red-100">
            <p className="text-xs text-red-400 font-bold下">現在呼び出し中</p>
            <p className="text-3xl font-black text-red-600">{currentNumber} 番</p>
          </div>
          <div className="text-center bg-gray-50 p-3 rounded-xl border">
            <p className="text-xs text-gray-400 font-bold">発行済みの最新</p>
            <p className="text-3xl font-black text-gray-700">{lastIssued} 番</p>
          </div>
        </div>

        {/* 🔢 計算機（テンキー）風 個別番号呼び出し機能 */}
        <div className="bg-gray-900 p-4 rounded-2xl mb-6 shadow-inner">
          <p className="text-xs text-gray-400 font-bold mb-2 text-center">🎯 番号指定呼び出し（電卓パネル）</p>
          
          {/* 電卓のディスプレイ */}
          <div className="bg-black text-right text-green-400 font-mono text-3xl p-3 rounded-lg mb-4 h-14 flex items-center justify-end border border-gray-700 shadow-inner">
            {calculatorInput || "0"}<span className="text-sm text-gray-500 ml-1">番</span>
          </div>

          {/* 電卓のボタン配列 */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                className="py-3 bg-gray-800 hover:bg-gray-700 text-white font-black text-xl rounded-xl transition-all active:scale-95"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xl rounded-xl transition-all active:scale-95"
            >
              C
            </button>
            <button
              onClick={() => handleKeyPress("0")}
              className="py-3 bg-gray-800 hover:bg-gray-700 text-white font-black text-xl rounded-xl transition-all active:scale-95"
            >
              0
            </button>
            <button
              onClick={handleDirectCall}
              className="py-3 bg-green-600 hover:bg-green-500 text-white font-black text-sm rounded-xl transition-all active:scale-95"
            >
              呼出
            </button>
          </div>
        </div>

        {/* 📢 通常の「次へ」ボタン */}
        <button
          onClick={handleNextCall}
          disabled={currentNumber >= lastIssued && lastIssued > 0}
          className="w-full py-4 bg-red-500 hover:bg-red-600 disabled:bg-gray-200 text-white font-bold rounded-xl shadow-md text-base mb-6 transition-all"
        >
          📢 次の連番（{currentNumber + 1}番）を呼び出す
        </button>

        <div className="border-t pt-4 text-center">
          <button onClick={handleResetAll} className="text-gray-400 hover:text-red-500 text-xs font-bold underline">
            🛠️ データを全リセット
          </button>
        </div>
      </div>
    </div>
  );
}
