import React, { useState, useEffect, useMemo, Fragment } from "react";
import {
  Row,
  Col,
  Card,
  Badge,
  Button,
  Breadcrumb,
  OverlayTrigger,
  Tooltip,
  Spinner,
  Form,
} from "react-bootstrap";
import { FaUser } from "react-icons/fa";
import { useRouter } from "next/router";
import { db } from "../../../firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import { GeeksSEO } from "widgets";
import JobStats from "sub-components/dashboard/projects/single/task/JobStats";
import { Search, X, ChevronDown, ChevronUp, Filter } from 'react-feather';
import { 
  BsBriefcase, 
  BsCalendar, 
  BsClock, 
  BsArrowRepeat 
} from "react-icons/bs";
import Link from 'next/link';

const FilterPanel = ({ filters, setFilters, onClear, loading, loadData }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      loadData();
    }
  };

  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex align-items-center flex-grow-1">
            <OverlayTrigger
              placement="right"
              overlay={<Tooltip>Click to {isExpanded ? 'collapse' : 'expand'} filters</Tooltip>}
            >
              <div 
                className="d-flex align-items-center" 
                style={{ cursor: 'pointer' }}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <Filter size={16} className="me-2 text-primary" />
                <h6 className="mb-0 me-2" style={{ fontSize: '1rem' }}>
                  Filter
                  {Object.values(filters).filter(value => value !== '').length > 0 && (
                    <Badge 
                      bg="primary" 
                      className="ms-2" 
                      style={{ 
                        fontSize: '0.75rem', 
                        verticalAlign: 'middle',
                        borderRadius: '12px',
                        padding: '0.25em 0.6em'
                      }}
                    >
                      {Object.values(filters).filter(value => value !== '').length}
                    </Badge>
                  )}
                </h6>
                {isExpanded ? (
                  <ChevronUp size={16} className="text-muted" />
                ) : (
                  <ChevronDown size={16} className="text-muted" />
                )}
              </div>
            </OverlayTrigger>

            {!isExpanded && (
              <div className="ms-4 flex-grow-1" style={{ maxWidth: '300px' }}>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Quick search..."
                  style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                  onKeyPress={handleKeyPress}
                />
              </div>
            )}
          </div>

          <div>
            <Button 
              variant="outline-danger" 
              size="sm"
              onClick={onClear}
              className="me-2"
              disabled={loading}
              style={{ fontSize: '0.9rem' }}
            >
              <X size={14} className="me-1" />
              Clear
            </Button>
            
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => loadData()}
              disabled={loading}
            >
              <Search size={14} className="me-1" />
              Search
            </Button>
          </div>
        </div>

        <div style={{ 
          maxHeight: isExpanded ? '1000px' : '0',
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out',
          opacity: isExpanded ? 1 : 0
        }}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Job Number:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.jobNo}
                  onChange={(e) => setFilters(prev => ({ ...prev, jobNo: e.target.value }))}
                  placeholder="Enter job number..."
                  onKeyPress={handleKeyPress}
                  style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Job Name:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.jobName}
                  onChange={(e) => setFilters(prev => ({ ...prev, jobName: e.target.value }))}
                  placeholder="Search by job name..."
                  onKeyPress={handleKeyPress}
                  style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Customer:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.customerName}
                  onChange={(e) => setFilters(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Search by customer name..."
                  onKeyPress={handleKeyPress}
                  style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Status:</Form.Label>
                <Form.Select
                  size="sm"
                  value={filters.jobStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, jobStatus: e.target.value }))}
                  style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                >
                  <option value="">All Status</option>
                  <option value="Created">Created</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Job Started">Job Started</option>
                  <option value="Job Complete">Job Complete</option>
                  <option value="Validate">Validate</option>
                  <option value="Scheduled">Scheduled</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Priority:</Form.Label>
                <Form.Select
                  size="sm"
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                >
                  <option value="">All Priority</option>
                  <option value="Low">Low</option>
                  <option value="Mid">Mid</option>
                  <option value="High">High</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Job Type:</Form.Label>
                <Form.Select
                  size="sm"
                  value={filters.jobType}
                  onChange={(e) => setFilters(prev => ({ ...prev, jobType: e.target.value }))}
                  style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                >
                  <option value="">All Types</option>
                  <option value="recurring">Recurring</option>
                  <option value="one-time">One-time</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </div>
      </Card.Body>
    </Card>
  );
};

