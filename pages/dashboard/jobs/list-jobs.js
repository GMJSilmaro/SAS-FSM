import React, { useState, useEffect, useMemo, Fragment } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Badge,
  Dropdown,
  Tooltip,
  OverlayTrigger,
  Breadcrumb,
} from "react-bootstrap";
import { MoreVertical, Trash, Edit } from "react-feather";
import { useRouter } from "next/router";
import { FaUser } from "react-icons/fa";

// Firebase
import { db } from "../../../firebase"; // Adjust the path as necessary
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore"; // Add 'doc' and 'deleteDoc'

// DataTable component
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";

// Import CSS module
import styles from "./ViewJobs.module.css";
import { GeeksSEO } from "widgets";
import JobStats from "sub-components/dashboard/projects/single/task/JobStats";

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
        textAlign: "left",
        whiteSpace: "normal", // Allow wrapping
      },
    },
    cells: {
      style: {
        color: "#64748b",
        fontSize: "14px",
        whiteSpace: "normal", // Allow wrapping
        textAlign: "left",
      },
    },
    rows: {
      style: {
        minHeight: "72px", // Adjust row height for better spacing
        textAlign: "center", // Center align rows
      },
      highlightOnHoverStyle: {
        backgroundColor: "#f1f5fc",
        cursor: "pointer",
      },
    },
  };

  // Priority Badge Styling
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "L":
        return <Badge bg="success">Low</Badge>;
      case "M":
        return <Badge bg="warning">Mid</Badge>;
      case "H":
        return <Badge bg="danger">High</Badge>;
      default:
        return priority;
    }
  };

  // Status Badge Styling
  const getStatusBadge = (status) => {
    switch (status) {
      case "C":
        return <Badge bg="info">Created</Badge>;
      case "CO":
        return <Badge bg="primary">Confirm</Badge>;
      case "CA":
        return <Badge bg="danger">Cancel</Badge>;
      case "JS":
        return <Badge bg="warning">Job Started</Badge>;
      case "JC":
        return <Badge bg="success">Job Complete</Badge>;
      case "V":
        return <Badge bg="secondary">Validate</Badge>;
      case "S":
        return <Badge bg="info">Scheduled</Badge>;
      case "US":
        return <Badge bg="dark">Unscheduled</Badge>;
      case "RS":
        return <Badge bg="warning">Re-scheduled</Badge>;
      default:
        return status;
    }
  };

  // Format Time
  const formatTime = (time) => {
    if (!time) return ""; // Return an empty string if time is undefined or null
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12; // Convert '0' hour to '12'
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Action Menu
  const ActionMenu = ({ jobId }) => {
    const handleEditClick = () => {
      router.push(`./update-jobs/${jobId}`);
    };

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

          // Optionally refresh the jobs data
          setJobs(jobs.filter((job) => job.id !== jobId));
          setFilteredJobs(filteredJobs.filter((job) => job.id !== jobId));
        } catch (error) {
          console.error("Error removing document: ", error);
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

  const handleRowClick = (row) => {
    router.push(`/dashboard/jobs/${row.id}`);
  };

  // Custom Toggle for Dropdown
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

  // Table Columns
  const columns = [
    {
      name: "",
      cell: (row) => <ActionMenu jobId={row.id} />,
      width: "60px",
    },

    {
      name: "Job No.",
      selector: (row) => row.jobNo,
      sortable: true,
      width: "110px",
    },
    {
      name: "Assigned Worker",
      cell: (row) => (
        <span>
          <FaUser style={{ marginRight: "8px" }} />
          {row.workerFullName}
        </span>
      ),
      sortable: true,
      width: "200px",
    },
    {
      name: "Job Name",
      selector: (row) => row.jobName,
      sortable: true,
      wrap: true,
      width: "200px",
    },
    {
      name: "Job Status",
      cell: (row) => getStatusBadge(row.jobStatus),
      sortable: false,
      width: "150px",
    },
    {
      name: "Job Description",
      selector: (row) => row.description,
      sortable: false,
      wrap: true,
      width: "300px",
    },
    {
      name: "Priority",
      cell: (row) => getPriorityBadge(row.jobPriority),
      sortable: true,
      width: "110px",
    },
    {
      name: "Start Date",
      selector: (row) => row.startDate,
      sortable: true,
      width: "150px",
    },
    {
      name: "End Date",
      selector: (row) => row.endDate,
      sortable: true,
      width: "150px",
    },
    {
      name: "Start Time",
      cell: (row) => formatTime(row.startTime),
      sortable: true,
      width: "140px",
    },
    {
      name: "End Time",
      cell: (row) => formatTime(row.endTime),
      sortable: true,
      width: "120px",
    },
  ];

  // Fetch Data
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

      // Sort jobs by timestamp in descending order
      const sortedJobsData = jobsData.sort((a, b) => b.timestamp - a.timestamp);

      const mergedData = sortedJobsData.map((job) => {
        const workerNames = job.assignedWorkers
          .map((workerId) => {
            const worker = usersData.find((user) => user.workerId === workerId);
            return worker
              ? `${worker.firstName} ${worker.lastName}`
              : "Unknown Worker";
          })
          .join(", ");

        return {
          ...job,
          workerFullName: workerNames,
        };
      });

      setJobs(mergedData);
      setFilteredJobs(mergedData);
      setLoading(false);
    };

    fetchJobs();
  }, []);

  // Filter Rows Based on Search
  useEffect(() => {
    const result = jobs.filter((item) => {
      // Map short codes to full forms for jobPriority
      const priorityMapping = {
        L: "Low",
        M: "Mid",
        H: "High",
      };

      // Map short codes to full forms for jobStatus
      const statusMapping = {
        C: "Created",
        S: "Scheduled",
        P: "Pending",
        CA: "Cancel",
        V: "Validate",
        JC: "Job Complete",
        S: "Scheduled",
      };

      // Get full form of jobPriority
      const jobPriorityFull =
        priorityMapping[item.jobPriority] || item.jobPriority;
      // Get full form of jobStatus
      const jobStatusFull = statusMapping[item.jobStatus] || item.jobStatus;

      return (
        (item.workerFullName &&
          item.workerFullName.toLowerCase().includes(search.toLowerCase())) ||
        (item.jobName &&
          item.jobName.toLowerCase().includes(search.toLowerCase())) ||
        (jobStatusFull &&
          jobStatusFull.toLowerCase().includes(search.toLowerCase())) || // Search full status
        (item.jobStatus &&
          item.jobStatus.toLowerCase().includes(search.toLowerCase())) || // Search short status
        (jobPriorityFull &&
          jobPriorityFull.toLowerCase().includes(search.toLowerCase())) || // Search full priority
        (item.jobPriority &&
          item.jobPriority.toLowerCase().includes(search.toLowerCase())) || // Search short priority
        (item.description &&
          item.description.toLowerCase().includes(search.toLowerCase())) ||
        (item.startDate &&
          item.startDate.toLowerCase().includes(search.toLowerCase())) ||
        (item.endDate &&
          item.endDate.toLowerCase().includes(search.toLowerCase())) ||
        (item.startTime &&
          item.startTime.toLowerCase().includes(search.toLowerCase())) ||
        (item.endTime &&
          item.endTime.toLowerCase().includes(search.toLowerCase())) ||
        (item.jobNo && item.jobNo.toString().includes(search))
      );
    });

    setFilteredJobs(result);
  }, [search, jobs]);

  // Search Component
  const subHeaderComponentMemo = useMemo(() => {
    return (
      <Fragment>
        <input
          type="text"
          className="form-control me-4 mb-4"
          placeholder="Search Jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Fragment>
    );
  }, [search]);

  return (
    <Fragment>
      <GeeksSEO title="Job Lists | SAS - SAP B1 Portal" />

      <Row>
        <Col lg={12} md={12} sm={12}>
          <div className="border-bottom pb-4 mb-4 d-flex align-items-center justify-content-between">
            <div className="mb-3 mb-md-0">
              <h1 className="mb-1 h2 fw-bold">Job Lists</h1>
              <Breadcrumb>
                <Breadcrumb.Item href="#">Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item href="#">Jobs</Breadcrumb.Item>
                <Breadcrumb.Item active>View Jobs</Breadcrumb.Item>
              </Breadcrumb>
            </div>
          </div>
        </Col>
      </Row>
      <JobStats />
      <Row>
        <Col md={12} xs={12} className="mb-5">
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
                subHeaderAlign="left"
                className={styles.dataTableRow} // Apply CSS module class
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
