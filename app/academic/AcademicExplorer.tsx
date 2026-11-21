"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export type TreeNode = {
  name: string;
  displayName: string;
  path: string;
  isDirectory: boolean;
  title?: string;
  articleCount: number;
  children?: TreeNode[];
};

function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;

  const result: TreeNode[] = [];

  for (const node of nodes) {
    if (node.isDirectory) {
      const folderMatches =
        node.name.toLowerCase().includes(q) ||
        node.displayName.toLowerCase().includes(q);

      if (folderMatches) {
        result.push(node);
      } else if (node.children) {
        const filteredChildren = filterTree(node.children, q);
        if (filteredChildren.length > 0) {
          const count = filteredChildren.reduce(
            (sum, child) => sum + child.articleCount,
            0
          );
          result.push({
            ...node,
            articleCount: count,
            children: filteredChildren,
          });
        }
      }
    } else {
      const titleMatches = (node.title || "").toLowerCase().includes(q);
      const pathMatches = node.path.toLowerCase().includes(q);
      if (titleMatches || pathMatches) {
        result.push(node);
      }
    }
  }

  return result;
}

function TreeList({
  nodes,
  depth = 0,
  isSearching = false,
}: {
  nodes: TreeNode[];
  depth?: number;
  isSearching?: boolean;
}) {
  return (
    <ul
      className={
        depth === 0
          ? "space-y-2.5"
          : "mt-1.5 ml-3.5 space-y-1 border-l-2 border-slate-200 dark:border-slate-700 pl-3.5"
      }
    >
      {nodes.map((node) => (
        <li key={node.path}>
          {node.isDirectory ? (
            <details
              className="group rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs transition-all"
              open={isSearching || depth === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-4 py-3 font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors select-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2.5">
                  <svg
                    className="h-5 w-5 text-amber-500 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  <span>{node.displayName}</span>
                  <span className="ml-1 inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                    {node.articleCount}件
                  </span>
                </span>

                <svg
                  className="h-4 w-4 text-slate-400 transition-transform duration-200 group-open:rotate-90"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </summary>

              <div className="px-3 pb-3 pt-1">
                {node.children && (
                  <TreeList
                    nodes={node.children}
                    depth={depth + 1}
                    isSearching={isSearching}
                  />
                )}
              </div>
            </details>
          ) : (
            <Link
              href={`/academic/${node.path}`}
              className="group/link flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
            >
              <span className="flex items-center gap-2.5">
                <svg
                  className="h-4 w-4 text-slate-400 group-hover/link:text-blue-500 transition-colors shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>{node.title}</span>
              </span>
              <span className="text-xs text-slate-400 opacity-0 group-hover/link:opacity-100 transition-opacity">
                読む →
              </span>
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

export function AcademicExplorer({ initialTree }: { initialTree: TreeNode[] }) {
  const [query, setQuery] = useState("");

  const filteredTree = useMemo(
    () => filterTree(initialTree, query),
    [initialTree, query]
  );

  return (
    <div>
      <div className="relative mb-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
          <svg
            className="h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="タイトルやカテゴリ名で記事を検索..."
          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-10 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="検索をクリア"
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        )}
      </div>

      {filteredTree.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center text-sm text-slate-500">
          「{query}」に一致する記事は見つかりませんでした。
        </div>
      ) : (
        <TreeList nodes={filteredTree} isSearching={query.trim().length > 0} />
      )}
    </div>
  );
}

export default AcademicExplorer;
