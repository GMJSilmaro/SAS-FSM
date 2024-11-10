// pages/api/getServiceCall.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { SAP_SERVICE_LAYER_BASE_URL } = process.env;
  const { cardCode } = req.body;

  // Improved input validation
  if (!cardCode || typeof cardCode !== 'string' || cardCode.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Invalid input',
      message: 'CardCode is required and must be a non-empty string' 
    });
  }

  let b1session = req.cookies.B1SESSION;
  let routeid = req.cookies.ROUTEID;
  let sessionExpiry = req.cookies.B1SESSION_EXPIRY;

  if (!b1session || !routeid || !sessionExpiry) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Session information is missing'
    });
  }

  try {
    // Clean the cardCode input
    const cleanCardCode = cardCode.trim().replace(/'/g, "''");
    
    const requestBody = JSON.stringify({
      ParamList: `CardCode='${cleanCardCode}'`
    });

    console.log('Making request to SAP:', {
      url: `${SAP_SERVICE_LAYER_BASE_URL}SQLQueries('sql10')/List`,
      body: requestBody
    });

    const queryResponse = await fetch(`${SAP_SERVICE_LAYER_BASE_URL}SQLQueries('sql10')/List`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `B1SESSION=${b1session}; ROUTEID=${routeid}`
      },
      body: requestBody
    });

    console.log('Query response status:', queryResponse.status);

    const responseText = await queryResponse.text();
    console.log('Response text:', responseText);

    if (!queryResponse.ok) {
      return res.status(queryResponse.status).json({ 
        error: 'SAP Query Failed',
        details: responseText
      });
    }

    let queryData;
    try {
      queryData = JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse SAP response:', error);
      return res.status(500).json({ 
        error: 'Invalid response',
        message: 'Failed to parse SAP response'
      });
    }

    if (!queryData.value || !Array.isArray(queryData.value)) {
      return res.status(500).json({ 
        error: 'Invalid response format',
        message: 'Unexpected response structure from SAP'
      });
    }

    const serviceCalls = queryData.value.map(item => ({
      serviceCallID: parseInt(item["'ServiceCallID'"], 10), // Convert to number
      subject: item["'Subject'"] || '',
      customerName: item["'CustomerName'"] || '',
      createDate: item["'CreateDate'"] || '',
      createTime: item["'CreateTime'"] || '',
      description: item["'Description'"] || ''
    }));

    console.log(`Successfully processed ${serviceCalls.length} service calls`);
    res.status(200).json(serviceCalls);

  } catch (error) {
    console.error('Error fetching service calls:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message || 'An unexpected error occurred'
    });
  }
}