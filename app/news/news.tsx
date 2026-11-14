"use client";

import { useEffect, useState } from "react";

type Article = {
	title: string;
	description?: string;
	url: string;
	image?: string;
	source?: { name: string };
	publishedAt?: string;
};

const countries = [
	{ code: "us", label: "アメリカ" },
	{ code: "jp", label: "日本" },
	{ code: "gb", label: "イギリス" },
	{ code: "ca", label: "カナダ" },
	{ code: "au", label: "オーストラリア" },
	{ code: "in", label: "インド" },
];

export default function NewsPage() {
	const [country, setCountry] = useState("jp");
	const [articles, setArticles] = useState<Article[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		const controller = new AbortController();

		async function loadNews() {
			setLoading(true);
			setError("");
			try {
				// APIキーはブラウザーに置かず、サーバー側の /api/news で取得します。
				const response = await fetch(`/api/news?country=${country}`, {
					signal: controller.signal,
				});
				if (!response.ok) throw new Error("ニュースを取得できませんでした。");
				const data = await response.json();
				setArticles(Array.isArray(data.articles) ? data.articles : []);
			} catch (err) {
				if (err instanceof Error && err.name !== "AbortError") {
					setError(err.message);
				}
			} finally {
				if (!controller.signal.aborted) setLoading(false);
			}
		}

		loadNews();
		return () => controller.abort();
	}, [country]);

	return (
		<main style={{ maxWidth: 960, margin: "40px auto", padding: 20 }}>
			<h1>世界のニュース</h1>
			<label htmlFor="country">国で絞り込む：</label>{" "}
			<select
				id="country"
				value={country}
				onChange={(event) => setCountry(event.target.value)}
			>
				{countries.map((item) => (
					<option key={item.code} value={item.code}>
						{item.label}
					</option>
				))}
			</select>

			{loading && <p>ニュースを読み込み中…</p>}
			{error && <p role="alert">{error}</p>}
			{!loading && !error && articles.length === 0 && (
				<p>ニュースがありません。</p>
			)}

			<section
				aria-label="ニュース一覧"
				style={{ display: "grid", gap: 20, marginTop: 24 }}
			>
				{articles.map((article, index) => (
					<article
						key={`${article.url}-${index}`}
						style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}
					>
						<h2 style={{ marginTop: 0 }}>
							<a href={article.url} target="_blank" rel="noreferrer">
								{article.title}
							</a>
						</h2>
						{article.description && <p>{article.description}</p>}
						<small>
							{[article.source?.name, article.publishedAt && new Date(article.publishedAt).toLocaleDateString("ja-JP")]
								.filter(Boolean)
								.join(" · ")}
						</small>
					</article>
				))}
			</section>
		</main>
	);
}
