// pages/api/getCustomersList.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { SAP_SERVICE_LAYER_BASE_URL } = process.env;
  const { 
    page = 1, 
    limit = 100, 
    search = '',
    customerCode = '',
    customerName = '',
    email = '',
    phone = '',
    contractStatus = '',
    country = '',
    status = '',
    address = ''
  } = req.query;

  let b1session = req.cookies.B1SESSION;
  let routeid = req.cookies.ROUTEID;

  if (!b1session || !routeid) {
    return res.status(401).json({ error: 'Unauthorized' });
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
    if (address) {
      filterConditions.push(`(contains(Address, '${address}') or contains(MailAddress, '${address}'))`);
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

    // Get total count
    const countUrl = `${SAP_SERVICE_LAYER_BASE_URL}BusinessPartners/$count?$filter=contains(CardName, '${search}')`;
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