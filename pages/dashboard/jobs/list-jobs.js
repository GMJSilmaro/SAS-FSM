import React, {
  Fragment,
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  Col,
  Row,
  Card,
  Button,
  OverlayTrigger,
  Tooltip,
  Badge,
  Breadcrumb,
  Placeholder,
  Spinner,
  Form,
  Collapse,
  Modal,
} from "react-bootstrap";
import { useRouter } from "next/router";
import {
  Eye,
  EnvelopeFill,
  TelephoneFill,
  GeoAltFill,
  CurrencyExchange,
  HouseFill,
  CalendarRange,
  CheckCircleFill,
  XLg,
  ChevronLeft,
  ChevronRight,
  FilterCircle,
  Calendar,
  ListUl,
} from "react-bootstrap-icons";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  X as FeatherX,
} from "react-feather";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { GeeksSEO, PageHeading } from "widgets";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { Users, Activity, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { FaUser, FaPlus } from "react-icons/fa";

const stripHtmlTags = (html) => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, '');
};

const FilterPanel = ({
  filters,
  setFilters,
  onClear,
  loading,
  handleSearch,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleSearch();
    }
  };

  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex align-items-center flex-grow-1">
            <OverlayTrigger
              placement="right"
              overlay={
                <Tooltip>
                  Click to {isExpanded ? "collapse" : "expand"} filters
                </Tooltip>
              }
            >
              <div
                className="d-flex align-items-center"
                style={{ cursor: "pointer" }}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <Filter size={16} className="me-2 text-primary" />
                <h6 className="mb-0 me-2" style={{ fontSize: "1rem" }}>
                  Filter
                  {Object.values(filters).filter((value) => value !== "")
                    .length > 0 && (
                    <Badge
                      bg="primary"
                      className="ms-2"
                      style={{
                        fontSize: "0.75rem",
                        verticalAlign: "middle",
                        borderRadius: "12px",
                        padding: "0.25em 0.6em",
                      }}
                    >
                      {
                        Object.values(filters).filter((value) => value !== "")
                          .length
                      }
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
              <div className="ms-4 flex-grow-1" style={{ maxWidth: "300px" }}>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  placeholder="Quick search..."
                  style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}
                  onKeyPress={handleKeyPress}
                />
              </div>
            )}
          </div>

          <div>
            <Button
              variant="soft-danger"
              size="sm"
              onClick={onClear}
              className="me-2 btn-icon-text"
              disabled={loading}
            >
              <FeatherX size={14} className="icon-left" />
              Clear
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSearch}
              disabled={loading}
              className="btn-icon-text"
            >
              <Search size={14} className="icon-left" />
              {loading ? (
                <>
                  <Spinner size="sm" className="me-1" />
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </Button>
          </div>
        </div>

        <div
          style={{
            maxHeight: isExpanded ? "1000px" : "0",
            overflow: "hidden",
            transition: "all 0.3s ease-in-out",
            opacity: isExpanded ? 1 : 0,
          }}
        >
          <Row>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Job Number:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.jobNo}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, jobNo: e.target.value }))
                  }
                  placeholder="Enter job number..."
                  onKeyPress={handleKeyPress}
                  style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Subject Name:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.jobName}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, jobName: e.target.value }))
                  }
                  placeholder="Search by subject name..."
                  onKeyPress={handleKeyPress}
                  style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Customer:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.customerName}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      customerName: e.target.value,
                    }))
                  }
                  placeholder="Search by customer name..."
                  onKeyPress={handleKeyPress}
                  style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Status:</Form.Label>
                <Form.Select
                  size="sm"
                  value={filters.jobStatus}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      jobStatus: e.target.value,
                    }))
                  }
                  style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}
                >
                  <option value="">All Status</option>
                  <option value="Created">Created</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="InProgress">InProgress</option>
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
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                  style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}
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
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, jobType: e.target.value }))
                  }
                  style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}
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
  const [jobTypeFilter, setJobTypeFilter] = useState("all"); // 'all', 'recurring', 'one-time'
  const [filters, setFilters] = useState({
    search: "",
    jobNo: "",
    jobName: "",
    customerName: "",
    jobStatus: "",
    priority: "",
    jobType: "",
  });
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    pendingJobs: 0,
    completedJobs: 0,
  });
  const [workerStats, setWorkerStats] = useState({
    totalWorkers: 0,
    activeWorkers: 0,
    inactiveWorkers: 0,
    fieldWorkers: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [error, setError] = useState(null);
  const [followUpSettings, setFollowUpSettings] = useState({});

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
      case "InProgress":
        return <span style={getStyle("#FFA500")}>InProgress</span>; // Orange
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
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = (hour % 12 || 12).toString().padStart(2, '0');
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const customStyles = {
    table: {
      style: {
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        width: "100%",
        tableLayout: "fixed",
      },
    },
    headRow: {
      style: {
        backgroundColor: "#f8fafc",
        borderTopLeftRadius: "8px",
        borderTopRightRadius: "8px",
        borderBottom: "1px solid #e2e8f0",
        minHeight: "52px",
      },
    },
    headCells: {
      style: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#475569",
        paddingLeft: "16px",
        paddingRight: "16px",
      },
    },
    cells: {
      style: {
        fontSize: "14px",
        color: "#64748b",
        paddingLeft: "16px",
        paddingRight: "16px",
        paddingTop: "12px",
        paddingBottom: "12px",
      },
    },
    rows: {
      style: {
        minHeight: "60px",
        "&:hover": {
          backgroundColor: "#f1f5f9",
          cursor: "pointer",
          transition: "all 0.2s",
        },
      },
    },
    expandableRowsStyle: {
      backgroundColor: "#f8fafc",
    },
    pagination: {
      style: {
        borderTop: "1px solid #e2e8f0",
        minHeight: "56px",
      },
      pageButtonsStyle: {
        borderRadius: "4px",
        height: "32px",
        padding: "4px 8px",
        margin: "0 4px",
      },
    },
  };

  const AssignedWorkerCell = ({ value }) => {
    return (
      <div className="d-flex align-items-center">
        <FaUser className="me-2" />
        <span>{value?.name || "Unassigned"}</span>
      </div>
    );
  };

  const columnHelper = createColumnHelper();

  const columns = [
    columnHelper.accessor("jobNo", {
      header: "Job No.",
      size: 150,
      cell: (info) => (
        <div className="d-flex align-items-center">
          <span className="fw-semibold">{info.getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor("jobName", {
      header: "Subject Name",
      size: 150,
      cell: (info) => (
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip>
              <div>Click to view details for:</div>
              <div>
                <strong>{info.getValue()}</strong>
              </div>
            </Tooltip>
          }
        >
          <Link href={`/jobs/view/${info.row.original.id}`} passHref>
            <div
              className="fw-semibold text-primary text-truncate cursor-pointer"
              style={{ maxWidth: "130px" }}
              onClick={(e) => e.stopPropagation()}
            >
              {info.getValue()}
            </div>
          </Link>
        </OverlayTrigger>
      ),
    }),
    columnHelper.accessor("jobDescription", {
      header: "Description",
      size: 150,
      cell: (info) => {
        const rawDescription = info.getValue() || "No description available";
        const cleanDescription = stripHtmlTags(rawDescription);
        
        return (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip>
                <div style={{ maxWidth: "250px", whiteSpace: "normal" }}>
                  {cleanDescription}
                </div>
              </Tooltip>
            }
          >
            <div 
              className="text-truncate" 
              style={{ 
                maxWidth: "200px",
                fontSize: "0.875rem",
                color: "#64748b"
              }}
            >
              {cleanDescription}
            </div>
          </OverlayTrigger>
        );
      },
    }),
    columnHelper.accessor("customerName", {
      header: "Customer",
      size: 200,
      cell: (info) => {
        const row = info.row.original;
        const customerName = info.getValue();
        const customerId = row.customerID;
        
        return (
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>View Customer Details</Tooltip>}
          >
            <div 
              onClick={(e) => {
                e.stopPropagation();
                if (customerId) {
                  try {
                    router.push(`/customers/view/${customerId}`);
                  } catch (error) {
                    console.error('Navigation Error:', error);
                  }
                } else {
                  console.warn('No customer ID available for:', customerName);
                }
              }}
              style={{
                cursor: customerId ? 'pointer' : 'default',
                color: customerId ? '#3b82f6' : 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
              className="customer-link"
            >
              <FaUser size={14} className="text-muted" />
              <span>{customerName}</span>
            </div>
          </OverlayTrigger>
        );
      },
    }),
    columnHelper.accessor("location.locationName", {
      header: "Location",
      size: 200,
      cell: (info) => info.getValue() || "No location",
    }),
    columnHelper.accessor("jobStatus", {
      header: "Job Status",
      size: 120,
      cell: (info) => getStatusBadge(info.getValue()),
    }),
    columnHelper.accessor("followUps", {
      header: "Follow-up Status",
      size: 150,
      cell: (info) => {
        const followUps = info.getValue();
        const jobId = info.row.original.id;

        if (!followUps || Object.keys(followUps).length === 0) {
          return (
            <div 
              className="follow-up-badge no-followup"
              style={{
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                padding: "4px 12px",
                borderRadius: "12px",
                fontSize: "0.75rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <i className="fe fe-clock me-1"></i>
              No Follow-up
            </div>
          );
        }

        const sortedFollowUps = Object.entries(followUps)
          .map(([id, followUp]) => ({
            id,
            ...followUp,
            createdAt: new Date(followUp.createdAt)
          }))
          .sort((a, b) => b.createdAt - a.createdAt);

        const lastFollowUp = sortedFollowUps[0];
        const remainingCount = sortedFollowUps.length - 1;

        const getStatusStyle = (status) => {
          switch (status?.toLowerCase()) {
            case 'logged':
              return {
                bg: '#fff7ed',
                color: '#c2410c',
                icon: 'fe-file-text'
              };
            case 'in progress':
              return {
                bg: '#eff6ff',
                color: '#1d4ed8',
                icon: 'fe-loader'
              };
            case 'closed':
              return {
                bg: '#f0fdf4',
                color: '#15803d',
                icon: 'fe-check-circle'
              };
            case 'cancelled':
              return {
                bg: '#fef2f2',
                color: '#dc2626',
                icon: 'fe-x-circle'
              };
            default:
              return {
                bg: '#f3f4f6',
                color: '#6b7280',
                icon: 'fe-help-circle'
              };
          }
        };

        const style = getStatusStyle(lastFollowUp.status);
        const typeSettings = Object.values(followUpSettings).find(t => t.name === lastFollowUp.type);

        return (
          <div 
            onClick={() => {
              if (remainingCount > 0) {
                router.push(`/dashboard/jobs/${jobId}#follow-ups`);
              }
            }}
            style={{ cursor: remainingCount > 0 ? 'pointer' : 'default' }}
          >
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip>
                  <div className="text-start">
                    <div className="fw-bold" style={{ color: typeSettings?.color }}>
                      {lastFollowUp.type}
                    </div>
                    <div><strong>Status:</strong> {lastFollowUp.status}</div>
                    <div><strong>Priority:</strong> {getPriorityLabel(lastFollowUp.priority)}</div>
                    {lastFollowUp.dueDate && (
                      <div><strong>Due:</strong> {new Date(lastFollowUp.dueDate).toLocaleDateString()}</div>
                    )}
                    {remainingCount > 0 && (
                      <div className="mt-2 text-muted">
                        Click to view {remainingCount} more follow-up{remainingCount > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </Tooltip>
              }
            >
              <div 
                className="follow-up-badge"
                style={{
                  backgroundColor: style.bg,
                  color: style.color,
                  padding: "4px 12px",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "all 0.2s ease",
                  border: `1px solid ${style.color}20`
                }}
              >
                <i className={`fe ${style.icon}`} style={{ fontSize: "12px" }}></i>
                <span>{lastFollowUp.status}</span>
                {remainingCount > 0 && (
                  <span className="ms-1 badge bg-secondary" style={{ fontSize: '0.7rem' }}>
                    +{remainingCount}
                  </span>
                )}
                {lastFollowUp.priority === 4 && (
                  <span className="ms-1" style={{ color: "#dc2626" }}>•</span>
                )}
              </div>
            </OverlayTrigger>
          </div>
        );
      },
    }),
    columnHelper.accessor("priority", {
      header: "Priority",
      size: 100,
      cell: (info) => getPriorityBadge(info.getValue()),
    }),
    columnHelper.accessor("assignedWorkers", {
      header: "Assigned Workers",
      size: 50,
      cell: (info) => {
        const workers = info.getValue() || [];
        const displayLimit = 3;
        const remainingCount = workers.length > displayLimit ? workers.length - displayLimit : 0;
        
        return (
          <div className="d-flex align-items-center">
            <div className="worker-avatars d-flex align-items-center">
              {workers.slice(0, displayLimit).map((worker, index) => (
                <OverlayTrigger
                  key={index}
                  placement="top"
                  overlay={
                    <Tooltip>{worker.workerName || 'Unknown'}</Tooltip>
                  }
                >
                  <div 
                    className="worker-avatar"
                    style={{
                      marginLeft: index > 0 ? '-8px' : '0',
                      zIndex: workers.length - index,
                      position: 'relative',
                    }}
                  >
                    {worker.profilePicture ? (
                      <img
                        src={worker.profilePicture}
                        alt={worker.workerName}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: '2px solid #fff',
                          objectFit: 'cover',
                          backgroundColor: '#f1f5f9',
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/avatar/placeholder.png';
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: '2px solid #fff',
                          backgroundColor: '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          color: '#64748b',
                        }}
                      >
                        {worker.workerName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                </OverlayTrigger>
              ))}
              {remainingCount > 0 && (
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip>
                      {workers.slice(displayLimit).map(w => w.workerName || 'Unknown').join(', ')}
                    </Tooltip>
                  }
                >
                  <div
                    className="remaining-count"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#cbd5e1',
                      border: '2px solid #fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: '-8px',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#475569',
                      zIndex: 0,
                    }}
                  >
                    +{remainingCount}
                  </div>
                </OverlayTrigger>
              )}
            </div>
            {workers.length === 0 && (
              <span 
                className="text-muted"
                style={{
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FaUser size={14} />
                Unassigned
              </span>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("startDate", {
      header: "Date & Time",
      size: 150,
      cell: (info) => (
        <div className="d-flex flex-column">
          <span>{formatDate(info.getValue())}</span>
          <small className="text-muted">
            {formatTime(info.row.original.startTime)} -{" "}
            {formatTime(info.row.original.endTime)}
          </small>
        </div>
      ),
    }),
    columnHelper.accessor("equipments", {
      header: "Equipment",
      size: 100,
      cell: (info) => {
        const equipments = info.getValue() || [];
        
        return (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip>
                {equipments.length > 0 
                  ? equipments
                      .map((eq) => `${eq.equipmentType || 'N/A'} - ${eq.modelSeries || 'N/A'}`)
                      .join(", ")
                  : "No equipment details available"
                }
              </Tooltip>
            }
          >
            <div className="text-truncate" style={{ maxWidth: "180px" }}>
              {equipments.length > 0
                ? `${equipments.length} item(s)`
                : "No equipment"}
            </div>
          </OverlayTrigger>
        );
      },
    }),
  
    columnHelper.accessor("createdAt", {
      header: "Created At",
      size: 150,
      cell: (info) => {
        const timestamp = info.getValue();
        if (!timestamp) return "N/A";
        
        const date = new Date(timestamp.seconds * 1000);
        const formattedDate = date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        const formattedTime = date.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        });

        return (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip>
                Created on: {formattedDate} at {formattedTime}
              </Tooltip>
            }
          >
            <div className="d-flex flex-column">
              <span style={{ fontSize: "0.875rem", color: "#475569" }}>
                {formattedDate}
              </span>
              <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                {formattedTime}
              </small>
            </div>
          </OverlayTrigger>
        );
      },
    }),
    columnHelper.accessor("updatedAt", {
      header: "Last Updated",
      size: 150,
      cell: (info) => {
        const timestamp = info.getValue();
        if (!timestamp) return "N/A";
        
        const date = new Date(timestamp.seconds * 1000);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        // Format relative time
        let relativeTime;
        if (diffInSeconds < 60) {
          relativeTime = 'Just now';
        } else if (diffInSeconds < 3600) {
          const minutes = Math.floor(diffInSeconds / 60);
          relativeTime = `${minutes}m ago`;
        } else if (diffInSeconds < 86400) {
          const hours = Math.floor(diffInSeconds / 3600);
          relativeTime = `${hours}h ago`;
        } else if (diffInSeconds < 604800) {
          const days = Math.floor(diffInSeconds / 86400);
          relativeTime = `${days}d ago`;
        } else {
          relativeTime = date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        }

        const formattedDate = date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        const formattedTime = date.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        });

        return (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip>
                Last updated on: {formattedDate} at {formattedTime}
              </Tooltip>
            }
          >
            <div 
              className="d-flex align-items-center"
              style={{
                backgroundColor: "#f1f5f9",
                padding: "4px 8px",
                borderRadius: "6px",
                fontSize: "0.875rem",
                color: "#64748b",
                width: "fit-content"
              }}
            >
              <i className="fe fe-clock me-1" style={{ fontSize: "12px" }}></i>
              {relativeTime}
            </div>
          </OverlayTrigger>
        );
      },
    }),
    columnHelper.accessor("createdBy", {
      header: "Created By",
      size: 130,
      cell: (info) => {
        const creator = info.getValue()?.fullName || "N/A";
        return (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip>
                {creator}
              </Tooltip>
            }
          >
            <span
              style={{
                backgroundColor: "#e2e8f0",
                color: "#475569",
                padding: "4px 12px",
                borderRadius: "12px",
                fontSize: "0.85rem",
                display: "inline-block",
                fontWeight: "500",
                whiteSpace: "nowrap",
                maxWidth: "130px",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              <i className="fe fe-user me-1" style={{ fontSize: "12px" }}></i>
              {creator}
            </span>
          </OverlayTrigger>
        );
      },
    }),
   
    columnHelper.accessor(() => null, {
      id: "actions",
      header: "Actions",
      size: 130,
      cell: (info) => (
        <div className="d-flex gap-2">
          <OverlayTrigger
            placement="left"
            overlay={
              <Tooltip>
                View complete details for job #{info.row.original.jobNo}
              </Tooltip>
            }
          >
            <Link
              href={`/jobs/view/${info.row.original.id}`}
              className="btn btn-primary btn-icon-text btn-sm"
              style={{ textDecoration: "none" }}
            >
              <Eye size={14} className="icon-left" />
              View
            </Link>
          </OverlayTrigger>
        </div>
      ),
    }),
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const jobsRef = collection(db, "jobs");
      const jobsSnapshot = await getDocs(jobsRef);
      const jobsList = jobsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setJobs(jobsList);
      setFilteredJobs(jobsList);
      setTotalRows(jobsList.length);
      setError(null);
    } catch (err) {
      console.error("Error loading jobs:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const table = useReactTable({
    data: filteredJobs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: perPage,
      },
    },
    manualPagination: true,
    pageCount: Math.ceil(totalRows / perPage),
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newPageIndex = updater({
          pageIndex: currentPage - 1,
          pageSize: perPage,
        }).pageIndex;
        handlePageChange(newPageIndex + 1);
      }
    },
  });

  const paginationDisplay = (
    <div className="d-flex justify-content-between align-items-center mt-4">
      <div>
        <span className="text-muted">
          Showing {(currentPage - 1) * perPage + 1} to{" "}
          {Math.min(currentPage * perPage, totalRows)} of {totalRows} entries
        </span>
      </div>
      <div>
        <Button
          variant="outline-primary"
          className="me-2"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <Button
          variant="outline-primary"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= Math.ceil(totalRows / perPage)}
        >
          Next
        </Button>
      </div>
    </div>
  );

  const fetchJobStats = async () => {
    try {
      const jobsRef = collection(db, "jobs");
      const jobsSnapshot = await getDocs(jobsRef);
      const jobsList = jobsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const totalJobs = jobsList.length;
      const activeJobs = jobsList.filter(
        (job) => job.jobStatus === "InProgress"
      ).length;
      const pendingJobs = jobsList.filter(
        (job) => job.jobStatus === "Created" || job.jobStatus === "Scheduled"
      ).length;
      const completedJobs = jobsList.filter(
        (job) => job.jobStatus === "Job Complete"
      ).length;

      setStats({
        totalJobs,
        activeJobs,
        pendingJobs,
        completedJobs,
      });
    } catch (error) {
      console.error("Error fetching job stats:", error);
    }
  };

  const fetchWorkerStats = async () => {
    try {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const stats = {
        totalWorkers: usersList.length,
        activeWorkers: usersList.filter((user) => user.activeUser).length,
        inactiveWorkers: usersList.filter((user) => !user.activeUser).length,
        fieldWorkers: usersList.filter((user) => user.isFieldWorker).length,
      };

      setWorkerStats(stats);
    } catch (error) {
      console.error("Error fetching worker stats:", error);
    }
  };

  useEffect(() => {
    fetchJobStats();
    fetchWorkerStats();
  }, []);

  const handleSearch = () => {
    let filtered = jobs;

    // Apply filters
    if (filters.jobNo) {
      filtered = filtered.filter((job) =>
        job.jobNo.toLowerCase().includes(filters.jobNo.toLowerCase())
      );
    }

    if (filters.jobName) {
      filtered = filtered.filter((job) =>
        job.jobName.toLowerCase().includes(filters.jobName.toLowerCase())
      );
    }

    if (filters.customerName) {
      filtered = filtered.filter((job) =>
        job.customerName
          .toLowerCase()
          .includes(filters.customerName.toLowerCase())
      );
    }

    if (filters.jobStatus) {
      filtered = filtered.filter((job) => job.jobStatus === filters.jobStatus);
    }

    if (filters.priority) {
      filtered = filtered.filter((job) => job.priority === filters.priority);
    }

    if (filters.jobType) {
      filtered = filtered.filter((job) =>
        filters.jobType === "recurring" ? job.isRepeating : !job.isRepeating
      );
    }

    // Quick search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((job) => {
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
    setTotalRows(filtered.length);
  };

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
                  ${row.location?.locationName || "No location"}
                </div>
              </div>
  
              <div class="mb-3">
                <div class="d-flex align-items-center mb-1">
                  <i class="fas fa-users text-info me-2"></i>
                  <strong>Assigned Workers:</strong>
                </div>
                <div class="ms-4">
                  ${
                    row.assignedWorkers?.map((w) => w.workerId).join(", ") ||
                    "None"
                  }
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
      width: "600px", // Made wider to accommodate two columns
      customClass: {
        container: "job-action-modal",
        closeButton: "position-absolute top-0 end-0 mt-2 me-2",
      },
      didOpen: () => {
        document.getElementById("viewBtn").addEventListener("click", () => {
          setEditLoading(true); // Set loading state
          Swal.close();
          router.push(`/jobs/view/${row.id}`).finally(() => {
            setEditLoading(false); // Reset loading state after navigation
          });
        });

        document.getElementById("editBtn").addEventListener("click", () => {
          setEditLoading(true);
          Swal.close();
          router.push(`/jobs/edit-jobs/${row.id}`).finally(() => {
            setEditLoading(false);
          });
        });

        document
          .getElementById("removeBtn")
          .addEventListener("click", async () => {
            Swal.close();
            const deleteResult = await Swal.fire({
              title: "Are you sure?",
              text: "This action cannot be undone.",
              icon: "warning",
              showCancelButton: true,
              confirmButtonColor: "#d33",
              cancelButtonColor: "#3085d6",
              confirmButtonText: "Yes, remove it!",
            });

            if (deleteResult.isConfirmed) {
              try {
                const jobRef = doc(db, "jobs", row.id);
                await deleteDoc(jobRef);
                Swal.fire("Deleted!", "The job has been removed.", "success");
                const updatedJobs = jobs.filter((job) => job.id !== row.id);
                setJobs(updatedJobs);
                setFilteredJobs((prevFiltered) =>
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
      },
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Created":
        return "#D3D3D3"; // Light Gray
      case "Confirmed":
        return "#4169E1"; // Royal Blue
      case "Cancelled":
        return "#FF0000"; // Red
      case "InProgress":
        return "#FFA500"; // Orange
      case "Job Complete":
        return "#008000"; // Green
      case "Validate":
        return "#00FFFF"; // Cyan
      case "Scheduled":
        return "#808080"; // Gray
      default:
        return "#D3D3D3"; // Default to light gray
    }
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      jobNo: "",
      jobName: "",
      customerName: "",
      jobStatus: "",
      priority: "",
      jobType: "",
    });
    setFilteredJobs(jobs); // Reset to show all jobs
  };

  const statCards = [
    {
      title: "Total Jobs",
      value: stats.totalJobs,
      icon: <Users className="text-primary" />,
      badge: { text: "Total", variant: "primary" },
      background: "#e7f1ff",
    },
    {
      title: "Active Jobs",
      value: stats.activeJobs,
      icon: <Activity className="text-success" />,
      badge: { text: "In Progress", variant: "success" },
      background: "#e6f8f0",
    },
    {
      title: "Pending Jobs",
      value: stats.pendingJobs,
      icon: <Clock className="text-warning" />,
      badge: { text: "Pending", variant: "warning" },
      background: "#fff8ec",
    },
    {
      title: "Completed Jobs",
      value: stats.completedJobs,
      icon: <CheckCircle className="text-info" />,
      badge: { text: "Done", variant: "info" },
      background: "#e7f6f8",
    },
  ];

  useEffect(() => {
    const fetchFollowUpSettings = async () => {
      try {
        const settingsRef = doc(db, 'settings', 'followUp');
        const settingsDoc = await getDoc(settingsRef);
        if (settingsDoc.exists()) {
          setFollowUpSettings(settingsDoc.data().types || {});
        }
      } catch (error) {
        console.error('Error fetching follow-up settings:', error);
      }
    };

    fetchFollowUpSettings();
  }, []);

  // Helper function to convert priority numbers to labels
  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1: return 'Low';
      case 2: return 'Normal';
      case 3: return 'High';
      case 4: return 'Urgent';
      default: return 'Normal';
    }
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
                    Jobs List
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
                    Create, manage and track all your jobs and assignments in
                    one centralized dashboard
                  </p>
                  <div
                    className="d-flex align-items-center gap-2"
                    style={{
                      fontSize: "14px",
                      color: "rgba(255, 255, 255, 0.9)",
                      background: "rgba(255, 255, 255, 0.1)",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      marginTop: "8px",
                    }}
                  >
                    <i className="fe fe-info" style={{ fontSize: "16px" }}></i>
                    <span>
                      Manage job assignments, schedules, and track progress
                      updates
                    </span>
                  </div>
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
                    Job Management
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
                    <i className="fe fe-calendar me-1"></i>
                    Scheduling
                  </span>
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
                      className="fe fe-briefcase"
                      style={{ color: "#FFFFFF" }}
                    ></i>
                    <span className="ms-2" style={{ color: "#FFFFFF" }}>
                      Jobs
                    </span>
                  </div>
                </nav>
              </div>

              <div>
                <OverlayTrigger
                  placement="left"
                  overlay={<Tooltip>Create a new job assignment</Tooltip>}
                >
                  <Link href="/jobs/create" passHref>
                    <Button
                      variant="light"
                      className="create-job-button"
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
                      <FaPlus className="plus-icon" size={16} />
                      <span>Add New Job</span>
                    </Button>
                  </Link>
                </OverlayTrigger>
              </div>
            </div>
          </div>
        </Col>
      </Row>
      <Row className="g-4 mb-4">
        {statCards.map((card, index) => (
          <Col key={index} lg={3} sm={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1">{card.title}</h6>
                    <h3 className="mb-0">{card.value}</h3>
                    <Badge bg={card.badge.variant} className="mt-2">
                      {card.badge.text}
                    </Badge>
                  </div>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: card.background,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {card.icon}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      <Row>
        <Col md={12} xs={12} className="mb-5">
        <FilterPanel
                filters={filters}
                setFilters={setFilters}
                onClear={handleClearFilters}
                loading={loading}
                handleSearch={handleSearch}
              />

          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              {error && <div className="alert alert-danger mb-4">{error}</div>}
              
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            style={{
                              width: header.getSize(),
                              cursor: header.column.getCanSort()
                                ? "pointer"
                                : "default",
                            }}
                            onClick={header.column.getToggleSortingHandler()}
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
                    {loading ? (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className="text-center py-5"
                        >
                          <Spinner
                            animation="border"
                            variant="primary"
                            className="me-2"
                          />
                          <span className="text-muted">Loading jobs...</span>
                        </td>
                      </tr>
                    ) : table.getRowModel().rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className="text-center py-5"
                        >
                          <div className="text-muted mb-2">No jobs found</div>
                          <small>Try adjusting your search terms</small>
                        </td>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <tr key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {paginationDisplay}
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
      <style jsx global>{`
        /* Button Base Styles */
        .btn-icon-text {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
          font-size: 0.875rem;
          padding: 0.5rem 0.875rem;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .btn-icon-text .icon-left {
          transition: transform 0.2s ease;
        }

        /* Soft Variant Styles */
        .btn-soft-danger {
          background-color: #fee2e2;
          color: #dc2626;
          border: 1px solid transparent;
        }

        .btn-soft-danger:hover {
          background-color: #dc2626;
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(220, 38, 38, 0.15);
        }

        .btn-soft-danger:hover .icon-left {
          transform: rotate(90deg);
        }

        /* Primary Button Style */
        .btn-primary.btn-icon-text {
          background-color: #3b82f6;
          color: white;
          border: none;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
          font-size: 0.875rem;
          padding: 0.5rem 0.875rem;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .btn-primary.btn-icon-text:hover {
          background-color: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2);
          color: white;
          text-decoration: none;
        }

        .btn-primary.btn-icon-text:hover .icon-left {
          transform: translateX(-2px);
        }

        .btn-primary.btn-icon-text .icon-left {
          transition: transform 0.2s ease;
        }

        /* Small button variant */
        .btn-sm.btn-icon-text {
          padding: 0.4rem 0.75rem;
          font-size: 0.812rem;
        }

        .btn-sm.btn-icon-text .icon-left {
          width: 14px;
          height: 14px;
        }

        /* View Details Button Style */
        .btn-soft-primary {
          background-color: #eff6ff;
          color: #3b82f6;
          border: 1px solid transparent;
        }

        .btn-soft-primary:hover {
          background-color: #3b82f6;
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15);
        }

        .btn-soft-primary:hover .icon-left {
          transform: translateX(-2px);
        }

        /* Disabled State */
        .btn-icon-text:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }

        /* Loading State */
        .btn-icon-text .spinner-border {
          width: 14px;
          height: 14px;
          border-width: 2px;
        }

        /* Ripple effect */
        .btn-icon-text {
          position: relative;
          overflow: hidden;
        }

        .btn-icon-text::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 120%;
          height: 120%;
          background: rgba(255, 255, 255, 0.2);
          transform: translate(-50%, -50%) scale(0);
          border-radius: 50%;
          transition: transform 0.5s ease;
        }

        .btn-icon-text:active::after {
          transform: translate(-50%, -50%) scale(1);
          opacity: 0;
        }

        /* Worker Avatar Styles */
        .worker-avatars {
          display: flex;
          align-items: center;
        }

        .worker-avatar {
          transition: all 0.2s ease;
        }

        .worker-avatar:hover {
          transform: translateY(-2px);
          z-index: 10 !important;
        }

        .worker-avatar img,
        .worker-avatar > div {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .worker-avatar:hover img,
        .worker-avatar:hover > div {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .remaining-count {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .remaining-count:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        /* Customer Link Styles */
        .customer-link {
          padding: 4px 8px;
          border-radius: 6px;
        }

        .customer-link:hover {
          background-color: #f1f5f9;
          color: #2563eb !important;
          transform: translateX(2px);
        }

        .customer-link:active {
          transform: translateX(0px);
        }

        .follow-up-badge {
          transition: all 0.2s ease;
        }

        .follow-up-badge:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .follow-up-badge.no-followup {
          background-color: #f3f4f6;
          color: #6b7280;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.75rem;
          display: inline-flex;
          alignItems: "center",
          gap: "4px"
        }

        /* Create Button Style */
        .create-job-button {
          background-color: #ffffff;
          color: #4171F5;
          transition: all 0.2s ease;
        }

        .create-job-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }

        .create-job-button:active {
          transform: translateY(0);
        }

        /* Card Animations */
        .card {
          transition: all 0.2s ease;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        /* Table Row Hover Effects */
        .table-row-hover:hover {
          background-color: #f1f5f9;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        /* View Button Hover Effects */
        .btn-icon-text:hover {
          background-color: #2563eb !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2) !important;
          color: white !important;
          text-decoration: none;
        }

        .btn-icon-text:hover .icon-left {
          transform: translateX(-2px);
        }

        /* Tooltip Styles */
        .tooltip-inner {
          max-width: 300px;
          padding: 8px 12px;
          background-color: #1e293b;
          border-radius: 6px;
          font-size: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .tooltip.show {
          opacity: 1;
        }
      `}</style>
    </Fragment>
  );
};

export default ViewJobs;
