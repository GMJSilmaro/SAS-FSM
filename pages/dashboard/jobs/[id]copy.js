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
} from "react-bootstrap-icons";
import {
  FaPencilAlt, // For edit button
  FaUsers, // For workers stat card
  FaTools, // For equipment stat card
  FaCheckCircle, // For tasks stat card
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
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed with status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "OK" && data.results?.[0]?.geometry?.location) {
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
      console.error("Geocoding response error:", data.status);
      return null;
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
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

const JobDetails = () => {
  const router = useRouter();
  const { id } = router.query; // Extract job ID from URL
  const [job, setJob] = useState(null);
  const [workers, setWorkers] = useState([]); // To store worker details
  const [location, setLocation] = useState(null); // Store location for Google Map
  const [activeTab, setActiveTab] = useState("overview"); // State for active tab
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
    // Add this to ensure the Google Maps script is loaded before using it
    libraries: ["places"],
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

  useEffect(() => {
    // Retrieve email from cookies
    const emailFromCookie = Cookies.get("email");
    setUserEmail(emailFromCookie || "Unknown");
  }, []);

  useEffect(() => {
    if (id && activeTab === "notes") {
      // Only fetch notes when on the notes tab
      console.log("Fetching notes for job:", id); // Debug log

      const notesRef = collection(db, "jobs", id, "technicianNotes");
      const q = query(notesRef, orderBy("createdAt", "desc"));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedNotes = snapshot.docs.map((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate?.() || new Date();
            return {
              id: doc.id,
              ...data,
              createdAt,
            };
          });
          console.log("Fetched notes:", fetchedNotes); // Debug log
          setTechnicianNotes(fetchedNotes);
        },
        (error) => {
          console.error("Error fetching notes:", error);
          toast.error("Error loading notes. Please try again.");
        }
      );

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
              const workerIds = assignedWorkers.map(
                (worker) => worker.workerId
              );
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
                setMapKey((prevKey) => prevKey + 1); // Force map re-render
              } else {
                console.error(
                  "No valid coordinates found for the given address"
                );
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

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedNotes = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt ? data.createdAt.toDate() : new Date(), // Convert to Date object or use current date as fallback
            };
          });
          setTechnicianNotes(fetchedNotes);
        },
        (error) => {
          console.error("Error fetching notes:", error);
          toast.error("Error loading notes. Please try again.");
        }
      );

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
      const notesRef = collection(db, "jobs", id, "technicianNotes");

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
      const noteRef = doc(db, "jobs", id, "technicianNotes", noteId);

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
      const noteRef = doc(db, "jobs", id, "technicianNotes", updatedNote.id);

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
          jobId={id}
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

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <>
            {/* Job Description */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">Job Description</h4>
            </div>
            <div className="d-flex justify-content-between align-items-center"></div>
            <div
              dangerouslySetInnerHTML={{
                __html: job.jobDescription.replace(/<\/?p>/g, ""),
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
    const cleanPhone = phone.replace(/\D/g, "");

    // Add country code if not present (assuming default country code is +60 for Malaysia)
    if (!cleanPhone.startsWith("60")) {
      return `60${cleanPhone}`;
    }

    return cleanPhone;
  };

  if (!job) {
    return <div>Loading job details...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Modern Gradient Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
          padding: "1.5rem 2rem",
          borderRadius: "0 0 24px 24px",
          marginTop: "-40px",
          marginBottom: "20px",
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="h3 text-white fw-bold mb-1">Job Details</h1>
            <p className="mb-0" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
              Job #{id} • Created on {formatDate(job.createdAt)}
            </p>
          </div>

          <div className="d-flex gap-3">
            <Button
              onClick={() => router.push(`/dashboard/jobs/edit-jobs/${id}`)}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "12px",
                color: "white",
                padding: "10px 20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <FaPencilAlt size={14} />
              <span>Edit Job</span>
            </Button>
          </div>
        </div>
      </div>

      <Container fluid>
        <Row className="g-4">
          {/* Left Column - Customer Info */}
          <Col lg={4}>
            {/* Customer Details Card */}
            <Card className={styles.modernCard}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className={styles.sectionTitle}>Customer Information</h5>
                  <span
                    className={`badge ${styles.statusBadge}`}
                    style={getStatusColor(job.jobStatus)}
                  >
                    {getJobStatusName(job.jobStatus)}
                  </span>
                </div>

                <div className={styles.customerProfile}>
                  <div className={styles.avatarSection}>
                    <div className={styles.avatar}>
                      <PersonFill size={32} />
                    </div>
                    <div>
                      <h6 className="mb-1">
                        {job.contact?.firstName} {job.contact?.lastName}
                      </h6>
                      <p className="text-muted mb-0">{job.customerName}</p>
                    </div>
                  </div>

                  <div className={styles.contactSection}>
                    {job.contact?.mobilePhone && (
                      <>
                        <a
                          href={`tel:${job.contact.mobilePhone}`}
                          className={styles.contactButton}
                        >
                          <TelephoneFill />
                          <span>{job.contact.mobilePhone}</span>
                        </a>
                        <a
                          href={`https://wa.me/${formatPhoneForWhatsApp(
                            job.contact.mobilePhone
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.contactButton}
                        >
                          <Whatsapp />
                          <span>Send Message</span>
                        </a>
                      </>
                    )}
                  </div>

                  {/* Map Section */}
                  <div className={styles.mapSection}>
                    <h6 className="mb-3">Location</h6>
                    <div className={styles.mapContainer}>{renderMap()}</div>
                    <p className="mt-3 mb-0 text-muted">
                      {job.location?.address?.streetAddress}
                      <br />
                      {job.location?.address?.city},{" "}
                      {job.location?.address?.stateProvince}
                      <br />
                      {job.location?.address?.postalCode}
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Scheduling Card */}
            <Card
              className={`${styles.modernCard} mt-4`}
              style={{ overflow: "hidden" }}
            >
              <Card.Body>
                {/* Header Section */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <h5 className={styles.sectionTitle}>Schedule Details</h5>
                      <Badge
                        bg={
                          job.priority === "High"
                            ? "danger"
                            : job.priority === "Mid"
                            ? "warning"
                            : "info"
                        }
                        className={styles.priorityBadge}
                      >
                        {job.priority} Priority
                      </Badge>
                    </div>
                    <div className={styles.metaInfo}>
                      <span className="text-muted">
                        <PersonFill size={12} className="me-1" />
                        Created by {job.createdBy?.fullName}
                      </span>
                      <span className="text-muted ms-3">
                        <Calendar4 size={12} className="me-1" />
                        {new Date(
                          job.createdAt?.seconds * 1000
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Schedule Grid */}
                <div className={styles.scheduleGrid}>
                  {/* Date & Time Card */}
                  <div className={styles.scheduleCard}>
                    <div
                      className={styles.scheduleIconWrapper}
                      style={{ backgroundColor: "#0d6efd" }}
                    >
                      <Calendar4 className={styles.scheduleIcon} />
                    </div>
                    <div className={styles.scheduleInfo}>
                      <span className={styles.scheduleLabel}>
                        Appointment Window
                      </span>
                      <h6 className={styles.scheduleValue}>
                        <span className={styles.primaryText}>
                          {new Date(job.startDate).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className={styles.subText}>
                          {job.startTime} - {job.endTime}
                        </span>
                      </h6>
                    </div>
                  </div>

                  {/* Duration Card */}
                  <div className={styles.scheduleCard}>
                    <div
                      className={styles.scheduleIconWrapper}
                      style={{ backgroundColor: "#198754" }}
                    >
                      <Clock className={styles.scheduleIcon} />
                    </div>
                    <div className={styles.scheduleInfo}>
                      <span className={styles.scheduleLabel}>
                        Estimated Duration
                      </span>
                      <h6 className={styles.scheduleValue}>
                        <span className={styles.primaryText}>
                          {job.estimatedDurationHours}h{" "}
                          {job.estimatedDurationMinutes}m
                        </span>
                        <span className={styles.subText}>
                          Total:{" "}
                          {job.estimatedDurationHours * 60 +
                            job.estimatedDurationMinutes}{" "}
                          minutes
                        </span>
                      </h6>
                    </div>
                  </div>

                  {/* Assigned Workers Card */}
                  <div className={styles.scheduleCard}>
                    <div
                      className={styles.scheduleIconWrapper}
                      style={{ backgroundColor: "#dc3545" }}
                    >
                      <FaUsers className={styles.scheduleIcon} />
                    </div>
                    <div className={styles.scheduleInfo}>
                      <span className={styles.scheduleLabel}>
                        Assigned Technicians
                      </span>
                      <div className={styles.workersStack}>
                        {job.assignedWorkers.map((worker, index) => (
                          <div key={index} className={styles.workerChip}>
                            <div className={styles.workerAvatar}>
                              {worker.firstName
                                ? worker.firstName.charAt(0)
                                : worker.workerName
                                ? worker.workerName.charAt(0)
                                : "#"}
                            </div>
                            <span className={styles.workerName}>
                              {worker.firstName && worker.lastName
                                ? `${worker.firstName} ${worker.lastName}`
                                : worker.workerName || "Unknown Worker"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Timeline */}
                <div className={styles.timelineSection}>
                  <div className={styles.timelineHeader}>
                    <span className={styles.timelineLabel}>
                      Schedule Progress
                    </span>
                    <span className={styles.timelineStatus}>
                      {job.jobStatus === "Created"
                        ? "25%"
                        : job.jobStatus === "Confirmed"
                        ? "50%"
                        : job.jobStatus === "In Progress"
                        ? "75%"
                        : "100%"}
                    </span>
                  </div>
                  <div className={styles.timeline}>
                    <div
                      className={styles.timelineProgress}
                      style={{
                        width:
                          job.jobStatus === "Created"
                            ? "25%"
                            : job.jobStatus === "Confirmed"
                            ? "50%"
                            : job.jobStatus === "In Progress"
                            ? "75%"
                            : "100%",
                        backgroundColor:
                          job.priority === "High" ? "#dc3545" : "#0d6efd",
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={styles.scheduleActions}>
                  <Button
                    variant="primary"
                    className={styles.actionButton}
                    onClick={() =>
                      router.push(`/dashboard/jobs/reschedule/${job.jobID}`)
                    }
                  >
                    <Calendar4 className="me-2" />
                    Reschedule
                  </Button>
                  <Button
                    variant="outline-secondary"
                    className={styles.actionButton}
                    onClick={() =>
                      router.push(`/dashboard/customers/${job.customerID}`)
                    }
                  >
                    <Clock className="me-2" />
                    View Customer History
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Right Column - Job Details */}
          <Col lg={8}>
            <Card className={styles.modernCard}>
              <Card.Body>
                <div className={styles.tabContainer}>
                  <div className={styles.modernTabs}>
                    {["Overview", "Equipment", "Tasks", "Notes", "Images"].map(
                      (tab) => (
                        <button
                          key={tab}
                          className={`${styles.tabButton} ${
                            activeTab === tab.toLowerCase()
                              ? styles.activeTab
                              : ""
                          }`}
                          onClick={() => setActiveTab(tab.toLowerCase())}
                        >
                          {tab}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className={styles.tabContent}>{renderTabContent()}</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default JobDetails;
