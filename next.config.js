/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: "1mb" },
  },
  async headers() {
    // HSTS nur setzen, wenn die App ausschliesslich ueber HTTPS ausgeliefert
    // wird (ueber SESSION_COOKIE_SECURE signalisiert). Bei HTTP wuerde ein
    // HSTS-Header von Browsern ignoriert, aber die halbe Loesung ist schlimmer
    // als keine: Wir setzen ihn daher bewusst nur im HTTPS-Fall.
    const hsts =
      process.env.SESSION_COOKIE_SECURE === "true"
        ? [
            {
              key: "Strict-Transport-Security",
              value: "max-age=63072000; includeSubDomains; preload",
            },
          ]
        : [];

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          ...hsts,
        ],
      },
    ];
  },
};

module.exports = nextConfig;