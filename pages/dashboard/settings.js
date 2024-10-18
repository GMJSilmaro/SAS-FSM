import React, { useState } from 'react';
import { Container, Row, Col, Card, ListGroup, Breadcrumb } from 'react-bootstrap';
import { useRouter } from 'next/router';
import { FaCog, FaUser, FaTools, FaClipboardList } from 'react-icons/fa';
import Image from 'next/image'; // Import Image component

const Settings = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('company-info');

  const handleNavigation = (tab) => {
    setActiveTab(tab);
  };

  const handleMenuClick = (menu) => {
    console.log(`Navigating to: ${menu}`);
    // You can replace the console.log with router.push(menu) to navigate
    // For example: router.push(`/${menu}`)
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'company-info':
        return (
          <Card className="shadow-sm">
            <Card.Body>
              <h5>Company Information</h5>
              <Row>
                <Col xs={4} className="fw-bold">Logo:</Col>
                <Col xs={8}>
                  <Image 
                    src="/images/SAS-LOGO.png" 
                    alt="Company Logo" 
                    width={200} 
                    height={150} 
                  />
                </Col>
              </Row>
              <Row>
                <Col xs={4} className="fw-bold">Company Name:</Col>
                <Col xs={8}>SAS Air Conditioning</Col>
              </Row>
              <Row>
                <Col xs={4} className="fw-bold">Address:</Col>
                <Col xs={8}>123 Cool Breeze Avenue, CityName, 12345</Col>
              </Row>
              <Row>
                <Col xs={4} className="fw-bold">Email:</Col>
                <Col xs={8}>contact@sasairconditioning.com</Col>
              </Row>
              <Row>
                <Col xs={4} className="fw-bold">Phone:</Col>
                <Col xs={8}>(123) 456-7890</Col>
              </Row>
              <Row>
                <Col xs={4} className="fw-bold">Website:</Col>
                <Col xs={8}>
                  <a href="https://www.sasairconditioning.com" target="_blank" rel="noreferrer">
                    www.sasairconditioning.com
                  </a>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        );
      case 'options':
        return (
          <Card className="shadow-sm">
            <Card.Body>
              <h5>Options</h5>
              <p className="text-muted">Manage your company information, preferences, and various settings</p>
              
              <h6>General</h6>
              <ListGroup variant="flush">
                <ListGroup.Item action onClick={() => handleMenuClick('general/company-info')}>
                  <i data-feather="info"></i> Company Information
                  <p className="text-muted small mb-0">View and edit your company&apos;s information</p>
                </ListGroup.Item>
                <ListGroup.Item action onClick={() => handleMenuClick('general/field-worker-app-settings')}>
                  <i data-feather="smartphone"></i> Field Worker App Settings
                  <p className="text-muted small mb-0">Configure settings for field worker applications</p>
                </ListGroup.Item>
              </ListGroup>
          
              <h6 className="mt-4">Access Management</h6>
              <ListGroup variant="flush">
                <ListGroup.Item action onClick={() => handleMenuClick('access-management/login-history')}>
                  <i data-feather="lock"></i> Login History
                  <p className="text-muted small mb-0">Track and review login activity</p>
                </ListGroup.Item>
              </ListGroup>

            </Card.Body>
          </Card>
        );
      case 'notifications':
        return (
          <Card className="shadow-sm">
            <Card.Body>
              <h5>Notifications</h5>
              <p>Manage Text Message/Mail notifications .</p>
            </Card.Body>
          </Card>
        );
      case 'email':
        return (
          <Card className="shadow-sm">
            <Card.Body>
              <h5>Email</h5>
              <p>Manage your Automated Email to sent for Workers.</p>
            </Card.Body>
          </Card>
        );
      case 'schedulingwindows':
        return (
          <Card className="shadow-sm">
            <Card.Body>
              <h5>Scheduling Window</h5>
              <p>Set default scheduling windows for jobs (Morning, Afternoon, etc.).</p>
            </Card.Body>
          </Card>
        );
      case 'scheduling':
          return (
            <Card className="shadow-sm">
              <Card.Body>
                <h5>Scheduling</h5>
                <p>Set Work Hours and Scheduling Hours.</p>
              </Card.Body>
            </Card>
          );
      default:
        return null;
    }
  };

  return (
    <Container fluid className="py-1">
      {/* Dynamic Breadcrumb */}
      <Row className="mb-4">
        <Col>
          <Breadcrumb>
            <Breadcrumb.Item href="/">Dashboard</Breadcrumb.Item>
            <Breadcrumb.Item active>Settings</Breadcrumb.Item>
          </Breadcrumb>
        </Col>
      </Row>

      {/* Main Content */}
      <Row>
        {/* Sidebar */}
        <Col lg={3} md={4} sm={12} className="mb-4">
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">Settings</Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item action onClick={() => handleNavigation('company-info')}>
                <FaUser className="me-2" /> Company Information
              </ListGroup.Item>
              <ListGroup.Item action onClick={() => handleNavigation('options')}>
                <FaCog className="me-2" /> Options
              </ListGroup.Item>
              <ListGroup.Item action onClick={() => handleNavigation('notifications')}>
                <FaUser className="me-2" /> Notifications
              </ListGroup.Item>
              <ListGroup.Item action onClick={() => handleNavigation('email')}>
                <FaUser className="me-2" /> Email
              </ListGroup.Item>
              <Card.Header className="bg-primary text-white">Jobs and Projects</Card.Header>
              <ListGroup.Item action onClick={() => handleNavigation('schedulingwindows')}>
                <FaTools className="me-2" /> Scheduling Windows
              </ListGroup.Item>
              <ListGroup.Item action onClick={() => handleNavigation('scheduling')}>
                <FaTools className="me-2" /> Scheduling 
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>

        {/* Main Settings Sections */}
        <Col lg={9} md={8} sm={12}>
          {renderContent()}
        </Col>
      </Row>
    </Container>
  );
};

export default Settings;
