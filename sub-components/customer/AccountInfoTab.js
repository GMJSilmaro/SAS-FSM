import React from 'react';
import { Row, Col, Table, OverlayTrigger, Tooltip, Badge } from 'react-bootstrap';
import { EnvelopeFill, TelephoneFill, GeoAltFill, CurrencyExchange, HouseFill } from 'react-bootstrap-icons';
import { CustomCountryFlag } from 'components/flags/CountryFlags';

export const AccountInfoTab = ({ customerData }) => {
  if (!customerData) {
    return <div className="p-4">Loading account information...</div>;
  }

  console.log(customerData);
  

// Helper function to get the default billing address
const getDefaultBillingAddress = () => {
  if (!customerData.BPAddresses) return null;
  
  return customerData.BPAddresses.find(addr => 
    addr.AddressType === 'bo_BillTo' && 
    addr.AddressName === customerData.BilltoDefault
  );
};

// Add the unit number extraction helper function
const getUnitNumber = (buildingFloorRoom) => {
  if (!buildingFloorRoom) return '';
  
  // Match the #XX-XX pattern
  const match = buildingFloorRoom.match(/#\d{2}-\d{2}/);
  return match ? match[0] : buildingFloorRoom;
};

// Update the getFormattedAddress function
const getFormattedAddress = () => {
  const defaultAddress = getDefaultBillingAddress();
  
  if (!defaultAddress) return { street: 'N/A', buildingInfo: '', fullAddress: 'N/A' };

  return {
    street: defaultAddress.BuildingFloorRoom,
   
    fullAddress: [
      //getUnitNumber(defaultAddress.BuildingFloorRoom) + '',
      defaultAddress.Street,
      defaultAddress.BuildingFloorRoom,
      defaultAddress.Country === 'SG' ? 'Singapore' : defaultAddress.Country,
      defaultAddress.ZipCode,
    ].filter(Boolean).join(', ')
  };
};

// Add this helper function at the top of your component
const getDefaultContact = () => {
  if (!customerData.ContactEmployees) return null;
  
  // Find the first active contact
  return customerData.ContactEmployees.find(
    contact => contact.Active === 'tYES'
  );
};

  return (
    <Row className="p-4">
      <Col>
        <h3 className="mb-4">Account Information</h3>
        <Table striped bordered hover responsive>
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
              <td>
                {(() => {
                  const contact = getDefaultContact();
                  if (!contact) {
                    return customerData.ContactPerson || 'No contact assigned';
                  }
                  
                  return (
                    <div>
                      <div className="fw-bold">{contact.Name}</div>
                      <div className="text-muted small">
                        {[contact.FirstName, contact.LastName].filter(Boolean).join(' ')}
                      </div>
                      {contact.Phone1 && (
                        <div>
                          <a href={`tel:${contact.Phone1}`} className="text-decoration-none">
                            <TelephoneFill className="me-2" />
                            {contact.Phone1}
                          </a>
                        </div>
                      )}
                      {contact.E_Mail && (
                        <div>
                          <a href={`mailto:${contact.E_Mail}`} className="text-decoration-none">
                            <EnvelopeFill className="me-2" />
                            {contact.E_Mail}
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </td>
            </tr>
            <tr>
              <td className="fw-bold">Phone</td>
              <td>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip id="phone-tooltip">Click to call</Tooltip>}
                >
                  <a href={`tel:${customerData.Phone1}`} className="text-decoration-none">
                    <TelephoneFill className="me-2" />
                    {customerData.Phone1 || 'N/A'}
                  </a>
                </OverlayTrigger>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">Secondary Phone</td>
              <td>
                {customerData.Phone2 ? (
                  <OverlayTrigger
                    placement="top"
                    overlay={<Tooltip id="phone2-tooltip">Click to call</Tooltip>}
                  >
                    <a href={`tel:${customerData.Phone2}`} className="text-decoration-none">
                      <TelephoneFill className="me-2" />
                      {customerData.Phone2}
                    </a>
                  </OverlayTrigger>
                ) : (
                  <span className="text-muted">
                    <TelephoneFill className="me-2" />
                    No secondary phone
                  </span>
                )}
              </td>
            </tr>
            <tr>
              <td className="fw-bold">Email</td>
              <td>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip id="email-tooltip">Click to send email</Tooltip>}
                >
                  <a href={`mailto:${customerData.EmailAddress}`} className="text-decoration-none">
                    <EnvelopeFill className="me-2" />
                    {customerData.EmailAddress || 'N/A'}
                  </a>
                </OverlayTrigger>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">Default Address</td>
              <td>
                <div>
                  <div className="d-flex align-items-center">
                    <GeoAltFill className="me-2 text-primary" size={14} />
                    <span className="fw-bold text-primary">
                      {getFormattedAddress().street}
                    </span>
                    <Badge bg="primary" className="ms-2">Default</Badge>
                    {customerData.MailCountry && (
                      <div className="ms-2">
                        <CustomCountryFlag country={customerData.MailCountry} />
                      </div>
                    )}
                  </div>
                  <div className="ms-4 text-muted">
                    {getFormattedAddress().buildingInfo && (
                      <div>{getFormattedAddress().buildingInfo}</div>
                    )}
                    <div>{getFormattedAddress().fullAddress}</div>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">Service Remarks</td>
              <td>{customerData.FreeText || 'No remarks'}</td>
            </tr>
            <tr>
              <td className="fw-bold">Current Account Balance</td>
              <td>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip id="balance-tooltip">Current balance as of today</Tooltip>}
                >
                  <span>
                    <CurrencyExchange className="me-2" />
                    {customerData.CurrentAccountBalance 
                      ? `${customerData.Currency} ${customerData.CurrentAccountBalance.toLocaleString()}`
                      : 'SGD 0.00'}
                  </span>
                </OverlayTrigger>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">Orders</td>
              <td>
                <span>
                  <CurrencyExchange className="me-2" />
                  {customerData.OpenOrdersBalance 
                    ? `${customerData.Currency} ${customerData.OpenOrdersBalance.toLocaleString()}`
                    : 'No open orders'}
                </span>
              </td>
            </tr>
          </tbody>
        </Table>
      </Col>
    </Row>
  );
};

export default AccountInfoTab;
