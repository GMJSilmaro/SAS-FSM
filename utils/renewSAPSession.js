import https from 'https';

export async function renewSAPSession(currentB1Session, currentRouteId) {
  const agent = new https.Agent({
    rejectUnauthorized: false // Only for development/testing
  });

  try {
    const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_SAP_SERVICE_LAYER_BASE_URL}Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        CompanyDB: process.env.NEXT_PUBLIC_SAP_B1_COMPANY_DB,
        UserName: process.env.NEXT_PUBLIC_SAP_B1_USERNAME,
        Password: process.env.NEXT_PUBLIC_SAP_B1_PASSWORD,
      }),
      agent: agent,
    });

    if (!loginResponse.ok) {
      throw new Error(`Failed to renew SAP B1 session: ${await loginResponse.text()}`);
    }

    const loginData = await loginResponse.json();
    return {
      newB1Session: loginData.SessionId,
      newRouteId: currentRouteId, // Assuming ROUTEID doesn't change
      newExpiryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    };
  } catch (error) {
    console.error('Error renewing SAP B1 session:', error);
    return null;
  }
}