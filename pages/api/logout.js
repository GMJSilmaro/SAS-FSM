import { getAuth } from 'firebase/auth';
import { app } from '../../firebase';
import { serverLogActivity } from '../../utils/serverLogActivity';

const COOKIE_OPTIONS = {
  path: '/',
  secure: true,
  sameSite: 'lax',
  httpOnly: true,
  expires: new Date(0)
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const auth = getAuth(app);
  const workerId = req.cookies.workerId;

  try {
    // Log the start of logout process
    await serverLogActivity(workerId, 'LOGOUT_INITIATED', {
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    });

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

        // Log successful SAP B1 logout
        await serverLogActivity(workerId, 'SAP_B1_LOGOUT_SUCCESS', {
          timestamp: new Date().toISOString(),
          sessionId: b1Session.substring(0, 8) + '...' // Log only part of the session ID for security
        });
      } catch (error) {
        console.warn('Failed to invalidate SAP B1 session:', error);
        // Log SAP B1 logout failure
        await serverLogActivity(workerId, 'SAP_B1_LOGOUT_FAILED', {
          timestamp: new Date().toISOString(),
          error: error.message
        });
      }
    }

    // Log successful logout
    await serverLogActivity(workerId, 'LOGOUT_SUCCESS', {
      timestamp: new Date().toISOString(),
      clearedCookies: cookiesToClear
    });

    return res.status(200).json({ 
      message: 'Logout successful',
      cleared: cookiesToClear
    });
  } catch (error) {
    console.error('Logout error:', error);
    
    // Log logout failure
    await serverLogActivity(workerId, 'LOGOUT_FAILED', {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    });
    
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
