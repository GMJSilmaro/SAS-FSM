import { NextResponse } from 'next/server';
import { renewSAPSession } from './utils/renewSAPSession';

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
        // Renew the SAP B1 session using fetch
        const renewalResult = await renewSAPSession(b1Session.value, routeId?.value);
        
        if (renewalResult) {
          const response = NextResponse.next();
          response.cookies.set('B1SESSION', renewalResult.newB1Session, { 
            httpOnly: true, 
            secure: true, 
            sameSite: 'none' 
          });
          response.cookies.set('B1SESSION_EXPIRY', renewalResult.newExpiryTime, { 
            httpOnly: true, 
            secure: true, 
            sameSite: 'none' 
          });
          if (renewalResult.newRouteId) {
            response.cookies.set('ROUTEID', renewalResult.newRouteId, { 
              httpOnly: true, 
              secure: true, 
              sameSite: 'none' 
            });
          }
          return response;
        } else {
          // If renewal fails, redirect to sign-in
          console.error('SAP B1 session renewal failed');
          return NextResponse.redirect(new URL('/authentication/sign-in', request.url));
        }
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
