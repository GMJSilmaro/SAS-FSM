import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Row,
  Col,
  Card,
  Badge,
  Button,
  Image,
  Tab,
  Nav,
  Table,
  OverlayTrigger,
  Tooltip,
  Spinner,
  Modal,
  Form
} from 'react-bootstrap';
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebase';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Award,
  Briefcase,
  Shield,
  Activity,
  Star,
  FileText,
  Edit3,
  ArrowLeft,
  Plus,
  Eye,
  Search,
  Filter,
  Trash,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  Calendar2, 
  CheckCircle, 
  XCircle, 
  Upload
} from 'react-bootstrap-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { FaUser, FaPlus, FaArrowLeft } from "react-icons/fa";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { DebouncedInput } from '../../../../components/DebouncedInput';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../../../firebase';

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'job complete':
      return 'success';
    case 'in progress':
      return 'warning';
    case 'scheduled':
      return 'info';
    case 'cancelled':
      return 'danger';
    default:
      return 'secondary';
  }
};

const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'danger';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
    default:
      return 'secondary';
  }
};

const getFollowUpStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'closed':
      return 'success';
    case 'in progress':
      return 'warning';
    case 'logged':
      return 'info';
    default:
      return 'secondary';
  }
};

const getJobTypeIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'recurring':
      return <i className="fe fe-repeat text-primary"></i>;
    case 'one-time':
      return <i className="fe fe-clock text-warning"></i>;
    default:
      return <i className="fe fe-calendar text-secondary"></i>;
  }
};

const getJobContactTypeColor = (type) => {
  switch (type?.code) {
    case 1:
      return 'danger'; // Repair
    case 2:
      return 'warning'; // Maintenance
    case 3:
      return 'info'; // Installation
    default:
      return 'secondary';
  }
};

const WorkerDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [assignments, setAssignments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);
  const [newCertificate, setNewCertificate] = useState({
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    certificateId: ''
  });
  const [addingCertificate, setAddingCertificate] = useState(false);
  const [showAddCertForm, setShowAddCertForm] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [schedules, setSchedules] = useState({
    monday: { firstShift: { start: '8:00 AM', end: '6:00 PM' }, secondShift: { start: '', end: '' } },
    tuesday: { firstShift: { start: '8:00 AM', end: '6:00 PM' }, secondShift: { start: '', end: '' } },
    wednesday: { firstShift: { start: '8:00 AM', end: '6:00 PM' }, secondShift: { start: '', end: '' } },
    thursday: { firstShift: { start: '8:00 AM', end: '6:00 PM' }, secondShift: { start: '', end: '' } },
    friday: { firstShift: { start: '8:00 AM', end: '6:00 PM' }, secondShift: { start: '', end: '' } },
    saturday: { firstShift: { start: '8:00 AM', end: '6:00 PM' }, secondShift: { start: '', end: '' } },
    sunday: { firstShift: { start: '8:00 AM', end: '6:00 PM' }, secondShift: { start: '', end: '' } },
  });
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchWorkerDetails = async () => {
      if (!id) return;
      
      try {
        const workerDoc = await getDoc(doc(db, 'users', id));
        if (workerDoc.exists()) {
          setWorker({ id: workerDoc.id, ...workerDoc.data() });
        }
      } catch (error) {
        console.error('Error fetching worker details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkerDetails();
  }, [id]);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!worker?.workerId) return;
      setLoadingAssignments(true);
      try {
        const jobsRef = collection(db, 'jobs');
        const q = query(jobsRef, where('assignedWorkers', 'array-contains', {
          workerId: worker.workerId,
          workerName: worker.fullName
        }));
        const querySnapshot = await getDocs(q);
        const assignmentsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Fetched assignments:', assignmentsList);
        setAssignments(assignmentsList);
      } catch (error) {
        console.error('Error fetching assignments:', error);
      } finally {
        setLoadingAssignments(false);
      }
    };

    if (worker) {
      fetchAssignments();
    }
  }, [worker]);

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;
    
    setAddingSkill(true);
    try {
      const workerRef = doc(db, 'users', worker.workerId);
      
      // Check if skill already exists
      if (worker.skills?.includes(newSkill.trim())) {
        toast.error('This skill already exists');
        return;
      }

      await updateDoc(workerRef, {
        skills: arrayUnion(newSkill.trim()),
        lastUpdated: Timestamp.now()
      });

      // Update local state
      setWorker(prev => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill.trim()]
      }));

      setNewSkill('');
      toast.success('Skill added successfully');
    } catch (error) {
      console.error('Error adding skill:', error);
      toast.error('Failed to add skill');
    } finally {
      setAddingSkill(false);
    }
  };

  const handleAddCertificate = async () => {
    if (!newCertificate.name || !newCertificate.issuer) return;

    setAddingCertificate(true);
    try {
      const certificate = {
        ...newCertificate,
        id: `cert-${Date.now()}`,
        dateAdded: Timestamp.now()
      };

      const workerRef = doc(db, 'users', worker.workerId);
      await updateDoc(workerRef, {
        certificates: arrayUnion(certificate),
        lastUpdated: Timestamp.now()
      });

      // Update local state
      setWorker(prev => ({
        ...prev,
        certificates: [...(prev.certificates || []), certificate]
      }));

      setNewCertificate({
        name: '',
        issuer: '',
        issueDate: '',
        expiryDate: '',
        certificateId: ''
      });
      setShowAddCertModal(false);
      toast.success('Certificate added successfully');
    } catch (error) {
      console.error('Error adding certificate:', error);
      toast.error('Failed to add certificate');
    } finally {
      setAddingCertificate(false);
    }
  };

  const AddSkillModal = () => (
    <Modal show={showAddSkillModal} onHide={() => setShowAddSkillModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Add New Skill</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group>
          <Form.Label>Skill Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter skill name"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowAddSkillModal(false)}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleAddSkill}
          disabled={addingSkill || !newSkill.trim()}
        >
          {addingSkill ? 'Adding...' : 'Add Skill'}
        </Button>
      </Modal.Footer>
    </Modal>
  );

  const AddCertificateModal = () => (
    <Modal show={showAddCertModal} onHide={() => setShowAddCertModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Add New Certificate</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Certificate Name*</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter certificate name"
            value={newCertificate.name}
            onChange={(e) => setNewCertificate(prev => ({ ...prev, name: e.target.value }))}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Issuing Organization*</Form.Label>
          <Form.Control
            type="text"
            value={newCertificate.issuer}
            onChange={(e) => setNewCertificate(prev => ({ ...prev, issuer: e.target.value }))}
            placeholder="Enter issuer name"
          />
        </Form.Group>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Issue Date</Form.Label>
              <Form.Control
                type="date"
                value={newCertificate.issueDate}
                onChange={(e) => setNewCertificate(prev => ({ ...prev, issueDate: e.target.value }))}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Expiry Date</Form.Label>
              <Form.Control
                type="date"
                value={newCertificate.expiryDate}
                onChange={(e) => setNewCertificate(prev => ({ ...prev, expiryDate: e.target.value }))}
              />
            </Form.Group>
          </Col>
        </Row>
        <Form.Group>
          <Form.Label>Certificate ID (Optional)</Form.Label>
          <Form.Control
            size="sm"
            type="text"
            value={newCertificate.certificateId}
            onChange={(e) => setNewCertificate(prev => ({ ...prev, certificateId: e.target.value }))}
            placeholder="Enter certificate ID"
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowAddCertModal(false)}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleAddCertificate}
          disabled={addingCertificate || !newCertificate.name || !newCertificate.issuer}
        >
          {addingCertificate ? (
            <>
              <Spinner size="sm" className="me-1" />
              Adding...
            </>
          ) : (
            'Add Certificate'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );

  const handleRefresh = useCallback(async () => {
    setLoadingAssignments(true);
    try {
      const jobsRef = collection(db, 'jobs');
      const q = query(jobsRef, where('assignedWorkers', 'array-contains', worker?.workerId));
      const querySnapshot = await getDocs(q);
      const assignmentsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAssignments(assignmentsList);
      toast.success('Assignments refreshed successfully');
    } catch (error) {
      console.error('Error refreshing assignments:', error);
      toast.error('Failed to refresh assignments');
    } finally {
      setLoadingAssignments(false);
    }
  }, [worker?.workerId]);

  // Memoize the columns definition
  const columns = React.useMemo(
    () => [
      {
        header: 'Job No',
        accessorKey: 'jobNo',
        cell: ({ row }) => (
          <div className="d-flex align-items-center">
            <span className="text-primary fw-medium">#{row.original.jobNo}</span>
            {getJobTypeIcon(row.original.jobType)}
          </div>
        ),
      },
      {
        header: 'Job Name',
        accessorKey: 'jobName',
      },
      {
        header: 'Customer',
        accessorKey: 'customerName',
      },
      {
        header: 'Status',
        accessorKey: 'jobStatus',
        cell: ({ row }) => (
          <Badge bg={getStatusColor(row.original.jobStatus)}>
            {row.original.jobStatus}
          </Badge>
        ),
      },
      {
        header: 'Priority',
        accessorKey: 'priority',
        cell: ({ row }) => (
          row.original.priority && (
            <Badge bg={getPriorityColor(row.original.priority)}>
              {row.original.priority}
            </Badge>
          )
        ),
      },
      {
        header: 'Schedule',
        accessorKey: 'startDate',
        cell: ({ row }) => (
          <div className="d-flex flex-column">
            <span>{format(new Date(row.original.startDate), 'MMM d, yyyy')}</span>
            <small className="text-muted">
              {row.original.startTime} - {row.original.endTime}
            </small>
          </div>
        ),
      },
      {
        header: 'Type',
        accessorKey: 'jobContactType',
        cell: ({ row }) => (
          row.original.jobContactType && (
            <Badge bg={getJobContactTypeColor(row.original.jobContactType)}>
              {row.original.jobContactType.name}
            </Badge>
          )
        ),
      },
      {
        header: 'Actions',
        id: 'actions',
        cell: ({ row }) => (
          <Button
            variant="light"
            size="sm"
            onClick={() => router.push(`/jobs/view/${row.original.jobNo}`)}
            className="d-flex align-items-center gap-2"
          >
            <Eye size={14} />
            View
          </Button>
        ),
      },
    ],
    []
  );

  // Memoize the filtered data
  const filteredData = React.useMemo(() => {
    return assignments.filter(job => {
      const matchesStatus = !statusFilter || job.jobStatus === statusFilter;
      const matchesPriority = !priorityFilter || job.priority === priorityFilter;
      const matchesType = !typeFilter || job.jobContactType?.name === typeFilter;
      
      const matchesGlobal = !globalFilter || Object.values(job).some(value => 
        String(value).toLowerCase().includes(globalFilter.toLowerCase())
      );

      return matchesStatus && matchesPriority && matchesType && matchesGlobal;
    });
  }, [assignments, statusFilter, priorityFilter, typeFilter, globalFilter]);

  // Initialize table with memoized data
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Render the assignments tab content
  const renderAssignmentsContent = () => {
    if (loadingAssignments) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" className="mb-2" />
          <div className="text-muted">Loading assignments...</div>
        </div>
      );
    }

    if (assignments.length === 0) {
      return (
        <div className="text-center py-5">
          <div className="mb-3">
            <Briefcase size={48} className="text-muted" />
          </div>
          <h6>No Assignments Found</h6>
          <p className="text-muted small">This worker has no job assignments yet</p>
        </div>
      );
    }

    if (filteredData.length === 0) {
      return (
        <div className="text-center py-5">
          <div className="mb-3">
            <Filter size={48} className="text-muted" />
          </div>
          <h6>No Matching Results</h6>
          <p className="text-muted small">Try adjusting your search or filters</p>
        </div>
      );
    }

    return (
      <>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th 
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="text-nowrap"
                      style={{ cursor: 'pointer' }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-3 px-2">
          <small className="text-muted">
            Showing {filteredData.length} of {assignments.length} assignments
          </small>
        </div>
      </>
    );
  };

  // Add these before the return statement
  const uniqueStatuses = useMemo(() => {
    if (!assignments) return [];
    const statuses = new Set(assignments.map(job => job.jobStatus).filter(Boolean));
    return Array.from(statuses);
  }, [assignments]);

  const uniquePriorities = useMemo(() => {
    if (!assignments) return [];
    const priorities = new Set(assignments.map(job => job.priority).filter(Boolean));
    return Array.from(priorities);
  }, [assignments]);

  const uniqueTypes = useMemo(() => {
    if (!assignments) return [];
    const types = new Set(assignments.map(job => job.jobContactType?.name).filter(Boolean));
    return Array.from(types);
  }, [assignments]);

  const handleScheduleChange = (day, shift, type, value) => {
    setSchedules(prev => ({
      ...prev,
      [day.toLowerCase()]: {
        ...prev[day.toLowerCase()],
        [shift]: {
          ...prev[day.toLowerCase()][shift],
          [type]: value
        }
      }
    }));
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      const workerRef = doc(db, 'users', worker.workerId);
      await updateDoc(workerRef, {
        schedules: schedules,
        lastUpdated: Timestamp.now()
      });
      
      toast.success('Schedule saved successfully');
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule');
    } finally {
      setSavingSchedule(false);
    }
  };

  useEffect(() => {
    if (worker?.schedules) {
      setSchedules(worker.schedules);
    }
  }, [worker]);

  const startTimeOptions = [
    '12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM',
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'
  ];

  const endTimeOptions = [
    '12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM',
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'
  ];

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || !files.length) return;

    setUploadingDocument(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Create a reference to the storage location
        const storageRef = ref(storage, `documents/${worker.workerId}/${file.name}`);
        
        // Upload the file
        await uploadBytes(storageRef, file);
        
        // Get the download URL
        const downloadURL = await getDownloadURL(storageRef);
        
        // Create document object
        const document = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          url: downloadURL,
          type: file.type,
          size: file.size,
          uploadedAt: Timestamp.now(),
          path: `documents/${worker.workerId}/${file.name}`
        };

        // Update Firestore
        const workerRef = doc(db, 'users', worker.workerId);
        await updateDoc(workerRef, {
          documents: arrayUnion(document)
        });

        return document;
      });

      const uploadedDocs = await Promise.all(uploadPromises);
      
      // Update local state
      setDocuments(prev => [...prev, ...uploadedDocs]);
      
      toast.success('Documents uploaded successfully');
      event.target.value = ''; // Reset file input
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error('Failed to upload documents');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDownload = async (document) => {
    try {
      window.open(document.url, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const handleDeleteDocument = async (documentId) => {
    const document = documents.find(doc => doc.id === documentId);
    if (!document) return;

    try {
      // Delete from Storage
      const storageRef = ref(storage, document.path);
      await deleteObject(storageRef);

      // Delete from Firestore
      const workerRef = doc(db, 'users', worker.workerId);
      const updatedDocs = documents.filter(doc => doc.id !== documentId);
      await updateDoc(workerRef, {
        documents: updatedDocs
      });

      // Update local state
      setDocuments(updatedDocs);
      
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  useEffect(() => {
    if (worker?.documents) {
      setDocuments(worker.documents);
    }
  }, [worker]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="text-center py-5">
        <h3>Worker not found</h3>
        <Link href="/workers">
          <Button variant="primary" className="mt-3">
            Back to Workers List
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4">
      {/* Header Section */}
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
                    View Details for
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

                    View comprehensive worker details including personal info, certifications, assignments and performance history
                  </p>
                  
                </div>

                <div className="d-flex align-items-center gap-2 mb-4">
                  <span
                    className="badge"
                    style={{
                      background: "#FFFFFF",
                      color: "#4171F5",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}
                  >
                    Worker Management
                  </span>
                  <span
                    className="badge"
                    style={{
                      background: "rgba(255, 255, 255, 0.2)",
                      color: "#FFFFFF",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}
                  >
                    <i className="fe fe-users me-1"></i>
                    Workforce
                  </span>
                </div>

                <nav style={{ fontSize: "14px", fontWeight: "500" }}>
                  <div className="d-flex align-items-center">
                    <i
                      className="fe fe-home"
                      style={{ color: "rgba(255, 255, 255, 0.7)" }}
                    ></i>
                    <Link
                      href="/"
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
                    <i
                      className="fe fe-users"
                      style={{ color: "#FFFFFF" }}
                    ></i>
                       <Link
                      href="/workers"
                      className="text-decoration-none ms-2"
                      style={{ color: "rgba(255, 255, 255, 0.7)" }}
                    >
                      Workers List
                    </Link>
                    <span
                      className="mx-2"
                      style={{ color: "rgba(255, 255, 255, 0.7)" }}
                    >
                      /
                    </span>
                    <i
                      className="fe fe-users"
                      style={{ color: "#FFFFFF" }}
                    ></i>
                    <span className="ms-2" style={{ color: "#FFFFFF" }}>
                      View {worker.workerId}
                    </span>
                  </div>
                </nav>
              </div>

              <div>
                <OverlayTrigger
                  placement="left"
                  overlay={<Tooltip>Back to Workers List</Tooltip>}
                >
                  <Link href="/workers" passHref>
                    <Button
                      variant="light"
                      className="create-worker-button"
                      style={{
                        border: "none",
                        borderRadius: "12px",
                        padding: "10px 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.2s ease",
                        fontWeight: "500",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <FaArrowLeft size={16} />
                      <span>Back to Workers List</span>
                    </Button>
                  </Link>
                </OverlayTrigger>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Profile Overview Card */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center gap-4">
            <div className="position-relative">
              <Image
                src={worker.profilePicture || '/images/avatar/default-avatar.png'}
                alt={worker.fullName}
                width={120}
                height={120}
                className="rounded-circle"
                style={{ 
                  objectFit: 'cover', 
                  border: '4px solid #fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
              <span 
                className={`position-absolute bottom-0 end-0 ${worker.isOnline ? 'bg-success' : 'bg-secondary'}`}
                style={{ 
                  width: '20px', 
                  height: '20px', 
                  borderRadius: '50%', 
                  border: '3px solid #fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              />
            </div>

            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h3 className="mb-1" style={{ fontSize: '1.75rem', fontWeight: '600' }}>
                    {worker.fullName}
                  </h3>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="text-muted" style={{ fontSize: '1rem' }}>
                      {worker.workerId}
                    </span>
                    <div className="d-flex gap-2">
                      {worker.isAdmin && (
                        <Badge 
                          bg="danger" 
                          className="px-3 py-2"
                          style={{ fontSize: '0.75rem', fontWeight: '500' }}
                        >
                          Admin
                        </Badge>
                      )}
                      {worker.isFieldWorker && (
                        <Badge 
                          bg="warning" 
                          text="dark" 
                          className="px-3 py-2"
                          style={{ fontSize: '0.75rem', fontWeight: '500' }}
                        >
                          Field Worker
                        </Badge>
                      )}
                      <Badge 
                        bg={worker.isActive ? 'success' : 'danger'} 
                        className="px-3 py-2"
                        style={{ fontSize: '0.75rem', fontWeight: '500' }}
                      >
                        {worker.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div className="d-flex gap-4 mt-3">
                    <div className="d-flex align-items-center text-muted">
                      <Mail size={18} className="me-2" />
                      {worker.email}
                    </div>
                    <div className="d-flex align-items-center text-muted">
                      <Phone size={18} className="me-2" />
                      {worker.primaryPhone}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline-primary"
                  className="d-flex align-items-center gap-2"
                  onClick={() => router.push(`/workers/edit-worker/${worker.workerId}`)}
                  style={{
                    padding: '0.625rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Edit3 size={16} />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Tabs Navigation */}
      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Nav variant="tabs" className="mb-4 gap-2" style={{ borderBottom: '1px solid #e2e8f0' }}>
          <Nav.Item>
            <Nav.Link 
              eventKey="overview" 
              className="px-4 py-3 d-flex align-items-center gap-2"
              style={{ border: 'none', fontWeight: '500' }}
            >
              <User size={18} />
              Overview
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              eventKey="skills" 
              className="px-4 py-3 d-flex align-items-center gap-2"
              style={{ border: 'none', fontWeight: '500' }}
            >
              <Award size={18} />
              Skills & Expertise
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              eventKey="assignments" 
              className="px-4 py-3 d-flex align-items-center gap-2"
              style={{ border: 'none', fontWeight: '500' }}
            >
              <Briefcase size={18} />
              Job Assignments
            </Nav.Link>
          </Nav.Item>
          {/* <Nav.Item>
            <Nav.Link 
              eventKey="schedules" 
              className="px-4 py-3 d-flex align-items-center gap-2"
              style={{ border: 'none', fontWeight: '500' }}
            >
              <Calendar size={18} />
              Schedules
            </Nav.Link>
          </Nav.Item> */}
          <Nav.Item>
            <Nav.Link 
              eventKey="documents" 
              className="px-4 py-3 d-flex align-items-center gap-2"
              style={{ border: 'none', fontWeight: '500' }}
            >
              <FileText size={18} />
              Documents
            </Nav.Link>
          </Nav.Item>
        </Nav>

       

        <Tab.Content>
          <Tab.Pane eventKey="overview">
            <Row>
              <Col lg={8}>
                {/* Personal Information Card */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-transparent border-0 pt-4 pb-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="mb-0">Personal Information</h5>
                        <small className="text-muted">Basic worker details and contact information</small>
                      </div>
                      <Badge 
                        className="profile-badge"
                        style={{
                          background: 'linear-gradient(45deg, #3b82f6, #60a5fa)',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                        }}
                      >
                        <i className="fe fe-user"></i>
                        Profile Details
                      </Badge>
                    </div>
                  </Card.Header>
                  <Card.Body className="pt-4">
                    <div className="info-grid">
                      <div className="info-section">
                        <div className="info-items">
                          <div className="info-card">
                            <div className="info-icon">
                              <i className="fe fe-user"></i>
                            </div>
                            <div className="info-content">
                              <div className="info-label">Full Name</div>
                              <div className="info-value">{worker.fullName}</div>
                            </div>
                          </div>
                          <div className="info-card">
                            <div className="info-icon">
                              <i className="fe fe-hash"></i>
                            </div>
                            <div className="info-content">
                              <div className="info-label">Worker ID</div>
                              <div className="info-value">{worker.workerId}</div>
                            </div>
                          </div>
                          <div className="info-card">
                            <div className="info-icon">
                              <i className="fe fe-calendar"></i>
                            </div>
                            <div className="info-content">
                              <div className="info-label">Date of Birth</div>
                              <div className="info-value">{format(new Date(worker.dateOfBirth), 'MMMM d, yyyy')}</div>
                            </div>
                          </div>
                          <div className="info-card">
                            <div className="info-icon">
                              <i className="fe fe-user"></i>
                            </div>
                            <div className="info-content">
                              <div className="info-label">Gender</div>
                              <div className="info-value" style={{ textTransform: 'capitalize' }}>{worker.gender}</div>
                            </div>
                          </div>
                          <div className="info-card">
                            <div className="info-icon">
                              <i className="fe fe-mail"></i>
                            </div>
                            <div className="info-content">
                              <div className="info-label">Email Address</div>
                              <div className="info-value">{worker.email}</div>
                            </div>
                          </div>
                          <div className="info-card">
                            <div className="info-icon">
                              <i className="fe fe-phone"></i>
                            </div>
                            <div className="info-content">
                              <div className="info-label">Primary Phone</div>
                              <div className="info-value">{worker.primaryPhone}</div>
                            </div>
                          </div>
                          <div className="info-card full-width">
                            <div className="info-icon">
                              <i className="fe fe-map-pin"></i>
                            </div>
                            <div className="info-content">
                              <div className="info-label">Complete Address</div>
                              <div className="info-value">
                                <div className="address-line">{worker.streetAddress}</div>
                                <div className="address-secondary">
                                  {[worker.stateProvince, worker.zipCode].filter(Boolean).join(', ')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>

                {/* Emergency Contact Card */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-transparent border-0 pt-4 pb-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="mb-0">Emergency Contact</h5>
                        <small className="text-muted">Emergency contact information</small>
                      </div>
                      <Badge 
                        className="emergency-badge"
                        style={{
                          background: 'linear-gradient(45deg, #ef4444, #f87171)',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                        }}
                      >
                        <i className="fe fe-alert-circle"></i>
                        Emergency Contact
                      </Badge>
                    </div>
                  </Card.Header>
                  <Card.Body className="pt-4">
                    <div className="emergency-container">
                      <div className="emergency-items">
                        <div className="emergency-card">
                          <div className="emergency-icon">
                            <i className="fe fe-user"></i>
                          </div>
                          <div className="emergency-content">
                            <div className="emergency-label">Contact Name</div>
                            <div className="emergency-value">{worker.emergencyContactName}</div>
                          </div>
                        </div>
                        <div className="emergency-card">
                          <div className="emergency-icon">
                            <i className="fe fe-users"></i>
                          </div>
                          <div className="emergency-content">
                            <div className="emergency-label">Relationship</div>
                            <div className="emergency-value">{worker.emergencyRelationship}</div>
                          </div>
                        </div>
                        <div className="emergency-card">
                          <div className="emergency-icon">
                            <i className="fe fe-phone"></i>
                          </div>
                          <div className="emergency-content">
                            <div className="emergency-label">Emergency Phone</div>
                            <div className="emergency-value">{worker.emergencyContactPhone}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={4}>
                {/* Account Status Card */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-transparent border-0 pt-4 pb-0">
                    <h5 className="mb-0">Account Status</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="status-item mb-4">
                      <div className="d-flex align-items-center mb-2">
                        <Activity size={16} className="text-primary me-2" />
                        <div className="text-muted">Account Status</div>
                      </div>
                      <Badge 
                        bg={worker.isActive ? 'success' : 'danger'}
                        className="status-badge"
                      >
                        {worker.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="status-item mb-4">
                      <div className="d-flex align-items-center mb-2">
                        <Shield size={16} className="text-primary me-2" />
                        <div className="text-muted">Role & Access</div>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        <Badge bg="primary" className="role-badge">
                          {worker.role}
                        </Badge>
                        {worker.isAdmin && (
                          <Badge bg="danger" className="role-badge">
                            Admin
                          </Badge>
                        )}
                        {worker.isFieldWorker && (
                          <Badge bg="warning" text="dark" className="role-badge">
                            Field Worker
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="status-item">
                      <div className="d-flex align-items-center mb-2">
                        <Clock size={16} className="text-primary me-2" />
                        <div className="text-muted">Last Active</div>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className={`status-indicator ${worker.isOnline ? 'online' : 'offline'}`}></div>
                        <div>
                          {worker.lastLogin ? format(worker.lastLogin.toDate(), 'PPpp') : 'Never'}
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>

            {/* Skills Summary Card */}
            <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-transparent border-0 pt-4 pb-0">
                    <h5 className="mb-0">Skills Overview</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="skills-grid">
                      {worker.skills?.map((skill, index) => (
                        <Badge 
                          key={index}
                          className="skill-badge"
                          bg="light"
                          text="dark"
                        >
                          <i className="fe fe-check-circle text-primary me-1"></i>
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

          </Tab.Pane>

          <Tab.Pane eventKey="skills">
            <Row>
              <Col lg={8}>
                {/* Skills Card */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-transparent border-0 pt-4 pb-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="mb-0">Skills & Expertise</h5>
                        <small className="text-muted">Manage worker's professional skills and competencies</small>
                      </div>
                      <Badge 
                        className="profile-badge"
                        style={{
                          background: 'linear-gradient(45deg, #3b82f6, #60a5fa)',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                        }}
                      >
                        <i className="fe fe-award"></i>
                        Skills Management
                      </Badge>
                    </div>
                  </Card.Header>
                  <Card.Body className="pt-4">
                    {/* Add Skill Input */}
                    <div className="mb-4 p-3" style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <Form.Group>
                        <Form.Label style={{ fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Add New Skill</Form.Label>
                        <div className="d-flex gap-2">
                          <Form.Control
                            type="text"
                            placeholder="Type skill name here..."
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && newSkill.trim()) {
                                handleAddSkill();
                              }
                            }}
                            style={{
                              fontSize: '14px',
                              padding: '10px 16px',
                              borderRadius: '8px',
                              maxWidth: '300px',
                              border: '1px solid #e2e8f0'
                            }}
                          />
                          <Button 
                            variant="primary"
                            onClick={handleAddSkill}
                            disabled={!newSkill.trim() || addingSkill}
                            style={{ 
                              padding: '10px 20px', 
                              borderRadius: '8px',
                              background: 'linear-gradient(45deg, #3b82f6, #60a5fa)',
                              border: 'none',
                              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                            }}
                          >
                            {addingSkill ? (
                              <>
                                <Spinner size="sm" className="me-2" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <Plus size={16} className="me-2" />
                                Add Skill
                              </>
                            )}
                          </Button>
                        </div>
                        <small className="text-muted mt-2 d-block">
                          Press Enter or click Add button to add the skill
                        </small>
                      </Form.Group>
                    </div>

                    {/* Skills List */}
                    <div className="skills-grid">
                      {worker.skills?.map((skill, index) => (
                        <div 
                          key={index}
                          className="skill-badge-item"
                        >
                          <div className="skill-badge-content">
                            <div className="skill-icon">
                              <i className="fe fe-check-circle"></i>
                            </div>
                            <span className="skill-name">{skill}</span>
                          </div>
                          <Button
                            variant="link"
                            className="remove-skill-btn"
                            onClick={async () => {
                              try {
                                const workerRef = doc(db, 'users', worker.workerId);
                                const updatedSkills = worker.skills.filter(s => s !== skill);
                                await updateDoc(workerRef, {
                                  skills: updatedSkills,
                                  lastUpdated: Timestamp.now()
                                });
                                
                                setWorker(prev => ({
                                  ...prev,
                                  skills: updatedSkills
                                }));
                                
                                toast.success('Skill removed successfully');
                              } catch (error) {
                                console.error('Error removing skill:', error);
                                toast.error('Failed to remove skill');
                              }
                            }}
                          >
                            <i className="fe fe-x"></i>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>


              </Col>

              <Col lg={4}>
                {/* Skills Summary Card 2 */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Header className="bg-transparent border-0 pt-4 pb-0">
                    <h5 className="mb-0">Skills Overview</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="text-center mb-4">
                      <div style={{ fontSize: '2.5rem', fontWeight: '600', color: '#3b82f6' }}>
                        {worker.skills?.length || 0}
                      </div>
                      <div className="text-muted" style={{ fontSize: '16px' }}>Total Skills</div>
                    </div>
                    <div className="skills-info p-3" style={{ background: '#f8fafc', borderRadius: '12px' }}>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <i className="fe fe-info text-primary"></i>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>Quick Guide</span>
                      </div>
                      <ul className="list-unstyled mb-0" style={{ fontSize: '14px' }}>
                        <li className="mb-2">• Click "Add New Skill" to add skills</li>
                        <li className="mb-2">• Click the (×) button to remove skills</li>
                        <li>• Skills are shown on worker's profile</li>
                      </ul>
                    </div>
                  </Card.Body>
                </Card>

            
              </Col>
            </Row>
          </Tab.Pane>

          <Tab.Pane eventKey="assignments">
            <Row>
              <Col lg={12}>
                <Card className="border-0 shadow-sm mb-4">
              
                  <Card.Header className="bg-transparent border-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-0">Job Assignments</h5>
                      <p className="text-muted small mb-0">View all assigned jobs and schedules</p>
                    </div>
                   
                      <Badge 
                        className="profile-badge"
                        style={{
                          background: 'linear-gradient(45deg, #3b82f6, #60a5fa)',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                        }}
                      >
                        <i className="fe fe-award"></i>
                        Job Assignments
                      </Badge>
                  </Card.Header>

                  <Card.Body>
                    {/* Filter Panel */}
                    <div className="filter-panel bg-light p-3 rounded-3 mb-3">
                      <div className="d-flex align-items-center gap-3">
                        {/* Search - wider */}
                        <div style={{ flex: '1' }}>
                          <div className="position-relative">
                            <Search 
                              size={16} 
                              className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
                            />
                            <DebouncedInput
                              value={globalFilter ?? ''}
                              onChange={value => setGlobalFilter(String(value))}
                              className="form-control form-control-sm ps-5"
                              placeholder="Search jobs..."
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>

                        {/* Status Filter - smaller */}
                        <div style={{ width: '140px' }}>
                          <Form.Select 
                            size="sm"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                          >
                            <option value="">All Status</option>
                            {uniqueStatuses.map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </Form.Select>
                        </div>

                        {/* Priority Filter - smaller */}
                        <div style={{ width: '140px' }}>
                          <Form.Select
                            size="sm"
                            value={priorityFilter}
                            onChange={e => setPriorityFilter(e.target.value)}
                          >
                            <option value="">All Priority</option>
                            {uniquePriorities.map(priority => (
                              <option key={priority} value={priority}>{priority}</option>
                            ))}
                          </Form.Select>
                        </div>

                        {/* Type Filter - smaller */}
                        <div style={{ width: '140px' }}>
                          <Form.Select
                            size="sm"
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value)}
                          >
                            <option value="">All Types</option>
                            {uniqueTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </Form.Select>
                        </div>
                      </div>
                    </div>

                    {renderAssignmentsContent()}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab.Pane>

          <Tab.Pane eventKey="schedules">
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-transparent border-0 pt-4 pb-0">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">Weekly Schedule</h5>
                    <small className="text-muted">Manage worker's weekly schedule and shifts</small>
                  </div>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={handleSaveSchedule}
                    disabled={savingSchedule}
                    className="d-flex align-items-center gap-2"
                  >
                    {savingSchedule ? (
                      <>
                        <Spinner size="sm" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fe fe-save"></i>
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="schedule-grid">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => (
                    <div key={day} className="schedule-day">
                      <div className="day-header">
                        <h6>{day}</h6>
                        <small className="text-muted">Nov {12 + index}</small>
                      </div>
                      <div className="shifts">
                        <div className="shift-group">
                          <label>First Shift</label>
                          <div className="d-flex gap-2">
                            <Form.Select 
                              size="sm" 
                              value={schedules[day.toLowerCase()].firstShift.start}
                              onChange={(e) => handleScheduleChange(day, 'firstShift', 'start', e.target.value)}
                            >
                              <option value="">Select time</option>
                              {startTimeOptions.map(time => (
                                <option key={time} value={time}>{time}</option>
                              ))}
                            </Form.Select>
                            <Form.Select 
                              size="sm"
                              value={schedules[day.toLowerCase()].firstShift.end}
                              onChange={(e) => handleScheduleChange(day, 'firstShift', 'end', e.target.value)}
                            >
                              <option value="">Select time</option>
                              {endTimeOptions.map(time => (
                                <option key={time} value={time}>{time}</option>
                              ))}
                            </Form.Select>
                          </div>
                        </div>
                        <div className="shift-group">
                          <label>Second Shift</label>
                          <div className="d-flex gap-2">
                            <Form.Select 
                              size="sm"
                              value={schedules[day.toLowerCase()].secondShift.start}
                              onChange={(e) => handleScheduleChange(day, 'secondShift', 'start', e.target.value)}
                            >
                              <option value="">Select time</option>
                              {startTimeOptions.map(time => (
                                <option key={time} value={time}>{time}</option>
                              ))}
                            </Form.Select>
                            <Form.Select 
                              size="sm"
                              value={schedules[day.toLowerCase()].secondShift.end}
                              onChange={(e) => handleScheduleChange(day, 'secondShift', 'end', e.target.value)}
                            >
                              <option value="">Select time</option>
                              {endTimeOptions.map(time => (
                                <option key={time} value={time}>{time}</option>
                              ))}
                            </Form.Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Tab.Pane>

          <Tab.Pane eventKey="documents">
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-transparent border-0 pt-4 pb-0">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">Documents</h5>
                    <small className="text-muted">Manage worker's documents and files</small>
                  </div>
                  <div className="d-flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                      multiple
                    />
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="d-flex align-items-center gap-2"
                      disabled={uploadingDocument}
                    >
                      {uploadingDocument ? (
                        <>
                          <Spinner size="sm" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          Upload Document
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                {documents.length === 0 ? (
                  <div className="text-center py-5">
                    <FileText size={48} className="text-muted mb-3" />
                    <h6>No Documents Yet</h6>
                    <p className="text-muted">Upload worker documents like contracts, certificates, or IDs</p>
                  </div>
                ) : (
                  <div className="documents-grid">
                    {documents.map((doc, index) => (
                      <div key={index} className="document-card">
                        <div className="document-icon">
                          <FileText size={24} />
                        </div>
                        <div className="document-info">
                          <h6>{doc.name}</h6>
                          <small className="text-muted">
                            Uploaded on {format(doc.uploadedAt.toDate(), 'MMM d, yyyy')}
                          </small>
                        </div>
                        <div className="document-actions">
                          <Button
                            variant="link"
                            className="p-0 text-primary"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download size={16} />
                          </Button>
                          <Button
                            variant="link"
                            className="p-0 text-danger"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
      <style jsx global>{`
          .nav-tabs {
            border-bottom: 1px solid #e2e8f0;
          }

          .nav-tabs .nav-link {
            color: #64748b;
            border: none;
            border-bottom: 2px solid transparent;
            padding: 1rem 1.5rem;
            transition: all 0.2s ease;
            font-weight: 500;
          }

          .nav-tabs .nav-link:hover {
            color: #3b82f6;
            border-color: transparent;
            background-color: #f8fafc;
          }

          .nav-tabs .nav-link.active {
            color: #3b82f6;
            border-bottom: 2px solid #3b82f6;
            background-color: transparent;
          }

         /* Card Styles */
  .info-grid {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .info-items {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .info-card {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem;
    background: #f8fafc;
    border-radius: 12px;
    transition: all 0.2s ease;
    border: 1px solid #e2e8f0;
  }

  .info-card:hover {
    background: #f1f5f9;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }

  .info-card.full-width {
    grid-column: 1 / -1;
  }

  .info-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #3b82f6;
    font-size: 1.2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .info-content {
    flex: 1;
  }

  .info-label {
    font-size: 0.75rem;
    color: #64748b;
    margin-bottom: 0.25rem;
    font-weight: 500;
  }

  .info-value {
    color: #1e293b;
    font-weight: 500;
    font-size: 0.9375rem;
  }

  /* Emergency Contact Styles */
  .emergency-container {
    background: #fef2f2;
    border: 1px dashed #fca5a5;
    border-radius: 12px;
    padding: 1.5rem;
  }

  .emergency-items {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .emergency-card {
    background: white;
    padding: 1.25rem;
    border-radius: 12px;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    transition: all 0.2s ease;
    border: 1px solid #fee2e2;
  }

  .emergency-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }

  .emergency-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: #fee2e2;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #dc2626;
    font-size: 1.2rem;
  }

  .emergency-content {
    flex: 1;
  }

  .emergency-label {
    font-size: 0.75rem;
    color: #64748b;
    margin-bottom: 0.25rem;
    font-weight: 500;
  }

  .emergency-value {
    color: #1e293b;
    font-weight: 500;
    font-size: 0.9375rem;
  }

  /* Skills & Certifications Styles */
  .certificates-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }

  .certificate-card {
    background: white;
    border-radius: 12px;
    transition: all 0.3s ease;
  }

  .certificate-content {
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    height: 100%;
  }

  .certificate-card:hover .certificate-content {
    border-color: #cbd5e1;
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  }

  .certificate-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .certificate-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.5rem;
  }

  .certificate-issuer {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 1rem;
  }

  .certificate-id {
    background: #f8fafc;
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    border: 1px dashed #cbd5e1;
  }

  .certificate-id code {
    display: block;
    color: #3b82f6;
    font-family: monospace;
    font-size: 0.875rem;
  }

  .certificate-dates {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
  }

  .date-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .date-item i,
  .date-item svg {
    padding: 0.5rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .certificate-status {
    position: absolute;
    bottom: 2rem;
    right: 2rem;
  }

  .certificate-status .badge {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  /* Skills Summary Styles */
  .skills-info {
    background: #f8fafc;
    border-radius: 12px;
    padding: 1.5rem;
    margin-top: 1rem;
  }

  .skills-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 0.5rem 0;
  }

  .skill-badge-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .skill-badge-item:hover {
    background: #f8fafc;
    transform: translateX(4px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }

  .skill-badge-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #1e293b;
  }

  .skill-icon {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #e2e8f0;
    border-radius: 6px;
    color: #3b82f6;
  }

  .skill-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: #334155;
  }

  .remove-skill-btn {
    color: #94a3b8;
    padding: 4px;
    font-size: 18px;
    opacity: 0;
    transition: all 0.2s ease;
  }

  .skill-badge-item:hover .remove-skill-btn {
    opacity: 1;
  }

  .remove-skill-btn:hover {
    color: #ef4444;
    transform: scale(1.1);
  }

  /* Certificate Styles */
  .certificates-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    padding: 1rem 0;
  }

  .certificate-card {
    perspective: 1000px;
    height: 100%;
  }

  .certificate-content {
    position: relative;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 2px solid #e2e8f0;
    border-radius: 16px;
    padding: 2rem;
    transition: all 0.3s ease;
    transform-style: preserve-3d;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }

  .certificate-card:hover .certificate-content {
    transform: rotateX(5deg) rotateY(5deg);
    box-shadow: 0 20px 30px rgba(0, 0, 0, 0.1);
    border-color: #cbd5e1;
  }

  .certificate-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #f1f5f9;
  }

  .certificate-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.5rem;
    letter-spacing: -0.02em;
  }

  .certificate-issuer {
    margin-bottom: 1.5rem;
  }

  .certificate-issuer strong {
    display: block;
    color: #0f172a;
    font-size: 1rem;
    margin-top: 0.25rem;
  }

  .certificate-id {
    background: #f8fafc;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    border: 1px dashed #cbd5e1;
  }

  .certificate-id code {
    display: block;
    color: #3b82f6;
    font-family: monospace;
    font-size: 0.875rem;
  }

  .certificate-dates {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
  }

  .date-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .remove-cert-btn {
    opacity: 0;
    transition: all 0.2s ease;
    font-size: 1.25rem;
  }

  .certificate-item:hover .remove-cert-btn {
    opacity: 1;
  }

  .remove-cert-btn:hover {
    transform: scale(1.1);
  }

  @media (max-width: 768px) {
    .certificate-dates {
      grid-template-columns: 1fr;
    }
  }

  /* Table Styles */
  .table {
    margin-bottom: 0;
  }

  .table th {
    font-weight: 600;
    background: #f8fafc;
    padding: 1rem;
    font-size: 0.875rem;
    color: #64748b;
  }

  .table td {
    padding: 1rem;
    vertical-align: middle;
    font-size: 0.875rem;
  }

  .table tbody tr {
    transition: all 0.2s ease;
  }

  .table tbody tr:hover {
    background-color: #f8fafc;
  }

  .table-responsive {
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  /* Filter Styles */
  .form-control, .form-select {
    font-size: 0.875rem;
    border-color: #e2e8f0;
    background-color: #fff;
  }

  .form-control:focus, .form-select:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
  }

  .form-select {
    padding-right: 2rem;
    background-position: right 0.5rem center;
  }

  /* Table Footer Styles */
  .table-footer {
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }

  /* Search Input Styles */
  .search-input {
    padding-left: 2.5rem;
    padding-right: 1rem;
    border-radius: 0.375rem;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
  }

  .filter-panel {
    border: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  .filter-panel .form-control,
  .filter-panel .form-select {
    border: 1px solid #e2e8f0;
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
  }

  .filter-panel .form-control:focus,
  .filter-panel .form-select:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  .filter-panel .form-select {
    background-color: white;
    cursor: pointer;
  }

  @media (max-width: 768px) {
    .filter-panel .d-flex {
      flex-direction: column;
    }

    .filter-panel .form-control,
    .filter-panel .form-select {
      width: 100% !important;
    }
  }
`}</style>
    </div>
  );
};


export default WorkerDetails; 