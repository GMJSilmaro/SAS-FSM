// api/getEquipments.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { renewSAPSession } from '../../utils/renewSAPSession';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { NEXT_PUBLIC_SAP_SERVICE_LAYER_BASE_URL } = process.env;
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

  // Check if session needs renewal
  const currentTime = Date.now();
  const expiryTime = new Date(sessionExpiry).getTime();
  const fiveMinutesInMilliseconds = 5 * 60 * 1000;

  if (expiryTime - currentTime <= fiveMinutesInMilliseconds) {
    const renewalResult = await renewSAPSession(b1session, routeid);
    if (renewalResult) {
      b1session = renewalResult.newB1Session;
      routeid = renewalResult.newRouteId;
      sessionExpiry = renewalResult.newExpiryTime;
      
      res.setHeader('Set-Cookie', [
        `B1SESSION=${b1session}; HttpOnly; Secure; SameSite=None`,
        `ROUTEID=${routeid}; Secure; SameSite=None`,
        `B1SESSION_EXPIRY=${sessionExpiry}; HttpOnly; Secure; SameSite=None`
      ]);
    } else {
      return res.status(401).json({ error: 'Failed to renew session' });
    }
  }

  try {
    const requestBody = JSON.stringify({
      ParamList: `CardCode='${cardCode}'`
    });

    const queryResponse = await fetch(`${NEXT_PUBLIC_SAP_SERVICE_LAYER_BASE_URL}SQLQueries('sql08')/List`, {
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

    const equipments = queryData.value.map(item => ({
      ItemCode: item.ItemCode,
      ItemName: item.ItemName,
      ItemGroup: item.ItemGroup,
      ModelSeries: item.ModelSeries,
      SerialNo: item.SerialNo,
      Brand: item.Brand,
      Notes: item.Notes,
      EquipmentType: item.EquipmentType,
      WarrantyStartDate: item.WarrantyStartDate,
      WarrantyEndDate: item.WarrantyEndDate,
      EquipmentLocation: item.EquipmentLocation
    }));

    res.status(200).json(equipments);
  } catch (error) {
    console.error('Error fetching equipments:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
