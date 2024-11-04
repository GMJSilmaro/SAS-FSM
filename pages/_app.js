import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { NextSeo } from "next-seo";
import { QueryClient, QueryClientProvider } from 'react-query';
import { Provider } from "react-redux";
import { store } from "store/store";
import { Fragment } from "react";
import { registerLicense } from "@syncfusion/ej2-base";
import ActivityTracker from '../components/ActivityTracker';
import LoadingOverlay from '../components/LoadingOverlay';
//import SessionDebug from '../components/SessionDebug';

// Layouts
import DefaultMarketingLayout from "layouts/marketing/DefaultLayout";
import DefaultDashboardLayout from "layouts/dashboard/DashboardIndexTop";
import MainLayout from "@/layouts/MainLayout";

// Styles
import "../styles/theme.scss";
import FooterWithSocialIcons from "@/layouts/marketing/footers/FooterWithSocialIcons";
import 'react-toastify/dist/ReactToastify.css';

registerLicense(process.env.SYNCFUSION_LICENSE_KEY);

// Create QueryClient with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  }
});

// function MyApp({ Component, pageProps }) {
//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState(false);
  
//   const pageURL = process.env.baseURL + router.pathname;
//   const title = "SAS&ME - SAP B1 | Portal";
//   const description = "Discover SAS, your ultimate SAP B1 portal. Utilize the portal with ease!";
//   const keywords = "SAP B1, Service Layer, Admin dashboard, Portal, web apps, Pixelcare Consulting";

//   // Choose layout based on route
//   const Layout = Component.Layout ||
//     (router.pathname.includes("dashboard")
//       ? DefaultDashboardLayout
//       : DefaultMarketingLayout);

//   // Loading state management
//   useEffect(() => {
//     const handleStart = () => setIsLoading(true);
//     const handleComplete = () => setIsLoading(false);

//     router.events.on('routeChangeStart', handleStart);
//     router.events.on('routeChangeComplete', handleComplete);
//     router.events.on('routeChangeError', handleComplete);

//     return () => {
//       router.events.off('routeChangeStart', handleStart);
//       router.events.off('routeChangeComplete', handleComplete);
//       router.events.off('routeChangeError', handleComplete);
//     };
//   }, []);

//   // Check if current page is sign-in page
//   const isSignInPage = router.pathname === '/sign-in' || router.pathname === '/authentication/sign-in';

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
//         }}
//       />
//       <Provider store={store}>
//         <QueryClientProvider client={queryClient}>
//           <Layout>
//             <Component {...pageProps} setIsLoading={setIsLoading} />
//             {!router.pathname.startsWith('/authentication/') && <ActivityTracker />}
//             <LoadingOverlay isLoading={isLoading} />
//             {process.env.NODE_ENV !== 'production'}
//           </Layout>
//         </QueryClientProvider>
//       </Provider>
//       {!isSignInPage && <FooterWithSocialIcons/>}
//     </Fragment>
    
//   );
// }

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const pageURL = process.env.baseURL + router.pathname;
  const title = "SAS&ME - SAP B1 | Portal";
  const description = "Discover SAS, your ultimate SAP B1 portal. Utilize the portal with ease!";
  const keywords = "SAP B1, Service Layer, Admin dashboard, Portal, web apps, Pixelcare Consulting";

  // Choose layout based on route
  const Layout = Component.Layout ||
    (router.pathname.includes("dashboard")
      ? DefaultDashboardLayout
      : DefaultMarketingLayout);

  // Check if current page is sign-in page
  const isSignInPage = router.pathname === '/sign-in' || router.pathname === '/authentication/sign-in';

  // Loading state management
  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, []);

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
        }}
      />
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <MainLayout showFooter={!isSignInPage}>
            <Layout>
              <Component {...pageProps} setIsLoading={setIsLoading} />
              {!router.pathname.startsWith('/authentication/') && <ActivityTracker />}
              <LoadingOverlay isLoading={isLoading} />
              {process.env.NODE_ENV !== 'production'}
            </Layout>
          </MainLayout>
        </QueryClientProvider>
      </Provider>
    </Fragment>
  );
}

export default MyApp;

// import Head from "next/head";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/router";
// import { NextSeo } from "next-seo";
// import { QueryClient, QueryClientProvider } from 'react-query';
// import { Provider } from "react-redux";
// import { store } from "store/store";
// import { Fragment } from "react";
// import { registerLicense } from "@syncfusion/ej2-base";
// import ActivityTracker from '../components/ActivityTracker';
// import LoadingOverlay from '../components/LoadingOverlay';
// //import SessionDebug from '../components/SessionDebug';

// // Layouts
// import DefaultMarketingLayout from "layouts/marketing/DefaultLayout";
// import DefaultDashboardLayout from "layouts/dashboard/DashboardIndexTop";

// // Styles
// import "../styles/theme.scss";
// import FooterWithSocialIcons from "@/layouts/marketing/footers/FooterWithSocialIcons";
// import 'react-toastify/dist/ReactToastify.css';

// registerLicense(process.env.SYNCFUSION_LICENSE_KEY);

// // Create QueryClient with better defaults
// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       retry: 1,
//       refetchOnWindowFocus: false,
//     }
//   }
// });

