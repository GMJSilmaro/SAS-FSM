import React, { useState, useEffect } from 'react';
import { Table, Spinner, Button, Modal, Form, InputGroup, Pagination, Container, Row, Col } from 'react-bootstrap';
import { Search, Eye, CaretUpFill, CaretDownFill, XCircle } from 'react-bootstrap-icons';

const headerStyle = {
  cursor: 'pointer',
  userSelect: 'none',
  backgroundColor: '#f8f9fa',
  position: 'relative',
  padding: '12px 8px',
};

const EquipmentsTab = ({ customerData }) => {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [equipmentsPerPage] = useState(10);
  const [sortField, setSortField] = useState('ItemCode');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const fetchEquipments = async () => {
      if (!customerData?.CardCode) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/api/getEquipments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cardCode: customerData.CardCode
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch equipment data');
        }

        const data = await response.json();
        setEquipments(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipments();
  }, [customerData?.CardCode]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredEquipments = equipments.filter((item) =>
    Object.values(item).some((value) =>
      value != null && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const indexOfLastEquipment = currentPage * equipmentsPerPage;
  const indexOfFirstEquipment = indexOfLastEquipment - equipmentsPerPage;
  const currentEquipments = filteredEquipments.slice(indexOfFirstEquipment, indexOfLastEquipment);
  const totalPages = Math.ceil(filteredEquipments.length / equipmentsPerPage);

  const handleViewDetails = (equipment) => {
    setSelectedEquipment(equipment);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEquipment(null);
  };

  const findServiceLocation = (locationName) => {
    if (!customerData?.BPAddresses) return 'N/A';
    
    // First try to find by AddressName
    const location = customerData.BPAddresses.find(
      addr => addr.AddressName?.toLowerCase() === locationName?.toLowerCase()
    );

    // If not found, try to match with default shipping or billing address
    let defaultLocation = !location ? customerData.BPAddresses.find(addr => 
      (locationName?.toLowerCase() === 'ship to' && addr.AddressType === 'bo_ShipTo') ||
      (locationName?.toLowerCase() === 'bill to' && addr.AddressType === 'bo_BillTo')
    ) : location;

    if (!defaultLocation && customerData.BPAddresses.length > 0) {
      // If still not found, use the first address as fallback
      defaultLocation = customerData.BPAddresses[0];
    }

    if (!defaultLocation) return 'N/A';
    
    const parts = [
      defaultLocation.Street,
      defaultLocation.Block,
      defaultLocation.ZipCode,
      defaultLocation.City,
      defaultLocation.State,
      defaultLocation.Country
    ].filter(Boolean);

    return parts.join(', ');
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

  const sortEquipments = (equipments) => {
    return [...equipments].sort((a, b) => {
      let compareA = a[sortField];
      let compareB = b[sortField];

      if (sortField === 'ServiceLocationAddress') {
        compareA = findServiceLocation(a.EquipmentLocation);
        compareB = findServiceLocation(b.EquipmentLocation);
      }

      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedEquipments = sortEquipments(currentEquipments);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <Spinner animation="border" />
        <span className="ms-2">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-danger">
        Error loading equipment data: {error}
      </div>
    );
  }

  if (!equipments?.length) {
    return (
      <div className="p-4 text-center">
        <p>No equipment records found for this customer.</p>
      </div>
    );
  }

  return (
    <Container fluid>
      <h3 className="mb-4">Customer Equipment</h3>
      <Row className="mb-3">
        <Col md={6}>
          <InputGroup className="mb-3">
            <InputGroup.Text>
              <Search />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={handleSearch}
            />
            {searchTerm && (
              <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
                <XCircle />
              </Button>
            )}
          </InputGroup>
        </Col>
      </Row>
      <Row>
        <Col>
          <div className="table-responsive">
            <Table striped bordered hover className="shadow-sm">
              <thead className="bg-light">
                <tr>
                  <th onClick={() => handleSort('ItemCode')} style={headerStyle}>
                    Item Code {sortField === 'ItemCode' && getSortIcon(sortDirection)}
                  </th>
                  <th onClick={() => handleSort('ItemName')} style={headerStyle}>
                    Item Name {sortField === 'ItemName' && getSortIcon(sortDirection)}
                  </th>
                  <th onClick={() => handleSort('ModelSeries')} style={headerStyle}>
                    Model Series {sortField === 'ModelSeries' && getSortIcon(sortDirection)}
                  </th>
                  <th onClick={() => handleSort('SerialNo')} style={headerStyle}>
                    Serial No {sortField === 'SerialNo' && getSortIcon(sortDirection)}
                  </th>
                  <th onClick={() => handleSort('EquipmentLocation')} style={headerStyle}>
                    Location {sortField === 'EquipmentLocation' && getSortIcon(sortDirection)}
                  </th>
                  <th onClick={() => handleSort('ServiceLocationAddress')} style={headerStyle}>
                    Service Location Address {sortField === 'ServiceLocationAddress' && getSortIcon(sortDirection)}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedEquipments.map((item) => (
                  <tr key={item.id} className="align-middle">
                    <td>{item.ItemCode || 'N/A'}</td>
                    <td>{item.ItemName || 'N/A'}</td>
                    <td>{item.ModelSeries || 'N/A'}</td>
                    <td>{item.SerialNo || 'N/A'}</td>
                    <td>{item.EquipmentLocation || 'N/A'}</td>
                    <td>{findServiceLocation(item.EquipmentLocation)}</td>
                    <td>
                      <Button variant="outline-primary" size="sm" onClick={() => handleViewDetails(item)}>
                        <Eye className="me-1" /> View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>
      {totalPages > 1 && (
        <Row className="mt-3">
          <Col>
            <Pagination className="justify-content-center">
              <Pagination.First 
                onClick={() => setCurrentPage(1)} 
                disabled={currentPage === 1}
              />
              <Pagination.Prev 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              />
              {[...Array(totalPages).keys()].map((number) => (
                <Pagination.Item
                  key={number + 1}
                  active={number + 1 === currentPage}
                  onClick={() => setCurrentPage(number + 1)}
                >
                  {number + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              />
              <Pagination.Last 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </Col>
        </Row>
      )}

      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Equipment Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEquipment && (
            <Table striped bordered>
              <tbody>
                {Object.entries(selectedEquipment).map(([key, value]) => (
                  <tr key={key}>
                    <td className="fw-bold">{key}</td>
                    <td>{value || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
         
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EquipmentsTab;
