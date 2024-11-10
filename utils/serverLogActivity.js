import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '../firebase/admin';

// Initialize Firebase Admin
initAdmin();

export async function serverLogActivity(workerId, action, details) {
  try {
    // Clean up details object to remove undefined values
    const cleanDetails = Object.entries(details || {}).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    const db = getFirestore();
    await db.collection('recentActivities').add({
      workerId: workerId || 'SYSTEM',
      action,
      details: cleanDetails,
      timestamp: new Date(),
      type: 'session_management'
    });
    
    console.log('📝 Server activity logged:', { action, details: cleanDetails });
  } catch (error) {
    console.error('❌ Failed to log server activity:', error);
  }
} 