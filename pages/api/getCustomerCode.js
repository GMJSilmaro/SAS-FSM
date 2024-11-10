// /api/getCustomerCode.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export default async function handler(req, res) {
  const { SAP_SERVICE_LAYER_BASE_URL } = process.env;
  const { cardCode } = req.query;

  let b1session = req.cookies.B1SESSION;
  let routeid = req.cookies.ROUTEID;
  let sessionExpiry = req.cookies.B1SESSION_EXPIRY;

  if (!b1session || !routeid || !sessionExpiry || Date.now() >= new Date(sessionExpiry).getTime()) {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }

  try {
    // Fetch the specific BusinessPartner using the CardCode
    const queryResponse = await fetch(`${SAP_SERVICE_LAYER_BASE_URL}BusinessPartners('${cardCode}')`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `B1SESSION=${b1session}; ROUTEID=${routeid}`
      }
    });

    // Log response status and headers for debugging
    console.log('API Response Status:', queryResponse.status);
    console.log('API Response Headers:', queryResponse.headers);

    if (!queryResponse.ok) {
      const errorData = await queryResponse.text(); // Fetch as text to handle HTML error pages
      console.error('Error response from SAP Service Layer:', errorData);
      return res.status(queryResponse.status).json({ error: `Error fetching BusinessPartner: ${errorData}` });
    }

    const customerData = await queryResponse.json();

    // Ensure the response contains the expected data
    if (!customerData || !customerData.CardCode) {
      console.error('Unexpected response format:', customerData);
      return res.status(500).json({ error: 'Unexpected response format from SAP Service Layer' });
    }

    // Return the customer data
    res.status(200).json(customerData);
  } catch (error) {
    console.error('Error fetching BusinessPartner:', error);
    res.status(500).json({ error: 'Internal Server Error: Unable to fetch BusinessPartner' });
  }
}
