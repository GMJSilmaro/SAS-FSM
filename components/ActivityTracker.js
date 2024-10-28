// middleware.js
import { NextResponse } from 'next/server';

const COOKIE_OPTIONS = {
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 30 * 60 // 30 minutes in seconds
};

function handleSessionError(request, error = null) {
  if (request.nextUrl.pathname === '/authentication/sign-in') {
    return NextResponse.next();
  }

  console.log('Session Error:', {
    error: error?.message,
    path: request.nextUrl.pathname,
    cookies: request.cookies.getAll().map(c => c.name)
  });

  const response = NextResponse.redirect(new URL('/authentication/sign-in', request.url));
  
  // Clear all auth cookies on session error
  ['B1SESSION', 'B1SESSION_EXPIRY', 'customToken', 'uid'].forEach(cookieName => {
    response.cookies.delete(cookieName);
  });
  
  return response;
}

export async function middleware(request) {
  const publicPaths = [
    '/authentication/sign-in',
    '/api/login',
    '/api/renewSAPB1Session',
    '/api/logout',
    '/_next',
    '/images',
    '/favicon.ico'
  ];

  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check for all required cookies
  const b1Session = request.cookies.get('B1SESSION');
  const sessionExpiry = request.cookies.get('B1SESSION_EXPIRY');
  const customToken = request.cookies.get('customToken');
  const uid = request.cookies.get('uid');

  if (!b1Session || !sessionExpiry || !customToken || !uid) {
    return handleSessionError(request);
  }

  try {
    // Check session expiry with a 5-minute buffer
    const expiryTime = new Date(sessionExpiry.value).getTime();
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (currentTime >= expiryTime - fiveMinutes) {
      // Attempt to renew session
      const renewResponse = await fetch(`${request.nextUrl.origin}/api/renewSAPB1Session`, {
        method: 'POST',
        headers: {
          'Cookie': request.headers.get('cookie'),
          'Content-Type': 'application/json',
        },
      });

      if (!renewResponse.ok) {
        throw new Error('Failed to renew session');
      }

      const response = NextResponse.next();
      
      // Copy renewed session cookies from the renewal response
      const newCookies = renewResponse.headers.getSetCookie();
      newCookies.forEach(cookie => {
        response.headers.append('Set-Cookie', cookie);
      });

      return response;
    }

    // Update cookie expiry times
    const response = NextResponse.next();
    const cookies = request.cookies.getAll();
    cookies.forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value, {
        ...COOKIE_OPTIONS,
        httpOnly: ['B1SESSION', 'B1SESSION_EXPIRY', 'customToken'].includes(cookie.name)
      });
    });

    return response;
  } catch (error) {
    return handleSessionError(request, error);
  }
}

export const config = {
  matcher: [
    '/((?!authentication/sign-in|_next/static|_next/image|favicon.ico|images).*)',
    '/api/((?!login|renewSAPB1Session|logout).*)'
  ]
};

// ActivityTracker.js
import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';

const ActivityTracker = () => {
  const router = useRouter();

  const isPublicPath = useCallback(() => {
    const publicPaths = [
      '/authentication/sign-in',
      '/api/login',
      '/api/renewSAPB1Session',
      '/api/logout'
    ];
    return publicPaths.some(path => router.pathname.startsWith(path));
  }, [router.pathname]);

  const checkSession = useCallback(async () => {
    if (isPublicPath()) return true;

    const requiredCookies = ['B1SESSION', 'B1SESSION_EXPIRY', 'customToken', 'uid'];
    const missingCookies = requiredCookies.filter(name => !Cookies.get(name));
    
    if (missingCookies.length > 0) {
      return false;
    }

    const sessionExpiry = Cookies.get('B1SESSION_EXPIRY');
    if (!sessionExpiry) return false;

    const expiryTime = new Date(sessionExpiry).getTime();
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (currentTime >= expiryTime - fiveMinutes) {
      try {
        const response = await fetch('/api/renewSAPB1Session', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error('Session renewal failed');
        }

        return true;
      } catch (error) {
        console.error('Session renewal failed:', error);
        return false;
      }
    }

    return true;
  }, [isPublicPath]);

  useEffect(() => {
    let checkTimer;

    const runSessionCheck = async () => {
      const isValid = await checkSession();
      if (!isValid && !isPublicPath()) {
        router.push('/authentication/sign-in');
      }
    };

    if (!isPublicPath()) {
      runSessionCheck();
      checkTimer = setInterval(runSessionCheck, 60 * 1000);
    }

    return () => {
      if (checkTimer) clearInterval(checkTimer);
    };
  }, [router, checkSession, isPublicPath]);

  return null;
};

export default ActivityTracker;

// import { useEffect, useCallback, useRef } from 'react';
// import { useRouter } from 'next/router';
// import { toast } from 'react-toastify';
// import Cookies from 'js-cookie';

// const ActivityTracker = () => {
//   const router = useRouter();
//   const renewalInProgress = useRef(false);
//   const lastRenewalTime = useRef(0);
//   const CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes

//   const checkAndRenewSession = useCallback(async () => {
//     // Prevent concurrent renewals
//     if (renewalInProgress.current) return;
    
//     const now = Date.now();
//     if (now - lastRenewalTime.current < CHECK_INTERVAL) return;

//     try {
//       // Check if session is close to expiry
//       const expiryTime = new Date(Cookies.get('B1SESSION_EXPIRY')).getTime();
//       const timeUntilExpiry = expiryTime - now;
//       const fiveMinutes = 5 * 60 * 1000;
      
//       if (timeUntilExpiry <= fiveMinutes && timeUntilExpiry > 0) {
//         renewalInProgress.current = true;
//         lastRenewalTime.current = now;

//         const response = await fetch('/api/renewSAPB1Session', {
//           method: 'POST',
//           credentials: 'include',
//           headers: {
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify({
//             currentSession: Cookies.get('B1SESSION'),
//             currentRouteId: Cookies.get('ROUTEID')
//           })
//         });

//         if (!response.ok) {
//           throw new Error('Session renewal failed');
//         }

//         // Session renewed successfully
//         console.log('Session renewed successfully');
//       }
//     } catch (error) {
//       console.error('Session renewal error:', error);
//       toast.error('Session expired. Please login again.');
//       router.push('/authentication/sign-in');
//     } finally {
//       renewalInProgress.current = false;
//     }
//   }, [router]);

//   // Check on mount and interval
//   useEffect(() => {
//     checkAndRenewSession();
//     const intervalId = setInterval(checkAndRenewSession, CHECK_INTERVAL);
//     return () => clearInterval(intervalId);
//   }, [checkAndRenewSession]);

//   // Check on tab focus
//   useEffect(() => {
//     const handleVisibilityChange = () => {
//       if (document.visibilityState === 'visible') {
//         checkAndRenewSession();
//       }
//     };

//     document.addEventListener('visibilitychange', handleVisibilityChange);
//     return () => {
//       document.removeEventListener('visibilitychange', handleVisibilityChange);
//     };
//   }, [checkAndRenewSession]);

//   return null;
// };

// export default ActivityTracker;