"use client";

import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase"; 
import { ref, onValue, set, remove } from "firebase/database";

export default function ShootingGamePage() {
  const [playerName, setPlayerName] = useState("");
  const [pinCode, setPinCode] = useState<string | null>(null);
  const [gameState, setGameState] = useState<{ name: string; score: number; status: string }>({
    name: "",
    score: 0,
    status: "waiting",
  });

  const lastScoreRef = useRef<number>(0);

  // Generate a random four-digit access code.
  const generatePinCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  // Monitor when the page becomes visible again after sleep or a tab switch.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("The browser is active again; Firebase will reconnect automatically.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Subscribe to score and status updates for this player's room.
  useEffect(() => {
    if (!pinCode) {
      lastScoreRef.current = 0;
      return;
    }

    const gameRef = ref(db, `game_pins/${pinCode}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameState(data);
        // Play a sound when the target-game app increases the score.
        if (data.status === "playing" && data.score > lastScoreRef.current) {
          const audio = new Audio("/hit.mp3");
          audio.volume = 1.0;
          audio.play().catch((err) => console.log("音声再生制限:", err));
        }
        lastScoreRef.current = data.score;
      } else {
        // Return to the start screen if the room was deleted or disconnected.
        setPinCode(null);
      }
    });

    return () => unsubscribe();
  }, [pinCode]);

  // Create a waiting room and issue a four-digit code.
  const handleStartGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return alert("名前を入力してください");

    lastScoreRef.current = 0;
    const newPin = generatePinCode();

    try {
      await set(ref(db, `game_pins/${newPin}`), {
        name: playerName.trim(),
        score: 0,
        status: "waiting"
      });

  setGameState({ name: playerName.trim(), score: 0, status: "waiting" });
      setPinCode(newPin);
    } catch (error) {
      console.error("ゲーム開始エラー:", error);
      alert("接続に失敗しました。");
    }
  };

  // Save the final score to the leaderboard and end the game.
  const handleEndGame = async () => {
    if (!pinCode) return;

    const currentName = gameState.name || playerName;
    const currentScore = gameState.score;

    try {
      if (currentName && currentName.trim() && currentScore > 0) {
        const uniqueId = `${currentName.trim()}_${Date.now()}`;

        // Save this game as a new leaderboard entry.
        await set(ref(db, `ranking/${uniqueId}`), {
          name: currentName.trim(),
          score: currentScore,
          date: new Date().toLocaleTimeString()
        });
        alert(`🎉 ${currentName}さんのスコア（${currentScore}点）をランキングに保存しました！`);
      }
    } catch (error) {
      console.error("ランキング保存エラー:", error);
    } finally {
      // Delete this room from Firebase when the game ends.
      await remove(ref(db, `game_pins/${pinCode}`));
      setPinCode(null);
      setPlayerName("");
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen p-6 bg-slate-900 text-white flex flex-col justify-center">
      <div className="p-6 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 text-center">
        <h1 className="text-2xl font-black text-amber-400 mb-2 flex items-center justify-center gap-2">
          🔫 リアルタイム・的当てマシン
        </h1>
        <p className="text-xs text-slate-400 mb-6">複数人が同時にアクセスしてそれぞれのゲームを遊べます</p>

        {!pinCode ? (
          <form onSubmit={handleStartGame} className="flex flex-col gap-4">
            {/* Player name form */}
            <input
              type="text"
              placeholder="プレイヤー名を入力..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="p-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-center font-bold focus:outline-none focus:border-amber-400 text-lg"
            />
            <button type="submit" className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl text-lg shadow-lg transition-all active:scale-95">
              🎯 ゲームを準備する
            </button>
          </form>
        ) : gameState.status === "waiting" ? (
          <div className="animate-pulse">
            {/* Waiting for the target-game app to connect */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 mb-4">
              <p className="text-xs text-amber-400 font-bold tracking-wider">の画面に次のコードを入力してください</p>
              <p className="text-5xl font-mono font-black tracking-widest text-white mt-3">{pinCode}</p>
            </div>
            <p className="text-xs text-slate-500">的のアプリが接続すると自動でゲーム画面に切り替わります...</p>
            <button onClick={() => { remove(ref(db, `game_pins/${pinCode}`)); setPinCode(null); }} className="mt-6 text-xs text-rose-400 underline font-bold">
              キャンセル
            </button>
          </div>
        ) : (
          <div className="transition-all duration-300">
            {/* Active game screen */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 mb-6">
              <p className="text-xs text-emerald-400 font-bold tracking-wider">● 接続中 - PLAYING</p>
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
