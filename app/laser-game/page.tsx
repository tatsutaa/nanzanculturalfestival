"use client";

import { BrowserQRCodeReader } from "@zxing/browser";
import { signInAnonymously } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { onValue, ref, runTransaction, update } from "firebase/database";
import type { IScannerControls } from "@zxing/browser";
import { auth, db } from "../firebase";
import { useLanguage } from "../language";

interface GameRoom {
  name: string;
  score: number;
  status: "waiting" | "playing";
  ownerUid: string;
}

export default function LaserGamePage() {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [pinInput, setPinInput] = useState("");
  const [connectedPin, setConnectedPin] = useState<string | null>(null);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [error, setError] = useState("");
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isUpdatingScore, setIsUpdatingScore] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const prepareBrowserSession = async () => {
      try {
        if (!auth.currentUser) await signInAnonymously(auth);
        if (!isMounted) return;

        const roomToken = new URLSearchParams(window.location.search).get("room");
        if (roomToken) {
          if (/^[a-f0-9]{32}$/i.test(roomToken)) {
            window.history.replaceState(null, "", window.location.pathname);
            setPinInput(roomToken.toLowerCase());
            setConnectedPin(roomToken.toLowerCase());
          } else {
            setError(t("targetInvalidPin"));
          }
        }
      } catch (error) {
        const errorCode = typeof error === "object" && error !== null && "code" in error
          ? String(error.code)
          : "";
        if (isMounted) {
          setError(errorCode.startsWith("auth/") ? t("targetAuthSetupRequired") : t("targetConnectFailed"));
        }
      } finally {
        if (isMounted) setIsAuthReady(true);
      }
    };

    void prepareBrowserSession();
    return () => {
      isMounted = false;
    };
  }, [t]);

  useEffect(() => {
    if (!isScanning || !videoRef.current) return;

    let isCancelled = false;
    let scannerControls: IScannerControls | undefined;
    const reader = new BrowserQRCodeReader();

    void reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
      if (!result || isCancelled) return;

      const scannedValue = result.getText();
      let roomToken = scannedValue;
      try {
        roomToken = new URL(scannedValue).searchParams.get("room") ?? scannedValue;
      } catch {
        // A plain room token can also be encoded in the QR code.
      }

      if (!/^[a-f0-9]{32}$/i.test(roomToken)) {
        setError(t("targetInvalidPin"));
        return;
      }

      scannerControls?.stop();
      setIsScanning(false);
      setError("");
      setPinInput(roomToken.toLowerCase());
      setConnectedPin(roomToken.toLowerCase());
    }).then((controls) => {
      scannerControls = controls;
      if (isCancelled) controls.stop();
    }).catch(() => {
      if (!isCancelled) {
        setError(t("targetCameraError"));
        setIsScanning(false);
      }
    });

    return () => {
      isCancelled = true;
      scannerControls?.stop();
    };
  }, [isScanning, t]);

  useEffect(() => {
    if (!connectedPin) return;

    const roomRef = ref(db, `game_pins/${connectedPin}`);
    const unsubscribe = onValue(
      roomRef,
      (snapshot) => {
        const data = snapshot.val() as GameRoom | null;
        if (!data) {
          setConnectedPin(null);
          setRoom(null);
          setError(t("targetRoomEnded"));
          return;
        }
        setRoom(data);
      },
      () => {
        setConnectedPin(null);
        setRoom(null);
        setError(t("targetConnectFailed"));
      },
    );

    return () => unsubscribe();
  }, [connectedPin, t]);

  const connectToGame = () => {
    const pin = pinInput.trim();
    if (!/^[a-f0-9]{32}$/i.test(pin)) {
      setError(t("targetInvalidPin"));
      return;
    }

    setError("");
    setConnectedPin(pin);
  };

  const startGame = async () => {
    if (!connectedPin) return;
    setError("");
    try {
      await update(ref(db, `game_pins/${connectedPin}`), { status: "playing" });
    } catch {
      setError(t("targetConnectFailed"));
    }
  };

  const registerHit = async () => {
    if (!connectedPin || !room || room.status !== "playing" || isUpdatingScore) return;

    setIsUpdatingScore(true);
    setError("");
    try {
      const result = await runTransaction(ref(db, `game_pins/${connectedPin}`), (current: GameRoom | null) => {
        if (!current || current.status !== "playing") return;
        return { ...current, score: Number(current.score) + 10 };
      });

      if (!result.committed) {
        setError(t("targetRoomEnded"));
      }
    } catch {
      setError(t("targetScoreFailed"));
    } finally {
      setIsUpdatingScore(false);
    }
  };

  const disconnect = () => {
    setIsScanning(false);
    setConnectedPin(null);
    setPinInput("");
    setRoom(null);
    setError("");
  };

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-white">
      <section className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col justify-center">
        <div className="mb-8 text-center">
          <p className="mb-3 text-xs font-bold uppercase text-emerald-300">S2 · TARGET STATION</p>
          <h1 className="text-3xl font-black text-white sm:text-4xl">{t("targetPageTitle")}</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-slate-300">{t("targetPageDescription")}</p>
        </div>

        {!isAuthReady ? (
          <p className="text-center text-sm text-slate-300">{t("targetLookingUp")}</p>
        ) : !connectedPin ? (
          <form
            className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-xl border border-slate-700 bg-slate-900 p-6"
            onSubmit={(event) => {
              event.preventDefault();
              connectToGame();
            }}
          >
            <label className="text-sm font-bold text-slate-200" htmlFor="game-pin">
              {t("targetPinLabel")}
            </label>
            <input
              id="game-pin"
              autoComplete="off"
              maxLength={32}
              pattern="[a-fA-F0-9]{32}"
              value={pinInput}
              onChange={(event) => setPinInput(event.target.value.replace(/[^a-fA-F0-9]/g, "").slice(0, 32))}
              placeholder={t("targetPinPlaceholder")}
              className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-4 text-center font-mono text-lg font-black tracking-wider text-white outline-none focus:border-emerald-400"
              required
            />
            {error && <p role="alert" className="text-center text-sm font-bold text-rose-300">{error}</p>}
            <button
              type="submit"
              disabled={!isAuthReady}
              className="rounded-lg bg-emerald-400 px-5 py-4 font-black text-slate-950 transition-colors hover:bg-emerald-300"
            >
              {t("targetConnectButton")}
            </button>
            <button
              type="button"
              onClick={() => { setError(""); setIsScanning(true); }}
              className="rounded-lg border border-slate-600 px-5 py-4 font-bold text-white transition-colors hover:bg-slate-800"
            >
              {t("targetScanButton")}
            </button>
            {isScanning && (
              <div className="space-y-3">
                <video ref={videoRef} className="aspect-video w-full rounded-lg bg-black object-cover" muted playsInline />
                <p className="text-xs text-slate-400">{t("targetCameraHint")}</p>
                <button type="button" onClick={() => setIsScanning(false)} className="text-sm font-bold text-slate-300 underline">
                  {t("targetStopScan")}
                </button>
              </div>
            )}
          </form>
        ) : !room ? (
          <div className="mx-auto w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-8 text-center">
            <p className="text-sm text-slate-300">{t("targetLookingUp")}</p>
            <p className="mt-3 font-mono text-3xl font-black tracking-widest">{connectedPin}</p>
            {error && <p role="alert" className="mt-4 text-sm font-bold text-rose-300">{error}</p>}
            <button onClick={disconnect} className="mt-6 text-sm font-bold text-slate-300 underline">
              {t("targetDisconnect")}
            </button>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900 p-6 text-center sm:p-10">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-4 text-left">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">{t("targetConnectedPlayer")}</p>
                <p className="mt-1 text-xl font-black text-amber-300">{room.name}</p>
              </div>
              <p className="rounded-full bg-slate-800 px-4 py-2 font-mono text-lg font-bold text-slate-200">{connectedPin}</p>
            </div>

            {room.status === "waiting" ? (
              <div className="py-12">
                <p className="text-lg font-bold text-slate-200">{t("targetWaitingForPlayer")}</p>
                <p className="mt-2 text-sm text-slate-400">{t("targetConfirmStart")}</p>
                <button
                  onClick={startGame}
                  className="mt-7 rounded-lg bg-amber-400 px-7 py-4 font-black text-slate-950 transition-colors hover:bg-amber-300"
                >
                  {t("targetStartButton")}
                </button>
              </div>
            ) : (
              <div className="py-8">
                <p className="text-sm font-black uppercase tracking-widest text-emerald-300">{t("targetGameLive")}</p>
                <p className="mt-3 text-7xl font-black tabular-nums text-white sm:text-8xl">
                  {room.score}<span className="ml-3 text-2xl text-slate-400">{t("points")}</span>
                </p>
                <button
                  onClick={registerHit}
                  disabled={isUpdatingScore}
                  className="mt-8 min-h-28 w-full max-w-lg rounded-xl bg-rose-500 px-8 py-7 text-2xl font-black text-white shadow-lg transition-colors hover:bg-rose-400 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60 sm:text-3xl"
                >
                  {isUpdatingScore ? t("targetUpdating") : t("targetHitButton")}
                </button>
              </div>
            )}

            {error && <p role="alert" className="mt-3 text-sm font-bold text-rose-300">{error}</p>}
            <button onClick={disconnect} className="mt-4 text-sm font-bold text-slate-400 underline hover:text-white">
              {t("targetDisconnect")}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
