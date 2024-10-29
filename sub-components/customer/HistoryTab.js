import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Table,
  Badge,
  Spinner,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { History } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

export const HistoryTab = ({ customerID }) => {
  const [jobHistory, setJobHistory] = useState([]);
  const [users, setUsers] = useState({}); // State to hold user data
  const [loading, setLoading] = useState(true);

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

  return (
    <Row className="p-4">
      <Col>
        <div className="d-flex align-items-center mb-4">
          <History size={24} className="me-2" />
          <h3 className="mb-0">Job History</h3>
        </div>
        {loading ? (
          <Spinner animation="border" />
        ) : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Date</th>
                <th>Type</th>
                <th>Location</th>
                <th>Description</th>
                <th>Technician</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobHistory.length > 0 ? (
                jobHistory.map((job) => {
                  return (
                    <tr key={job.id}>
                      <td>
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Tooltip>View details for job #{job.id}</Tooltip>
                          }
                        >
                          <span
                            className="badge bg-light text-primary cursor-pointer"
                            onClick={(e) => e.stopPropagation()} // Prevents row click event
                          >
                            {getIdBadge(job.id)}
                          </span>
                        </OverlayTrigger>
                      </td>
                      <td>{new Date(job.startDate).toLocaleDateString()}</td>
                      <td>{job.jobContactType.name}</td>
                      <td>
                        {job.location ? job.location.locationName : "N/A"}
                      </td>
                      <td>{job.jobDescription}</td>
                      <td>
                        {job.assignedWorkers && job.assignedWorkers.length > 0
                          ? job.assignedWorkers.map((worker) => (
                              <div key={worker.workerId}>
                                {users[worker.workerId] || "Unknown Worker"}
                              </div>
                            ))
                          : "No workers assigned"}
                      </td>
                      <td>{job.estimatedDurationHours}</td>
                      <td>{getStatusBadge(job.jobStatus)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center">
                    No job history found for this customer.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </Col>
    </Row>
  );
};

export default HistoryTab;
