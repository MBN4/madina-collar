const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.almadina.site'
      }
    ]
  }
};

export default nextConfig;
