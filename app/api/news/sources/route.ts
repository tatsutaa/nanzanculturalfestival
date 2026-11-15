import { getCountryOptions, getNewsSources } from "../../../lib/news";

export async function GET() {
	try {
		const sources = await getNewsSources();
		return Response.json({
			countries: getCountryOptions(),
			sources,
			registeredRssSources: sources.filter((source) => source.rssUrl),
		});
	} catch (error) {
		return Response.json(
			{
				error:
					error instanceof Error
						? error.message
						: "ニュース配信元を取得できませんでした。",
			},
			{ status: 503 },
		);
	}
}