/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: false,
  env: {
    SAP_SERVICE_LAYER_BASE_URL: process.env.SAP_SERVICE_LAYER_BASE_URL,
    SAP_B1_COMPANY_DB: process.env.SAP_B1_COMPANY_DB,
    SAP_B1_USERNAME: process.env.SAP_B1_USERNAME,
    SAP_B1_PASSWORD: process.env.SAP_B1_PASSWORD,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    SYNCFUSION_LICENSE_KEY: process.env.SYNCFUSION_LICENSE_KEY,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    FIREBASE_TYPE: process.env.FIREBASE_TYPE,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID,
    FIREBASE_AUTH_URI: process.env.FIREBASE_AUTH_URI,
    FIREBASE_TOKEN_URI: process.env.FIREBASE_TOKEN_URI,
    FIREBASE_AUTH_PROVIDER_X509_CERT_URL: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    FIREBASE_CLIENT_X509_CERT_URL: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    FIREBASE_UNIVERSE_DOMAIN: process.env.FIREBASE_UNIVERSE_DOMAIN,
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
      {
        source: '/site.webmanifest',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      // DASHBOARD/OVERVIEW
      {
        source: "/dashboard",
        destination: "/dashboard/overview",
      },
      // CUSTOMERS
      {
        source: "/customers",
        destination: "/dashboard/customers/list",
      },
      {
        source: "/customers/view/:id",
        destination: "/dashboard/customers/:id",
      },
 
      // WORKERS
      {
        source: "/workers/create",
        destination: "/dashboard/workers/create-worker",
      },
      {
        source: "/workers",
        destination: "/dashboard/workers/list",
      },
      {
        source: "/workers/view/:id",
        destination: "/dashboard/workers/view/:id",
      },
      {
        source: "/workers/edit-worker/:workerId",
        destination: "/dashboard/workers/:workerId",
      },

      // SCHEDULING
      {
        source: "/jobs/calendar",
        destination: "/dashboard/scheduling/jobs/calendar",
      },
      {
        source: "/schedule",
        destination: "/dashboard/scheduling/workers/schedules",
      },

      // JOBS
      {
        source: "/jobs",
        destination: "/dashboard/jobs/list-jobs",
      },
      {
        source: "/jobs/view/:jobId",
        destination: "/dashboard/jobs/:jobId", // Rewrite to /dashboard/jobs/{jobId}
      },
      {
        source: "/jobs/edit-jobs/:id",
        destination: "/dashboard/jobs/edit-jobs/:id",
      },
      {
        source: "/jobs/create",
        destination: "/dashboard/jobs/create-jobs",
      },
      {
        source: "/jobs/create-jobs",
        destination: "/dashboard/jobs/create-jobs?",
      },

      // AUTHENTICATION
      {
        source: "/sign-in",
        destination: "/authentication/sign-in",
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
