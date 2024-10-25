/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  // Remove swcMinify as it's enabled by default in Next.js 13+
  reactStrictMode: true,
  
  env: {
    SAP_SERVICE_LAYER_BASE_URL: process.env.SAP_SERVICE_LAYER_BASE_URL,
    SAP_B1_COMPANY_DB: process.env.SAP_B1_COMPANY_DB,
    SAP_B1_USERNAME: process.env.SAP_B1_USERNAME,
    SAP_B1_PASSWORD: process.env.SAP_B1_PASSWORD,
    //REDIS_URL: process.env.REDIS_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    SYNCFUSION_LICENSE_KEY: process.env.SYNCFUSION_LICENSE_KEY,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
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