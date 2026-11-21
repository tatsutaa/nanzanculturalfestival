import fs from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HtmlViewer } from "./HtmlViewer";
import { CATEGORY_LABELS } from "../categories";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;

  if (!slug || slug.some((segment) => !/^[a-zA-Z0-9_-]+$/.test(segment))) {
    notFound();
  }

  const contentDir = path.join(process.cwd(), "content");
  const filePath = path.join(contentDir, ...slug) + ".html";

  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const rawHtml = fs.readFileSync(filePath, "utf-8");

  // パンくずリスト用に <title> を抽出
  const titleMatch = rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].trim() : slug[slug.length - 1];

  // 途中のフォルダ階層（最後のファイル名を除いた部分）
  const folderSegments = slug.slice(0, -1);

  const headMatch = rawHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headStyles =
    headMatch?.[1].match(/<style[\s\S]*?<\/style>/gi)?.join("\n") || "";

  const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : rawHtml;

  return (
    <div className="min-h-screen bg-slate-50/40 dark:bg-slate-950">
      {/* 上部ナビゲーションバー（パンくずリスト＆戻るボタン） */}
      <nav
        aria-label="パンくずリスト"
        className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs sticky top-0 z-10"
      >
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* パンくずリスト */}
          <ol className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <li>
              <Link
                href="/academic"
                className="font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                記事一覧
              </Link>
            </li>
            {folderSegments.map((folder, index) => (
              <li key={index} className="flex items-center gap-1.5">
                <span className="text-slate-300 dark:text-slate-600">/</span>
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {CATEGORY_LABELS[folder] || folder}
                </span>
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                {pageTitle}
              </span>
            </li>
          </ol>

          {/* 一覧へ戻るボタン */}
          <Link
            href="/academic"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            ← 一覧へ戻る
          </Link>
        </div>
      </nav>

      {/* 記事本体 */}
      <main className="article-body mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <HtmlViewer html={headStyles + bodyContent} />
      </main>
    </div>
  );
}
