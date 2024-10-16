import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie'; 
import Swal from 'sweetalert2';

const useAuth = () => {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Retrieve authentication data from cookies
        const uid = Cookies.get('uid');
        const workerId = Cookies.get('workerId');
        const isAdmin = Cookies.get('isAdmin');
        const customToken = Cookies.get('customToken'); // Check for customToken

        // Check if authentication data exists
        if (!uid || !workerId || isAdmin === undefined || !customToken) {
          throw new Error('Authentication data not found in cookies');
        }

        // Set authenticated flag to true
        setAuthenticated(true);
        console.log('Authenticated');

        // Set a 30-minute timer for automatic sign-out
        const sessionTimeout = 30 * 60 * 1000; // 30 minutes in milliseconds
        const timer = setTimeout(() => {
          console.log('Session expired. Logging out.');
          Swal.fire({
            title: 'Session Expired',
            text: 'Your session has expired. You will be logged out.',
            icon: 'warning',
            confirmButtonText: 'OK',
          }).then(() => {
            signOutUser();
          });
        }, sessionTimeout);

        // Clean up the timer on unmount
        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Authentication error:', error);
        console.log('Redirecting to sign-in page');
        router.push('/authentication/sign-in');
      }
    };

    if (!authenticated) {
      checkAuthentication();
    }
  }, [router, authenticated]); // Include router and authenticated in dependency array

  const signOutUser = () => {
    // Clear session cookies
    Cookies.remove('B1SESSION');
    Cookies.remove('ROUTEID');
    Cookies.remove('uid');
    Cookies.remove('workerId');
    Cookies.remove('isAdmin');
    Cookies.remove('customToken'); // Remove customToken

    // Redirect to sign-in page or perform any other sign-out actions
    router.push('/authentication/sign-in');
  };

  return authenticated;
};

export default useAuth;


