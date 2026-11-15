"use client";

import { useEffect, useState } from "react";

type Article = {
	title: string;
	description?: string;
	url: string;
	source?: { name?: string; url?: string };
	publishedAt?: string;
};

type NewsSource = {
	id: string;
	name: string;
	url: string;
	category: string;
	language: string;
	country: string;
};

type CountryOption = { code: string; name: string };

export default function Page() {
	const [country, setCountry] = useState("us");
	const [countries, setCountries] = useState<CountryOption[]>([]);
	const [sources, setSources] = useState<NewsSource[]>([]);
	const [articles, setArticles] = useState<Article[]>([]);
	const [loadingSources, setLoadingSources] = useState(true);
	const [loadingArticles, setLoadingArticles] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const controller = new AbortController();

		async function loadSources() {
			try {
				const response = await fetch("/api/news/sources", {
					signal: controller.signal,
				});
				const data = await response.json();
				if (!response.ok) {
					throw new Error(data.error ?? "ニュース配信元を取得できませんでした。");
				}
				const loadedSources = Array.isArray(data.sources) ? data.sources : [];
				const loadedCountries = Array.isArray(data.countries) ? data.countries : [];
				setSources(loadedSources);
				setCountries(loadedCountries);
				if (!loadedCountries.some((item: CountryOption) => item.code === country)) {
					setCountry(loadedCountries[0]?.code ?? "us");
				}
			} catch (err) {
				if (err instanceof Error && err.name !== "AbortError") {
					setError(err.message);
				}
			} finally {
				if (!controller.signal.aborted) setLoadingSources(false);
			}
		}

		loadSources();
		return () => controller.abort();
	}, []);

	useEffect(() => {
		if (!country) return;
		const controller = new AbortController();

		async function loadNews() {
			setLoadingArticles(true);
			setError("");
			try {
				const response = await fetch(`/api/news?country=${country}`, {
					signal: controller.signal,
				});
				const data = await response.json();
				if (!response.ok) {
					throw new Error(data.error ?? "ニュースを取得できませんでした。");
				}
				setArticles(Array.isArray(data.articles) ? data.articles : []);
			} catch (err) {
				if (err instanceof Error && err.name !== "AbortError") {
					setError(err.message);
				}
			} finally {
				if (!controller.signal.aborted) setLoadingArticles(false);
			}
		}

		loadNews();
		return () => controller.abort();
	}, [country]);

	const countrySources = sources.filter((source) => source.country === country);

	return (
		<main style={{ maxWidth: 960, margin: "40px auto", padding: 20 }}>
			<h1>世界のニュース</h1>
			{loadingSources ? (
				<p>配信元一覧を読み込み中…</p>
			) : (
				<>
					<label htmlFor="country">国で絞り込む：</label>{" "}
					<select
						id="country"
						value={country}
						onChange={(event) => setCountry(event.target.value)}
					>
						{countries.map((item) => (
							<option key={item.code} value={item.code}>
								{item.name}
							</option>
						))}
					</select>
					{countrySources.length ? (
						<details style={{ marginTop: 16 }}>
							<summary>登録配信元 ({countrySources.length})</summary>
							<ul style={{ columns: 2, paddingLeft: 20 }}>
								{countrySources.map((source) => (
									<li key={source.id}>
										<a href={source.url} target="_blank" rel="noreferrer">
											{source.name}
										</a>
									</li>
								))}
							</ul>
						</details>
					) : (
						<p style={{ marginTop: 16 }}>この国の記事はGoogle News RSSから取得します。</p>
					)}
				</>
			)}

			{loadingArticles && <p>ニュースを読み込み中…</p>}
			{error && <p role="alert">{error}</p>}
			{!loadingArticles && !error && articles.length === 0 && (
				<p>ニュースがありません。</p>
			)}

			<section
				aria-label="ニュース一覧"
				style={{ display: "grid", gap: 20, marginTop: 24 }}
			>
				{articles.map((article, index) => (
					<article
						key={`${article.url}-${index}`}
						style={{
							border: "1px solid #ddd",
							borderRadius: 8,
							padding: 16,
						}}
					>
						<h2 style={{ marginTop: 0 }}>
							<a href={article.url} target="_blank" rel="noreferrer">
								{article.title}
							</a>
						</h2>
						{article.description && <p>{article.description}</p>}
						<small style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
							{[
								article.source?.name,
								article.publishedAt &&
									new Date(article.publishedAt).toLocaleDateString("ja-JP"),
							]
								.filter(Boolean)
								.join(" · ")}
							{article.source?.url && (
								<a href={article.source.url} target="_blank" rel="noreferrer">
									配信元サイト
								</a>
							)}
							<a href={article.url} target="_blank" rel="noreferrer">
								記事を読む ↗
							</a>
						</small>
					</article>
				))}
			</section>
		</main>
	);
}