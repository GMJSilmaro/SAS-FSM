export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { SAP_SERVICE_LAYER_BASE_URL } = process.env;
  const { cardCode } = req.body;

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
    const requestBody = JSON.stringify({
      ParamList: `CardCode='${cardCode}'`
    });
    console.log('Sending request to:', `${SAP_SERVICE_LAYER_BASE_URL}SQLQueries('sql03')/List`);
    console.log('With body:', requestBody);

    const queryResponse = await fetch(`${SAP_SERVICE_LAYER_BASE_URL}SQLQueries('sql03')/List`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `B1SESSION=${b1session}; ROUTEID=${routeid}`
      },
      body: requestBody
    });

    console.log('Query response status:', queryResponse.status);

    // Log the full response body for debugging
    const responseText = await queryResponse.text();
    console.log('Response text:', responseText);

    if (!queryResponse.ok) {
      return res.status(queryResponse.status).json({ error: responseText });
    }

    const queryData = JSON.parse(responseText);
    console.log('Query response data:', queryData);

    const locations = queryData.value.map(item => ({
      siteId: item.SiteID,
      building: item.Building,
      streetNo: item.StreetNo,
      street: item.Street,
      block: item.Block,
      address: item.Address,
      city: item.City,
      countryName: item.CountryName,
      zipCode: item.ZipCode,
      addressType: item.AdresType
    }));

    res.status(200).json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
} 