import React from "react";

// 🏆 ダミーのランキングデータ（ここを書き換えると表示が自動で変わります）
const itemsData = [
  { id: 1, name: "熟成醤油ラーメン", score: 98, image: "🍜" },
  { id: 2, name: "濃厚旨辛味噌ラーメン", score: 85, image: "🍜" },
  { id: 3, name: "魚介豚骨つけ麺", score: 92, image: "🥢" },
  { id: 4, name: "あっさり塩レモン麺", score: 78, image: "🍋" },
];

export default function RankingPage() {
  // 💡 データを点数（score）が高い順に自動で並び替える処理
  const sortedItems = [...itemsData].sort((a, b) => b.score - a.score);

  return (
    <div className="max-w-md mx-auto min-h-screen p-6 bg-gray-50">
      <h1 className="text-3xl font-extrabold text-center my-6 text-gray-800">
        🏆 人気メニューランキング
      </h1>

      <div className="flex flex-col gap-4">
        {/* 💡 .map() を使って、並び替えたデータを1つずつ画面に出力 */}
        {sortedItems.map((item, index) => {
          const rank = index + 1; // 順位（1から始まる）

          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100"
            >
              {/* 左側：順位と名前 */}
              <div className="flex items-center gap-4">
                <span className={`text-xl font-black w-8 h-8 flex items-center justify-center rounded-full ${
                  rank === 1 ? "bg-amber-400 text-white" :
                  rank === 2 ? "bg-gray-300 text-gray-700" :
                  rank === 3 ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {rank}
                </span>
                <span className="text-2xl">{item.image}</span>
                <span className="font-bold text-gray-700">{item.name}</span>
              </div>

              {/* 右側：点数 */}
              <div className="text-right">
                <span className="text-sm text-gray-400">スコア</span>
                <p className="text-lg font-black text-blue-600">{item.score}点</p>
              </div>
            </div>
          );
         return null;
        })}
      </div>

      <div className="text-center mt-8">
        <a href="/" className="text-sm text-blue-500 hover:underline">
          ← トップページに戻る
        </a>
      </div>
    </div>
  );
}
