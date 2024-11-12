import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Card,
  Row,
  Col,
  Badge,
  Form,
  Button,
  Table,
  Dropdown
} from 'react-bootstrap';
import { collection, query, where, orderBy, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { format } from 'date-fns';
import { FaFilter, FaEllipsisV } from 'react-icons/fa';
import Link from 'next/link';

const FollowUpsPage = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: router.query.status || 'all',
    type: router.query.type || 'all',
    dateRange: {
      start: router.query.startDate || null,
      end: router.query.endDate || null
    },
    assignedWorker: router.query.workerId || 'all',
    followUpId: router.query.followUpId || ''
  });
  const [workers, setWorkers] = useState([]);
  const [showDebug, setShowDebug] = useState(false);
  const [followUpTypes, setFollowUpTypes] = useState([]);

  // Add a useEffect to update filters when URL changes
  useEffect(() => {
    if (router.isReady) {
      setFilters(prev => ({
        ...prev,
        status: router.query.status || 'all',
        type: router.query.type || 'all',
        followUpId: router.query.followUpId || '',
        assignedWorker: router.query.workerId || 'all'
      }));
    }
  }, [router.isReady, router.query]);

  // Fetch workers for filter dropdown
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const workersRef = collection(db, "users");
        const workersSnapshot = await getDocs(workersRef);
        const workersData = workersSnapshot.docs.map(doc => ({
          workerId: doc.id,
          ...doc.data()
        }));
        setWorkers(workersData);
      } catch (error) {
        console.error("Error fetching workers:", error);
      }
    };
    fetchWorkers();
  }, []);

  // Add this helper function at the top of your component
  const getTechnicianName = (assignedWorkers, technicianId) => {
    if (!assignedWorkers || !technicianId) return '-';
    const technician = assignedWorkers.find(w => w.workerId === technicianId);
    return technician ? technician.workerName : '-';
  };

  // Update the getCSOName function
  const getCSOName = (workers, createdBy) => {
    if (!workers || !createdBy) return '-';

    const cso = workers.find(w => w.workerId === (typeof createdBy === 'string' ? createdBy : createdBy.workerId));
    return cso ? (cso.fullName || cso.workerName) : '-';
  };

  // Fetch jobs with follow-ups
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        console.log('Fetching jobs with filters:', filters);
        const jobsRef = collection(db, "jobs");
        let q = query(
          jobsRef,
          where("followUpCount", ">", 0)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          console.log('Received snapshot with', snapshot.size, 'jobs');
          const jobsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Process and flatten follow-ups from jobs
          const processedJobs = jobsData.reduce((acc, job) => {
            if (job.followUps) {
              Object.entries(job.followUps).forEach(([followUpId, followUp]) => {
                // If there's a followUpId in the URL/filters, only process that specific one
                if (filters.followUpId && followUpId !== filters.followUpId) {
                  return; // Skip if not matching the specific followUpId
                }

                const technicianName = followUp.assignedWorkers?.length > 0 
                  ? followUp.assignedWorkers[0].workerName 
                  : '-';

                const csoName = getCSOName(workers, followUp.createdBy);
                console.log('CSO Data:', { 
                  createdBy: followUp.createdBy, 
                  workers: workers,
                  resultingName: csoName 
                });

                // Only apply other filters if no specific followUpId is provided
                if (!filters.followUpId) {
                  const statusMatch = filters.status === 'all' || followUp.status === filters.status;
                  const typeMatch = filters.type === 'all' || followUp.type === filters.type;
                  const workerMatch = filters.assignedWorker === 'all' || 
                    followUp.assignedWorkers?.some(w => w.workerId === filters.assignedWorker);
                  
                  let dateMatch = true;
                  if (filters.dateRange.start && filters.dateRange.end) {
                    const followUpDate = new Date(followUp.createdAt);
                    const startDate = new Date(filters.dateRange.start);
                    const endDate = new Date(filters.dateRange.end);
                    dateMatch = followUpDate >= startDate && followUpDate <= endDate;
                  }

                  if (!statusMatch || !typeMatch || !workerMatch || !dateMatch) {
                    return; // Skip if doesn't match filters
                  }
                }

                acc.push({
                  id: followUpId,
                  ...followUp,
                  jobID: job.jobID || job.jobNo,
                  jobName: job.jobName,
                  customerName: job.customerName,
                  customerID: job.customerID,
                  priority: followUp.priority || 4,
                  assignedWorkers: followUp.assignedWorkers || [],
                  technicianName: technicianName,
                  csoName: csoName,
                  createdAt: followUp.createdAt,
                  updatedAt: followUp.updatedAt
                });
              });
            }
            return acc;
          }, []);

          console.log('Final processed jobs:', processedJobs);
          setJobs(processedJobs);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching jobs:", error);
        setLoading(false);
      }
    };

    fetchJobs();
  }, [filters, workers]);

  const getStatusBadge = (status) => {
    const statusColors = {
      'Logged': 'warning',
      'In Progress': 'info',
      'Closed': 'success',
      'Cancelled': 'danger'
    };
    return (
      <Badge 
        bg={statusColors[status] || 'secondary'}
        style={{ 
          fontSize: '0.85rem',
          padding: '0.35em 0.65em',
          fontWeight: '500'
        }}
      >
        {status}
      </Badge>
    );
  };

  // Add function to fetch follow-up types
  const fetchFollowUpTypes = async () => {
    try {
      const settingsRef = doc(db, 'settings', 'followUp');
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists() && settingsDoc.data().types) {
        const types = settingsDoc.data().types;
        setFollowUpTypes(Object.entries(types).map(([id, type]) => ({
          id,
          ...type
        })));
      }
    } catch (error) {
      console.error('Error fetching follow-up types:', error);
    }
  };

  // Add useEffect to fetch types
  useEffect(() => {
    fetchFollowUpTypes();
  }, []);

  // Add this helper function
  const getTypeWithColor = (typeName) => {
    const type = followUpTypes.find(t => t.name === typeName);
    return type ? (
      <div className="d-flex align-items-center gap-2">
        <div 
          style={{ 
            width: '12px', 
            height: '12px', 
            borderRadius: '50%', 
            backgroundColor: type.color 
          }} 
        />
        {typeName}
      </div>
    ) : typeName;
  };

  // First, add this helper function for priority colors
  const getPriorityBadge = (priority) => {
    const priorityNum = Number(priority);
    
    const getPriorityDetails = (num) => {
      switch (num) {
        case 1: return { label: 'Low', color: 'success' };
        case 2: return { label: 'Normal', color: 'primary' };
        case 3: return { label: 'High', color: 'warning' };
        case 4: return { label: 'Urgent', color: 'danger' };
        case 5: return { label: 'Critical', color: 'dark' };
        default: return { label: 'Normal', color: 'secondary' };
      }
    };

    const details = getPriorityDetails(priorityNum);
    return (
      <Badge 
        bg={details.color}
        style={{ 
          fontSize: '0.85rem',
          padding: '0.35em 0.65em',
          fontWeight: '500'
        }}
      >
        {details.label}
      </Badge>
    );
  };

  return (
    <Container fluid className="px-6 py-4">
      <Row className="align-items-center justify-content-between g-3 mb-4">
        <Col md={6}>
          <h1 className="mb-0 h2">Follow-ups</h1>
        </Col>
        <Col md={6} className="d-flex justify-content-end gap-2">
          <div className="d-flex gap-2">
            <Form.Control
              type="text"
              placeholder="Follow-up ID"
              value={filters.followUpId}
              onChange={(e) => setFilters(prev => ({ ...prev, followUpId: e.target.value }))}
              style={{ width: '350px' }}
            />
            
            <Form.Select 
              value={filters.assignedWorker}
              onChange={(e) => setFilters(prev => ({ ...prev, assignedWorker: e.target.value }))}
              style={{ width: '200px' }}
            >
              <option value="all">All Technicians</option>
              {workers.map(worker => (
                <option key={worker.workerId} value={worker.workerId}>
                  {worker.fullName}
                </option>
              ))}
            </Form.Select>

            <Form.Select 
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              style={{ width: '150px' }}
            >
              <option value="all">All Status</option>
              <option value="Logged">Logged</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </Form.Select>

            <Form.Select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              style={{ width: '150px' }}
            >
              <option value="all">All Types</option>
              {followUpTypes.map(type => (
                <option key={type.id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </Form.Select>

            <Form.Control
              type="date"
              value={filters.dateRange.start || ''}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, start: e.target.value }
              }))}
            />
            <Form.Control
              type="date"
              value={filters.dateRange.end || ''}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, end: e.target.value }
              }))}
            />
          </div>
        </Col>
      </Row>

      {/* {process.env.NODE_ENV === 'development' && (
        <Row className="mb-3">
          <Col>
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
            >
              Toggle Debug Info
            </Button>
            {showDebug && (
              <div className="mt-2 p-3 bg-light rounded">
                <pre>{JSON.stringify({ filters, jobsCount: jobs.length }, null, 2)}</pre>
              </div>
            )}
          </Col>
        </Row>
      )} */}

      <Card>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-5">
              <p className="mb-0 text-muted">No follow-ups found matching the selected filters</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Follow-up ID</th>
                  <th>Job No.</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Worker</th>
                  <th>CSO</th>
                  <th>Created</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((followUp) => (
                  <tr key={followUp.id}>
                    <td>{followUp.id}</td>
                    <td>
                      <Link href={`/dashboard/jobs/${followUp.jobID}`}>
                        #{followUp.jobID}
                      </Link>
                    </td>
                    <td>
                      <Link href={`/customers/${followUp.customerID}`}>
                        {followUp.customerName}
                      </Link>
                    </td>
                    <td>{getTypeWithColor(followUp.type)}</td>
                    <td>{getStatusBadge(followUp.status)}</td>
                    <td>{getPriorityBadge(followUp.priority)}</td>
                    <td>{followUp.technicianName}</td>
                    <td>{followUp.csoName || '-'}</td>
                    <td>{format(new Date(followUp.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                    <td>{format(new Date(followUp.updatedAt), 'dd/MM/yyyy HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default FollowUpsPage; 