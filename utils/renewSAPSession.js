export async function renewSAPSession(currentB1Session, currentRouteId) {
  try {
    console.log('Attempting to renew SAP session for:', { currentB1Session, currentRouteId });

    // Remove trailing slash if present and use correct env variable
    const baseUrl = process.env.SAP_SERVICE_LAYER_BASE_URL.replace(/\/$/, '');
    
    const loginResponse = await fetch(`${baseUrl}/Login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        CompanyDB: process.env.SAP_B1_COMPANY_DB,
        UserName: process.env.SAP_B1_USERNAME,
        Password: process.env.SAP_B1_PASSWORD,
      })
    });

    console.log('SAP login response status:', loginResponse.status);

    // Check if we got a JSON response
    const contentType = loginResponse.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await loginResponse.text();
      console.error('Received non-JSON response from SAP:', text);
      throw new Error('Invalid response type from SAP');
    }

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error('SAP login failed:', errorText);
      throw new Error(`Failed to renew SAP B1 session: ${errorText}`);
    }

    const loginData = await loginResponse.json();
    console.log('SAP login successful:', loginData);

    return {
      newB1Session: loginData.SessionId,
      newRouteId: currentRouteId || '.node4',
      newExpiryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    };
  } catch (error) {
    console.error('Error in renewSAPSession:', error);
    return null;
  }
}