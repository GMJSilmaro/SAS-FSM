import { renewSAPSession } from '@/utils/renewSAPSession';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { currentSession, currentRouteId } = req.body;
    const result = await renewSAPSession(currentSession, currentRouteId);

    if (!result) {
      throw new Error('Failed to renew session');
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error renewing SAP B1 session:', error);
    res.status(500).json({ 
      message: 'Failed to renew SAP B1 session', 
      error: error.message 
    });
  }
}