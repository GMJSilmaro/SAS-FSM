import { renewSAPSession } from '@/utils/renewSAPSession';

export default async function handler(req, res) {
  // Set proper headers
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { currentSession, currentRouteId } = req.body;
    console.log('Renewal request received with:', { currentSession, currentRouteId });

    const result = await renewSAPSession(currentSession, currentRouteId);
    
    if (!result) {
      console.error('Session renewal failed - no result returned');
      return res.status(500).json({ 
        message: 'Session renewal failed',
        error: 'No result from renewal attempt'
      });
    }

    console.log('Renewal successful:', result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in renewal endpoint:', error);
    return res.status(500).json({ 
      message: 'Failed to renew SAP B1 session', 
      error: error.message 
    });
  }
}