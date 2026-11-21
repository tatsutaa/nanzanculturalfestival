import fs from "fs";
import path from "path";
import { AcademicExplorer, TreeNode } from "./AcademicExplorer";
import { CATEGORY_LABELS } from "./categories"; // ← これを追加

// ※ 元々ここに書いてあった export const CATEGORY_LABELS = { ... }; は削除してください

function buildFileTree(dir: string, baseDir: string = dir): TreeNode[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const nodes: TreeNode[] = [];

  const sorted = entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const entry of sorted) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path
      .relative(baseDir, fullPath)
      .replace(/\\/g, "/");

    if (entry.isDirectory()) {
      const children = buildFileTree(fullPath, baseDir);
      // 配下の全記事数を合計
      const articleCount = children.reduce(
        (sum, child) => sum + child.articleCount,
        0
      );

      if (articleCount > 0) {
        nodes.push({
          name: entry.name,
          displayName: CATEGORY_LABELS[entry.name] || entry.name,
          path: relativePath,
          isDirectory: true,
          articleCount,
          children,
        });
      }
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      const slugPath = relativePath.replace(/\.html$/, "");
      const rawHtml = fs.readFileSync(fullPath, "utf-8");
      const titleMatch = rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch
        ? titleMatch[1].trim()
        : entry.name.replace(/\.html$/, "");

      nodes.push({
        name: entry.name,
        displayName: title,
        path: slugPath,
        isDirectory: false,
        title,
        articleCount: 1,
      });
    }
  }

  return nodes;
}

export default function ArticlesListPage() {
  const contentDir = path.join(process.cwd(), "content");

  if (!fs.existsSync(contentDir)) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center text-slate-500">
        記事フォルダが見つかりませんでした。
      </div>
    );
  }

  const tree = buildFileTree(contentDir);
  const totalArticles = tree.reduce((sum, node) => sum + node.articleCount, 0);

  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-3xl">
        {/* ヘッダーセクション */}
        <header className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Academic Archive
            </p>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              全 {totalArticles} 記事
            </span>
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            学術記事・ノート一覧
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            カテゴリフォルダをクリックすると下位の記事やサブフォルダが展開されます。
          </p>
        </header>

        {/* 検索バー＆ツリー目次 */}
        {tree.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center text-slate-500">
            記事がまだありません。
          </div>
        ) : (
          <AcademicExplorer initialTree={tree} />
        )}
      </div>
    </main>
  );
}
