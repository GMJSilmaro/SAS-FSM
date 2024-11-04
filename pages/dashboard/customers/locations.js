'use client'

import React, { Fragment, useMemo, useState, useEffect, useCallback } from 'react';
import { Col, Row, Card, Button, OverlayTrigger, Tooltip, Badge, Breadcrumb, Spinner, Form } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import { useRouter } from 'next/router';
import { Eye, TelephoneFill, GeoAltFill, Building, PersonFill } from 'react-bootstrap-icons';
import { GeeksSEO } from 'widgets';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { Search, X, ChevronDown, ChevronUp, Filter } from 'react-feather';

// Dummy data function - replace with actual API call later
const fetchLocations = async (page = 1, limit = 10, search = '') => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Dummy data
  const dummyLocations = Array(50).fill(null).map((_, index) => ({
    id: `LOC${String(index + 1).padStart(4, '0')}`,
    name: `Location ${index + 1}`,
    address: `${Math.floor(Math.random() * 999)} Main Street, City ${index + 1}`,
    customerCode: `C${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`,
    customerName: `Customer ${index + 1}`,
    contactPerson: `Contact Person ${index + 1}`,
    phone: `+1 ${Math.floor(Math.random() * 999)}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
    status: Math.random() > 0.3 ? 'Active' : 'Inactive',
    type: ['Main Office', 'Branch', 'Warehouse', 'Retail'][Math.floor(Math.random() * 4)]
  }));

  // Filter based on search term
  const filtered = dummyLocations.filter(location => 
    Object.values(location).some(value => 
      value.toString().toLowerCase().includes(search.toLowerCase())
    )
  );

  // Paginate
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedData = filtered.slice(start, end);

  return {
    locations: paginatedData,
    totalCount: filtered.length
  };
};

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
      fontSize: '12px'
    }
  },
  headCells: {
    style: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#475569',
      padding: '16px',
    }
  },
  cells: {
    style: {
      fontSize: '14px',
      color: '#64748b',
      padding: '12px 16px',
    }
  }
};

const FilterPanel = ({ filters, setFilters, onClear, loading }) => {
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
                onClick={() => setFilters(prev => ({ ...prev }))}
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
                <Form.Label className="small mb-1">Keyword Search:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.keyword}
                  onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Customer Code:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.customerName}
                  onChange={(e) => setFilters(prev => ({ ...prev, customerName: e.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">E-mail Address:</Form.Label>
                <Form.Control
                  size="sm"
                  type="email"
                  value={filters.email}
                  onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Address 1:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.address1}
                  onChange={(e) => setFilters(prev => ({ ...prev, address1: e.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Address 3:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.address3}
                  onChange={(e) => setFilters(prev => ({ ...prev, address3: e.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Postal Code:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.postalCode}
                  onChange={(e) => setFilters(prev => ({ ...prev, postalCode: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Phone:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.phone}
                  onChange={(e) => setFilters(prev => ({ ...prev, phone: e.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Address 2:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.address2}
                  onChange={(e) => setFilters(prev => ({ ...prev, address2: e.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Address 4:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.address4}
                  onChange={(e) => setFilters(prev => ({ ...prev, address4: e.target.value }))}
                />
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
                <Col md={3}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small mb-1">Class:</Form.Label>
                    <Form.Select
                      size="sm"
                      value={filters.class}
                      onChange={(e) => setFilters(prev => ({ ...prev, class: e.target.value }))}
                    >
                      <option value="">All</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small mb-1">Stage:</Form.Label>
                    <Form.Select
                      size="sm"
                      value={filters.stage}
                      onChange={(e) => setFilters(prev => ({ ...prev, stage: e.target.value }))}
                    >
                      <option value="">All</option>
                      <option value="1">Stage 1</option>
                      <option value="2">Stage 2</option>
                      <option value="3">Stage 3</option>
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

const ViewLocations = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filters, setFilters] = useState({
    keyword: '',
    customerName: '',
    email: '',
    customerNumber: '',
    phone: '',
    address1: '',
    address2: '',
    address3: '',
    address4: '',
    postalCode: '',
    country: '',
    class: '',
    stage: ''
  });
  const router = useRouter();

  const loadData = useCallback(async (page, search = '') => {
    setLoading(true);
    try {
      const { locations, totalCount } = await fetchLocations(page, perPage, search);
      setData(locations);
      setTotalRows(totalCount);
    } catch (error) {
      toast.error('Error loading locations');
    } finally {
      setLoading(false);
    }
  }, [perPage]);

  useEffect(() => {
    loadData(1, searchTerm);
  }, [loadData, searchTerm]);

  const columns = [
    {
      name: '#',
      selector: (row, index) => ((currentPage - 1) * perPage) + index + 1,
      width: '60px'
    },
    {
      name: 'Location ID',
      selector: row => row.id,
      sortable: true,
      width: '120px'
    },
    {
      name: 'Location Name',
      selector: row => row.name,
      sortable: true,
      width: '180px',
      cell: row => (
        <div className="d-flex align-items-center">
          <Building className="me-2" />
          {row.name}
        </div>
      )
    },
    {
      name: 'Address',
      selector: row => row.address,
      sortable: true,
      width: '250px',
      cell: row => (
        <div>
          <GeoAltFill className="me-2" />
          {row.address}
        </div>
      )
    },
    {
      name: 'Customer',
      selector: row => row.customerName,
      sortable: true,
      width: '180px',
      cell: row => (
        <div>
          <PersonFill className="me-2" />
          {row.customerName}
          <div className="small text-muted">{row.customerCode}</div>
        </div>
      )
    },
    {
      name: 'Contact',
      selector: row => row.phone,
      sortable: true,
      width: '160px',
      cell: row => (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>Click to call</Tooltip>}
        >
          <a href={`tel:${row.phone}`} className="text-decoration-none">
            <TelephoneFill className="me-2" />
            {row.phone}
          </a>
        </OverlayTrigger>
      )
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: true,
      width: '120px',
      cell: row => (
        <Badge bg={row.status === 'Active' ? 'success' : 'secondary'}>
          {row.status}
        </Badge>
      )
    },
    {
      name: 'Type',
      selector: row => row.type,
      sortable: true,
      width: '120px'
    },
    {
      name: 'Actions',
      cell: (row) => (
        <Button variant="outline-primary" size="sm">
          <Eye className="me-1" /> View
        </Button>
      ),
      ignoreRowClick: true,
      width: '100px'
    }
  ];

  const subHeaderComponent = useMemo(() => (
    <div className="w-100 mb-4 position-relative">
      <Search size={18} className="position-absolute text-muted" style={{ top: '12px', left: '12px' }} />
      <input
        type="text"
        className="form-control ps-5"
        placeholder="Search locations..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '0.75rem 1rem',
        }}
      />
    </div>
  ), [searchTerm]);

  return (
    <Fragment>
      <GeeksSEO title="Locations | SAS&ME - SAP B1 | Portal" />
      <Row>
        <Col lg={12}>
          <div className="border-bottom pb-4 mb-4">
            <h1 className="mb-1 h2 fw-bold">Locations</h1>
            <Breadcrumb>
              <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
              <Breadcrumb.Item href="#">Customers</Breadcrumb.Item>
              <Breadcrumb.Item active>Locations</Breadcrumb.Item>
            </Breadcrumb>
          </div>
        </Col>
      </Row>
      <FilterPanel 
        filters={filters}
        setFilters={setFilters}
        onClear={() => setFilters({
          keyword: '',
          customerName: '',
          email: '',
          customerNumber: '',
          phone: '',
          address1: '',
          address2: '',
          address3: '',
          address4: '',
          postalCode: '',
          country: '',
          class: '',
          stage: ''
        })}
        loading={loading}
      />
      <Row>
        <Col md={12} xs={12} className="mb-5">
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <DataTable
                columns={columns}
                data={data}
                pagination
                paginationServer
                paginationTotalRows={totalRows}
                onChangePage={page => loadData(page, searchTerm)}
                onChangeRowsPerPage={setPerPage}
                progressPending={loading}
                progressComponent={
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                  </div>
                }
                customStyles={customStyles}
              
                persistTableHead
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <ToastContainer position="top-right" autoClose={3000} />
    </Fragment>
  );
};

export default ViewLocations;
