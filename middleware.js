import { NextResponse } from 'next/server';

// Helper function to check if a path is static
function isStaticPath(pathname) {
  return (
    pathname.startsWith('/_next') ||
    pathname.includes('/static/') ||
    pathname.includes('/images/') ||
    pathname.includes('/fonts/') ||
    pathname.includes('/assets/') ||
    pathname.includes('/media/') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ttf') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2')
  );
}

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static paths
  if (isStaticPath(pathname) || 
      pathname === '/sign-in' ||
      pathname.startsWith('/api/') ||
      pathname === '/') {
    return NextResponse.next();
  }

  // If trying to access /authentication/sign-in, redirect to /sign-in
  if (pathname === '/authentication/sign-in') {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // Check essential cookies
  const essentialCookies = [
    'B1SESSION',
    'B1SESSION_EXPIRY',
    'uid',
    'workerId'
  ];

  const missingCookies = essentialCookies.filter(
    cookieName => !request.cookies.get(cookieName)?.value
  );

  if (missingCookies.length > 0) {
    console.log('Missing essential cookies:', missingCookies);
    // Clear all cookies before redirecting
    const response = NextResponse.redirect(new URL('/sign-in', request.url));
    essentialCookies.forEach(cookieName => {
      response.cookies.delete(cookieName);
    });
    return response;
  }

  // Check session expiry
  const expiryTime = new Date(request.cookies.get('B1SESSION_EXPIRY').value).getTime();
  
  if (Date.now() >= expiryTime) {
    console.log('Session expired, redirecting to login');
    // Clear all cookies before redirecting
    const response = NextResponse.redirect(new URL('/sign-in', request.url));
    essentialCookies.forEach(cookieName => {
      response.cookies.delete(cookieName);
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};