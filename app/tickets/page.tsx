"use client";

import React, { useState, useEffect } from "react";
import { db } from "../firebase"; 
import { ref, onValue, set, get } from "firebase/database";

export default function TicketPage() {
  const [currentNumber, setCurrentNumber] = useState(0);
  const [myNumber, setMyNumber] = useState<number | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // 1️⃣ 自分の番号を端末の記憶から復元
    const savedNumber = localStorage.getItem("my_ticket_number");
    
    // 店員側で「システム全体のリセット」が行われたかチェック
    const lastRef = ref(db, "last_issued_number");
    get(lastRef).then((snapshot) => {
      const lastNumber = snapshot.val() || 0;
      // システムが動いていれば番号をセット、リセットされていればクリア
      if (savedNumber && Number(savedNumber) <= lastNumber && lastNumber > 0) {
        setMyNumber(Number(savedNumber));
      } else {
        localStorage.removeItem("my_ticket_number");
        setMyNumber(null);
      }
    });

    setIsHydrated(true);

    // 📢 クラウド上の「現在の呼び出し番号」をリアルタイム監視
    const currentRef = ref(db, "current_called_number");
    const unsubscribe = onValue(currentRef, (snapshot) => {
      setCurrentNumber(snapshot.val() || 0);
    });

    return () => unsubscribe();
  }, []);

  // 2️⃣ 整理券を発券する
  const handleIssueTicket = async () => {
    if (myNumber !== null) return;

    const lastIssuedRef = ref(db, "last_issued_number");
    const snapshot = await get(lastIssuedRef);
    const lastNumber = snapshot.val() || 0;
    const nextTicketNumber = lastNumber + 1; 

    await set(lastIssuedRef, nextTicketNumber);
    
    setMyNumber(nextTicketNumber);
    localStorage.setItem("my_ticket_number", String(nextTicketNumber));
  };

  // 🛠️ 【復活＆安全化】お客様自身で発券を取り消す処理
  const handleCancelTicket = () => {
    if (confirm("この整理券を取り消しますか？（※一度取り消すと、元の番号には戻せません）")) {
      // 💡 スマホ内の記憶だけを消去します。クラウドの全体番号は減らさないため、
      // 次の人は飛ばされることなく「次の番号」が安全に発行されます。
      setMyNumber(null);
      localStorage.removeItem("my_ticket_number");
    }
  };

  if (!isHydrated) return null;

  return (
    <div className="max-w-md mx-auto min-h-screen p-6 bg-blue-50/50 flex flex-col justify-center">
      <div className="p-6 bg-white rounded-2xl shadow-xl border border-gray-150">
        <h1 className="text-xl font-black text-blue-600 mb-6 text-center">🍿 お客様用 整理券画面</h1>
        
        <div className="text-center bg-gray-50 p-6 rounded-xl mb-6 border border-gray-100">
          <p className="text-xs text-gray-400 font-bold tracking-wider mb-1">現在の呼び出し番号</p>
          <p className="text-5xl font-black text-blue-600">
            {currentNumber === 0 ? "未発券" : `${currentNumber} 番`}
          </p>
        </div>

        {myNumber === null ? (
          <button
            onClick={handleIssueTicket}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-md text-lg"
          >
            整理券を発券する
          </button>
        ) : (
          <div className="text-center border-2 border-dashed border-blue-200 p-5 rounded-xl bg-blue-50/30">
            <p className="text-xs text-gray-500 font-bold">あなたの整理券番号</p>
            <p className="text-6xl font-black text-blue-700 my-3">{myNumber} 番</p>
            
            <div className="mt-2 text-sm font-bold">
              {currentNumber >= myNumber ? (
                <div className="bg-red-500 text-white p-3 rounded-lg animate-bounce shadow-md">
                  📢 あなたの順番です！窓口へどうぞ！
                </div>
              ) : (
                <p className="text-gray-600">
                  あと <span className="text-xl text-red-500 font-black">{myNumber - currentNumber}人</span> 待ちです
                </p>
              )}
            </div>

            {/* 🛠️ お客様用のキャンセルボタンを、安全なロジックで再配置 */}
            <button 
              onClick={handleCancelTicket} 
              className="mt-6 text-xs text-gray-400 hover:text-red-500 underline block mx-auto transition-colors"
            >
              整理券を取り消す
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
