import React, { useState, useEffect, useMemo, Fragment } from "react";
import {
  Row,
  Col,
  Card,
  Badge,
  Dropdown,
  Button,
  Breadcrumb,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { MoreVertical, Trash, Edit } from "react-feather";
import { FaUser } from "react-icons/fa";
import { useRouter } from "next/router";
import { db } from "../../../firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import styles from "./ViewJobs.module.css";
import { GeeksSEO } from "widgets";
import JobStats from "sub-components/dashboard/projects/single/task/JobStats";
import DOMPurify from "dompurify";
import { 
  BsHash, 
  BsBriefcase, 
  BsPerson, 
  BsGeoAlt, 
  BsClipboardCheck, 
  BsExclamationTriangle, 
  BsPeople, 
  BsCalendar, 
  BsClock 
} from "react-icons/bs";

const ViewJobs = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);

   // Add new state for pagination
   const [currentPage, setCurrentPage] = useState(1);
   const [jobsPerPage] = useState(10);
   const [usersData, setUsersData] = useState([]);
   const [lastFetchTime, setLastFetchTime] = useState(null);
   const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Custom Styles for DataTable
  const customStyles = {
    headCells: {
      style: {
        fontWeight: "bold",
        fontSize: "14px",
        backgroundColor: "#F1F5FC",
      },
    },
    cells: {
      style: {
        color: "#64748b",
        fontSize: "14px",
        textAlign: "left",
      },
    },
    rows: {
      style: {
        minHeight: "72px",
        cursor: "pointer",
      },
      highlightOnHoverStyle: {
        backgroundColor: "#f1f5fc",
      },
    },
  };

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
    const getStyle = (backgroundColor) => ({
      backgroundColor,
      color: "#fff",
      padding: "0.5em 0.75em",
      borderRadius: "0.25rem",
      fontWeight: "normal",
    });

    switch (status) {
      case "Created":
        return <Badge style={getStyle("#9e9e9e")}>Created</Badge>;
      case "Confirmed":
        return <Badge style={getStyle("#2196f3")}>Confirmed</Badge>;
      case "Cancelled":
        return <Badge style={getStyle("#f44336")}>Cancelled</Badge>;
      case "Job Started":
        return <Badge style={getStyle("#FFA500")}>Job Started</Badge>;
      case "Job Complete":
        return <Badge style={getStyle("#32CD32")}>Job Complete</Badge>;
      case "Validate":
        return <Badge style={getStyle("#00bcd4")}>Validate</Badge>;
      case "Scheduled":
        return <Badge style={getStyle("#607d8b")}>Scheduled</Badge>;
      default:
        return <Badge style={getStyle("#9e9e9e")}>{status}</Badge>;
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

  const ActionMenu = ({ jobId }) => {
    const handleEditClick = () => router.push(`./update-jobs/${jobId}`);
    const handleRemove = async (jobId) => {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, remove it!",
      });

      if (result.isConfirmed) {
        try {
          const jobRef = doc(db, "jobs", jobId);
          await deleteDoc(jobRef);
          Swal.fire("Deleted!", "The job has been removed.", "success");
          setJobs(jobs.filter((job) => job.id !== jobId));
          setFilteredJobs(filteredJobs.filter((job) => job.id !== jobId));
        } catch (error) {
          Swal.fire("Error!", "There was a problem removing the job.", "error");
        }
      }
    };

    return (
      <Dropdown>
        <Dropdown.Toggle as={CustomToggle}>
          <MoreVertical size="15px" className="text-secondary" />
        </Dropdown.Toggle>
        <Dropdown.Menu align="end">
          <Dropdown.Header>SETTINGS</Dropdown.Header>
          <Dropdown.Item onClick={handleEditClick}>
            <Edit size="15px" className="dropdown-item-icon" /> Edit
          </Dropdown.Item>
          <Dropdown.Item onClick={() => handleRemove(jobId)}>
            <Trash size="15px" className="dropdown-item-icon" /> Remove
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    );
  };

  const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
    <Button
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
      className="btn-icon btn btn-ghost btn-sm rounded-circle"
    >
      {children}
    </Button>
  ));
  CustomToggle.displayName = "CustomToggle";

  const HTMLCell = ({ html, maxLength = 100 }) => {
    const sanitizedHTML = DOMPurify.sanitize(html);
    const textContent = sanitizedHTML.replace(/<[^>]+>/g, "");
    const truncatedText =
      textContent.length > maxLength
        ? `${textContent.substring(0, maxLength)}...`
        : textContent;

    return (
      <div title={textContent} style={{ cursor: "pointer" }}>
        <div dangerouslySetInnerHTML={{ __html: truncatedText }} />
      </div>
    );
  };

  const TooltipCell = ({ text, maxLength = 50 }) => {
    const truncatedText =
      text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;

    return (
      <div title={text} style={{ cursor: "pointer" }}>
        {truncatedText}
      </div>
    );
  };

  const AssignedWorkerCell = ({ workerFullName }) => {
    const workers = workerFullName.split(", ");
    const displayName = workers[0];
    const remainingCount = workers.length - 1;

    return (
      <OverlayTrigger
        placement="top"
        overlay={
          <Tooltip id={`tooltip-${displayName}`}>{workerFullName}</Tooltip>
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

   // Add memoized users data
   const memoizedUsersData = useMemo(() => {
    return usersData;
  }, [usersData]);

  const handleRowClick = (row) => {
    Swal.fire({
      title: '<strong>Job Details</strong>',
      html: `
        <div style="text-align: left; padding: 20px; background-color: #f8f9fa; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #3498db;">#${row.jobNo}</h3>
            <span style="font-size: 1.2em; font-weight: bold; color: ${row.priority === 'High' ? '#e74c3c' : row.priority === 'Mid' ? '#f39c12' : '#2ecc71'};">${row.priority} Priority</span>
          </div>
          <h4 style="margin-top: 0; margin-bottom: 15px; color: #34495e;">${row.jobName}</h4>
          <p style="margin-bottom: 10px;"><strong>Customer:</strong> ${row.customerName}</p>
          <p style="margin-bottom: 10px;"><strong>Location:</strong> ${row.locationName}</p>
          <p style="margin-bottom: 10px;"><strong>Status:</strong> <span style="padding: 3px 8px; border-radius: 12px; background-color: ${getStatusColor(row.jobStatus)}; color: white;">${row.jobStatus}</span></p>
          <p style="margin-bottom: 10px;"><strong>Assigned Workers:</strong> ${row.workerFullName}</p>
          <div style="display: flex; justify-content: space-between; margin-top: 15px;">
            <div>
              <p style="margin-bottom: 5px;"><strong>Start:</strong></p>
              <p style="margin: 0;">${formatDate(row.startDate)}</p>
              <p style="margin: 0;">${formatTime(row.startTime)}</p>
            </div>
            <div>
              <p style="margin-bottom: 5px;"><strong>End:</strong></p>
              <p style="margin: 0;">${formatDate(row.endDate)}</p>
              <p style="margin: 0;">${formatTime(row.endTime)}</p>
            </div>
          </div>
        </div>
      `,
      showCloseButton: true,
      showCancelButton: true,
      showDenyButton: true,
      focusConfirm: false,
      confirmButtonText: '<i class="fa fa-eye"></i> View',
      confirmButtonAriaLabel: 'View',
      confirmButtonColor: '#3085d6',
      denyButtonText: '<i class="fa fa-edit"></i> Edit',
      denyButtonAriaLabel: 'Edit',
      denyButtonColor: '#ffc107',
      cancelButtonText: '<i class="fa fa-trash"></i> Remove',
      cancelButtonAriaLabel: 'Remove',
      cancelButtonColor: '#d33'
    }).then(async (result) => {
      if (result.isConfirmed) {
        router.push(`/dashboard/jobs/${row.id}`);
      } else if (result.isDenied) {
        router.push(`./update-jobs/${row.id}`);
      } else if (result.dismiss === Swal.DismissReason.cancel) {
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
      }
    });
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Created": return "#9e9e9e";
      case "Confirmed": return "#2196f3";
      case "Cancelled": return "#f44336";
      case "Job Started": return "#FFA500";
      case "Job Complete": return "#32CD32";
      case "Validate": return "#00bcd4";
      case "Scheduled": return "#607d8b";
      default: return "#9e9e9e";
    }
  };

  const columns = [
    {
      name: "",
      cell: (row) => "",
      width: "40px", // Keep this minimal width for the empty column
    },
    {
      name: "Job No.",
      cell: (row) => (
        <OverlayTrigger
          overlay={<Tooltip id={`tooltip-${row.id}`}>View Details</Tooltip>}
        >
          <div className="d-flex align-items-center" onClick={() => handleRowClick(row)}>
            <BsHash className="me-2" />
            {row.jobNo}
          </div>
        </OverlayTrigger>
      ),
      sortable: true,
    },
    {
      name: "Job Name",
      cell: (row) => (
        <div className="d-flex align-items-center">
          <BsBriefcase className="me-2" />
          <TooltipCell text={row.jobName} />
        </div>
      ),
      sortable: true,
    },
    {
      name: "Customer Name",
      cell: (row) => (
        <div className="d-flex align-items-center">
          <BsPerson className="me-2" />
          <TooltipCell text={row.customerName} />
        </div>
      ),
      sortable: true,
    },
    {
      name: "Location Name",
      cell: (row) => (
        <div className="d-flex align-items-center">
          <BsGeoAlt className="me-2" />
          <TooltipCell text={row.locationName} />
        </div>
      ),
      sortable: true,
    },
    {
      name: "Job Status",
      cell: (row) => (
        <div className="d-flex align-items-center">
          <BsClipboardCheck className="me-2" />
          {getStatusBadge(row.jobStatus)}
        </div>
      ),
      sortable: false,
    },
    {
      name: "Priority",
      cell: (row) => (
        <div className="d-flex align-items-center">
          {getPriorityBadge(row.priority)}
        </div>
      ),
      width: "105px",
      sortable: true,
    },
    {
      name: "Assigned",
      cell: (row) => (
        <div className="d-flex align-items-center">
          <AssignedWorkerCell workerFullName={row.workerFullName} />
        </div>
      ),
      sortable: true,
    },
    {
      name: "Start Date",
      cell: (row) => (
        <div className="d-flex align-items-center">
          <BsCalendar className="me-2" />
          {formatDate(row.startDate)}
        </div>
      ),
      sortable: true,
    },
    {
      name: "Time",
      cell: (row) => (
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip id={`tooltip-time-${row.id}`}>
              Start: {formatDate(row.startDate)} {formatTime(row.startTime)}
              <br />
              End: {formatDate(row.endDate)} {formatTime(row.endTime)}
            </Tooltip>
          }
        >
          <div className="d-flex align-items-center">
            <BsClock className="me-2" />
            {formatTime(row.startTime)} - {formatTime(row.endTime)}
          </div>
        </OverlayTrigger>
      ),
      sortable: true,
    },
  ];

// Optimized fetch function with caching
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

// Optimized search with debouncing
useEffect(() => {
  const debounceTimeout = setTimeout(() => {
    if (!search.trim()) {
      setFilteredJobs(jobs);
      return;
    }

    const searchLower = search.toLowerCase().trim();
    const searchableFields = ['jobNo', 'jobName', 'customerName', 'locationName', 
                            'jobStatus', 'priority', 'workerFullName'];

    const result = jobs.filter((job) => {
      return searchableFields.some(field => {
        const value = job[field];
        if (!value) return false;
        return value.toString().toLowerCase().includes(searchLower);
      });
    });

    setFilteredJobs(result);
  }, 300); // 300ms debounce delay

  return () => clearTimeout(debounceTimeout);
}, [search, jobs]);

// Initial data fetch
useEffect(() => {
  fetchData();
}, []);

  const subHeaderComponentMemo = useMemo(
    () => (
      <Fragment>
        <input
          type="text"
          className="form-control me-4 mb-4"
          placeholder="Search Jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Fragment>
    ),
    [search]
  );

  return (
    <Fragment>
      <GeeksSEO title="Job Lists | SAS - SAP B1 Portal" />

      <Row>
        <Col lg={12}>
          <div className="border-bottom pb-4 mb-4 d-flex align-items-center justify-content-between">
            <div className="mb-3">
              <h1 className="mb-1 h2 fw-bold">Job Lists</h1>
              <Breadcrumb>
                <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item href="/dashboard/jobs/list-job">Jobs</Breadcrumb.Item>
                <Breadcrumb.Item active>View Jobs</Breadcrumb.Item>
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
        <Col md={12}>
          <Card>
            <Card.Body className="px-0">
            <DataTable
        customStyles={customStyles}
        columns={columns}
        data={filteredJobs}
        pagination
        highlightOnHover
        subHeader
        subHeaderComponent={subHeaderComponentMemo}
        paginationRowsPerPageOptions={[5, 10, 15, 20, 25, 50]}
        onRowClicked={handleRowClick}
        progressPending={loading}
      />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Fragment>
  );
};

export default ViewJobs;
