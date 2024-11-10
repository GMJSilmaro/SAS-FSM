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
import { SettingsProvider } from '../contexts/SettingsContext';
import { Toaster } from 'react-hot-toast';
import { LogoProvider } from '../contexts/LogoContext';
import { AuthProvider } from '../contexts/AuthContext';
//import SessionDebug from '../components/SessionDebug';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

// Layouts
import DefaultMarketingLayout from "layouts/marketing/DefaultLayout";
import DefaultDashboardLayout from "layouts/dashboard/DashboardIndexTop";
import MainLayout from "@/layouts/MainLayout";

// Styles
import "../styles/theme.scss";
import FooterWithSocialIcons from "@/layouts/marketing/footers/FooterWithSocialIcons";


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

  const searchParams = useSearchParams();
  
  useEffect(() => {
    const toastMessage = searchParams.get('toast');
    if (toastMessage) {
      toast.error(toastMessage, {
        duration: 5000, // 5 seconds
        style: {
          background: '#fff',
          color: 'red',
          padding: '16px',
          borderLeft: '6px solid red',
          borderRadius: '4px'
        }
      });
    }
  }, [searchParams]);

  return (
    <AuthProvider>
      <LogoProvider>
        <SettingsProvider>
          <Fragment>
            <Head>
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <meta name="keywords" content={keywords} />
  
              {/* Enhanced Favicon Configuration */}
              <link rel="icon" type="image/x-icon" href="/favicon.ico" />
              <meta name="msapplication-TileColor" content="#da532c" />
              <meta name="theme-color" content="#ffffff" />
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
            <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
        }}
      />
          </Fragment>
        </SettingsProvider>
      </LogoProvider>
    </AuthProvider>
  );
}

export default MyApp;

