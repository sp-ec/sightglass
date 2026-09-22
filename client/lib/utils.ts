import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const countFormatter = new Intl.NumberFormat("en-US", {
	maximumFractionDigits: 0,
});

const dollarFormatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 0,
});

// Whole counts with thousands separators: 41,200
export function formatCount(value: number): string {
	return Number.isFinite(value) ? countFormatter.format(value) : "—";
}

// Cents to whole dollars, for large money like revenue: 128430000 -> $1,284,300
export function formatCents(value: number): string {
	return Number.isFinite(value) ? dollarFormatter.format(value / 100) : "—";
}

const priceFormatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

// Cents to an exact price, where the cents matter: 1499 -> $14.99
export function formatPrice(value: number): string {
	return Number.isFinite(value) ? priceFormatter.format(value / 100) : "—";
}

export function formatAssetUrl(url: string, filename: string): string {
	let formattedUrl =
		"https://shared.akamai.steamstatic.com/store_item_assets/" + url;
	return formattedUrl.replace("${FILENAME}", filename);
}
