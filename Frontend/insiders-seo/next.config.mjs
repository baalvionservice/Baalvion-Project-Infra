/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow remote avatars (seed uses pravatar; real profiles may use any https host).
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  async headers() {
    return [{ source: "/(.*)", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }] }];
  },
};
export default nextConfig;
