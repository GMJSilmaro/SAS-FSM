import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Tabs,
  Tab,
  Breadcrumb,
  Button,
  Spinner
} from 'react-bootstrap';
import { useRouter } from 'next/router';
import { GeeksSEO } from 'widgets';
import { AccountInfoTab } from 'sub-components/customer/AccountInfoTab';
import { ServiceLocationTab } from 'sub-components/customer/ServiceLocationTab';
import EquipmentsTab from 'sub-components/customer/EquipmentsTab';
import { DocumentsTab } from 'sub-components/customer/DocumentsTab';
import { HistoryTab } from 'sub-components/customer/HistoryTab';
import { NotesTab } from 'sub-components/customer/NotesTab';
import QuotationsTab from 'sub-components/customer/QuotationsTab';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ViewCustomer = () => {
  const [activeTab, setActiveTab] = useState('accountInfo');
  const [customerData, setCustomerData] = useState(null);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { id } = router.query;
  
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const [customerResponse, equipmentResponse] = await Promise.all([
          fetch(`/api/getCustomerCode?cardCode=${id}`),
          fetch('/api/getEquipments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardCode: id })
          })
        ]);

        if (!customerResponse.ok) {
          throw new Error(`Failed to fetch customer details: ${await customerResponse.text()}`);
        }

        const [customerInfo, equipmentData] = await Promise.all([
          customerResponse.json(),
          equipmentResponse.ok ? equipmentResponse.json() : []
        ]);

        setCustomerData(customerInfo);
        setEquipments(equipmentData);

        const customerName = localStorage.getItem('viewCustomerToast');
        if (customerName) {
          toast.info(`Viewing details for ${customerName}`);
          localStorage.removeItem('viewCustomerToast');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to load data.');
      } finally {
        setLoading(false);
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
    return (
      <Container className="mt-5">
           <Row>
          <Col lg={12}>
            <div className="border-bottom pb-4 mb-4 d-flex align-items-center justify-content-between">
              <div className="mb-3">
                <h1 className="mb-1 h2 fw-bold">Customers</h1>
                <Breadcrumb>
                  <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                  <Breadcrumb.Item href="#">Customers</Breadcrumb.Item>
                  <Breadcrumb.Item active>Customer List</Breadcrumb.Item>
                </Breadcrumb>
              </div>
            </div>
          </Col>
        </Row>
        <Row>
          <Col>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Spinner animation="border" role="status" variant="primary" style={{ width: '3rem', height: '3rem' }}>
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-3">Loading customer data...</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Row>
          <Col>
            <Card className="text-center">
              <Card.Body>
                <Card.Title className="text-danger">Error</Card.Title>
                <Card.Text>{error}</Card.Text>
                <Button variant="primary" onClick={() => router.push('/dashboard/customers/list')}>
                  Back to Customers List
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  if (!customerData) {
    return (
      <Container className="mt-5">
        <Row>
          <Col>
            <Card className="text-center">
              <Card.Body>
                <Card.Title>No Data Found</Card.Title>
                <Card.Text>No customer data found for the given ID.</Card.Text>
                <Button variant="primary" onClick={() => router.push('/dashboard/customers/list')}>
                  Back to Customers List
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container>
      <ToastContainer position="top-right" autoClose={3000} />
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
                <Tab eventKey="serviceLocation" title="Address">
                  <ServiceLocationTab customerData={customerData} />
                </Tab>
                <Tab eventKey="notes" title="Notes">
                  <NotesTab customerId={id} />
                </Tab>
                <Tab eventKey="equipments" title="Equipments">
                    <EquipmentsTab customerData={customerData} equipments={equipments} />
                </Tab>
                <Tab eventKey="history" title="Job History">
                  <HistoryTab customerData={customerData} customerID={id} />
                </Tab>
                <Tab eventKey="quotations" title="Quotations">
                  <QuotationsTab customerId={id} />
                </Tab>
                
                <Tab eventKey="documents" title="Documents">
                  <DocumentsTab customerData={customerData} />
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
