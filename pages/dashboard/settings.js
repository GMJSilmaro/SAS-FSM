import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  ListGroup,
  Breadcrumb,
  Form,
  Button,
  Modal,
  Table,
} from "react-bootstrap";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import { FaCog, FaUser, FaTools } from "react-icons/fa";
import Image from 'next/image';
import { setDoc, doc, getDoc, storage } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, getStorage } from "firebase/storage";
import { db } from "../../firebase";

const Settings = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("company-info");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true); 

  const [showFieldWorkerSettingsModal, setShowFieldWorkerSettingsModal] =
    useState(false); // New state for Field Worker Settings modal
  const [companyInfo, setCompanyInfo] = useState({
    logo: "",
    name: "",
    address: "",
    email: "",
    phone: "",
    website: "",
  });
  const [file, setFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(companyInfo.logo);
  const fileInputRef = React.useRef(null);
  const [userDetails, setUserDetails] = useState(null);
  const storage = getStorage();

  const [schedulingWindows, setSchedulingWindows] = useState([
    {
      label: "After Morning",
      timeStart: "03:00 AM",
      timeEnd: "07:00 PM",
      isPublic: true,
    },
    {
      label: "Morning",
      timeStart: "08:00 AM",
      timeEnd: "12:00 PM",
      isPublic: true,
    },
    {
      label: "Afternoon",
      timeStart: "01:00 PM",
      timeEnd: "05:00 PM",
      isPublic: false,
    },
  ]);

  const [editIndex, setEditIndex] = useState(null);
  const [tempWindow, setTempWindow] = useState({
    label: "",
    timeStart: "",
    timeEnd: "",
    isPublic: true,
  });

  const handleEditClick = (index) => {
    setEditIndex(index);
    setTempWindow(schedulingWindows[index]);
  };

  const handleSaveClick = (index) => {
    const updatedWindows = [...schedulingWindows];
    updatedWindows[index] = tempWindow;
    setSchedulingWindows(updatedWindows);
    setEditIndex(null);
  };

  const handleRemoveClick = (index) => {
    const updatedWindows = schedulingWindows.filter((_, i) => i !== index);
    setSchedulingWindows(updatedWindows);
  };

  const [fieldWorkerSettings, setFieldWorkerSettings] = useState({
    notifyForNewJobs: false,
    sendDailyReports: false,
    // Add more settings as needed
  });

  useEffect(() => {
    const fetchUserDetails = async () => {
      const uid = Cookies.get("workerId");
      if (uid) {
        try {
          const userRef = doc(db, `users/${uid}`);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setUserDetails(userDoc.data());
          } else {
            console.log("User not found");
          }
        } catch (error) {
          console.error("Error fetching user details:", error.message);
        }
      } else {
        // Redirect to sign-in if UID is not available
        router.push("/authentication/sign-in");
      }
    };

    fetchUserDetails();
  }, []);

  const handleFieldWorkerSettingsModalShow = () =>
    setShowFieldWorkerSettingsModal(true); // Show modal for Field Worker App Settings
  const handleFieldWorkerSettingsModalClose = () =>
    setShowFieldWorkerSettingsModal(false); // Close modal for Field Worker App Settings

  const handleNavigation = (tab) => {
    setActiveTab(tab);
  };

  const addSchedulingWindow = (newWindow) => {
    setSchedulingWindows([...schedulingWindows, newWindow]);
  };

  const handleShowScheduleModal = () => setShowScheduleModal(true);
  const handleCloseScheduleModal = () => setShowScheduleModal(false);
  const handleImageChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result); // Set the preview of the logo
      };
      reader.readAsDataURL(selectedFile);
      setFile(selectedFile); // Store the selected file for uploading
    }
  };

  const handleRemoveImage = () => {
    setLogoPreview(""); // Reset to default logo
    setFile(null); // Clear the selected file
  };

  const handleMenuClick = (menu) => {
    console.log(`Navigating to: ${menu}`);

  };

  const handleEditModalShow = () => setShowEditModal(true);
  const handleEditModalClose = () => setShowEditModal(false);

  const handleCompanyInfoChange = (e) => {
    const { name, value } = e.target;
    setCompanyInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFieldWorkerSettingChange = (setting) => {
    setFieldWorkerSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const docRef = doc(db, "companyDetails", "companyInfo");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCompanyInfo(docSnap.data());
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching company information:", error);
      }
    };

    fetchCompanyInfo();
  }, []);

  const handleCompanyInfoSave = async () => {
    try {
      let logoUrl = logoPreview;
      const workerId = userDetails.workerId; // Fetching workerId from userDetails

      // Log the fetched workerId
      console.log("Fetched workerId:", workerId);

      if (file) {
        // Create a storage reference using workerId
        const storageRef = ref(
          storage,
          `company_logos/${workerId}-${file.name}`
        );
        console.log("Storage reference path:", storageRef.fullPath); // Log the storage reference path

        const snapshot = await uploadBytes(storageRef, file); // Upload the file
        logoUrl = await getDownloadURL(snapshot.ref); // Get the download URL

        // Log the download URL
        console.log("Logo uploaded. Download URL:", logoUrl);
      }

      // Save the updated company information to Firestore
      await setDoc(doc(db, "companyDetails", "companyInfo"), {
        logo: logoUrl,
        name: companyInfo.name,
        address: companyInfo.address,
        email: companyInfo.email,
        phone: companyInfo.phone,
        website: companyInfo.website,
      });

      console.log("Company Information updated successfully");
      handleEditModalClose();
    } catch (error) {
      console.error("Error updating company information:", error);
    }
  };

  const [showCompSchedule, setShowCompSchedule] = useState(false);

  // State for managing business hours
  const [businessHours, setBusinessHours] = useState([
    { day: "Monday", startTime: "08:00", endTime: "20:00", closed: false },
    { day: "Tuesday", startTime: "08:00", endTime: "20:00", closed: false },
    { day: "Wednesday", startTime: "08:00", endTime: "20:00", closed: false },
    { day: "Thursday", startTime: "08:00", endTime: "20:00", closed: false },
    { day: "Friday", startTime: "08:00", endTime: "20:00", closed: false },
    { day: "Saturday", startTime: "", endTime: "", closed: true },
    { day: "Sunday", startTime: "", endTime: "", closed: true },
  ]);

  // State for managing ScheduleAssist settings
  const [scheduleAssist, setScheduleAssist] = useState({
    limitResults: 45,
    enforceBreak: false,
    breakDuration: 45,
    breakStart: "12:00",
    breakEnd: "14:00",
    activityType: "",
  });

  // Functions to show/hide the modal
  const handleShowCompSchedule = () => setShowCompSchedule(true);
  const handleHideCompSchedule = () => setShowCompSchedule(false);

  // Function to handle changes in the business hours
  const handleBusinessHoursChange = (index, field, value) => {
    const updatedHours = [...businessHours];
    updatedHours[index][field] = value;
    setBusinessHours(updatedHours);
  };

  // Function to handle changes in the ScheduleAssist settings
  const handleScheduleAssistChange = (field, value) => {
    setScheduleAssist({
      ...scheduleAssist,
      [field]: value,
    });
  };

  // Function to save changes (implement saving to the database as needed)
  const handleSave = () => {
    console.log("Business Hours:", businessHours);
    console.log("ScheduleAssist Settings:", scheduleAssist);
    handleHideCompSchedule();
  };

  const renderContent = () => {
    switch (activeTab) {
      case "company-info":
        return (
          <Card className="shadow-sm">
            <Card.Body>
              <h5>Company Information</h5>
              <Row>
                <Col xs={4} className="fw-bold">
                  Logo:
                </Col>
                <Col xs={8}>
                  {/* <Image
                    src={companyInfo.logo} // Use fetched logo
                    alt="Company Logo"
                    width={200}
                    height={150}
                  /> */}

                  <Image
                    src={companyInfo.logo || "/images/NoImage.png"} 
                    className="rounded-circle"
                    alt="Company Logo"
                    width={120}
                    height={120}
                  />
                </Col>
              </Row>
              <Row>
                <Col xs={4} className="fw-bold">
                  Company Name:
                </Col>
                <Col xs={8}>{companyInfo.name}</Col>{" "}
                {/* Display fetched name */}
              </Row>
              <Row>
                <Col xs={4} className="fw-bold">
                  Address:
                </Col>
                <Col xs={8}>{companyInfo.address}</Col>{" "}
                {/* Display fetched address */}
              </Row>
              <Row>
                <Col xs={4} className="fw-bold">
                  Email:
                </Col>
                <Col xs={8}>{companyInfo.email}</Col>{" "}
                {/* Display fetched email */}
              </Row>
              <Row>
                <Col xs={4} className="fw-bold">
                  Phone:
                </Col>
                <Col xs={8}>{companyInfo.phone}</Col>{" "}
                {/* Display fetched phone */}
              </Row>
              <Row>
                <Col xs={4} className="fw-bold">
                  Website:
                </Col>
                <Col xs={8}>
                  <a
                    href={companyInfo.website} // Use fetched website
                    target="_blank"
                    rel="noreferrer"
                  >
                    {companyInfo.website}
                  </a>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        );
      case "options":
        return (
          <Card className="shadow-sm">
            <Card.Body>
              <h5>Options</h5>
              <p className="text-muted">
                Manage your company information, preferences, and various
                settings
              </p>

              <h6>General</h6>
              <ListGroup variant="flush">
                <ListGroup.Item
                  action
                  onClick={() => handleEditModalShow(true)}
                >
                  <i data-feather="info"></i> Company Information
                  <p className="text-muted small mb-0">
                    View and edit your company&apos;s information
                  </p>
                </ListGroup.Item>
                <ListGroup.Item
                  action
                  onClick={() => handleFieldWorkerSettingsModalShow()}
                >
                  <i data-feather="smartphone"></i> Field Worker App Settings
                  <p className="text-muted small mb-0">
                    Configure settings for field worker applications
                  </p>
                </ListGroup.Item>
              </ListGroup>

              <h6 className="mt-4">Access Management</h6>
              <ListGroup variant="flush">
                <ListGroup.Item
                  action
                  // onClick={() => handleShowScheduleModal()}
                >
                  <i data-feather="lock"></i> Login History
                  <p className="text-muted small mb-0">
                    Track and review login activity
                  </p>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        );
        case "notifications":
          return (
            <Card
              className={`shadow-sm ${isDisabled ? 'disabled-card' : ''}`}
              onClick={!isDisabled ? () => handleNotifications() : null} // Disable click if isDisabled is true
            >
              <Card.Body>
                <h5>Notifications</h5>
                <p>Manage Text Message/Mail notifications.</p>
              </Card.Body>
            </Card>
          );
        case "email":
          return (
            <Card
              className={`shadow-sm ${isDisabled ? 'disabled-card' : ''}`}
              onClick={!isDisabled ? () => handleEmail() : null} 
            >
              <Card.Body>
                <h5>Email</h5>
                <p>Manage your Automated Email to send for Workers.</p>
              </Card.Body>
            </Card>
          );
        
        
      case "schedulingwindows":
        return (
          <Card className="shadow-sm">
            <Card.Body>
              <h5>Scheduling Window</h5>
              <p>
                Set default scheduling windows for jobs (Morning, Afternoon,
                etc.).
              </p>
              <Button onClick={handleShowScheduleModal}>
                Set Scheduling Window/s
              </Button>
            </Card.Body>
          </Card>
        );
      case "scheduling":
        return (
          <Card className="shadow-sm">
            <Card.Body>
              <h5>Scheduling</h5>
              <p>Set Work Hours and Scheduling Hours.</p>
              <Button onClick={handleShowCompSchedule}>Set Work Hour/s</Button>
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
            <Card.Header className="bg-primary text-white">
              Settings
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item
                action
                onClick={() => handleNavigation("company-info")}
              >
                <FaUser className="me-2" /> Company Information
              </ListGroup.Item>
              <ListGroup.Item
                action
                onClick={() => handleNavigation("options")}
              >
                <FaCog className="me-2" /> Options
              </ListGroup.Item>
              <ListGroup.Item
  action
  onClick={!isDisabled ? () => handleNavigation("notifications") : null} 
  className={isDisabled ? "disabled-item" : ""} 
>
  <FaUser className="me-2" /> Notifications (Not Available)
</ListGroup.Item>

<ListGroup.Item
  action
  onClick={!isDisabled ? () => handleNavigation("email") : null} 
  className={isDisabled ? "disabled-item" : ""} 
>
  <FaUser className="me-2" /> Email (Not Available)
</ListGroup.Item>


              <Card.Header className="bg-primary text-white">
                Jobs and Projects
              </Card.Header>
              <ListGroup.Item
                action
                onClick={() => handleNavigation("schedulingwindows")}
              >
                <FaTools className="me-2" /> Scheduling Windows
              </ListGroup.Item>
              <ListGroup.Item
                action
                onClick={() => handleNavigation("scheduling")}
              >
                <FaTools className="me-2" /> Scheduling
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>

        <Modal
          show={showEditModal}
          onHide={handleEditModalClose}
          centered
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Edit Company Information</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Col xs={12} className="mb-3 d-flex align-items-center">
                <div className="me-3">
                  <Image
                    src={logoPreview || "/images/NoImage.png"} 
                    className="rounded-circle"
                    alt="Company Logo"
                    width={120}
                    height={120}
                  />
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                    ref={fileInputRef}
                    id="upload-input"
                  />
                  <Button
                    className="me-2"
                    onClick={() =>
                      document.getElementById("upload-input").click()
                    }
                  >
                    Change Logo
                  </Button>
                  <Button onClick={handleRemoveImage}>Remove Logo</Button>
                </div>
              </Col>

              <Row>
                <Col xs={12} md={6}>
                  <Form.Group controlId="formCompanyName">
                    <Form.Label>Company Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={companyInfo.name}
                      onChange={handleCompanyInfoChange}
                    />
                  </Form.Group>

                  <Form.Group controlId="formCompanyAddress" className="mt-3">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      value={companyInfo.address}
                      onChange={handleCompanyInfoChange}
                    />
                  </Form.Group>

                  <Form.Group controlId="formCompanyEmail" className="mt-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={companyInfo.email}
                      onChange={handleCompanyInfoChange}
                    />
                  </Form.Group>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Group controlId="formCompanyPhone">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      type="text"
                      name="phone"
                      value={companyInfo.phone}
                      onChange={handleCompanyInfoChange}
                    />
                  </Form.Group>

                  <Form.Group controlId="formCompanyWebsite" className="mt-3">
                    <Form.Label>Website</Form.Label>
                    <Form.Control
                      type="text"
                      name="website"
                      value={companyInfo.website}
                      onChange={handleCompanyInfoChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleEditModalClose}>
              Close
            </Button>
            <Button variant="primary" onClick={handleCompanyInfoSave}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={showFieldWorkerSettingsModal}
          onHide={handleFieldWorkerSettingsModalClose}
          centered
          size="xl"
        >
          <Modal.Header closeButton>
            <Modal.Title>Field Worker App Settings</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="d-flex">
              <div className="col-6 pe-3">
                {/* General Settings Section */}
                <h5>General Settings</h5>
                <Form.Group>
                  <Form.Check
                    type="switch"
                    id="fieldAccessToPricing"
                    label="Field Access to Pricing"
                    checked={fieldWorkerSettings.fieldAccessToPricing}
                    onChange={() =>
                      handleFieldWorkerSettingChange("fieldAccessToPricing")
                    }
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Check
                    type="switch"
                    id="customerInfo"
                    label="Access to Customer Info"
                    checked={fieldWorkerSettings.customerInfo}
                    onChange={() =>
                      handleFieldWorkerSettingChange("customerInfo")
                    }
                  />
                </Form.Group>

                {/* Profile Page Settings Section */}
                <h5 className="mt-4">Profile Page Settings</h5>
                <Form.Group>
                  <Form.Check
                    type="switch"
                    id="averageStarRating"
                    label="Average Star Rating"
                    checked={fieldWorkerSettings.averageStarRating}
                    onChange={() =>
                      handleFieldWorkerSettingChange("averageStarRating")
                    }
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Check
                    type="switch"
                    id="customerRatingByJob"
                    label="Customer Rating by Job"
                    checked={fieldWorkerSettings.customerRatingByJob}
                    onChange={() =>
                      handleFieldWorkerSettingChange("customerRatingByJob")
                    }
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Check
                    type="switch"
                    id="clockIn"
                    label="Clock In"
                    checked={fieldWorkerSettings.clockIn}
                    onChange={() => handleFieldWorkerSettingChange("clockIn")}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Check
                    type="switch"
                    id="availability"
                    label="Availability"
                    checked={fieldWorkerSettings.availability}
                    onChange={() =>
                      handleFieldWorkerSettingChange("availability")
                    }
                  />
                </Form.Group>
              </div>
              <div
                className="vr"
                style={{ backgroundColor: "rgba(169, 169, 169, 0.5)" }}
              ></div>{" "}
              {/* Vertical line */}
              <div className="col-4 ps-3">
                <h5 className="">Job Detail Fields</h5>
                <Form.Group>
                  <Form.Check
                    type="switch"
                    id="location"
                    label="Location"
                    checked={fieldWorkerSettings.location}
                    onChange={() => handleFieldWorkerSettingChange("location")}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Check
                    type="switch"
                    id="signature"
                    label="Signature"
                    checked={fieldWorkerSettings.signature}
                    onChange={() => handleFieldWorkerSettingChange("signature")}
                  />
                </Form.Group>
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={handleFieldWorkerSettingsModalClose}
            >
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleFieldWorkerSettingsModalClose}
            >
              Save Settings
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Scheduling Modal */}
        <Modal
          show={showScheduleModal}
          onHide={handleCloseScheduleModal}
          centered
          size="xl"
        >
          <Modal.Header closeButton>
            <Modal.Title>Add Scheduling Window</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Time Start</th>
                  <th>Time End</th>
                  <th>Public</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedulingWindows.map((window, index) => (
                  <tr key={index}>
                    <td>
                      {editIndex === index ? (
                        <Form.Control
                          type="text"
                          value={tempWindow.label}
                          onChange={(e) =>
                            setTempWindow({
                              ...tempWindow,
                              label: e.target.value,
                            })
                          }
                        />
                      ) : (
                        window.label
                      )}
                    </td>
                    <td>
                      {editIndex === index ? (
                        <Form.Control
                          type="time"
                          value={tempWindow.timeStart}
                          onChange={(e) =>
                            setTempWindow({
                              ...tempWindow,
                              timeStart: e.target.value,
                            })
                          }
                        />
                      ) : (
                        window.timeStart
                      )}
                    </td>
                    <td>
                      {editIndex === index ? (
                        <Form.Control
                          type="time"
                          value={tempWindow.timeEnd}
                          onChange={(e) =>
                            setTempWindow({
                              ...tempWindow,
                              timeEnd: e.target.value,
                            })
                          }
                        />
                      ) : (
                        window.timeEnd
                      )}
                    </td>
                    <td>
                      {editIndex === index ? (
                        <Form.Select
                          value={tempWindow.isPublic ? "yes" : "no"}
                          onChange={(e) =>
                            setTempWindow({
                              ...tempWindow,
                              isPublic: e.target.value === "yes",
                            })
                          }
                        >
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </Form.Select>
                      ) : window.isPublic ? (
                        "Yes"
                      ) : (
                        "No"
                      )}
                    </td>
                    <td>
                      {editIndex === index ? (
                        <>
                          <Button
                            variant="success"
                            size="sm" // Make button smaller
                            onClick={() => handleSaveClick(index)}
                            className="me-2" // Add margin to the right
                          >
                            Save
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm" // Make button smaller
                            onClick={() => setEditIndex(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="link"
                            onClick={() => handleEditClick(index)}
                            className="p-0 me-2" // Remove padding for a cleaner look and add margin
                          >
                            <i className="fas fa-edit"></i>{" "}
                            {/* FontAwesome edit icon */}
                          </Button>
                          <Button
                            variant="link"
                            onClick={() => handleRemoveClick(index)}
                            className="p-0" // Remove padding for a cleaner look
                          >
                            <i className="fas fa-trash-alt"></i>{" "}
                            {/* FontAwesome trash icon */}
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {/* Additional row for adding new scheduling window */}
                <tr>
                  <td>
                    <Form.Control type="text" placeholder="Label" id="label" />
                  </td>
                  <td>
                    <Form.Control
                      type="time"
                      placeholder="Time Start"
                      id="timeStart"
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="time"
                      placeholder="Time End"
                      id="timeEnd"
                    />
                  </td>
                  <td>
                    <Form.Select id="isPublic">
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </Form.Select>
                  </td>
                </tr>
              </tbody>
            </Table>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseScheduleModal}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const newWindow = {
                  label: document.getElementById("label").value,
                  timeStart: document.getElementById("timeStart").value,
                  timeEnd: document.getElementById("timeEnd").value,
                  isPublic: document.getElementById("isPublic").value === "yes",
                };
                addSchedulingWindow(newWindow);
                // Clear the input fields after adding a new window
                document.getElementById("label").value = "";
                document.getElementById("timeStart").value = "";
                document.getElementById("timeEnd").value = "";
                document.getElementById("isPublic").value = "yes"; // Reset to default option
              }}
            >
              Add Scheduling Window
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={showCompSchedule}
          onHide={handleHideCompSchedule}
          size="xl"
          centered
          scrollable
        >
          <Modal.Header closeButton>
            <Modal.Title>Company Schedule</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h5>Business Hours</h5>
            <Table bordered hover>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Closed</th>
                </tr>
              </thead>
              <tbody>
                {businessHours.map((hours, index) => (
                  <tr key={index}>
                    <td>{hours.day}</td>
                    <td>
                      <Form.Control
                        type="time"
                        value={hours.startTime}
                        disabled={hours.closed}
                        onChange={(e) =>
                          handleBusinessHoursChange(
                            index,
                            "startTime",
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="time"
                        value={hours.endTime}
                        disabled={hours.closed}
                        onChange={(e) =>
                          handleBusinessHoursChange(
                            index,
                            "endTime",
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={hours.closed}
                        onChange={(e) =>
                          handleBusinessHoursChange(
                            index,
                            "closed",
                            e.target.checked
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <h5>Schedule Assist</h5>
            <Form.Group className="mb-3">
              <Form.Label>Limit ScheduleAssist results to (minutes)</Form.Label>
              <Form.Control
                type="number"
                value={scheduleAssist.limitResults}
                onChange={(e) =>
                  handleScheduleAssistChange("limitResults", e.target.value)
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Enforce break window when optimizing"
                checked={scheduleAssist.enforceBreak}
                onChange={(e) =>
                  handleScheduleAssistChange("enforceBreak", e.target.checked)
                }
              />
            </Form.Group>

            <Row className="mb-3">
              <Col>
                <Form.Label>Break Duration (minutes)</Form.Label>
                <Form.Control
                  type="number"
                  value={scheduleAssist.breakDuration}
                  onChange={(e) =>
                    handleScheduleAssistChange("breakDuration", e.target.value)
                  }
                />
              </Col>
              <Col>
                <Form.Label>Break Start</Form.Label>
                <Form.Control
                  type="time"
                  value={scheduleAssist.breakStart}
                  onChange={(e) =>
                    handleScheduleAssistChange("breakStart", e.target.value)
                  }
                />
              </Col>
              <Col>
                <Form.Label>Break End</Form.Label>
                <Form.Control
                  type="time"
                  value={scheduleAssist.breakEnd}
                  onChange={(e) =>
                    handleScheduleAssistChange("breakEnd", e.target.value)
                  }
                />
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Activity Type</Form.Label>
              <Form.Control
                type="text"
                value={scheduleAssist.activityType}
                onChange={(e) =>
                  handleScheduleAssistChange("activityType", e.target.value)
                }
              />
              <Form.Text className="text-muted">
                When an activity of this type is already scheduled, break window
                creation will be bypassed.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleHideCompSchedule}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Main Settings Sections */}
        <Col lg={9} md={8} sm={12}>
          {renderContent()}
        </Col>
      </Row>
    </Container>
  );
};

export default Settings;
