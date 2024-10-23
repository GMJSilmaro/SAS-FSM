import { renewSAPSession } from '@/utils/renewSAPSession';

export default async function handler(req, res) {
  // Ensure this endpoint only accepts POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Set JSON content type
  res.setHeader('Content-Type', 'application/json');

  try {
    // Log incoming request
    console.log('Renewal request received:', {
      method: req.method,
      body: req.body,
      cookies: req.cookies
    });

    const { currentSession, currentRouteId } = req.body;

    if (!currentSession) {
      return res.status(400).json({
        message: 'Current session is required'
      });
    }

    const result = await renewSAPSession(currentSession, currentRouteId);

    if (!result) {
      return res.status(500).json({
        message: 'Failed to renew SAP B1 session'
      });
    }

    // Log successful renewal
    console.log('Session renewed successfully:', {
      newSession: result.newB1Session,
      expiryTime: result.newExpiryTime
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in renewal endpoint:', error);
    return res.status(500).json({
      message: 'Failed to renew SAP B1 session',
      error: error.message
    });
  }
}