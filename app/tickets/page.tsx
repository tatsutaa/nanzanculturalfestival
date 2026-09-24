"use client";

import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase"; 
import { ref, onValue, set, get } from "firebase/database";

export default function TicketPage() {
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]); // 💡 呼び出し中の番号リスト
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
    const unsubscribeCurrent = onValue(ref(db, "calling_now_list"), (snapshot) => {
      const data = snapshot.val();
      const list: number[] = data ? Object.values(data).map(Number) : [];
      setCalledNumbers(list);

      // スマホ内の自分の番号をチェック
      const mySavedNumber = localStorage.getItem("my_ticket_number");
      if (mySavedNumber && list.length > 0) {
        const myNum = Number(mySavedNumber);
        
        // 💡 呼び出し中リストの中に「自分の番号」が含まれた瞬間、かつ未再生、かつスイッチONのとき
        if (list.includes(myNum) && lastPlayedNumber.current !== myNum && isSoundEnabled) {
          lastPlayedNumber.current = myNum;
          
          const audio = new Audio("/chime.mp3");
          audio.volume = 1.0;
          audio.play().catch((err) => console.log("音声再生エラー:", err));
        }
      }
    });

    // 📢 2. 全リセットの監視
    const unsubscribeLast = onValue(ref(db, "last_issued_number"), (snapshot) => {
      const lastNumber = snapshot.val();
      if (lastNumber === 0) {
        setMyNumber(null);
        localStorage.removeItem("my_ticket_number");
        lastPlayedNumber.current = null;
        setIsSoundEnabled(false); 
      }
    });

    return () => {
      unsubscribeCurrent();
      unsubscribeLast();
    };
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

  // 💡 自分の番号が現在呼び出し中リストに含まれているか
  const isMyTurn = myNumber !== null && calledNumbers.includes(myNumber);

  return (
    <div className="max-w-md mx-auto min-h-screen p-6 bg-blue-50/50 flex flex-col justify-center">
      <div className="p-6 bg-white rounded-2xl shadow-xl border border-gray-150">
        <h1 className="text-xl font-black text-blue-600 mb-6 text-center">🍿 お客様用 整理券画面</h1>
        
        <div className="text-center bg-gray-50 p-6 rounded-xl mb-4 border border-gray-100">
          <p className="text-xs text-gray-400 font-bold tracking-wider mb-1">現在お呼び出し中の番号</p>
          <p className="text-4xl font-black text-blue-600">
            {calledNumbers.length === 0 ? "未" : calledNumbers.map(n => `${n}番 `)}
          </p>
        </div>

        {/* 💡 履歴表示エリア（callHistory）はきれいに全削除しました！ */}

        {myNumber !== null && (
          <div className={`p-4 rounded-xl mb-4 border flex items-center justify-between transition-all ${isSoundEnabled ? "bg-green-50 border-green-200" : "bg-red-50 border-red-100 animate-pulse"}`}>
            <div className="flex flex-col">
              <span className="text-xs font-black text-gray-700">{isSoundEnabled ? "🔔 呼び出し音: 有効" : "🔕 呼び出し音: 無効"}</span>
              <span className="text-[10px] text-gray-400 font-bold mt-0.5">{isSoundEnabled ? "順番が来るとチャイムが鳴ります" : "音を鳴らすにはONにしてください"}</span>
            </div>
            <button onClick={toggleSoundSwitch} className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 ${isSoundEnabled ? "bg-green-500 justify-end" : "bg-gray-300 justify-start"}`}><div className="bg-white w-4 h-4 rounded-full shadow-md"></div></button>
          </div>
        )}

        {myNumber === null ? (
          <button onClick={handleIssueTicket} className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-md text-lg">
            整理券を発券する
          </button>
        ) : (
          <div className="text-center border-2 border-dashed border-blue-200 p-5 rounded-xl bg-blue-50/30">
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
      </div>
    </div>
  );
}
