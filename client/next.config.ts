import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	productionBrowserSourceMaps: false,
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
