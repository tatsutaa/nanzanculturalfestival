export default function AboutPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">整理券のページ</h1>
      <p className="text-lg text-gray-600">ここは整理券のページです！</p>
      
      {/* トップページに戻るリンク */}
      <a href="/" className="mt-8 text-blue-500 hover:underline">
        ← トップページに戻る
      </a>
    </div>
  );
}
