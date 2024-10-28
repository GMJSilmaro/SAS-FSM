import { NextResponse } from 'next/server';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

const COOKIE_OPTIONS = {
  path: '/',
  secure: true,
  sameSite: 'lax',
  maxAge: 30 * 60
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
  return response;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Early return for static files and public assets
  if (
    pathname.includes('/_next') ||
    pathname.includes('/images/') ||
    pathname.includes('/styles/') ||
    pathname.startsWith('/public/') ||
    pathname.match(/\.(?:css|js|json|jpg|jpeg|png|gif|ico|svg|ttf|woff|woff2)$/)
  ) {
    return NextResponse.next();
  }

  console.log('Middleware Check:', {
    path: pathname,
    cookies: request.cookies.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 10) + '...' }))
  });

  const publicPaths = [
    '/authentication/sign-in',
    '/api/login',
    '/api/renewSAPB1Session',
    '/api/logout',
    '/_next',
    '/images',
    '/favicon.ico',
    '/styles',
    '/api',
    '/assets',
    '/fonts'
  ];

  // Check if the current path should bypass middleware
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check for all required cookies
  const b1Session = request.cookies.get('B1SESSION');
  const sessionExpiry = request.cookies.get('B1SESSION_EXPIRY');
  const customToken = request.cookies.get('customToken');
  const uid = request.cookies.get('uid');

  if (!b1Session || !sessionExpiry || !customToken || !uid) {
    console.log('Missing required cookies:', {
      hasB1Session: !!b1Session,
      hasSessionExpiry: !!sessionExpiry,
      hasCustomToken: !!customToken,
      hasUid: !!uid
    });
    return handleSessionError(request);
  }

  // Check session expiry
  const expiryTime = new Date(sessionExpiry.value).getTime();
  if (Date.now() >= expiryTime) {
    console.log('Session expired:', {
      current: new Date(),
      expiry: new Date(expiryTime)
    });
    return handleSessionError(request, new Error('Session expired'));
  }

  // Update last activity and extend cookie expiry times
  const response = NextResponse.next();
  
  // Extend all cookie expiry times
  const currentCookies = request.cookies.getAll();
  currentCookies.forEach(cookie => {
    response.cookies.set(cookie.name, cookie.value, {
      ...COOKIE_OPTIONS,
      httpOnly: ['B1SESSION', 'B1SESSION_EXPIRY', 'customToken'].includes(cookie.name)
    });
  });

  return response;
}

export const config = {
  matcher: [
    // Protected dashboard routes
    '/dashboard/:path*',
    
    // Protected customer routes
    '/dashboard/customers/:path*',
    
    // Protected worker routes
    '/dashboard/workers/:path*',
    '/dashboard/scheduling/workers/:path*',
    
    // Protected job routes
    '/dashboard/jobs/:path*',
    '/dashboard/scheduling/jobs/:path*',
    
    // Protected API routes (excluding auth endpoints)
    '/api/((?!login|renewSAPB1Session|logout).*)',
    
    // Catch-all for any other protected routes
    '/((?!authentication/sign-in|_next/static|_next/image|favicon.ico|images|styles|api/login|api/renewSAPB1Session|api/logout).*)'
  ]
};

// import { NextResponse } from 'next/server';

// const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// // Add new constant for cookie options
// const COOKIE_OPTIONS = {
//   path: '/',
//   secure: true,
//   sameSite: 'lax',
//   maxAge: 30 * 60 // 30 minutes in seconds
// };

// function handleSessionError(request, error = null) {
//   if (request.nextUrl.pathname === '/authentication/sign-in') {
//     return NextResponse.next();
//   }

//   console.log('Session Error:', {
//     error: error?.message,
//     path: request.nextUrl.pathname,
//     cookies: request.cookies.getAll().map(c => c.name)
//   });

//   const response = NextResponse.redirect(new URL('/authentication/sign-in', request.url));
//   return response;
// }

// export async function middleware(request) {
//   // Add debug logging
//   console.log('Middleware Check:', {
//     path: request.nextUrl.pathname,
//     cookies: request.cookies.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 10) + '...' }))
//   });

//   const publicPaths = [
//     '/authentication/sign-in',
//     '/api/login',
//     '/api/renewSAPB1Session',
//     '/api/logout',
//     '/_next',
//     '/images',
//     '/favicon.ico',
//     '/styles',
//     '/api',
//     '/_next/static',
//     '/_next/image',
//     '/_next/media',
//     '/public' 
// ];

//   // Check if the current path should bypass middleware
//   const isPublicPath = publicPaths.some(path => 
//     request.nextUrl.pathname.startsWith(path)
//   );

//   if (isPublicPath) {
//     return NextResponse.next();
//   }

//   // Check for all required cookies
//   const b1Session = request.cookies.get('B1SESSION');
//   const sessionExpiry = request.cookies.get('B1SESSION_EXPIRY');
//   const customToken = request.cookies.get('customToken');
//   const uid = request.cookies.get('uid');

//   if (!b1Session || !sessionExpiry || !customToken || !uid) {
//     console.log('Missing required cookies:', {
//       hasB1Session: !!b1Session,
//       hasSessionExpiry: !!sessionExpiry,
//       hasCustomToken: !!customToken,
//       hasUid: !!uid
//     });
//     return handleSessionError(request);
//   }

//   // Check session expiry
//   const expiryTime = new Date(sessionExpiry.value).getTime();
//   if (Date.now() >= expiryTime) {
//     console.log('Session expired:', {
//       current: new Date(),
//       expiry: new Date(expiryTime)
//     });
//     return handleSessionError(request, new Error('Session expired'));
//   }

//   // Update last activity and extend cookie expiry times
//   const response = NextResponse.next();
  
//   // Extend all cookie expiry times
//   const currentCookies = request.cookies.getAll();
//   currentCookies.forEach(cookie => {
//     response.cookies.set(cookie.name, cookie.value, {
//       ...COOKIE_OPTIONS,
//       httpOnly: ['B1SESSION', 'B1SESSION_EXPIRY', 'customToken'].includes(cookie.name)
//     });
//   });

//   return response;
// }

// export const config = {
//   matcher: [
//     // Match all paths except those that start with:
//     '/((?!_next/static|_next/image|_next/media|favicon.ico|images|styles|authentication/sign-in).*)',
//     '/api/((?!login|renewSAPB1Session|logout).*)'
//   ]
// };
