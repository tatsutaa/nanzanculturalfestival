"use client";

import React, { useState, useEffect } from "react";
import { db } from "../../firebase"; // 💡 パスがずれる場合は "../firebase" などに調整してください
import { ref, onValue, set } from "firebase/database";

export default function AdminTicketPage() {
  const [currentNumber, setCurrentNumber] = useState(0);
  const [lastIssued, setLastIssued] = useState(0);

  useEffect(() => {
    // 📢 クラウド上のデータをリアルタイム監視
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

  // 次の客を呼び出す（クラウドを更新）
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

  return (
    <div className="max-w-md mx-auto min-h-screen p-6 bg-red-50/50 flex flex-col justify-center">
      <div className="p-6 bg-white rounded-2xl shadow-xl border border-red-100">
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
