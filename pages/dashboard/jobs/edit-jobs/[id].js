import { Row, Col, Container, Card, Breadcrumb } from 'react-bootstrap';
import { GeeksSEO } from 'widgets'
import { toast, ToastContainer } from 'react-toastify';
import EditJobs from 'sub-components/dashboard/jobs/EditJobs';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { db } from '../../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

// Create a simple LoadingSpinner component
const LoadingSpinner = () => (
  <div className="text-center py-5">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
    <div className="mt-3">Loading job details...</div>
  </div>
);

// Use the same validation helper function
const validateJobForm = (formData) => {
  const requiredFields = {
    jobName: 'Job Name',
    jobDescription: 'Job Description',
    priority: 'Priority Level',
    startDate: 'Start Date',
    endDate: 'End Date',
    startTime: 'Start Time',
    endTime: 'End Time',
    customerID: 'Customer',
    'location.locationName': 'Location Name',
    'location.address.streetAddress': 'Street Address',
    'location.address.city': 'City',
    'location.address.stateProvince': 'State/Province',
    'location.address.postalCode': 'Postal Code',
    assignedWorkers: 'Assigned Workers',
    'contact.contactID': 'Contact Person',
    'jobContactType.code': 'Job Contact Type',
    'taskList': 'Tasks'
  };

  const missingFields = [];
  
  Object.entries(requiredFields).forEach(([field, label]) => {
    const value = field.includes('.') ? 
      field.split('.').reduce((obj, key) => obj?.[key], formData) : 
      formData[field];
      
    if (!value || (Array.isArray(value) && value.length === 0)) {
      missingFields.push(label);
    }
  });

  if (formData.taskList && formData.taskList.length === 0) {
    missingFields.push('Please add at least 1 task to proceed');
  } else if (formData.taskList) {
    formData.taskList.forEach((task, index) => {
      if (!task.taskName?.trim()) {
        missingFields.push(`Task ${index + 1}: Task Name is required`);
      }
      if (!task.assignedTo) {
        missingFields.push(`Task ${index + 1}: Assigned Worker is required`);
      }
    });
  }

  return missingFields;
};

const EditJobPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [jobData, setJobData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const jobRef = doc(db, "jobs", id);
        const jobSnap = await getDoc(jobRef);

        if (jobSnap.exists()) {
          const data = {
            id: jobSnap.id,
            ...jobSnap.data()
          };
          
          setJobData(data);
        } else {
          setError("Job not found");
          toast.error("Job not found");
        }
      } catch (err) {
        console.error("Error fetching job:", err);
        setError(err.message);
        toast.error(`Error fetching job: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchJobData();
    }
  }, [id]);

  if (!id) {
    return <LoadingSpinner />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Container>
        <div className="text-center py-5">
          <h3 className="text-danger">Error</h3>
          <p>{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={() => router.push('/dashboard/jobs/list-jobs')}
          >
            Back to Jobs List
          </button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <GeeksSEO title="Edit Job | SAS&ME - SAP B1 | Portal" />
      <Row>
        <Col lg={12} md={12} sm={12}>
          <div
            style={{
              background: "linear-gradient(90deg, #4171F5 0%, #3DAAF5 100%)",
              padding: "1.5rem 2rem",
              borderRadius: "0 0 24px 24px",
              marginTop: "-39px",
              marginLeft: "10px",
              marginRight: "10px",
              marginBottom: "20px",
            }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div className="d-flex flex-column">
                <div className="mb-3">
                  <h1
                    className="mb-2"
                    style={{
                      fontSize: "28px",
                      fontWeight: "600",
                      color: "#FFFFFF",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Edit Job #{jobData?.jobNo}
                  </h1>
                  <p
                    className="mb-2"
                    style={{
                      fontSize: "16px",
                      color: "rgba(255, 255, 255, 0.7)",
                      fontWeight: "400",
                      lineHeight: "1.5",
                    }}
                  >
                    Update job details, assignments, and schedules
                  </p>
                </div>

                <nav
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  <div className="d-flex align-items-center">
                    <i
                      className="fe fe-home"
                      style={{ color: "rgba(255, 255, 255, 0.7)" }}
                    ></i>
                    <Link
                      href="/dashboard"
                      className="text-decoration-none ms-2"
                      style={{ color: "rgba(255, 255, 255, 0.7)" }}
                    >
                      Dashboard
                    </Link>
                    <span
                      className="mx-2"
                      style={{ color: "rgba(255, 255, 255, 0.7)" }}
                    >
                      /
                    </span>
                    <Link
                      href="/dashboard/jobs/list-jobs"
                      className="text-decoration-none"
                      style={{ color: "rgba(255, 255, 255, 0.7)" }}
                    >
                      Jobs
                    </Link>
                    <span
                      className="mx-2"
                      style={{ color: "rgba(255, 255, 255, 0.7)" }}
                    >
                      /
                    </span>
                    <span style={{ color: "#FFFFFF" }}>Edit Job</span>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </Col>
        <Col xl={12} lg={12} md={12} sm={12}>
          <Card className="shadow-sm">
            <ToastContainer />
            <Card.Body>
              {jobData && (
                <EditJobs 
                  initialJobData={jobData} 
                  jobId={id}
                  validateJobForm={validateJobForm} 
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default EditJobPage; 