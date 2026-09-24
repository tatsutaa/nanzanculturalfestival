"use client";

import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase"; 
import { ref, onValue, set, get } from "firebase/database";

export default function TicketPage() {
  const [currentNumber, setCurrentNumber] = useState(0);
  const [myNumber, setMyNumber] = useState<number | null>(null);
  const [callHistory, setCallHistory] = useState<number[]>([]); 
  const [isHydrated, setIsHydrated] = useState(false);
  
  // 💡 【修正】あえてlocalStorageには保存せず、リロード時は必ず「false(無効)」からスタートします
  const [isSoundEnabled, setIsSoundEnabled] = useState(false); 
  const lastPlayedNumber = useRef<number | null>(null);

  useEffect(() => {
    const savedNumber = localStorage.getItem("my_ticket_number");
    const lastRef = ref(db, "last_issued_number");
    const historyRef = ref(db, "call_history");
    const currentRef = ref(db, "current_called_number");
    
    if (savedNumber) {
      setMyNumber(Number(savedNumber));
    }
    setIsHydrated(true);

    // 📢 1. 現在の呼び出し番号を監視 ＋ 🔊 音を鳴らす
    const unsubscribeCurrent = onValue(currentRef, (snapshot) => {
      const data = snapshot.val() || 0;
      setCurrentNumber(data);

      const mySavedNumber = localStorage.getItem("my_ticket_number");
      if (mySavedNumber && data > 0) {
        const myNum = Number(mySavedNumber);
        
        // スイッチがONのときだけ鳴らす
        if (data === myNum && lastPlayedNumber.current !== data && isSoundEnabled) {
          lastPlayedNumber.current = data;
          
          const audio = new Audio("/chime.mp3");
          audio.volume = 1.0;
          audio.play().catch((err) => {
            console.log("音声再生エラー:", err);
          });
        }
      }
    });

    // 📢 2. 独立した呼び出し履歴をリアルタイム受信
    const unsubscribeHistory = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const numbers = Object.values(data).map(Number).filter((n) => !isNaN(n));
        setCallHistory(numbers);
      } else {
        setCallHistory([]);
      }
    });

    // 📢 3. 全リセットの監視
    const unsubscribeLast = onValue(lastRef, (snapshot) => {
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
      unsubscribeHistory();
      unsubscribeLast();
    };
  }, [isSoundEnabled]); 

  // 整理券を発券する
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

  // 音声を有効化するスイッチ（トグル）が押された時の処理
  const toggleSoundSwitch = () => {
    if (!isSoundEnabled) {
      // 💡 ユーザー自身にボタンを押してもらうことで、ブラウザの音ブロックを100%確実に解除します！
      const audioTest = new Audio("/chime.mp3");
      audioTest.volume = 0.3; 
      audioTest.play()
        .then(() => {
          setIsSoundEnabled(true);
        })
        .catch((err) => {
          alert("❌ 画面のどこかを1回タップしてから、もう一度スイッチを押してください。");
          console.log(err);
        });
    } else {
      setIsSoundEnabled(false);
    }
  };

  const handleCancelTicket = async () => {
    if (myNumber === null) return;
    if (confirm("この整理券を取り消しますか？")) {
      const cancelRef = ref(db, `cancelled_numbers/${myNumber}`);
      await set(cancelRef, true);
      setMyNumber(null);
      localStorage.removeItem("my_ticket_number");
    }
  };

  if (!isHydrated) return null;

  return (
    <div className="max-w-md mx-auto min-h-screen p-6 bg-blue-50/50 flex flex-col justify-center">
      <div className="p-6 bg-white rounded-2xl shadow-xl border border-gray-150">
        <h1 className="text-xl font-black text-blue-600 mb-6 text-center">🍿 お客様用 整理券画面</h1>
        
        <div className="text-center bg-gray-50 p-6 rounded-xl mb-4 border border-gray-100">
          <p className="text-xs text-gray-400 font-bold tracking-wider mb-1">現在お呼び出し中の番号</p>
          <p className="text-6xl font-black text-blue-600">
            {currentNumber === 0 ? "未" : `${currentNumber} 番`}
          </p>
        </div>

        {callHistory.length > 1 && (
          <div className="bg-gray-50/60 rounded-xl p-3 mb-4 border border-dashed border-gray-200">
            <p className="text-[11px] text-gray-400 font-bold mb-1.5 text-center">📢 まえに呼んだ番号（履歴）</p>
            <div className="flex justify-center gap-3 text-sm font-bold text-gray-500">
              {callHistory.slice(1, 4).map((num, i) => (
                <span key={i} className="bg-white px-3 py-1 rounded-md shadow-sm border border-gray-100">
                  {num} 番
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 🛠️ 【UIデザイン改善】リロードされたら必ず赤く点滅し、お客様に「音を有効にしてね」と促す親切設計 */}
        {myNumber !== null && (
          <div className={`p-4 rounded-xl mb-4 border flex items-center justify-between transition-all ${isSoundEnabled ? "bg-green-50 border-green-200" : "bg-red-50 border-red-100 animate-pulse"}`}>
            <div className="flex flex-col">
              <span className="text-xs font-black text-gray-700">
                {isSoundEnabled ? "🔔 呼び出し音: 有効" : "🔕 呼び出し音: 無効"}
              </span>
              <span className="text-[10px] text-gray-400 font-bold mt-0.5">
                {isSoundEnabled ? "順番が来るとチャイムが鳴ります" : "リロードされました！音を鳴らすにはONにしてください"}
              </span>
            </div>
            
            <button
              onClick={toggleSoundSwitch}
              className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${isSoundEnabled ? "bg-green-500 justify-end" : "bg-gray-300 justify-start"}`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md duration-300"></div>
            </button>
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
              {currentNumber === myNumber ? (
                <div className="bg-red-500 text-white p-3 rounded-lg animate-bounce shadow-md">
                  📢 あなたの順番です！窓口へどうぞ！
                </div>
              ) : currentNumber > myNumber ? (
                <div className="bg-gray-400 text-white p-3 rounded-lg text-xs">
                  ⚠️ あなたの番号（{myNumber}番）は呼び出しを通過しました
                </div>
              ) : (
                <p className="text-gray-600">
                  あと <span className="text-xl text-red-500 font-black">{myNumber - currentNumber}人</span> 待ちです
                </p>
              )}
            </div>

            <button onClick={handleCancelTicket} className="mt-6 text-xs text-gray-400 hover:text-red-500 underline block mx-auto">
              整理券を取り消す
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
