/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  env: {
    SAP_SERVICE_LAYER_BASE_URL: process.env.SAP_SERVICE_LAYER_BASE_URL,
    SAP_B1_COMPANY_DB: process.env.SAP_B1_COMPANY_DB,
    SAP_B1_USERNAME: process.env.SAP_B1_USERNAME,
    SAP_B1_PASSWORD: process.env.SAP_B1_PASSWORD,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    SYNCFUSION_LICENSE_KEY: process.env.SYNCFUSION_LICENSE_KEY,
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
