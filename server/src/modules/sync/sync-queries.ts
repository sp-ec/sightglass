// The key is passed in rather than read here so this stays a pure, synchronous
// builder: it now lives in the database, and fetching it is the caller's job
export const fetchGamesQuery = (start: number, apiKey: string) => {
  return {
		key: apiKey,
		query_name: "steamanalyzer_fetch_games",
		query: {
			filters: {
				released_only: true,
				type_filters: {
					include_games: true,
					include_packages: false,
					include_bundles: false,
					include_dlc: false,
					include_demos: true,
				},
			},
			count: 1000,
			start: start,
			sort: 2,
		},
		context: {
			language: "english",
			country_code: "US",
		},
		data_request: {
			include_basic_info: true,
			include_reviews: true,
			include_ratings: true,
			include_tag_count: true,
			include_release: true,
			include_assets: true,
			include_supported_languages: true,
			include_platforms: true,
		},
	};};
