"use client";

import React, { useState, useEffect } from "react";
import { db } from "../../firebase"; 
import { ref, onValue, set, get } from "firebase/database";

export default function AdminTicketPage() {
  const [lastIssued, setLastIssued] = useState(0);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [calculatorInput, setCalculatorInput] = useState(""); 
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (localStorage.getItem("is_admin_authenticated") === "true") setIsAuthenticated(true);
    onValue(ref(db, "last_issued_number"), (s) => setLastIssued(s.val() || 0));
    
    onValue(ref(db, "calling_now_list"), (s) => {
      const data = s.val();
      setCalledNumbers(data ? Object.values(data).map(Number) : []);
    });
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "Tacchan") {
      setIsAuthenticated(true);
      localStorage.setItem("is_admin_authenticated", "true");
    } else { setErrorMsg("❌ パスワード不一致"); }
  };

  const executeCall = async (num: number) => {
    if (!num || num <= 0 || num > lastIssued) return alert("正しい発券済みの番号を指定してください");
    const listRef = ref(db, "calling_now_list");
    const s = await get(listRef);
    const currentList: number[] = s.val() ? Object.values(s.val()).map(Number) : [];
    if (!currentList.includes(num)) {
      const updated = [...currentList, num].sort((a, b) => a - b);
      await set(listRef, updated);
    }
  };

  const executeUndoCall = async (num: number) => {
    if (confirm(`${num}番の呼び出しを取り消しますか？`)) {
      const listRef = ref(db, "calling_now_list");
      const s = await get(listRef);
      const currentList: number[] = s.val() ? Object.values(s.val()).map(Number) : [];
      const updated = currentList.filter(n => n !== num);
      await set(listRef, updated.length ? updated : null);
    }
  };

  const executeUndoIssue = async (num: number) => {
    if (calledNumbers.includes(num)) return alert("呼び出し中の番号は発券取り消しできません。先に呼び出しを取り消してください。");
    if (confirm(`「${num}番」の発券自体を取り消しますか？`)) {
      if (num === lastIssued) {
        await set(ref(db, "last_issued_number"), lastIssued - 1);
      }
    }
  };

  const handleResetAll = async () => {
    if (confirm("全ての整理券データを完全にリセットしますか？")) {
      await set(ref(db, "last_issued_number"), 0);
      await set(ref(db, "calling_now_list"), null); 
      setCalculatorInput("");
    }
  };

  const allActiveNumbers = Array.from({ length: lastIssued }, (_, i) => i + 1);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto min-h-screen p-6 bg-gray-100 flex flex-col justify-center">
        <form onSubmit={handleLogin} className="p-6 bg-white rounded-2xl shadow-xl flex flex-col gap-4">
          <h1 className="text-xl font-black text-center">🔐 管理者認証</h1>
          <input type="password" placeholder="パスワードを入力..." value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="p-3 border rounded-xl" />
          {errorMsg && <p className="text-xs text-red-500 font-bold text-center">{errorMsg}</p>}
          <button type="submit" className="w-full py-3 bg-red-500 text-white font-bold rounded-xl">ロック解除</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen p-4 bg-red-50/30 flex flex-col gap-4">
      <div className="p-5 bg-white rounded-2xl shadow-xl border border-red-100">
        <div className="flex justify-between mb-3">
          <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 font-bold">管理ボード</span>
          <button onClick={() => { setIsAuthenticated(false); localStorage.removeItem("is_admin_authenticated"); }} className="text-xs text-gray-400 hover:text-red-500 underline">🚪 ログアウト</button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="text-center bg-red-50/50 p-3 rounded-xl border border-red-100"><p className="text-xs text-red-400 font-bold">発行済みの最新</p><p className="text-3xl font-black text-red-600">{lastIssued} 番</p></div>
          <div className="text-center bg-gray-50 p-3 rounded-xl border"><p className="text-xs text-gray-400 font-bold">現在呼び出し中の数</p><p className="text-3xl font-black text-gray-700">{calledNumbers.length} 組</p></div>
        </div>

        {/* 📋 【新設】店員側にも発行済み全番号の「羅列バッジ一覧」を配置 */}
        <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
          <p className="text-[10px] text-gray-400 font-black mb-1.5 text-center tracking-wider">📊 発行済みバッジ一覧（緑が現在呼び出し中）</p>
          <div className="flex flex-wrap justify-center gap-1.5 max-h-24 overflow-y-auto">
            {allActiveNumbers.length === 0 ? (
              <p className="text-xs text-gray-400 italic">未発券</p>
            ) : (
              allActiveNumbers.map((num) => {
                const isCalling = calledNumbers.includes(num);
                return (
                  <span
                    key={num}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded border transition-all ${
                      isCalling
                        ? "bg-green-500 text-white border-green-600 font-black animate-pulse" // 呼び出し中
                        : "bg-white text-gray-600 border-gray-200" // 待機中
                    }`}
                  >
                    {num}番
                  </span>
                );
              })
            )}
          </div>
        </div>

        {/* 🔢 電卓パネル */}
        <div className="bg-gray-900 p-3 rounded-xl mb-4">
          <div className="bg-black text-right text-green-400 font-mono text-xl p-2 rounded mb-2 h-10 flex items-center justify-end">{calculatorInput || "0"}<span className="text-xs text-gray-500 ml-1">番</span></div>
          <div className="grid grid-cols-6 gap-1">
            {["1","2","3","4","5","6","7","8","9","0"].map(n => <button key={n} onClick={() => setCalculatorInput(p => p + n)} className="py-1 bg-gray-800 text-white font-bold rounded">{n}</button>)}
            <button onClick={() => setCalculatorInput("")} className="py-1 bg-gray-600 text-white font-bold rounded">C</button>
            <button onClick={() => { executeCall(Number(calculatorInput)); setCalculatorInput(""); }} className="py-1 bg-green-600 text-white text-xs font-bold rounded">呼出</button>
          </div>
        </div>

        {/* 📋 各番号の操作（三択リスト） */}
        <div className="border-t pt-3">
          <p className="text-xs font-black text-gray-500 mb-2">📋 各番号の操作（三択リスト）</p>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {allActiveNumbers.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-4">発券された番号はありません</p>
            ) : (
              allActiveNumbers.map((num) => {
                const isCalled = calledNumbers.includes(num);
                return (
                  <div key={num} className={`flex items-center justify-between p-2 rounded-xl border text-xs ${isCalled ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-150"}`}>
                    <span className="font-black text-gray-700 w-16">{num}番 {isCalled && "📢"}</span>
                    <div className="flex gap-1">
                      <button onClick={() => executeCall(num)} className={`px-2 py-1 rounded font-bold text-[10px] ${isCalled ? "bg-green-600 text-white" : "bg-white border text-green-600"}`}>呼出</button>
                      <button onClick={() => executeUndoCall(num)} disabled={!isCalled} className="px-2 py-1 bg-white border text-red-500 disabled:opacity-30 rounded font-bold text-[10px]">呼出取消</button>
                      <button onClick={() => executeUndoIssue(num)} disabled={isCalled} className="px-2 py-1 bg-white border text-orange-600 disabled:opacity-30 rounded font-bold text-[10px]">発券取消</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="border-t mt-4 pt-3 text-center"><button onClick={handleResetAll} className="text-gray-400 text-xs font-bold underline">🛠️ データを全リセット</button></div>
      </div>
    </div>
  );
}
