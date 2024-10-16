import React, { useState, useEffect, Fragment } from 'react';
import { Col, Row, Card, Button, Modal } from 'react-bootstrap';
import DataTable from 'react-data-table-component';

const fetchLocations = async (cardCode) => {
  try {
    const response = await fetch('/api/getLocations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cardCode })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch locations');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
};

const LocationsTable = () => {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    const getLocations = async () => {
      const data = await fetchLocations('C000001'); // Use a sample cardCode
      setLocations(data);
      setFilteredLocations(data); // Initialize filtered locations
    };
    getLocations();
  }, []);

  // Filter locations based on search input
  useEffect(() => {
    const result = locations.filter(location => {
      return Object.values(location).some(field =>
        field.toLowerCase().includes(search.toLowerCase())
      );
    });
    setFilteredLocations(result);
  }, [search, locations]);

  const handleViewDetails = (location) => {
    setSelectedLocation(location);
    setShowModal(true);
  };

  const columns = [
    { name: 'Site ID', selector: row => row.siteId, sortable: true, width: '100px' },
    { name: 'Building', selector: row => row.building, sortable: true, width: '120px' },
    { name: 'Street', selector: row => row.street, sortable: true, width: '150px' },
    { name: 'Block', selector: row => row.block, sortable: true, width: '120px' },
    { name: 'City', selector: row => row.city, sortable: true, width: '120px' },
    { name: 'Country', selector: row => row.countryName, sortable: true, width: '120px' },
    { name: 'Zip Code', selector: row => row.zipCode, sortable: true, width: '100px' },
    {
      name: 'Actions',
      cell: (row) => (
        <Button variant="outline-primary" size="sm" onClick={() => handleViewDetails(row)}>
          View Details
        </Button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  return (
    <Fragment>
      <Row>
        <Col lg={12} md={12} sm={12}>
          <div className="border-bottom pb-4 mb-4 d-md-flex align-items-center justify-content-between">
            <div className="mb-3 mb-md-0">
              <h1 className="mb-1 h2 fw-bold">Locations List</h1>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col md={12} xs={12} className="mb-5">
          <Card>
            <Card.Header>
              <h4 className="mb-1">Locations Table</h4>
            </Card.Header>
            <Card.Body className="px-0">
              <input
                type="text"
                className="form-control me-4 mb-4"
                placeholder="Search by any field"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <DataTable
                columns={columns}
                data={filteredLocations}
                pagination
                highlightOnHover
                subHeader
                paginationRowsPerPageOptions={[5, 10, 15]}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal for Location Details */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Location Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLocation ? (
            <Fragment>
              <p><strong>Site ID:</strong> {selectedLocation.siteId}</p>
              <p><strong>Building:</strong> {selectedLocation.building}</p>
              <p><strong>Street:</strong> {selectedLocation.street}</p>
              <p><strong>Block:</strong> {selectedLocation.block}</p>
              <p><strong>City:</strong> {selectedLocation.city}</p>
              <p><strong>Country:</strong> {selectedLocation.countryName}</p>
              <p><strong>Zip Code:</strong> {selectedLocation.zipCode}</p>
            </Fragment>
          ) : (
            <p>No location details available.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </Fragment>
  );
};

export default LocationsTable;
