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
  Badge,
} from "react-bootstrap";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import { FaCog, FaUser, FaTools, FaTasks, FaEdit, FaTrash, FaBuilding, FaInfo, FaMobile, FaBriefcase, FaClock, FaCalendar, FaEnvelope, FaBell, FaPlus, FaCamera, FaUpload, FaTimes, FaPhone, FaGlobe, FaMapMarkerAlt, FaCheck, FaAddressCard } from "react-icons/fa";
import Image from "next/image";
import {
  setDoc,
  doc,
  getDoc,
  storage,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, getStorage } from "firebase/storage";
import { db } from "../../firebase";
import toast from 'react-hot-toast';
import Link from "next/link";
import styles from "./settings.module.css";

const Settings = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("company-info");
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  

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

  const [schedulingWindows, setSchedulingWindows] = useState([]);

  const formatTimeTo12Hour = (time) => {
    if (!time) return '';
    
    try {
      const [hours, minutes] = time.split(":");
      const formattedHours = hours % 12 || 12; // Convert to 12-hour format
      const ampm = hours >= 12 ? "PM" : "AM"; // Determine AM/PM
      return `${formattedHours}:${minutes} ${ampm}`; // Return formatted time
    } catch (error) {
      console.error('Error formatting time:', error);
      return ''; // Return empty string if there's an error
    }
  };

  // Function to add a scheduling window to the Firestore collection
  const addSchedulingWindowToFirestore = async (newWindow) => {
    try {
      // Check for empty or null values
      if (!newWindow.label || !newWindow.timeStart || !newWindow.timeEnd) {
        console.error(
          "Cannot add scheduling window. All fields must be filled."
        );
        return; // Exit the function if any required field is empty
      }

      // Reference to the "schedulingWindows" collection in Firestore
      const schedulingWindowsRef = collection(db, "schedulingWindows");

      // Add the new window data to the collection
      await addDoc(schedulingWindowsRef, {
        label: newWindow.label,
        timeStart: newWindow.timeStart,
        timeEnd: newWindow.timeEnd,
        isPublic: newWindow.isPublic,
      });

      console.log("Scheduling window added successfully");
    } catch (error) {
      console.error("Error adding scheduling window to Firestore:", error);
    }
  };

  const [editIndex, setEditIndex] = useState(null);
  const [tempWindow, setTempWindow] = useState({
    label: "",
    timeStart: "",
    timeEnd: "",
    isPublic: true,
  });

  const updateSchedulingWindowInFirestore = async (windowId, updatedWindow) => {
    try {
      const windowRef = doc(db, "schedulingWindows", windowId);
      await updateDoc(windowRef, {
        label: updatedWindow.label,
        timeStart: updatedWindow.timeStart,
        timeEnd: updatedWindow.timeEnd,
        isPublic: updatedWindow.isPublic,
      });
      console.log("Scheduling window updated successfully");
    } catch (error) {
      console.error("Error updating scheduling window in Firestore:", error);
    }
  };

  const handleSaveClick = async (index) => {
    try {
      const windowId = schedulingWindows[index].id;
      await updateSchedulingWindowInFirestore(windowId, tempWindow);
      
      // Refresh the windows after update
      await fetchSchedulingWindows();
      setEditIndex(null);
      toast.success("Window updated successfully");
    } catch (error) {
      console.error("Error updating window:", error);
      toast.error("Failed to update window");
    }
  };

  const handleEditClick = (index) => {
    setEditIndex(index);
    setTempWindow(schedulingWindows[index]); // Populate the tempWindow with the current window data
  };

  const handleRemoveClick = async (index) => {
    const windowIdToDelete = schedulingWindows[index].id;
    try {
      const docRef = doc(db, "schedulingWindows", windowIdToDelete);
      await deleteDoc(docRef);
      console.log("Scheduling window removed successfully:", windowIdToDelete);
      // Update local state after deletion
      setSchedulingWindows((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error removing scheduling window:", error);
    }
  };

  const fetchCompanyInfo = async () => {
    try {
      const docRef = doc(db, "companyDetails", "companyInfo");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCompanyInfo(data);
        setLogoPreview(data.logo || ''); // Reset logo preview to current logo
      } else {
        console.log("No company information found!");
        setCompanyInfo({
          logo: "",
          name: "",
          address: "",
          email: "",
          phone: "",
          website: "",
        });
      }
    } catch (error) {
      console.error("Error fetching company information:", error);
      toast.error('Failed to fetch company information');
    }
  };



  // Function to fetch scheduling windows from Firestore
  const fetchSchedulingWindows = async () => {
    try {
      const schedulingWindowsRef = collection(db, "schedulingWindows");
      const querySnapshot = await getDocs(schedulingWindowsRef);

      const windows = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          label: data.label || '',
          timeStart: data.timeStart || '',
          timeEnd: data.timeEnd || '',
          isPublic: data.isPublic ?? true,
          displayTimeStart: data.timeStart ? formatTimeTo12Hour(data.timeStart) : '',
          displayTimeEnd: data.timeEnd ? formatTimeTo12Hour(data.timeEnd) : ''
        };
      });

      setSchedulingWindows(windows);
    } catch (error) {
      console.error("Error fetching scheduling windows:", error);
      toast.error("Failed to fetch scheduling windows");
    }
  };

  // Add this to your useEffect or wherever you fetch the settings
