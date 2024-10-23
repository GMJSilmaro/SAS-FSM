import { getAuth } from 'firebase/auth';
import { app } from '../../firebase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const auth = getAuth(app);

  try {
    // Sign out from Firebase
    await auth.signOut();

    // Clear all authentication and session cookies
    res.setHeader('Set-Cookie', [
      // Clear Firebase auth cookie
      `customToken=; Path=/; Domain=localhost; HttpOnly; Secure; SameSite=Non; Max-Age=0`,
      
      // Clear session cookies
      `email=; Path=/Session; Domain=localhost; Secure; SameSite=Lax; Max-Age=0`,
      `isAdmin=; Path=/Session; Domain=localhost; Secure; SameSite=None; Max-Age=0`,
      `uid=; Path=/Session; Domain=localhost; Secure; SameSite=None; Max-Age=0`,
      `workerId=; Path=/Session; Domain=localhost; Secure; SameSite=None; Max-Age=0`,
      
      // Clear any potential legacy or additional cookies
      `B1SESSION=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`,
      `ROUTEID=; Path=/; Secure; SameSite=None; Max-Age=0`,
      `B1SESSION_EXPIRY=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`
    ]);

    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ 
      message: 'An error occurred during logout', 
      error: error.message 
    });
  }
}