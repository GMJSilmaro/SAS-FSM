import https from 'https';

export default async function handler(req, res) {
  const agent = new https.Agent({
    rejectUnauthorized: false // Only for development/testing
  });

  try {
    console.log('Attempting to renew SAP B1 session');
    const loginResponse = await fetch(`${process.env.SAP_SERVICE_LAYER_BASE_URL}Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        CompanyDB: process.env.SAP_B1_COMPANY_DB,
        UserName: process.env.SAP_B1_USERNAME,
        Password: process.env.SAP_B1_PASSWORD,
      }),
      agent: agent,
    });

    if (!loginResponse.ok) {
      throw new Error(`Failed to renew SAP B1 session: ${await loginResponse.text()}`);
    }

    const loginData = await loginResponse.json();
    const newSessionId = loginData.SessionId;
    const newExpiryTime = new Date(Date.now() + 30 * 60 * 1000);

    res.setHeader('Set-Cookie', [
      `B1SESSION=${newSessionId}; HttpOnly; Secure; SameSite=None`,
      `B1SESSION_EXPIRY=${newExpiryTime.toISOString()}; HttpOnly; Secure; SameSite=None`,
      `ROUTEID=.node4; Secure; SameSite=None`
    ]);

    res.status(200).json({ message: 'SAP B1 session renewed successfully' });
  } catch (error) {
    console.error('Error renewing SAP B1 session:', error);
    res.status(500).json({ message: 'Failed to renew SAP B1 session', error: error.message });
  }
}