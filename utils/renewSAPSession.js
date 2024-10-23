export async function renewSAPSession(currentB1Session, currentRouteId) {
  try {
    const loginResponse = await fetch(`${process.env.SAP_SERVICE_LAYER_BASE_URL}Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        CompanyDB: process.env.SAP_B1_COMPANY_DB,
        UserName: process.env.SAP_B1_USERNAME,
        Password: process.env.SAP_B1_PASSWORD,
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Failed to renew SAP B1 session: ${await loginResponse.text()}`);
    }

    const loginData = await loginResponse.json();
    return {
      newB1Session: loginData.SessionId,
      newRouteId: currentRouteId || '.node4',
      newExpiryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    };
  } catch (error) {
    console.error('Error renewing SAP B1 session:', error);
    return null;
  }
}
