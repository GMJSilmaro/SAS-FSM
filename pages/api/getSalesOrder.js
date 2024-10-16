// pages/api/getSalesOrder.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export default async function handler(req, res) {
  const { SAP_SERVICE_LAYER_BASE_URL } = process.env;
  const { cardCode } = req.body; // Get cardCode from the request body

  const b1session = req.cookies.B1SESSION;
  const routeid = req.cookies.ROUTEID;

  if (!b1session || !routeid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!cardCode) {
    return res.status(400).json({ error: 'CardCode is required' });
  }

  try {
    const requestBody = JSON.stringify({
      ParamList: `CardCode='${cardCode}'`
    });

    const queryResponse = await fetch(`${SAP_SERVICE_LAYER_BASE_URL}SQLQueries('sql05')/List`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `B1SESSION=${b1session}; ROUTEID=${routeid}`
      },
      body: requestBody
    });

    const responseText = await queryResponse.text();
    console.log('Query response status:', queryResponse.status);
    console.log('Response text:', responseText);

    if (!queryResponse.ok) {
      return res.status(queryResponse.status).json({ error: responseText });
    }

    const queryData = JSON.parse(responseText);

    // Extract DocNum, DocStatus, and DocTotal from the queryData
    const salesOrder = queryData.value.map(item => ({
      DocNum: item.DocNum,
      DocStatus: item.DocStatus,
      DocTotal: item.DocTotal
    }));

    // Return the sales order list
    res.status(200).json(salesOrder);
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// export default async function handler(req, res) {
//   const { SAP_SERVICE_LAYER_BASE_URL } = process.env;
//   const b1session = req.cookies.B1SESSION;
//   const routeid = req.cookies.ROUTEID;
//   const { cardCode } = req.body;

//   if (!b1session || !routeid) {
//     return res.status(401).json({ error: 'Unauthorized' });
//   }

//   if (!cardCode) {
//     return res.status(400).json({ error: 'CardCode is required' });
//   }

//   try {
//     const requestBody = JSON.stringify({
//       ParamList: `CardCode='${cardCode}'`
//     });

//     // Fetch the SalesOrder list using the session cookies and CardCode
//     const queryResponse = await fetch(`${SAP_SERVICE_LAYER_BASE_URL}SQLQueries('sql05')/List`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Cookie': `B1SESSION=${b1session}; ROUTEID=${routeid}`
//       },
//       body: requestBody
//     });

//     const responseText = await queryResponse.text();
//     console.log('Query response status:', queryResponse.status);
//     console.log('Response text:', responseText);

//     if (!queryResponse.ok) {
//       return res.status(queryResponse.status).json({ error: responseText });
//     }

//     const queryData = JSON.parse(responseText);

//     // Extract DocNum, DocStatus, and DocTotal from the queryData
//     const salesOrder = queryData.value.map(item => ({
//       DocNum: item.DocNum,
//       DocStatus: item.DocStatus,
//       DocTotal: item.DocTotal
//     }));

//     // Return the sales order list
//     res.status(200).json(salesOrder);
//   } catch (error) {
//     console.error('Error fetching sales orders:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// }



// // // pages/api/getSalesOrder.js
// // process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// // export default async function handler(req, res) {
// //   const { SAP_SERVICE_LAYER_BASE_URL } = process.env;
// //   const b1session = req.cookies.B1SESSION;
// //   const routeid = req.cookies.ROUTEID;

// //   if (!b1session || !routeid) {
// //     return res.status(401).json({ error: 'Unauthorized' });
// //   }

// //   try {
// //     // Fetch the SalesOrder list using the existing session cookies
// //     const queryResponse = await fetch(`${SAP_SERVICE_LAYER_BASE_URL}SQLQueries('sql05')/List`, {
// //       method: 'POST',
// //       headers: {
// //         'Content-Type': 'application/json',
// //         'Cookie': `B1SESSION=${b1session}; ROUTEID=${routeid}`
// //       }
// //     });

// //     if (!queryResponse.ok) {
// //       const errorData = await queryResponse.json();
// //       return res.status(queryResponse.status).json({ error: errorData });
// //     }

// //     const queryData = await queryResponse.json();

// //     // Extract DocNum and DocStatus & DocTotal from the queryData
// //     const salesOrder = queryData.value.map(item => ({
// //         DocNum: item.DocNum,
// //         DocStatus: item.DocStatus,
// //         DocTotal: item.DocTotal
// //     }));

// //     // Return the BPCode list
// //     res.status(200).json(salesOrder);
// //   } catch (error) {
// //     console.error('Error fetching BP codes:', error);
// //     res.status(500).json({ error: 'Internal Server Error' });
// //   }
// // }
