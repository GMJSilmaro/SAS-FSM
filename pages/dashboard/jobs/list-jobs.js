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
  BsPeople 
} from "react-icons/bs";

const ViewJobs = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleRowClick = (row) => {
    Swal.fire({
      title: "Choose an action",
      text: "Do you want to view, edit, or remove this job?",
      icon: "question",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "View",
      denyButtonText: "Edit",
      cancelButtonText: "Remove",
      backdrop: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        router.push(`/dashboard/jobs/${row.id}`);
      } else if (result.isDenied) {
        router.push(`./update-jobs/${row.id}`);
      } else if (result.isDismissed) {
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
            setJobs(jobs.filter((job) => job.id !== row.id));
            setFilteredJobs(filteredJobs.filter((job) => job.id !== row.id));
          } catch (error) {
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

  const columns = [
    {
      name: "",
      cell: (row) => "",
      width: "5px",
    },
    {
      name: "Job No.",
      cell: (row) => (
        <div className="d-flex align-items-center">
          <BsHash className="me-2" />
          {row.jobNo}
        </div>
      ),
      sortable: true,
      width: "110px",
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
      width: "200px",
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
      width: "200px",
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
      width: "200px",
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
      width: "150px",
    },
    {
      name: "Priority",
      cell: (row) => (
        <div className="d-flex align-items-center">
          <BsExclamationTriangle className="me-2" />
          {getPriorityBadge(row.priority)}
        </div>
      ),
      sortable: true,
      width: "110px",
    },
    {
      name: "Assigned",
      cell: (row) => (
        <div className="d-flex align-items-center">
          <BsPeople className="me-2" />
          <AssignedWorkerCell workerFullName={row.workerFullName} />
        </div>
      ),
      sortable: true,
      width: "200px",
    },
  ];

  useEffect(() => {
    const fetchJobs = async () => {
      const jobsSnapshot = await getDocs(collection(db, "jobs"));
      const usersSnapshot = await getDocs(collection(db, "users"));

      const jobsData = jobsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const sortedJobsData = jobsData.sort((a, b) => b.timestamp - a.timestamp);

      const mergedData = sortedJobsData.map((job) => {
        console.log("Job:", job);
        const workerNames = job.assignedWorkers
          .map((workerObj) => {
            const workerId = workerObj.workerId;
            const worker = usersData.find((user) => user.workerId === workerId);
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
      setLoading(false);
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredJobs(jobs);
      return;
    }

    const searchLower = search.toLowerCase().trim();

    const result = jobs.filter((job) => {
      const isMatch = (value) => {
        if (value == null) return false;

        if (typeof value === "string") {
          return value.toLowerCase().includes(searchLower);
        }

        if (typeof value === "number") {
          return value.toString().includes(searchLower);
        }

        if (value instanceof Date) {
          return value.toLocaleDateString().toLowerCase().includes(searchLower);
        }

        if (typeof value === "object") {
          return Object.values(value).some(isMatch);
        }

        return false;
      };

      return Object.values(job).some(isMatch);
    });

    setFilteredJobs(result);
  }, [search, jobs]);

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
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Fragment>
  );
};

export default ViewJobs;