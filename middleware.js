import { NextResponse } from 'next/server';

export async function middleware(request) {
  // Skip the renewal endpoint itself to prevent loops
  if (request.nextUrl.pathname === '/api/renewSAPB1Session') {
    return NextResponse.next();
  }

  // Only check API routes that aren't login or renewal
  if (request.nextUrl.pathname.startsWith('/api') && 
      !request.nextUrl.pathname.startsWith('/api/login')) {
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
        const baseUrl = request.nextUrl.origin;
        
        // Make the renewal request
        const renewalResponse = await fetch(`${baseUrl}/api/renewSAPB1Session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            currentSession: b1Session.value,
            currentRouteId: routeId?.value
          })
        });

        // Check if we actually got a JSON response
        const contentType = renewalResponse.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          console.error('Received non-JSON response');
          return NextResponse.redirect(new URL('/authentication/sign-in', request.url));
        }

        const renewalData = await renewalResponse.json();

        if (!renewalData.newB1Session) {
          console.error('Invalid renewal data received:', renewalData);
          return NextResponse.redirect(new URL('/authentication/sign-in', request.url));
        }

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

        if (renewalData.newRouteId) {
          nextResponse.cookies.set('ROUTEID', renewalData.newRouteId, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/'
          });
        }

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
  matcher: [
    // Match all API routes except specific ones
    '/api/((?!renewSAPB1Session|login).)*',
    // Match all other routes except static files and auth pages
    '/((?!_next/static|_next/image|favicon.ico|authentication/sign-in).*)'
  ]
};