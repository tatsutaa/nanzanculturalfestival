import { createHash } from "node:crypto";
import Parser from "rss-parser";
import {
	getCountryOptions,
	getNewsDatabase,
	getNewsSources,
	normalizeCountryCode,
} from "../../lib/news";
import type { NewsSource } from "../../lib/news";

const refreshInterval = 15 * 60 * 1000;
const sourcesPerRequest = 20;
const rssParser = new Parser({
	timeout: 10000,
	headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsCatalog/1.0)" },
	customFields: { item: [["source", "source"]] },
});

type Article = {
	title: string;
	description?: string | null;
	url: string;
	source?: { id?: string | null; name?: string | null; url?: string };
	publishedAt?: string;
};

function sortLatest(articles: Record<string, Article> | null) {
	return Object.values(articles ?? {})
		.sort((first, second) => Date.parse(second.publishedAt ?? "") - Date.parse(first.publishedAt ?? ""))
		.slice(0, 20);
}

function getLanguage(country: string) {
	try {
		const language = new Intl.Locale(`und-${country.toUpperCase()}`).maximize().language;
		return language === "und" ? "en" : language;
	} catch {
		return "en";
	}
}

async function fetchRssArticles(country: string): Promise<Article[]> {
	const language = getLanguage(country);
	const countryCode = country.toUpperCase();
	const feedUrl = new URL("https://news.google.com/rss");
	feedUrl.searchParams.set("hl", language);
	feedUrl.searchParams.set("gl", countryCode);
	feedUrl.searchParams.set("ceid", `${countryCode}:${language}`);

	const feed = await rssParser.parseURL(feedUrl.toString());
	return feed.items
		.filter((item) => item.title && item.link)
		.map((item) => ({
			title: item.title ?? "",
			url: item.link ?? "",
			...(item.contentSnippet ? { description: item.contentSnippet } : {}),
			...(typeof item.source === "string" ? { source: { name: item.source } } : {}),
			...(item.isoDate || item.pubDate
				? { publishedAt: item.isoDate ?? item.pubDate }
				: {}),
		}));
}

