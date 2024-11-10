import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '../../firebase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { uid } = req.cookies;
    
    if (!uid) {
      return res.status(401).json({ message: 'Unauthorized - No UID found' });
    }

    const db = getFirestore(app);
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '==', uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = querySnapshot.docs[0].data();
    
    return res.status(200).json({
      success: true,
      user: {
        email: userData.email,
        workerId: userData.workerId,
        role: userData.role,
        name: userData.fullName
      }
    });

  } catch (error) {
    console.error('Error fetching user info:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 