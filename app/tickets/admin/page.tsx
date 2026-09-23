"use client";

import React, { useState, useEffect } from "react";
import { db } from "../../firebase"; 
import { ref, onValue, set, get } from "firebase/database";

export default function AdminTicketPage() {
  const [currentNumber, setCurrentNumber] = useState(0);
  const [lastIssued, setLastIssued] = useState(0);
  const [cancelledNumbers, setCancelledNumbers] = useState<number[]>([]); 
  const [callHistory, setCallHistory] = useState<number[]>([]); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [calculatorInput, setCalculatorInput] = useState(""); 
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (localStorage.getItem("is_admin_authenticated") === "true") setIsAuthenticated(true);
    onValue(ref(db, "current_called_number"), (s) => setCurrentNumber(s.val() || 0));
    onValue(ref(db, "last_issued_number"), (s) => setLastIssued(s.val() || 0));
    onValue(ref(db, "cancelled_numbers"), (s) => setCancelledNumbers(s.val() ? Object.keys(s.val()).map(Number).sort((a,b)=>a-b) : []));
    onValue(ref(db, "call_history"), (s) => setCallHistory(s.val() ? Object.values(s.val()).map(Number) : []));
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "secret-admin-pass") {
      setIsAuthenticated(true);
      localStorage.setItem("is_admin_authenticated", "true");
    } else { setErrorMsg("❌ パスワード不一致"); }
  };

  const updateHistory = async (num: number) => {
    const s = await get(ref(db, "call_history"));
    const cur: number[] = s.val() ? Object.values(s.val()).map(Number) : [];
    const updated = [num, ...cur.filter(n => n !== num)].slice(0, 4);
    await set(ref(db, "call_history"), updated);
  };

  // 1️⃣ 指定呼び出しの処理
  const executeCall = async (num: number) => {
    if (!num || num <= 0 || num > lastIssued) return alert("正しい発券済みの番号を指定してください");
    await set(ref(db, "current_called_number"), num);
    await updateHistory(num);
  };

  // 2️⃣ 指定呼び出しキャンセルの処理
  const executeUndoCall = async (num: number) => {
    if (confirm(`${num}番の呼び出し履歴を取り消しますか？`)) {
      const s = await get(ref(db, "call_history"));
      const updated = (s.val() ? Object.values(s.val()).map(Number) : []).filter(n => n !== num);
      await set(ref(db, "call_history"), updated.length ? updated : null);
      if (currentNumber === num) await set(ref(db, "current_called_number"), updated.length ? updated[0] : 0);
    }
  };

  // 3️⃣ 指定発券キャンセルの処理
  const executeUndoIssue = async (num: number) => {
    if (num <= currentNumber) return alert("呼び出し中・呼び出し済みの番号は取り消せません。");
    if (confirm(`「${num}番」の発券自体を取り消しますか？`)) {
      if (num === lastIssued) await set(ref(db, "last_issued_number"), lastIssued - 1);
      await set(ref(db, `cancelled_numbers/${num}`), null);
      const s = await get(ref(db, "call_history"));
      const updatedH = (s.val() ? Object.values(s.val()).map(Number) : []).filter(n => n !== num);
      await set(ref(db, "call_history"), updatedH.length ? updatedH : null);
    }
  };

  const handleResetAll = async () => {
    if (confirm("全ての整理券データを完全にリセットしますか？")) {
      await set(ref(db, "current_called_number"), 0);
      await set(ref(db, "last_issued_number"), 0);
      await set(ref(db, "cancelled_numbers"), null); 
      await set(ref(db, "call_history"), null); 
      setCalculatorInput("");
    }
  };

  // 発行済みの全番号を配列にして羅列を作る
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
          <div className="text-center bg-red-50/50 p-3 rounded-xl border border-red-100"><p className="text-xs text-red-400 font-bold">現在呼び出し中</p><p className="text-3xl font-black text-red-600">{currentNumber} 番</p></div>
          <div className="text-center bg-gray-50 p-3 rounded-xl border"><p className="text-xs text-gray-400 font-bold">発行済みの最新</p><p className="text-3xl font-black text-gray-700">{lastIssued} 番</p></div>
        </div>

        {/* ❌ お客様が自分でキャンセルした抜け番リスト */}
        {cancelledNumbers.length > 0 && (
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-2.5 mb-3 text-xs">
            <p className="text-orange-700 font-black mb-1">客側キャンセル（抜け番）: {cancelledNumbers.map(n => `${n}番 `)}</p>
          </div>
        )}

        {/* 🔢 計算機（テンキー）パネル入力もそのまま残しています */}
        <div className="bg-gray-900 p-3 rounded-xl mb-4">
          <div className="bg-black text-right text-green-400 font-mono text-xl p-2 rounded mb-2 h-10 flex items-center justify-end">{calculatorInput || "0"}<span className="text-xs text-gray-500 ml-1">番</span></div>
          <div className="grid grid-cols-6 gap-1">
            {["1","2","3","4","5","6","7","8","9","0"].map(n => <button key={n} onClick={() => setCalculatorInput(p => p + n)} className="py-1 bg-gray-800 text-white font-bold rounded">{n}</button>)}
            <button onClick={() => setCalculatorInput("")} className="py-1 bg-gray-600 text-white font-bold rounded">C</button>
            <button onClick={() => { executeCall(Number(calculatorInput)); setCalculatorInput(""); }} className="py-1 bg-green-600 text-white text-xs font-bold rounded">呼出</button>
          </div>
        </div>

        <button onClick={async () => { const n = currentNumber + 1; if (n <= lastIssued) executeCall(n); }} disabled={currentNumber >= lastIssued && lastIssued > 0} className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-200 text-white font-bold rounded-xl text-sm mb-4">📢 次の連番（{currentNumber + 1}番）を呼び出す</button>

        {/* 📋 【新設】発行済みのすべての番号を羅列し、三択で個別管理するエリア */}
        <div className="border-t pt-3">
          <p className="text-xs font-black text-gray-500 mb-2">📋 発行済み番号の個別操作（三択リスト）</p>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {allActiveNumbers.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-4">発券された番号はありません</p>
            ) : (
              allActiveNumbers.map((num) => {
                const isCalled = currentNumber === num;
                const inHistory = callHistory.includes(num);
                const isCancelled = cancelledNumbers.includes(num);

                return (
                  <div key={num} className={`flex items-center justify-between p-2 rounded-xl border text-xs ${isCalled ? "bg-red-50 border-red-200" : isCancelled ? "bg-orange-50/60 border-orange-100 opacity-60" : "bg-gray-50 border-gray-150"}`}>
                    <span className="font-black text-gray-700 w-10">
                      {num}番 {isCalled && "📢"} {isCancelled && "❌"}
                    </span>
                    
                    {/* 🛠️ 各番号の横に並ぶ、直感的な「三択ボタン」 */}
                    <div className="flex gap-1">
                      <button onClick={() => executeCall(num)} className={`px-2 py-1 rounded font-bold text-[10px] ${isCalled ? "bg-green-600 text-white" : "bg-white border text-green-600"}`}>
                        呼出
                      </button>
                      <button onClick={() => executeUndoCall(num)} disabled={!inHistory} className="px-2 py-1 bg-white border text-red-500 disabled:opacity-30 rounded font-bold text-[10px]">
                        呼出取消
                      </button>
                      <button onClick={() => executeUndoIssue(num)} disabled={num <= currentNumber} className="px-2 py-1 bg-white border text-orange-600 disabled:opacity-30 rounded font-bold text-[10px]">
                        発券取消
                      </button>
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
