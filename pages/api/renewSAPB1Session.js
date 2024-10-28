// /api/renewSAPB1Session.js
import { renewSAPSession } from '@/utils/renewSAPSession';

export default async function handler(req, res) {
  console.log('Renewal request received');
  
  // Ensure this endpoint only accepts POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  try {
    const { currentSession, currentRouteId } = req.body;
    console.log('Current session:', { currentSession, currentRouteId });

    if (!currentSession) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    const result = await renewSAPSession(currentSession, currentRouteId);
    console.log('Renewal result:', result);

    if (!result || !result.newB1Session) {
      throw new Error('Session renewal failed');
    }

    // Set new cookies with explicit options
    const expiryTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    const maxAge = 30 * 60; // 30 minutes in seconds

    const cookies = [
      `B1SESSION=${result.newB1Session}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`,
      `B1SESSION_EXPIRY=${expiryTime.toISOString()}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`,
      `LAST_ACTIVITY=${Date.now()}; Path=/; Secure; SameSite=Lax; Max-Age=${maxAge}`
    ];

    console.log('Setting cookies:', cookies);
    res.setHeader('Set-Cookie', cookies);

    return res.status(200).json({
      success: true,
      newB1Session: result.newB1Session,
      newExpiryTime: expiryTime.toISOString()
    });

  } catch (error) {
    console.error('Error in renewal endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to renew SAP B1 session',
      error: error.message
    });
  }
}

// import { renewSAPSession } from '@/utils/renewSAPSession';

// export default async function handler(req, res) {
//   // Ensure this endpoint only accepts POST requests
//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }

//   // Set JSON content type
//   res.setHeader('Content-Type', 'application/json');

//   try {
//     // Log incoming request
//     console.log('Renewal request received:', {
//       method: req.method,
//       body: req.body,
//       cookies: req.cookies
//     });

//     const { currentSession, currentRouteId } = req.body;

//     if (!currentSession) {
//       return res.status(400).json({
//         message: 'Current session is required'
//       });
//     }

//     const result = await renewSAPSession(currentSession, currentRouteId);

//     if (!result) {
//       return res.status(500).json({
//         message: 'Failed to renew SAP B1 session'
//       });
//     }

//     // Log successful renewal
//     console.log('Session renewed successfully:', {
//       newSession: result.newB1Session,
//       expiryTime: result.newExpiryTime
//     });

//     return res.status(200).json(result);
//   } catch (error) {
//     console.error('Error in renewal endpoint:', error);
//     return res.status(500).json({
//       message: 'Failed to renew SAP B1 session',
//       error: error.message
//     });
//   }
// }
