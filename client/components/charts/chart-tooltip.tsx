export const TOOLTIP = {
	trigger: "item",
	formatter: function (params: any) {
		const point = params.data[2];
		return `
			<div style="font-weight:bold;margin-bottom:4px;">Bucket: ${point.bucket || "N/A"}</div>
			${point.count ? `<div>Count: ${point.count}</div>` : ""}
			${point.average_review_count ? `<div>Avg. Review Count: ${point.average_review_count}</div>` : ""}
			${point.average_review_score ? `<div>Avg. Review Score: ${point.average_review_score}</div>` : ""}
			${point.average_percent_positive ? `<div>Avg. Positive %: ${point.average_percent_positive}</div>` : ""}
			${point.average_price_in_cents ? `<div>Avg. Price: $${(point.average_price_in_cents / 100).toFixed(2)}</div>` : ""}
			${point.average_value ? `<div>Avg. Value: ${point.average_value}</div>` : ""}
			${point.min_value ? `<div>Range: ${point.min_value} - ${point.max_value}</div>` : ""}
		`;
	}, 
};
