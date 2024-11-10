import { useRouter } from "next/router";
import { useEffect, useState, Fragment } from "react";
import { getDoc, doc, setDoc, collection, getDocs, query, orderBy, onSnapshot, deleteDoc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
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
  Pagination,
  InputGroup,
  Badge,
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
  Search,
  Tags,
  Plus,
  X,
  Whatsapp, // Add this import
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
import Cookies from 'js-cookie';
import { toast } from 'react-toastify'; // Make sure to import toast
import { formatDistanceToNow } from 'date-fns';
import { AllTechnicianNotesTable } from '../../../components/AllTechnicianNotesTable'; 

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

// Add this helper function near the top with other helper functions
const formatTime = (timeString) => {
  if (!timeString) return "N/A";
  // Convert 24h format to 12h format with AM/PM
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const JobDetails = () => {
  const router = useRouter();
  const { id } = router.query; // Extract job ID from URL
  const [job, setJob] = useState(null);
  const [workers, setWorkers] = useState([]); // To store worker details
  const [location, setLocation] = useState(null); // Store location for Google Map
  const [activeTab, setActiveTab] = useState("overview"); // State for active tab
  const [technicianNotes, setTechnicianNotes] = useState([]);
  const [newTechnicianNote, setNewTechnicianNote] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [userEmail, setUserEmail] = useState('');
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
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [currentNotesPage, setCurrentNotesPage] = useState(1);
  const [currentCommentsPage, setCurrentCommentsPage] = useState(1);
  const notesPerPage = 3;
  const commentsPerPage = 5;
  const [searchTerm, setSearchTerm] = useState('');
  const [showTagModal, setShowTagModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState(['Important', 'Follow-up', 'Resolved', 'Pending', 'Question']);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    // Retrieve email from cookies
    const emailFromCookie = Cookies.get('email');
    setUserEmail(emailFromCookie || 'Unknown');
  }, []);

  useEffect(() => {
    if (id && activeTab === "notes") {  // Only fetch notes when on the notes tab
      console.log("Fetching notes for job:", id); // Debug log
      
      const notesRef = collection(db, "jobs", id, "technicianNotes");
      const q = query(notesRef, orderBy("createdAt", "desc"));
  
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedNotes = snapshot.docs.map(doc => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate?.() || new Date();
          return {
            id: doc.id,
            ...data,
            createdAt
          };
        });
        console.log('Fetched notes:', fetchedNotes); // Debug log
        setTechnicianNotes(fetchedNotes);
      }, (error) => {
        console.error("Error fetching notes:", error);
        toast.error("Error loading notes. Please try again.");
      });
  
      return () => unsubscribe();
    }
  }, [id, activeTab]); // Add activeTab to the dependency array

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

            setTechnicianNotes(jobData.technicianNotes || []);
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

  useEffect(() => {
    if (id) {
      const notesRef = collection(db, "jobs", id, "technicianNotes");
      const q = query(notesRef, orderBy("createdAt", "desc"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedNotes = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt ? data.createdAt.toDate() : new Date() // Convert to Date object or use current date as fallback
          };
        });
        setTechnicianNotes(fetchedNotes);
      }, (error) => {
        console.error("Error fetching notes:", error);
        toast.error("Error loading notes. Please try again.");
      });

      return () => unsubscribe();
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

  const handleAddTechnicianNote = async (e) => {
    e.preventDefault();
    if (newTechnicianNote.trim() === '') {
      toast.error('Please enter a note before adding.');
      return;
    }

    try {
      const notesRef = collection(db, "jobs", id, "technicianNotes");
      
      // Include tags in the new note
      await addDoc(notesRef, {
        content: newTechnicianNote,
        createdAt: serverTimestamp(),
        userEmail: userEmail,
        updatedAt: serverTimestamp(),
        tags: selectedTags // Add this line
      });

      setNewTechnicianNote('');
      setSelectedTags([]); // Reset selected tags
      toast.success('Note added successfully!');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Error adding note. Please try again.');
    }
  };

  const handleDeleteTechnicianNote = async (noteId) => {
    try {
      // Create a reference to the specific note document
      const noteRef = doc(db, "jobs", id, "technicianNotes", noteId);
      
      // Delete the note
      await deleteDoc(noteRef);
      toast.success('Note deleted successfully!');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Error deleting note. Please try again.');
    }
  };

  const handleEditTechnicianNote = async (updatedNote) => {
    if (updatedNote.content.trim() === '') {
      toast.error('Note content cannot be empty.');
      return;
    }

    try {
      const noteRef = doc(db, "jobs", id, "technicianNotes", updatedNote.id);
      
      await updateDoc(noteRef, {
        content: updatedNote.content,
        updatedAt: serverTimestamp(),
        tags: updatedNote.tags // Add this line
      });

      setEditingNote(null);
      toast.success('Note updated successfully!');
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Error updating note. Please try again.');
    }
  };

  const handleTagSelection = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddNewTag = () => {
    if (newTag.trim() !== '' && !availableTags.includes(newTag.trim())) {
      const trimmedTag = newTag.trim();
      setAvailableTags(prev => [...prev, trimmedTag]);
      setSelectedTags(prev => [...prev, trimmedTag]);
      setNewTag('');
      toast.success(`New tag "${trimmedTag}" added successfully!`);
    }
  };

  const handleRemoveNewTag = (tagToRemove) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
    setAvailableTags(prev => prev.filter(tag => tag !== tagToRemove));
    toast.success(`Tag "${tagToRemove}" removed successfully!`);
  };

  const renderNotesAndComments = () => {
    if (showAllNotes) {
      return (
        <AllTechnicianNotesTable 
          notes={technicianNotes} 
          onClose={() => setShowAllNotes(false)}
          jobId={id}
        />
      );
    }

    // Filter notes based on search term
    const filteredNotes = technicianNotes.filter(note =>
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
    const currentComments = workerComments.slice(indexOfFirstComment, indexOfLastComment);
    const totalCommentPages = Math.ceil(workerComments.length / commentsPerPage);

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
              <Button variant="outline-secondary" onClick={() => setShowTagModal(true)} className="mb-2 w-100">
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
            <ListGroup.Item key={note.id} className="border-bottom py-3">
              <Row>
                {/* Left side: Note content, tags, and email */}
                <Col xs={9}>
                  {editingNote && editingNote.id === note.id ? (
                    <>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={editingNote.content}
                        onChange={(e) => setEditingNote({...editingNote, content: e.target.value})}
                      />
                      <Button variant="outline-secondary" onClick={() => setShowTagModal(true)} className="mt-2">
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
                      {note.createdAt.toLocaleString() || 'Date not available'}
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
                  onClick={() => setCurrentNotesPage(prev => Math.max(prev - 1, 1))}
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
                  onClick={() => setCurrentNotesPage(prev => Math.min(prev + 1, totalNotePages))}
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
            <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  {getStatusIcon(job.jobStatus)}
                  <div className="ms-2">
                    <h5 className="mb-0 text-body">Job Status</h5>
                  </div>
                </div>
                <div>
                  <span className="badge" style={getStatusColor(job.jobStatus)}>
                    {getJobStatusName(job.jobStatus)}
                  </span>
                </div>
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
      case "InProgress":
        return "In Progress";
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
      case "InProgress":
        return { backgroundColor: "#ff9800", color: "#fff" };
      case "In Progress":
        return { backgroundColor: "#ff9800", color: "#fff" };
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

  const formatPhoneForWhatsApp = (phone) => {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Add country code if not present (assuming default country code is +60 for Malaysia)
    if (!cleanPhone.startsWith('60')) {
      return `60${cleanPhone}`;
    }
    
    return cleanPhone;
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
  <p className="mb-0 me-2">
    {job.contact?.mobilePhone || "Unknown Mobile Phone"}
  </p>
  {job.contact?.mobilePhone && (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip id="mobile-whatsapp-tooltip">Open in WhatsApp</Tooltip>}
    >
      <a
        href={`https://wa.me/${formatPhoneForWhatsApp(job.contact.mobilePhone)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-success"
      >
        <Whatsapp size={20} />
      </a>
    </OverlayTrigger>
  )}
</div>

{/* Phone Number (Contact) */}
<div className="d-flex align-items-center mb-2">
  <TelephoneFill size={16} className="text-primary me-2" />
  <p className="mb-0 me-2">
    {job.contact?.phoneNumber || "Unknown Phone Number"}
  </p>
  {job.contact?.phoneNumber && (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip id="phone-whatsapp-tooltip">Open in WhatsApp</Tooltip>}
    >
      <a
        href={`https://wa.me/${formatPhoneForWhatsApp(job.contact.phoneNumber)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-success"
      >
        <Whatsapp size={20} />
      </a>
    </OverlayTrigger>
  )}
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
            {/* Schedule Header */}
            <Card.Header className="border-bottom">
              <h5 className="mb-0">Schedule Details</h5>
            </Card.Header>

            {/* Start Date/Time Section */}
            <Card.Body className="py-3">
              <Row>
                <Col md={6}>
                  <div className="d-flex align-items-center mb-2">
                    <div className="schedule-icon-wrapper bg-soft-primary rounded-circle p-2 me-3">
                      <Calendar4 size={18} className="text-primary" />
                    </div>
                    <div>
                      <small className="text-muted d-block">Start Date</small>
                      <h6 className="mb-0">{formatDate(job.startDate)}</h6>
                    </div>
                  </div>
                </Col>
                {job.startTime && (
                  <Col md={6}>
                    <div className="d-flex align-items-center mb-2">
                      <div className="schedule-icon-wrapper bg-soft-primary rounded-circle p-2 me-3">
                        <Clock size={18} className="text-primary" />
                      </div>
                      <div>
                        <small className="text-muted d-block">Start Time</small>
                        <h6 className="mb-0">{formatTime(job.startTime)}</h6>
                      </div>
                    </div>
                  </Col>
                )}
              </Row>
            </Card.Body>

            {/* End Date/Time Section */}
            <Card.Body className="border-top py-3">
              <Row>
                <Col md={6}>
                  <div className="d-flex align-items-center mb-2">
                    <div className="schedule-icon-wrapper bg-soft-danger rounded-circle p-2 me-3">
                      <Calendar4 size={18} className="text-danger" />
                    </div>
                    <div>
                      <small className="text-muted d-block">End Date</small>
                      <h6 className="mb-0">{formatDate(job.endDate)}</h6>
                    </div>
                  </div>
                </Col>
                {job.endTime && (
                  <Col md={6}>
                    <div className="d-flex align-items-center mb-2">
                      <div className="schedule-icon-wrapper bg-soft-danger rounded-circle p-2 me-3">
                        <Clock size={18} className="text-danger" />
                      </div>
                      <div>
                        <small className="text-muted d-block">End Time</small>
                        <h6 className="mb-0">{formatTime(job.endTime)}</h6>
                      </div>
                    </div>
                  </Col>
                )}
              </Row>
            </Card.Body>

            {/* Duration Badge */}
            {job.startDate && job.endDate && (
              <Card.Body className="border-top py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="schedule-icon-wrapper bg-soft-warning rounded-circle p-2 me-3">
                      <Clock size={18} className="text-warning" />
                    </div>
                    <div>
                      <h6 className="mb-0">Total Duration</h6>
                    </div>
                  </div>
                  <div className="d-flex align-items-center">
                    <Badge 
                      bg={new Date(job.endDate).getDate() - new Date(job.startDate).getDate() > 0 ? "warning" : "info"}
                      className="py-2 px-3"
                    >
                      {new Date(job.endDate).getDate() - new Date(job.startDate).getDate() > 0
                        ? `${new Date(job.endDate).getDate() - new Date(job.startDate).getDate() + 1} Days`
                        : "Single Day"}
                    </Badge>
                    {job.estimatedDurationHours > 0 || job.estimatedDurationMinutes > 0 ? (
                      <Badge bg="secondary" className="ms-2 py-2 px-3">
                        Est. {job.estimatedDurationHours || 0}h {job.estimatedDurationMinutes || 0}m
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </Card.Body>
            )}
          </Card>
        </Col>
      </Row>

      <Modal show={showTagModal} onHide={() => setShowTagModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Select Tags</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {availableTags.map((tag, index) => (
            <Button
              key={index}
              variant={selectedTags.includes(tag) ? "primary" : "outline-primary"}
              className="me-2 mb-2"
              onClick={() => handleTagSelection(tag)}
            >
              {tag}
              {!['Important', 'Follow-up', 'Resolved', 'Pending', 'Question'].includes(tag) && (
                <X
                  className="ms-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveNewTag(tag);
                  }}
                />
              )}
            </Button>
          ))}
          <Form.Group className="mt-3">
            <Form.Control
              type="text"
              placeholder="Add new tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
            />
            <Button variant="secondary" className="mt-2" onClick={handleAddNewTag}>
              Add New Tag
            </Button>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTagModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => setShowTagModal(false)}>
            Apply Tags
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default JobDetails;
