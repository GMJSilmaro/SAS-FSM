import React, { useState, useEffect } from 'react';
import { Table, Spinner } from 'react-bootstrap';

const EquipmentsTab = ({ customerData }) => {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Item Code</th>
            <th>Item Name</th>
            <th>Serial No</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          {equipments.map((item, index) => (
            <tr key={index}>
              <td>{item.ItemCode || 'N/A'}</td>
              <td>{item.ItemName || 'N/A'}</td>
              <td>{item.SerialNo || 'N/A'}</td>
              <td>{item.EquipmentLocation || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default EquipmentsTab;