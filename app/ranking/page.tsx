"use client";

import React, { useState } from "react";

export default function RealtimeRankingPage() {
  // 🏆 ランキング専用の状態管理
  const [items, setItems] = useState([
    { id: 1, name: "熟成醤油ラーメン", score: 98, image: "🍜" },
    { id: 2, name: "濃厚旨辛味噌ラーメン", score: 85, image: "🍜" },
    { id: 3, name: "魚介豚骨つけ麺", score: 92, image: "🥢" },
  ]);

  const handleVote = (id: number) => {
    setItems(items.map(item => item.id === id ? { ...item, score: item.score + 1 } : item));
  };

  const sortedItems = [...items].sort((a, b) => b.score - a.score);

  return (
    <div className="max-w-md mx-auto min-h-screen p-6 bg-gray-50">
      <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-black text-gray-800 mb-2 text-center">
          🏆 リアルタイムランキング
        </h1>
        <p className="text-xs text-gray-400 mb-6 text-center">👍 ボタンを押すと順位が瞬時に入れ替わります！</p>

        <div className="flex flex-col gap-3">
          {sortedItems.map((item, index) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="font-black text-gray-400 w-5">{index + 1}</span>
                <span className="text-xl">{item.image}</span>
                <span className="font-bold text-gray-700 text-sm">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-blue-600">{item.score}票</span>
                <button
                  onClick={() => handleVote(item.id)}
                  className="px-3 py-1 bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-500 rounded-lg shadow-sm text-xs font-bold transition-all active:scale-90"
                >
                  👍 投票
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-center mt-6"><a href="/" className="text-xs text-blue-500 hover:underline">← トップに戻る</a></p>
    </div>
  );
}