const ViewJobs = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersData, setUsersData] = useState([]);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const [editLoading, setEditLoading] = useState(false); // New state for edit loading
  const [jobTypeFilter, setJobTypeFilter] = useState('all'); // 'all', 'recurring', 'one-time'
  const [filters, setFilters] = useState({
    search: '',
    jobNo: '',
    jobName: '',
    customerName: '',
    jobStatus: '',
    priority: '',
    jobType: ''
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Low":
        return <Badge bg="success">Low</Badge>;
      case "Mid":
        return <Badge bg="warning">Mid</Badge>;
      case "High":
        return <Badge bg="danger">High</Badge>;
      default:
        return priority;
    }
  };

  const getStatusBadge = (status) => {
    const getStyle = (backgroundColor, textColor = "#fff") => ({
      backgroundColor,
      color: textColor,
      padding: "0.5em 0.75em",
      borderRadius: "0.25rem",
      fontWeight: "normal",
      display: "inline-block",
      fontSize: "0.875em",
      lineHeight: "1",
      textAlign: "center",
      whiteSpace: "nowrap",
      verticalAlign: "baseline",
    });

    switch (status) {
      case "Created":
        return <span style={getStyle("#D3D3D3", "#000")}>Created</span>; // Light Gray
      case "Confirmed":
        return <span style={getStyle("#4169E1")}>Confirmed</span>; // Royal Blue
      case "Cancelled":
        return <span style={getStyle("#FF0000")}>Cancelled</span>; // Red
      case "Job Started":
        return <span style={getStyle("#FFA500")}>Job Started</span>; // Orange
      case "Job Complete":
        return <span style={getStyle("#008000")}>Job Complete</span>; // Green
      case "Validate":
        return <span style={getStyle("#00FFFF", "#000")}>Validate</span>; // Cyan
      case "Scheduled":
        return <span style={getStyle("#808080")}>Scheduled</span>; // Gray
      default:
        return <span style={getStyle("#D3D3D3", "#000")}>{status}</span>; // Default to light gray
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const customStyles = {
    table: {
      style: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        width: '100%',
        tableLayout: 'fixed'
      }
    },
    headRow: {
      style: {
        backgroundColor: '#f8fafc',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        borderBottom: '1px solid #e2e8f0',
        minHeight: '52px'
      }
    },
    headCells: {
      style: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#475569',
        paddingLeft: '16px',
        paddingRight: '16px'
      }
    },
    cells: {
      style: {
        fontSize: '14px',
        color: '#64748b',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px'
      }
    },
    rows: {
      style: {
        minHeight: '60px',
        '&:hover': {
          backgroundColor: '#f1f5f9',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }
      }
    },
    expandableRowsStyle: {
      backgroundColor: '#f8fafc'
    },
    pagination: {
      style: {
        borderTop: '1px solid #e2e8f0',
        minHeight: '56px'
      },
      pageButtonsStyle: {
        borderRadius: '4px',
        height: '32px',
        padding: '4px 8px',
        margin: '0 4px'
      }
    }
  };

  const AssignedWorkerCell = ({ workers }) => {
    const displayName = workers[0]?.workerId || "Unassigned";
    const remainingCount = workers.length - 1;

    return (
      <OverlayTrigger
        placement="top"
        overlay={
          <Tooltip id={`tooltip-${displayName}`}>
            {workers.map(w => w.workerId).join(", ")}
          </Tooltip>
        }
      >
        <div className="d-flex align-items-center">
          <FaUser className="me-2" />
          <span className="text-truncate" style={{ maxWidth: "120px" }}>
            {displayName}
          </span>
          {remainingCount > 0 && (
            <Badge bg="secondary" className="ms-2">
              +{remainingCount}
            </Badge>
          )}
        </div>
      </OverlayTrigger>
    );
  };

  const columns = [
    {
      name: "#",
      selector: (row, index) => index + 1,
      sortable: false,
      width: "60px",
      cell: (row, index) => <span className="text-muted">{index + 1}</span>
    },
    {
      name: "Job No.",
      selector: (row) => row.jobNo,
      sortable: true,
      width: "100px",
      cell: row => (
       
          <Link href={`/dashboard/jobs/${row.id}`} passHref>
            <span 
              className="badge bg-light text-primary cursor-pointer"
              onClick={(e) => e.stopPropagation()} // Prevents row click event
            >
              {row.jobNo}
            </span>
          </Link>
     
      )
    },
    {
      name: "Job Name",
      selector: (row) => row.jobName,
      sortable: true,
      width: "150px",
      cell: (row) => (
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip>
              <div>Click to view details for:</div>
              <div><strong>{row.jobName}</strong></div>
            </Tooltip>
          }
        >
          <Link href={`/dashboard/jobs/${row.id}`} passHref>
            <div 
              className="fw-semibold text-primary text-truncate cursor-pointer" 
              style={{ maxWidth: "130px" }}
              onClick={(e) => e.stopPropagation()} // Prevents row click event
            >
              {row.jobName}
            </div>
          </Link>
        </OverlayTrigger>
      ),
    },
    {
      name: "Customer",
      selector: (row) => row.customerName,
      sortable: true,
      width: "200px",
      cell: (row) => {
        const customerName = row.customerName.replace(/^C\d+ - /, '');
        const cardCodeMatch = row.customerName.match(/^C(\d+)/);
        const cardCode = cardCodeMatch ? `C${cardCodeMatch[1].padStart(6, '0')}` : null;
        return (
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>View Customer Details</Tooltip>}
          >
            {cardCode ? (
              <Link href={`/dashboard/customers/${cardCode}`} passHref>
                <span className="text-primary cursor-pointer">
                  {customerName}
                </span>
              </Link>
            ) : (
              <span>{customerName}</span>
            )}
          </OverlayTrigger>
        );
      },
    },
    {
      name: "Address",
      selector: (row) => row.location?.locationName,
      sortable: true,
      width: "200px",
      cell: (row) => (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>{row.location?.address?.streetAddress || 'No address available'}</Tooltip>}
        >
          <div className="text-truncate" style={{ maxWidth: "180px" }}>
            {row.location?.locationName || 'No location'}
          </div>
        </OverlayTrigger>
      ),
    },
    {
      name: "Status",
      selector: (row) => row.jobStatus,
      sortable: true,
      width: "120px",
      cell: (row) => getStatusBadge(row.jobStatus),
    },
    {
      name: "Priority",
      selector: (row) => row.priority,
      sortable: true,
      width: "100px",
      cell: (row) => getPriorityBadge(row.priority),
    },
    {
      name: "Assigned Workers",
      selector: (row) => row.assignedWorkers,
      sortable: true,
      width: "130px",
      cell: (row) => (
        <AssignedWorkerCell workers={row.assignedWorkers} />
      ),
    },
    {
      name: "Date & Time",
      selector: (row) => row.startDate,
      sortable: true,
      width: "150px",
      cell: (row) => (
        <div className="d-flex flex-column">
          <span>{formatDate(row.startDate)}</span>
          <small className="text-muted">{formatTime(row.startTime)} - {formatTime(row.endTime)}</small>
        </div>
      ),
    },
    // {
    //   name: "Est. Duration",
    //   selector: (row) => row.estimatedDurationHours,
    //   sortable: true,
    //   width: "120px",
    //   cell: (row) => (
    //     <span>{`${row.estimatedDurationHours}h ${row.estimatedDurationMinutes}m`}</span>
    //   ),
    // },
    {
      name: "Equipment",
      selector: (row) => row.equipments,
      sortable: true,
      width: "100px",
      cell: (row) => (
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip>
              {row.equipments.map(eq => `${eq.equipmentType} - ${eq.modelSeries}`).join(', ')}
            </Tooltip>
          }
        >
          <div className="text-truncate" style={{ maxWidth: "180px" }}>
            {row.equipments.length > 0 ? `${row.equipments.length} item(s)` : "No equipment"}
          </div>
        </OverlayTrigger>
      ),
    },
    {
      name: "Type",
      selector: (row) => row.isRepeating ? "Recurring" : "One-time",
      sortable: true,
      width: "120px",
      cell: (row) => (
        <div>
          {row.isRepeating ? (
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip>
                  {row.repeatDetails ? (
                    <>
                      Recurring job ({row.repeatDetails.frequency || 'N/A'}) - 
                      Occurrence {row.repeatDetails.occurrence || '0'} of {row.repeatDetails.totalOccurrences || '0'}
                      {row.repeatDetails.originalJobNo && 
                        <div>Original Job: #{row.repeatDetails.originalJobNo}</div>
                      }
                    </>
                  ) : (
                    'Recurring job'
                  )}
                </Tooltip>
              }
            >
              <Badge bg="info" className="d-flex align-items-center gap-1">
                <BsArrowRepeat />
                Recurring
              </Badge>
            </OverlayTrigger>
          ) : (
            <Badge bg="secondary">One-time</Badge>
          )}
        </div>
      ),
    },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);

      // Check if we have recent users data
      const shouldFetchUsers = !lastFetchTime || (Date.now() - lastFetchTime) > CACHE_DURATION;

      let users = usersData;
      if (shouldFetchUsers) {
        const usersSnapshot = await getDocs(collection(db, "users"));
        users = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsersData(users);
        setLastFetchTime(Date.now());
      }

      // Always fetch jobs as they might change more frequently
      const jobsSnapshot = await getDocs(collection(db, "jobs"));
      const jobsData = jobsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const sortedJobsData = jobsData.sort((a, b) => b.timestamp - a.timestamp);

      const mergedData = sortedJobsData.map((job) => {
        const workerNames = job.assignedWorkers
          .map((workerObj) => {
            const workerId = workerObj.workerId;
            const worker = users.find((user) => user.workerId === workerId);
            return worker
              ? `${worker.fullName}`
              : `Unknown Worker (ID: ${workerId})`;
          })
          .join(", ");

        return {
          ...job,
          workerFullName: workerNames || "No workers assigned",
          locationName: job.location?.locationName || "No location name",
        };
      });

      setJobs(mergedData);
      setFilteredJobs(mergedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      let filtered = jobs;

      // Apply filters
      if (filters.jobNo) {
        filtered = filtered.filter(job => 
          job.jobNo.toLowerCase().includes(filters.jobNo.toLowerCase())
        );
      }

      if (filters.jobName) {
        filtered = filtered.filter(job => 
          job.jobName.toLowerCase().includes(filters.jobName.toLowerCase())
        );
      }

      if (filters.customerName) {
        filtered = filtered.filter(job => 
          job.customerName.toLowerCase().includes(filters.customerName.toLowerCase())
        );
      }

      if (filters.jobStatus) {
        filtered = filtered.filter(job => job.jobStatus === filters.jobStatus);
      }

      if (filters.priority) {
        filtered = filtered.filter(job => job.priority === filters.priority);
      }

      if (filters.jobType) {
        filtered = filtered.filter(job => 
          filters.jobType === 'recurring' ? job.isRepeating : !job.isRepeating
        );
      }

      // Quick search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(job => {
          return (
            job.jobNo.toLowerCase().includes(searchLower) ||
            job.jobName.toLowerCase().includes(searchLower) ||
            job.customerName.toLowerCase().includes(searchLower) ||
            job.jobStatus.toLowerCase().includes(searchLower) ||
            job.priority.toLowerCase().includes(searchLower)
          );
        });
      }

      setFilteredJobs(filtered);
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [filters, jobs]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleRowClick = (row) => {
    Swal.fire({
      title: `<strong class="text-primary">Job Summary</strong>`,
      html: `
        <div>
          <div class="text-center mb-4">
            <h5 class="mb-1">#${row.jobNo}</h5>
            <p class="text-muted">${row.jobName}</p>
          </div>
          
          <div class="row g-3 mb-4">
            <!-- Left Column -->
            <div class="col-6 text-start">
              <div class="mb-3">
                <div class="d-flex align-items-center mb-1">
                  <i class="fas fa-user text-primary me-2"></i>
                  <strong>Customer:</strong>
                </div>
                <div class="ms-4">
                  ${row.customerName}
                </div>
              </div>
  
              <div class="mb-3">
                <div class="d-flex align-items-center mb-1">
                  <i class="fas fa-map-marker-alt text-danger me-2"></i>
                  <strong>Location:</strong>
                </div>
                <div class="ms-4">
                  ${row.location?.locationName || 'No location'}
                </div>
              </div>
  
              <div class="mb-3">
                <div class="d-flex align-items-center mb-1">
                  <i class="fas fa-users text-info me-2"></i>
                  <strong>Assigned Workers:</strong>
                </div>
                <div class="ms-4">
                  ${row.assignedWorkers?.map(w => w.workerId).join(', ') || 'None'}
                </div>
              </div>
            </div>
  
            <!-- Right Column -->
            <div class="col-6 text-start">
              <div class="mb-3">
                <div class="d-flex align-items-center mb-1">
                  <i class="fas fa-tasks text-success me-2"></i>
                  <strong>Status:</strong>
                </div>
                <div class="ms-4">
                  <span class="badge bg-secondary">${row.jobStatus}</span>
                </div>
              </div>
  
              <div class="mb-3">
                <div class="d-flex align-items-center mb-1">
                  <i class="far fa-calendar text-warning me-2"></i>
                  <strong>Date & Time:</strong>
                </div>
                <div class="ms-4">
                  <div class="d-flex justify-content-between">
                    <div>
                      <strong>Start:</strong><br>
                      ${formatDate(row.startDate)}<br>
                      ${formatTime(row.startTime)}
                    </div>
                    <div>
                      <strong>End:</strong><br>
                      ${formatDate(row.endDate)}<br>
                      ${formatTime(row.endTime)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
  
          <div class="d-grid gap-2">
            <button class="btn btn-primary" id="viewBtn">
              <i class="fas fa-eye me-2"></i>View Job
            </button>
            <button class="btn btn-warning" id="editBtn">
              <i class="fas fa-edit me-2"></i>Edit Job
            </button>
            <button class="btn btn-outline-danger" id="removeBtn">
              <i class="fas fa-trash-alt me-2"></i>Remove Job
            </button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCloseButton: true,
      width: '600px', // Made wider to accommodate two columns
      customClass: {
        container: 'job-action-modal',
        closeButton: 'position-absolute top-0 end-0 mt-2 me-2',
      },
      didOpen: () => {
        document.getElementById('viewBtn').addEventListener('click', () => {
          setEditLoading(true); // Set loading state
          Swal.close();
          router.push(`/dashboard/jobs/${row.id}`).finally(() => {
            setEditLoading(false); // Reset loading state after navigation
          });
        });
  
        document.getElementById('editBtn').addEventListener('click', () => {
          setEditLoading(true); // Set loading state
          Swal.close();
          router.push(`./update-jobs/${row.id}`).finally(() => {
            setEditLoading(false); // Reset loading state after navigation
          });
        });
  
        document.getElementById('removeBtn').addEventListener('click', async () => {
          Swal.close();
          const deleteResult = await Swal.fire({
            title: "Are you sure?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, remove it!"
          });
  
          if (deleteResult.isConfirmed) {
            try {
              const jobRef = doc(db, "jobs", row.id);
              await deleteDoc(jobRef);
              Swal.fire("Deleted!", "The job has been removed.", "success");
              const updatedJobs = jobs.filter((job) => job.id !== row.id);
              setJobs(updatedJobs);
              setFilteredJobs(prevFiltered => 
                prevFiltered.filter((job) => job.id !== row.id)
              );
            } catch (error) {
              console.error("Delete error:", error);
              Swal.fire(
                "Error!",
                "There was a problem removing the job.",
                "error"
              );
            }
          }
        });
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Created": return "#D3D3D3";  // Light Gray
      case "Confirmed": return "#4169E1"; // Royal Blue
      case "Cancelled": return "#FF0000"; // Red
      case "Job Started": return "#FFA500"; // Orange
      case "Job Complete": return "#008000"; // Green
      case "Validate": return "#00FFFF"; // Cyan
      case "Scheduled": return "#808080"; // Gray
      default: return "#D3D3D3"; // Default to light gray
    }
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      jobNo: '',
      jobName: '',
      customerName: '',
      jobStatus: '',
      priority: '',
      jobType: ''
    });
    // Reset to default view
    setFilteredJobs(jobs);
  };
  

  return (
    <Fragment>
      {editLoading && (
        <div className="loading-overlay">
          <Spinner animation="border" variant="primary" />
          <span className="text-muted ms-2">Redirecting to edit page...</span>
        </div>
      )}
      <GeeksSEO title="Job Lists | SAS&ME - SAP B1 | Portal" />

      <Row>
        <Col lg={12}>
          <div className="border-bottom pb-4 mb-4 d-flex align-items-center justify-content-between">
            <div className="mb-3">
              <h1 className="mb-1 h2 fw-bold">Job Lists</h1>
              <Breadcrumb>
                <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item active>List</Breadcrumb.Item>
              </Breadcrumb>
            </div>
            <div>
              <Button variant="primary" href="/dashboard/jobs/create-jobs">
                Add New Job
              </Button>
            </div>
          </div>
        </Col>
      </Row>
      <JobStats />
      <Row>
        <Col md={12} xs={12} className="mb-5">
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <FilterPanel 
                filters={filters}
                setFilters={setFilters}
                onClear={handleClearFilters}
                loading={loading}
                loadData={fetchData}
              />
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" className="me-2" />
                  <span className="text-muted">Loading jobs...</span>
                </div>
              ) : filteredJobs.length > 0 ? (
                <DataTable
                  columns={columns}
                  data={filteredJobs}
                  pagination
                 // highlightOnHover
                 // pointerOnHover
                  onRowClicked={(row) => handleRowClick(row)}
                  customStyles={customStyles}
                  fixedHeader
                        fixedHeaderScrollHeight="calc(100vh - 300px)"
                        dense
                        persistTableHead
                        paginationComponentOptions={{
                          noRowsPerPage: true // Hide rows per page selector
                        }}
                        progressPending={loading}
                  noDataComponent={
                    <div className="text-center py-5">
                      <div className="text-muted mb-2">No jobs found</div>
                      <small>Try adjusting your search terms</small>
                    </div>
                  }
                />
              ) : (
                <div className="text-center py-5">
                  <div className="text-muted mb-2">No jobs found</div>
                  <small>Try adjusting your search terms or add new jobs</small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <style jsx>{`
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }
      `}</style>
    </Fragment>
  );
};

export default ViewJobs;