import { Row, Col, Container, Card, Breadcrumb } from 'react-bootstrap';
import { GeeksSEO, PageHeading } from 'widgets'
import { toast, ToastContainer } from 'react-toastify';

import AddNewJobs from 'sub-components/dashboard/jobs/CreateJobs';

const CreateJobs = () => {
  return (

    <Container>
    <GeeksSEO title="Add Job | SAS - SAP B1 Portal" />
    <Row>
    <Row>
          <Col lg={12} md={12} sm={12}>
            <div className="border-bottom pb-4 mb-4 d-flex align-items-center justify-content-between">
              <div className="mb-3 mb-md-0">
                <h1 className="mb-1 h2 fw-bold">Create New Job</h1>
                <Breadcrumb>
                  <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                  <Breadcrumb.Item href="#">Jobs</Breadcrumb.Item>
                  <Breadcrumb.Item active>Add new Jobs</Breadcrumb.Item>
                </Breadcrumb>
              </div>
            </div>
          </Col>
        </Row>
        <Col xl={12} lg={12} md={12} sm={12}>
            <Card className="shadow-sm">
            <ToastContainer />
                <Card.Body>
                  <AddNewJobs />
                </Card.Body>
            </Card>
        </Col>
    </Row>
</Container>

  )
}

export default CreateJobs;
