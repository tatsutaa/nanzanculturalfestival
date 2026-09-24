"use client";

import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase"; 
import { ref, onValue, set } from "firebase/database";

export default function ShootingGamePage() {
  const [playerName, setPlayerName] = useState("");
  const [gameState, setGameState] = useState<{ name: string; score: number; status: string }>({
    name: "",
    score: 0,
    status: "waiting",
  });

  // 🔊 音声の不要な連打や、初期読み込み時の誤再生を防ぐための記憶
  const lastScoreRef = useRef<number>(0);

  useEffect(() => {
    // 📢 Firebaseの現在のゲーム状況（current_game）をリアルタイム監視
    const gameRef = ref(db, "current_game");
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameState(data);

        // 💡 【新機能】スコアが以前の点数より増えた瞬間、かつゲーム中の場合
        if (data.status === "playing" && data.score > lastScoreRef.current) {
          // public/hit.mp3 を再生
          const audio = new Audio("/hit.mp3");
          audio.volume = 1.0; // 音量MAX
          audio.play().catch((err) => {
            console.log("ブラウザ制限：画面を一度クリックしていないと音が鳴らない場合があります:", err);
          });
        }
        // 今のスコアを記憶に保存
        lastScoreRef.current = data.score;
      } else {
        setGameState({ name: "", score: 0, status: "waiting" });
        lastScoreRef.current = 0;
      }
    });

    return () => unsubscribe();
  }, []);

  const handleStartGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return alert("名前を入力してください");

    // ゲーム開始時は一度記憶を0にリセット
    lastScoreRef.current = 0;

    await set(ref(db, "current_game"), {
      name: playerName,
      score: 0,
      status: "playing"
    });
  };

  const handleEndGame = async () => {
    if (gameState.score > 0) {
      await set(ref(db, `ranking/${gameState.name}`), {
        name: gameState.name,
        score: gameState.score
      });
      alert(`🎉 ${gameState.name}さんのスコア（${gameState.score}点）をランキングに保存しました！`);
    }
    await set(ref(db, "current_game"), null);
    setPlayerName("");
  };

  return (
    <div className="max-w-md mx-auto min-h-screen p-6 bg-slate-900 text-white flex flex-col justify-center">
      <div className="p-6 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 text-center">
        <h1 className="text-2xl font-black text-amber-400 mb-2 flex items-center justify-center gap-2">
          🔫 リアルタイム・的当てマシン
        </h1>
        <p className="text-xs text-slate-400 mb-6">的にレーザーが当たると画面の点数と効果音が連動します</p>

        {gameState.status === "waiting" ? (
          <form onSubmit={handleStartGame} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="プレイヤー名を入力..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="p-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-center font-bold focus:outline-none focus:border-amber-400 text-lg"
            />
            <button type="submit" className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-lg shadow-lg transition-all active:scale-95">
              🎯 ゲームを開始する
            </button>
          </form>
        ) : (
          <div className="animate-fade-in">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 mb-6">
              <p className="text-xs text-slate-400 font-bold tracking-wider">NOW PLAYING</p>
              <p className="text-xl font-black text-amber-300 mt-1">{gameState.name} 選手</p>
            </div>

            <div className="my-8">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">現在のスコア</p>
              <p className="text-7xl font-black text-emerald-400 font-mono tracking-tighter drop-shadow-[0_0_15px_rgba(52,211,153,0.3)] mt-2">
                {gameState.score} <span className="text-xl text-slate-400">点</span>
              </p>
            </div>

            <button onClick={handleEndGame} className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-md">
              🏁 ゲームを終了してランキングに保存
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
