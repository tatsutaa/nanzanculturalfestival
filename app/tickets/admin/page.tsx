"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { ref, onValue, set, get } from "firebase/database";
import { useLanguage } from "../../language";
import type { MessageKey } from "../../language";

const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;

export default function AdminTicketPage() {
  const { t } = useLanguage();
  const [issuedTickets, setIssuedTickets] = useState<number[]>([]); 
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]); 
  const [cancelledNumbers, setCancelledNumbers] = useState<number[]>([]); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [calculatorInput, setCalculatorInput] = useState(""); 
  const [errorMsg, setErrorMsg] = useState<MessageKey | null>(null);

  useEffect(() => {
    // Restore the Firebase session and allow only the configured administrator.
    return onAuthStateChanged(auth, (user) => {
      const isAdmin = Boolean(user && ADMIN_UID && user.uid === ADMIN_UID);
      setIsAuthenticated(isAdmin);
      setIsAuthLoading(false);

      if (user && !isAdmin) {
        setErrorMsg("noAdminPermission");
        void signOut(auth);
      }
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Keep the ticket lists synchronized with Firebase.
    const unsubscribeIssued = onValue(ref(db, "issued_tickets"), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setIssuedTickets(Object.keys(data).map(Number).sort((a, b) => a - b));
      } else {
        setIssuedTickets([]);
      }
    });

    const unsubscribeCalling = onValue(ref(db, "calling_now_list"), (snapshot) => {
      const data = snapshot.val();
      setCalledNumbers(data ? Object.values(data).map(Number) : []);
    });

    const unsubscribeCancelled = onValue(ref(db, "cancelled_numbers"), (snapshot) => {
      const data = snapshot.val();
      setCancelledNumbers(data ? Object.keys(data).map(Number).sort((a, b) => a - b) : []);
    });

    // Stop listening when the admin page unmounts.
    return () => {
      unsubscribeIssued();
      unsubscribeCalling();
      unsubscribeCancelled();
    };
  }, [isAuthenticated]);

  // Sign in with the admin account configured in Firebase Authentication.
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!ADMIN_UID) {
      setErrorMsg("missingAdminUid");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
      setPasswordInput("");
    } catch {
      setErrorMsg("loginFailed");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // Add a valid issued ticket to the active calling list.
  const executeCall = async (num: number) => {
    if (!num || num <= 0 || !issuedTickets.includes(num)) return alert(t("invalidTicketAlert"));
    if (cancelledNumbers.includes(num)) {
      await set(ref(db, `cancelled_numbers/${num}`), null);
    }
    const listRef = ref(db, "calling_now_list");
    const s = await get(listRef);
    const currentList: number[] = s.val() ? Object.values(s.val()).map(Number) : [];
    if (!currentList.includes(num)) {
      const updated = [...currentList, num].sort((a, b) => a - b);
      await set(listRef, updated);
    }
  };

  // Remove a ticket from the active calling list after confirmation.
  const executeUndoCall = async (num: number) => {
    if (confirm(t("confirmUndoCall", { num }))) {
      const listRef = ref(db, "calling_now_list");
      const s = await get(listRef);
      const currentList: number[] = s.val() ? Object.values(s.val()).map(Number) : [];
      const updated = currentList.filter(n => n !== num);
      await set(listRef, updated.length ? updated : null);
    }
  };

  // Remove an issued ticket and update the last-issued number when needed.
  const executeUndoIssue = async (num: number) => {
    if (calledNumbers.includes(num)) return alert(t("cannotUndoCalledTicket"));
    if (confirm(t("confirmUndoIssue", { num }))) {
      
      // If the latest ticket is removed, roll the counter back to the previous ticket.
      const maxIssued = issuedTickets.length > 0 ? Math.max(...issuedTickets) : 0;
      if (num === maxIssued) {
        const nextLast = issuedTickets.length > 1 ? issuedTickets[issuedTickets.length - 2] : 0;
        await set(ref(db, "last_issued_number"), nextLast);
      }
      
      await set(ref(db, `issued_tickets/${num}`), null);
      await set(ref(db, `cancelled_numbers/${num}`), null);
    }
  };

  // Call the lowest-numbered ticket that has not been called yet.
  const handleNextCall = async () => {
    const uncalled = issuedTickets.filter(num => !calledNumbers.includes(num));
    if (uncalled.length > 0) {
      await executeCall(uncalled[0]);
    } else {
      alert(t("noUncalledTickets"));
    }
  };

  // Clear ticketing data while leaving the shooting-game leaderboard untouched.
  const handleResetAll = async () => {
    if (confirm(t("confirmResetTickets"))) {
      await set(ref(db, "last_issued_number"), 0);
      await set(ref(db, "calling_now_list"), null); 
      await set(ref(db, "cancelled_numbers"), null); 
      await set(ref(db, "issued_tickets"), null); 
      setCalculatorInput("");
    }
  };

  // Clear only the shooting-game leaderboard.
  const handleResetRanking = async () => {
    if (confirm(t("confirmResetRanking"))) {
      await set(ref(db, "ranking"), null);
      alert(t("rankingResetDone"));
    }
  };

  if (isAuthLoading) {
    return (
      <div className="max-w-md mx-auto min-h-screen p-6 flex items-center justify-center">
        <p className="text-sm text-gray-500">{t("authChecking")}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto min-h-screen p-6 bg-gray-100 flex flex-col justify-center">
        <form onSubmit={handleLogin} className="p-6 bg-white rounded-2xl shadow-xl flex flex-col gap-4">
          <h1 className="text-xl font-black text-center">{t("adminTitle")}</h1>
          <label className="text-sm font-bold text-gray-700">
            {t("email")}
            <input type="email" autoComplete="username" required placeholder={t("emailPlaceholder")} value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="mt-1 w-full p-3 border rounded-xl" />
          </label>
          <label className="text-sm font-bold text-gray-700">
            {t("password")}
            <input type="password" autoComplete="current-password" required placeholder={t("passwordPlaceholder")} value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="mt-1 w-full p-3 border rounded-xl" />
          </label>
          {errorMsg && <p className="text-xs text-red-500 font-bold text-center">{t(errorMsg)}</p>}
          <button type="submit" className="w-full py-3 bg-red-500 text-white font-bold rounded-xl">{t("login")}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen p-4 bg-red-50/30 flex flex-col gap-4">
      <div className="p-5 bg-white rounded-2xl shadow-xl border border-red-100">
        <div className="flex justify-between mb-4">
          <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 font-bold">{t("adminBoard")}</span>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500 underline">{t("logout")}</button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="text-center bg-red-50/50 p-3 rounded-xl border border-red-100"><p className="text-xs text-red-400 font-bold">{t("activeTicketCount")}</p><p className="text-3xl font-black text-red-600">{t("ticketCount", { count: issuedTickets.length })}</p></div>
          <div className="text-center bg-gray-50 p-3 rounded-xl border"><p className="text-xs text-gray-400 font-bold">{t("callingCount")}</p><p className="text-3xl font-black text-gray-700">{calledNumbers.length} {t("groups")}</p></div>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-4">
          <p className="text-xs text-orange-700 font-black mb-1.5">{t("cancelledNumbers")}</p>
          {cancelledNumbers.length === 0 ? <p className="text-xs text-gray-400 italic">{t("cancelledNone")}</p> : <div className="flex flex-wrap gap-1.5">{cancelledNumbers.map(num => <span key={num} className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{t("ticketNumber", { num })}</span>)}</div>}
        </div>

        <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
          <p className="text-[10px] text-gray-400 font-black mb-1.5 text-center tracking-wider">{t("calledBadgeLegend")}</p>
          <div className="flex flex-wrap justify-center gap-1.5 max-h-24 overflow-y-auto">
            {issuedTickets.length === 0 ? (
              <p className="text-xs text-gray-400 italic">{t("notIssued")}</p>
            ) : (
              issuedTickets.map((num) => {
                const isCalling = calledNumbers.includes(num);
                return <span key={num} className={`text-[11px] font-bold px-2 py-0.5 rounded border transition-all ${isCalling ? "bg-green-500 text-white border-green-600 font-black animate-pulse" : "bg-white text-gray-600 border-gray-200"}`}>{t("ticketNumber", { num })}</span>;
              })
            )}
          </div>
        </div>

        <div className="bg-gray-900 p-4 rounded-2xl mb-6">
          <div className="bg-black text-right text-green-400 font-mono text-3xl p-3 rounded-lg mb-4 h-14 flex items-center justify-end">{calculatorInput || "0"}<span className="text-sm text-gray-500 ml-1">番</span></div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {["1","2","3","4","5","6","7","8","9"].map(n => <button key={n} onClick={() => setCalculatorInput(p => p + n)} className="py-3 bg-gray-800 text-white font-black text-xl rounded-xl">{n}</button>)}
            <button onClick={() => setCalculatorInput("")} className="py-3 bg-gray-600 text-white font-black text-xl rounded-xl">C</button>
            <button onClick={() => setCalculatorInput(p => p + "0")} className="py-3 bg-gray-800 text-white font-black text-xl rounded-xl">0</button>
            <button onClick={() => { executeCall(Number(calculatorInput)); setCalculatorInput(""); }} className="py-3 bg-green-600 text-white font-bold text-sm rounded-xl">{t("call")}</button>
          </div>
        </div>

        <div className="border-t pt-3">
          <p className="text-xs font-black text-gray-500 mb-2">{t("numberOperations")}</p>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {issuedTickets.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-4">{t("noIssuedNumbers")}</p>
            ) : (
              issuedTickets.map((num) => {
                const isCalled = calledNumbers.includes(num);
                return (
                  <div key={num} className={`flex items-center justify-between p-2 rounded-xl border text-xs ${isCalled ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-150"}`}>
                    <span className="font-black text-gray-700 w-16">{t("ticketNumber", { num })} {isCalled && "📢"}</span>
                    <div className="flex gap-1">
                      <button onClick={() => executeCall(num)} className={`px-2 py-1 rounded font-bold text-[10px] ${isCalled ? "bg-green-600 text-white" : "bg-white border text-green-600"}`}>{t("call")}</button>
                      <button onClick={() => executeUndoCall(num)} disabled={!isCalled} className="px-2 py-1 bg-white border text-red-500 disabled:opacity-30 rounded font-bold text-[10px]">{t("undoCall")}</button>
                      <button onClick={() => executeUndoIssue(num)} disabled={isCalled} className="px-2 py-1 bg-white border text-orange-600 disabled:opacity-30 rounded font-bold text-[10px]">{t("undoIssue")}</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <button onClick={handleNextCall} className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-base mt-6">{t("callNext")}</button>
        
        <div className="border-t mt-4 pt-3 flex flex-col gap-3 text-center">
          <button onClick={handleResetRanking} className="text-amber-600 hover:text-amber-700 text-xs font-black underline bg-amber-50 py-1.5 rounded-lg border border-amber-200 transition-colors">
            {t("resetRankingButton")}
          </button>
          <button onClick={handleResetAll} className="text-gray-400 hover:text-red-500 text-xs font-bold underline mt-1">
            {t("resetTicketsButton")}
          </button>
        </div>
      </div>
    </div>
  );
}