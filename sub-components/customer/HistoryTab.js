import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Table,
  Badge,
  Spinner,
  OverlayTrigger,
  Tooltip,
  Form,
  InputGroup,
  Pagination,
  Container,
  Button,
} from "react-bootstrap";
import { History } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { Search, XCircle } from 'react-bootstrap-icons';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';

export const HistoryTab = ({ customerID }) => {
  const [jobHistory, setJobHistory] = useState([]);
  const [users, setUsers] = useState({}); // State to hold user data
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage] = useState(10);
  const router = useRouter();
  const [loadingJobId, setLoadingJobId] = useState(null);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');

  // Function to fetch users from Firestore
  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, "users");
      const querySnapshot = await getDocs(usersRef);

      // Map user data to workerId for quick access
      const usersData = querySnapshot.docs.reduce((acc, doc) => {
        const user = doc.data();
        acc[user.workerId] = user.fullName; // Use fullName for display
        return acc;
      }, {});

      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    const fetchJobHistory = async () => {
      try {
        const jobsRef = collection(db, "jobHistory");
        const q = query(jobsRef, where("customerID", "==", customerID));
        const querySnapshot = await getDocs(q);

        const jobsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("Fetched job history data:", jobsData);
        setJobHistory(jobsData);
      } catch (error) {
        console.error("Error fetching job history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (customerID) {
      fetchJobHistory();
      fetchUsers(); // Fetch users data when customerID is available
    }
  }, [customerID]);

  const getStatusBadge = (status) => {
    const colors = {
      Completed: "success",
      Pending: "warning",
      "In Progress": "primary",
      Cancelled: "danger",
    };
    return <Badge bg={colors[status] || "secondary"}>{status}</Badge>;
  };

  const getIdBadge = (id) => {
    return (
      <Badge style={{ backgroundColor: "#b1c8f3", color: "#fff" }}>{id}</Badge>
    );
  };

  // Add filtering logic
  const filteredJobs = jobHistory.filter((job) =>
    Object.values(job).some((value) =>
      value != null && 
      (typeof value === 'string' || typeof value === 'number') &&
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Add pagination logic
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  const handleJobClick = async (jobId) => {
    try {
      setLoadingJobId(jobId); // Set loading state for this specific job
      await router.push(`/dashboard/jobs/${jobId}`);
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Error loading job details');
    } finally {
      setLoadingJobId(null); // Reset loading state
    }
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
    }
  };

  const getSortIcon = (direction) => {
    return direction === 'asc' ? '↑' : '↓';
  };

  const headerStyle = {
    cursor: 'pointer',
    userSelect: 'none',
    backgroundColor: '#f8f9fa',
    position: 'relative',
    padding: '12px 8px',
  };

  return (
    <Container fluid className="p-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <History size={24} className="me-2" />
              <h3 className="mb-0">Job History</h3>
            </div>
            <Button 
              variant="primary"
              onClick={() => router.push(`/dashboard/jobs/create-jobs?customerCode=${customerID}`)}
              className="d-flex align-items-center"
            >
              <span className="me-1">+</span> New Job
            </Button>
          </div>
        </Col>
      </Row>

      {/* Add search bar */}
      <Row className="mb-3">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <Search />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
                <XCircle />
              </Button>
            )}
          </InputGroup>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <Table striped bordered hover className="shadow-sm">
              <thead className="bg-light">
                <tr>
                  <th onClick={() => handleSort('id')} style={headerStyle}>
                    Job ID {sortField === 'id' && getSortIcon(sortDirection)}
                  </th>
                  <th onClick={() => handleSort('startDate')} style={headerStyle}>
                    Date {sortField === 'startDate' && getSortIcon(sortDirection)}
                  </th>
                  <th onClick={() => handleSort('jobContactType')} style={headerStyle}>
                    Type {sortField === 'jobContactType' && getSortIcon(sortDirection)}
                  </th>
                  <th onClick={() => handleSort('location')} style={headerStyle}>
                    Location {sortField === 'location' && getSortIcon(sortDirection)}
                  </th>
                  <th onClick={() => handleSort('jobDescription')} style={headerStyle}>
                    Description {sortField === 'jobDescription' && getSortIcon(sortDirection)}
                  </th>
                  <th onClick={() => handleSort('assignedWorkers')} style={headerStyle}>
                    Technician {sortField === 'assignedWorkers' && getSortIcon(sortDirection)}
                  </th>
                  <th onClick={() => handleSort('estimatedDurationHours')} style={headerStyle}>
                    Duration {sortField === 'estimatedDurationHours' && getSortIcon(sortDirection)}
                  </th>
                  <th onClick={() => handleSort('jobStatus')} style={headerStyle}>
                    Status {sortField === 'jobStatus' && getSortIcon(sortDirection)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentJobs.length > 0 ? (
                  currentJobs.map((job) => (
                    <tr key={job.id} className="align-middle">
                      <td>
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Tooltip>View details for job #{job.id}</Tooltip>
                          }
                        >
                          <span
                            className="badge bg-light text-primary cursor-pointer"
                            onClick={() => handleJobClick(job.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            {loadingJobId === job.id ? (
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-1"
                              />
                            ) : (
                              getIdBadge(job.id)
                            )}
                          </span>
                        </OverlayTrigger>
                      </td>
                      <td>{new Date(job.startDate).toLocaleDateString()}</td>
                      <td>
  <span className={`inline-flex items-center rounded-md ${
    job.jobContactType.name === 'Remote' ? 'bg-green-50 text-green-700 ring-green-600/20' :
    job.jobContactType.name === 'Hybrid' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
    'bg-gray-50 text-gray-700 ring-gray-600/20'
  } px-2 py-1 text-xs font-medium ring-1 ring-inset`}>
    {job.jobContactType.name}
  </span>
</td>
                      <td>
                        {job.location ? job.location.locationName : "N/A"}
                      </td>
                      <td>
                        {job.jobDescription?.includes('<p>') ? (
                          <div dangerouslySetInnerHTML={{ __html: job.jobDescription }} />
                        ) : (
                          job.jobDescription || 'No description'
                        )}
                      </td>
                      <td>
                        {job.assignedWorkers && job.assignedWorkers.length > 0
                          ? job.assignedWorkers.map((worker) => (
                              <div key={worker.workerId}>
                                {users[worker.workerId] || "Unknown Worker"}
                              </div>
                            ))
                          : "No workers assigned"}
                      </td>
                      <td>{job.estimatedDurationHours} Hrs</td>
                      <td>{getStatusBadge(job.jobStatus)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      <i className="text-muted">No job history found for this customer.</i>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Add pagination */}
          {totalPages > 1 && (
            <Row className="mt-3">
              <Col>
                <Pagination className="justify-content-center">
                  <Pagination.First
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  />
                  <Pagination.Prev
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  />
                  {[...Array(totalPages).keys()].map((number) => (
                    <Pagination.Item
                      key={number + 1}
                      active={number + 1 === currentPage}
                      onClick={() => setCurrentPage(number + 1)}
                    >
                      {number + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  />
                  <Pagination.Last
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </Col>
            </Row>
          )}
        </>
      )}
    </Container>
  );
};

export default HistoryTab;
