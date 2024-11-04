'use client'

import React, { Fragment, useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Col, Row, Card, Button, OverlayTrigger, Tooltip, Badge, Breadcrumb, Spinner, Form } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import { useRouter } from 'next/router';
import { Eye, EnvelopeFill, TelephoneFill, GeoAltFill, HouseFill } from 'react-bootstrap-icons';
import { GeeksSEO } from 'widgets';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Search, X, ChevronDown, ChevronUp, Filter } from 'react-feather';
import { debounce } from 'lodash';
import { GB as GBFlag, SG as SGFlag, US as USFlag } from 'country-flag-icons/react/3x2'

const COUNTRY_CODE_MAP = {
  'Singapore': 'SG',
  'United Kingdom': 'GB',
  'United States': 'US',

};

const fetchLocations = async (page = 1, limit = 10, filters = {}) => {
  try {
    console.log('Fetching with filters:', filters);
    
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== '')
    );
    
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...cleanFilters
    });
    
    const url = `/api/getServiceLocations?${queryParams.toString()}`;
    console.log('Fetching URL:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error Response:', errorData);
      throw new Error(errorData.details || 'Failed to fetch locations');
    }
    
    const data = await response.json();
    console.log('API Response:', data);
    
    let filteredLocations = data.locations || [];
    
    if (cleanFilters.address) {
      const searchTerm = cleanFilters.address.toLowerCase();
      filteredLocations = filteredLocations.filter(location => 
        location.Address1?.toLowerCase().includes(searchTerm) ||
        location.Address2?.toLowerCase().includes(searchTerm) ||
        location.Address3?.toLowerCase().includes(searchTerm)
      );
    }

    if (cleanFilters.customerName) {
      const searchTerm = cleanFilters.customerName.toLowerCase();
      filteredLocations = filteredLocations.filter(location => 
        location.CustomerName?.toLowerCase().includes(searchTerm)
      );
    }

    if (cleanFilters.email) {
      const searchTerm = cleanFilters.email.toLowerCase();
      filteredLocations = filteredLocations.filter(location => 
        location.EmailAddress?.toLowerCase().includes(searchTerm)
      );
    }

    if (cleanFilters.phone) {
      const searchTerm = cleanFilters.phone.toLowerCase();
      filteredLocations = filteredLocations.filter(location => 
        location.Phone1?.toLowerCase().includes(searchTerm) ||
        location.Phone2?.toLowerCase().includes(searchTerm)
      );
    }

    if (cleanFilters.postalCode) {
      const searchTerm = cleanFilters.postalCode.toLowerCase();
      filteredLocations = filteredLocations.filter(location => 
        location.PostalCode?.toLowerCase().includes(searchTerm)
      );
    }

    if (cleanFilters.country) {
      const searchTerm = cleanFilters.country.toLowerCase();
      filteredLocations = filteredLocations.filter(location => 
        location.Country?.toLowerCase().includes(searchTerm)
      );
    }
    
    return {
      locations: filteredLocations,
      totalCount: filteredLocations.length
    };
  } catch (error) {
    console.error('Error fetching locations:', {
      message: error.message,
      stack: error.stack,
      filters: filters
    });
    throw error;
  }
};

const FilterPanel = ({ filters, setFilters, onClear, loading, loadData, onInputChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInputChange = (field, value) => {
    onInputChange(field, value);
  };

  const handleSearch = () => {
    loadData();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSearch();
    }
  };

  const handleClear = () => {
    onClear();
  };

  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex align-items-center flex-grow-1">
            <OverlayTrigger
              placement="right"
              overlay={(props) => (
                <Tooltip id="filter-tooltip" {...props}>
                  Click to {isExpanded ? 'collapse' : 'expand'} search for locations
                </Tooltip>
              )}
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
                    <Badge bg="primary" className="ms-2">
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

            {/* Show address search when not expanded */}
            {!isExpanded && (
              <div className="ms-4 flex-grow-1" style={{ maxWidth: '300px' }}>
                <Form.Group className="mb-2">
                  <Form.Control
                    size="sm"
                    type="text"
                    value={filters.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Search by address..."
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                  />
                </Form.Group>
              </div>
            )}
          </div>

          <div>
            <Button 
              variant="outline-danger" 
              size="sm"
              onClick={handleClear}
              className="me-2"
              disabled={loading}
            >
              <X size={14} className="me-1" />
              Clear
            </Button>
            
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleSearch}
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
                <Form.Label className="small mb-1">Customer Name:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.customerName || ''}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search by customer name..."
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Email:</Form.Label>
                <Form.Control
                  size="sm"
                  type="email"
                  value={filters.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search by email..."
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Phone:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search by phone number..."
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Address:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search by address..."
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Postal Code:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search by postal code..."
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Country:</Form.Label>
                <Form.Select
                  size="sm"
                  value={filters.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  onKeyPress={handleKeyPress}
                >
                  <option value="">All Countries</option>
                  <option value="SG">Singapore</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </div>
      </Card.Body>
    </Card>
  );
};

