'use client'

import React, { Fragment, useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Col, Row, Card, Button, OverlayTrigger, Tooltip, Badge, Breadcrumb, Placeholder, Spinner, Form } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import { useRouter } from 'next/router';
import { Eye, EnvelopeFill, TelephoneFill, GeoAltFill, CurrencyExchange, HouseFill, CalendarRange } from 'react-bootstrap-icons';
import { GeeksSEO, PageHeading } from 'widgets'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import moment from 'moment'; // Make sure to install and import moment.js for date calculations
import { Search, X, ChevronDown, ChevronUp, Filter } from 'react-feather'; // Update imports

const fetchCustomers = async (page = 1, limit = 10, search = '', filters = {}, initialLoad = 'true') => {
  try {
    const timestamp = new Date().getTime();
    const queryParams = new URLSearchParams({
      page,
      limit,
      search,
      initialLoad,
      _: timestamp,
      ...filters
    });
    
    let url = `/api/getCustomersList?${queryParams.toString()}`;
    
    console.log(`Fetching customers: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    console.log(`Fetch response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response content: ${errorText}`);
      throw new Error(`Failed to fetch customers: ${response.status} ${response.statusText}\nError details: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Fetched data:`, data);
    
    return {
      customers: data.customers || [],
      totalCount: data.totalCount || 0
    };
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

// Add this debounce function at the top of the file
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};


const FilterPanel = ({ filters, setFilters, onClear, loading, loadData, searchTerm }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClear = () => {
    onClear();
    // After clearing filters, automatically load default data
    loadData(1, searchTerm);
  };

  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex align-items-center flex-grow-1">
            <OverlayTrigger
              placement="right"
              overlay={<Tooltip>Click to {isExpanded ? 'collapse' : 'expand'} search for customers</Tooltip>}
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
                    <Badge 
                      bg="primary" 
                      className="ms-2" 
                      style={{ 
                        fontSize: '0.75rem', 
                        verticalAlign: 'middle',
                        borderRadius: '12px',
                        padding: '0.25em 0.6em'
                      }}
                    >
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

            {/* Show customer name search only when not expanded */}
            {!isExpanded && (
              <div className="ms-4 flex-grow-1" style={{ maxWidth: '300px' }}>
               <Form.Group className="mb-2">
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Enter full or partial customer name</Tooltip>}
                >
                  <Form.Control
                    size="sm"
                    type="text"
                    value={filters.customerName}
                    onChange={(e) => setFilters(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Search by customer name..."
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                  />
                </OverlayTrigger>
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
              style={{ fontSize: '0.9rem' }}
            >
              <X size={14} className="me-1" />
              Clear
            </Button>
            
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => loadData(1, searchTerm)}
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
                <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Customer Code:</Form.Label>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Enter the unique customer code (e.g. C0001)</Tooltip>}
                >
                  <Form.Control
                    size="sm"
                    type="text"
                    value={filters.customerCode}
                    onChange={(e) => setFilters(prev => ({ ...prev, customerCode: e.target.value }))}
                    placeholder="Enter customer code..."
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                  />
                </OverlayTrigger>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Customer Name:</Form.Label>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Enter full or partial customer name</Tooltip>}
                >
                  <Form.Control
                    size="sm"
                    type="text"
                    value={filters.customerName}
                    onChange={(e) => setFilters(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Search by customer name..."
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                  />
                </OverlayTrigger>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Email:</Form.Label>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Enter customer's email address</Tooltip>}
                >
                  <Form.Control
                    size="sm"
                    type="email"
                    value={filters.email}
                    onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Search by email address..."
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                  />
                </OverlayTrigger>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Phone:</Form.Label>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Enter phone number (e.g. +65 1234 5678)</Tooltip>}
                >
                  <Form.Control
                    size="sm"
                    type="text"
                    value={filters.phone}
                    onChange={(e) => setFilters(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Search by phone number..."
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                  />
                </OverlayTrigger>
              </Form.Group>
             
            </Col>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Address:</Form.Label>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Enter street name, building name, postal code etc.</Tooltip>}
                >
                  <Form.Control
                    size="sm"
                    type="text"
                    value={filters.address}
                    onChange={(e) => setFilters(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Search by address, postal code..."
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                  />
                </OverlayTrigger>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Contract Status:</Form.Label>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Filter customers by their contract status</Tooltip>}
                >
                  <Form.Select
                    size="sm"
                    value={filters.contractStatus}
                    onChange={(e) => setFilters(prev => ({ ...prev, contractStatus: e.target.value }))}
                    style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                  >
                    <option value="">All Contract Status</option>
                    <option value="Y">With Contract</option>
                    <option value="N">No Contract</option>
                  </Form.Select>
                </OverlayTrigger>
              </Form.Group>
              <Row className="align-items-end">
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Country:</Form.Label>
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>Select customer's country</Tooltip>}
                    >
                      <Form.Select
                        size="sm"
                        value={filters.country}
                        onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
                        style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                      >
                        <option value="">All Countries</option>
                        <option value="SG">Singapore</option>
                      </Form.Select>
                    </OverlayTrigger>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small mb-1" style={{ fontSize: '0.9rem' }}>Status:</Form.Label>
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>Filter by customer account status</Tooltip>}
                    >
                      <Form.Select
                        size="sm"
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                      >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Form.Select>
                    </OverlayTrigger>
                  </Form.Group>
                </Col>
              </Row>
            </Col>
          </Row>
        </div>
      </Card.Body>
    </Card>
  );
};

// Update ViewCustomers component to include filters state
const ViewCustomers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const [perPage, setPerPage] = useState(10);
  const [initialLoad, setInitialLoad] = useState(true);
  const [filters, setFilters] = useState({
    customerCode: '',
    customerName: '',
    email: '',
    phone: '',
    contractStatus: '',
    country: '',
    status: '',
    address: '' // Add this line
  });

  const loadData = useCallback(async (page, search = '', forceInitial = false) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const { customers, totalCount } = await fetchCustomers(
        page, 
        perPage, 
        search, 
        filters, 
        forceInitial ? 'true' : initialLoad.toString()
      );
      setData(customers);
      setTotalRows(totalCount);
      
      // Modify the toast notifications to be simpler
      if (customers.length === 0) {
        toast.info('No customers found');
      } else {
        toast.success(`Found ${totalCount} customers`);
      }
      
    } catch (err) {
      console.error('Error details:', err);
      
      // Handle network errors
      if (!navigator.onLine) {
        toast.error('Please check your internet connection and try again.');
        return;
      }

      // Try to parse the error response
      let errorMessage = 'Unable to load customer data. Please try again later.';
      try {
        if (typeof err.message === 'string' && err.message.includes('<!DOCTYPE')) {
          errorMessage = 'The server is currently unavailable. Please try again later.';
        } else if (err.message) {
          const errorData = JSON.parse(err.message);
          errorMessage = errorData.error || errorMessage;
        }
      } catch {
        // If parsing fails, use the default message
      }

      setError(errorMessage);
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [perPage, initialLoad, filters, loading]);

  useEffect(() => {
    // Load initial data (first 25 records) when component mounts
    if (initialLoad) {
      loadData(1, '');
    }
  }, [loadData, initialLoad]);

  useEffect(() => {
    // Only load data if there's a search term
    if (debouncedSearchTerm) {
      setCurrentPage(1);
      loadData(1, debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, loadData]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      // Remove the length check to allow searching with any number of characters
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timerId);
  }, [searchTerm]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadData(page, debouncedSearchTerm);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    loadData(1, '');
  };

  const handleViewDetails = (customer) => {
    // Store the customer name in localStorage
    localStorage.setItem('viewCustomerToast', customer.CardName);
    // Navigate to the customer details page
    router.push(`/dashboard/customers/${customer.CardCode}`);
  };

  const handlePerRowsChange = async (newPerPage, page) => {
    setPerPage(newPerPage);
    await loadData(page, debouncedSearchTerm);
  };

  const handleClearFilters = () => {
    // First reset all filters and search terms
    setFilters({
      customerCode: '',
      customerName: '',
      email: '',
      phone: '',
      contractStatus: '',
      country: '',
      status: '',
      address: ''
    });
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setCurrentPage(1); // Reset to first page
    
    // Set initialLoad to true to trigger default loading behavior
    setInitialLoad(true);
    
    // Load default data
    loadData(1, '', true);
  };

  const columns = [
    { 
      name: '#', 
      selector: (row, index) => ((currentPage - 1) * perPage) + index + 1,
      maxWidth: '60px',
      minWidth: '50px'
    },
    { 
      name: 'Card Code', 
      selector: row => row.CardCode, 
      sortable: true,
      minWidth: '120px',
      grow: 0.5,
      cell: row => (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id={`tooltip-${row.CardCode}`}>Click to view details</Tooltip>}
        >
          <div style={{fontWeight: 'bold', cursor: 'pointer'}} onClick={() => handleViewDetails(row)}>
            {row.CardCode}
          </div>
        </OverlayTrigger>
      )
    },
    { 
      name: 'Customer Name', 
      selector: row => row.CardName, 
      sortable: true,
      minWidth: '200px',
      grow: 2,
      cell: row => (
        <div className="d-flex align-items-center">
          {row.CardName}
        </div>
      )
    },
    { 
      name: 'Main Address', 
      selector: row => row.MailAddress, 
      sortable: true,
      minWidth: '200px',
      grow: 2,
      cell: row => (
        <div>
          <HouseFill className="me-2" />
          {row.MailAddress}
        </div>
      )
    },
    { 
      name: 'Phone', 
      selector: row => row.Phone1, 
      sortable: true,
      minWidth: '130px',
      grow: 0.8,
      cell: row => (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id={`tooltip-phone-${row.CardCode}`}>Click to call</Tooltip>}
        >
          <a href={`tel:${row.Phone1}`} className="text-decoration-none">
            <TelephoneFill className="me-2" />
            {row.Phone1}
          </a>
        </OverlayTrigger>
      )
    },
    { 
      name: 'Email', 
      selector: row => row.EmailAddress, 
      sortable: true,
      minWidth: '240px',
      grow: 1.5,
      cell: row => (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id={`tooltip-email-${row.CardCode}`}>Click to send email</Tooltip>}
        >
          <a href={`mailto:${row.EmailAddress}`} className="text-decoration-none">
            <EnvelopeFill className="me-2" />
            {row.EmailAddress}
          </a>
        </OverlayTrigger>
      )
    },
    {
      name: 'Contract Duration',
      selector: row => row.U_ContractEndDate ? 
        moment(row.U_ContractEndDate).diff(moment(row.U_ContractStartDate), 'months') : null,
      sortable: true,
      minWidth: '180px',
      grow: 1,
      cell: row => {
        if (row.U_Contract !== 'Y' || !row.U_ContractStartDate || !row.U_ContractEndDate) {
          return '-';
        }
        const startDate = moment(row.U_ContractStartDate);
        const endDate = moment(row.U_ContractEndDate);
        const now = moment();
        const duration = moment.duration(endDate.diff(now));
        const months = Math.floor(duration.asMonths());
        const days = Math.floor(duration.asDays() % 30);
        const hours = Math.floor(duration.asHours() % 24);
        const minutes = Math.floor(duration.asMinutes() % 60);
        
        let durationText = '';
        if (months > 0) {
          durationText = `${months} month${months > 1 ? 's' : ''} left`;
        } else if (days > 0) {
          durationText = `${days} day${days > 1 ? 's' : ''} left`;
        } else if (hours > 0) {
          durationText = `${hours} hour${hours > 1 ? 's' : ''} left`;
        } else {
          durationText = `${minutes} minute${minutes > 1 ? 's' : ''} left`;
        }
        
        return (
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip id={`tooltip-duration-${row.CardCode}`}>
              Start: {startDate.format('DD/MM/YYYY')}
              <br />
              End: {endDate.format('DD/MM/YYYY')}
            </Tooltip>}
          >
            <span>
              <CalendarRange className="me-2" />
              {durationText}
            </span>
          </OverlayTrigger>
        );
      }
    },
    { 
      name: 'Contract',
      selector: row => row.U_Contract,
      sortable: true,
      minWidth: '130px',
      grow: 0.5,
      cell: row => (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id={`tooltip-contract-${row.CardCode}`}>
            {row.U_Contract === 'Y' ? 'This customer has a contract with us' : 'This customer does not have a contract with us'}
          </Tooltip>}
        >
          <div>
            <CurrencyExchange className="me-2" />
            <Badge bg={row.U_Contract === 'Y' ? 'success' : 'secondary'}>
              {row.U_Contract === 'Y' ? 'Yes' : 'No'}
            </Badge>
          </div>
        </OverlayTrigger>
      )
    },
    { 
      name: 'Actions',
      minWidth: '100px',
      grow: 0.5,
      cell: (row) => (
        <Button variant="outline-primary" size="sm" onClick={() => handleViewDetails(row)}>
          <Eye className="me-1" /> View
        </Button>
      ),
      ignoreRowClick: true,
    },
  ];

  const customStyles = {
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
  };

  const subHeaderComponentMemo = useMemo(() => {
    return (
      <div className="w-100 mb-4 position-relative">
        <Search 
          size={18} 
          className="position-absolute text-muted" 
          style={{ top: '12px', left: '12px' }} 
        />
        <input
          type="text"
          className="form-control ps-5 pe-5"
          placeholder="Search customers... (e.g. C012345, Customer Name Only!)"
          value={searchTerm}
          onChange={handleSearch}
          style={{
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            padding: '0.75rem 1rem',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
        />
        {searchTerm && (
          <button
            className="btn btn-link position-absolute"
            style={{ top: '6px', right: '6px' }}
            onClick={handleClearSearch}
          >
            <X size={18} />
          </button>
        )}
        {loading && <small className="text-muted position-absolute" style={{ top: '12px', right: '40px' }}>Searching...</small>}
      </div>
    );
  }, [searchTerm, loading]);

  return (
    <Fragment>
      <GeeksSEO title="View Customers | SAS - SAP B1 Portal" />
      <Row>
        <Col lg={12}>
          <div className="border-bottom pb-2 mb-4 d-flex align-items-center justify-content-between">
            <div className="mb-2">
              <h1 className="mb-1 h2 fw-bold">Customers</h1>
              <Breadcrumb>
                <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item active href="/customers/list">Customers</Breadcrumb.Item>
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
                loading={loading}
                loadData={loadData}    /* Add this prop */
                searchTerm={searchTerm}    /* Add this prop */
              />
              <DataTable
                columns={columns}
                data={data}
                pagination
                paginationServer
                paginationTotalRows={totalRows}
                onChangePage={handlePageChange}
                onChangeRowsPerPage={handlePerRowsChange}
                paginationPerPage={perPage}
                paginationRowsPerPageOptions={[10, 25, 50, 100]}
                highlightOnHover
                pointerOnHover
                progressPending={loading}
                progressComponent={
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" className="me-2" />
                    <span className="text-muted">Loading customers...</span>
                  </div>
                }
                customStyles={customStyles}
                persistTableHead
                noDataComponent={
                  <div className="text-center py-5">
                    <div className="text-muted mb-2">No customers found</div>
                    <small>Try adjusting your search terms</small>
                  </div>
                }
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

export default ViewCustomers;
