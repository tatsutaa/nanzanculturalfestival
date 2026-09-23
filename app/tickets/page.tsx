"use client";

import React, { useState } from "react";

export default function TicketPage() {
  // 🎟️ 整理券専用の状態管理
  const [currentNumber, setCurrentNumber] = useState(12); // 現在の呼び出し番号
  const [myNumber, setMyNumber] = useState<number | null>(null); // 自分の番号

  const handleIssueTicket = () => {
    const nextTicketNumber = currentNumber + Math.floor(Math.random() * 5) + 3;
    setMyNumber(nextTicketNumber);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen p-6 bg-gray-50">
      <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-black text-gray-800 mb-6 text-center">
          🎟️ デジタル整理券システム
        </h1>
        
        <div className="text-center bg-gray-50 p-4 rounded-xl mb-6">
          <p className="text-xs text-gray-400 font-bold">現在のお呼び出し番号</p>
          <p className="text-4xl font-black text-green-600 animate-pulse">{currentNumber} 番</p>
        </div>

        {myNumber === null ? (
          <button
            onClick={handleIssueTicket}
            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            整理券を発券する
          </button>
        ) : (
          <div className="text-center border-2 border-dashed border-green-300 p-4 rounded-xl bg-green-50/50">
            <p className="text-xs text-green-700 font-bold">あなたの整理券番号</p>
            <p className="text-5xl font-black text-green-700 my-2">{myNumber} 番</p>
            <p className="text-xs text-gray-400 mt-1">
              あと <span className="font-bold text-red-500">{myNumber - currentNumber}人</span> 待ちです
            </p>
          </div>
        )}
      </div>
      <p className="text-center mt-6"><a href="/" className="text-xs text-blue-500 hover:underline">← トップに戻る</a></p>
    </div>
  );
}
