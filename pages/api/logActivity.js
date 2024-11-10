import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '../../firebase/admin';

// Initialize Firebase Admin if not already initialized
initAdmin();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { workerId, action, details } = req.body;
    
    const db = getFirestore();
    await db.collection('recentActivities').add({
      workerId,
      action,
      details,
      timestamp: new Date(),
      type: 'session_management'
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Logging error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
} 