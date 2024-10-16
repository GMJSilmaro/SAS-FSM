import { useRouter } from "next/router";
import { useEffect, useState, Fragment } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../../firebase";
import styles from "./ViewJobs.module.css"; // Import your CSS module
import { Row, Col, Card, Image, OverlayTrigger, Tooltip, Breadcrumb, ListGroup } from "react-bootstrap";
import { Calendar4, Clock, TelephoneFill, PersonFill, CheckCircle, XCircle, PlayCircle, Check, ClipboardCheck, FileText, QuestionCircle } from "react-bootstrap-icons";
import { LoadScript, GoogleMap, Marker } from "@react-google-maps/api"; // Google Map import
import { GridComponent, ColumnsDirective, ColumnDirective, Page, Inject } from '@syncfusion/ej2-react-grids';
// import { registerLicense } from "@syncfusion/ej2-base";

// registerLicense(process.env.REACT_APP_SYNCFUSION_LICENSE_KEY);
// Helper function to fetch worker details from Firebase
const fetchWorkerDetails = async (workerIds) => {
  const workersData = [];
  for (const workerId of workerIds) {
    const workerDoc = await getDoc(doc(db, "users", workerId));
    if (workerDoc.exists()) {
      workersData.push(workerDoc.data());
    }
  }
  return workersData;
};

