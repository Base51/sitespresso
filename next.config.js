/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '**.supabase.co',
			},
		],
		dangerouslyAllowSVG: true,
	},
};

module.exports = nextConfig;