// function MyApp({ Component, pageProps }) {
//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState(false);
  
//   const pageURL = process.env.baseURL + router.pathname;
//   const title = "SAS&ME - SAP B1 | Portal";
//   const description = "Discover SAS, your ultimate SAP B1 portal. Utilize the portal with ease!";
//   const keywords = "SAP B1, Service Layer, Admin dashboard, Portal, web apps, Pixelcare Consulting";

//   // Choose layout based on route
//   const Layout = Component.Layout ||
//     (router.pathname.includes("dashboard")
//       ? DefaultDashboardLayout
//       : DefaultMarketingLayout);

//   // Loading state management
//   useEffect(() => {
//     const handleStart = () => setIsLoading(true);
//     const handleComplete = () => setIsLoading(false);

//     router.events.on('routeChangeStart', handleStart);
//     router.events.on('routeChangeComplete', handleComplete);
//     router.events.on('routeChangeError', handleComplete);

//     return () => {
//       router.events.off('routeChangeStart', handleStart);
//       router.events.off('routeChangeComplete', handleComplete);
//       router.events.off('routeChangeError', handleComplete);
//     };
//   }, []);

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
//         }}
//       />
//       <Provider store={store}>
//         <QueryClientProvider client={queryClient}>
//           <Layout>
//             <Component {...pageProps} setIsLoading={setIsLoading} />
//             {!router.pathname.startsWith('/authentication/') && <ActivityTracker />}
//             <LoadingOverlay isLoading={isLoading} />
//             {process.env.NODE_ENV !== 'production'}
//           </Layout>
       
//         </QueryClientProvider>
//       </Provider>
//       <FooterWithSocialIcons/>
//     </Fragment>
//   );
// }

// export default MyApp;

// // // import node module libraries
// // import Head from "next/head";
// // import { useEffect, useState } from "react";
// // import { useRouter } from "next/router";
// // import { NextSeo } from "next-seo";
// // import { QueryClient, QueryClientProvider } from 'react-query'

// // import Cookies from "js-cookie";

// // // import provider and store from redux state management
// // import { Provider } from "react-redux";
// // import { store } from "store/store";

// // // import theme style scss file
// // import "../styles/theme.scss";

// // // import default layouts
// // import DefaultMarketingLayout from "layouts/marketing/DefaultLayout";
// // import DefaultDashboardLayout from "layouts/dashboard/DashboardIndexTop";
// // import { Fragment } from "react";
// // import { ToastContainer } from "react-toastify";

// // import { registerLicense } from "@syncfusion/ej2-base";
// // import ActivityTracker from '../components/ActivityTracker';
// // import LoadingOverlay from '../components/LoadingOverlay';

// // registerLicense(process.env.SYNCFUSION_LICENSE_KEY);

// // // Create a client
// // const queryClient = new QueryClient()

// // function MyApp({ Component, pageProps }) {
// //   const router = useRouter();
// //   const pageURL = process.env.baseURL + router.pathname;
// //   const title = "SAS&ME - SAP B1 | Portal";
// //   const description =
// //     "Discover SAS, your ultimate SAP B1 portal. Utilize the portal with ease!";
// //   const keywords =
// //     "SAP B1, Service Layer, Admin dashboard, Portal, web apps, Pixelcare Consulting";

// //   // Choose layout based on route
// //   const Layout =
// //     Component.Layout ||
// //     (router.pathname.includes("dashboard")
// //       ? DefaultDashboardLayout
// //       : DefaultMarketingLayout);

// //   // Check token for protected routes
// //   useEffect(() => {
// //     const token = Cookies.get("customToken");

// //     // If no token and trying to access any route other than sign-in, redirect to sign-in
// //     if (!token && router.pathname !== "/authentication/sign-in") {
// //       router.push("/authentication/sign-in");
// //     }
// //   }, [router.pathname]); // Trigger on path change

// //   const [isLoading, setIsLoading] = useState(false);

// //   return (
// //     <Fragment>
// //       <Head>
// //         <meta name="viewport" content="width=device-width, initial-scale=1" />
// //         <meta name="keywords" content={keywords} />
// //         <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
// //       </Head>
// //       <NextSeo
// //         title={title}
// //         description={description}
// //         canonical={pageURL}
// //         openGraph={{
// //           url: pageURL,
// //           title: title,
// //           description: description,
// //           site_name: process.env.siteName,
// //         }}
// //       />
// //       <Provider store={store}>
// //         <QueryClientProvider client={queryClient}>
// //           <Layout>
// //             <ToastContainer
// //             position="top-right"
// //             autoClose={5000}
// //             hideProgressBar={false}
// //             newestOnTop
// //             closeOnClick
// //             rtl={false}
// //             pauseOnFocusLoss
// //             draggable
// //             pauseOnHover
// //             theme="light"
// //             />
// //             <ActivityTracker />
// //             <LoadingOverlay isLoading={isLoading} />
// //             <Component {...pageProps} setIsLoading={setIsLoading} />
// //           </Layout>
// //         </QueryClientProvider>
// //       </Provider>
// //     </Fragment>
// //   );
// // }

// // export default MyApp;

