"use client";

import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase"; 
import { ref, onValue, set, get } from "firebase/database";

export default function TicketPage() {
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]); // 呼び出し中の番号リスト
  const [lastIssued, setLastIssued] = useState(0); // 💡 発行済みの最新番号
  const [myNumber, setMyNumber] = useState<number | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const [isSoundEnabled, setIsSoundEnabled] = useState(false); 
  const lastPlayedNumber = useRef<number | null>(null);

  useEffect(() => {
    const savedNumber = localStorage.getItem("my_ticket_number");
    
    if (savedNumber) {
      setMyNumber(Number(savedNumber));
    }
    setIsHydrated(true);

    // 📢 1. 現在呼び出し中の複数リストをリアルタイム監視 ＋ 🔊 音を鳴らす
    onValue(ref(db, "calling_now_list"), (snapshot) => {
      const data = snapshot.val();
      const list: number[] = data ? Object.values(data).map(Number) : [];
      setCalledNumbers(list);

      const mySavedNumber = localStorage.getItem("my_ticket_number");
      if (mySavedNumber && list.length > 0) {
        const myNum = Number(mySavedNumber);
        
        if (list.includes(myNum) && lastPlayedNumber.current !== myNum && isSoundEnabled) {
          lastPlayedNumber.current = myNum;
          const audio = new Audio("/chime.mp3");
          audio.volume = 1.0;
          audio.play().catch((err) => console.log("音声再生エラー:", err));
        }
      }
    });

    // 📢 2. 【追加】発行済みの最新番号をリアルタイム監視
    onValue(ref(db, "last_issued_number"), (snapshot) => {
      const lastNumber = snapshot.val() || 0;
      setLastIssued(lastNumber);
      
      // 全リセット（0番）になったら画面と記憶をクリア
      if (lastNumber === 0) {
        setMyNumber(null);
        localStorage.removeItem("my_ticket_number");
        lastPlayedNumber.current = null;
        setIsSoundEnabled(false); 
      }
    });
  }, [isSoundEnabled]); 

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

  const toggleSoundSwitch = () => {
    if (!isSoundEnabled) {
      const audioTest = new Audio("/chime.mp3");
      audioTest.volume = 0.3; 
      audioTest.play()
        .then(() => setIsSoundEnabled(true))
        .catch((err) => alert("❌ 画面を一度タップしてからもう一度お試しください。"));
    } else {
      setIsSoundEnabled(false);
    }
  };

  if (!isHydrated) return null;

  const isMyTurn = myNumber !== null && calledNumbers.includes(myNumber);

  // 💡 1番から最新の発行済み番号までの配列（羅列）を作成する
  const allIssuedNumbers = Array.from({ length: lastIssued }, (_, i) => i + 1);

  return (
    <div className="max-w-md mx-auto min-h-screen p-6 bg-blue-50/50 flex flex-col justify-center">
      <div className="p-6 bg-white rounded-2xl shadow-xl border border-gray-150">
        <h1 className="text-xl font-black text-blue-600 mb-6 text-center">🍿 お客様用 整理券画面</h1>
        
        {/* 現在呼び出し中のメイン表示 */}
        <div className="text-center bg-gray-50 p-6 rounded-xl mb-4 border border-gray-100">
          <p className="text-xs text-gray-400 font-bold tracking-wider mb-1">現在お呼び出し中の番号</p>
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            {calledNumbers.length === 0 ? (
              <span className="text-4xl font-black text-blue-600">未</span>
            ) : (
              calledNumbers.map(n => (
                <span key={n} className="text-4xl font-black text-blue-600 bg-white px-3 py-1 rounded-xl shadow-sm border border-blue-100 animate-pulse">
                  {n}番
                </span>
              ))
            )}
          </div>
        </div>

        {/* 音声有効化トグル */}
        {myNumber !== null && (
          <div className={`p-4 rounded-xl mb-4 border flex items-center justify-between transition-all ${isSoundEnabled ? "bg-green-50 border-green-200" : "bg-red-50 border-red-100 animate-pulse"}`}>
            <div className="flex flex-col">
              <span className="text-xs font-black text-gray-700">{isSoundEnabled ? "🔔 呼び出し音: 有効" : "🔕 呼び出し音: 無効"}</span>
              <span className="text-[10px] text-gray-400 font-bold mt-0.5">{isSoundEnabled ? "順番が来るとチャイムが鳴ります" : "音を鳴らすにはONにしてください"}</span>
            </div>
            <button onClick={toggleSoundSwitch} className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 ${isSoundEnabled ? "bg-green-500 justify-end" : "bg-gray-300 justify-start"}`}><div className="bg-white w-4 h-4 rounded-full shadow-md"></div></button>
          </div>
        )}

        {/* 自分の整理券状況 */}
        {myNumber === null ? (
          <button onClick={handleIssueTicket} className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-md text-lg">
            整理券を発券する
          </button>
        ) : (
          <div className="text-center border-2 border-dashed border-blue-200 p-5 rounded-xl bg-blue-50/30 mb-4">
            <p className="text-xs text-gray-500 font-bold">あなたの整理券番号</p>
            <p className="text-6xl font-black text-blue-700 my-3">{myNumber} 番</p>
            
            <div className="mt-2 text-sm font-bold">
              {isMyTurn ? (
                <div className="bg-red-500 text-white p-3 rounded-lg animate-bounce shadow-md">
                  📢 あなたの順番です！窓口へどうぞ！
                </div>
              ) : (
                <p className="text-gray-500">
                  {calledNumbers.length > 0 ? "他の番号をお呼び出し中です。しばらくお待ちください。" : "呼び出し開始までそのままお待ちください。"}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 📋 【新設】発行済みのすべての番号を羅列表示するエリア */}
        <div className="border-t pt-4 mt-2">
          <p className="text-xs font-black text-gray-400 mb-2.5 text-center tracking-wider">📋 本日発券済みのすべての番号</p>
          <div className="flex flex-wrap justify-center gap-2 max-h-40 overflow-y-auto p-1 bg-gray-50 rounded-xl border border-gray-100">
            {allIssuedNumbers.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">まだ発券されていません</p>
            ) : (
              allIssuedNumbers.map((num) => {
                const isCalling = calledNumbers.includes(num);
                const isMyNum = myNumber === num;

                return (
                  <span
                    key={num}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm border transition-all ${
                      isCalling
                        ? "bg-green-500 text-white border-green-600 animate-pulse font-black" // 現在呼び出し中の番号
                        : isMyNum
                        ? "bg-blue-600 text-white border-blue-700 font-black ring-2 ring-blue-300" // 自分自身の番号
                        : "bg-white text-gray-600 border-gray-200" // その他の発行済み番号
                    }`}
                  >
                    {num}番 {isCalling && "📢"} {isMyNum && "⭐"}
                  </span>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
