export const TOOLTIP = {
	trigger: "item",
	formatter: function (params: any) {
		const point = params.data[2];
		return `
			<div style="font-weight:bold;margin-bottom:4px;">Bucket: ${point.bucket || "N/A"}</div>
			${point.count ? `<div>Count: ${point.count}</div>` : ""}
			${point.aggregate_review_count ? `<div>Review Count: ${point.aggregate_review_count}</div>` : ""}
			${point.aggregate_review_score ? `<div>Review Score: ${point.aggregate_review_score}</div>` : ""}
			${point.aggregate_percent_positive ? `<div>Positive %: ${point.aggregate_percent_positive}</div>` : ""}
			${point.aggregate_price_in_cents ? `<div>Price: $${(point.aggregate_price_in_cents / 100).toFixed(2)}</div>` : ""}
			${point.aggregate_value ? `<div>Value: ${point.aggregate_value}</div>` : ""}
			${point.min_value ? `<div>Range: ${point.min_value} - ${point.max_value}</div>` : ""}
		`;
	}, 
};
