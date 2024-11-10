// pages/api/getSalesOrder.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { SAP_SERVICE_LAYER_BASE_URL } = process.env;
  const { cardCode, serviceCallID } = req.body;

  if (!cardCode) {
    return res.status(400).json({ error: 'CardCode is required' });
  }

  let b1session = req.cookies.B1SESSION;
  let routeid = req.cookies.ROUTEID;
  let sessionExpiry = req.cookies.B1SESSION_EXPIRY;

  if (!b1session || !routeid || !sessionExpiry) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Format ParamList exactly as shown in Postman
    const paramList = `CardCode='${cardCode}'&ServiceCallID='${serviceCallID}'`;

    const requestBody = JSON.stringify({
      ParamList: paramList
    });
    
    console.log('Sending request to:', `${SAP_SERVICE_LAYER_BASE_URL}SQLQueries('sql05')/List`);
    console.log('With body:', requestBody);

    const queryResponse = await fetch(`${SAP_SERVICE_LAYER_BASE_URL}SQLQueries('sql05')/List`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `B1SESSION=${b1session}; ROUTEID=${routeid}`
      },
      body: requestBody
    });

    if (!queryResponse.ok) {
      const errorText = await queryResponse.text();
      console.error('SAP API error:', errorText);
      return res.status(queryResponse.status).json({ 
        error: 'Failed to fetch from SAP',
        details: errorText
      });
    }

    const responseText = await queryResponse.text();
    console.log('Raw response:', responseText);

    try {
      const queryData = JSON.parse(responseText);
      // Return the exact structure as seen in Postman
      return res.status(200).json({
        value: queryData.value.map(item => ({
          DocNum: item.DocNum,
          DocStatus: item.DocStatus,
          DocTotal: item.DocTotal
        }))
      });
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      return res.status(500).json({ error: 'Error parsing SAP response' });
    }

  } catch (error) {
    console.error('Error fetching sales orders:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message
    });
  }
}