import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Tabs,
  Tab,
  Breadcrumb,
  Button
} from 'react-bootstrap';
import { useRouter } from 'next/router';
import { GeeksSEO } from 'widgets';
import { AccountInfoTab } from 'sub-components/customer/AccountInfoTab';
import { ServiceLocationTab } from 'sub-components/customer/ServiceLocationTab';
import EquipmentsTab from 'sub-components/customer/EquipmentsTab';
import { DocumentsTab } from 'sub-components/customer/DocumentsTab';
import { HistoryTab } from 'sub-components/customer/HistoryTab';

const ViewCustomer = () => {
  const [activeTab, setActiveTab] = useState('accountInfo');
  const [customerData, setCustomerData] = useState(null);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { id } = router.query; // This will be the CardCode

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (id) {
        try {
          setLoading(true);
          // Fetch customer data
          const response = await fetch(`/api/getCustomerCode?cardCode=${id}`);
          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Failed to fetch customer details: ${errorData}`);
          }
          const customerInfo = await response.json();
          setCustomerData(customerInfo);

          // Fetch equipment data
          const equipmentResponse = await fetch('/api/getEquipments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              cardCode: id
            })
          });
          if (equipmentResponse.ok) {
            const equipmentData = await equipmentResponse.json();
            setEquipments(equipmentData);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          setError(error.message || 'Failed to load data.');
        } finally {
          setLoading(false);
        }
      }
    };
  
    fetchCustomerData();
  }, [id]);

  const handleTabChange = (key) => {
    if (key) setActiveTab(key);
  };

  const handleEdit = () => {
    router.push(`/dashboard/customers/edit/${id}`);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!customerData) {
    return <div>No customer data found.</div>;
  }

  return (
    <Container>
      <GeeksSEO title={`View Customer: ${customerData.cardName || ''} | FSM Portal`} />
      <Row>
        <Col lg={12} md={12} sm={12}>
          <div className="border-bottom pb-4 mb-4 d-flex align-items-center justify-content-between">
            <div className="mb-3 mb-md-0">
              <h1 className="mb-1 h2 fw-bold">View Customer: {customerData.CardName}</h1>
              <Breadcrumb>
                <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item href="/dashboard/customers/list">Customers</Breadcrumb.Item>
                <Breadcrumb.Item active>View Customer</Breadcrumb.Item>
              </Breadcrumb>
            </div>
            {/* <Button variant="primary" onClick={handleEdit}>Edit Customer</Button> */}
          </div>
        </Col>
      </Row>

      <Row>
        <Col xl={12} lg={12} md={12} sm={12}>
          <Card className="shadow-sm">
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={handleTabChange}
                className="mb-3"
              >
                <Tab eventKey="accountInfo" title="Account Info">
                  <AccountInfoTab customerData={customerData} />
                </Tab>
                <Tab eventKey="serviceLocation" title="Service Location">
                  <ServiceLocationTab customerData={customerData} />
                </Tab>
                <Tab eventKey="equipments" title="Equipments">
                    <EquipmentsTab customerData={customerData} equipments={equipments} />
                </Tab>
                <Tab eventKey="documents" title="Documents">
                  <DocumentsTab customerData={customerData} />
                </Tab>
                <Tab eventKey="history" title="History">
                  <HistoryTab customerData={customerData} />
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ViewCustomer;
