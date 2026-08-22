/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Load sharp natively at runtime instead of bundling — its native
  // binaries break when processed by the server bundle.
  serverExternalPackages: ["sharp"],
  eslint: {
    // Vercel'e pushlarken kullanılmayan değişken (unused-vars) hatalarının build'i durdurmasını engeller
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "pzoohyswoxmqtrazjxim.supabase.co" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;