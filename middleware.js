import { NextResponse } from 'next/server';

export async function middleware(request) {
  // Check if the request is for an API route (excluding login)
  if (request.nextUrl.pathname.startsWith('/api') && !request.nextUrl.pathname.startsWith('/api/login')) {
    const response = NextResponse.next();

    // Get the current B1SESSION and B1SESSION_EXPIRY cookies
    const b1Session = request.cookies.get('B1SESSION');
    const sessionExpiry = request.cookies.get('B1SESSION_EXPIRY');

    if (!b1Session || !sessionExpiry) {
      // If there's no session or expiry info, redirect to login
      return NextResponse.redirect(new URL('/authentication/sign-in', request.url));
    }

    const currentTime = Date.now();
    const expiryTime = new Date(sessionExpiry.value).getTime();
    const timeUntilExpiry = expiryTime - currentTime;
    const fiveMinutesInMilliseconds = 5 * 60 * 1000;

    // Check if the session will expire in the next 5 minutes
    if (timeUntilExpiry <= fiveMinutesInMilliseconds) {
      try {
        // Attempt to renew session
        const loginResponse = await fetch(`${process.env.SAP_SERVICE_LAYER_BASE_URL}Login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            CompanyDB: process.env.SAP_B1_COMPANY_DB,
            UserName: process.env.SAP_B1_USERNAME,
            Password: process.env.SAP_B1_PASSWORD,
          }),
        });

        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          const newSessionId = loginData.SessionId;
          const newExpiryTime = new Date(Date.now() + 30 * 60 * 1000); // Assuming session expires in 30 mins

          // Set the new session cookies
          response.cookies.set('B1SESSION', newSessionId, { 
            httpOnly: true, 
            secure: true, 
            sameSite: 'none' 
          });
          response.cookies.set('B1SESSION_EXPIRY', newExpiryTime.toISOString(), { 
            httpOnly: true, 
            secure: true, 
            sameSite: 'none' 
          });
          response.cookies.set('ROUTEID', '.node4', { 
            secure: true, 
            sameSite: 'none' 
          });
        } else {
          // If login fails, redirect to sign-in page
          return NextResponse.redirect(new URL('/authentication/sign-in', request.url));
        }
      } catch (error) {
        console.error('Error renewing SAP B1 session:', error);
        return NextResponse.redirect(new URL('/authentication/sign-in', request.url));
      }
    }

    // Check if the session is still valid using fetch
    try {
      const sessionCheckResponse = await fetch(`${process.env.SAP_SERVICE_LAYER_BASE_URL}Users('${process.env.SAP_B1_USERNAME}')`, {
        headers: {
          'Cookie': `B1SESSION=${b1Session.value}`,
        },
      });

      if (sessionCheckResponse.status === 401) {
        // If session is invalid, redirect to login
        return NextResponse.redirect(new URL('/authentication/sign-in', request.url));
      }
    } catch (error) {
      console.error('Error checking SAP B1 session:', error);
      // In case of any error, proceed with the request
      return response;
    }

    // Return response if session is valid
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};