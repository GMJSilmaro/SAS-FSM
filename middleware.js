import { NextResponse } from 'next/server';

export async function middleware(request) {
  if (request.nextUrl.pathname.startsWith('/api') && !request.nextUrl.pathname.startsWith('/api/login')) {
    const b1Session = request.cookies.get('B1SESSION');
    const sessionExpiry = request.cookies.get('B1SESSION_EXPIRY');
    const routeId = request.cookies.get('ROUTEID');

    if (!b1Session || !sessionExpiry) {
      return NextResponse.redirect(new URL('/authentication/sign-in', request.url));
    }

    const currentTime = Date.now();
    const expiryTime = new Date(sessionExpiry.value).getTime();
    const timeUntilExpiry = expiryTime - currentTime;
    const fiveMinutesInMilliseconds = 5 * 60 * 1000;

    if (timeUntilExpiry <= fiveMinutesInMilliseconds) {
      try {
        // Call your renewal API with current session info
        const baseUrl = request.nextUrl.origin;
        const response = await fetch(`${baseUrl}/api/renewSAPB1Session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            currentSession: b1Session.value,
            currentRouteId: routeId?.value
          })
        });

        if (!response.ok) {
          throw new Error('Session renewal failed');
        }

        const renewalData = await response.json();

        // Create response with new cookies
        const nextResponse = NextResponse.next();

        nextResponse.cookies.set('B1SESSION', renewalData.newB1Session, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          path: '/'
        });

        nextResponse.cookies.set('B1SESSION_EXPIRY', renewalData.newExpiryTime, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          path: '/'
        });

        nextResponse.cookies.set('ROUTEID', renewalData.newRouteId || '.node4', {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          path: '/'
        });

        return nextResponse;
      } catch (error) {
        console.error('Error during SAP B1 session renewal:', error);
        return NextResponse.redirect(new URL('/authentication/sign-in', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};

