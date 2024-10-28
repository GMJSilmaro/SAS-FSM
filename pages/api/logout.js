import { getAuth } from 'firebase/auth';
import { app } from '../../firebase';

const COOKIE_OPTIONS = {
  path: '/',
  secure: true,
  sameSite: 'lax',
  httpOnly: true,
  expires: new Date(0) // Set to epoch time to expire immediately
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const auth = getAuth(app);

  try {
    // Sign out from Firebase
    await auth.signOut();

    // List of all cookies to clear
    const cookiesToClear = [
      'B1SESSION',
      'B1SESSION_EXPIRY',
      'ROUTEID',
      'LAST_ACTIVITY',
      'customToken',
      'email',
      'isAdmin',
      'uid',
      'workerId'
    ];

    // Clear all cookies with consistent options
    const cookieStrings = cookiesToClear.map(cookieName => {
      const options = {
        ...COOKIE_OPTIONS,
        // Only set httpOnly for sensitive cookies
        httpOnly: ['B1SESSION', 'B1SESSION_EXPIRY', 'customToken'].includes(cookieName)
      };

      return `${cookieName}=; Path=/; ${options.httpOnly ? 'HttpOnly;' : ''} Secure; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });

    res.setHeader('Set-Cookie', cookieStrings);

    // Try to invalidate SAP B1 session if needed
    const b1Session = req.cookies.B1SESSION;
    if (b1Session) {
      try {
        await fetch(`${process.env.SAP_SERVICE_LAYER_BASE_URL}Logout`, {
          method: 'POST',
          headers: {
            'Cookie': `B1SESSION=${b1Session}`
          }
        });
      } catch (error) {
        console.warn('Failed to invalidate SAP B1 session:', error);
        // Continue with logout even if session invalidation fails
      }
    }

    return res.status(200).json({ 
      message: 'Logout successful',
      cleared: cookiesToClear
    });
  } catch (error) {
    console.error('Logout error:', error);
    
    // Attempt to clear cookies even if logout fails
    const emergencyCookieClear = [
      'customToken=; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'B1SESSION=; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    ];
    res.setHeader('Set-Cookie', emergencyCookieClear);

    return res.status(500).json({ 
      message: 'Partial logout completed with errors', 
      error: error.message 
    });
  }
}
