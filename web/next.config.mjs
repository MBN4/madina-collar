const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '192.168.18.18',
        port: '5000'
      }
    ]
  }
};

export default nextConfig;
