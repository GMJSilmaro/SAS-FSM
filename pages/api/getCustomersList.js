// pages/api/getCustomersList.js
import { renewSAPSession } from '../../utils/renewSAPSession';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { SAP_SERVICE_LAYER_BASE_URL } = process.env;
  const { 
    page = 1, 
    limit = 10, 
    search = '',
    customerCode = '',
    customerName = '',
    email = '',
    phone = '',
    contractStatus = '',
    country = '',
    status = ''
  } = req.query;

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
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    let filterConditions = [];
    
    if (customerCode) {
      filterConditions.push(`contains(CardCode, '${customerCode}')`);
    }
    if (customerName) {
      filterConditions.push(`contains(CardName, '${customerName}')`);
    }
    if (email) {
      filterConditions.push(`contains(EmailAddress, '${email}')`);
    }
    if (phone) {
      filterConditions.push(`contains(Phone1, '${phone}')`);
    }
    if (contractStatus) {
      filterConditions.push(`U_Contract eq '${contractStatus}'`);
    }
    if (country) {
      filterConditions.push(`Country eq '${country}'`);
    }
    if (status) {
      filterConditions.push(`Valid eq '${status === 'active' ? 'Y' : 'N'}'`);
    }
    
    // If there's a general search term, add it to the conditions
    if (search) {
      filterConditions.push(`(contains(CardCode, '${search}') or contains(CardName, '${search}'))`);
    }

    // Combine all conditions with 'and'
    const filterQuery = filterConditions.length > 0 
      ? `$filter=${filterConditions.join(' and ')}` 
      : '';

    const url = `${SAP_SERVICE_LAYER_BASE_URL}BusinessPartners?$skip=${skip}&$top=${limit}${filterQuery ? '&' + filterQuery : ''}`;

    // Fetch the business partners using the session cookies
    const queryResponse = await fetch(url, {
      method: 'GET',
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

    // Update the count URL to include the same filters
    const countUrl = `${SAP_SERVICE_LAYER_BASE_URL}BusinessPartners/$count${filterQuery ? '?' + filterQuery : ''}`;
    const countResponse = await fetch(countUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `B1SESSION=${b1session}; ROUTEID=${routeid}`
      }
    });

    const totalCount = await countResponse.json();

    // Return the API response
    res.status(200).json({
      customers: queryData.value,
      totalCount: totalCount
    });
  } catch (error) {
    console.error('Error fetching business partners:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
