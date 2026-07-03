/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: "1mb" },
  },
  async redirects() {
    return [
      { source: "/lernen", destination: "/kurs/betriebssysteme/lernen", permanent: false },
      { source: "/pruefung", destination: "/kurs/betriebssysteme/pruefung", permanent: false },
      { source: "/fortschritt", destination: "/kurs/betriebssysteme/fortschritt", permanent: false },
      { source: "/statistik", destination: "/kurs/betriebssysteme/statistik", permanent: false },
      { source: "/katalog", destination: "/kurs/betriebssysteme/katalog", permanent: false },
      { source: "/katalog/:id", destination: "/kurs/betriebssysteme/katalog/:id", permanent: false },
    ];
  },
};

module.exports = nextConfig;