/** @type {import('next').NextConfig} */

// Static export + base path are opt-in via env so normal dev/build is unchanged.
// Used to publish to GitHub Pages under a project subpath, e.g.:
//   NEXT_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/Eddah-open-design npm run build
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const isExport = process.env.NEXT_EXPORT === "1";

const nextConfig = {
  reactStrictMode: true,
  ...(isExport
    ? { output: "export", images: { unoptimized: true }, trailingSlash: true }
    : {}),
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;
