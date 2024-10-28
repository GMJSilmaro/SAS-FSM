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

  // Immediately allow static files and public assets
  if (isStaticPath(pathname)) {
    return NextResponse.next();
  }

  // Allow authentication routes
  if (pathname.startsWith('/authentication') || 
      pathname.startsWith('/api/login') ||
      pathname.startsWith('/api/renewSAPB1Session') ||
      pathname.startsWith('/api/logout')) {
    return NextResponse.next();
  }

  // Check session cookies
  const b1Session = request.cookies.get('B1SESSION');
  const sessionExpiry = request.cookies.get('B1SESSION_EXPIRY');
  const customToken = request.cookies.get('customToken');
  const uid = request.cookies.get('uid');

  if (!b1Session || !sessionExpiry || !customToken || !uid) {
    return handleSessionError(request);
  }

  // Check session expiry
  const expiryTime = new Date(sessionExpiry.value).getTime();
  if (Date.now() >= expiryTime) {
    return handleSessionError(request, new Error('Session expired'));
  }

  // Allow the request and extend cookie expiry
  const response = NextResponse.next();
  
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
    // Only match specific routes that need protection
    '/dashboard/:path*',
    '/api/:path*',
    
    // Exclude static files and auth routes
    '/((?!_next/static|_next/image|_next/media|favicon.ico|images|styles|fonts|assets|authentication/sign-in|api/login|api/renewSAPB1Session|api/logout).*)'
  ]
};