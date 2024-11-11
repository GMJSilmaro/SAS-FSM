import { useRouter } from "next/router";
import { useEffect, useState, Fragment } from "react";
import {
  getDoc,
  doc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
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
  Nav,
  Modal,
  Pagination,
  InputGroup,
  Badge,
  Container,
} from "react-bootstrap";
import {
  Calendar4,
  CheckCircle,
  XCircle,
  PlayCircle,
  Check,
  ClipboardCheck,
  FileText,
  QuestionCircle,
  Search,
  Tags,
  Plus,
  X,
  Clock,
  TelephoneFill,
  PersonFill,
  Whatsapp,
  Printer,
  Envelope,
  PhoneFill,
  Bell,
  GeoAltFill,
  BellFill,
  ThreeDotsVertical,
} from "react-bootstrap-icons";
import {
  FaPencilAlt, // For edit button
  FaUsers, // For workers stat card
  FaTools, // For equipment stat card
  FaCheckCircle, // For tasks stat card
  FaWind, // For HVAC equipment icon
  FaBolt, // For electrical equipment icon
  FaFaucet, // For plumbing equipment icon
  FaCog, // For default equipment icon
  FaMapMarkerAlt, // For equipment location icon
  FaIndustry, // For equipment brand icon
  FaBarcode, // For equipment model icon
  FaWhatsapp,
  FaRegSquare,
  FaFolder,
  FaWrench,
  FaHashtag,
  FaCalendarCheck,
  FaCalendarTimes,
  FaStickyNote,
  FaLayerGroup,
  FaQrcode,
} from "react-icons/fa";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api"; // Google Map import

import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Page,
  Inject,
} from "@syncfusion/ej2-react-grids";

// Add this import at the top of your file
import defaultAvatar from "/public/images/avatar/NoProfile.png"; // Adjust the path as needed
import Link from "next/link"; // Add this import
import Cookies from "js-cookie";
import { toast } from "react-toastify"; // Make sure to import toast
import { formatDistanceToNow } from "date-fns";
import { AllTechnicianNotesTable } from "../../../components/AllTechnicianNotesTable";
import Swal from 'sweetalert2';
import 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { ReactQuillEditor } from "widgets";
import DOMPurify from 'dompurify'; // Add this for sanitizing HTML
import FollowUpModal from '../../../components/FollowUpModal';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { format } from 'date-fns';
import { getAuth } from 'firebase/auth';


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


// Add this helper function near the top with other helper functions
const formatTime = (timeString) => {
  if (!timeString) return "N/A";
  // Convert 24h format to 12h format with AM/PM
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Add these helper functions before the JobDetails component
const getJobStatusName = (status) => {
  switch (status) {
    case "Created":
      return "Created";
    case "Confirmed":
      return "Confirmed";
    case "Cancelled":
      return "Cancelled";
    case "Job Started":
      return "InProgress";
    case "Job Complete":
      return "Job Complete";
    case "InProgress":
      return "InProgress";
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

// Optional: Add this for status styling
const getStatusColor = (status) => {
  switch (status) {
    case "Created":
      return "secondary"; // grey
    case "Confirmed":
      return "primary"; // blue
    case "Cancelled":
      return "danger"; // red
    case "Job Started":
    case "InProgress":
    case "In Progress":
      return "warning"; // orange
    case "Job Complete":
      return "success"; // green
    case "Validate":
      return "info"; // light blue
    case "Scheduled":
      return "dark"; // dark grey
    default:
      return "secondary"; // grey
  }
};

const googleMapsLibraries = ["places"];

// Add this helper function at the top with your other helpers
const getFollowUpStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case 'logged':
      return { bg: '#FFF3CD', color: '#856404', border: '#FFEEBA' };
    case 'in progress':
      return { bg: '#CCE5FF', color: '#004085', border: '#B8DAFF' };
    case 'closed':
      return { bg: '#D4EDDA', color: '#155724', border: '#C3E6CB' };
    case 'cancelled':
      return { bg: '#F8D7DA', color: '#721C24', border: '#F5C6CB' };
    default:
      return { bg: '#E2E3E5', color: '#383D41', border: '#D6D8DB' };
  }
};

// Update getPriorityColor function to handle numeric priorities
const getPriorityColor = (priority) => {
  // Handle numeric priorities
  if (typeof priority === 'number') {
    switch (priority) {
      case 1: return '#198754'; // Low - green
      case 2: return '#0d6efd'; // Normal - blue
      case 3: return '#fd7e14'; // High - orange
      case 4: return '#dc3545'; // Urgent - red
      case 5: return '#6610f2'; // Critical - purple
      default: return '#6c757d'; // Default - grey
    }
  }
  
  // Handle string priorities (fallback)
  const priorityStr = String(priority || '').toLowerCase();
  switch (priorityStr) {
    case 'urgent': return '#dc3545';
    case 'high': return '#fd7e14';
    case 'normal': return '#0d6efd';
    case 'low': return '#198754';
    default: return '#6c757d';
  }
};

// Add this helper function near the top with other helpers
const geocodeAddress = async (address) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.status === 'OK' && data.results[0]) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

