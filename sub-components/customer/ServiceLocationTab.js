import React, { useState } from 'react';
import { Row, Col, Table, Button, Modal, Form, Alert, InputGroup } from 'react-bootstrap';
import { Eye, MapPin, Search } from 'lucide-react';
import { toast } from 'react-toastify';

export const ServiceLocationTab = ({ customerData }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const findContactForAddress = (addressName) => {
    if (!customerData.ContactEmployees) return null;
    return customerData.ContactEmployees.find(
      contact => contact.Address === addressName
    );
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

  const filteredLocations = customerData.BPAddresses.filter((location) =>
    Object.values(location).some((value) =>
      value !== null && value !== undefined && 
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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
          <thead>
            <tr>
              <th>Location Type</th>
              <th>Address</th>
              <th>Contact Person</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLocations.map((location, index) => {
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
              <MapPin size={16} className="me-1" /> View on Map
            </Button>
          </Modal.Footer>
        </Modal>
      </Col>
    </Row>
  );
};

export default ServiceLocationTab;
