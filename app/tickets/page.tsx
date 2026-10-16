"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { db } from "../firebase"; 
import { ref, onValue, set, get } from "firebase/database";

const TICKET_STORAGE_KEY = "my_ticket_number";
const TICKET_CHANGE_EVENT = "ticket-number-change";

// Subscribe to ticket changes made in this tab or another browser tab.
function subscribeToTicketNumber(onStoreChange: () => void) {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === TICKET_STORAGE_KEY || event.key === null) onStoreChange();
  };

  window.addEventListener("storage", handleStorageChange);
  window.addEventListener(TICKET_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener(TICKET_CHANGE_EVENT, onStoreChange);
  };
}

function getTicketNumberSnapshot() {
  return localStorage.getItem(TICKET_STORAGE_KEY);
}

// Use the same initial ticket state for server rendering and hydration.
function getServerTicketNumberSnapshot() {
  return null;
}

function saveTicketNumber(value: string | null) {
  if (value === null) {
    localStorage.removeItem(TICKET_STORAGE_KEY);
  } else {
    localStorage.setItem(TICKET_STORAGE_KEY, value);
  }

  window.dispatchEvent(new Event(TICKET_CHANGE_EVENT));
}

export default function TicketPage() {
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]); 
  const [issuedTickets, setIssuedTickets] = useState<number[]>([]);
  const savedTicketNumber = useSyncExternalStore(
    subscribeToTicketNumber,
    getTicketNumberSnapshot,
    getServerTicketNumberSnapshot,
  );
  const myNumber = savedTicketNumber === null ? null : Number(savedTicketNumber);
  
  const [isSoundEnabled, setIsSoundEnabled] = useState(false); 
  const lastPlayedNumber = useRef<number | null>(null);

  useEffect(() => {
    // Subscribe to active calls and play a chime when this ticket is called.
    const unsubscribeCalling = onValue(ref(db, "calling_now_list"), (snapshot) => {
      const data = snapshot.val();
      const list: number[] = data ? Object.values(data).map(Number) : [];
      setCalledNumbers(list);

      const mySavedNumber = localStorage.getItem(TICKET_STORAGE_KEY);
      if (mySavedNumber && list.length > 0) {
        const myNum = Number(mySavedNumber);
        if (list.includes(myNum) && lastPlayedNumber.current !== myNum && isSoundEnabled) {
          lastPlayedNumber.current = myNum;
          const audio = new Audio("/chime.mp3");
          audio.volume = 1.0;
          audio.play().catch((err) => console.log(err));
        }
      }
    });

    // Keep the issued-ticket list in sync and clear tickets removed by an admin.
    const unsubscribeIssued = onValue(ref(db, "issued_tickets"), (snapshot) => {
      const data = snapshot.val();
      const mySavedNumber = localStorage.getItem(TICKET_STORAGE_KEY);
      
      if (data) {
        const activeList = Object.keys(data).map(Number).sort((a, b) => a - b);
        setIssuedTickets(activeList);

        // Clear this ticket if an admin removes it.
        if (mySavedNumber && !data[Number(mySavedNumber)]) {
          saveTicketNumber(null);
          localStorage.removeItem("is_sound_enabled");
          setIsSoundEnabled(false);
        }
      } else {
        setIssuedTickets([]);
        saveTicketNumber(null);
        localStorage.removeItem("is_sound_enabled");
        setIsSoundEnabled(false);
      }
    });

    // Stop listening when the ticket page unmounts.
    return () => {
      unsubscribeCalling();
      unsubscribeIssued();
    };
  }, [isSoundEnabled]); 

  // Claim the next ticket number and store it for this browser.
  const handleIssueTicket = async () => {
    if (myNumber !== null) return;
    const lastIssuedRef = ref(db, "last_issued_number");
    const snapshot = await get(lastIssuedRef);
    const lastNumber = snapshot.val() || 0;
    const nextTicketNumber = lastNumber + 1; 

    await set(ref(db, `issued_tickets/${nextTicketNumber}`), true);
    await set(lastIssuedRef, nextTicketNumber);
    
    saveTicketNumber(String(nextTicketNumber));
  };

  // Test audio playback first so the browser can grant permission for future chimes.
  const toggleSoundSwitch = () => {
    if (!isSoundEnabled) {
      const audioTest = new Audio("/chime.mp3");
      audioTest.volume = 0.3; 
      audioTest.play()
        .then(() => setIsSoundEnabled(true))
        .catch(() => alert("❌ 画面を一度タップしてからもう一度お試しください。"));
    } else {
      setIsSoundEnabled(false);
    }
  };

  // Mark this ticket as cancelled and remove it from the active ticket list.
  const handleCancelTicket = async () => {
    if (myNumber === null) return;
    if (confirm("この整理券を取り消しますか？")) {
      await set(ref(db, `cancelled_numbers/${myNumber}`), true);
      await set(ref(db, `issued_tickets/${myNumber}`), null);
      saveTicketNumber(null);
      localStorage.removeItem("is_sound_enabled");
      setIsSoundEnabled(false);
    }
  };

  const isMyTurn = myNumber !== null && calledNumbers.includes(myNumber);

  return (
    <div className="max-w-md mx-auto min-h-screen p-6 bg-blue-50/50 flex flex-col justify-center">
      <div className="p-6 bg-white rounded-2xl shadow-xl border border-gray-150">
        <h1 className="text-xl font-black text-blue-600 mb-6 text-center">🍿 お客様用 整理券画面</h1>
        
        <div className="text-center bg-gray-50 p-6 rounded-xl mb-4 border border-gray-100">
          <p className="text-xs text-gray-400 font-bold tracking-wider mb-1">現在お呼び出し中の番号</p>
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            {calledNumbers.length === 0 ? <span className="text-4xl font-black text-blue-600">なし</span> : calledNumbers.map(n => <span key={n} className="text-4xl font-black text-blue-600 bg-white px-3 py-1 rounded-xl shadow-sm border border-blue-100 animate-pulse">{n}番</span>)}
          </div>
        </div>

        {myNumber !== null && (
          <div className={`p-4 rounded-xl mb-4 border flex items-center justify-between transition-all ${isSoundEnabled ? "bg-green-50 border-green-200" : "bg-red-50 border-red-100 animate-pulse"}`}>
            <div className="flex flex-col"><span className="text-xs font-black text-gray-700">{isSoundEnabled ? "🔔 呼び出し音: 有効" : "🔕 呼び出し音: 無効"}</span><span className="text-[10px] text-gray-400 font-bold mt-0.5">{isSoundEnabled ? "順番が来るとチャイムが鳴ります" : "音を鳴らすにはONにしてください"}</span></div>
            <button onClick={toggleSoundSwitch} className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 ${isSoundEnabled ? "bg-green-500 justify-end" : "bg-gray-300 justify-start"}`}><div className="bg-white w-4 h-4 rounded-full shadow-md"></div></button>
          </div>
        )}

        {myNumber === null ? (
          <button onClick={handleIssueTicket} className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-md text-lg">整理券を発券する</button>
        ) : (
          <div className="text-center border-2 border-dashed border-blue-200 p-5 rounded-xl bg-blue-50/30 mb-4">
            <p className="text-xs text-gray-500 font-bold">あなたの整理券番号</p><p className="text-6xl font-black text-blue-700 my-3">{myNumber} 番</p>
            <div className="mt-2 text-sm font-bold">{isMyTurn ? <div className="bg-red-500 text-white p-3 rounded-lg animate-bounce shadow-md">📢 あなたの順番です！窓口へどうぞ！</div> : <p className="text-gray-500">{calledNumbers.length > 0 ? "他の番号をお呼び出し中です。しばらくお待ちください。" : "呼び出し開始までそのままお待ちください。"}</p>}</div>
            <button onClick={handleCancelTicket} className="mt-6 text-xs text-gray-400 hover:text-red-500 underline block mx-auto">整理券を取り消す</button>
          </div>
        )}

        {/* Issued ticket numbers */}
        <div className="border-t pt-4 mt-2">
          <p className="text-xs font-black text-gray-400 mb-2.5 text-center tracking-wider">📋 本日発券済みのすべての番号</p>
          <div className="flex flex-wrap justify-center gap-2 max-h-40 overflow-y-auto p-1 bg-gray-50 rounded-xl border border-gray-100">
            {issuedTickets.length === 0 ? <p className="text-xs text-gray-400 italic py-2">まだ発券されていません</p> : issuedTickets.map((num) => {
                const isCalling = calledNumbers.includes(num);
                const isMyNum = myNumber === num;
                return <span key={num} className={`text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm border transition-all ${isCalling ? "bg-green-500 text-white border-green-600 animate-pulse font-black" : isMyNum ? "bg-blue-600 text-white border-blue-700 font-black ring-2 ring-blue-300" : "bg-white text-gray-600 border-gray-200"}`}>{num}番 {isCalling && "📢"} {isMyNum && "⭐"}</span>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}