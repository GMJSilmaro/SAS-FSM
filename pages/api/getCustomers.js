// pages/api/getCustomers.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export default async function handler(req, res) {
  const { SAP_SERVICE_LAYER_BASE_URL } = process.env;
  const b1session = req.cookies.B1SESSION;
  const routeid = req.cookies.ROUTEID;

  if (!b1session || !routeid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Fetch the BPCode list using the existing session cookies
    const queryResponse = await fetch(`${SAP_SERVICE_LAYER_BASE_URL}SQLQueries('sql01')/List`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `B1SESSION=${b1session}; ROUTEID=${routeid}`
      }
    });

    if (!queryResponse.ok) {
      const errorData = await queryResponse.json();
      return res.status(queryResponse.status).json({ error: errorData });
    }

    const queryData = await queryResponse.json();

    // Extract CardCode and CardName from the queryData
    const bpCodes = queryData.value.map(item => ({
      cardCode: item.CardCode,
      cardName: item.CardName
    }));

    // Return the BPCode list
    res.status(200).json(bpCodes);
  } catch (error) {
    console.error('Error fetching BP codes:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
