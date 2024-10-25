// import node module libraries
import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { NextSeo } from "next-seo";

import Cookies from "js-cookie";

// import provider and store from redux state management
import { Provider } from "react-redux";
import { store } from "store/store";

// import theme style scss file
import "../styles/theme.scss";

// import default layouts
import DefaultMarketingLayout from "layouts/marketing/DefaultLayout";
import DefaultDashboardLayout from "layouts/dashboard/DashboardIndexTop";
import { Fragment } from "react";
import { ToastContainer } from "react-toastify";

import { registerLicense } from "@syncfusion/ej2-base";
import ActivityTracker from '../components/ActivityTracker';

registerLicense(process.env.SYNCFUSION_LICENSE_KEY);

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const pageURL = process.env.baseURL + router.pathname;
  const title = "SAS - SAP B1 Portal";
  const description =
    "Discover SAS, your ultimate SAP B1 portal. Utilize the portal with ease!";
  const keywords =
    "SAP B1, Service Layer, Admin dashboard, Portal, web apps, Pixelcare Consulting";

  // Choose layout based on route
  const Layout =
    Component.Layout ||
    (router.pathname.includes("dashboard")
      ? DefaultDashboardLayout
      : DefaultMarketingLayout);

  // Check token for protected routes
  useEffect(() => {
    const token = Cookies.get("customToken");

    // If no token and trying to access any route other than sign-in, redirect to sign-in
    if (!token && router.pathname !== "/authentication/sign-in") {
      router.push("/authentication/sign-in");
    }
  }, [router.pathname]); // Trigger on path change

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
        <Layout>
          <ToastContainer />
          <ActivityTracker />
          <Component {...pageProps} />
        </Layout>
      </Provider>
    </Fragment>
  );
}

export default MyApp;
