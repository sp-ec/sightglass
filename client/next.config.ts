import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Self-contained server bundle for the Docker image
	output: "standalone",
	productionBrowserSourceMaps: false,
	// Forwards the API to Express so the browser sees one origin. This is what
	// makes the session cookie first-party and readable by proxy.ts.
	async rewrites() {
		return {
			// beforeFiles so no future app/api/** route can shadow the API
			beforeFiles: [
				{
					source: "/api/:path*",
					destination: `${process.env.SERVER_API_URL ?? "http://localhost:3001"}/api/:path*`,
				},
			],
		};
	},
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