const LocationsList = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [error, setError] = useState(null);
  const isInitialMount = useRef(true);
  const loadingRef = useRef(false);
  const [filters, setFilters] = useState({
    customerCode: '',
    customerName: '',
    email: '',
    phone: '',
    address: '',
    country: '',
    status: ''
  });
  const [activeFilters, setActiveFilters] = useState({});
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  const loadData = useCallback(async (page, currentFilters = {}) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const { locations, totalCount } = await fetchLocations(page, perPage, currentFilters);
      setLocations(locations);
      setTotalRows(totalCount);
      setCurrentPage(page);
      
      if (!isInitialMount.current) {
        toast.success(`Showing ${locations.length} of ${totalCount} locations`);
      }
    } catch (err) {
      console.error('Error loading locations:', err);
      const errorMessage = 'Unable to load location data. Please try again later.';
      setError(errorMessage);
      if (!isInitialMount.current) {
        toast.error(errorMessage);
      }
      setLocations([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
      loadingRef.current = false;
      if (isInitialMount.current) {
        isInitialMount.current = false;
      }
    }
  }, [perPage]);

  const handleInputChange = useCallback((field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleFilterSearch = useCallback(async () => {
    setIsFilterLoading(true);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      
      console.log('Searching with filters:', cleanFilters);
      
      await loadData(1, cleanFilters);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to perform search');
    } finally {
      setIsFilterLoading(false);
    }
  }, [loadData, filters]);

  const handleClearFilters = useCallback(() => {
    const clearedFilters = {
      customerCode: '',
      customerName: '',
      email: '',
      phone: '',
      address: '',
      country: '',
      status: ''
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
    loadData(1, clearedFilters);
  }, [loadData]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    loadData(page, filters);
  }, [loadData, filters]);

  const handlePerRowsChange = useCallback(async (newPerPage, page) => {
    setPerPage(newPerPage);
    await loadData(page, filters);
  }, [loadData, filters]);

  useEffect(() => {
    loadData(1, {});
  }, [loadData]);

  const columns = useMemo(() => [
    {
      name: '#',
      selector: (row, index) => ((currentPage - 1) * perPage) + index + 1,
      maxWidth: '60px',
      minWidth: '50px'
    },
    {
      name: 'Customer Name',
      selector: row => row.CustomerName,
      sortable: true,
      minWidth: '200px',
      grow: 1.5
    },
    {
      name: 'Address 1',
      selector: row => row.Address1,
      sortable: true,
      minWidth: '200px',
      grow: 1.5,
      cell: row => (
        <div>
          <HouseFill className="me-2" />
          {row.Address1 || '-'}
        </div>
      )
    },
    {
      name: 'Address 2',
      selector: row => row.Address2,
      sortable: true,
      minWidth: '200px',
      grow: 1.5,
      cell: row => row.Address2 || '-'
    },
    {
      name: 'Address 3',
      selector: row => row.Address3,
      sortable: true,
      minWidth: '200px',
      grow: 1.5,
      cell: row => row.Address3 || '-'
    },
    {
      name: 'Postal Code',
      selector: row => row.PostalCode,
      sortable: true,
      minWidth: '120px',
      grow: 0.5
    },
    {
      name: 'Phone 1',
      selector: row => row.Phone1,
      sortable: true,
      minWidth: '130px',
      grow: 1,
      cell: row => row.Phone1 ? (
        <OverlayTrigger
          placement="top"
          overlay={(props) => (
            <Tooltip id={`phone1-tooltip-${row.id}`} {...props}>
              Click to call
            </Tooltip>
          )}
        >
          <a href={`tel:${row.Phone1}`} className="text-decoration-none">
            <TelephoneFill className="me-2" />
            {row.Phone1}
          </a>
        </OverlayTrigger>
      ) : '-'
    },
    {
      name: 'Phone 2',
      selector: row => row.Phone2,
      sortable: true,
      minWidth: '130px',
      grow: 1,
      cell: row => row.Phone2 ? (
        <OverlayTrigger
          placement="top"
          overlay={(props) => (
            <Tooltip id={`phone2-tooltip-${row.id}`} {...props}>
              Click to call
            </Tooltip>
          )}
        >
          <a href={`tel:${row.Phone2}`} className="text-decoration-none">
            <TelephoneFill className="me-2" />
            {row.Phone2}
          </a>
        </OverlayTrigger>
      ) : '-'
    },
    {
      name: 'Email',
      selector: row => row.EmailAddress,
      sortable: true,
      minWidth: '240px',
      grow: 1.5,
      cell: row => row.EmailAddress ? (
        <OverlayTrigger
          placement="top"
          overlay={(props) => (
            <Tooltip id={`email-tooltip-${row.id}`} {...props}>
              Click to send email
            </Tooltip>
          )}
        >
          <a href={`mailto:${row.EmailAddress}`} className="text-decoration-none">
            <EnvelopeFill className="me-2" />
            {row.EmailAddress}
          </a>
        </OverlayTrigger>
      ) : '-'
    },
    {
      name: 'Country',
      selector: row => row.Country,
      sortable: true,
      minWidth: '150px',
      grow: 0.5,
      cell: row => {
        const countryName = row.Country || '';
        const countryCode = COUNTRY_CODE_MAP[countryName];
        
        return (
          <div className="d-flex align-items-center">
            {countryCode === 'SG' && <SGFlag className="me-2" style={{ width: '20px' }} />}
            {countryCode === 'GB' && <GBFlag className="me-2" style={{ width: '20px' }} />}
            {countryCode === 'US' && <USFlag className="me-2" style={{ width: '20px' }} />}
            {countryName || '-'}
          </div>
        );
      }
    }
  ], [currentPage, perPage]);

  const customStyles = useMemo(() => ({
    table: {
      style: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
      }
    },
    headRow: {
      style: {
        backgroundColor: '#f8fafc',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        borderBottom: '1px solid #e2e8f0',
      }
    },
    headCells: {
      style: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#475569',
        paddingTop: '16px',
        paddingBottom: '16px',
      }
    },
    cells: {
      style: {
        fontSize: '14px',
        color: '#64748b',
        paddingTop: '12px',
        paddingBottom: '12px',
      }
    },
    rows: {
      style: {
        '&:hover': {
          backgroundColor: '#f1f5f9',
          cursor: 'pointer',
          transition: 'all 0.2s',
        },
      }
    },
    pagination: {
      style: {
        borderTop: '1px solid #e2e8f0',
      }
    }
  }), []);

  return (
    <Fragment>
      <GeeksSEO title="Service Locations | SAS - SAP B1 Portal" />
      <Row>
        <Col lg={12}>
          <div className="border-bottom pb-2 mb-4 d-flex align-items-center justify-content-between">
            <div className="mb-2">
              <h1 className="mb-1 h2 fw-bold">Service Locations</h1>
              <Breadcrumb>
                <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item active>Service Locations</Breadcrumb.Item>
              </Breadcrumb>
            </div>
          </div>
        </Col>
      </Row>
      <Row>
        <Col md={12} xs={12} className="mb-5">
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              {error && <div className="alert alert-danger mb-4">{error}</div>}
              <FilterPanel
                filters={filters}
                setFilters={setFilters}
                onClear={handleClearFilters}
                loading={loading || isFilterLoading}
                loadData={handleFilterSearch}
                onInputChange={handleInputChange}
              />
              <DataTable
                columns={columns}
                data={locations}
                pagination
                paginationServer={false}
                paginationTotalRows={locations.length}
                onChangePage={handlePageChange}
                onChangeRowsPerPage={handlePerRowsChange}
                paginationPerPage={10}
                paginationRowsPerPageOptions={[10]}
                highlightOnHover
                pointerOnHover
                progressPending={loading}
                progressComponent={
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" className="me-2" />
                    <span className="text-muted">Loading locations...</span>
                  </div>
                }
                customStyles={customStyles}
                persistTableHead
                noDataComponent={
                  <div className="text-center py-5">
                    <div className="text-muted mb-2">No locations found</div>
                    <small>Try adjusting your search terms</small>
                  </div>
                }
                paginationComponentOptions={{
                  noRowsPerPage: true // Hide rows per page selector
                }}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        limit={3}
      />
    </Fragment>
  );
};

export default LocationsList;