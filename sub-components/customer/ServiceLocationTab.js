import React, { useState } from 'react';
import { Row, Col, Table, Button, Modal, Form, Alert, InputGroup, Badge } from 'react-bootstrap';
import { Eye, PinMap, Search, CaretUpFill, CaretDownFill, CurrencyExchange, GeoAltFill, HouseFill, TelephoneFill } from 'react-bootstrap-icons';
import { CustomCountryFlag } from 'components/flags/CountryFlags';
import { toast } from 'react-toastify';

const headerStyle = {
  cursor: 'pointer',
  userSelect: 'none',
  backgroundColor: '#f8f9fa',
  position: 'relative',
  padding: '12px 8px',
};

// Add this helper function to extract unit number
const getUnitNumber = (buildingFloorRoom) => {
  if (!buildingFloorRoom) return '';
  
  // Match the #XX-XX pattern
  const match = buildingFloorRoom.match(/#\d{2}-\d{2}/);
  return match ? match[0] : buildingFloorRoom;
};

export const ServiceLocationTab = ({ customerData }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('AddressName');
  const [sortDirection, setSortDirection] = useState('desc');

  if (!customerData || !customerData.BPAddresses) {
    return <div className="p-4">Loading service locations...</div>;
  }

  if (customerData.BPAddresses.length === 0) {
    return <div className="p-4">No service locations found.</div>;
  }

// Update the formatAddress function
const formatAddress = (address) => {
  return [
    address.Street,
    address.BuildingFloorRoom,
    address.Country === 'SG' ? 'Singapore' : address.Country,
    address.ZipCode,
  ].filter(Boolean).join(', ');
};

  const findContactForAddress = (addressName) => {
    if (!customerData.ContactEmployees) return null;
    
    // If there are multiple contacts, return the first active one
    const contacts = customerData.ContactEmployees.filter(
      contact => contact.Active === 'tYES'
    );
    
    return contacts.length > 0 ? contacts[0] : null;
  };

  const handleViewDetails = (location) => {
    setSelectedLocation(location);
    setShowModal(true);
    toast.info('This modal is for viewing purposes only. Fields cannot be edited.', {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLocation(null);
  };

  const handleViewOnMap = (location) => {
    const address = formatAddress(location);
    const encodedAddress = encodeURIComponent(address);
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(mapUrl, '_blank');
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSort = (field) => {
    setSortDirection(sortField === field && sortDirection === 'asc' ? 'desc' : 'asc');
    setSortField(field);
  };

  const getSortIcon = (direction) => {
    return direction === 'asc' ? 
      <CaretUpFill className="ms-1" /> : 
      <CaretDownFill className="ms-1" />;
  };

  const sortLocations = (locations) => {
    return [...locations].sort((a, b) => {
      let compareA = a[sortField];
      let compareB = b[sortField];

      if (sortField === 'AddressType') {
        compareA = a.AddressType === 'bo_ShipTo' ? 'Shipping Address' : 
                   a.AddressType === 'bo_BillTo' ? 'Billing Address' : 'Other';
        compareB = b.AddressType === 'bo_ShipTo' ? 'Shipping Address' : 
                   b.AddressType === 'bo_BillTo' ? 'Billing Address' : 'Other';
      }

      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredLocations = customerData.BPAddresses.filter((location) =>
    Object.values(location).some((value) =>
      value !== null && value !== undefined && 
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedLocations = sortLocations(filteredLocations);

  return (
    <Row className="p-4">
      <Col>
        <h3 className="mb-4">Service Locations</h3>
        <InputGroup className="mb-3">
          <InputGroup.Text>
            <Search size={16} />
          </InputGroup.Text>
          <Form.Control
            placeholder="Search locations..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </InputGroup>
        <Table striped bordered hover responsive>
          <thead className="bg-light">
            <tr>
              <th onClick={() => handleSort('AddressType')} style={headerStyle}>
                Location Type {sortField === 'AddressType' && getSortIcon(sortDirection)}
              </th>
              <th onClick={() => handleSort('AddressName')} style={headerStyle}>
                Address {sortField === 'AddressName' && getSortIcon(sortDirection)}
              </th>
              <th onClick={() => handleSort('Name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Contact Person {getSortIcon('Name')}
              </th>
              <th onClick={() => handleSort('Phone1')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Phone {getSortIcon('Phone1')}
              </th>
              <th onClick={() => handleSort('U_Status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Status {getSortIcon('U_Status')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedLocations.map((location, index) => {
              const contact = findContactForAddress(location.AddressName);
              return (
                <tr key={index}>
                  <td>
                    <div className="d-flex align-items-center">
                      {location.AddressType === 'bo_BillTo' ? (
                        <CurrencyExchange className="me-2 text-primary" size={14} />
                      ) : (
                        <GeoAltFill className="me-2 text-primary" size={14} />
                      )}
                      <span className="fw-bold text-primary">
                        {location.AddressType === 'bo_ShipTo' ? 'Shipping Address' :
                         location.AddressType === 'bo_BillTo' ? 'Billing Address' : 'Other'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className="d-flex align-items-center">
                        <HouseFill className="me-2 text-primary" size={14} />
                        <span className="fw-bold text-primary">
                        <div>{location.BuildingFloorRoom || '-'}</div>
                        </span>
                        {(location.AddressName === customerData.ShipToDefault || 
                          location.AddressName === customerData.BilltoDefault) && (
                          <Badge bg="primary" className="ms-2">Default</Badge>
                        )}
                        {location.Country && (
                          <div className="ms-2">
                            <CustomCountryFlag country={location.Country} />
                          </div>
                        )}
                      </div>
                      <div className="ms-4 text-muted">
                    
                        {formatAddress(location)}
                      </div>
                    </div>
                  </td>
                  <td>
                    {contact ? (
                      <div>
                        <div className="fw-bold">{contact.Name}</div>
                        <div className="text-muted small">
                          {[contact.FirstName, contact.LastName].filter(Boolean).join(' ')}
                        </div>
                      </div>
                    ) : 'N/A'}
                  </td>
                  <td>
                    {contact && contact.Phone1 ? (
                      <a href={`tel:${contact.Phone1}`} className="text-decoration-none">
                        <TelephoneFill className="me-2" />
                        {contact.Phone1}
                      </a>
                    ) : 'N/A'}
                  </td>
                  <td>
                    <span className={`badge ${location.U_Status === 'Active' ? 'bg-primary' : 'bg-success'}`}>
                      {location.U_Status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <Button variant="outline-primary" size="sm" onClick={() => handleViewDetails(location)} className="me-2">
                      <Eye size={16} className="me-1" /> View Details
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>

        <Modal show={showModal} onHide={handleCloseModal} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Location Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="info">
              This modal is for viewing purposes only. Fields cannot be edited.
            </Alert>
            {selectedLocation && (
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Address Name</Form.Label>
                  <Form.Control type="text" value={selectedLocation.AddressName} readOnly />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Address Type</Form.Label>
                  <Form.Control type="text" value={selectedLocation.AddressType === 'bo_ShipTo' ? 'Shipping Address' : selectedLocation.AddressType === 'bo_BillTo' ? 'Billing Address' : 'Other'} readOnly />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Full Address</Form.Label>
                  <Form.Control as="textarea" rows={3} value={formatAddress(selectedLocation)} readOnly />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Control type="text" value={selectedLocation.U_Status || 'Active'} readOnly />
                </Form.Group>
              </Form>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Close
            </Button>
            <Button variant="primary" onClick={() => handleViewOnMap(selectedLocation)}>
              <PinMap size={16} className="me-1" /> View on Map
            </Button>
          </Modal.Footer>
        </Modal>
      </Col>
    </Row>
  );
};

export default ServiceLocationTab;
