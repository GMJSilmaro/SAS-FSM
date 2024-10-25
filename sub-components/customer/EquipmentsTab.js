import React, { useState, useEffect } from 'react';
import { Table, Spinner, Button, Modal, Form, InputGroup, Pagination, Container, Row, Col } from 'react-bootstrap';
import { Search, Eye } from 'react-bootstrap-icons';

const EquipmentsTab = ({ customerData }) => {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [equipmentsPerPage] = useState(10);

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
          <InputGroup>
            <InputGroup.Text>
              <Search />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </InputGroup>
        </Col>
      </Row>
      <Row>
        <Col>
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Model Series</th>
                  <th>Serial No</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentEquipments.map((item, index) => (
                  <tr key={index}>
                    <td>{item.ItemCode || 'N/A'}</td>
                    <td>{item.ItemName || 'N/A'}</td>
                    <td>{item.ModelSeries || 'N/A'}</td>
                    <td>{item.SerialNo || 'N/A'}</td>
                    <td>{item.EquipmentLocation || 'N/A'}</td>
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
