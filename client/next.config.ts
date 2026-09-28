import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Self-contained server bundle for the Docker image
	output: "standalone",
	productionBrowserSourceMaps: false,
	// The /api forward to Express lives in proxy.ts so its target is set at runtime
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "shared.akamai.steamstatic.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "store.steampowered.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "cdn.akamai.steamstatic.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "cdn.cloudflare.steamstatic.com",
				port: "",
				pathname: "/**",
			},
		],
	},
};

export default nextConfig;
