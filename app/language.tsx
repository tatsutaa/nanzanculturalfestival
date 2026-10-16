"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

export type Language = "ja" | "en";

const LANGUAGE_STORAGE_KEY = "site_language";
const LANGUAGE_CHANGE_EVENT = "site-language-change";

const messages = {
  ja: {
    siteTitle: "S2文化祭展示",
    homeGreeting: "こんにちは！|S2の展示へようこそ！",
    homeIntro: "整理券を引いて、リアルタイム的当てゲームに挑戦しよう！",
    ticketLink: "整理券の発行はこちら！",
    ticketLinkDescription: "スマホで待ち人数を確認できます",
    playLink: "的当てゲームをプレイ！",
    playLinkDescription: "名前を入力してリアルタイム加算スタート",
    targetLink: "ターゲット操作画面",
    targetLinkDescription: "別のブラウザーで開いて命中を記録",
    rankingLink: "点数のランキングはこちら！",
    rankingLinkDescription: "高得点を目指して1位に君臨しよう",
    staffLink: "店員・管理者はこちら",
    staffDescription: "整理券・ランキング管理画面",
    adminLink: "管理画面へ →",
    ticketPageTitle: "🍿 お客様用 整理券画面",
    ticketNumber: "{num}番",
    currentlyCalling: "現在お呼び出し中の番号",
    none: "なし",
    soundOn: "🔔 呼び出し音: 有効",
    soundOff: "🔕 呼び出し音: 無効",
    soundEnabledHint: "順番が来るとチャイムが鳴ります",
    soundDisabledHint: "音を鳴らすにはONにしてください",
    issueTicket: "整理券を発券する",
    yourTicket: "あなたの整理券番号",
    yourTurn: "📢 あなたの順番です！窓口へどうぞ！",
    otherTurn: "他の番号をお呼び出し中です。しばらくお待ちください。",
    waitingForCall: "呼び出し開始までそのままお待ちください。",
    cancelTicket: "整理券を取り消す",
    confirmCancelTicket: "この整理券を取り消しますか？",
    allTicketsToday: "📋 本日発券済みのすべての番号",
    noTicketsIssued: "まだ発券されていません",
    audioPermissionError: "❌ 画面を一度タップしてからもう一度お試しください。",
    shootingTitle: "🔫 リアルタイム・的当てマシン",
    shootingIntro: "複数人が同時にアクセスしてそれぞれのゲームを遊べます",
    playerNamePlaceholder: "プレイヤー名を入力...",
    prepareGame: "🎯 ゲームを準備する",
    enterNameAlert: "名前を入力してください",
    gameStartError: "ゲーム開始エラー:",
    connectionFailed: "接続に失敗しました。",
    authProviderSetupRequired: "Firebase ConsoleでAuthenticationを初期化し、匿名認証を有効にしてください。",
    enterCodePrompt: "ターゲット画面でQRコードを読み取ってください",
    targetAppWaiting: "ターゲット画面が接続すると自動でゲームが始まります...",
    targetQrCaption: "ターゲット画面で読み取って接続",
    targetPageTitle: "🎯 ターゲット操作画面",
    targetPageDescription: "参加者画面のQRコードをカメラで読み取ると自動接続します。専用アプリのインストールは不要です。",
    targetScanButton: "カメラでQRを読み取る",
    targetStopScan: "カメラを閉じる",
    targetCameraHint: "カメラへのアクセスを許可し、参加者画面のQRコードを映してください。",
    targetCameraError: "カメラを起動できません。カメラ権限を確認するか、下からルームコードを入力してください。",
    targetPinLabel: "ルームコード（手入力する場合）",
    targetPinPlaceholder: "32文字のルームコード",
    targetConnectButton: "コードで接続",
    targetInvalidPin: "有効なルームコードを読み取るか入力してください。",
    targetLookingUp: "ゲームを確認しています...",
    targetRoomEnded: "このゲームは終了したか、コードが無効です。",
    targetConnectFailed: "ゲームに接続できませんでした。コードと通信状態を確認してください。",
    targetAuthSetupRequired: "Firebase ConsoleでAuthenticationを初期化し、匿名認証を有効にしてください。",
    targetScoreFailed: "スコアを更新できませんでした。もう一度お試しください。",
    targetConnectedPlayer: "接続中のプレイヤー",
    targetWaitingForPlayer: "参加者がゲーム画面を開くのを待っています。",
    targetConfirmStart: "参加者画面の準備ができたらゲームを開始してください。",
    targetStartButton: "ゲーム開始",
    targetGameLive: "● ゲーム進行中",
    targetHitButton: "🎯 命中！ +10点",
    targetUpdating: "更新中...",
    targetDisconnect: "接続を解除",
    cancel: "キャンセル",
    connectedPlaying: "● 接続中 - PLAYING",
    playerSuffix: "選手",
    currentScore: "現在のスコア",
    points: "点",
    finishAndSave: "🏁 ゲームを終了してランキングに保存",
    saveScoreSuccess: "🎉 {name}さんのスコア（{score}点）をランキングに保存しました！",
    saveRankingError: "ランキング保存エラー:",
    rankingTitle: "🎯 シューティングランキング",
    rankingDescription: "同じ名前の挑戦データも上書きされずにすべて集計されます",
    noRankingData: "データがまだありません。",
    adminTitle: "🔐 管理者認証",
    authChecking: "認証状態を確認しています...",
    email: "メールアドレス",
    emailPlaceholder: "管理者メールアドレス",
    password: "パスワード",
    passwordPlaceholder: "パスワード",
    login: "管理者としてログイン",
    logout: "🚪 ログアウト",
    noAdminPermission: "このアカウントには管理者権限がありません。",
    missingAdminUid: "管理者UIDが設定されていません。運用担当にお問い合わせください。",
    loginFailed: "メールアドレスまたはパスワードを確認してください。",
    adminBoard: "管理ボード",
    activeTicketCount: "総発券枚数（現在有効）",
    ticketCount: "{count} 枚",
    callingCount: "現在呼び出し中の数",
    groups: "組",
    cancelledNumbers: "❌ お客様がキャンセルした番号（抜け番）:",
    calledBadgeLegend: "📊 発行済みバッジ一覧（緑が現在呼び出し中）",
    notIssued: "未発券",
    invalidTicketAlert: "存在する正しい発券済み番号を指定してください",
    confirmUndoCall: "{num}番の呼び出しを取り消しますか？",
    cannotUndoCalledTicket: "呼び出し中の番号は発券取り消しできません。先に呼び出しを取り消してください。",
    confirmUndoIssue: "「{num}番」の発券を取り消します。この番号を持っているお客様の画面は自動的に「未発券」に戻ります。よろしいですか？",
    noUncalledTickets: "呼び出していない発券済み番号がありません。",
    confirmResetTickets: "全ての整理券データを完全にリセットしますか？（※ランキングは消えません）",
    confirmResetRanking: "🏆 シューティングゲームのランキングデータを全て削除し、完全にリセットしますか？（※整理券データは消えません）",
    rankingResetDone: "🗑️ ランキングを完全にリセットしました！",
    cancelledNone: "なし",
    issuedTicketsHeader: "📋 発行済みバッジ一覧（緑が現在呼び出し中）",
    numberOperations: "📋 各番号の操作（三択リスト）",
    noIssuedNumbers: "発券された番号はありません",
    call: "呼出",
    undoCall: "呼出取消",
    undoIssue: "発券取消",
    callNext: "📢 次の連番を呼び出す",
    resetRankingButton: "🏆 シューティングゲームのランキングのみを全リセット",
    resetTicketsButton: "🛠️ 整理券データを全リセット",
  },
  en: {
    siteTitle: "S2 Classroom Exhibition",
    homeGreeting: "Hello!|Welcome to the S2 Exhibition!",
    homeIntro: "Get a queue ticket and try the real-time target game!",
    ticketLink: "Get a Queue Ticket",
    ticketLinkDescription: "Check the current queue on your phone",
    playLink: "Play the Target Game",
    playLinkDescription: "Enter your name to start tracking your score live",
    targetLink: "Target Control Screen",
    targetLinkDescription: "Open in another browser to record hits",
    rankingLink: "View the Leaderboard",
    rankingLinkDescription: "Aim for a high score and take the top spot",
    staffLink: "Staff and Administrators",
    staffDescription: "Ticket and leaderboard management",
    adminLink: "Open Admin →",
    ticketPageTitle: "🍿 Visitor Queue Ticket",
    ticketNumber: "No. {num}",
    currentlyCalling: "Now Calling",
    none: "None",
    soundOn: "🔔 Call chime: On",
    soundOff: "🔕 Call chime: Off",
    soundEnabledHint: "A chime will play when it is your turn",
    soundDisabledHint: "Turn on sound to hear your call",
    issueTicket: "Get a Queue Ticket",
    yourTicket: "Your Ticket Number",
    yourTurn: "📢 It is your turn! Please go to the counter.",
    otherTurn: "Another number is being called. Please wait.",
    waitingForCall: "Please wait until calling begins.",
    cancelTicket: "Cancel Ticket",
    confirmCancelTicket: "Are you sure you want to cancel this ticket?",
    allTicketsToday: "📋 All Tickets Issued Today",
    noTicketsIssued: "No tickets have been issued yet.",
    audioPermissionError: "❌ Tap the screen once, then try again.",
    shootingTitle: "🔫 Real-Time Target Game",
    shootingIntro: "Multiple players can join and play their own games at the same time.",
    playerNamePlaceholder: "Enter player name...",
    prepareGame: "🎯 Set Up Game",
    enterNameAlert: "Please enter your name.",
    gameStartError: "Game start error:",
    connectionFailed: "Connection failed.",
    authProviderSetupRequired: "Initialize Firebase Authentication in the console and enable Anonymous sign-in.",
    enterCodePrompt: "Scan this QR code on the target control screen:",
    targetAppWaiting: "The game will start automatically when the target control screen connects...",
    targetQrCaption: "Scan with the target screen to connect",
    targetPageTitle: "🎯 Target Control Screen",
    targetPageDescription: "Scan the QR code on the player screen with this camera to connect automatically. No separate app installation is needed.",
    targetScanButton: "Scan QR with Camera",
    targetStopScan: "Close Camera",
    targetCameraHint: "Allow camera access and point it at the QR code on the player screen.",
    targetCameraError: "Could not start the camera. Check camera permissions or enter the room code below.",
    targetPinLabel: "Room code (manual fallback)",
    targetPinPlaceholder: "32-character room code",
    targetConnectButton: "Connect with Code",
    targetInvalidPin: "Scan or enter a valid room code.",
    targetLookingUp: "Looking for the game...",
    targetRoomEnded: "This game has ended or the code is invalid.",
    targetConnectFailed: "Could not connect to the game. Check the code and your connection.",
    targetAuthSetupRequired: "Initialize Firebase Authentication in the console and enable Anonymous sign-in.",
    targetScoreFailed: "Could not update the score. Please try again.",
    targetConnectedPlayer: "Connected Player",
    targetWaitingForPlayer: "Waiting for the player to open their game screen.",
    targetConfirmStart: "Start the game when the player screen is ready.",
    targetStartButton: "Start Game",
    targetGameLive: "● GAME IN PROGRESS",
    targetHitButton: "🎯 HIT! +10 PTS",
    targetUpdating: "Updating...",
    targetDisconnect: "Disconnect",
    cancel: "Cancel",
    connectedPlaying: "● CONNECTED - PLAYING",
    playerSuffix: "",
    currentScore: "Current Score",
    points: "pts",
    finishAndSave: "🏁 Finish Game and Save Score",
    saveScoreSuccess: "🎉 {name}'s score ({score} pts) has been saved to the leaderboard!",
    saveRankingError: "Leaderboard save error:",
    rankingTitle: "🎯 Target Game Leaderboard",
    rankingDescription: "Every attempt is recorded, including multiple attempts by the same player.",
    noRankingData: "No scores yet.",
    adminTitle: "🔐 Administrator Sign-In",
    authChecking: "Checking sign-in status...",
    email: "Email address",
    emailPlaceholder: "Administrator email",
    password: "Password",
    passwordPlaceholder: "Enter password",
    login: "Sign in as Administrator",
    logout: "🚪 Sign out",
    noAdminPermission: "This account does not have administrator access.",
    missingAdminUid: "The administrator UID is not configured. Please contact the site operator.",
    loginFailed: "Check your email address and password.",
    adminBoard: "Admin Dashboard",
    activeTicketCount: "Active Tickets Issued",
    ticketCount: "{count} tickets",
    callingCount: "Currently Being Called",
    groups: "groups",
    cancelledNumbers: "❌ Cancelled Tickets:",
    calledBadgeLegend: "📊 Issued Tickets (green means currently called)",
    notIssued: "No tickets issued",
    invalidTicketAlert: "Enter a valid number for an issued ticket.",
    confirmUndoCall: "Cancel the call for ticket {num}?",
    cannotUndoCalledTicket: "A ticket being called cannot be cancelled. Cancel its call first.",
    confirmUndoIssue: "Cancel ticket {num}? The holder's screen will return to the unissued state.",
    noUncalledTickets: "There are no issued tickets waiting to be called.",
    confirmResetTickets: "Permanently reset all ticket data? (The leaderboard will not be affected.)",
    confirmResetRanking: "🏆 Permanently delete all target-game scores? (Ticket data will not be affected.)",
    rankingResetDone: "🗑️ The leaderboard has been reset.",
    cancelledNone: "None",
    issuedTicketsHeader: "📊 Issued Tickets (green means currently called)",
    numberOperations: "📋 Ticket Actions",
    noIssuedNumbers: "No tickets have been issued.",
    call: "Call",
    undoCall: "Undo Call",
    undoIssue: "Cancel Ticket",
    callNext: "📢 Call Next Ticket",
    resetRankingButton: "🏆 Reset Target Game Leaderboard",
    resetTicketsButton: "🛠️ Reset All Ticket Data",
  },
} as const;

