import { InfoIcon, Meh, ThumbsDown, ThumbsUp } from "lucide-react";

// Indexed by Steam's review_score, 0 through 9
export const reviewTone = [
	{ text: "text-muted-foreground", icon: InfoIcon },
	{ text: "text-red-400", icon: ThumbsDown },
	{ text: "text-red-400", icon: ThumbsDown },
	{ text: "text-red-400", icon: ThumbsDown },
	{ text: "text-red-400", icon: ThumbsDown },
	{ text: "text-yellow-400", icon: Meh },
	{ text: "text-lime-400", icon: ThumbsUp },
	{ text: "text-lime-400", icon: ThumbsUp },
	{ text: "text-green-400", icon: ThumbsUp },
	{ text: "text-green-400", icon: ThumbsUp },
];

export const toneForScore = (score: number | null | undefined) =>
	reviewTone[score ?? 0] ?? reviewTone[0];
