import React, { useState, useEffect } from 'react';
import { Table, Spinner, Button, Modal, Form, InputGroup } from 'react-bootstrap';
import { Search, Eye, FileText } from 'react-bootstrap-icons';

const EquipmentsTab = ({ customerData }) => {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);

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
    <div className="p-4">
      <h3 className="mb-4">Customer Equipment</h3>
      <InputGroup className="mb-3">
        <InputGroup.Text>
          <Search />
        </InputGroup.Text>
        <Form.Control
          placeholder="Search equipment..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </InputGroup>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Item Code</th>
            <th>Item Name</th>
            <th>Serial No</th>
            <th>Location</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEquipments.map((item, index) => (
            <tr key={index}>
              <td>{item.ItemCode || 'N/A'}</td>
              <td>{item.ItemName || 'N/A'}</td>
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
    </div>
  );
};

export default EquipmentsTab;
