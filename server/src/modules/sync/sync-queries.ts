export const fetchGamesQuery = (start: number) => {
  return {
		key: process.env.STEAM_API_KEY,
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
