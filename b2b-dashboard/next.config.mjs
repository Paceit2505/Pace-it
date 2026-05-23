/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  // Em dev: servidor normal. Em prod (build): export estático para GitHub Pages.
  output: isProd ? 'export' : undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  // GitHub Pages serve o site em /Pace-it/ (nome do repositório)
  basePath: isProd ? '/Pace-it' : '',
  assetPrefix: isProd ? '/Pace-it/' : '',
};

export default nextConfig;