useEffect(() => {
  const fetchSettings = async () => {
    try {
      const settingsRef = doc(db, "settings", "followUp");
      const settingsDoc = await getDoc(settingsRef);
      
      console.log('Raw Firestore data:', settingsDoc.data());
      
      if (settingsDoc.exists()) {
        setFollowUpSettings(settingsDoc.data());
        console.log('Settings updated:', settingsDoc.data());
      } else {
        console.log('No settings document found');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  fetchSettings();
}, []); // Empty dependency array means this runs once when component mounts

  const handleFieldWorkerSettingsModalShow = () =>
    setShowFieldWorkerSettingsModal(true); // Show modal for Field Worker App Settings
  const handleFieldWorkerSettingsModalClose = () =>
    setShowFieldWorkerSettingsModal(false); // Close modal for Field Worker App Settings

  const handleNavigation = (tab) => {
    setActiveTab(tab);
  };

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const handleShowScheduleModal = () => setShowScheduleModal(true);
  const handleCloseScheduleModal = () => setShowScheduleModal(false);

  const handleImageChange = (event) => {
    const selectedFile = event.target.files[0];
    
    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Validate file size (e.g., 5MB limit)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (selectedFile.size > MAX_SIZE) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
      setFile(selectedFile);
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

  const [isUploading, setIsUploading] = useState(false);

  const handleCompanyInfoSave = async () => {
    try {
      let logoUrl = companyInfo.logo;
      const workerId = userDetails?.workerId;

      if (file) {
        try {
          // Generate a unique filename using timestamp
          const timestamp = Date.now();
          const fileName = `${workerId}-${timestamp}-${file.name}`;
          
          // Upload new logo file
          const storageRef = ref(storage, `company_logos/${fileName}`);
          const snapshot = await uploadBytes(storageRef, file);
          logoUrl = await getDownloadURL(snapshot.ref);
          console.log("New logo uploaded. Download URL:", logoUrl);
        } catch (storageError) {
          console.error("Error uploading logo:", storageError);
          toast.error('Failed to upload company logo');
          return; // Exit early if logo upload fails
        }
      }

      // Batch write to both documents
      const batch = writeBatch(db);
      
      // Update companyDetails/companyInfo
      const companyDetailsRef = doc(db, "companyDetails", "companyInfo");
      batch.set(companyDetailsRef, {
        ...companyInfo,
        logo: logoUrl,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Update companyInfo/default
      const companyInfoRef = doc(db, "companyInfo", "default");
      batch.set(companyInfoRef, {
        name: companyInfo.name,
        logo: logoUrl,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Commit the batch
      await batch.commit();

      // Update local state
      setCompanyInfo(prev => ({
        ...prev,
        logo: logoUrl
      }));

      toast.success('Company Information updated successfully!');
      handleEditModalClose();
    } catch (error) {
      console.error("Error updating company information:", error);
      toast.error('Failed to update company information');
    } finally {
      setIsUploading(false);
    }
  };

  const [showCompSchedule, setShowCompSchedule] = useState(false);
  const [businessHours, setBusinessHours] = useState([
    { day: "Monday", startTime: "08:00", endTime: "20:00", closed: false },
    { day: "Tuesday", startTime: "08:00", endTime: "20:00", closed: false },
    { day: "Wednesday", startTime: "08:00", endTime: "20:00", closed: false },
    { day: "Thursday", startTime: "08:00", endTime: "20:00", closed: false },
    { day: "Friday", startTime: "08:00", endTime: "20:00", closed: false },
    { day: "Saturday", startTime: "", endTime: "", closed: true },
    { day: "Sunday", startTime: "", endTime: "", closed: true },
  ]);

  const [scheduleAssist, setScheduleAssist] = useState({
    limitResults: 45,
    enforceBreak: false,
    breakDuration: 45,
    breakStart: "12:00",
    breakEnd: "14:00",
    activityType: "",
  });

  const handleShowCompSchedule = () => setShowCompSchedule(true);
  const handleHideCompSchedule = () => setShowCompSchedule(false);

  const handleBusinessHoursChange = (index, field, value) => {
    const updatedHours = [...businessHours];
    updatedHours[index][field] = value;
    setBusinessHours(updatedHours);
  };

  const handleScheduleAssistChange = (field, value) => {
    setScheduleAssist({
      ...scheduleAssist,
      [field]: value,
    });
  };

  const handleSave = async () => {
    try {
      console.log("Business Hours:", businessHours);
      console.log("ScheduleAssist Settings:", scheduleAssist);
      
      toast.success('Schedule settings saved successfully!');
      handleHideCompSchedule();
    } catch (error) {
      console.error("Error saving schedule settings:", error);
      toast.error('Failed to save schedule settings');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "company-info":
        return (
          <div className="company-info-container">
            {/* Header Card */}
            <Card className="shadow-sm border-0 mb-4 header-card">
              <Card.Body className="d-flex justify-content-between align-items-center p-4">
                <div>
                  <Image
                    src={logoPreview || companyInfo.logo || "/images/NoImage.png"}
                    alt="Company Logo"
                    width={80}
                    height={80}
                    className="rounded-circle company-logo"
                  />
                  <div className="ms-4">
                    <h4 className="mb-1">{companyInfo.name || 'Your Company Name'}</h4>
                    <p className="text-muted mb-0">
                      <FaMapMarkerAlt className="me-2" />
                      {companyInfo.address || 'N/A'}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="primary" 
                  className="edit-button"
                  onClick={() => setIsEditing(true)}
                >
                  <FaEdit className="me-2" />
                  Edit Profile
                </Button>
              </Card.Body>
            </Card>

            {/* Details Cards */}
            <div className="row g-4">
              {/* Contact Information */}
              <div className="col-md-6">
                <Card className="shadow-sm border-0 h-100">
                  <Card.Body className="p-4">
                    <h5 className="card-title mb-4">
                      <FaAddressCard className="me-2 text-primary" />
                      Contact Information
                    </h5>
                    
                    <div className="info-item mb-4">
                      <label className="text-muted small mb-1">Email Address</label>
                      <div className="d-flex align-items-center">
                        <FaEnvelope className="text-primary me-2" />
                        <span className="fw-medium">
                          {companyInfo.email || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="info-item mb-4">
                      <label className="text-muted small mb-1">Phone Number</label>
                      <div className="d-flex align-items-center">
                        <FaPhone className="text-primary me-2" />
                        <span className="fw-medium">
                          {companyInfo.phone || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="info-item">
                      <label className="text-muted small mb-1">Website</label>
                      <div className="d-flex align-items-center">
                        <FaGlobe className="text-primary me-2" />
                        <span className="fw-medium">
                          {companyInfo.website ? (
                            <a href={companyInfo.website} target="_blank" rel="noreferrer" className="text-decoration-none">
                              {companyInfo.website}
                            </a>
                          ) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>

              {/* Company Details */}
              <div className="col-md-6">
                <Card className="shadow-sm border-0 h-100">
                  <Card.Body className="p-4">
                    <h5 className="card-title mb-4">
                      <FaBuilding className="me-2 text-primary" />
                      Company Details
                    </h5>

                    <div className="info-item mb-4">
                      <label className="text-muted small mb-1">Company Name</label>
                      <div className="d-flex align-items-center">
                        <span className="fw-medium">
                          {companyInfo.name || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="info-item">
                      <label className="text-muted small mb-1">Business Address</label>
                      <div className="d-flex align-items-center">
                        <FaMapMarkerAlt className="text-primary me-2" />
                        <span className="fw-medium">
                          {companyInfo.address || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>

            {/* Edit Modal */}
            <Modal show={isEditing} onHide={() => setIsEditing(false)} size="lg">
              <Modal.Header closeButton>
                <Modal.Title>Edit Company Information</Modal.Title>
              </Modal.Header>
              <Modal.Body className="p-4">
                <div className="text-center mb-4">
                  <div className="position-relative d-inline-block">
                    <Image
                      src={logoPreview || companyInfo.logo || "/images/NoImage.png"}
                      alt="Company Logo"
                      width={120}
                      height={120}
                      className="rounded-circle border"
                    />
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="position-absolute bottom-0 end-0 rounded-circle p-2"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <FaCamera />
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="d-none"
                      onChange={handleImageChange}
                      accept="image/*"
                    />
                  </div>
                </div>

                <Form>
                  <Row className="g-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Company Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={companyInfo.name}
                          onChange={handleCompanyInfoChange}
                          placeholder="Enter company name"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={companyInfo.email}
                          onChange={handleCompanyInfoChange}
                          placeholder="Enter email address"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Phone Number</Form.Label>
                        <Form.Control
                          type="text"
                          name="phone"
                          value={companyInfo.phone}
                          onChange={handleCompanyInfoChange}
                          placeholder="Enter phone number"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Website</Form.Label>
                        <Form.Control
                          type="text"
                          name="website"
                          value={companyInfo.website}
                          onChange={handleCompanyInfoChange}
                          placeholder="Enter website URL"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>Business Address</Form.Label>
                        <Form.Control
                          type="text"
                          name="address"
                          value={companyInfo.address}
                          onChange={handleCompanyInfoChange}
                          placeholder="Enter business address"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="light" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleCompanyInfoSave}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
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
            className={`shadow-sm ${isDisabled ? "disabled-card" : ""}`}
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
            className={`shadow-sm ${isDisabled ? "disabled-card" : ""}`}
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
              <h5>Scheduling Windows</h5>
              <p>Set default scheduling windows for jobs (Morning, Afternoon, etc.).</p>
              
              <Table striped bordered hover className="mt-4">
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
                    <tr key={window.id || `window-${index}`}>
                      <td>
                        {editIndex === index ? (
                          <Form.Control
                            type="text"
                            value={tempWindow.label}
                            onChange={(e) => setTempWindow({...tempWindow, label: e.target.value})}
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
                            onChange={(e) => setTempWindow({...tempWindow, timeStart: e.target.value})}
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
                            onChange={(e) => setTempWindow({...tempWindow, timeEnd: e.target.value})}
                          />
                        ) : (
                          window.timeEnd
                        )}
                      </td>
                      <td>
                        {editIndex === index ? (
                          <Form.Select
                            value={tempWindow.isPublic ? "yes" : "no"}
                            onChange={(e) => setTempWindow({...tempWindow, isPublic: e.target.value === "yes"})}
                          >
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </Form.Select>
                        ) : (
                          window.isPublic ? "Yes" : "No"
                        )}
                      </td>
                      <td>
                        {editIndex === index ? (
                          <>
                            <Button variant="success" size="sm" onClick={() => handleSaveClick(index)} className="me-2">
                              Save
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => setEditIndex(null)}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="link" onClick={() => handleEditClick(index)} className="p-0 me-2">
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button variant="link" onClick={() => handleRemoveClick(index)} className="p-0 text-danger">
                              <i className="fas fa-trash-alt"></i>
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr key="new-window-row">
                    <td>
                      <Form.Control type="text" placeholder="Label" id="label" />
                    </td>
                    <td>
                      <Form.Control type="time" id="timeStart" />
                    </td>
                    <td>
                      <Form.Control type="time" id="timeEnd" />
                    </td>
                    <td>
                      <Form.Select id="isPublic">
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </Form.Select>
                    </td>
                    <td>
                      <Button
                        variant="primary"
                        onClick={async () => {
                          const newWindow = {
                            label: document.getElementById("label").value,
                            timeStart: document.getElementById("timeStart").value,
                            timeEnd: document.getElementById("timeEnd").value,
                            isPublic: document.getElementById("isPublic").value === "yes",
                            userId: Cookies.get("workerId"),
                          };

                          try {
                            await addSchedulingWindowToFirestore(newWindow);
                            setSchedulingWindows((prev) => [...prev, newWindow]);
                            toast.success('Scheduling window added successfully');

                            // Clear inputs
                            document.getElementById("label").value = "";
                            document.getElementById("timeStart").value = "";
                            document.getElementById("timeEnd").value = "";
                            document.getElementById("isPublic").value = "yes";
                          } catch (error) {
                            console.error("Error adding window:", error);
                            toast.error('Failed to add scheduling window');
                          }
                        }}
                      >
                        Add Window
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        );
      case "scheduling":
        return (
          <Card className="shadow-sm">
            <Card.Body>
              <h5>Work Hours</h5>
              <p>Set business hours and scheduling preferences.</p>

              {/* Business Hours Section */}
              <h6 className="mt-4 mb-3">Business Hours</h6>
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
                          onChange={(e) => handleBusinessHoursChange(index, "startTime", e.target.value)}
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="time"
                          value={hours.endTime}
                          disabled={hours.closed}
                          onChange={(e) => handleBusinessHoursChange(index, "endTime", e.target.value)}
                        />
                      </td>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={hours.closed}
                          onChange={(e) => handleBusinessHoursChange(index, "closed", e.target.checked)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Schedule Assist Section */}
              <h6 className="mt-5 mb-3">Schedule Assist</h6>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Limit ScheduleAssist results to (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    value={scheduleAssist.limitResults}
                    onChange={(e) => handleScheduleAssistChange("limitResults", e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Enforce break window when optimizing"
                    checked={scheduleAssist.enforceBreak}
                    onChange={(e) => handleScheduleAssistChange("enforceBreak", e.target.checked)}
                  />
                </Form.Group>

                <Row className="mb-3">
                  <Col>
                    <Form.Label>Break Duration (minutes)</Form.Label>
                    <Form.Control
                      type="number"
                      value={scheduleAssist.breakDuration}
                      onChange={(e) => handleScheduleAssistChange("breakDuration", e.target.value)}
                    />
                  </Col>
                  <Col>
                    <Form.Label>Break Start</Form.Label>
                    <Form.Control
                      type="time"
                      value={scheduleAssist.breakStart}
                      onChange={(e) => handleScheduleAssistChange("breakStart", e.target.value)}
                    />
                  </Col>
                  <Col>
                    <Form.Label>Break End</Form.Label>
                    <Form.Control
                      type="time"
                      value={scheduleAssist.breakEnd}
                      onChange={(e) => handleScheduleAssistChange("breakEnd", e.target.value)}
                    />
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label>Activity Type</Form.Label>
                  <Form.Control
                    type="text"
                    value={scheduleAssist.activityType}
                    onChange={(e) => handleScheduleAssistChange("activityType", e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    When an activity of this type is already scheduled, break window
                    creation will be bypassed.
                  </Form.Text>
                </Form.Group>

                <div className="d-flex justify-content-end">
                  <Button variant="primary" onClick={handleSave}>
                    Save Changes
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        );
      case "followuptasks":
        return (
          <div className={styles.followUpContainer}>
            <Row>
              <Col className="mb-4">
                <Card className={styles.taskCard}>
                 
                  <Card.Body className={styles.cardBody}>
                    {/* Add New Type Form */}
                    <div className={styles.addTypeForm}>
                      <Form.Group className="mb-3">
                        <Form.Control
                          type="text"
                          placeholder="Enter new follow-up type name"
                          value={newType.name}
                          onChange={(e) => setNewType({...newType, name: e.target.value})}
                        />
                      </Form.Group>
                      <div className="d-flex gap-2 mb-4">
                        <Form.Control
                          type="color"
                          value={newType.color}
                          onChange={(e) => setNewType({...newType, color: e.target.value})}
                          title="Choose type color"
                          className={styles.colorPicker}
                        />
                        <Button 
                          variant="primary" 
                          onClick={handleAddType}
                          disabled={isSaving}
                          className={styles.addButton}
                        >
                          <FaPlus size={16} /> Add Type
                        </Button>
                      </div>
                    </div>

                    {/* Types List */}
                    <div className={styles.typesList}>
                      {followUpSettings?.types && Object.entries(followUpSettings.types).map(([typeId, type]) => (
                        <div key={typeId} className={styles.typeItem}>
                          {editingType?.id === typeId ? (
                            // Edit mode
                            <div className="d-flex align-items-center gap-2 w-100">
                              <Form.Control
                                type="text"
                                value={editingType.name}
                                onChange={(e) => setEditingType(prev => ({
                                  ...prev,
                                  name: e.target.value
                                }))}
                                placeholder="Enter type name"
                                className="flex-grow-1"
                              />
                              <Form.Control
                                type="color"
                                value={editingType.color}
                                onChange={(e) => setEditingType(prev => ({
                                  ...prev,
                                  color: e.target.value
                                }))}
                                title="Choose type color"
                                style={{ width: '50px' }}
                              />
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleUpdateType(typeId)}
                                className="px-3"
                              >
                                <FaCheck />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setEditingType(null)}
                                className="px-3"
                              >
                                <FaTimes />
                              </Button>
                            </div>
                          ) : (
                            // View mode
                            <div className="d-flex justify-content-between align-items-center w-100">
                              <div className="d-flex align-items-center gap-2">
                                <div 
                                  className={styles.colorBox} 
                                  style={{ backgroundColor: type.color }}
                                />
                                <span className={styles.typeName}>{type.name}</span>
                              </div>
                              <div className={styles.typeActions}>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 me-2"
                                  onClick={() => handleEditType(typeId)}
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 text-danger"
                                  onClick={() => handleDeleteType(typeId)}
                                >
                                  <FaTrash />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
        );
      default:
        return null;
    }
  };

  // Add new state for follow-up settings
  const [followUpSettings, setFollowUpSettings] = useState({
    types: {},
    statuses: []
  });

  // Add function to fetch follow-up settings
  const fetchFollowUpSettings = async () => {
    try {
      const settingsRef = doc(db, "settings", "followUp");
      const settingsDoc = await getDoc(settingsRef);
      
      console.log('Fetched follow-up settings:', settingsDoc.data());
      
      if (settingsDoc.exists()) {
        setFollowUpSettings(settingsDoc.data());
      } else {
        // Set default settings if none exist
        const defaultSettings = {
          types: [],
          statuses: [
            { id: '1', name: 'Logged', color: 'secondary', type: 'initial', isDefault: true },
            { id: '2', name: 'In Progress', color: 'primary', type: 'active' },
            { id: '3', name: 'Closed', color: 'success', type: 'complete', isDefault: true },
            { id: '4', name: 'Cancelled', color: 'danger', type: 'terminal', isDefault: true }
          ]
        };
        setFollowUpSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error fetching follow-up settings:', error);
      toast.error('Error loading follow-up settings');
    }
  };

  // Add these states at the top with other states
  const [workHours, setWorkHours] = useState([]);
  const [isLoadingWorkHours, setIsLoadingWorkHours] = useState(false);

  // Add this function to fetch work hours
  const fetchWorkHours = async () => {
    try {
      setIsLoadingWorkHours(true);
      const workHoursRef = collection(db, "workHours");
      const querySnapshot = await getDocs(workHoursRef);
      
      const hours = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setWorkHours(hours);
    } catch (error) {
      console.error("Error fetching work hours:", error);
      toast.error("Failed to fetch work hours");
    } finally {
      setIsLoadingWorkHours(false);
    }
  };

  // Add this function to save work hours
  const handleSaveWorkHours = async () => {
    try {
      const batch = writeBatch(db);
      
      // Delete existing work hours
      const workHoursRef = collection(db, "workHours");
      const existingHours = await getDocs(workHoursRef);
      existingHours.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Add new work hours
      businessHours.forEach(hour => {
        if (!hour.closed) {
          const newHourRef = doc(collection(db, "workHours"));
          batch.set(newHourRef, {
            day: hour.day,
            startTime: hour.startTime,
            endTime: hour.endTime,
            createdAt: serverTimestamp()
          });
        }
      });
      
      await batch.commit();
      toast.success("Work hours saved successfully");
      handleHideCompSchedule();
      await fetchWorkHours();
    } catch (error) {
      console.error("Error saving work hours:", error);
      toast.error("Failed to save work hours");
    }
  };

  // Update your useEffect to fetch work hours
  useEffect(() => {
    fetchSchedulingWindows();
    fetchWorkHours();
  }, []);

  // First, let's organize the settings into clear categories
  const settingsCategories = [
    {
      title: "Company Settings",
      icon: <FaBuilding className="me-2" />,
      items: [
        {
          name: "Company Information",
          description: "Manage your company profile, logo, and contact details",
          icon: <FaInfo className="me-2" />,
          action: "company-info"
        },
        {
          name: "Field Worker App Settings",
          description: "Configure settings for field worker applications",
          icon: <FaMobile className="me-2" />,
          action: "fieldworker"
        }
      ]
    },
    {
      title: "Job Management",
      icon: <FaBriefcase className="me-2" />,
      items: [
        {
          name: "Scheduling Windows",
          description: "Set default time slots for job scheduling (Morning, Afternoon, etc.)",
          icon: <FaClock className="me-2" />,
          action: "schedulingwindows"
        },
        {
          name: "Work Hours",
          description: "Configure company work hours and scheduling availability",
          icon: <FaCalendar className="me-2" />,
          action: "scheduling"
        },
        {
          name: "Follow-Up Tasks",
          description: "Manage follow-up types and status workflows",
          icon: <FaTasks className="me-2" />,
          action: "followuptasks"
        }
      ]
    },
    {
      title: "Communications",
      icon: <FaEnvelope className="me-2" />,
      items: [
        {
          name: "Notifications",
          description: "Configure SMS and push notification settings",
          icon: <FaBell className="me-2" />,
          action: "notifications",
          disabled: true
        },
        {
          name: "Email Settings",
          description: "Set up automated email notifications",
          icon: <FaEnvelope className="me-2" />,
          action: "email",
          disabled: true
        }
      ]
    }
  ];

  // Add this function inside your Settings component
  const getCurrentPageTitle = () => {
    switch (activeTab) {
      case "company-info":
        return "Company Information";
      case "fieldworker":
        return "Field Worker App Settings";
      case "schedulingwindows":
        return "Scheduling Windows";
      case "scheduling":
        return "Work Hours";
      case "followuptasks":
        return "Follow-Up Tasks";
      case "notifications":
        return "Notifications";
      case "email":
        return "Email Settings";
      default:
        return "Settings";
    }
  };

  // Add this helper function for descriptions
  const getPageDescription = () => {
    switch (activeTab) {
      case "company-info":
        return "Manage your company's profile information, logo, and contact details.";
      case "fieldworker":
        return "Configure settings for the field worker mobile application.";
      case "schedulingwindows":
        return "Set up and manage time slots for job scheduling.";
      case "scheduling":
        return "Configure your company's working hours and availability.";
      case "followuptasks":
        return "Manage follow-up task types and their status workflows.";
      case "notifications":
        return "Configure SMS and push notification settings.";
      case "email":
        return "Set up and manage automated email notifications.";
      default:
        return "Configure your system settings.";
    }
  };

  // Add these state declarations near the top with your other states
  const [showAddWindowModal, setShowAddWindowModal] = useState(false);
  const [newWindow, setNewWindow] = useState({
    label: '',
    timeStart: '',
    timeEnd: '',
    isPublic: true
  });

  // Add these handler functions
  const handleAddWindow = () => {
    setShowAddWindowModal(true);
  };

  const handleCloseAddWindowModal = () => {
    setShowAddWindowModal(false);
    setNewWindow({
      label: '',
      timeStart: '',
      endTime: '',
      isPublic: true
    });
  };

  const handleSaveNewWindow = async () => {
    try {
      if (!newWindow.label || !newWindow.timeStart || !newWindow.timeEnd) {
        toast.error('Please fill in all required fields');
        return;
      }

      await addSchedulingWindowToFirestore(newWindow);
      await fetchSchedulingWindows();
      handleCloseAddWindowModal();
      toast.success('Scheduling window added successfully');
    } catch (error) {
      console.error('Error adding scheduling window:', error);
      toast.error('Failed to add scheduling window');
    }
  };

  // Add this modal component
  const AddWindowModal = () => (
    <Modal show={showAddWindowModal} onHide={handleCloseAddWindowModal}>
      <Modal.Header closeButton>
        <Modal.Title>Add Scheduling Window</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Window Label</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Morning, Afternoon"
              value={newWindow.label}
              onChange={(e) => setNewWindow({ ...newWindow, label: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Start Time</Form.Label>
            <Form.Control
              type="time"
              value={newWindow.timeStart}
              onChange={(e) => setNewWindow({ ...newWindow, timeStart: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>End Time</Form.Label>
            <Form.Control
              type="time"
              value={newWindow.timeEnd}
              onChange={(e) => setNewWindow({ ...newWindow, timeEnd: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Public</Form.Label>
            <Form.Select
              value={newWindow.isPublic ? "yes" : "no"}
              onChange={(e) => setNewWindow({ ...newWindow, isPublic: e.target.value === "yes" })}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </Form.Select>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCloseAddWindowModal}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSaveNewWindow}>
          Add Window
        </Button>
      </Modal.Footer>
    </Modal>
  );

  // Add these state declarations at the top with your other states
  const [showAddWorkHoursModal, setShowAddWorkHoursModal] = useState(false);
  const [newWorkHours, setNewWorkHours] = useState({
    day: 'Monday',
    startTime: '',
    endTime: '',
    isOpen: true
  });

  // Add these functions before the return statement
  const handleAddWorkHours = () => {
    setShowAddWorkHoursModal(true);
  };

  const handleCloseWorkHoursModal = () => {
    setShowAddWorkHoursModal(false);
    setNewWorkHours({
      day: 'Monday',
      startTime: '',
      endTime: '',
      isOpen: true
    });
  };

  // For saving individual work hours
  const handleSaveNewWorkHours = async () => {
    try {
      // Validate inputs
      if (!newWorkHours.day || !newWorkHours.startTime || !newWorkHours.endTime) {
        toast.error('Please fill in all required fields');
        return;
      }

      const workHoursRef = collection(db, "workHours");
      await addDoc(workHoursRef, {
        day: newWorkHours.day,
        startTime: newWorkHours.startTime,
        endTime: newWorkHours.endTime,
        isOpen: newWorkHours.isOpen,
        createdAt: serverTimestamp()
      });

      // Refresh work hours
      await fetchWorkHours();
      handleCloseWorkHoursModal();
      toast.success('Work hours added successfully');
    } catch (error) {
      console.error('Error adding work hours:', error);
      toast.error('Failed to add work hours');
    }
  };

  // For saving all business hours and schedule assist settings
  const handleSaveAllSettings = async () => {
    try {
      const batch = writeBatch(db);
      
      // Save business hours
      const workHoursRef = collection(db, "workHours");
      const existingHours = await getDocs(workHoursRef);
      existingHours.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      businessHours.forEach(hour => {
        if (!hour.closed) {
          const newHourRef = doc(collection(db, "workHours"));
          batch.set(newHourRef, {
            day: hour.day,
            startTime: hour.startTime,
            endTime: hour.endTime,
            createdAt: serverTimestamp()
          });
        }
      });
      
      // Save schedule assist settings
      const scheduleAssistRef = doc(db, "settings", "scheduleAssist");
      batch.set(scheduleAssistRef, scheduleAssist, { merge: true });
      
      await batch.commit();
      toast.success('Schedule settings saved successfully!');
      handleHideCompSchedule();
    } catch (error) {
      console.error("Error saving schedule settings:", error);
      toast.error('Failed to save schedule settings');
    }
  };

  // Add this modal component before the return statement
  const AddWorkHoursModal = () => (
    <Modal show={showAddWorkHoursModal} onHide={handleCloseWorkHoursModal} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Configure Work Hours</Modal.Title>
      </Modal.Header>
      <Modal.Body>
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
                    onChange={(e) => handleBusinessHoursChange(index, "startTime", e.target.value)}
                  />
                </td>
                <td>
                  <Form.Control
                    type="time"
                    value={hours.endTime}
                    disabled={hours.closed}
                    onChange={(e) => handleBusinessHoursChange(index, "endTime", e.target.value)}
                  />
                </td>
                <td>
                  <Form.Check
                    type="checkbox"
                    checked={hours.closed}
                    onChange={(e) => handleBusinessHoursChange(index, "closed", e.target.checked)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCloseWorkHoursModal}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSaveWorkHours}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );

  // Add these state declarations at the top with your other states
  const [newType, setNewType] = useState({
    name: '',
    color: '#3b82f6'
  });

  // Add these functions to handle follow-up types
  const handleAddType = async () => {
    try {
      setIsSaving(true);
      
      if (!newType.name.trim()) {
        toast.error('Please enter a type name');
        return;
      }

      const loadingToast = toast.loading('Adding type...');
      
      const settingsRef = doc(db, 'settings', 'followUp');
      
      const updatedTypes = {
        ...followUpSettings.types,
        [Date.now()]: {
          name: newType.name.trim(),
          color: newType.color,
          createdAt: serverTimestamp()
        }
      };

      await setDoc(settingsRef, {
        ...followUpSettings,
        types: updatedTypes
      }, { merge: true });

      setFollowUpSettings(prev => ({
        ...prev,
        types: updatedTypes
      }));

      setNewType({
        name: '',
        color: '#3b82f6'
      });

      toast.dismiss(loadingToast);
      toast.success('Follow-up type added successfully');
    } catch (error) {
      console.error('Error adding follow-up type:', error);
      toast.error(`Failed to add follow-up type: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteType = async (typeId) => {
    try {
      const loadingToast = toast.loading('Deleting type...');
      
      // Reference to the followUp document
      const settingsRef = doc(db, 'settings', 'followUp');
      
      // Get current data
      const currentDoc = await getDoc(settingsRef);
      if (!currentDoc.exists()) {
        toast.dismiss(loadingToast);
        toast.error('Settings document not found');
        return;
      }

      // Create a copy of the current types
      const currentData = currentDoc.data();
      const updatedTypes = { ...currentData.types };
      
      // Delete the specific type
      delete updatedTypes[typeId];

      // Update the document with the new types object
      await updateDoc(settingsRef, {
        types: updatedTypes
      });

      // Update local state
      setFollowUpSettings(prev => ({
        ...prev,
        types: updatedTypes
      }));

      toast.dismiss(loadingToast);
      toast.success('Type deleted successfully');
      
    } catch (error) {
      console.error('Error deleting type:', error);
      toast.error(`Failed to delete type: ${error.message}`);
    }
  };

  // Add this useEffect to fetch follow-up settings
  useEffect(() => {
    const fetchFollowUpSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'followUp'));
        if (settingsDoc.exists()) {
          setFollowUpSettings(settingsDoc.data());
        }
      } catch (error) {
        console.error('Error fetching follow-up settings:', error);
        toast.error('Failed to fetch follow-up settings');
      }
    };

    fetchFollowUpSettings();
  }, []);

  // Add these state declarations at the top with your other states
  const [statusFlow, setStatusFlow] = useState({
    name: '',
    color: '#3b82f6',
    order: 0,
    isDefault: false
  });

 
  // Add these state declarations at the top with your other states
  const [newStatus, setNewStatus] = useState({
    name: '',
    description: '',
    isDefault: false
  });

  // Add this function to handle adding new statuses
  const handleAddStatus = async () => {
    try {
      setIsSaving(true);

      if (!newStatus.name.trim()) {
        toast.error('Please enter a status name');
        return;
      }

      const loadingToast = toast.loading('Adding status...');

      const currentStatuses = followUpSettings.statuses || [];
      const updatedStatuses = [...currentStatuses, {
        name: newStatus.name.trim(),
        description: newStatus.description.trim(),
        isDefault: newStatus.isDefault,
        order: currentStatuses.length,
        createdAt: serverTimestamp()
      }];

      await setDoc(doc(db, 'settings', 'followUp'), {
        ...followUpSettings,
        statuses: updatedStatuses
      }, { merge: true });

      setFollowUpSettings(prev => ({
        ...prev,
        statuses: updatedStatuses
      }));

      setNewStatus({
        name: '',
        description: '',
        isDefault: false
      });

      toast.dismiss(loadingToast);
      toast.success('Status added successfully');
    } catch (error) {
      console.error('Error adding status:', error);
      toast.error('Failed to add status');
    } finally {
      setIsSaving(false);
    }
  };

  // Add these state declarations at the top with your other states
  const [editingType, setEditingType] = useState(null);

  // Add these functions to handle editing follow-up types
  const handleEditType = (typeId) => {
    const typeToEdit = followUpSettings.types[typeId];
    if (typeToEdit) {
      setEditingType({
        id: typeId,
        ...typeToEdit
      });
    }
  };

  const handleUpdateType = async (typeId) => {
    try {
      const loadingToast = toast.loading('Updating type...');

      if (!editingType.name?.trim()) {
        toast.error('Please enter a type name');
        return;
      }

      // Create updated types object
      const updatedTypes = {
        ...followUpSettings.types,
        [typeId]: {
          ...followUpSettings.types[typeId],
          name: editingType.name,
          color: editingType.color,
          updatedAt: serverTimestamp()
        }
      };

      // Update Firestore
      const settingsRef = doc(db, 'settings', 'followUp');
      await setDoc(settingsRef, {
        ...followUpSettings,
        types: updatedTypes
      }, { merge: true });

      // Update local state
      setFollowUpSettings(prev => ({
        ...prev,
        types: updatedTypes
      }));

      // Exit edit mode
      setEditingType(null);

      toast.dismiss(loadingToast);
      toast.success('Follow-up type updated successfully');
    } catch (error) {
      console.error('Error updating follow-up type:', error);
      toast.error(`Failed to update type: ${error.message}`);
    }
  };

  // Add these state declarations at the top with your other states
  const [isEditing, setIsEditing] = useState(false);

  // Update the main render function
  return (
    <Container fluid className="py-4">
      <Row>
        {/* Left Column */}
        <Col lg={3}>
          {/* Breadcrumbs moved here */}
          <nav aria-label="breadcrumb" className={styles.breadcrumbContainer}>
            <ol className="breadcrumb mb-3">
              <li className="breadcrumb-item">
                <Link href="/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link href="/dashboard/settings">Settings</Link>
              </li>
              <li className="breadcrumb-item active">
                {getCurrentPageTitle()}
              </li>
            </ol>
          </nav>

          {/* Settings Categories Card */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">Settings</h6>
            </Card.Header>
            <Card.Body className="p-0">
              <ListGroup variant="flush">
                {settingsCategories.map((category, idx) => (
                  <div key={idx} className={styles.settingsCategory}>
                    <ListGroup.Item className="bg-light">
                      <h6 className="mb-0 d-flex align-items-center">
                        {category.icon} {category.title}
                      </h6>
                    </ListGroup.Item>
                    {category.items.map((item, itemIdx) => (
                      <ListGroup.Item
                        key={itemIdx}
                        action
                        onClick={() => !item.disabled && handleNavigation(item.action)}
                        className={`${styles.settingsItem} ${item.disabled ? styles.disabled : ''}`}
                      >
                        <div className="d-flex align-items-center">
                          {item.icon}
                          <div>
                            <div className="fw-medium">{item.name}</div>
                            <small className="text-muted">{item.description}</small>
                            {item.disabled && (
                              <Badge bg="secondary" className="ms-2">Coming Soon</Badge>
                            )}
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </div>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Content Area */}
        <Col lg={9}>
          {/* Page Title and Description */}
          <h4 className="mb-3">{getCurrentPageTitle()}</h4>
          <p className="text-muted mb-4">
            {getPageDescription()}
          </p>

          {/* Content Area */}
          {renderContent()}
        </Col>
      </Row>
    </Container>
  );
};

export default Settings;
