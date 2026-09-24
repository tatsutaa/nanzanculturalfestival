"use client";

import React, { useState, useEffect } from "react";
import { db } from "../firebase"; 
import { ref, onValue } from "firebase/database";

interface RankingItem {
  id: string;
  name: string;
  score: number;
}

export default function RealtimeRankingPage() {
  const [items, setItems] = useState<RankingItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);

    const rankingRef = ref(db, "ranking");
    const unsubscribe = onValue(rankingRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        // 💡 修正：Firebaseから取得したユニークID（鍵）から、純粋なプレイヤー名とスコアを読み込みます
        const formattedList = Object.keys(data).map((key) => ({
          id: key,
          name: data[key].name, // 💡 保存された純粋な名前を使用
          score: Number(data[key].score),
        }));
        setItems(formattedList);
      } else {
        setItems([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const sortedItems = [...items].sort((a, b) => b.score - a.score);

  if (!isHydrated) return null;

  return (
    <div className="max-w-md mx-auto min-h-screen p-6 bg-gray-50 flex flex-col justify-center">
      <div className="p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
        <h1 className="text-xl font-black text-gray-800 mb-2 text-center flex items-center justify-center gap-2">
          🎯 シューティングランキング
        </h1>
        <p className="text-xs text-gray-400 mb-6 text-center">
          同じ名前の挑戦データも上書きされずにすべて集計されます
        </p>

        {sortedItems.length === 0 ? (
          <p className="text-center text-sm text-gray-400 my-8">データがまだありません。</p>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedItems.map((item, index) => {
              const rank = index + 1;
              return (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <span className={`font-black text-xs w-5 h-5 flex items-center justify-center rounded-full ${
                      rank === 1 ? "bg-amber-400 text-white" :
                      rank === 2 ? "bg-gray-300 text-gray-700" :
                      rank === 3 ? "bg-amber-600 text-white" : "text-gray-400"
                    }`}>
                      {rank}
                    </span>
                    <span className="font-bold text-gray-700 text-sm">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-red-500">{item.score} 点</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
