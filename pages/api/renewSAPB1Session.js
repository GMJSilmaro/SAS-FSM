// /api/renewSAPB1Session.js
import https from 'https';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export default async function handler(req, res) {
  const workerId = req.cookies.workerId;
  const uid = req.cookies.uid;
  const email = req.cookies.email;
  const customToken = req.cookies.customToken;
  const isAdmin = req.cookies.isAdmin;

  // Check if current session is still valid and has more than 5 minutes remaining
  const currentExpiry = req.cookies.B1SESSION_EXPIRY;
  if (currentExpiry) {
    const timeUntilExpiry = new Date(currentExpiry).getTime() - Date.now();
    if (timeUntilExpiry > 5 * 60 * 1000) {
      console.log('⏳ Session still valid, skipping renewal');
      return res.status(200).json({
        success: true,
        message: 'Session still valid',
        expiryTime: new Date(currentExpiry)
      });
    }
  }

  console.log('🔄 Starting SAP B1 session renewal');

  try {
    // SAP B1 Login
    console.log('🌐 Attempting SAP B1 login...');
    const sapLoginResponse = await fetch(`${process.env.SAP_SERVICE_LAYER_BASE_URL}Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        CompanyDB: process.env.SAP_B1_COMPANY_DB,
        UserName: process.env.SAP_B1_USERNAME,
        Password: process.env.SAP_B1_PASSWORD
      })
    });

    console.log('🔍 Server: SAP B1 response status:', sapLoginResponse.status);

    if (!sapLoginResponse.ok) {
      throw new Error(`SAP B1 login failed with status: ${sapLoginResponse.status}`);
    }

    const sapLoginData = await sapLoginResponse.json();
    const sessionId = sapLoginData.SessionId;
    const sessionExpiryTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Set all required cookies with proper configuration
    const cookies = [
      `B1SESSION=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `B1SESSION_EXPIRY=${sessionExpiryTime.toISOString()}; Path=/; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `ROUTEID=.node4; Path=/; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `customToken=${customToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `uid=${uid}; Path=/; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `email=${email}; Path=/; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `workerId=${workerId}; Path=/; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `isAdmin=${isAdmin}; Path=/; Secure; SameSite=Lax; Max-Age=${30 * 60}`,
      `LAST_ACTIVITY=${Date.now()}; Path=/; Secure; SameSite=Lax; Max-Age=${30 * 60}`
    ];

    // Set cookies in response header
    res.setHeader('Set-Cookie', cookies);

    console.log('🔐 Server: Renewed session cookies:', {
      sessionId: sessionId.substring(0, 8) + '...',
      expiryTime: sessionExpiryTime.toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Session renewed successfully',
      expiryTime: sessionExpiryTime
    });

  } catch (error) {
    console.error('❌ Server: Session renewal error:', error);

    // Clear all cookies on error
    const clearCookies = [
      'B1SESSION',
      'B1SESSION_EXPIRY',
      'ROUTEID',
      'customToken',
      'uid',
      'email',
      'workerId',
      'isAdmin',
      'LAST_ACTIVITY'
    ].map(name => `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);

    res.setHeader('Set-Cookie', clearCookies);

    return res.status(401).json({
      success: false,
      message: 'Session renewal failed',
      error: error.message
    });
  }
}
