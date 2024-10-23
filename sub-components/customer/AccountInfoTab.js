import React from 'react';
import { Row, Col, Table } from 'react-bootstrap';

export const AccountInfoTab = ({ customerData }) => {
  if (!customerData) {
    return <div className="p-4">Loading account information...</div>;
  }

  // Format address from BPAddresses if available
  const getFormattedAddress = () => {
    if (customerData.MailAddress) {
      return `${customerData.MailAddress}${customerData.MailZipCode ? `, ${customerData.MailZipCode}` : ''}${customerData.MailCountry ? `, ${customerData.MailCountry}` : ''}`;
    }
    return 'N/A';
  };

  // Get status based on Valid field
  const getAccountStatus = () => {
    if (customerData.Valid === "tYES" && customerData.Frozen === "tNO") {
      return "Active";
    } else if (customerData.Frozen === "tYES") {
      return "Frozen";
    }
    return "Inactive";
  };

  return (
    <Row className="p-4">
      <Col>
        <h3 className="mb-4">Account Information</h3>
        <Table striped bordered hover>
          <tbody>
            <tr>
              <td className="fw-bold" style={{ width: '30%' }}>Customer Code</td>
              <td>{customerData.CardCode || 'N/A'}</td>
            </tr>
            <tr>
              <td className="fw-bold">Company Name</td>
              <td>{customerData.CardName || 'N/A'}</td>
            </tr>
            <tr>
              <td className="fw-bold">Contact Person</td>
              <td>{customerData.ContactPerson || 'N/A'}</td>
            </tr>
            <tr>
              <td className="fw-bold">Email</td>
              <td>{customerData.EmailAddress || 'N/A'}</td>
            </tr>
            <tr>
              <td className="fw-bold">Phone</td>
              <td>{customerData.Phone1 || 'N/A'}</td>
            </tr>
            <tr>
              <td className="fw-bold">Secondary Phone</td>
              <td>{customerData.Phone2 || 'N/A'}</td>
            </tr>
            <tr>
              <td className="fw-bold">Mailing Address</td>
              <td>{getFormattedAddress()}</td>
            </tr>
            <tr>
              <td className="fw-bold">Account Status</td>
              <td>{getAccountStatus()}</td>
            </tr>
            <tr>
              <td className="fw-bold">Currency</td>
              <td>{customerData.Currency || 'N/A'}</td>
            </tr>
            <tr>
              <td className="fw-bold">Credit Limit</td>
              <td>{customerData.CreditLimit ? `${customerData.Currency} ${customerData.CreditLimit.toLocaleString()}` : 'N/A'}</td>
            </tr>
            <tr>
              <td className="fw-bold">Payment Terms Group</td>
              <td>{customerData.PayTermsGrpCode !== -1 ? customerData.PayTermsGrpCode : 'N/A'}</td>
            </tr>
            <tr>
              <td className="fw-bold">Group Code</td>
              <td>{customerData.GroupCode || 'N/A'}</td>
            </tr>
            <tr>
              <td className="fw-bold">VAT Group</td>
              <td>{customerData.VatGroup || 'N/A'}</td>
            </tr>
            <tr>
              <td className="fw-bold">Created Date</td>
              <td>{customerData.CreateDate ? new Date(customerData.CreateDate).toLocaleDateString() : 'N/A'}</td>
            </tr>
            <tr>
              <td className="fw-bold">Last Updated</td>
              <td>{customerData.UpdateDate ? new Date(customerData.UpdateDate).toLocaleDateString() : 'N/A'}</td>
            </tr>
          </tbody>
        </Table>
      </Col>
    </Row>
  );
};

export default AccountInfoTab;

// AccountInfoTab.js
// import React from 'react';
// import { Row, Col, Table } from 'react-bootstrap';

// export const AccountInfoTab = ({ customerData }) => {
//   if (!customerData) {
//     return <div className="p-4">Loading account information...</div>;
//   }

//   return (
//     <Row>
//       <Col>
//         <h3>Account Information</h3>
//         <Table striped bordered hover>
//           <tbody>
//             <tr>
//               <td>Customer Code</td>
//               <td>{customerData?.CardCode || 'N/A'}</td>
//             </tr>
//             <tr>
//               <td>Company Name</td>
//               <td>{customerData?.CardName || 'N/A'}</td>
//             </tr>
//             <tr>
//               <td>Contact Person</td>
//               <td>{customerData?.contactPerson || 'N/A'}</td>
//             </tr>
//             <tr>
//               <td>Email</td>
//               <td>{customerData?.email || 'N/A'}</td>
//             </tr>
//             <tr>
//               <td>Phone</td>
//               <td>{customerData?.phone || 'N/A'}</td>
//             </tr>
//             <tr>
//               <td>Billing Address</td>
//               <td>{customerData?.billingAddress || 'N/A'}</td>
//             </tr>
//             <tr>
//               <td>Account Status</td>
//               <td>{customerData?.accountStatus || 'N/A'}</td>
//             </tr>
//           </tbody>
//         </Table>
//       </Col>
//     </Row>
//   );
// };