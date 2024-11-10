// api/getQuotations.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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

    const queryResponse = await fetch(`${SAP_SERVICE_LAYER_BASE_URL}SQLQueries('sql12')/List`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `B1SESSION=${b1session}; ROUTEID=${routeid}`
      },
      body: requestBody
    });

    const responseText = await queryResponse.text();
    if (!queryResponse.ok) {
      return res.status(queryResponse.status).json({ error: responseText });
    }

    const queryData = JSON.parse(responseText);

    const quotations = queryData.value.map(item => ({
      CardCode: item.CardCode,
      DocDate: item.DocDate,
      Comments: item.Comments,
      DocNum: item.DocNum,
      DocTotal: item.DocTotal,
      DocStatus: item.DocStatus,
      subject: item.subject
    }));

    res.status(200).json(quotations);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
