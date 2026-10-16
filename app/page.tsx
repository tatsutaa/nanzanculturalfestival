"use client";

import React from "react";
import { useLanguage } from "./language";

export default function Home() {
  const { t } = useLanguage();
  const greeting = t("homeGreeting").split("|");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 font-sans flex flex-col justify-center items-center p-4">
      {/* Main welcome panel */}
      <main className="w-full max-w-xl bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 p-6 sm:p-8 text-center text-white">
        
        {/* Exhibition title and introduction */}
        <div className="mb-8 animate-fade-in">
          <span className="text-xs font-black tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full uppercase">
            S2 Classroom Exhibition
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-3 bg-gradient-to-r from-amber-200 via-orange-300 to-amber-200 bg-clip-text text-transparent">
            {greeting[0]}<br />{greeting[1]}
          </h1>
          <p className="text-xs text-slate-300 mt-2 font-medium">
            {t("homeIntro")}
          </p>
        </div>

        {/* Main navigation links */}
        <div className="flex flex-col gap-4">
          
          {/* Ticket booking link */}
          <a 
            href="/tickets" 
            className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-500 hover:to-indigo-500 rounded-2xl border border-blue-400/20 shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
          >
            <div className="text-left">
              <span className="text-xl mr-2">🍿</span>
              <span className="font-extrabold text-sm sm:text-base tracking-wide">{t("ticketLink")}</span>
              <p className="text-[10px] text-blue-200/90 font-medium mt-0.5">{t("ticketLinkDescription")}</p>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-bold group-hover:bg-white/30 transition-colors">GO ➔</span>
          </a>

          {/* Shooting game link */}
          <a 
            href="/shooting-game" 
            className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-emerald-600/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-500 rounded-2xl border border-emerald-400/20 shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
          >
            <div className="text-left">
              <span className="text-xl mr-2">🔫</span>
              <span className="font-extrabold text-sm sm:text-base tracking-wide">{t("playLink")}</span>
              <p className="text-[10px] text-emerald-200/90 font-medium mt-0.5">{t("playLinkDescription")}</p>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-bold group-hover:bg-white/30 transition-colors">PLAY ➔</span>
          </a>

          {/* Browser-based target control screen */}
          <a
            href="/laser-game"
            className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-rose-700/80 to-orange-700/80 hover:from-rose-600 hover:to-orange-600 rounded-2xl border border-rose-300/20 shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
          >
            <div className="text-left">
              <span className="text-xl mr-2">🎯</span>
              <span className="font-extrabold text-sm sm:text-base tracking-wide">{t("targetLink")}</span>
              <p className="text-[10px] text-rose-100/80 font-medium mt-0.5">{t("targetLinkDescription")}</p>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-bold group-hover:bg-white/30 transition-colors">OPEN ➔</span>
          </a>

          {/* Score leaderboard link */}
          <a 
            href="/realtime-ranking" 
            className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-amber-600/80 to-orange-600/80 hover:from-amber-500 hover:to-orange-500 rounded-2xl border border-amber-400/20 shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
          >
            <div className="text-left">
              <span className="text-xl mr-2">🎯</span>
              <span className="font-extrabold text-sm sm:text-base tracking-wide">{t("rankingLink")}</span>
              <p className="text-[10px] text-amber-200/90 font-medium mt-0.5">{t("rankingLinkDescription")}</p>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-bold group-hover:bg-white/30 transition-colors">RANK ➔</span>
          </a>

        </div>

        {/* Clearly signpost the protected staff area. */}
        <div className="mt-6 border-t border-white/10 pt-5">
          <a 
            href="/tickets/admin" 
            className="flex items-center justify-between gap-3 rounded-xl border border-rose-300/20 bg-rose-950/40 px-4 py-3 text-left transition-colors hover:bg-rose-900/50"
          >
            <span>
              <span className="block text-sm font-bold text-rose-100">⚙️ {t("staffLink")}</span>
              <span className="mt-0.5 block text-xs text-rose-200/70">{t("staffDescription")}</span>
            </span>
            <span className="shrink-0 text-xs font-bold text-rose-200">{t("adminLink")}</span>
          </a>
        </div>

      </main>
    </div>
  );
}