const JobDetails = () => {
  // Move all useState declarations to the top
  const router = useRouter();
  const { jobId } = router.query;
  const [job, setJob] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [location, setLocation] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [technicianNotes, setTechnicianNotes] = useState([]);
  const [newTechnicianNote, setNewTechnicianNote] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [workerComments, setWorkerComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [images, setImages] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [mapKey, setMapKey] = useState(0); // Add this line
  const [isMapScriptLoaded, setIsMapScriptLoaded] = useState(false);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: googleMapsLibraries,
    // Add this to ensure the Google Maps script is loaded before using it
  });
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [currentNotesPage, setCurrentNotesPage] = useState(1);
  const [currentCommentsPage, setCurrentCommentsPage] = useState(1);
  const notesPerPage = 3;
  const commentsPerPage = 5;
  const [searchTerm, setSearchTerm] = useState("");
  const [showTagModal, setShowTagModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([
    "Important",
    "Follow-up",
    "Resolved",
    "Pending",
    "Question",
  ]);
  const [newTag, setNewTag] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [newTask, setNewTask] = useState({
    taskName: '',
    taskDescription: '',
    isPriority: false,
    assignedTo: '',
    isDone: false
  });
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [taskInputs, setTaskInputs] = useState([{
    taskName: '',
    taskDescription: '',
    isPriority: false,
    assignedTo: '',
    isDone: false
  }]);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const csoId = Cookies.get('workerId');
  const [userDetails, setUserDetails] = useState(null);
  const [editingFollowUpId, setEditingFollowUpId] = useState(null);
  const [followUpPriority, setFollowUpPriority] = useState([]);
  const [isEditing, setIsEditing] = useState(null);
  // Add this state and useEffect to fetch follow-up types
  const [followUpTypes, setFollowUpTypes] = useState([]);

  console.log("Job ID from URL:", jobId);

  // Define constants
  const FOLLOW_UP_STATUSES = ['Logged', 'In Progress', 'Closed', 'Cancelled'];

  // Helper functions (outside of useEffect)
  const getTypeWithColor = (typeName) => {
    const type = followUpTypes.find(t => t.name === typeName);
    return (
      <div className={styles.followUpTypeWrapper}>
        {type && (
          <div 
            className={styles.typeIndicator}
            style={{ backgroundColor: type.color }} 
          />
        )}
        <span>{typeName}</span>
      </div>
    );
  };

  // Add the new useEffect for fetching follow-up types
  useEffect(() => {
    const fetchFollowUpTypes = async () => {
      try {
        const settingsRef = doc(db, 'settings', 'followUp');
        const settingsDoc = await getDoc(settingsRef);
        
        if (settingsDoc.exists() && settingsDoc.data().types) {
          const types = settingsDoc.data().types;
          setFollowUpTypes(Object.entries(types).map(([id, type]) => ({
            id,
            ...type
          })));
        }
      } catch (error) {
        console.error('Error fetching follow-up types:', error);
      }
    };

    fetchFollowUpTypes();
  }, []);

  const handleEditClick = () => {
    router.push(`/jobs/edit-jobs/${jobId}`);
  };

  useEffect(() => {
    // Retrieve email from cookies
    const emailFromCookie = Cookies.get("email");
    setUserEmail(emailFromCookie || "Unknown");
  }, []);

  useEffect(() => {
    if (jobId && typeof jobId === "string") {
      const fetchJob = async () => {
        try {
          const jobDoc = await getDoc(doc(db, "jobs", jobId));
          if (jobDoc.exists()) {
            const jobData = jobDoc.data();
            setJob(jobData);
            setEditedDescription(jobData.jobDescription || '');

            // Extract worker IDs and fetch worker details
            const assignedWorkers = jobData.assignedWorkers || [];
            if (Array.isArray(assignedWorkers)) {
              const workerIds = assignedWorkers.map(worker => worker.workerId);
              const workerData = await fetchWorkerDetails(workerIds);
              setWorkers(workerData);
            }

            // Get coordinates from street address if not available
            if (!jobData.location?.coordinates?.latitude || !jobData.location?.coordinates?.longitude) {
              const address = jobData.location?.address?.streetAddress;
              if (address) {
                const coordinates = await geocodeAddress(address);
                if (coordinates) {
                  setLocation(coordinates);
                  // Optionally update the job document with the new coordinates
                  await updateDoc(doc(db, "jobs", jobId), {
                    'location.coordinates': {
                      latitude: coordinates.lat.toString(),
                      longitude: coordinates.lng.toString()
                    }
                  });
                }
              }
            } else {
              // Use existing coordinates if available
              setLocation({
                lat: parseFloat(jobData.location.coordinates.latitude),
                lng: parseFloat(jobData.location.coordinates.longitude)
              });
            }

            setTechnicianNotes(jobData.technicianNotes || []);
            setWorkerComments(jobData.workerComments || []);
            setImages(jobData.images || []);
          }
        } catch (error) {
          console.error("Error fetching job:", error);
        }
      };

      fetchJob();
    }
  }, [jobId]);

  // Add this useEffect to listen for follow-up changes
  useEffect(() => {
    if (jobId) {
      const jobRef = doc(db, 'jobs', jobId);
      
      const unsubscribe = onSnapshot(jobRef, (doc) => {
        if (doc.exists()) {
          const jobData = doc.data();
          setJob(prevJob => ({
            ...prevJob,
            ...jobData
          }));
        }
      });

      // Cleanup subscription on unmount
      return () => unsubscribe();
    }
  }, [jobId]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const addNewTaskInput = () => {
    setTaskInputs([...taskInputs, {
      taskName: '',
      taskDescription: '',
      isPriority: false,
      assignedTo: '',
      isDone: false
    }]);
  };

  const removeTaskInput = (index) => {
    const newInputs = taskInputs.filter((_, i) => i !== index);
    setTaskInputs(newInputs);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    console.log("Starting handleAddTask...");
    
    const validTasks = taskInputs.filter(task => task.taskName.trim());
    
    if (validTasks.length === 0) {
      console.log("Showing error toast");
      toast('Please enter at least one task name');
      return;
    }

    try {
      console.log("Adding tasks to Firebase...");
      const jobRef = doc(db, 'jobs', jobId);
      
      const newTasks = validTasks.map(task => ({
        ...task,
        taskID: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        completionDate: null,
        isDone: false
      }));

      const updatedTasks = [...(job.taskList || []), ...newTasks];

      // Update local state immediately
      setJob(prevJob => ({
        ...prevJob,
        taskList: updatedTasks,
        updatedAt: new Date()
      }));

      // Update Firebase
      await updateDoc(jobRef, {
        taskList: updatedTasks,
        updatedAt: serverTimestamp()
      });

      // Reset form
      setTaskInputs([{
        taskName: '',
        taskDescription: '',
        isPriority: false,
        isDone: false
      }]);
      setShowNewTaskForm(false);

      console.log("Showing success toast");
      toast('Task added successfully!');

    } catch (error) {
      console.error("Error:", error);
      toast('Something went wrong');
    }
  };

  const renderTaskList = () => {
    return (
      <div className={styles.taskSection}>
        <div className={styles.taskHeader}>
          <div className={styles.taskHeaderContent}>
            <h6>Job Tasks</h6>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setShowNewTaskForm(!showNewTaskForm)}
            >
              {showNewTaskForm ? 'Cancel' : 'Add New Task'}
            </Button>
          </div>
        </div>

        {showNewTaskForm && (
          <Form onSubmit={handleAddTask} className={styles.newTaskForm}>
            {taskInputs.map((task, index) => (
              <div key={index} className={styles.taskInputGroup}>
                <Row className="g-2 mb-3">
                  <Col xs={12}>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Task name"
                        value={task.taskName}
                        onChange={(e) => {
                          const newInputs = [...taskInputs];
                          newInputs[index].taskName = e.target.value;
                          setTaskInputs(newInputs);
                        }}
                      />
                      {index > 0 && (
                        <Button 
                          variant="outline-danger"
                          onClick={() => {
                            const newInputs = taskInputs.filter((_, i) => i !== index);
                            setTaskInputs(newInputs);
                          }}
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </InputGroup>
                  </Col>
                  <Col xs={12}>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Task description (optional)"
                      value={task.taskDescription}
                      onChange={(e) => {
                        const newInputs = [...taskInputs];
                        newInputs[index].taskDescription = e.target.value;
                        setTaskInputs(newInputs);
                      }}
                    />
                  </Col>
                  <Col xs={12}>
                    <Form.Check
                      type="checkbox"
                      label="Priority Task"
                      checked={task.isPriority}
                      onChange={(e) => {
                        const newInputs = [...taskInputs];
                        newInputs[index].isPriority = e.target.checked;
                        setTaskInputs(newInputs);
                      }}
                    />
                  </Col>
                </Row>
                {index === taskInputs.length - 1 && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setTaskInputs([...taskInputs, {
                      taskName: '',
                      taskDescription: '',
                      isPriority: false,
                      isDone: false
                    }])}
                    className="mb-3"
                  >
                    <Plus size={16} /> Add Another Task
                  </Button>
                )}
              </div>
            ))}
            <div className={styles.formActions}>
              <Button type="submit" variant="primary">
                Save Tasks
              </Button>
            </div>
          </Form>
        )}

        {(!job.taskList || job.taskList.length === 0) ? (
          <div className={styles.emptyTasks}>
            <FaCheckCircle size={24} />
            <p>No tasks added yet</p>
          </div>
        ) : (
          <div className={styles.taskList}>
            {job.taskList.map((task) => (
              <div key={task.taskID} className={styles.taskItem}>
                <div className={styles.taskContent}>
                  <Form.Check
                    type="checkbox"
                    checked={task.isDone}
                    onChange={() => handleToggleTaskComplete(task.taskID)}
                    label={
                      <div className={task.isDone ? styles.completedTask : ''}>
                        <div className={styles.taskName}>
                          {task.taskName}
                          {task.isPriority && (
                            <Badge bg="danger" className="ms-2">Priority</Badge>
                          )}
                        </div>
                        {task.taskDescription && (
                          <small className={styles.taskDescription}>
                            {task.taskDescription}
                          </small>
                        )}
                        {task.completionDate && (
                          <small className={styles.completionDate}>
                            Completed: {new Date(task.completionDate).toLocaleDateString()}
                          </small>
                        )}
                      </div>
                    }
                  />
                </div>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDeleteTask(task.taskID, task.taskName)}
                  className={styles.deleteButton}
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderEquipmentList = () => {
    if (!job?.equipments || job.equipments.length === 0) {
      return (
        <div className={styles.emptyEquipment}>
          <FaTools size={24} />
          <p>No equipment data available</p>
        </div>
      );
    }

    return (
      <div className={styles.equipmentContainer}>
        <div className={styles.equipmentHeader}>
          <h6 className={styles.equipmentTitle}>
            <FaTools className="me-2" />
            Assigned Equipments
          </h6>
          <Badge bg="primary" className={styles.equipmentCount}>
            {job.equipments.length} items
          </Badge>
        </div>
        
        <div className={styles.equipmentScroll}>
          {job.equipments.map((equipment, index) => (
            <div key={index} className="mb-4">
            
              
              <div className={styles.equipmentDetails}>
                {/* Header */}
                <div className={styles.equipmentHeader}>
                  <h5>{equipment.itemName}</h5>
                  <Badge bg="light" text="dark" className={styles.equipmentType}>
                    {equipment.equipmentType || 'General'}
                  </Badge>
                </div>

                {/* Main Details */}
                <div className={styles.specsList}>
                  {/* Brand & Model */}
                  <div className={styles.specsGroup}>
                    {equipment.brand && (
                      <div className={styles.specItem}>
                        <FaIndustry className={styles.specIcon} />
                        <span className={styles.specLabel}>Brand:</span>
                        <span>{equipment.brand}</span>
                      </div>
                    )}
                    {equipment.modelSeries && (
                      <div className={styles.specItem}>
                        <FaBarcode className={styles.specIcon} />
                        <span className={styles.specLabel}>Model:</span>
                        <span>{equipment.modelSeries}</span>
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className={styles.specsGroup}>
                    {equipment.itemCode && (
                      <div className={styles.specItem}>
                        <FaHashtag className={styles.specIcon} />
                        <span className={styles.specLabel}>Item Code:</span>
                        <span>{equipment.itemCode}</span>
                      </div>
                    )}
                    {equipment.itemGroup && (
                      <div className={styles.specItem}>
                        <FaLayerGroup className={styles.specIcon} />
                        <span className={styles.specLabel}>Group:</span>
                        <span>{equipment.itemGroup}</span>
                      </div>
                    )}
                  </div>

                  {/* Serial & Location */}
                  <div className={styles.specsGroup}>
                    {equipment.serialNo && (
                      <div className={styles.specItem}>
                        <FaQrcode className={styles.specIcon} />
                        <span className={styles.specLabel}>Serial No:</span>
                        <span>{equipment.serialNo}</span>
                      </div>
                    )}
                    {equipment.equipmentLocation && (
                      <div className={styles.specItem}>
                        <FaMapMarkerAlt className={styles.specIcon} />
                        <span className={styles.specLabel}>Location:</span>
                        <span>{equipment.equipmentLocation}</span>
                      </div>
                    )}
                  </div>

                  {/* Warranty Dates */}
                  {(equipment.warrantyStartDate || equipment.warrantyEndDate) && (
                    <div className={styles.warrantyInfo}>
                      {equipment.warrantyStartDate && (
                        <div className={styles.specItem}>
                          <FaCalendarCheck className={styles.specIcon} />
                          <span className={styles.specLabel}>Warranty Start:</span>
                          <span>{new Date(equipment.warrantyStartDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {equipment.warrantyEndDate && (
                        <div className={styles.specItem}>
                          <FaCalendarTimes className={styles.specIcon} />
                          <span className={styles.specLabel}>Warranty End:</span>
                          <span>{new Date(equipment.warrantyEndDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {equipment.notes && (
                    <div className={styles.notesSection}>
                      <div className={styles.specItem}>
                        <FaStickyNote className={styles.specIcon} />
                        <span className={styles.specLabel}>Notes:</span>
                        <span>{equipment.notes}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment = {
        text: newComment,
        timestamp: new Date().toISOString(),
        worker: "Current Worker Name", // Replace with actual worker name
      };
      setWorkerComments([...workerComments, comment]);
      setNewComment("");
      // Here you would also update this in your database
    }
  };

  const handleAddTechnicianNote = async (e) => {
    e.preventDefault();
    if (newTechnicianNote.trim() === "") {
      toast.error("Please enter a note before adding.");
      return;
    }

    try {
      const notesRef = collection(db, "jobs", jobId, "technicianNotes");

      // Include tags in the new note
      await addDoc(notesRef, {
        content: newTechnicianNote,
        createdAt: serverTimestamp(),
        userEmail: userEmail,
        updatedAt: serverTimestamp(),
        tags: selectedTags, // Add this line
      });

      setNewTechnicianNote("");
      setSelectedTags([]); // Reset selected tags
      toast.success("Note added successfully!");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Error adding note. Please try again.");
    }
  };

  const handleDeleteTechnicianNote = async (noteId) => {
    try {
      // Create a reference to the specific note document
      const noteRef = doc(db, "jobs", jobId, "technicianNotes", noteId);

      // Delete the note
      await deleteDoc(noteRef);
      toast.success("Note deleted successfully!");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Error deleting note. Please try again.");
    }
  };

  const handleEditTechnicianNote = async (updatedNote) => {
    if (updatedNote.content.trim() === "") {
      toast.error("Note content cannot be empty.");
      return;
    }

    try {
      const noteRef = doc(db, "jobs", jobId, "technicianNotes", updatedNote.id);

      await updateDoc(noteRef, {
        content: updatedNote.content,
        updatedAt: serverTimestamp(),
        tags: updatedNote.tags, // Add this line
      });

      setEditingNote(null);
      toast.success("Note updated successfully!");
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Error updating note. Please try again.");
    }
  };

  const handleTagSelection = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddNewTag = () => {
    if (newTag.trim() !== "" && !availableTags.includes(newTag.trim())) {
      const trimmedTag = newTag.trim();
      setAvailableTags((prev) => [...prev, trimmedTag]);
      setSelectedTags((prev) => [...prev, trimmedTag]);
      setNewTag("");
      toast.success(`New tag "${trimmedTag}" added successfully!`);
    }
  };

  const handleRemoveNewTag = (tagToRemove) => {
    setSelectedTags((prev) => prev.filter((tag) => tag !== tagToRemove));
    setAvailableTags((prev) => prev.filter((tag) => tag !== tagToRemove));
    toast.success(`Tag "${tagToRemove}" removed successfully!`);
  };

  const renderNotesAndComments = () => {
    if (showAllNotes) {
      return (
        <AllTechnicianNotesTable
          notes={technicianNotes}
          onClose={() => setShowAllNotes(false)}
          id={id}
        />
      );
    }

    // Filter notes based on search term
    const filteredNotes = technicianNotes.filter(
      (note) =>
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate pagination for notes
    const indexOfLastNote = currentNotesPage * notesPerPage;
    const indexOfFirstNote = indexOfLastNote - notesPerPage;
    const currentNotes = filteredNotes.slice(indexOfFirstNote, indexOfLastNote);
    const totalNotePages = Math.ceil(filteredNotes.length / notesPerPage);

    // Calculate pagination for comments
    const indexOfLastComment = currentCommentsPage * commentsPerPage;
    const indexOfFirstComment = indexOfLastComment - commentsPerPage;
    const currentComments = workerComments.slice(
      indexOfFirstComment,
      indexOfLastComment
    );
    const totalCommentPages = Math.ceil(
      workerComments.length / commentsPerPage
    );

    return (
      <>
        <h4 className="mb-3">Technician Notes</h4>

        <Card className="shadow-sm mb-4">
          <Card.Header className="bg-light">
            <h5 className="mb-0">Add Note</h5>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleAddTechnicianNote}>
              <Form.Group className="mb-3">
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={newTechnicianNote}
                  onChange={(e) => setNewTechnicianNote(e.target.value)}
                  placeholder="Enter technician notes here..."
                />
              </Form.Group>
              <Button
                variant="outline-secondary"
                onClick={() => setShowTagModal(true)}
                className="mb-2 w-100"
              >
                <Tags /> Add Tags
              </Button>
              {selectedTags.length > 0 && (
                <div className="mb-2">
                  {selectedTags.map((tag, index) => (
                    <Badge key={index} bg="secondary" className="me-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <Button variant="primary" type="submit" className="w-100">
                <Plus className="me-1" /> Add Note
              </Button>
            </Form>
          </Card.Body>
        </Card>

        <ListGroup variant="flush">
          <InputGroup className="mb-3">
            <InputGroup.Text>
              <Search />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          {currentNotes.map((note) => (
            <ListGroup.Item key={note.jobId} className="border-bottom py-3">
              <Row>
                {/* Left side: Note content, tags, and email */}
                <Col xs={9}>
                  {editingNote && editingNote.jobId === note.jobId ? (
                    <>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={editingNote.content}
                        onChange={(e) =>
                          setEditingNote({
                            ...editingNote,
                            content: e.target.value,
                          })
                        }
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => setShowTagModal(true)}
                        className="mt-2"
                      >
                        <Tags /> Edit Tags
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="mb-1">{note.content}</p>
                      {note.tags && note.tags.length > 0 && (
                        <div className="mb-2">
                          {note.tags.map((tag, index) => (
                            <Badge key={index} bg="secondary" className="me-1">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <small className="text-muted d-block mt-2">
                        By: {note.userEmail}
                      </small>
                    </>
                  )}
                </Col>

                {/* Right side: Date and action buttons */}
                <Col xs={3} className="text-end">
                  <div className="mb-2">
                    <small className="text-muted d-block">
                      {note.createdAt.toLocaleString() || "Date not available"}
                    </small>
                  </div>

                  {editingNote && editingNote.id === note.id ? (
                    <div>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleEditTechnicianNote(editingNote)}
                        className="me-1 mb-1"
                      >
                        Save
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingNote(null)}
                        className="mb-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setEditingNote(note)}
                        className="me-1 mb-1"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteTechnicianNote(note.id)}
                        className="mb-1"
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </Col>
              </Row>
            </ListGroup.Item>
          ))}
        </ListGroup>

        {totalNotePages > 1 && (
          <Row className="mt-3">
            <Col>
              <Pagination className="justify-content-center">
                <Pagination.First
                  onClick={() => setCurrentNotesPage(1)}
                  disabled={currentNotesPage === 1}
                />
                <Pagination.Prev
                  onClick={() =>
                    setCurrentNotesPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentNotesPage === 1}
                />
                {[...Array(totalNotePages).keys()].map((number) => (
                  <Pagination.Item
                    key={number + 1}
                    active={number + 1 === currentNotesPage}
                    onClick={() => setCurrentNotesPage(number + 1)}
                  >
                    {number + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  onClick={() =>
                    setCurrentNotesPage((prev) =>
                      Math.min(prev + 1, totalNotePages)
                    )
                  }
                  disabled={currentNotesPage === totalNotePages}
                />
                <Pagination.Last
                  onClick={() => setCurrentNotesPage(totalNotePages)}
                  disabled={currentNotesPage === totalNotePages}
                />
              </Pagination>
            </Col>
          </Row>
        )}

        {technicianNotes.length > notesPerPage && (
          <Button
            variant="primary"
            onClick={() => setShowAllNotes(true)}
            className="w-100 mt-3"
          >
            View All Technician Notes
          </Button>
        )}
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
            <p>
              Timestamp:{" "}
              {job.technicianSignatureTimestamp
                ? new Date(job.technicianSignatureTimestamp).toLocaleString()
                : "Not signed"}
            </p>
          </div>
          <div>
            <p>Worker Signature: ___________________</p>
            <p>
              Timestamp:{" "}
              {job.workerSignatureTimestamp
                ? new Date(job.workerSignatureTimestamp).toLocaleString()
                : "Not signed"}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderImages = () => {
    const noImageAvailable =
      "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg";

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
                    width: "200px",
                    height: "200px",
                    objectFit: "cover",
                    cursor: "pointer", // Add pointer cursor
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
                    style={{ cursor: "pointer" }} // Add pointer cursor to link
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
                style={{
                  width: "200px",
                  height: "200px",
                  objectFit: "contain",
                }}
              />
              <p className="mt-2">No Images Available</p>
            </div>
          )}
        </div>

        <Modal
          show={selectedImage !== null}
          onHide={handleCloseModal}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Image View</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <img
              src={selectedImage}
              alt="Enlarged job image"
              style={{ width: "100%", height: "auto" }}
            />
          </Modal.Body>
        </Modal>
      </div>
    );
  };

  const renderMap = () => {
    if (!isLoaded) {
      return (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "350px" }}
        >
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
      fullscreenControl: true,
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

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    if (durationMinutes < 0) durationMinutes += 24 * 60; // Handle overnight jobs
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  const renderAssignedWorkers = () => {
    if (!job?.assignedWorkers?.length) {
      return (
        <div className="text-muted">
          No technicians assigned
        </div>
      );
    }

    return (
      <div className={styles.techGrid}>
        {job.assignedWorkers.map((worker, index) => {
          // Get the worker details from the workers array we fetched
          const workerDetails = workers.find(w => w.workerId === worker.workerId);
          
          return (
            <div key={index} className={styles.techCard}>
              <div className={styles.techAvatar}>
                {workerDetails?.profilePicture ? (
                  <Image
                    src={workerDetails.profilePicture}
                    alt={workerDetails.fullName}
                    width={40}
                    height={40}
                    className={styles.avatarImage}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {workerDetails?.firstName?.[0] || 'T'}
                  </div>
                )}
                <div 
                  className={styles.statusIndicator} 
                  data-status={workerDetails?.isOnline ? 'online' : 'offline'} 
                />
              </div>
              
              <div className={styles.techInfo}>
                <div className={styles.techName}>
                  {workerDetails?.fullName || 'Unknown Technician'}
                </div>
                <div className={styles.techRole}>
                  {workerDetails?.role || 'Technician'} · ID: {workerDetails?.workerId}
                </div>
                
                {/* Skills Section */}
                {workerDetails?.skills && workerDetails.skills.length > 0 && (
                  <div className={styles.skillsContainer}>
                    {workerDetails.skills.map((skill, idx) => (
                      <Badge 
                        key={idx} 
                        bg="light" 
                        text="dark" 
                        className={styles.skillBadge}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Contact Actions */}
                <div className={styles.techActions}>
                  {workerDetails?.primaryPhone && (
                    <>
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Call Primary: {workerDetails.primaryPhone}</Tooltip>}
                      >
                        <a href={`tel:${workerDetails.primaryPhone}`} 
                           className={styles.techAction}>
                          <TelephoneFill size={12} />
                        </a>
                      </OverlayTrigger>
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>WhatsApp: {workerDetails.primaryPhone}</Tooltip>}
                      >
                        <a 
                          href={`https://wa.me/${workerDetails.primaryPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.techAction}
                        >
                          <FaWhatsapp size={12} />
                        </a>
                      </OverlayTrigger>
                    </>
                  )}
                  {workerDetails?.secondaryPhone && (
                    <>
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Call Secondary: {workerDetails.secondaryPhone}</Tooltip>}
                      >
                        <a href={`tel:${workerDetails.secondaryPhone}`} 
                           className={styles.techAction}>
                          <PhoneFill size={12} />
                        </a>
                      </OverlayTrigger>
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>WhatsApp: {workerDetails.secondaryPhone}</Tooltip>}
                      >
                        <a 
                          href={`https://wa.me/${workerDetails.secondaryPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.techAction}
                        >
                          <FaWhatsapp size={12} />
                        </a>
                      </OverlayTrigger>
                    </>
                  )}
                  {workerDetails?.email && (
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>Email: {workerDetails.email}</Tooltip>}
                    >
                      <a href={`mailto:${workerDetails.email}`} 
                         className={styles.techAction}>
                        <Envelope size={12} />
                      </a>
                    </OverlayTrigger>
                  )}
                </div>

                {/* Additional Details */}
                <div className={styles.techDetails}>
                  <small className={styles.detailItem}>
                    <GeoAltFill size={12} className="me-1" />
                    {workerDetails?.address?.stateProvince || 'Location N/A'}
                  </small>
                  {workerDetails?.shortBio && (
                    <small className={styles.detailItem}>
                      <FileText size={12} className="me-1" />
                      {workerDetails.shortBio}
                    </small>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  // New helper function for job duration
  const calculateJobDuration = () => {
    if (!job.jobStartTime || !job.jobEndTime) return "N/A";
    // Add your duration calculation logic here
    return "Duration calculation";
  };

  // New helper function for payment and signatures
  const renderPaymentAndSignatures = () => {
    return (
      <div>
        {/* Add your payment details here */}
        <div className="mb-4">
          <h6>Payment Details</h6>
          {/* Payment content */}
        </div>

        {/* Existing signature content */}
        {renderSignatures()}
      </div>
    );
  };

  const handleEditDescription = async () => {
    try {
      const jobRef = doc(db, "jobs", jobId);
      
      // Make sure we're saving the HTML content
      await updateDoc(jobRef, {
        jobDescription: editedDescription,
        updatedAt: serverTimestamp(),
      });
      
      // Update local state
      setJob(prevJob => ({
        ...prevJob,
        jobDescription: editedDescription,
        updatedAt: new Date()
      }));
      
      setIsEditingDescription(false);
      toast.success("Job description updated successfully!");
    } catch (error) {
      console.error("Error updating description:", error);
      toast.error("Error updating description. Please try again.");
    }
  };

  const handleToggleTaskComplete = async (taskID) => {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      const updatedTasks = job.taskList.map(task => {
        if (task.taskID === taskID) {
          const newStatus = !task.isDone;
          return {
            ...task,
            isDone: newStatus,
            completionDate: newStatus ? new Date().toISOString() : null
          };
        }
        return task;
      });

      // Update local state immediately
      setJob(prevJob => ({
        ...prevJob,
        taskList: updatedTasks,
        updatedAt: new Date()
      }));

      // Update Firebase
      await updateDoc(jobRef, {
        taskList: updatedTasks,
        updatedAt: serverTimestamp()
      });

      const completedTask = updatedTasks.find(t => t.taskID === taskID);
      
      if (completedTask.isDone) {
        toast('Task completed!', {
          icon: '🎉',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      }

    } catch (error) {
      console.error('Error updating task:', error);
      toast('Failed to update task', {
        icon: '❌',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    }
  };

  const handleDeleteTask = async (taskID, taskName) => {
    console.log("Starting delete task process...");
    
    const result = await Swal.fire({
      title: 'Delete Task?',
      html: `Are you sure you want to delete:<br/><strong>${taskName}</strong>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      console.log("Delete confirmed, proceeding...");
      try {
        const jobRef = doc(db, 'jobs', jobId);
        const updatedTasks = job.taskList.filter(task => task.taskID !== taskID);

        // Update local state immediately
        setJob(prevJob => ({
          ...prevJob,
          taskList: updatedTasks,
          updatedAt: new Date()
        }));

        // Update Firebase
        await updateDoc(jobRef, {
          taskList: updatedTasks,
          updatedAt: serverTimestamp()
        });

        console.log("Task deleted successfully, showing success toast");
        toast('Task deleted successfully!', {
          icon: '🗑️',
        });

      } catch (error) {
        console.error('Error deleting task:', error);
        console.log("Showing error toast");
        toast('Failed to delete task', {
          icon: '❌',
        });
      }
    } else {
      console.log("Delete cancelled by user");
    }
  };

  // Add this helper function to format the date
  const formatDateTime = (timestamp) => {
    if (!timestamp) return "N/A";
    
    // Handle Firestore Timestamp
    if (timestamp?.toDate) {
      timestamp = timestamp.toDate();
    }
    // Handle string dates
    else if (typeof timestamp === 'string') {
      timestamp = new Date(timestamp);
    }
    
    // Check if the date is valid
    if (!(timestamp instanceof Date) || isNaN(timestamp)) {
      return "N/A";
    }

    return timestamp.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(',', ' -');
  };

  // Update the renderJobDescription function
  const renderJobDescription = () => {
    return (
      <section className={styles.sidebarSection}>
        <div className={styles.descriptionHeader}>
          <div className={styles.headerLeft}>
            <h6 className={styles.sectionTitle}>Job Description</h6>
            <Badge bg="light" text="dark" className={styles.wordCount}>
              {job.jobDescription?.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length || 0} words
            </Badge>
          </div>
          {!isEditingDescription && (
            <Button
              variant="link"
              size="sm"
              className={styles.editButton}
              onClick={() => {
                setIsEditingDescription(true);
                setEditedDescription(job.jobDescription || "");
              }}
            >
              <FaPencilAlt size={14} />
              <span className="ms-1">Edit</span>
            </Button>
          )}
        </div>

        <div className={styles.metaInfo}>
        
          <div className={styles.metaDivider}>•</div>
        
        </div>

        {isEditingDescription ? (
          <div className={styles.editDescription}>
            <Form.Control
              as="textarea"
              rows={6}
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              placeholder="Enter job description..."
              className={styles.descriptionInput}
            />
            <div className={styles.editActions}>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setIsEditingDescription(false)}
                className={styles.actionButton}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleEditDescription}
                className={styles.actionButton}
              >
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.descriptionContent}>
            <div className={styles.descriptionLabel}>Description:</div>
            {job.jobDescription ? (
              <div 
                className={styles.descriptionText}
                dangerouslySetInnerHTML={{ __html: job.jobDescription }}
              />
            ) : (
              <p className={styles.emptyDescription}>No description provided</p>
            )}
          </div>
        )}

        {job.updatedAt && (
          <div className={styles.lastUpdated}>
            <Clock size={12} />
            <small>Last updated: {formatDateTime(job.updatedAt)}</small>
          </div>
        )}
      </section>
    );
  };

  // Modify the FollowUpModal implementation to include an onSuccess callback
  const handleFollowUpSuccess = (newFollowUp) => {
    // Update the local state immediately
    setJob(prevJob => ({
      ...prevJob,
      followUps: {
        ...prevJob.followUps,
        [newFollowUp.id]: newFollowUp
      }
    }));
  };

  // Add loading state check
  if (!job) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const getCurrentUserInfo = () => {
    const email = Cookies.get('email') || 'unknown@email.com';
    const workerId = Cookies.get('workerId') || 'UNKNOWN';
    
    return {
      email,
      workerId
    };
  };

  const handleCreateFollowUp = async (followUpData) => {
    try {
      const userInfo = getCurrentUserInfo();
      const followUpId = `followup-${Date.now()}`;
      
      const newFollowUp = {
        id: followUpId,
        jobID: jobId,
        jobName: job.jobName,
        customerID: job.customerID,
        customerName: job.customerName,
        notes: followUpData.notes,
        type: followUpData.type,
        status: followUpData.status || 'Logged',
        priority: followUpData.priority || 'Normal',
        dueDate: followUpData.dueDate,
        assignedCSOId: null,
        assignedCSOName: null,
        assignedWorkers: job.assignedWorkers || [],
        createdBy: {
          workerId: userInfo.workerId,
          email: userInfo.email
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: {
          workerId: userInfo.workerId,
          email: userInfo.email
        }
      };

      const jobRef = doc(db, 'jobs', jobId);
      await updateDoc(jobRef, {
        [`followUps.${followUpId}`]: newFollowUp,
        lastFollowUp: serverTimestamp(),
        followUpCount: (job.followUpCount || 0) + 1
      });

      // Update local state
      setJob(prevJob => ({
        ...prevJob,
        followUps: {
          ...prevJob.followUps,
          [followUpId]: newFollowUp
        },
        followUpCount: (prevJob.followUpCount || 0) + 1,
        lastFollowUp: new Date()
      }));

      toast.success('Follow-up created successfully');
      setShowFollowUpModal(false);
    } catch (error) {
      console.error('Error creating follow-up:', error);
      toast.error('Failed to create follow-up');
    }
  };

  // Add delete handler
  const handleDeleteFollowUp = async (followUpId) => {
      try {
        const jobRef = doc(db, 'jobs', jobId);
        const updatedFollowUps = { ...job.followUps };
        delete updatedFollowUps[followUpId];
        
        await updateDoc(jobRef, {
          followUps: updatedFollowUps,
          followUpCount: (job.followUpCount || 1) - 1
        });

        toast.success('Follow-up deleted successfully');
      } catch (error) {
        console.error('Error deleting follow-up:', error);
        toast.error('Failed to delete follow-up');
      }
  };

  const handleStatusClick = (status) => {
    router.push(`/dashboard/follow-ups?status=${status}`);
  };

  const handleEditFollowUp = async (followUpId, updatedData) => {
    try {
      const userInfo = getCurrentUserInfo();
      
      const updatedFollowUp = {
        ...job.followUps[followUpId],
        ...updatedData,
        updatedAt: new Date().toISOString(),
        updatedBy: {
          fullName: userInfo.fullName,
          email: userInfo.email,
          workerId: userInfo.workerId
        }
      };

      const jobRef = doc(db, 'jobs', jobId);
      await updateDoc(jobRef, {
        [`followUps.${followUpId}`]: updatedFollowUp
      });

      toast.success('Follow-up updated successfully');
      setIsEditing(null);
    } catch (error) {
      console.error('Error updating follow-up:', error);
      toast.error('Failed to update follow-up');
    }
  };

  const handleStatusChange = async (followUpId, newStatus) => {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      await updateDoc(jobRef, {
        [`followUps.${followUpId}.status`]: newStatus,
        [`followUps.${followUpId}.updatedAt`]: new Date().toISOString()
      });
      
      setIsEditing(null);
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className={styles.container}>
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
                      Job #{job.jobNo}
                    </h1>
                    <div 
                      className="d-flex align-items-center gap-2 mb-2"
                      style={{
                        fontSize: "13px", // Changed from 14px to 12px
                        color: "rgba(255, 255, 255, 0.8)",
                      }}
                    >
                      <PersonFill size={12} /> {/* Also reduced icon size from 14 to 12 */}
                      <span>Created by: {job.createdBy?.fullName || "System User"}</span>
                      <span className="mx-2">•</span>
                      <Calendar4 size={12} /> {/* Also reduced icon size from 14 to 12 */}
                      <span>Created: {formatDateTime(job.createdAt)}</span>
                    </div>
                    <p
                      className="mb-2"
                      style={{
                        fontSize: "16px",
                        color: "rgba(255, 255, 255, 0.7)",
                        fontWeight: "400",
                        lineHeight: "1.5",
                      }}
                    >
                      View and manage job details, tasks, and progress
                    </p>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-light text-dark">
                        {job.jobType || "Maintenance"}
                      </span>
                      <Badge bg={getStatusColor(job.jobStatus)}>
                        {getJobStatusName(job.jobStatus)}
                      </Badge>
                      {job.tags &&
                        job.tags.map((tag, index) => (
                          <Badge key={index} bg="secondary">
                            {tag}
                          </Badge>
                        ))}
                    </div>
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
                      <span style={{ color: "#FFFFFF" }}>Job Details</span>
                    </div>
                  </nav>
                </div>

                {/* Right side buttons */}
                <div className="d-flex flex-column gap-2">
                  {/* <Button
                    variant="light"
                    className="d-flex align-items-center gap-2"
                    style={{
                      padding: "0.5rem 1rem",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    <Printer size={16} />
                    Print Job Sheet
                  </Button> */}

                  <Button
                    variant="light"
                    className="d-flex align-items-center gap-2"
                    style={{
                      padding: "0.5rem 1rem",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                    onClick={handleEditClick}
                  >
                    <FaPencilAlt size={16} />
                    Edit Job
                  </Button>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Main content in a card layout */}
        <Card className={styles.mainCard}>
          <Card.Body>
            <div className={styles.contentGrid}>
              {/* Left sidebar with customer info and job details */}
              <div className={styles.sidebar}>
                {/* Customer Details */}
                <section className={styles.sidebarSection}>
                  <h6>Customer Details</h6>   
                  <div className={styles.customerCard}>
                    {/* Company Header */}
                    <div className={styles.cardHeader}>
                      <div className={styles.headerContent}>
                        <div className={styles.companyAvatar}>P</div>
                        <div>
                          <h5>{job.customerName}</h5>
                          <span className={styles.businessType}>Business</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Details Grid */}
                    <div className={styles.customerGrid}>
                      {/* Left Column */}
                      <div>
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>
                            <PersonFill className={styles.detailIcon} />
                            Contact Person
                          </div>
                          <div className={styles.detailValue}>
                            {job.contact?.contactFullname}
                            <div className={styles.contactId}>ID: {job.contact?.contactID}</div>
                          </div>
                        </div>

                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>
                            <TelephoneFill className={styles.detailIcon} />
                            Office Phone
                          </div>
                          <a href={`tel:${job.contact?.phoneNumber}`} className={styles.phoneLink}>
                            {job.contact?.phoneNumber}
                          </a>
                        </div>

                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>
                            <PhoneFill className={styles.detailIcon} />
                            Mobile Phone
                          </div>
                          <div className={styles.phoneActions}>
                            <a href={`tel:${job.contact?.mobilePhone}`} className={styles.phoneLink}>
                              {job.contact?.mobilePhone}
                            </a>
                            <a 
                              href={`https://wa.me/${job.contact?.mobilePhone}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={styles.whatsappLink}
                            >
                              <FaWhatsapp className={styles.whatsappIcon} />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div>
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>
                            <GeoAltFill className={styles.detailIcon} />
                            Location
                          </div>
                          <address className={styles.address}>
                            {job.location?.address?.streetAddress}<br />
                            {job.location?.address?.postalCode}
                          </address>
                        </div>

                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>
                            <BellFill className={styles.detailIcon} />
                            Notifications
                          </div>
                          <div className={styles.detailValue}>
                            {job.contact?.notification?.notifyCustomer ? 'Enabled' : 'Disabled'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Follow-ups Section */}
                <section className={styles.sidebarSection}>
                  <div className={styles.followUpsContainer}>
                    <div className={styles.followUpsHeader}>
                      <div className={styles.headerLeft}>
                        <h6 className={styles.followUpsTitle}>
                          <FaStickyNote />
                          Follow-ups
                        </h6>
                        <Badge className={styles.followUpsCount}>
                          {Object.keys(job.followUps || {}).length} Items
                        </Badge>
                      </div>
                      <Button
                        variant="outline-primary"
                        className={styles.addFollowUpBtn}
                        onClick={() => setShowFollowUpModal(true)}
                      >
                        <Plus />
                        Add Follow-up
                      </Button>
                    </div>
                    
                    <div className={styles.followUpsScroll}>
                      {(!job.followUps || Object.keys(job.followUps).length === 0) ? (
                        <div className={styles.noFollowUps}>
                          <FaStickyNote size={24} className="text-muted mb-2" />
                          <p className="text-muted mb-0">No follow-ups yet</p>
                        </div>
                      ) : (
                        Object.entries(job.followUps)
                          .sort(([, a], [, b]) => new Date(b.createdAt) - new Date(a.createdAt))
                          .map(([id, followUp]) => (
                            <div 
                              key={id} 
                              className={styles.followUpCard}
                              style={{ 
                                borderLeft: `4px solid ${getPriorityColor(followUp.priority)}` // Add priority color
                              }}
                              onClick={(e) => {
                                if (!e.target.closest('.actionButtons') && !e.target.closest('.statusBadge')) {
                                  router.push({
                                    pathname: '/dashboard/follow-ups',
                                    query: {
                                      followUpId: id, 
                                      status: followUp.status,
                                      type: followUp.type
                                    }
                                  });
                                }
                              }}
                            >
                              <div className={styles.followUpContent}>
                                <div className={styles.statusTypeRow}>
                                  {isEditing === followUp.id ? (
                                    <div className="statusBadge" onClick={(e) => e.stopPropagation()}>
                                      <Form.Select 
                                        size="sm"
                                        value={followUp.status}
                                        onChange={(e) => handleStatusChange(followUp.id, e.target.value)}
                                        style={{ width: 'auto', minWidth: '120px' }}
                                      >
                                        {FOLLOW_UP_STATUSES.map(status => (
                                          <option key={status} value={status}>
                                            {status}
                                          </option>
                                        ))}
                                      </Form.Select>
                                    </div>
                                  ) : (
                                    <div 
                                      className={`${styles.statusBadge} statusBadge`}
                                      style={{ 
                                        backgroundColor: getFollowUpStatusStyle(followUp.status).bg,
                                        color: getFollowUpStatusStyle(followUp.status).color,
                                        border: `1px solid ${getFollowUpStatusStyle(followUp.status).border}`,
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        display: 'inline-block'
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditing(followUp.id);
                                      }}
                                    >
                                      {followUp.status}
                                    </div>
                                  )}
                                  <span className={styles.followUpType}>
                                    {getTypeWithColor(followUp.type)}
                                  </span>
                                  
                            
                                </div>

                                <div className={styles.followUpNotes}>{followUp.notes}</div>

                                <div className={styles.datesRow}>
                                  <div className={styles.dateItem}>
                                    <i className="fe fe-calendar me-1" />
                                    Due: {new Date(followUp.dueDate).toLocaleDateString()}
                                    <i className="fe fe-clock me-1" />
                                    Created: {new Date(followUp.createdAt).toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                     <i className="fe fe-clock me-1" />
                                    Updated: {new Date(followUp.updatedAt).toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </div>
                                  
                                </div>
                                <div className={styles.createdBy}>Created By: {followUp.createdBy?.workerId}</div>
                              </div>

                              <div className={styles.actionButtonsContainer}>
                                <div className={styles.actionButtons}>
                                  <button 
                                    className={`${styles.actionBtn} ${styles.edit}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsEditing(followUp.id);
                                    }}
                                  >
                                    <i className="fe fe-edit-2" />
                                  </button>
                                  <button 
                                    className={`${styles.actionBtn} ${styles.delete}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteFollowUp(followUp.id);
                                    }}
                                  >
                                    <i className="fe fe-trash-2" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </section>

                  {/* Equipment List Section */}
                  <section className={styles.sidebarSection}>
                  {renderEquipmentList()}
                </section>

                {/* Job Description Section */}
                {renderJobDescription()}

                {/* Task List Section */}
                <section className={styles.sidebarSection}>
                  {renderTaskList()}
                </section>

              
              </div>

              {/* Main content area */}
              <div className={styles.mainContent}>
                {/* Job Status and Schedule Info */}
                <section className={styles.contentSection}>
                  <div className={styles.statusHeader}>
                    {/* Appointment Schedule */}
                    <div className={styles.scheduleInfo}>
                      <div className={styles.scheduleHeader}>
                        <h6>
                          <Calendar4 size={16} className="me-2" />
                          Appointment Schedule
                        </h6>
                        <Badge bg={getStatusColor(job.jobStatus)}>
                          {getJobStatusName(job.jobStatus)}
                        </Badge>
                      </div>
                      
                      <div className={styles.scheduleDetails}>
                        <div className={styles.dateInfo}>
                          <div className={styles.calendarBox}>
                            <div className={styles.month}>
                              {new Date(job.startDate).toLocaleString('default', { month: 'short' })}
                            </div>
                            <div className={styles.day}>
                              {new Date(job.startDate).getDate()}
                            </div>
                          </div>
                          <div className={styles.timeSlot}>
                            <Clock size={14} className="me-1" />
                            <span>{formatTime(job.startTime)} - {formatTime(job.endTime)}</span>
                          </div>
                        </div>
                        
                        <div className={styles.scheduleFooter}>
                          <div className={styles.duration}>
                            <Clock size={14} className="me-1" />
                            Duration: {calculateDuration(job.startTime, job.endTime)}
                          </div>
                          <div className={styles.arrangedBy}>
                            <PersonFill size={14} className="me-1" />
                            Arranged by: {job.createdBy?.fullName}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Technicians */}
                    <div className={styles.assignedWorkers}>
                      <div className={styles.techHeader}>
                        <h6>
                          <FaUsers size={16} className="me-2" />
                          Assigned Technicians
                        </h6>
                        <Badge bg="info">
                          {job.assignedWorkers?.length || 0} assigned
                        </Badge>
                      </div>

                      {job.assignedWorkers?.length > 0 ? (
                        <div className={styles.techGrid}>
                          {job.assignedWorkers.map((worker, index) => {
                            const workerDetails = workers.find(w => w.workerId === worker.workerId);
                            
                            return (
                              <div key={index} className={styles.techCard}>
                                <div className={styles.techAvatar}>
                                  {workerDetails?.profilePicture ? (
                                    <Image
                                      src={workerDetails.profilePicture}
                                      alt={workerDetails.fullName}
                                      width={40}
                                      height={40}
                                      className={styles.avatarImage}
                                    />
                                  ) : (
                                    <div className={styles.avatarPlaceholder}>
                                      {workerDetails?.firstName?.[0] || 'T'}
                                    </div>
                                  )}
                                  <div 
                                    className={styles.statusIndicator} 
                                    data-status={workerDetails?.isOnline ? 'online' : 'offline'} 
                                  />
                                </div>
                                
                                <div className={styles.techInfo}>
                                  <div className={styles.techName}>
                                    {workerDetails?.fullName || 'Unknown Technician'}
                                  </div>
                                  <div className={styles.techRole}>
                                    {workerDetails?.role || 'Technician'} · ID: {workerDetails?.workerId}
                                  </div>
                                  
                                  {/* Skills Section */}
                                  {workerDetails?.skills && workerDetails.skills.length > 0 && (
                                    <div className={styles.skillsContainer}>
                                      {workerDetails.skills.map((skill, idx) => (
                                        <Badge 
                                          key={idx} 
                                          bg="light" 
                                          text="dark" 
                                          className={styles.skillBadge}
                                        >
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}

                                  {/* Contact Actions */}
                                  <div className={styles.techActions}>
                                    {workerDetails?.primaryPhone && (
                                      <>
                                        <OverlayTrigger
                                          placement="top"
                                          overlay={<Tooltip>Call Primary: {workerDetails.primaryPhone}</Tooltip>}
                                        >
                                          <a href={`tel:${workerDetails.primaryPhone}`} 
                                             className={styles.techAction}>
                                            <TelephoneFill size={12} />
                                          </a>
                                        </OverlayTrigger>
                                        <OverlayTrigger
                                          placement="top"
                                          overlay={<Tooltip>WhatsApp: {workerDetails.primaryPhone}</Tooltip>}
                                        >
                                          <a 
                                            href={`https://wa.me/${workerDetails.primaryPhone.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.techAction}
                                          >
                                            <FaWhatsapp size={12} />
                                          </a>
                                        </OverlayTrigger>
                                      </>
                                    )}
                                    {workerDetails?.secondaryPhone && (
                                      <>
                                        <OverlayTrigger
                                          placement="top"
                                          overlay={<Tooltip>Call Secondary: {workerDetails.secondaryPhone}</Tooltip>}
                                        >
                                          <a href={`tel:${workerDetails.secondaryPhone}`} 
                                             className={styles.techAction}>
                                            <PhoneFill size={12} />
                                          </a>
                                        </OverlayTrigger>
                                        <OverlayTrigger
                                          placement="top"
                                          overlay={<Tooltip>WhatsApp: {workerDetails.secondaryPhone}</Tooltip>}
                                        >
                                          <a 
                                            href={`https://wa.me/${workerDetails.secondaryPhone.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.techAction}
                                          >
                                            <FaWhatsapp size={12} />
                                          </a>
                                        </OverlayTrigger>
                                      </>
                                    )}
                                    {workerDetails?.email && (
                                      <OverlayTrigger
                                        placement="top"
                                        overlay={<Tooltip>Email: {workerDetails.email}</Tooltip>}
                                      >
                                        <a href={`mailto:${workerDetails.email}`} 
                                           className={styles.techAction}>
                                          <Envelope size={12} />
                                        </a>
                                      </OverlayTrigger>
                                    )}
                                  </div>

                                  {/* Additional Details */}
                                  <div className={styles.techDetails}>
                                    <small className={styles.detailItem}>
                                      <GeoAltFill size={12} className="me-1" />
                                      {workerDetails?.address?.stateProvince || 'Location N/A'}
                                    </small>
                                    {workerDetails?.shortBio && (
                                      <small className={styles.detailItem}>
                                        <FileText size={12} className="me-1" />
                                        {workerDetails.shortBio}
                                      </small>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className={styles.noTech}>
                          <div className={styles.noTechIcon}>
                            <FaUsers size={24} />
                          </div>
                          <p>No technicians assigned</p>
                          <small>Assign technicians to manage this job</small>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* GPS Tracking Section */}
                <section className={styles.contentSection}>
                  <h6>Location & Time Tracking</h6>
                  <div className={styles.mapContainer}>{renderMap()}</div>
                  <div className={styles.timeTracking}>
                    <div>Start: {job.jobStartTime || "Not started"}</div>
                    <div>End: {job.jobEndTime || "Not completed"}</div>
                    <div>Duration: {calculateJobDuration()}</div>
                  </div>
                </section>

                {/* Images Section */}
                <section className={styles.contentSection}>
                  <h6>Job Images</h6>
                  {renderImages()}
                </section>

                {/* Payment & Signature Section */}
                <section className={styles.contentSection}>
                  <h6>Payment & Signatures</h6>
                  {renderPaymentAndSignatures()}
                </section>
              </div>
            </div>
          </Card.Body>
        </Card>
      
      </div>
      <FollowUpModal
        show={showFollowUpModal}
        onHide={() => setShowFollowUpModal(false)}
        jobId={jobId}
        handleCreateFollowUp={handleCreateFollowUp} // Pass the function as prop
        onSuccess={handleFollowUpSuccess}
      />
    </>
  );
};

export default JobDetails;
