import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThumbsUp, ThumbsDown, Meh, InfoIcon } from "lucide-react";

type GameReviewSummaryProps = {
	gameReviewData: any;
};

function GameReviewSummary({ gameReviewData }: GameReviewSummaryProps) {
	const reviewScoreColors = [
		{ bg: "bg-zinc-500/20", icon: <InfoIcon size={18} /> }, // 0 Not Enough Reviews
		{ bg: "bg-red-500/20", icon: <ThumbsDown size={18} /> }, // 1 Overwhelmingly Negative
		{ bg: "bg-red-500/20", icon: <ThumbsDown size={18} /> }, // 2 Very Negative
		{ bg: "bg-red-500/20", icon: <ThumbsDown size={18} /> }, // 3: Negative
		{ bg: "bg-red-500/20", icon: <ThumbsDown size={18} /> }, // 4: Mostly Negative
		{ bg: "bg-yellow-400/20", icon: <Meh size={18} /> }, // 5: Mixed
		{ bg: "bg-lime-500/20", icon: <ThumbsUp size={18} /> }, // 6: Mostly Positive
		{ bg: "bg-lime-400/20", icon: <ThumbsUp size={18} /> }, // 7: Positive
		{ bg: "bg-green-500/20", icon: <ThumbsUp size={18} /> }, // 8: Very Positive
		{ bg: "bg-green-500/20", icon: <ThumbsUp size={18} /> }, // 9: Overwhelmingly Positive
	];

    if (!gameReviewData) {
        return <></>;
    }

	return (
		<Card className="w-full max-w-lg">
			<CardHeader>
				<CardTitle>Reviews Summary</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-row justify-between gap-4">
				<div className="w-1/3">
					<p>Review Count: {gameReviewData.review_count}</p>
					<p>Percent Positive: {gameReviewData.percent_positive}%</p>
				</div>
				<div
					className={`w-2/3 text-lg flex flex-row place-items-center gap-2 justify-center place-content-center rounded-md ${reviewScoreColors[gameReviewData.review_score]?.bg}`}
				>
					{reviewScoreColors[gameReviewData.review_score]?.icon && (
						<div className="flex justify-center">
							{reviewScoreColors[gameReviewData.review_score]?.icon}
						</div>
					)}
					<p className="text-center">{gameReviewData.review_score_label}</p>
				</div>
			</CardContent>
		</Card>
	);
}

export default GameReviewSummary;
