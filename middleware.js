import { NextResponse } from 'next/server';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Add new constant for cookie options
const COOKIE_OPTIONS = {
  path: '/',
  secure: true,
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
  return response;
}

export async function middleware(request) {
  // Add debug logging
  console.log('Middleware Check:', {
    path: request.nextUrl.pathname,
    cookies: request.cookies.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 10) + '...' }))
  });

  const publicPaths = [
    '/authentication/sign-in',
    '/api/login',
    '/api/renewSAPB1Session',
    '/api/logout',
    '/_next',
    '/images',
    '/favicon.ico'
  ];

  // Check if the current path should bypass middleware
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
    '/((?!authentication/sign-in|_next/static|_next/image|favicon.ico|images).*)',
    '/api/((?!login|renewSAPB1Session|logout).*)'
  ]
};