const JobDetails = () => {
  const router = useRouter();
  const { id } = router.query; // Extract job ID from URL
  const [job, setJob] = useState(null);
  const [workers, setWorkers] = useState([]); // To store worker details
  const [location, setLocation] = useState(null); // Store location for Google Map
  const [activeTab, setActiveTab] = useState("overview"); // State for active tab

  useEffect(() => {
    if (id) {
      const fetchJob = async () => {
        const jobDoc = await getDoc(doc(db, "jobs", id));
        if (jobDoc.exists()) {
          const jobData = jobDoc.data();
          setJob(jobData);

          // Fetch assigned worker details
          const workerData = await fetchWorkerDetails(jobData.assignedWorkers);
          setWorkers(workerData);

          // Get the location details for the Google Map
          const fullAddress = `${jobData.streetAddress}, ${jobData.city}, ${jobData.stateProvince}, ${jobData.country}, ${jobData.zipCode}`;
          getLocationFromAddress(fullAddress);
        } else {
          console.error("Job not found");
        }
      };

      fetchJob();
    }
  }, [id]);

  // Function to get the lat and long from an address using Geocoding API
  const getLocationFromAddress = async (address) => {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(geocodeUrl);
    const data = await response.json();
    if (data.results.length > 0) {
      const location = data.results[0].geometry.location;
      setLocation(location);
    } else {
      console.error("No location found for the given address");
    }
  };

  const renderTaskList = () => {
    return (
      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Task</th>
            <th>Done</th>
            <th>Date/Time</th>
           
          </tr>
        </thead>
        <tbody>
          {job.TaskList && job.TaskList.map((task, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{task.taskName}</td>
              <td>
                <span
                  className={`badge ${task.isComplete ? "bg-success" : "bg-danger"}`}
                >
                  {task.isComplete ? "Completed" : "Not Complete"}
                </span>
              </td>
              <td>{new Date().toISOString()}</td> {/* Use your task's datetime field here */}
             
            </tr>
          ))}
        </tbody>
      </table>
    );
  };
  
const renderEquipmentList = () => {
    console.log(job.equipments); // Log to check data structure

    return (
      <GridComponent dataSource={job.equipments} allowPaging={true} pageSettings={{ pageSize: 5 }}>
        <ColumnsDirective>
          {/* <ColumnDirective 
            header='#' 
            width='50' 
            textAlign='Right' 
            template={(data, index) => index + 1}  // Simple auto-increment index
          /> */}
          <ColumnDirective field='ItemName' header='Item Name' width='150' />
          <ColumnDirective field='Brand' header='Brand' width='100' />
          <ColumnDirective field='ModelSeries' header='Model Series' width='150' />
          <ColumnDirective field='EquipmentLocation' header='Location' width='150' />
          <ColumnDirective field='WarrantyStartDate' header='Warranty Start Date' width='150' format='yMd' />
          <ColumnDirective field='WarrantyEndDate' header='Warranty End Date' width='150' format='yMd' />
        </ColumnsDirective>
        <Inject services={[Page]} />
      </GridComponent>
    );
};

const getStatusIcon = (status) => {
    switch (status) {
      case "C":
        return <FileText size={16} className="text-primary" />; // Icon for Created
      case "CO":
        return <CheckCircle size={16} className="text-primary" />; // Icon for Confirmed
      case "CA":
        return <XCircle size={16} className="text-danger" />; // Icon for Cancelled
      case "JS":
        return <PlayCircle size={16} className="text-warning" />; // Icon for Job Started
      case "JC":
        return <Check size={16} className="text-success" />; // Icon for Job Complete
      case "V":
        return <ClipboardCheck size={16} className="text-info" />; // Icon for Validate
      case "S":
        return <Clock size={16} className="text-secondary" />; // Icon for Scheduled
      default:
        return <QuestionCircle size={16} className="text-muted" />; // Icon for Unknown Status
    }
  };
  

const getJobStatusName = (status) => {
    switch (status) {
      case "C":
        return "Created";
      case "CO":
        return "Confirmed";
      case "CA":
        return "Cancelled";
      case "JS":
        return "Job Started";
      case "JC":
        return "Job Complete";
      case "V":
        return "Validate";
      case "S":
        return "Scheduled";
      default:
        return "Unknown Status"; // Default case for unrecognized status
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case "C":
        return { backgroundColor: "#9e9e9e", color: "#fff" }; // Created (Gray)
      case "CO":
        return { backgroundColor: "#2196f3", color: "#fff" }; // Confirmed (Blue)
      case "CA":
        return { backgroundColor: "#f44336", color: "#fff" }; // Cancelled (Red)
      case "JS":
        return { backgroundColor: "#FFA500", color: "#fff" }; // Job Started (Orange)
      case "JC":
        return { backgroundColor: "#32CD32", color: "#fff" }; // Job Complete (Light Green)
      case "V":
        return { backgroundColor: "#00bcd4", color: "#fff" }; // Validate (Cyan)
      case "S":
        return { backgroundColor: "#607d8b", color: "#fff" }; // Scheduled (Blue Gray)
      default:
        return { backgroundColor: "#9e9e9e", color: "#fff" }; // Default (Gray)
    }
  };
  
  
  

  const mapContainerStyle = {
    width: "100%",
    height: "350px",
  };

  if (!job) {
    return <div>Loading job details...</div>;
  }

  // Render content based on the active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <>
            <h4 className="mb-2">Job Description</h4>
            <p>{job.description || "No description available"}</p>

            <h4 className="mb-2">Address</h4>
            <p>{`${job.streetAddress}, ${job.city}, ${job.stateProvince}, ${job.country} ${job.zipCode}`}</p>

            {location && (
              <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={location}
                  zoom={15}
                >
                  <Marker position={location} />
                </GoogleMap>
              </LoadScript>
            )}
          </>
        );
      
      case "task":
      return renderTaskList();
          
      case "report":
        return <h4 className="mb-2">Report Information Content Goes Here...</h4>;
      case "files":
        return <h4 className="mb-2">Files Content Goes Here...</h4>;
        case "equipment":
            return renderEquipmentList(); // New equipment list rendering
      case "summary":
        return <h4 className="mb-2">Job Summary Content Goes Here...</h4>;
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>

      {/* Tab navigation */}
      <Fragment>
      <h1 className="mb-1 h2 fw-bold">Job Details</h1>
            <Breadcrumb>
              <Breadcrumb.Item href="#">Dashboard</Breadcrumb.Item>
              <Breadcrumb.Item href="#">Jobs</Breadcrumb.Item>
              <Breadcrumb.Item active>{id}</Breadcrumb.Item>
            </Breadcrumb>
        <Row>
          <Col xs={12} className="mb-4">
            <ListGroup as="ul" bsPrefix="nav nav-lb-tab">
              <ListGroup.Item as="li" bsPrefix="nav-item ms-0 me-3 mx-3">
                <a
                  href="#overview"
                  className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
                  onClick={() => setActiveTab("overview")}
                >
                  Overview
                </a>
              </ListGroup.Item>
              <ListGroup.Item as="li" bsPrefix="nav-item ms-0 me-3 mx-3">
                <a
                  href="#equipment"
                  className={`nav-link ${activeTab === "equipment" ? "active" : ""}`}
                  onClick={() => setActiveTab("equipment")}
                >
                  Equipment
                </a>
              </ListGroup.Item>
              <ListGroup.Item as="li" bsPrefix="nav-item ms-0 me-3 mx-3">
                <a
                  href="#task"
                  className={`nav-link ${activeTab === "task" ? "active" : ""}`}
                  onClick={() => setActiveTab("task")}
                >
                  Task
                </a>
              </ListGroup.Item>
              
              <ListGroup.Item as="li" bsPrefix="nav-item ms-0 me-3 mx-3">
                <a
                  href="#report"
                  className={`nav-link ${activeTab === "report" ? "active" : ""}`}
                  onClick={() => setActiveTab("report")}
                >
                  Report
                </a>
              </ListGroup.Item>
              
              <ListGroup.Item as="li" bsPrefix="nav-item ms-0 me-3 mx-3">
                <a
                  href="#files"
                  className={`nav-link ${activeTab === "files" ? "active" : ""}`}
                  onClick={() => setActiveTab("files")}
                >
                  Files
                </a>
              </ListGroup.Item>
             
              <ListGroup.Item as="li" bsPrefix="nav-item ms-0 me-3 mx-3">
                <a
                  href="#summary"
                  className={`nav-link ${activeTab === "summary" ? "active" : ""}`}
                  onClick={() => setActiveTab("summary")}
                >
                  Summary
                </a>
              </ListGroup.Item>
            </ListGroup>
          </Col>
        </Row>
      </Fragment>

      <Row>
        <Col xl={6} xs={12} className="mb-4">
          <Card>
            <Card.Body>{renderTabContent()}</Card.Body>
          </Card>
        </Col>

        {/* Right Column: Customer and Assigned Workers */}
        <Col xl={6} xs={12}>
          <Card className="mb-4">
            <Card.Body className="py-3">
              <Card.Title as="h4">Customer</Card.Title>
              <div className="d-flex align-items-center mb-2">
                <PersonFill size={16} className="text-primary me-2" />
                <p className="mb-0">
                  {job.firstName || "Unknown Customer"} {job.lastName || "Unknown Customer"}
                </p>
              </div>
              <div className="d-flex align-items-center mb-2">
                <TelephoneFill size={16} className="text-primary me-2" />
                <p className="mb-0">{job.mobilePhone || "Unknown Mobile Phone"}</p>
              </div>
              <div className="d-flex align-items-center mb-2">
                <TelephoneFill size={16} className="text-primary me-2" />
                <p className="mb-0">{job.phoneNumber || "Unknown Phone Number"}</p>
              </div>
              <div className="d-flex align-items-center mb-2">
                <PersonFill size={16} className="text-primary me-2" />
                <p className="mb-0">{job.customerName || "Unknown Company"}</p>
              </div>
            </Card.Body>

            <Card.Body className="border-top py-3">
              <Card.Title as="h4">Assigned Workers</Card.Title>
              <div className="d-flex align-items-center">
                {workers.map((worker, index) => (
                  <OverlayTrigger
                    key={index}
                    placement="top"
                    overlay={
                      <Tooltip>
                        {worker.firstName} {worker.lastName}
                      </Tooltip>
                    }
                  >
                    <Image
                      src={worker.profilePicture || "/images/default-avatar.jpg"}
                      alt={worker.firstName}
                      className="avatar-sm avatar rounded-circle me-2"
                    />
                  </OverlayTrigger>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Schedule */}
          <Card className="mb-4">
            <Card.Body className="py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <Calendar4 size={16} className="text-primary" />
                  <div className="ms-2">
                    <h5 className="mb-0 text-body">Start Date</h5>
                  </div>
                </div>
                <div>
                  <p className="text-dark mb-0 fw-semi-bold">{job.startDate}</p>
                </div>
              </div>
            </Card.Body>
            <Card.Body className="border-top py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <Calendar4 size={16} className="text-primary" />
                  <div className="ms-2">
                    <h5 className="mb-0 text-body">End Date</h5>
                  </div>
                </div>
                <div>
                  <p className="text-dark mb-0 fw-semi-bold">{job.endDate}</p>
                </div>
              </div>
            </Card.Body>
            <Card.Body className="border-top py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <Clock size={16} className="text-primary" />
                  <div className="ms-2">
                    <h5 className="mb-0 text-body">Estimated Duration</h5>
                  </div>
                </div>
                <div>
                  <p className="text-dark mb-0 fw-semi-bold">{job.duration}</p>
                </div>
              </div>
            </Card.Body>
            <Card.Body className="border-top py-3">
  <div className="d-flex justify-content-between align-items-center">
    <div className="d-flex align-items-center">
      {getStatusIcon(job.jobStatus)} {/* Use the status icon here */}
      <div className="ms-2">
        <h5 className="mb-0 text-body">Status</h5>
      </div>
    </div>
    <div>
      <span 
        className="badge" 
        style={getStatusColor(job.jobStatus)} // Set background and text color dynamically
      >
        {getJobStatusName(job.jobStatus)} {/* Display full status name */}
      </span>
    </div>
  </div>
</Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default JobDetails;