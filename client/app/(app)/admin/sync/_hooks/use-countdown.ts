"use client";

import * as React from "react";

const TICK_MS = 1000;

// Milliseconds left until target, floored at zero; null when there is no target
export const useCountdown = (target: string | null): number | null => {
	const [now, setNow] = React.useState(() => Date.now());

	React.useEffect(() => {
		if (!target) {
			return;
		}

		const interval = window.setInterval(() => setNow(Date.now()), TICK_MS);
		return () => window.clearInterval(interval);
	}, [target]);

	if (!target) {
		return null;
	}

	return Math.max(new Date(target).getTime() - now, 0);
};

const pad = (value: number) => String(value).padStart(2, "0");

export const formatCountdown = (ms: number): string => {
	const totalSeconds = Math.ceil(ms / 1000);
	const days = Math.floor(totalSeconds / 86_400);
	const hours = Math.floor((totalSeconds % 86_400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const clock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

	return days > 0 ? `${days}d ${clock}` : clock;
};
