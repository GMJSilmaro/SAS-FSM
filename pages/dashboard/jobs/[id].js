import { useRouter } from "next/router";
import { useEffect, useState, Fragment } from "react";
import { getDoc, doc, setDoc } from "firebase/firestore";
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
  Form,
  Button,
  Tab,
  Tabs,
  Modal,
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
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api"; // Google Map import

import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Page,
  Inject,
} from "@syncfusion/ej2-react-grids";

// Add this import at the top of your file
import defaultAvatar from '/public/images/avatar/NoProfile.png'; // Adjust the path as needed
import Link from 'next/link'; // Add this import

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

// Modified geocodeAddress function
const geocodeAddress = async (address, jobId) => {
  try {
    // Check if coordinates are already cached
    const jobDoc = await getDoc(doc(db, "jobs", jobId));
    const jobData = jobDoc.data();
    
    if (jobData?.cachedCoordinates) {
      return jobData.cachedCoordinates;
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
      const { lat, lng } = data.results[0].geometry.location;
      const coordinates = { lat, lng };
      
      // Cache the coordinates
      await setDoc(
        doc(db, "jobs", jobId), 
        { cachedCoordinates: coordinates }, 
        { merge: true }
      );
      
      return coordinates;
    } else {
      console.error('Geocoding response error:', data.status);
      return null;
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

const JobDetails = () => {
  const router = useRouter();
  const { id } = router.query; // Extract job ID from URL
  const [job, setJob] = useState(null);
  const [workers, setWorkers] = useState([]); // To store worker details
  const [location, setLocation] = useState(null); // Store location for Google Map
  const [activeTab, setActiveTab] = useState("overview"); // State for active tab
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [workerComments, setWorkerComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [images, setImages] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [mapKey, setMapKey] = useState(0); // Add this line
  const [isMapScriptLoaded, setIsMapScriptLoaded] = useState(false);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    // Add this to ensure the Google Maps script is loaded before using it
    libraries: ['places']
  });

  useEffect(() => {
    if (id && typeof id === "string") {
      const fetchJob = async () => {
        try {
          const jobDoc = await getDoc(doc(db, "jobs", id));
          if (jobDoc.exists()) {
            const jobData = jobDoc.data();
            setJob(jobData);
            
            // Extract worker IDs from assignedWorkers array
            const assignedWorkers = jobData.assignedWorkers || [];
            if (Array.isArray(assignedWorkers)) {
              const workerIds = assignedWorkers.map(worker => worker.workerId);
              const workerData = await fetchWorkerDetails(workerIds);
              setWorkers(workerData);
            } else {
              console.error("assignedWorkers is not an array");
            }

            // Use the street address to get coordinates
            const streetAddress = jobData.location?.address?.streetAddress;
            if (streetAddress) {
              const coordinates = await geocodeAddress(streetAddress, id);
              if (coordinates) {
                setLocation(coordinates);
                setMapKey(prevKey => prevKey + 1); // Force map re-render
              } else {
                console.error("No valid coordinates found for the given address");
              }
            } else {
              console.error("No valid street address found for the given job");
            }

            setTechnicianNotes(jobData.technicianNotes || '');
            setWorkerComments(jobData.workerComments || []);
            setImages(jobData.images || []);
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

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment = {
        text: newComment,
        timestamp: new Date().toISOString(),
        worker: 'Current Worker Name' // Replace with actual worker name
      };
      setWorkerComments([...workerComments, comment]);
      setNewComment('');
      // Here you would also update this in your database
    }
  };

  const renderNotesAndComments = () => {
    return (
      <>
        <h4 className="mb-3">Technician Notes</h4>
        <Form.Group className="mb-3">
          <Form.Control
            as="textarea"
            rows={3}
            value={technicianNotes}
            onChange={(e) => setTechnicianNotes(e.target.value)}
            placeholder="Enter technician notes here..."
          />
        </Form.Group>
        <Button variant="primary" className="mb-4">Save Notes</Button>

        <h4 className="mb-3">Worker Comments</h4>
        {workerComments.map((comment, index) => (
          <Card key={index} className="mb-2">
            <Card.Body>
              <Card.Text>{comment.text}</Card.Text>
              <Card.Footer className="text-muted">
                {comment.worker} - {new Date(comment.timestamp).toLocaleString()}
              </Card.Footer>
            </Card.Body>
          </Card>
        ))}
        <Form.Group className="mb-3">
          <Form.Control
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a new comment..."
          />
        </Form.Group>
        <Button variant="primary" onClick={handleAddComment}>Add Comment</Button>
      </>
    );
  };

  const renderSignatures = () => {
    return (
      <div>
        <h4>Signatures</h4>
        <div className="d-flex justify-content-between">
          <div>
            <p>Technician Signature: ___________________</p>
            <p>Timestamp: {job.technicianSignatureTimestamp ? new Date(job.technicianSignatureTimestamp).toLocaleString() : 'Not signed'}</p>
          </div>
          <div>
            <p>Worker Signature: ___________________</p>
            <p>Timestamp: {job.workerSignatureTimestamp ? new Date(job.workerSignatureTimestamp).toLocaleString() : 'Not signed'}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderImages = () => {
    const noImageAvailable = 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg';

    const handleImageClick = (imageUrl) => {
      setSelectedImage(imageUrl);
    };

    const handleCloseModal = () => {
      setSelectedImage(null);
    };

    return (
      <div>
        <h4>Job Images</h4>
        <div className="d-flex flex-wrap">
          {images.length > 0 ? (
            images.map((image, index) => (
              <div key={index} className="m-2">
                <img 
                  src={image.url} 
                  alt={`Job image ${index + 1}`} 
                  style={{
                    width: '200px', 
                    height: '200px', 
                    objectFit: 'cover', 
                    cursor: 'pointer'  // Add pointer cursor
                  }} 
                  onClick={() => handleImageClick(image.url)}
                />
                <p className="text-center mt-1">
                  <a 
                    href="#" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      handleImageClick(image.url); 
                    }}
                    style={{ cursor: 'pointer' }}  // Add pointer cursor to link
                  >
                    View
                  </a>
                </p>
              </div>
            ))
          ) : (
            <div className="d-flex flex-column align-items-center m-2">
              <img 
                src={noImageAvailable} 
                alt="No Image Available" 
                style={{width: '200px', height: '200px', objectFit: 'contain'}} 
              />
              <p className="mt-2">No Images Available</p>
            </div>
          )}
        </div>

        <Modal show={selectedImage !== null} onHide={handleCloseModal} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Image View</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <img 
              src={selectedImage} 
              alt="Enlarged job image" 
              style={{width: '100%', height: 'auto'}} 
            />
          </Modal.Body>
        </Modal>
      </div>
    );
  };

  const renderMap = () => {
    if (!isLoaded) {
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: "350px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading map...</span>
          </div>
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="alert alert-danger" role="alert">
          Error loading Google Maps. Please check your API key and try again.
        </div>
      );
    }

    if (!location) {
      return (
        <div className="alert alert-warning" role="alert">
          No location data available for this job.
        </div>
      );
    }

    const mapOptions = {
      zoom: 15,
      center: location,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true
    };

    return (
      <div style={{ height: "350px", width: "100%" }}>
        <GoogleMap
          key={mapKey}
          mapContainerStyle={{ width: "100%", height: "100%" }}
          options={mapOptions}
        >
          <Marker 
            position={location}
            title={job.location?.address?.streetAddress || "Job Location"}
          />
        </GoogleMap>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">Job Description</h4>
              <Button
                variant="primary"
                onClick={() => router.push(`/dashboard/jobs/update-jobs/${id}`)}
              >
                Edit Job
              </Button>
            </div>
            <div
              dangerouslySetInnerHTML={{
                __html: job.jobDescription || "No description available",
              }}
            />
            <h4 className="mb-2 mt-4">Address</h4>
            <p>
              {`${job.location?.address?.streetAddress || ""} 
                ${job.location?.address?.city || ""} 
                ${job.location?.address?.stateProvince || ""}
                ${job.location?.address?.country || ""} 
                ${job.location?.address?.postalCode || ""}`}
            </p>

            {/* Remove the renderMap() call from here */}
          </>
        );
      case "equipment":
        return renderEquipmentList();
      case "task":
        return renderTaskList();
      case "notes":
        return renderNotesAndComments();
      case "signatures":
        return renderSignatures();
      case "images":
        return renderImages();
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
      case "In Progress":
        return "In Progress";
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
        case "In Progress":
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

  const extractCustomerCode = (fullName) => {
    if (!fullName) return null;
    const match = fullName.match(/^(C\d+)/);
    return match ? match[1] : null;
  };

  if (!job) {
    return <div>Loading job details...</div>;
  }

  return (
    <div className={styles.container}>
      <Fragment>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h1 className="mb-1 h2 fw-bold">Job Details</h1>
            <Breadcrumb>
              <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
              <Breadcrumb.Item href="/dashboard/jobs/list-jobs">
                Jobs
              </Breadcrumb.Item>
              <Breadcrumb.Item active>{id}</Breadcrumb.Item>
            </Breadcrumb>
          </div>
       
        </div>

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
                  href="#notes"
                  className={`nav-link ${activeTab === "notes" ? "active" : ""}`}
                  onClick={() => setActiveTab("notes")}
                >
                  Notes & Comments
                </a>
              </ListGroup.Item>
              <ListGroup.Item as="li" bsPrefix="nav-item ms-0 me-3 mx-3">
                <a
                  href="#signatures"
                  className={`nav-link ${activeTab === "signatures" ? "active" : ""}`}
                  onClick={() => setActiveTab("signatures")}
                >
                  Signatures
                </a>
              </ListGroup.Item>
              <ListGroup.Item as="li" bsPrefix="nav-item ms-0 me-3 mx-3">
                <a
                  href="#images"
                  className={`nav-link ${activeTab === "images" ? "active" : ""}`}
                  onClick={() => setActiveTab("images")}
                >
                  Images
                </a>
              </ListGroup.Item>
            </ListGroup>
          </Col>
        </Row>
      </Fragment>

      <Row>
        <Col xl={6} xs={12} className="mb-4">
          <Card>
            <Card.Body>
              {renderTabContent()}
              {/* Move the renderMap() call here, outside of the tab content */}
              {activeTab === "overview" && renderMap()}
            </Card.Body>
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
                {job.customerName ? (
                  <OverlayTrigger
                    placement="top"
                    overlay={<Tooltip id="customer-tooltip">View Customer Details</Tooltip>}
                  >
                    <Link href={`/dashboard/customers/${extractCustomerCode(job.customerName)}`}>
                      <span className="mb-0 text-primary" style={{ cursor: 'pointer' }}>
                        {job.customerName || "Unknown Company"}
                      </span>
                    </Link>
                  </OverlayTrigger>
                ) : (
                  <p className="mb-0">Unknown Company</p>
                )}
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
                      src={worker.profilePicture || defaultAvatar.src}
                      alt={`${worker.firstName} ${worker.lastName}`}
                      className="avatar-sm avatar rounded-circle me-2"
                      width={32}
                      height={32}
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
      </Row>
    </div>
  );
};

export default JobDetails;
