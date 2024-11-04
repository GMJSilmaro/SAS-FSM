import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Container, Badge, Card } from 'react-bootstrap';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaSearch, FaBriefcase, FaClipboardList, FaUser, FaHistory, 
         FaBell, FaMapMarkerAlt, FaClock, FaExclamationCircle } from 'react-icons/fa';
import { format } from 'date-fns';
const SearchResults = () => {
  const router = useRouter();
  const { q } = router.query;
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalResults, setTotalResults] = useState(0);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const searchData = async () => {
      if (!q) return;

      try {
        setLoading(true);
        setError(null);
        const searchResults = [];
        const searchTerm = q.toLowerCase().trim();

        // Search customers via API
        try {
          const customersResponse = await fetch(`/api/getCustomersList?search=${encodeURIComponent(q)}&limit=${itemsPerPage}&page=${currentPage}`);
          if (customersResponse.ok) {
            const customersData = await customersResponse.json();
            const customerResults = customersData.customers
              .filter(customer => {
                // Create searchable text from relevant fields
                const searchableText = [
                  customer.CardName,
                  customer.CardCode,
                  customer.MailAddress,
                  customer.Phone1,
                  customer.EmailAddress
                ]
                  .filter(Boolean)
                  .map(value => value.toLowerCase())
                  .join(' ');
                
                // Check for exact matches first, then partial matches
                return searchableText.includes(searchTerm);
              })
              .map(customer => ({
                id: customer.CardCode,
                type: 'customer',
                title: customer.CardName,
                subtitle: customer.CardCode,
                description: customer.MailAddress,
                location: customer.MailAddress,
                phone: customer.Phone1,
                email: customer.EmailAddress,
                timestamp: new Date(),
                ...customer
              }));
            searchResults.push(...customerResults);
          }
        } catch (error) {
          console.error('Error searching customers:', error);
        }

        // Search locations via API
        try {
          const locationsResponse = await fetch(`/api/getServiceLocations?search=${encodeURIComponent(q)}&limit=${itemsPerPage}&page=${currentPage}`);
          if (locationsResponse.ok) {
            const locationsData = await locationsResponse.json();
            const locationResults = locationsData.locations
              .filter(location => {
                // Create searchable text from relevant fields
                const searchableText = [
                  location.CustomerName,
                  location.Address1,
                  location.Address2,
                  location.Address3,
                  location.PostalCode,
                  location.Phone1,
                  location.EmailAddress
                ]
                  .filter(Boolean)
                  .map(value => value.toLowerCase())
                  .join(' ');
                
                return searchableText.includes(searchTerm);
              })
              .map(location => ({
                id: location.id,
                type: 'location',
                title: location.CustomerName,
                subtitle: `${location.Address1}${location.Address2 ? `, ${location.Address2}` : ''}`,
                description: location.Address3,
                location: location.PostalCode,
                phone: location.Phone1,
                email: location.EmailAddress,
                timestamp: new Date(),
                ...location
              }));
            searchResults.push(...locationResults);
          }
        } catch (error) {
          console.error('Error searching locations:', error);
        }

        // Search workers/users in Firebase
        try {
          const usersRef = collection(db, 'users');
          const usersSnapshot = await getDocs(usersRef);
          
          usersSnapshot.forEach((doc) => {
            const userData = doc.data();
            // Create array of searchable values
            const searchableValues = [
              userData.name,
              userData.displayName,
              userData.position,
              userData.role,
              userData.description,
              userData.phone,
              userData.email
            ].filter(Boolean);

            // Check for exact matches first
            const hasExactMatch = searchableValues.some(value => 
              value.toLowerCase() === searchTerm
            );

            // Then check for partial matches if no exact match
            const hasPartialMatch = !hasExactMatch && searchableValues.some(value =>
              value.toLowerCase().includes(searchTerm)
            );

            if (hasExactMatch || hasPartialMatch) {
              searchResults.push({
                id: doc.id,
                type: 'worker',
                title: userData.name || userData.displayName,
                subtitle: userData.position || userData.role,
                description: userData.description,
                phone: userData.phone,
                email: userData.email,
                timestamp: userData.createdAt,
                ...userData
              });
            }
          });
        } catch (error) {
          console.error('Error searching workers:', error);
        }

        // Search jobs in Firebase
        try {
          const jobsRef = collection(db, 'jobs');
          const jobsSnapshot = await getDocs(jobsRef);
          
          jobsSnapshot.forEach((doc) => {
            const jobData = doc.data();
            
            // Define searchable fields with their values
            const searchableFields = {
              jobStatus: jobData.jobStatus,
              jobID: jobData.jobID,
              jobName: jobData.jobName,
              jobNo: jobData.jobNo,
              jobDescription: jobData.jobDescription?.replace(/<[^>]*>/g, ''), // Remove HTML tags
              customerName: jobData.customerName,
              customerID: jobData.customerID,
              priority: jobData.priority,
              locationName: jobData.location?.locationName,
              streetAddress: jobData.location?.address?.streetAddress,
              contactFullname: jobData.contact?.contactFullname,
              equipments: jobData.equipments?.map(eq => [
                eq.brand,
                eq.equipmentType,
                eq.equipmentLocation,
                eq.itemName,
                eq.modelSeries,
                eq.serialNo
              ].filter(Boolean).join(' ')),
              assignedWorkers: jobData.assignedWorkers?.map(worker => worker.workerId).join(' ')
            };

            // Check for exact matches first
            const hasExactMatch = Object.values(searchableFields)
              .filter(Boolean)
              .some(value => {
                if (Array.isArray(value)) {
                  return value.some(v => v.toLowerCase() === searchTerm);
                }
                return String(value).toLowerCase() === searchTerm;
              });

            // Check for partial matches if no exact match found
            const hasPartialMatch = !hasExactMatch && Object.entries(searchableFields)
              .filter(([key, value]) => Boolean(value))
              .some(([key, value]) => {
                if (Array.isArray(value)) {
                  return value.some(v => String(v).toLowerCase().includes(searchTerm));
                }
                return String(value).toLowerCase().includes(searchTerm);
              });

            if (hasExactMatch || hasPartialMatch) {
              searchResults.push({
                id: doc.id,
                type: 'job',
                title: jobData.jobName || `Job ${jobData.jobID}`,
                subtitle: jobData.customerName,
                description: jobData.jobDescription?.replace(/<[^>]*>/g, ''),
                location: jobData.location?.locationName || jobData.location?.address?.streetAddress,
                status: jobData.jobStatus,
                timestamp: jobData.startDate ? new Date(jobData.startDate) : new Date(),
                priority: jobData.priority,
                ...jobData
              });
            }
          });
        } catch (error) {
          console.error('Error searching jobs:', error);
        }

        setTotalResults(searchResults.length);
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedResults = searchResults.slice(startIndex, startIndex + itemsPerPage);
        setResults(paginatedResults);

      } catch (error) {
        console.error('Search error:', error);
        setError('An error occurred while searching. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    searchData();
  }, [q, currentPage, itemsPerPage]);

  const handleClick = (item) => {
    switch (item.type?.toLowerCase()) {
      case 'customer':
        router.push(`/dashboard/customers/${item.id}`);
        break;
      case 'location':
        router.push(`/dashboard/locations`);
        break;
      case 'worker':
        router.push(`/dashboard/workers/list/${item.id}`);
        break;
      case 'job':
        router.push(`/dashboard/jobs/list-jobs/${item.id}`);
        break;
      default:
        console.warn(`No route defined for type: ${item.type}`);
    }
  };

  const getStatusBadgeColor = (status) => {
    const statusColors = {
      'created': 'info',
      'in progress': 'warning',
      'completed': 'success',
      'pending': 'secondary',
      'cancelled': 'danger',
      'assigned': 'primary',
    };
    return statusColors[status?.toLowerCase()] || 'secondary';
  };

  const getTypeColor = (type) => {
    const typeColors = {
      'jobs': 'primary',
      'jobHistory': 'info',
      'customers': 'success',
      'notifications': 'warning',
      'recentActivities': 'secondary',
      'workerAttendance': 'dark'
    };
    return typeColors[type] || 'secondary';
  };

  const getIcon = (type) => {
    const iconProps = { size: 24, className: 'text-muted' };
    switch (type?.toLowerCase()) {
      case 'job':
      case 'jobs':
        return <FaBriefcase {...iconProps} />;
      case 'jobhistory':
        return <FaHistory {...iconProps} />;
      case 'customers':
        return <FaUser {...iconProps} />;
      case 'notifications':
        return <FaBell {...iconProps} />;
      case 'recentactivities':
        return <FaClipboardList {...iconProps} />;
      default:
        return <FaClipboardList {...iconProps} />;
    }
  };

  const ResultItem = ({ item }) => {
    const router = useRouter();

    const handleClick = () => {
      switch (item.type?.toLowerCase()) {
        case 'job':
          router.push(`/dashboard/jobs/${item.id}`);
          break;
        case 'customer':
          router.push(`/dashboard/customers/${item.id}`);
          break;
        case 'worker':
          router.push(`/dashboard/workers/list/${item.id}`);
          break;
        case 'location':
          router.push(`/dashboard/customers/locations`);
          break;
        case 'jobhistory':
          router.push(`/dashboard/jobs/list-jobs/${item.id}`);
          break;
        default:
          console.warn(`No route defined for type: ${item.type}`);
      }
    };

    return (
      <Card 
        className="mb-3 shadow-sm hover-shadow" 
        style={{ cursor: 'pointer' }}
        onClick={handleClick}
      >
        <Card.Body>
          <div className="d-flex">
            <div className="me-3">
              {getIcon(item.type)}
            </div>
            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h5 className="mb-1">
                    {item.title}
                    <Badge bg={getTypeColor(item.type)} className="ms-2 text-uppercase" style={{ fontSize: '0.7rem' }}>
                      {item.type}
                    </Badge>
                    {item.status && (
                      <Badge bg={getStatusBadgeColor(item.status)} className="ms-2">
                        {item.status}
                      </Badge>
                    )}
                  </h5>
                  <p className="mb-2 text-muted">
                    {item.subtitle}
                  </p>
                </div>
                {item.timestamp && (
                  <small className="text-muted d-flex align-items-center">
                    <FaClock className="me-1" />
                    {format(item.timestamp, 'MMM d, yyyy h:mm a')}
                  </small>
                )}
              </div>
              
              {item.description && (
                <p className="mb-2 small text-muted">
                  {item.description.substring(0, 150)}
                  {item.description.length > 150 && '...'}
                </p>
              )}

              <div className="d-flex align-items-center mt-2">
                {item.location && (
                  <span className="me-3 small text-muted">
                    <FaMapMarkerAlt className="me-1" />
                    {typeof item.location === 'object' 
                      ? (item.location.locationName || item.location.address || 'Location not specified')
                      : item.location
                    }
                  </span>
                )}
                {item.assignedTo && (
                  <span className="me-3 small text-muted">
                    <FaUser className="me-1" />
                    {item.assignedTo}
                  </span>
                )}
                {/* Add more metadata as needed */}
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  };

  const Pagination = () => {
    const totalPages = Math.ceil(totalResults / itemsPerPage);
    
    if (totalPages <= 1) return null;

    return (
      <div className="d-flex justify-content-center mt-4">
        <nav>
          <ul className="pagination">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
            </li>
            {[...Array(totalPages)].map((_, index) => (
              <li
                key={index + 1}
                className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(index + 1)}
                >
                  {index + 1}
                </button>
              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>
    );
  };

  return (

      <Container fluid className="py-1">
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Body>
            <div className="d-flex align-items-center">
              <FaSearch size={24} className="text-primary me-3" />
              <div>
                <h4 className="mb-1">Search Results</h4>
                <p className="mb-0 text-muted">
                  Found {results.length} results for "{q}"
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Searching across all records...</p>
          </div>
        ) : error ? (
          <Card className="border-danger">
            <Card.Body className="text-center text-danger">
              <FaExclamationCircle size={48} className="mb-3" />
              <h5>{error}</h5>
              <p className="mb-0">Please try again or contact support if the issue persists.</p>
            </Card.Body>
          </Card>
        ) : results.length === 0 ? (
          <Card className="text-center py-5 border-0 shadow-sm">
            <Card.Body>
              <FaSearch size={48} className="text-muted mb-3" />
              <h5>No results found</h5>
              <p className="text-muted mb-0">Try different keywords or check your spelling</p>
            </Card.Body>
          </Card>
        ) : (
          <>
            <div className="search-results">
              {results.map(item => (
                <ResultItem key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
            <Pagination />
          </>
        )}
      </Container>

  );
};

export default SearchResults;