"use client";

import React, { useState, useEffect } from "react";
import { db } from "../../firebase"; 
import { ref, onValue, set } from "firebase/database";

export default function AdminTicketPage() {
  const [currentNumber, setCurrentNumber] = useState(0);
  const [lastIssued, setLastIssued] = useState(0);
  const [cancelledNumbers, setCancelledNumbers] = useState<number[]>([]); 

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [calculatorInput, setCalculatorInput] = useState(""); 

  const ADMIN_PASSWORD = "secret-admin-pass";

  useEffect(() => {
    const savedAuth = localStorage.getItem("is_admin_authenticated");
    if (savedAuth === "true") setIsAuthenticated(true);

    const currentRef = ref(db, "current_called_number");
    const lastRef = ref(db, "last_issued_number");
    const cancelRef = ref(db, "cancelled_numbers");

    onValue(currentRef, (snapshot) => setCurrentNumber(snapshot.val() || 0));
    onValue(lastRef, (snapshot) => setLastIssued(snapshot.val() || 0));
    
    onValue(cancelRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const numbers = Object.keys(data).map(Number).sort((a, b) => a - b);
        setCancelledNumbers(numbers);
      } else {
        setCancelledNumbers([]);
      }
    });
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
    set(ref(db, "current_called_number"), targetNumber);
    setCalculatorInput(""); 
  };

  const handleUndoIssue = () => {
    if (lastIssued <= 0) {
      alert("これ以上戻せません（すでに0番です）");
      return;
    }
    if (lastIssued <= currentNumber) {
      alert("すでに呼び出し中、または呼び出し済みの番号を取り消すことはできません。先に呼び出し番号を電卓等で戻してください。");
      return;
    }

    if (confirm(`最新の発行番号「${lastIssued}番」を取り消します。次回のお客様にはもう一度「${lastIssued}番」が発券されます。よろしいですか？`)) {
      set(ref(db, "last_issued_number"), lastIssued - 1);
      set(ref(db, `cancelled_numbers/${lastIssued}`), null);
    }
  };

  const handleKeyPress = (num: string) => {
    setCalculatorInput((prev) => prev + num);
  };

  const handleClear = () => {
    setCalculatorInput("");
  };

  const handleNextCall = () => {
    set(ref(db, "current_called_number"), currentNumber + 1);
  };

  // 🔄 データを全リセットする処理
  const handleResetAll = async () => {
    if (confirm("全ての整理券データをリセットして1番からに戻しますか？（キャンセルされた抜け番も全て消去されます）")) {
      // 💡 Firebaseの各データをすべて初期状態に上書き、または削除(null)します
      await set(ref(db, "current_called_number"), 0);
      await set(ref(db, "last_issued_number"), 0);
      await set(ref(db, "cancelled_numbers"), null); 
      setCalculatorInput("");
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

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center bg-red-50/50 p-3 rounded-xl border border-red-100">
            <p className="text-xs text-red-400 font-bold">現在呼び出し中</p>
            <p className="text-3xl font-black text-red-600">{currentNumber} 番</p>
          </div>
          <div className="text-center bg-gray-50 p-3 rounded-xl border">
            <p className="text-xs text-gray-400 font-bold">発行済みの最新</p>
            <p className="text-3xl font-black text-gray-700">{lastIssued} 番</p>
          </div>
        </div>

        {/* ❌ キャンセルされた番号の表示エリア */}
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-4">
          <p className="text-xs text-orange-700 font-black mb-1.5">❌ お客様がキャンセルした番号（抜け番）:</p>
          {cancelledNumbers.length === 0 ? (
            <p className="text-xs text-gray-400 italic">現在キャンセルはありません</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {cancelledNumbers.map((num) => (
                <span key={num} className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-sm">
                  {num}番
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="text-right mb-6">
          <button
            onClick={handleUndoIssue}
            className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold px-3 py-1.5 rounded-lg transition-all"
          >
            ⚠️ 最新の発行( {lastIssued}番 )を取り消す
          </button>
        </div>

        <div className="bg-gray-900 p-4 rounded-2xl mb-6 shadow-inner">
          <p className="text-xs text-gray-400 font-bold mb-2 text-center">🎯 番号指定呼び出し（電卓パネル）</p>
          
          <div className="bg-black text-right text-green-400 font-mono text-3xl p-3 rounded-lg mb-4 h-14 flex items-center justify-end border border-gray-700 shadow-inner">
            {calculatorInput || "0"}<span className="text-sm text-gray-500 ml-1">番</span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button key={num} onClick={() => handleKeyPress(num)} className="py-3 bg-gray-800 text-white font-black text-xl rounded-xl transition-all active:scale-95">{num}</button>
            ))}
            <button onClick={handleClear} className="py-3 bg-gray-600 text-white font-black text-xl rounded-xl transition-all active:scale-95">C</button>
            <button onClick={() => handleKeyPress("0")} className="py-3 bg-gray-800 text-white font-black text-xl rounded-xl transition-all active:scale-95">0</button>
            {/* 💡 ボタン内の文字を綺麗な「呼出」に整えました */}
            <button onClick={handleDirectCall} className="py-3 bg-green-600 text-white font-bold text-sm rounded-xl transition-all active:scale-95">呼出</button>
          </div>
        </div>

        <button
          onClick={handleNextCall}
          disabled={currentNumber >= lastIssued && lastIssued > 0}
          className="w-full py-4 bg-red-500 hover:bg-red-600 disabled:bg-gray-200 text-white font-bold rounded-xl shadow-md text-base mb-6 transition-all"
        >
          📢 次の連番（{currentNumber + 1}番）を呼び出す
        </button>

        <div className="border-t pt-4 text-center">
          <button onClick={handleResetAll} className="text-gray-400 hover:text-red-500 text-xs font-bold underline">🛠️ データを全リセット</button>
        </div>
      </div>
    </div>
  );
}
