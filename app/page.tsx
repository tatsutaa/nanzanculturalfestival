import React from "react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 font-sans flex flex-col justify-center items-center p-4">
      {/* 🌟 メインコンテナ */}
      <main className="w-full max-w-xl bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 p-6 sm:p-8 text-center text-white">
        
        {/* 🎉 タイトルエリア */}
        <div className="mb-8 animate-fade-in">
          <span className="text-xs font-black tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full uppercase">
            S2 Classroom Exhibition
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-3 bg-gradient-to-r from-amber-200 via-orange-300 to-amber-200 bg-clip-text text-transparent">
            こんにちは！<br />S2の展示へようこそ！
          </h1>
          <p className="text-xs text-slate-300 mt-2 font-medium">
            整理券を引いて、リアルタイム的当てゲームに挑戦しよう！
          </p>
        </div>

        {/* 🗺️ メニューリンク（美しいカード型配列） */}
        <div className="flex flex-col gap-4">
          
          {/* 🎟️ カード1: 整理券発行 */}
          <a 
            href="/tickets" 
            className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-500 hover:to-indigo-500 rounded-2xl border border-blue-400/20 shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
          >
            <div className="text-left">
              <span className="text-xl mr-2">🍿</span>
              <span className="font-extrabold text-sm sm:text-base tracking-wide">整理券の発行はこちら！</span>
              <p className="text-[10px] text-blue-200/90 font-medium mt-0.5">スマホで待ち人数を確認できます</p>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-bold group-hover:bg-white/30 transition-colors">GO ➔</span>
          </a>

          {/* 🔫 カード2: 的当てゲーム画面 */}
          <a 
            href="/shooting-game" 
            className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-emerald-600/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-500 rounded-2xl border border-emerald-400/20 shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
          >
            <div className="text-left">
              <span className="text-xl mr-2">🔫</span>
              <span className="font-extrabold text-sm sm:text-base tracking-wide">的当てゲームをプレイ！</span>
              <p className="text-[10px] text-emerald-200/90 font-medium mt-0.5">名前を入力してリアルタイム加算スタート</p>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-bold group-hover:bg-white/30 transition-colors">PLAY ➔</span>
          </a>

          {/* 🏆 カード3: スコアランキング */}
          <a 
            href="/realtime-ranking" 
            className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-amber-600/80 to-orange-600/80 hover:from-amber-500 hover:to-orange-500 rounded-2xl border border-amber-400/20 shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
          >
            <div className="text-left">
              <span className="text-xl mr-2">🎯</span>
              <span className="font-extrabold text-sm sm:text-base tracking-wide">点数のランキングはこちら！</span>
              <p className="text-[10px] text-amber-200/90 font-medium mt-0.5">高得点を目指して1位に君臨しよう</p>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-bold group-hover:bg-white/30 transition-colors">RANK ➔</span>
          </a>

        </div>

        {/* 👨‍🍳 店員専用の隠しリンク */}
        <div className="mt-8 border-t border-white/5 pt-4">
          <a 
            href="/ticket/admin" 
            className="text-[11px] text-slate-400 hover:text-red-400 font-bold tracking-wider transition-colors"
          >
            ⚙️ 店員専用管理画面（パスワード保護）
          </a>
        </div>

      </main>
    </div>
  );
}
