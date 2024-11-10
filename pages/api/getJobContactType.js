// pages/api/getJobContactType.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export default async function handler(req, res) {
  console.log('API Route hit: getJobContactType');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { SAP_SERVICE_LAYER_BASE_URL } = process.env;

  let b1session = req.cookies.B1SESSION;
  let routeid = req.cookies.ROUTEID;
  let sessionExpiry = req.cookies.B1SESSION_EXPIRY;

  if (!b1session || !routeid || !sessionExpiry) {
    return res.status(401).json({ error: 'Unauthorized - Missing required cookies' });
  }

  try {
    const endpoint = `${SAP_SERVICE_LAYER_BASE_URL}SQLQueries('sql09')/List`;
    console.log('Attempting to fetch from SAP:', endpoint);
    
    const queryResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `B1SESSION=${b1session}; ROUTEID=${routeid}`
      }
    });

    console.log('SAP Response Status:', queryResponse.status);
    
    if (!queryResponse.ok) {
      const errorText = await queryResponse.text();
      console.error('SAP API Error:', errorText);
      return res.status(queryResponse.status).json({ 
        error: 'Failed to fetch job contact types',
        details: errorText,
        status: queryResponse.status
      });
    }

    const responseText = await queryResponse.text();
    console.log('SAP Response Text:', responseText.substring(0, 200));
    
    const queryData = JSON.parse(responseText);

    if (!queryData || !Array.isArray(queryData.value)) {
      console.error('Unexpected response structure:', queryData);
      return res.status(500).json({ 
        error: 'Unexpected response structure from SAP',
        received: queryData
      });
    }

    const jobContactTypes = queryData.value.map(item => ({
      code: item.Code,
      name: item.Name
    }));

    console.log('Returning job contact types:', jobContactTypes);
    
    res.status(200).json(jobContactTypes);

  } catch (error) {
    console.error('Error in getJobContactType API:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}