export type MessageKey = keyof typeof messages.ja;
type LanguageContextValue = {
  language: Language;
  toggleLanguage: () => void;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function subscribeToLanguage(onStoreChange: () => void) {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === LANGUAGE_STORAGE_KEY || event.key === null) onStoreChange();
  };

  window.addEventListener("storage", handleStorageChange);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange);
  };
}

function getLanguageSnapshot(): Language {
  return localStorage.getItem(LANGUAGE_STORAGE_KEY) === "en" ? "en" : "ja";
}

function getServerLanguageSnapshot(): Language {
  return "ja";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    getServerLanguageSnapshot,
  );

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = messages[language].siteTitle;
  }, [language]);

  const toggleLanguage = () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language === "ja" ? "en" : "ja");
    window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
  };

  const t = (key: MessageKey, values: Record<string, string | number> = {}) => {
    let message: string = messages[language][key];
    for (const [name, value] of Object.entries(values)) {
      message = message.replaceAll(`{${name}}`, String(value));
    }
    return message;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
      <button
        type="button"
        onClick={toggleLanguage}
        aria-label={language === "ja" ? "Switch language to English" : "言語を日本語に切り替え"}
        className="fixed right-4 top-4 z-50 rounded-full border border-white/30 bg-slate-950/85 px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur transition-colors hover:bg-slate-800"
      >
        {language === "ja" ? "EN" : "日本語"}
      </button>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
}
