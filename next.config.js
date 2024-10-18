/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_SAP_SERVICE_LAYER_BASE_URL: process.env.NEXT_PUBLIC_SAP_SERVICE_LAYER_BASE_URL,
    NEXT_PUBLIC_SAP_B1_COMPANY_DB: process.env.NEXT_PUBLIC_SAP_B1_COMPANY_DB,
    NEXT_PUBLIC_SAP_B1_USERNAME: process.env.NEXT_PUBLIC_SAP_B1_USERNAME,
    NEXT_PUBLIC_SAP_B1_PASSWORD: process.env.NEXT_PUBLIC_SAP_B1_PASSWORD,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_SYNCFUSION_LICENSE_KEY: process.env.NEXT_PUBLIC_SYNCFUSION_LICENSE_KEY,
  },
  sassOptions: {
    includePaths: [path.join(__dirname, "styles")],
  },
  images: {
    domains: ["firebasestorage.googleapis.com"],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/dashboard/workers/edit-worker/:workerId",
        destination: "/[workerId]",
      },
      {
        source: "/dashboard",
        destination: "/dashboard/overview",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard/overview",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
