
/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  env: {
    SAP_B1_SERVICE_LAYER_URL: process.env.SAP_B1_SERVICE_LAYER_URL,
    SAP_B1_COMPANY_DB: process.env.SAP_B1_COMPANY_DB,
    SAP_B1_USERNAME: process.env.SAP_B1_USERNAME,
    SAP_B1_PASSWORD: process.env.SAP_B1_PASSWORD,
    REACT_APP_GOOGLE_MAPS_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    REACT_APP_SYNCFUSION_LICENSE_KEY: process.env.REACT_APP_SYNCFUSION_LICENSE_KEY,
  },
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  async headers() {
    return [
      {
        source: '/api/login',
        headers: [
          {
            key: 'NODE_TLS_REJECT_UNAUTHORIZED',
            value: '0', 
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/dashboard/workers/edit-worker/:workerId',
        destination: '/[workerId]',
      },
      {
        source: '/dashboard',
        destination: '/dashboard/overview',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard/overview',
        permanent: true,
      },
      {
        source: '/dashboard/:path*',
        has: [
          {
            type: 'cookie',
            key: 'customToken', 
            value: '^(?!.*$)', // Matches if the cookie does not exist
          },
        ],
        permanent: false,
        destination: '/authentication/sign-in',
      },
    ];
  },
};

module.exports = nextConfig;


// // next.config.js
// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: false,
//   swcMinify: true,
//   env: {
//     SAP_B1_SERVICE_LAYER_URL: process.env.SAP_B1_SERVICE_LAYER_URL,
//     SAP_B1_COMPANY_DB: process.env.SAP_B1_COMPANY_DB,
//     SAP_B1_USERNAME: process.env.SAP_B1_USERNAME,
//     SAP_B1_PASSWORD: process.env.SAP_B1_PASSWORD,
//     REACT_APP_GOOGLE_MAPS_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
//   },
//   async headers() {
//     return [
//       {
//         source: '/api/login',
//         headers: [
//           {
//             key: 'NODE_TLS_REJECT_UNAUTHORIZED',
//             value: '0', 
//           },
//         ],
//       },
//     ];
//   },
//   async rewrites() {
//     return [
//       {
//         source: '/dashboard/workers/edit-worker/:workerId',
//         destination: '/[workerId]',
//       },
//       {
//         source: '/dashboard',
//         destination: '/dashboard/overview',
//       },
//     ];
//   },
//   async redirects() {
//     return [
//       {
//         source: '/',
//         destination: '/dashboard/overview',
//         permanent: true,
//       },
//       {
//         source: '/dashboard/:path*',
//         has: [
//           {
//             type: 'cookie',
//             key: 'customToken', 
//             value: '^(?!.*$)', // Matches if the cookie does not exist
//           },
//         ],
//         permanent: false,
//         destination: '/authentication/sign-in',
//       },
//     ];
//   },
// };

// module.exports = nextConfig;
