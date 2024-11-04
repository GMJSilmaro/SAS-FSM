import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useRouter } from 'next/router';
import { GeeksSEO } from 'widgets';

// Define the mapping between activity type and icons
const activityIconMap = {
  "Job Created": "briefcase",
  "Worker Created": "user-plus",
  "Job Updated": "briefcase",
  "Worker Updated": "user-check",
  "User Activity": "activity",
};

const DataTableBootstrap = () => {
  const [recentActivities, setRecentActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [activityType, setActivityType] = useState(''); // Filter value
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);  // Number of activities per page
  const router = useRouter();

  useEffect(() => {
    const fetchAllActivities = async () => {
      try {
        const activitiesQuery = query(collection(db, 'recentActivities'), orderBy('time', 'desc'));
        const snapshot = await getDocs(activitiesQuery);
        const activitiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          time: new Date(doc.data().time.seconds * 1000).toLocaleString(), // Convert Firestore timestamp to readable date
        }));
        setRecentActivities(activitiesData);
        setFilteredActivities(activitiesData);  // Initially, no filtering applied
      } catch (error) {
        console.error('Error fetching recent activities:', error);
      }
    };

    fetchAllActivities();
  }, []);

  // Handle filtering by activity type
  const handleFilterChange = (e) => {
    const filterValue = e.target.value;
    setActivityType(filterValue);
    setCurrentPage(1);  // Reset to the first page when applying a new filter

    // Apply filter if a type is selected, otherwise show all
    if (filterValue) {
      const filtered = recentActivities.filter(activity => activity.activity === filterValue);
      setFilteredActivities(filtered);
    } else {
      setFilteredActivities(recentActivities);
    }
  };

  // Handle pagination
  const handlePageChange = (direction) => {
    if (direction === 'next' && currentPage * pageSize < filteredActivities.length) {
      setCurrentPage(currentPage + 1);
    } else if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Calculate current page activities
  const indexOfLastActivity = currentPage * pageSize;
  const indexOfFirstActivity = indexOfLastActivity - pageSize;
  const currentActivities = filteredActivities.slice(indexOfFirstActivity, indexOfLastActivity);

  return (
    <Card>

       <GeeksSEO title="Recent Activities | SAS&ME - SAP B1 | Portal" />
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h4 className="mb-0">All Activities</h4>
        <Button variant="link" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </Card.Header>

      <Card.Body>
        {/* Filtering by activity type */}
        <Form.Group controlId="activityFilter">
          <Form.Label>Filter by Activity Type</Form.Label>
          <Form.Control as="select" value={activityType} onChange={handleFilterChange}>
            <option value="">All Activities</option>
            <option value="Job Created">Job Created</option>
            <option value="Worker Created">Worker Created</option>
            <option value="Job Updated">Job Updated</option>
            <option value="Worker Updated">Worker Updated</option>
            <option value="User Activity">User Activity</option>
          </Form.Control>
        </Form.Group>

        {/* Table */}
        <Table striped bordered hover className="mt-4">
          <thead>
            <tr>
              <th>#</th> {/* Index column */}
              <th>Activity</th>
              <th>Details</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {currentActivities.length > 0 ? currentActivities.map((item, index) => {
              const icon = activityIconMap[item.activity] || 'activity';
              return (
                <tr key={item.id}>
                  <td>{indexOfFirstActivity + index + 1}</td> {/* Show index */}
                  <td>
                    {/* Icon and Activity together */}
                    <div className="d-flex align-items-center">
                      <div className="icon-shape icon-md bg-light-secondary text-primary rounded-circle me-2">
                        <i className={`fe fe-${icon}`}></i>
                      </div>
                      <span>{item.activity}</span>
                    </div>
                  </td>
                  <td>{item.activitybrief}</td>
                  <td>{item.time}</td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="4" className="text-center">No activities found.</td>
              </tr>
            )}
          </tbody>
        </Table>

        {/* Pagination Controls */}
        <div className="d-flex justify-content-between align-items-center mt-3">
          <Button variant="secondary" onClick={() => handlePageChange('prev')} disabled={currentPage === 1}>
            Previous
          </Button>
          <span>Page {currentPage}</span>
          <Button variant="secondary" onClick={() => handlePageChange('next')} disabled={indexOfLastActivity >= filteredActivities.length}>
            Next
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default DataTableBootstrap;
