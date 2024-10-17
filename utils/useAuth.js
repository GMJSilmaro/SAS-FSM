// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/router';
// import Cookies from 'js-cookie'; 
// import Swal from 'sweetalert2';

// const useAuth = () => {
//   const router = useRouter();
//   const [authenticated, setAuthenticated] = useState(false);

//   useEffect(() => {
//     const checkAuthentication = async () => {
//       try {
//         // Log all available cookies
//         console.log('All available cookies:', Cookies.get());

//         // Retrieve the SAP B1 session cookie
//         const sessionId = Cookies.get('B1SESSION');
//         console.log('B1SESSION cookie:', sessionId);

//         if (!sessionId) {
//           throw new Error('SAP B1 Service Layer session not found');
//         }

//         // If the session ID exists, consider the user authenticated
//         setAuthenticated(true);
//         console.log('Authenticated with Service Layer');
//       } catch (error) {
//         console.error('Authentication error:', error);
//         console.log('Redirecting to sign-in page');
//         router.push('/authentication/sign-in');
//       }
//     };

//     if (!authenticated) {
//       checkAuthentication();
//     }
//   }, [router, authenticated]);

//   const signOutUser = () => {
//     // Clear the Service Layer session and redirect to login page
//     Cookies.remove('B1SESSION');
//     Cookies.remove('ROUTEID');
//     router.push('/authentication/sign-in');
//   };

//   return authenticated;
// };

// export default useAuth;