async function fetchOfficialRssArticles(
	sources: NewsSource[],
): Promise<Article[]> {
	type WordPressPost = {
		id?: number;
		title?: { rendered?: string };
		link?: string;
		excerpt?: { rendered?: string };
		date?: string;
	};

	const results = await Promise.all(
		sources.map(async (source) => {
			if (!source.rssUrl) return [];
			try {
				if (source.feedFormat === "wordpress-json") {
					const response = await fetch(source.rssUrl, {
						headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsCatalog/1.0)" },
						cache: "no-store",
					});
					if (!response.ok) return [];
					const posts = (await response.json()) as WordPressPost[];
					return posts
						.filter((post) => post.title?.rendered && (post.link || post.id))
						.map((post) => ({
							title: post.title?.rendered ?? "",
							url: post.link ?? new URL(`?p=${post.id}`, source.url).toString(),
							source: { name: source.name, url: source.url },
							...(post.excerpt?.rendered
								? {
									description: post.excerpt.rendered.replace(/<[^>]*>/g, " ").trim(),
								}
								: {}),
							...(post.date ? { publishedAt: post.date } : {}),
						}));
				}

				const feed = await rssParser.parseURL(source.rssUrl);
				return feed.items
					.map((item) => {
						const title =
							item.title ??
							item.contentSnippet ??
							item.content?.replace(/<[^>]*>/g, " ").trim();
						return { item, title };
					})
					.filter(({ item, title }) => title && item.link)
					.map(({ item, title }) => ({
						title: title ?? "",
						url: item.link ?? "",
						source: { name: source.name, url: source.url },
						...(item.contentSnippet
							? { description: item.contentSnippet }
							: {}),
						...(item.isoDate || item.pubDate
							? { publishedAt: item.isoDate ?? item.pubDate }
							: {}),
					}));
			} catch {
				return [];
			}
		}),
	);
	return results.flat();
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const country = normalizeCountryCode(searchParams.get("country") ?? "us");

	try {
		const [database, sources] = await Promise.all([
			Promise.resolve(getNewsDatabase()),
			getNewsSources(),
		]);
		const countrySources = sources.filter((source) => source.country === country);
		const officialRssSources = countrySources.filter((source) => source.rssUrl);
		const newsApiSources = countrySources.filter((source) => !source.rssUrl);
		if (!getCountryOptions().some((option) => option.code === country)) {
			return Response.json({ error: "指定された国コードは使えません。" }, { status: 400 });
		}

		const articlesRef = database.ref(`news_articles/${country}`);
		const [cachedSnapshot, refreshedAtSnapshot, sourceCatalogSnapshot] = await Promise.all([
			articlesRef.get(),
			database.ref(`news_updated_at/${country}`).get(),
			database.ref("news_sources/catalog/updatedAt").get(),
		]);
		let storedArticles = cachedSnapshot.val() as Record<string, Article> | null;
		const refreshedAt = Number(refreshedAtSnapshot.val() ?? 0);
		const sourceCatalogUpdatedAt = Number(sourceCatalogSnapshot.val() ?? 0);
		const articles = sortLatest(storedArticles);

		if (
			articles.length &&
			Date.now() - refreshedAt < refreshInterval &&
			refreshedAt >= sourceCatalogUpdatedAt
		) {
			return Response.json({ articles });
		}

		const fetchedArticles = await fetchOfficialRssArticles(officialRssSources);
		const errors: string[] = [];
		const apiKey = process.env.NEWS_API_KEY;

		if (newsApiSources.length && apiKey) {
			const batches: string[][] = [];
			for (let index = 0; index < newsApiSources.length; index += sourcesPerRequest) {
				batches.push(newsApiSources.slice(index, index + sourcesPerRequest).map((source) => source.id));
			}

			const sourceById = new Map(newsApiSources.map((source) => [source.id, source]));
			await Promise.all(
				batches.map(async (batch) => {
					const newsUrl = new URL("https://newsapi.org/v2/top-headlines");
					newsUrl.searchParams.set("sources", batch.join(","));
					newsUrl.searchParams.set("pageSize", "100");

					try {
						const response = await fetch(newsUrl, {
							headers: { "X-Api-Key": apiKey },
							cache: "no-store",
						});
						const data = await response.json();
						if (!response.ok || !Array.isArray(data.articles)) {
							errors.push(data.message ?? "ニュースを取得できませんでした。");
							return;
						}

						for (const article of data.articles as Article[]) {
							const source = article.source?.id
								? sourceById.get(article.source.id)
								: undefined;
							fetchedArticles.push({
								...article,
								source: source
									? { ...article.source, url: source.url }
									: article.source,
							});
						}
					} catch {
						errors.push("NewsAPIに接続できませんでした。");
					}
				}),
			);
		} else if (!officialRssSources.length) {
			try {
				fetchedArticles.push(...(await fetchRssArticles(country)));
			} catch {
				errors.push("この国のGoogle News RSSを取得できませんでした。");
			}
		}

		if (!fetchedArticles.length && errors.length && !storedArticles) {
			return Response.json({ error: errors[0] }, { status: 502 });
		}

		const merged = { ...(storedArticles ?? {}) };
		for (const article of fetchedArticles) {
			if (!article.url || !article.title) continue;
			const id = createHash("sha256").update(article.url).digest("hex");
			merged[id] = article;
		}

		const latestEntries = Object.entries(merged)
			.sort(([, first], [, second]) => Date.parse(second.publishedAt ?? "") - Date.parse(first.publishedAt ?? ""))
			.slice(0, 100);
		storedArticles = Object.fromEntries(latestEntries);
		await Promise.all([
			articlesRef.set(storedArticles),
			database.ref(`news_updated_at/${country}`).set(Date.now()),
		]);

		return Response.json({ articles: sortLatest(storedArticles) });
	} catch {
		return Response.json(
			{
				error: "Firebaseまたはニュースサービスに接続できませんでした。",
			},
			{ status: 503 },
		);
	}
}