import React, { Fragment, useMemo, useState, useEffect, useCallback } from 'react';
import { Col, Row, Card, Button, OverlayTrigger, Tooltip, Badge } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import { useRouter } from 'next/router';
import { Eye, EnvelopeFill, TelephoneFill, GeoAltFill, CurrencyExchange } from 'react-bootstrap-icons';

const fetchCustomers = async (page = 1, limit = 10, search = '') => {
  try {
    const formattedSearch = search.trim();
    const timestamp = new Date().getTime();
    const response = await fetch(
      `/api/getCustomersList?page=${page}&limit=${limit}&search=${encodeURIComponent(formattedSearch)}&searchType=${
        formattedSearch.toUpperCase().startsWith('C0') ? 'code' : 'general'
      }&_=${timestamp}`,
      {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch customers: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (formattedSearch.toUpperCase().startsWith('C0') && (!data.customers || data.customers.length === 0)) {
      const retryResponse = await fetch(
        `/api/getCustomersList?page=${page}&limit=${limit}&search=${encodeURIComponent(formattedSearch)}&searchType=general&_=${timestamp}`,
        {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );
      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        return {
          customers: retryData.customers || [],
          totalCount: retryData.totalCount || 0
        };
      }
    }
    
    return {
      customers: data.customers || [],
      totalCount: data.totalCount || 0
    };
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

const ViewCustomers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const loadData = useCallback(async (page, searchTerm = '') => {
    setLoading(true);
    setError(null);
    try {
      const { customers, totalCount } = await fetchCustomers(page, perPage, searchTerm);
      setData(customers);
      setTotalRows(totalCount);
    } catch (err) {
      setError(err.message);
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [perPage]);

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1);
      loadData(1, search);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, loadData]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadData(page, search);
  };

  const handlePerRowsChange = async (newPerPage, page) => {
    setPerPage(newPerPage);
    loadData(page, search);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    if (value.toUpperCase().startsWith('C0')) {
      setSearch(value.toUpperCase());
    } else {
      setSearch(value);
    }
  };

  const handleViewDetails = (customer) => {
    router.push(`/dashboard/customers/${customer.CardCode}`);
  };

  const columns = [
    { 
      name: '', 
      width: '10px' 
    },
    { 
      name: '#', 
      selector: (row, index) => ((currentPage - 1) * perPage) + index + 1, 
      width: '50px' 
    },
    { 
      name: 'Customer Code', 
      selector: row => row.CardCode, 
      sortable: true, 
      width: '159px',
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
      width: '250px',
      cell: row => (
        <div className="d-flex align-items-center">
         
          {row.CardName}
        </div>
      )
    },
    { 
      name: 'Phone', 
      selector: row => row.Phone1, 
      sortable: true, 
      width: '150px',
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
      width: '250px',
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
      name: 'Country', 
      selector: row => row.Country, 
      sortable: true, 
      width: '120px',
      cell: row => (
        <div>
          <GeoAltFill className="me-2" />
          {row.Country}
        </div>
      )
    },
    { 
      name: 'Currency', 
      selector: row => row.Currency, 
      sortable: true, 
      width: '120px',
      cell: row => (
        <Badge bg="info" className="d-flex align-items-center">
          <CurrencyExchange className="me-1" />
          {row.Currency}
        </Badge>
      )
    },
    { 
      name: 'Actions',
      cell: (row) => (
        <Button variant="outline-primary" size="sm" onClick={() => handleViewDetails(row)}>
          <Eye className="me-1" /> View
        </Button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: "#F1F5FC",
        borderTopStyle: 'solid',
        borderTopWidth: '1px',
        borderTopColor: '#E0E0E0',
      },
    },
    headCells: {
      style: {
        fontWeight: 'bold',
        fontSize: '14px',
        color: '#333',
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    rows: {
      style: {
        fontSize: '14px',
        color: '#333',
        backgroundColor: 'white',
        '&:not(:last-of-type)': {
          borderBottomStyle: 'solid',
          borderBottomWidth: '1px',
          borderBottomColor: '#E0E0E0',
        },
      },
      highlightOnHoverStyle: {
        backgroundColor: '#F5F5F5',
        transition: '0.3s',
        borderBottomColor: '#FFFFFF',
      },
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
  };

  const subHeaderComponentMemo = useMemo(() => {
    return (
      <div className="w-100 me-4 mb-4">
        <input
          type="text"
          className="form-control"
          placeholder="Search by Customer Code (C0xxxxx) or other details..."
          value={search}
          onChange={handleSearch}
        />
        {loading && <small className="text-muted">Searching...</small>}
      </div>
    );
  }, [search, loading]);

  return (
    <Fragment>
      <Row>
        <Col lg={12} md={12} sm={12}>
          <div className="border-bottom pb-4 mb-4 d-md-flex align-items-center justify-content-between">
            <div className="mb-3 mb-md-0">
              <h1 className="mb-1 h2 fw-bold">Customers List</h1>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col md={12} xs={12} className="mb-5">
          <Card>
            <Card.Header>
              <h4 className="mb-1">Customers Table</h4>
            </Card.Header>
            <Card.Body className="px-0">
              {error && <div className="alert alert-danger mx-3">{error}</div>}
              <DataTable
                customStyles={customStyles}
                columns={columns}
                data={data}
                pagination
                paginationServer
                paginationTotalRows={totalRows}
                onChangePage={handlePageChange}
                onChangeRowsPerPage={handlePerRowsChange}
                //highlightOnHover
                pointerOnHover
                subHeader
                subHeaderComponent={subHeaderComponentMemo}
                progressPending={loading}
                progressComponent={<div className="p-4">Loading customers...</div>}
                noDataComponent={<div className="p-4">No matching records found</div>}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Fragment>
  );
};

export default ViewCustomers;