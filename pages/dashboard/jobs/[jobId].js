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
  ChevronUp,
  ChevronDown,
  Trash,
  Image as ImageIcon,
  CalendarCheck,
  Images,
  CreditCard2Front,
} from "react-bootstrap-icons";
import {
  FaPencilAlt, // For edit button
  FaTrash, // For delete button
  FaTools, // For equipment stat card
  FaCheckCircle, // For tasks stat card
  FaMapMarkerAlt, // For equipment location icon
  FaIndustry, // For equipment brand icon
  FaBarcode, // For equipment model icon
  FaWhatsapp,
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
    case "Repeated":
      return "Repeated";
    case "Cancelled":
      return "Cancelled";
    case "Job Started":
      return "InProgress";
    case "Job Complete":
      return "Job Complete";
    case "Completed":
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
    case "Repeated":
      return "info"; // light blue
    case "Cancelled":
      return "danger"; // red
    case "Job Started":
    case "InProgress":
    case "In Progress":
      return "warning"; // orange
    case "Job Complete":
      return "success"; // green
    case "Completed":
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
  // Add this state at the top of your component
  const [isTechListExpanded, setIsTechListExpanded] = useState(true);
  // Add these states at the top of your component
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [followUpToDelete, setFollowUpToDelete] = useState(null);
  const [isEquipmentListExpanded, setIsEquipmentListExpanded] = useState(true);
  const [expandedEquipments, setExpandedEquipments] = useState({});
  // Add these state variables at the top with other useState declarations
  const [jobImages, setJobImages] = useState([]);
  const [signatures, setSignatures] = useState({
    technician: null,
    customer: null
  });
  const [showImageModal, setShowImageModal] = useState(false);
  // Update the useEffect to include a loading state
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [isLoadingSignatures, setIsLoadingSignatures] = useState(true);

  console.log("Job ID from URL:", jobId);

  // Define constants
  const FOLLOW_UP_STATUSES = [
    'Logged',
    'In Progress',
    'Pending',
    'Completed',
    'Cancelled'
  ];

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

  useEffect(() => {
    const fetchData = async () => {
      if (!jobId) return;
  
      // Fetch images
      const imagesRef = collection(db, 'jobs', jobId, 'images');
      const imagesSnap = await getDocs(imagesRef);
      const imagesData = imagesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Fetched images TEST:', imagesData);
      setJobImages(imagesData);
  
 
    };
  
    fetchData();
  }, [jobId]);
  

  // Add this useEffect to fetch signatures
  useEffect(() => {
    const fetchSignatures = async () => {
      if (!jobId) return;

      try {
        setIsLoadingSignatures(true);
        console.log('Fetching signatures for job:', jobId);
        
        const signaturesRef = collection(db, 'jobs', jobId, 'signatures');
        const signaturesSnapshot = await getDocs(signaturesRef);
        
        const signaturesData = {};
        signaturesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          signaturesData[data.type] = {
            id: doc.id,
            ...data
          };
        });
        
        console.log('Fetched signatures:', signaturesData);
        setSignatures(signaturesData);
      } catch (error) {
        console.error('Error fetching signatures:', error);
      } finally {
        setIsLoadingSignatures(false);
      }
    };

    fetchSignatures();
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

  const renderJobTasks = () => {
    return (
      <section className={styles.tasksSection}>
        <div className={styles.tasksHeader}>
          <div className={styles.headerLeft}>
            <h6 className={styles.sectionTitle}>
              <ClipboardCheck size={16} className={styles.titleIcon} />
              Job Tasks
            </h6>
            <div className={styles.tasksMeta}>
              <Badge bg="light" text="dark" className={styles.taskCount}>
                {job.taskList?.length || 0} tasks
              </Badge>
              {job.taskList?.length > 0 && (
                <Badge bg="success" className={styles.completedCount}>
                  {job.taskList.filter(task => task.isDone).length} completed
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            className={styles.addTaskButton}
            onClick={() => setShowNewTaskForm(!showNewTaskForm)}
          >
            <Plus size={16} />
            {showNewTaskForm ? 'Cancel' : 'Add Task'}
          </Button>
        </div>

        {showNewTaskForm && (
          <div className={styles.newTaskFormContainer}>
            <Form onSubmit={handleAddTask}>
              {taskInputs.map((task, index) => (
                <div key={index} className={styles.taskInputGroup}>
                  <div className={styles.taskInputHeader}>
                    <h6 className={styles.taskInputTitle}>Task {index + 1}</h6>
                    {index > 0 && (
                      <Button 
                        variant="link"
                        className={styles.removeTaskButton}
                        onClick={() => removeTaskInput(index)}
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                  <Row className="g-3">
                    <Col xs={12}>
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
                </div>
              ))}
              <div className={styles.taskFormActions}>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={addNewTaskInput}
                  className={styles.addAnotherButton}
                >
                  <Plus size={16} /> Add Another Task
                </Button>
                <Button type="submit" variant="primary">
                  Save Tasks
                </Button>
              </div>
            </Form>
          </div>
        )}

        <div className={styles.taskListContainer}>
          {(!job.taskList || job.taskList.length === 0) ? (
            <div className={styles.emptyTasks}>
              <ClipboardCheck size={24} />
              <p>No tasks added yet</p>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => setShowNewTaskForm(true)}
              >
                Add Your First Task
              </Button>
            </div>
          ) : (
            <div className={styles.taskList}>
              {job.taskList.map((task) => (
                <div 
                  key={task.taskID} 
                  className={`${styles.taskItem} ${task.isDone ? styles.taskCompleted : ''}`}
                >
                  <div className={styles.taskContent}>
                    <div className={styles.checkboxWrapper}>
                      <Form.Check
                        type="checkbox"
                        checked={task.isDone}
                        onChange={() => handleToggleTaskComplete(task.taskID)}
                        id={`task-${task.taskID}`}
                        className={styles.taskCheckbox}
                      />
                      {task.isDone && (
                        <div className={styles.completedIndicator}>
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                    <div className={styles.taskDetails}>
                      <div className={styles.taskHeader}>
                        <label 
                          htmlFor={`task-${task.taskID}`}
                          className={styles.taskName}
                        >
                          {task.taskName}
                        </label>
                        {task.isPriority && (
                          <Badge bg="danger" className={styles.priorityBadge}>
                            Priority
                          </Badge>
                        )}
                      </div>
                      {task.taskDescription && (
                        <p className={styles.taskDescription}>
                          {task.taskDescription}
                        </p>
                      )}
                      {task.completionDate && (
                        <div className={styles.completionInfo}>
                          <Badge bg="success" className={styles.completedBadge}>
                            <Check size={10} /> Completed
                          </Badge>
                          <span className={styles.completionDate}>
                            <Clock size={12} />
                            {formatDateTime(task.completionDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="link"
                    className={styles.deleteTaskButton}
                    onClick={() => handleDeleteTask(task.taskID, task.taskName)}
                  >
                    <Trash size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  const toggleEquipment = (index) => {
    setExpandedEquipments(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const renderAssignedEquipments = () => {
    return (
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <FaTools size={16} className={styles.titleIcon} />
          <h6 className={styles.sectionTitle}>
            Assigned Equipments
            <span className={styles.equipmentCount}>
              {job.equipments?.length || 0} items
            </span>
          </h6>
        </div>
        
        <div className={styles.equipmentList}>
          {job.equipments?.map((equipment, index) => (
            <div key={index} className={styles.equipmentCard}>
              <div 
                className={styles.equipmentHeader}
                onClick={() => toggleEquipment(index)}
              >
                <div className={styles.equipmentTitle}>
                  <h3 className={styles.equipmentName}>{equipment.itemName || 'Unnamed Equipment'}</h3>
                  {equipment.equipmentType && (
                    <Badge className={`${styles.typeBadge} ${styles[equipment.equipmentType.toLowerCase()]}`}>
                      {equipment.equipmentType}
                    </Badge>
                  )}
                </div>
                <button className={styles.collapseButton}>
                  {expandedEquipments[index] ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              </div>
              
              <div className={`${styles.equipmentDetails} ${expandedEquipments[index] ? styles.expanded : styles.collapsed}`}>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <FaHashtag size={14} className={styles.detailIcon} />
                    <span className={styles.detailLabel}>Model:</span>
                    <span className={styles.detailValue}>{equipment.modelSeries || 'N/A'}</span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <FaBarcode size={14} className={styles.detailIcon} />
                    <span className={styles.detailLabel}>Item Code:</span>
                    <span className={styles.detailValue}>{equipment.itemCode || 'N/A'}</span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <FaLayerGroup size={14} className={styles.detailIcon} />
                    <span className={styles.detailLabel}>Group:</span>
                    <span className={styles.detailValue}>{equipment.itemGroup || 'N/A'}</span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <FaQrcode size={14} className={styles.detailIcon} />
                    <span className={styles.detailLabel}>Serial No:</span>
                    <span className={styles.detailValue}>{equipment.serialNo || 'N/A'}</span>
                  </div>

                  <div className={styles.detailItem}>
                    <FaMapMarkerAlt size={14} className={styles.detailIcon} />
                    <span className={styles.detailLabel}>Location:</span>
                    <span className={styles.detailValue}>{equipment.equipmentLocation || 'N/A'}</span>
                  </div>
                </div>

                {(equipment.warrantyStartDate || equipment.warrantyEndDate || equipment.notes) && (
                  <div className={styles.equipmentFooter}>
                    {(equipment.warrantyStartDate || equipment.warrantyEndDate) && (
                      <div className={styles.warrantyDates}>
                        <small>
                          <FaCalendarCheck size={12} />
                          Warranty Start: {equipment.warrantyStartDate || 'N/A'}
                        </small>
                        <small>
                          <FaCalendarTimes size={12} />
                          Warranty End: {equipment.warrantyEndDate || 'N/A'}
                        </small>
                      </div>
                    )}
                    {equipment.notes && (
                      <div className={styles.equipmentNotes}>
                        <FaStickyNote size={12} />
                        <span>{equipment.notes}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
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
    const techSignature = signatures.find(sig => sig.type === 'technician');
    const customerSignature = signatures.find(sig => sig.type === 'customer');
  
    return (
      <div className={styles.signaturesSection}>
        <h6>Signatures</h6>
        <div className={styles.signatureGrid}>
          <div className={styles.signatureBox}>
            <p>Technician Signature:</p>
            {techSignature ? (
              <img src={techSignature.signatureURL} alt="Technician Signature" />
            ) : (
              <div className={styles.notSigned}>Not signed</div>
            )}
          </div>
          <div className={styles.signatureBox}>
            <p>Customer Signature:</p>
            {customerSignature ? (
              <img src={customerSignature.signatureURL} alt="Customer Signature" />
            ) : (
              <div className={styles.notSigned}>Not signed</div>
            )}
          </div>
        </div>
      </div>
    );
  };
  const renderImages = () => (
    <div className={styles.imagesSection}>
      {jobImages.length === 0 ? (
        <div className={styles.emptyState}>No images uploaded yet</div>
      ) : (
        <>
          <div className={styles.imageGrid}>
            {jobImages.map((image) => (
              <div 
                key={image.id} 
                className={styles.imageCard}
                onClick={() => {
                  setSelectedImage(image);
                  setShowImageModal(true);
                }}
              >
                <img src={image.url} alt={image.description} />
                <div className={styles.imageCaption}>
                  <p>{image.description}</p>
                  <small>{image.timestamp}</small>
                </div>
              </div>
            ))}
          </div>
  
          {/* Image Modal */}
          <Modal 
            show={showImageModal} 
            onHide={() => setShowImageModal(false)}
            size="lg"
            centered
            className={styles.imageModal}
          >
            <Modal.Header closeButton>
              <Modal.Title>Image Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedImage && (
                <div className={styles.modalImageContainer}>
                  <img 
                    src={selectedImage.url} 
                    alt={selectedImage.description}
                    className={styles.modalImage}
                  />
                  <div className={styles.imageDetails}>
                    <div className={styles.detailRow}>
                      <strong>Description:</strong>
                      <p>{selectedImage.description || 'No description available'}</p>
                    </div>
                    <div className={styles.detailRow}>
                      <strong>Uploaded:</strong>
                      <p>{selectedImage.timestamp ? new Date(selectedImage.timestamp).toLocaleString() : 'Date not available'}</p>
                    </div>
                    {selectedImage.uploadedBy && (
                      <div className={styles.detailRow}>
                        <strong>Uploaded By:</strong>
                        <p>{selectedImage.uploadedBy}</p>
                      </div>
                    )}
                    {selectedImage.category && (
                      <div className={styles.detailRow}>
                        <strong>Category:</strong>
                        <p>{selectedImage.category}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              {selectedImage?.url && (
                <Button 
                  variant="primary" 
                  href={selectedImage.url} 
                  download
                  className={styles.downloadButton}
                >
                  <Images className="me-2" />
                  Download Image
                </Button>
              )}
              <Button 
                variant="secondary" 
                onClick={() => setShowImageModal(false)}
              >
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </div>
  );
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

  // Update the calculateDuration function
  const calculateDuration = (startTime, endTime) => {
    // If job has manual duration set, use those values instead
    if (job.manualDuration) {
      const hours = job.estimatedDurationHours || 0;
      const minutes = job.estimatedDurationMinutes || 0;
      return `${hours}h ${minutes}m`;
    }

    // Otherwise calculate from start/end time
    if (!startTime || !endTime) return "N/A";

    try {
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);

      let totalMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
      
      // Handle cases where end time is on the next day
      if (totalMinutes < 0) {
        totalMinutes += 24 * 60;
      }

      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      return `${hours}h ${minutes}m`;
    } catch (error) {
      console.error("Error calculating duration:", error);
      return "N/A";
    }
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

  // Update the renderPaymentAndSignatures function
  const renderPaymentAndSignatures = () => {
    return (
      <div className={styles.paymentSection}>
        {/* Payment Details */}
        <div className={styles.paymentDetails}>
          <h6 className={styles.subsectionTitle}>Payment Details</h6>
          <div className={styles.paymentInfo}>
            <div className={styles.paymentRow}>
              <span>Payment Status:</span>
              <Badge bg={job.paymentStatus === 'Paid' ? 'success' : 'warning'}>
                {job.paymentStatus || 'Pending'}
              </Badge>
            </div>
            {job.paymentAmount && (
              <div className={styles.paymentRow}>
                <span>Amount:</span>
                <strong>${job.paymentAmount}</strong>
              </div>
            )}
            {job.paymentMethod && (
              <div className={styles.paymentRow}>
                <span>Method:</span>
                <span>{job.paymentMethod}</span>
              </div>
            )}
          </div>
        </div>

        {/* Signatures */}
        <div className={styles.signatures}>
          <h6 className={styles.subsectionTitle}>Signatures</h6>
          <div className={styles.signatureGrid}>
            {/* Technician Signature */}
            <div className={styles.signatureBox}>
              <label>Technician Signature:</label>
              <div className={styles.signatureLine}>
                {signatures.technician ? (
                  <>
                    <img 
                      src={signatures.technician.signatureURL} 
                      alt="Technician Signature" 
                      className={styles.signatureImage}
                    />
                    <div className={styles.signatureMeta}>
                      <small>Signed by: {signatures.technician.signedBy}</small>
                      <small>{formatDateTime(signatures.technician.timestamp)}</small>
                    </div>
                  </>
                ) : (
                  <div className={styles.emptySignature}>Not signed</div>
                )}
              </div>
            </div>

            {/* Customer Signature */}
            <div className={styles.signatureBox}>
              <label>Customer Signature:</label>
              <div className={styles.signatureLine}>
                {signatures.customer ? (
                  <>
                    <img 
                      src={signatures.customer.signatureURL} 
                      alt="Customer Signature" 
                      className={styles.signatureImage}
                    />
                    <div className={styles.signatureMeta}>
                      <small>Signed by: {signatures.customer.signedBy}</small>
                      <small>{formatDateTime(signatures.customer.timestamp)}</small>
                    </div>
                  </>
                ) : (
                  <div className={styles.emptySignature}>Not signed</div>
                )}
              </div>
            </div>
          </div>
        </div>
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

  // Update the showDeleteConfirmation function
  const showDeleteConfirmation = async (itemType) => {
    return Swal.fire({
      title: `Delete ${itemType}?`,
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FF4747', // Bright red for delete
      cancelButtonColor: '#6C757D', // Gray for cancel
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      background: '#ffffff',
      customClass: {
        confirmButton: styles.confirmDeleteButton,
        cancelButton: styles.confirmCancelButton,
        title: styles.alertTitle,
        popup: styles.alertPopup,
        container: styles.alertContainer,
        actions: styles.alertActions
      }
    });
  };

  // Update handleDeleteFollowUp
  const handleDeleteFollowUp = async (followUpId) => {
    const result = await showDeleteConfirmation('Follow-up');
    
    if (result.isConfirmed) {
      try {
        const jobRef = doc(db, 'jobs', jobId);
        const updatedFollowUps = { ...job.followUps };
        delete updatedFollowUps[followUpId];
        
        await updateDoc(jobRef, {
          followUps: updatedFollowUps,
          followUpCount: (job.followUpCount || 1) - 1
        });

        setJob(prevJob => ({
          ...prevJob,
          followUps: updatedFollowUps,
          followUpCount: (prevJob.followUpCount || 1) - 1
        }));

        toast.success('Follow-up deleted successfully');
      } catch (error) {
        console.error('Error deleting follow-up:', error);
        toast.error('Failed to delete follow-up');
      }
    }
  };

  // Update handleDeleteTask
  const handleDeleteTask = async (taskId) => {
    const result = await showDeleteConfirmation('Task');

    if (result.isConfirmed) {
      try {
        const updatedTasks = job.taskList.filter(task => task.taskID !== taskId);
        const jobRef = doc(db, 'jobs', jobId);
        
        await updateDoc(jobRef, {
          taskList: updatedTasks,
          updatedAt: serverTimestamp()
        });

        setJob(prevJob => ({
          ...prevJob,
          taskList: updatedTasks,
          updatedAt: new Date()
        }));

        toast.success('Task deleted successfully');
      } catch (error) {
        console.error('Error deleting task:', error);
        toast.error('Failed to delete task');
      }
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
      <section className={styles.descriptionSection}>
        <div className={styles.descriptionHeader}>
          <div className={styles.headerLeft}>
            <h6 className={styles.sectionTitle}>
              <FileText size={16} className={styles.titleIcon} />
              Job Description
            </h6>
            <div className={styles.descriptionMeta}>
              <Badge bg="light" text="dark" className={styles.wordCount}>
                {job.jobDescription?.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length || 0} words
              </Badge>
              {job.updatedAt && (
                <span className={styles.lastEdited}>
                  <Clock size={12} />
                  Last edited {formatDateTime(job.updatedAt)}
                </span>
              )}
            </div>
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
              <span>Edit</span>
            </Button>
          )}
        </div>

        {isEditingDescription ? (
          <div className={styles.editDescription}>
            <Form.Control
              as="textarea"
              rows={6}
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              placeholder="Enter detailed job description..."
              className={styles.descriptionInput}
            />
            <div className={styles.editActions}>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setIsEditingDescription(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleEditDescription}
              >
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.descriptionContent}>
            {job.jobDescription ? (
              <div 
                className={styles.descriptionText}
                dangerouslySetInnerHTML={{ __html: job.jobDescription }}
              />
            ) : (
              <div className={styles.emptyDescription}>
                <FileText size={24} />
                <p>No description provided</p>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => {
                    setIsEditingDescription(true);
                    setEditedDescription("");
                  }}
                >
                  Add Description
                </Button>
              </div>
            )}
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

  const formatFirestoreTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    
    // Check if it's a Firestore Timestamp
    if (timestamp?.seconds) {
      // Convert to JavaScript Date
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Handle regular dates
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Handle string dates
    if (typeof timestamp === 'string') {
      return timestamp;
    }
    
    return "N/A";
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

  // Add these handler functions
  const handleEditClick = (followUp) => {
    setEditingFollowUp({
      ...followUp,
      id: followUp.id || Object.keys(job.followUps).find(key => job.followUps[key] === followUp)
    });
    setIsEditing(followUp.id);
  };

  const handleEditSave = async (followUp) => {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      const userInfo = getCurrentUserInfo();
      
      const updatedFollowUp = {
        ...followUp,
        updatedAt: new Date().toISOString(),
        updatedBy: {
          workerId: userInfo.workerId,
          email: userInfo.email
        }
      };

      await updateDoc(jobRef, {
        [`followUps.${followUp.id}`]: updatedFollowUp
      });

      // Update local state
      setJob(prevJob => ({
        ...prevJob,
        followUps: {
          ...prevJob.followUps,
          [followUp.id]: updatedFollowUp
        }
      }));

      setEditingFollowUp(null);
      toast.success('Follow-up updated successfully');
    } catch (error) {
      console.error('Error updating follow-up:', error);
      toast.error('Failed to update follow-up');
    }
  };

  const handleDeleteClick = (followUp) => {
    setFollowUpToDelete(followUp);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!followUpToDelete) return;
    
    try {
      await deleteDoc(doc(db, "jobs", jobId, "followUps", followUpToDelete.id));
      setShowDeleteConfirm(false);
      setFollowUpToDelete(null);
    } catch (error) {
      console.error("Error deleting follow-up:", error);
    }
  };

  // Add this helper function for status badge colors
  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in progress':
        return 'primary';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Add or update the handleEditJob function
  const handleEditJob = () => {
    // Navigate to the edit page for this job
    router.push(`/jobs/edit-jobs/${jobId}`);
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
                      <span>Created: {formatFirestoreTimestamp(job.createdAt)}</span>
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
                    onClick={handleEditJob}  // Changed from handleEditClick to handleEditJob
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
              {/* Left Column */}
              <div className={styles.column}>
                {/* Customer Details */}
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h6 className={styles.sectionTitle}>
                      <PersonFill className={styles.titleIcon} />
                      Customer Details
                    </h6>
                  </div>
                  <div className={styles.content}>
                    <div className={styles.customerDetails}>
                      {/* Customer Avatar and Name */}
                      <div className={styles.customerHeader}>
                        <div className={styles.avatarSection}>
                          <div className={styles.avatar}>{job.customerName?.[0] || 'P'}</div>
                          <div className={styles.customerMeta}>
                            <h3 className={styles.customerName}>{job.customerName}</h3>
                            <span className={styles.businessBadge}>Business</span>
                          </div>
                        </div>
                      </div>

                      {/* Customer Information List */}
                      <div className={styles.infoList}>
                        {/* Contact Person */}
                        <div className={styles.infoItem}>
                          <div className={styles.infoLabel}>
                            <PersonFill size={14} className={styles.infoIcon} />
                            Contact Person
                          </div>
                          <div className={styles.infoValue}>
                            {job.contact?.contactFullname || 'Not specified'}
                            {job.contact?.contactID && (
                              <span className={styles.contactId}>ID: {job.contact.contactID}</span>
                            )}
                          </div>
                        </div>

                        {/* Office Phone */}
                        <div className={styles.infoItem}>
                          <div className={styles.infoLabel}>
                            <TelephoneFill size={14} className={styles.infoIcon} />
                            Office Phone
                          </div>
                          <div className={styles.infoValue}>
                            {job.contact?.phoneNumber ? (
                              <div className={styles.contactActions}>
                                <span>{job.contact.phoneNumber}</span>
                                <div className={styles.actionButtons}>
                                  <a href={`tel:${job.contact.phoneNumber}`} className={styles.actionIcon}>
                                    <TelephoneFill size={14} />
                                  </a>
                                  <a 
                                    href={`https://wa.me/${job.contact.phoneNumber.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.actionIcon}
                                  >
                                    <FaWhatsapp size={14} />
                                  </a>
                                </div>
                              </div>
                            ) : (
                              'Not specified'
                            )}
                          </div>
                        </div>

                        {/* Mobile Phone */}
                        <div className={styles.infoItem}>
                          <div className={styles.infoLabel}>
                            <PhoneFill size={14} className={styles.infoIcon} />
                            Mobile Phone
                          </div>
                          <div className={styles.infoValue}>
                            {job.contact?.mobilePhone ? (
                              <div className={styles.contactActions}>
                                <span>{job.contact.mobilePhone}</span>
                                <div className={styles.actionButtons}>
                                  <a href={`tel:${job.contact.mobilePhone}`} className={styles.actionIcon}>
                                    <TelephoneFill size={14} />
                                  </a>
                                  <a 
                                    href={`https://wa.me/${job.contact.mobilePhone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.actionIcon}
                                  >
                                    <FaWhatsapp size={14} />
                                  </a>
                                </div>
                              </div>
                            ) : (
                              'Not specified'
                            )}
                          </div>
                        </div>

                        {/* Email */}
                        {job.contact?.email && (
                          <div className={styles.infoItem}>
                            <div className={styles.infoLabel}>
                              <Envelope size={14} className={styles.infoIcon} />
                              Email
                            </div>
                            <div className={styles.infoValue}>
                              <div className={styles.contactActions}>
                                <span>{job.contact.email}</span>
                                <a href={`mailto:${job.contact.email}`} className={styles.actionIcon}>
                                  <Envelope size={14} />
                                </a>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Location */}
                        <div className={styles.infoItem}>
                          <div className={styles.infoLabel}>
                            <GeoAltFill className={styles.titleIcon} />
                            Location
                          </div>
                          <div className={styles.infoValue}>
                            {job.location?.locationName || job.location?.address || 'No location specified'}
                          </div>
                        </div>

                     
                      </div>
                    </div>
                  </div>
                </section>

                   {/* Job Description Section */}
                   {renderJobDescription()}

                   
                {/* Equipment List Section */}
                
                  {renderAssignedEquipments()}
              


                {/* Follow-ups Section */}
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h6 className={styles.sectionTitle}>
                      <Bell size={16} className={styles.headerIcon} />
                      Follow-ups
                    </h6>
                    <button className={styles.actionButton} onClick={() => setShowFollowUpModal(true)}>
                      <Plus size={14} />
                      Add Follow-up
                    </button>
                  </div>
                  
                  <div className={styles.followUpsList}>
                    {(!job.followUps || Object.keys(job.followUps).length === 0) ? (
                      <div className={styles.noFollowUps}>
                        <Bell size={24} className="text-muted mb-2" />
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
                              borderLeft: `4px solid ${getPriorityColor(followUp.priority)}` 
                            }}
                          >
                            {editingFollowUp?.id === id ? (
                              <div className={styles.editForm}>
                                <Form onSubmit={(e) => {
                                  e.preventDefault();
                                  handleEditSave({ ...editingFollowUp });
                                }}>
                                  <Form.Group className="mb-3">
                                    <Form.Control
                                      as="textarea"
                                      value={editingFollowUp.notes}
                                      onChange={(e) => setEditingFollowUp({
                                        ...editingFollowUp,
                                        notes: e.target.value
                                      })}
                                    />
                                  </Form.Group>
                                {/* Add status dropdown */}
                                <Form.Group className="mb-3">
                                  <Form.Select
                                    value={editingFollowUp.status}
                                    onChange={(e) => setEditingFollowUp({
                                      ...editingFollowUp,
                                      status: e.target.value
                                    })}
                                  >
                                    {FOLLOW_UP_STATUSES.map(status => (
                                      <option key={status} value={status}>{status}</option>
                                    ))}
                                  </Form.Select>
                                </Form.Group>
                                <div className={styles.editActions}>
                                  <Button 
                                    variant="secondary" 
                                    onClick={() => setEditingFollowUp(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    variant="primary" 
                                    type="submit"
                                  >
                                    Save
                                  </Button>
                                </div>
                              </Form>
                            </div>
                          ) : (
                            <>
                              <div className={styles.followUpHeader}>
                                <div className={styles.followUpStatus}>
                                  <Badge bg={getStatusBadgeColor(followUp.status)}>
                                    {followUp.status}
                                  </Badge>
                                </div>
                                <div className={styles.followUpActions}>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => handleEditClick(followUp)}
                                  >
                                    <FaPencilAlt size={14} />
                                  </Button>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => handleDeleteFollowUp(id)}
                                  >
                                    <FaTrash size={14} />
                                  </Button>
                                </div>
                              </div>
                              <div className={styles.followUpContent}>
                                <p className={styles.followUpNotes}>{followUp.notes}</p>
                                <div className={styles.followUpMeta}>
                                  <div className={styles.metaItem}>
                                    <Calendar4 size={12} />
                                    <span>Due: {new Date(followUp.dueDate).toLocaleDateString()}</span>
                                  </div>
                                  <div className={styles.metaItem}>
                                    <Clock size={12} />
                                    <span>Created: {new Date(followUp.createdAt).toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}</span>
                                  </div>
                                  <div className={styles.metaItem}>
                                    <PersonFill size={12} />
                                    <span>By: {followUp.createdBy?.email || 'Unknown'}</span>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </section>

             
                {/* GPS Tracking Section */}
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h6 className={styles.sectionTitle}>Location & Time Tracking</h6>
                  </div>
                  <div className={styles.customerCard}>
                    <div className={styles.mapContainer}>{renderMap()}</div>
                    <div className={styles.timeTracking}>
                      <div>Start: {job.jobStartTime || "Not started"}</div>
                      <div>End: {job.jobEndTime || "Not completed"}</div>
                      <div>Duration: {calculateJobDuration()}</div>
                    </div>
                  </div>
                </section>


             
              </div>

              {/* Right Column */}
              <div className={styles.column}>
                {/* Job Status and Schedule Info */}
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h6 className={styles.sectionTitle}>
                      <CalendarCheck className={styles.titleIcon} />
                      Appointment Schedule
                    </h6>
                  </div>
                  <div className={styles.scheduleContent}>
                    {/* Date and Time Info */}
                    <div className={styles.scheduleBox}>
                      <div className={styles.dateBox}>
                        <div className={styles.month}>NOV</div>
                        <div className={styles.day}>23</div>
                      </div>
                      
                      <div className={styles.scheduleInfo}>
                        <div className={styles.timeSlot}>
                          <Clock size={14} />
                          <span>{formatTime(job.startTime)} - {formatTime(job.endTime)}</span>
                        </div>
                        <div className={styles.duration}>
                          <Clock size={14} />
                          <span>Duration: {job.manualDuration || `${job.estimatedDurationHours}h${job.estimatedDurationMinutes ? ` and ${job.estimatedDurationMinutes}m` : ''}`}</span>
                        </div>
                        <div className={styles.arrangedBy}>
                          <PersonFill size={14} />
                          <span>Arranged by: {job.createdBy?.fullName || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Technicians */}
                    <div className={styles.techSection}>
                      <div 
                        className={styles.techHeader} 
                        onClick={() => setIsTechListExpanded(!isTechListExpanded)}
                      >
                        <div className={styles.techHeaderLeft}>
                          <PersonFill size={14} />
                          <span>Assigned Technicians</span>
                          <span className={styles.techCount}>
                            ({job.assignedWorkers?.length || 0})
                          </span>
                        </div>
                        <button className={styles.collapseButton}>
                          {isTechListExpanded ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </button>
                      </div>
                      
                      <div className={`${styles.techList} ${isTechListExpanded ? styles.expanded : styles.collapsed}`}>
                        {job.assignedWorkers?.length > 0 ? (
                          job.assignedWorkers.map((worker, index) => {
                            const workerDetails = workers.find(w => w.workerId === worker.workerId);
                            return (
                              <div key={index} className={styles.techItem}>
                                <div className={styles.techProfile}>
                                  {workerDetails?.profilePicture ? (
                                    <Image 
                                      src={workerDetails.profilePicture} 
                                      alt={workerDetails.fullName}
                                      width={40}
                                      height={40}
                                      className={styles.techImage}
                                    />
                                  ) : (
                                    <div className={styles.techInitial}>
                                      {workerDetails?.firstName?.[0] || 'T'}
                                    </div>
                                  )}
                                  <div className={styles.techInfo}>
                                    <span className={styles.techName}>{workerDetails?.fullName}</span>
                                    <span className={styles.techId}>ID: {workerDetails?.workerId}</span>
                                  </div>
                                </div>
                                <div className={styles.techActions}>
                                  {workerDetails?.primaryPhone && (
                                    <>
                                      <a href={`tel:${workerDetails.primaryPhone}`} className={styles.actionIcon}>
                                        <TelephoneFill size={14} />
                                      </a>
                                      <a href={`https://wa.me/${workerDetails.primaryPhone.replace(/\D/g, '')}`} 
                                         target="_blank" 
                                         rel="noopener noreferrer" 
                                         className={styles.actionIcon}>
                                        <FaWhatsapp size={14} />
                                      </a>
                                    </>
                                  )}
                                  {workerDetails?.email && (
                                    <a href={`mailto:${workerDetails.email}`} className={styles.actionIcon}>
                                      <Envelope size={14} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className={styles.noTech}>No technicians assigned</div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                   {/* Task List Section */}
               
                  {renderJobTasks()}
            

                {/* Images Section */}
                <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h6 className={styles.sectionTitle}>
                      <CreditCard2Front className={styles.titleIcon} />
                      Job Images
                    </h6>
                  </div>
                {renderImages()}
                </section>

                {/* Payment & Signature Section */}
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h6 className={styles.sectionTitle}>
                      <CreditCard2Front className={styles.titleIcon} />
                      Payment & Signatures
                    </h6>
                  </div>
                  <div className={styles.paymentDetails}>
                    {renderPaymentAndSignatures()}
                  </div>
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
      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this follow-up?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default JobDetails;
