import React from 'react';
import { Row, Col, Table, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { EnvelopeFill, TelephoneFill, GeoAltFill, CurrencyExchange } from 'react-bootstrap-icons';

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
      return { text: "Active", variant: "success" };
    } else if (customerData.Frozen === "tYES") {
      return { text: "Frozen", variant: "warning" };
    }
    return { text: "Inactive", variant: "danger" };
  };

  const status = getAccountStatus();

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
              <td>{customerData.ContactPerson || 'N/A'}</td>
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
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip id="phone2-tooltip">Click to call</Tooltip>}
                >
                  <a href={`tel:${customerData.Phone2}`} className="text-decoration-none">
                    <TelephoneFill className="me-2" />
                    {customerData.Phone2 || 'N/A'}
                  </a>
                </OverlayTrigger>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">Mailing Address</td>
              <td>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip id="address-tooltip">Click to view on map</Tooltip>}
                >
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getFormattedAddress())}`} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                    <GeoAltFill className="me-2" />
                    {getFormattedAddress()}
                  </a>
                </OverlayTrigger>
              </td>
            </tr>
            <tr>
              <td className="fw-bold">Account Status</td>
              <td><Badge bg={status.variant}>{status.text}</Badge></td>
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
                    {customerData.CurrentAccountBalance ? `${customerData.Currency} ${customerData.CurrentAccountBalance.toLocaleString()}` : 'N/A'}
                  </span>
                </OverlayTrigger>
              </td>
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