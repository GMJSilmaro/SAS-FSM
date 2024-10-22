import { useRouter } from "next/router";
import { useEffect, useState, Fragment } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../../firebase";
import styles from "./ViewJobs.module.css"; // Import your CSS module
import {
  Row,
  Col,
  Card,
  Image,
  OverlayTrigger,
  Tooltip,
  Breadcrumb,
  ListGroup,
} from "react-bootstrap";
import {
  Calendar4,
  Clock,
  TelephoneFill,
  PersonFill,
  CheckCircle,
  XCircle,
  PlayCircle,
  Check,
  ClipboardCheck,
  FileText,
  QuestionCircle,
} from "react-bootstrap-icons";
import { LoadScript, GoogleMap, Marker } from "@react-google-maps/api"; // Google Map import

import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Page,
  Inject,
} from "@syncfusion/ej2-react-grids";

// Helper function to fetch worker details from Firebase
const fetchWorkerDetails = async (workerIds) => {
  const workersData = [];
  if (workerIds && workerIds.length > 0) {
    for (const workerId of workerIds) {
      const workerDoc = await getDoc(doc(db, "users", workerId));
      if (workerDoc.exists()) {
        workersData.push(workerDoc.data());
      }
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
    if (id && typeof id === "string") {
      const fetchJob = async () => {
        try {
          const jobDoc = await getDoc(doc(db, "jobs", id));
          if (jobDoc.exists()) {
            const jobData = jobDoc.data();
            setJob(jobData);
            console.log("Job Data:", jobData);

            // Extract worker IDs from assignedWorkers array
            const assignedWorkers = jobData.assignedWorkers || [];
            if (Array.isArray(assignedWorkers)) {
              const workerIds = assignedWorkers.map(
                (worker) => worker.workerId
              ); // Adjust this based on the structure
              const workerData = await fetchWorkerDetails(workerIds); // Pass only IDs
              setWorkers(workerData);
            } else {
              console.error("assignedWorkers is not an array");
            }

            // Log the entire location object for debugging
            console.log("Location Object:", jobData.location);

            // Access coordinates (latitude, longitude) from location.coordinates
            const coordinates = jobData.location?.coordinates;
            if (coordinates && coordinates.latitude && coordinates.longitude) {
              console.log("Coordinates Found:", coordinates.latitude, coordinates.longitude);
              setLocation({ 
                lat: parseFloat(coordinates.latitude), 
                lng: parseFloat(coordinates.longitude) 
              });
            } else {
              console.error("No valid coordinates found for the given job");
            }
          } else {
            console.error("Job not found");
          }
        } catch (error) {
          console.error("Error fetching job:", error);
        }
      };

      fetchJob();
    }
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
          {job.taskList &&
            job.taskList.map((task, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{task.taskName || "N/A"}</td>
                <td>
                  <span
                    className={`badge ${
                      task.isComplete ? "bg-success" : "bg-danger"
                    }`}
                  >
                    {task.isComplete ? "Completed" : "Not Complete"}
                  </span>
                </td>
                <td>{task.completionDate || "N/A"}</td>
              </tr>
            ))}
        </tbody>
      </table>
    );
  };

  const renderEquipmentList = () => {
    return (
      <GridComponent
        dataSource={job.equipments || []}
        allowPaging={true}
        pageSettings={{ pageSize: 5 }}
      >
        <ColumnsDirective>
          <ColumnDirective field="itemName" header="Item Name" width="150" />
          <ColumnDirective field="brand" header="Brand" width="100" />
          <ColumnDirective
            field="modelSeries"
            header="Model Series"
            width="150"
          />
          <ColumnDirective
            field="equipmentLocation"
            header="Location"
            width="150"
          />
          <ColumnDirective
            field="warrantyStartDate"
            header="Warranty Start Date"
            width="150"
            format="yMd"
          />
          <ColumnDirective
            field="warrantyEndDate"
            header="Warranty End Date"
            width="150"
            format="yMd"
          />
        </ColumnsDirective>
        <Inject services={[Page]} />
      </GridComponent>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <>
            <h4 className="mb-2">Job Description</h4>
            <div
              dangerouslySetInnerHTML={{
                __html: job.jobDescription || "No description available",
              }}
            />
            <h4 className="mb-2">Address</h4>
            <p>
              {`${job.location?.address?.streetAddress || ""} 
                ${job.location?.address?.city || ""} 
                ${job.location?.address?.stateProvince || ""}
                ${job.location?.address?.country || ""} 
                ${job.location?.address?.postalCode || ""}`}
            </p>

            {location && (
              <LoadScript
                googleMapsApiKey={process.env.GOOGLE_MAPS_API_KEY}
              >
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "350px" }}
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
      case "equipment":
        return renderEquipmentList();
      default:
        return <h4 className="mb-2">Content not available.</h4>;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Created":
        return <FileText size={16} className="text-primary" />; // Icon for Created
      case "Confirmed":
        return <CheckCircle size={16} className="text-primary" />; // Icon for Confirmed
      case "Cancelled":
        return <XCircle size={16} className="text-danger" />; // Icon for Cancelled
      case "Job Started":
        return <PlayCircle size={16} className="text-warning" />; // Icon for Job Started
      case "Job Complete":
        return <Check size={16} className="text-success" />; // Icon for Job Complete
      case "Validate":
        return <ClipboardCheck size={16} className="text-info" />; // Icon for Validate
      case "Scheduled":
        return <Clock size={16} className="text-secondary" />; // Icon for Scheduled
      default:
        return <QuestionCircle size={16} className="text-muted" />; // Icon for Unknown Status
    }
  };

  const getJobStatusName = (status) => {
    switch (status) {
      case "Created":
        return "Created";
      case "Confirmed":
        return "Confirmed";
      case "Cancelled":
        return "Cancelled";
      case "Job Started":
        return "Job Started";
      case "Job Complete":
        return "Job Complete";
      case "Validate":
        return "Validate";
      case "Scheduled":
        return "Scheduled";
      default:
        return "Unknown Status";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Created":
        return { backgroundColor: "#9e9e9e", color: "#fff" };
      case "Confirmed":
        return { backgroundColor: "#2196f3", color: "#fff" };
      case "Cancelled":
        return { backgroundColor: "#f44336", color: "#fff" };
      case "Job Started":
        return { backgroundColor: "#FFA500", color: "#fff" };
      case "Job Complete":
        return { backgroundColor: "#32CD32", color: "#fff" };
      case "Validate":
        return { backgroundColor: "#00bcd4", color: "#fff" };
      case "Scheduled":
        return { backgroundColor: "#607d8b", color: "#fff" };
      default:
        return { backgroundColor: "#9e9e9e", color: "#fff" };
    }
  };

  if (!job) {
    return <div>Loading job details...</div>;
  }

  return (
    <div className={styles.container}>
      <Fragment>
        <h1 className="mb-1 h2 fw-bold">Job Details</h1>
        <Breadcrumb>
          <Breadcrumb.Item href="#">Dashboard</Breadcrumb.Item>
          <Breadcrumb.Item href="/dashboard/jobs/list-jobs">
            Jobs
          </Breadcrumb.Item>
          <Breadcrumb.Item active>{id}</Breadcrumb.Item>
        </Breadcrumb>

        <Row>
          <Col xs={12} className="mb-4">
            <ListGroup as="ul" bsPrefix="nav nav-lb-tab">
              <ListGroup.Item as="li" bsPrefix="nav-item ms-0 me-3 mx-3">
                <a
                  href="#overview"
                  className={`nav-link ${
                    activeTab === "overview" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("overview")}
                >
                  Overview
                </a>
              </ListGroup.Item>
              <ListGroup.Item as="li" bsPrefix="nav-item ms-0 me-3 mx-3">
                <a
                  href="#equipment"
                  className={`nav-link ${
                    activeTab === "equipment" ? "active" : ""
                  }`}
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
              {/* Customer Name (Contact) */}
              <div className="d-flex align-items-center mb-2">
                <PersonFill size={16} className="text-primary me-2" />
                <p className="mb-0">
                  {job.contact?.firstName || "Unknown Customer"}{" "}
                  {job.contact?.lastName || "Unknown Customer"}
                </p>
              </div>

              {/* Mobile Phone (Contact) */}
              <div className="d-flex align-items-center mb-2">
                <TelephoneFill size={16} className="text-primary me-2" />
                <p className="mb-0">
                  {job.contact?.mobilePhone || "Unknown Mobile Phone"}
                </p>
              </div>

              {/* Phone Number (Contact) */}
              <div className="d-flex align-items-center mb-2">
                <TelephoneFill size={16} className="text-primary me-2" />
                <p className="mb-0">
                  {job.contact?.phoneNumber || "Unknown Phone Number"}
                </p>
              </div>

              {/* Customer Company Name */}
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
                      src={
                        worker.profilePicture || "/images/default-avatar.jpg"
                      }
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
                  <p className="text-dark mb-0 fw-semi-bold">
                    {formatDate(job.startDate)}
                  </p>
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
                  <p className="text-dark mb-0 fw-semi-bold">
                    {formatDate(job.endDate)}
                  </p>
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
                  <p className="text-dark mb-0 fw-semi-bold">
                    {`${job.estimatedDurationHours || 0} hrs ${
                      job.estimatedDurationMinutes || 0
                    } mins`}
                  </p>
                </div>
              </div>
            </Card.Body>
            <Card.Body className="border-top py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  {getStatusIcon(job.jobStatus)}
                  <div className="ms-2">
                    <h5 className="mb-0 text-body">Status</h5>
                  </div>
                </div>
                <div>
                  <span className="badge" style={getStatusColor(job.jobStatus)}>
                    {getJobStatusName(job.jobStatus)}
                  </span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Row>
          <Col xs={12} className="mb-4">
            <div className="d-flex justify-content-end">
              {" "}
              {/* Flexbox container for right alignment */}
              <button
                className="btn btn-primary" // Bootstrap button styles
                onClick={() => router.push(`/dashboard/jobs/update-jobs/${id}`)} // Redirect to edit page
              >
                Edit Job
              </button>
            </div>
          </Col>
        </Row>
      </Row>
    </div>
  );
};

export default JobDetails;
