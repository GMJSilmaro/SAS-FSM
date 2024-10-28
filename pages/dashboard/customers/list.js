'use client'

import React, { Fragment, useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Col, Row, Card, Button, OverlayTrigger, Tooltip, Badge, Breadcrumb, Placeholder, Spinner, Form } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import { useRouter } from 'next/router';
import { Eye, EnvelopeFill, TelephoneFill, GeoAltFill, CurrencyExchange, HouseFill, CalendarRange } from 'react-bootstrap-icons';
import { GeeksSEO, PageHeading } from 'widgets'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
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

// Update FilterPanel component definition to accept loadData and searchTerm props
const FilterPanel = ({ filters, setFilters, onClear, loading, loadData, searchTerm }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <OverlayTrigger
            placement="right"
            overlay={<Tooltip>Click to {isExpanded ? 'collapse' : 'expand'} filter panel</Tooltip>}
          >
            <div 
              className="d-flex align-items-center" 
              style={{ cursor: 'pointer' }}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Filter size={16} className="me-2 text-primary" />
              <h6 className="mb-0 me-2">Find</h6>
              {isExpanded ? (
                <ChevronUp size={16} className="text-muted" />
              ) : (
                <ChevronDown size={16} className="text-muted" />
              )}
            </div>
          </OverlayTrigger>
          <div>
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Clear all filters</Tooltip>}
            >
              <Button 
                variant="outline-danger" 
                size="sm"
                onClick={onClear}
                className="me-2"
                disabled={loading}
              >
                <X size={14} className="me-1" />
                Clear
              </Button>
            </OverlayTrigger>
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Apply filters</Tooltip>}
            >
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => loadData(1, searchTerm)}
                disabled={loading}
              >
                <Search size={14} className="me-1" />
                Search
              </Button>
            </OverlayTrigger>
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
                <Form.Label className="small mb-1">Customer Code:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.customerCode}
                  onChange={(e) => setFilters(prev => ({ ...prev, customerCode: e.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Customer Name:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.customerName}
                  onChange={(e) => setFilters(prev => ({ ...prev, customerName: e.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Email:</Form.Label>
                <Form.Control
                  size="sm"
                  type="email"
                  value={filters.email}
                  onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Phone:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.phone}
                  onChange={(e) => setFilters(prev => ({ ...prev, phone: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Contract Status:</Form.Label>
                <Form.Select
                  size="sm"
                  value={filters.contractStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, contractStatus: e.target.value }))}
                >
                  <option value="">All</option>
                  <option value="Y">With Contract</option>
                  <option value="N">No Contract</option>
                </Form.Select>
              </Form.Group>
              <Row className="align-items-end">
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small mb-1">Country:</Form.Label>
                    <Form.Select
                      size="sm"
                      value={filters.country}
                      onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
                    >
                      <option value="">All</option>
                      <option value="SG">Singapore</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small mb-1">Status:</Form.Label>
                    <Form.Select
                      size="sm"
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="">All</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Form.Select>
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
    status: ''
  });

  const loadData = useCallback(async (page, search = '') => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const { customers, totalCount } = await fetchCustomers(page, perPage, search, filters, initialLoad);
      setData(customers);
      setTotalRows(totalCount);
      if (customers.length === 0 && (search || Object.values(filters).some(v => v))) {
        toast.info('No customers found for the given criteria');
      }
    } catch (err) {
      setError(err.message);
      setData([]);
      setTotalRows(0);
      toast.error(`Error loading customers: ${err.message}`);
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
    setFilters({
      customerCode: '',
      customerName: '',
      email: '',
      phone: '',
      contractStatus: '',
      country: '',
      status: ''
    });
    setSearchTerm('');
    setDebouncedSearchTerm('');
    loadData(1, '');
  };

  const columns = [
    { 
      name: '#', 
      selector: (row, index) => ((currentPage - 1) * perPage) + index + 1,
      maxWidth: '60px',
      minWidth: '50px'
    },
    { 
      name: 'Code', 
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
      minWidth: '180px',
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
      minWidth: '160px',
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
      minWidth: '100px',
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
          <div className="border-bottom pb-4 mb-4 d-flex align-items-center justify-content-between">
            <div className="mb-3">
              <h1 className="mb-1 h2 fw-bold">Customers</h1>
              <Breadcrumb>
                <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item href="#">Customers</Breadcrumb.Item>
                <Breadcrumb.Item active>Customer List</Breadcrumb.Item>
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
      <ToastContainer position="top-right" autoClose={3000} />
    </Fragment>
  );
};

export default ViewCustomers;
