import { NextResponse } from 'next/server';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function middleware(request) {
  // Skip the renewal endpoint itself to prevent loops
  if (request.nextUrl.pathname === '/api/renewSAPB1Session') {
    return NextResponse.next();
  }

  // Check for inactivity
  const lastActivity = request.cookies.get('LAST_ACTIVITY');
  const currentTime = Date.now();

  if (lastActivity) {
    const inactiveTime = currentTime - parseInt(lastActivity.value);
    if (inactiveTime > INACTIVITY_TIMEOUT) {
      // User has been inactive, log them out
      const response = NextResponse.redirect(new URL('/authentication/sign-in', request.url));
      response.cookies.delete('B1SESSION');
      response.cookies.delete('B1SESSION_EXPIRY');
      response.cookies.delete('ROUTEID');
      response.cookies.delete('LAST_ACTIVITY');
      return response;
    }
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

        // Update last activity time
        nextResponse.cookies.set('LAST_ACTIVITY', currentTime.toString(), {
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

  // Update last activity time for non-API routes
  const response = NextResponse.next();
  response.cookies.set('LAST_ACTIVITY', currentTime.toString(), {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/'
  });

  return response;
}

export const config = {
  matcher: [
    // Match all API routes except specific ones
    '/api/((?!renewSAPB1Session|login).)*',
    // Match all other routes except static files and auth pages
    '/((?!_next/static|_next/image|favicon.ico|authentication/sign-in).*)'
  ]
};