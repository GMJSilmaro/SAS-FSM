import React from 'react';
import { Row, Col, Table } from 'react-bootstrap';

export const ServiceLocationTab = ({ customerData }) => {
  if (!customerData || !customerData.BPAddresses) {
    return <div className="p-4">Loading service locations...</div>;
  }

  if (customerData.BPAddresses.length === 0) {
    return <div className="p-4">No service locations found.</div>;
  }

  const formatAddress = (address) => {
    const parts = [
      address.Street,
      address.Block,
      address.ZipCode,
      address.City,
      address.Country
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Find matching contact employee for an address
  const findContactForAddress = (addressName) => {
    if (!customerData.ContactEmployees) return null;
    return customerData.ContactEmployees.find(
      contact => contact.Address === addressName
    );
  };

  return (
    <Row className="p-4">
      <Col>
        <h3 className="mb-4">Service Locations</h3>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Location Type</th>
              <th>Address</th>
              <th>Contact Person</th>
              <th>Phone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {customerData.BPAddresses.map((location, index) => {
              const contact = findContactForAddress(location.AddressName);
              return (
                <tr key={index}>
                  <td>
                    {location.AddressType === 'bo_ShipTo' ? 'Shipping Address' :
                     location.AddressType === 'bo_BillTo' ? 'Billing Address' :
                     'Other'}
                  </td>
                  <td>
                    <div><strong>{location.AddressName}</strong></div>
                    <div>{formatAddress(location)}</div>
                  </td>
                  <td>
                    {contact ? contact.Name : 
                     (location.AddressType === 'bo_ShipTo' ? customerData.ShipToDefault :
                      location.AddressType === 'bo_BillTo' ? customerData.BilltoDefault :
                      'N/A')}
                  </td>
                  <td>
                    {contact ? contact.Phone1 : 
                     (customerData.Phone1 || 'N/A')}
                  </td>
                  <td>
                    <span className={`badge ${location.U_Status === 'Active' ? 'bg-primary' : 'bg-success'}`}>
                      {location.U_Status || 'Active'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Col>
    </Row>
  );
};

export default ServiceLocationTab;

// ServiceLocationTab.js
// import React from 'react';
// import { Row, Col, Table } from 'react-bootstrap';

// export const ServiceLocationTab = ({ customerData }) => {
//   if (!customerData || !customerData.serviceLocations) {
//     return <div className="p-4">Loading service locations...</div>;
//   }

//   if (customerData.serviceLocations.length === 0) {
//     return <div className="p-4">No service locations found.</div>;
//   }

//   return (
//     <Row>
//       <Col>
//         <h3>Service Locations</h3>
//         <Table striped bordered hover>
//           <thead>
//             <tr>
//               <th>Location Name</th>
//               <th>Address</th>
//               <th>Contact Person</th>
//               <th>Phone</th>
//             </tr>
//           </thead>
//           <tbody>
//             {customerData.serviceLocations.map((location, index) => (
//               <tr key={index}>
//                 <td>{location.name || 'N/A'}</td>
//                 <td>{location.address || 'N/A'}</td>
//                 <td>{location.contactPerson || 'N/A'}</td>
//                 <td>{location.phone || 'N/A'}</td>
//               </tr>
//             ))}
//           </tbody>
//         </Table>
//       </Col>
//     </Row>
//   );
// };