// import node module libraries
import Head from 'next/head';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';

// import provider and store from redux state management
import { Provider } from 'react-redux';
import { store } from 'store/store';

// import theme style scss file
import '../styles/theme.scss'; 

// import default layouts
import DefaultMarketingLayout from 'layouts/marketing/DefaultLayout';
import DefaultDashboardLayout from 'layouts/dashboard/DashboardIndexTop';
import { Fragment } from 'react';
import { registerLicense } from "@syncfusion/ej2-base";

registerLicense(process.env.REACT_APP_SYNCFUSION_LICENSE_KEY);

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const pageURL = process.env.baseURL + router.pathname;
  const title = "SAS - SAP B1 Portal";
  const description = "Discover SAS, your ultimate SAP B1 portal. Utilize the portal with ease!";
  const keywords = "SAP B1, Service Layer, Admin dashboard, Portal, web apps, bootstrap 5, Pixelcare Consulting";

  // Choose layout based on route
  const Layout = Component.Layout || (router.pathname.includes('dashboard') ? (router.pathname.includes('instructor') || router.pathname.includes('student') ? DefaultMarketingLayout : DefaultDashboardLayout) : DefaultMarketingLayout);

  return (
    <Fragment>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content={keywords} />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
      </Head>
      <NextSeo
        title={title}
        description={description}
        canonical={pageURL}
        openGraph={{
          url: pageURL,
          title: title,
          description: description,
          site_name: process.env.siteName,
          // images: [
          //   {
          //     url: '#',
          //     width: 1200,
          //     height: 630,
          //     alt: 'SAS - SAP B1 Portal',
          //   },
          // ],
        }}
      />
      <Provider store={store}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </Provider>
    </Fragment>
  );
}

export default MyApp;


// // import node module libraries
// import Head from 'next/head';
// import { useRouter } from 'next/router'
// import { NextSeo } from 'next-seo'

// // import provider and store from redux state management.
// import { Provider } from 'react-redux'
// import { store } from 'store/store'

// // import theme style scss file
// import 'styles/theme.scss';


// // import default layouts
// import DefaultMarketingLayout from 'layouts/marketing/DefaultLayout';
// import DefaultDashboardLayout from 'layouts/dashboard/DashboardIndexTop';
// import { Fragment } from 'react';

// function MyApp({ Component, pageProps }) {
//   const router = useRouter();
//   const pageURL = process.env.baseURL + router.pathname;
//   const title = "SAS - SAP B1 Portal";
//   const description = "Discover SAS, your ultimate SAP B1 portal. Utilize the portal with ease!"
//   const keywords = "SAP B1, Service Layer, Admin dashboard, Portal, web apps, bootstrap 5, Pixelcare Consulting"

//   const Layout = Component.Layout || (router.pathname.includes('dashboard') ? (router.pathname.includes('instructor') || router.pathname.includes('student') ? DefaultMarketingLayout : DefaultDashboardLayout) : DefaultMarketingLayout)


//   return (
//     <Fragment>
//       <Head>
//         <meta name="viewport" content="width=device-width, initial-scale=1" />
//         <meta name="keywords" content={keywords} />
//         <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
//       </Head>
//       <NextSeo
//         title={title}
//         description={description}
//         canonical={pageURL}
//         openGraph={{
//           url: pageURL,
//           title: title,
//           description: description,
//           site_name: process.env.siteName,
//           images: [
//             {
//               url: '#',
//               width: 1200,
//               height: 630,
//               alt: 'SAS - SAP B1 Portal',
//             },
//           ],
//         }}
//       />
//       <Provider store={store}>
//         <Layout>
//           <Component {...pageProps} />
//         </Layout>
//       </Provider>
//     </Fragment>
//   )
// }

// export default MyApp
