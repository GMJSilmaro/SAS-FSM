// /api/getCustomers.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { renewSAPSession } from "../../utils/renewSAPSession"; // Import your session renewal function

export default async function handler(req, res) {
  const { SAP_SERVICE_LAYER_BASE_URL } = process.env;
  const b1session = req.cookies.B1SESSION;
  const routeid = req.cookies.ROUTEID;

  if (!b1session || !routeid) {
    try {
      // Attempt to renew session
      const renewResponse = await renewSAPSession();
      if (renewResponse.ok) {
        // Re-fetch the session cookies after renewal
        const newB1session = renewResponse.cookies.B1SESSION; // Adjust this if your renewal function returns cookies differently
        const newRouteid = renewResponse.cookies.ROUTEID; // Adjust this if necessary

        // Check if the new session is valid
        if (!newB1session || !newRouteid) {
          return res
            .status(401)
            .json({ error: "Unauthorized: Session is missing or expired" });
        }
      } else {
        return res
          .status(401)
          .json({ error: "Unauthorized: Session renewal failed" });
      }
    } catch (error) {
      console.error("Error renewing session:", error);
      return res
        .status(500)
        .json({ error: "Internal Server Error: Unable to renew session" });
    }
  }

  try {
    // Fetch the BPCode list using the session cookies
    const queryResponse = await fetch(
      `${SAP_SERVICE_LAYER_BASE_URL}SQLQueries('sql01')/List`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `B1SESSION=${b1session}; ROUTEID=${routeid}`,
        },
      }
    );

    // Log response status and headers for debugging
    console.log("API Response Status:", queryResponse.status);
    console.log("API Response Headers:", queryResponse.headers);

    if (!queryResponse.ok) {
      const errorData = await queryResponse.text(); // Fetch as text to handle HTML error pages
      console.error("Error response from SAP Service Layer:", errorData);
      return res
        .status(queryResponse.status)
        .json({ error: `Error fetching BP Codes: ${errorData}` });
    }

    const queryData = await queryResponse.json();

    // Ensure the response contains the expected format
    if (!queryData || !Array.isArray(queryData.value)) {
      console.error("Unexpected response format:", queryData);
      return res
        .status(500)
        .json({ error: "Unexpected response format from SAP Service Layer" });
    }

    // Extract CardCode and CardName from the queryData
    const bpCodes = queryData.value.map((item) => ({
      cardCode: item.CardCode,
      cardName: item.CardName,
    }));

    // Return the BPCode list
    res.status(200).json(bpCodes);
  } catch (error) {
    console.error("Error fetching BP codes:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error: Unable to fetch BP codes" });
  }
}

// // pages/api/getCustomers.js
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// export default async function handler(req, res) {
//   const { SAP_SERVICE_LAYER_BASE_URL } = process.env;
//   const b1session = req.cookies.B1SESSION;
//   const routeid = req.cookies.ROUTEID;

//   if (!b1session || !routeid) {
//     return res.status(401).json({ error: 'Unauthorized' });
//   }

//   try {
//     // Fetch the BPCode list using the existing session cookies
//     const queryResponse = await fetch(`${SAP_SERVICE_LAYER_BASE_URL}SQLQueries('sql01')/List`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Cookie': `B1SESSION=${b1session}; ROUTEID=${routeid}`
//       }
//     });

//     if (!queryResponse.ok) {
//       const errorData = await queryResponse.json();
//       return res.status(queryResponse.status).json({ error: errorData });
//     }

//     const queryData = await queryResponse.json();

//     // Extract CardCode and CardName from the queryData
//     const bpCodes = queryData.value.map(item => ({
//       cardCode: item.CardCode,
//       cardName: item.CardName
//     }));

//     // Return the BPCode list
//     res.status(200).json(bpCodes);
//   } catch (error) {
//     console.error('Error fetching BP codes:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// }
