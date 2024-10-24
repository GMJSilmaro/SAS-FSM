import React, { Fragment, useMemo, useState, useEffect, useCallback } from 'react';
import { Col, Row, Card, Button, OverlayTrigger, Tooltip, Badge, Breadcrumb } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import { useRouter } from 'next/router';
import { Eye, EnvelopeFill, TelephoneFill, GeoAltFill, CurrencyExchange, HouseFill } from 'react-bootstrap-icons';
import { GeeksSEO, PageHeading } from 'widgets'

const fetchCustomers = async (page = 1, limit = 10, search = '', retryCount = 0) => {
  try {
    const formattedSearch = search.trim();
    const timestamp = new Date().getTime();
    const url = `/api/getCustomersList?page=${page}&limit=${limit}&search=${encodeURIComponent(formattedSearch)}&searchType=${
      formattedSearch.toUpperCase().startsWith('C0') ? 'code' : 'general'
    }&_=${timestamp}`;
    
    console.log(`Fetching customers: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    console.log(`Fetch response status: ${response.status}`);
    
    if (!response.ok) {
      if (retryCount < 2) {  // Allow up to 2 retries
        console.log(`Retry attempt ${retryCount + 1} for fetching customers`);
        await new Promise(resolve => setTimeout(resolve, 1000));  // Wait for 1 second before retrying
        return fetchCustomers(page, limit, search, retryCount + 1);
      }
      throw new Error(`Failed to fetch customers: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Fetched data:`, data);
    
    if (formattedSearch.toUpperCase().startsWith('C0') && (!data.customers || data.customers.length === 0)) {
      const retryUrl = `/api/getCustomersList?page=${page}&limit=${limit}&search=${encodeURIComponent(formattedSearch)}&searchType=general&_=${timestamp}`;
      console.log(`Retrying fetch with general search: ${retryUrl}`);
      
      const retryResponse = await fetch(retryUrl, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log(`Retry response status: ${retryResponse.status}`);
      
      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        console.log(`Retry fetched data:`, retryData);
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
      width: '5px' 
    },
    { 
      name: '#', 
      selector: (row, index) => ((currentPage - 1) * perPage) + index + 1, 
      width: '50px' 
    },
    { 
      name: 'Code', 
      selector: row => row.CardCode, 
      sortable: true, 
      width: '150px',
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
      width: '230px',
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
      width: '250px',
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
      width: '200px',
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
      name: (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id="tooltip-contract-column">
            Indicates whether this customer has a contract with us
          </Tooltip>}
        >
          <span>Contract Customer</span>
        </OverlayTrigger>
      ),
      selector: row => row.U_Contract, 
      sortable: true, 
      width: '100px',
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
      <GeeksSEO title="View Customers | SAS - SAP B1 Portal" />
       <Row>
          <Col lg={12} md={12} sm={12}>
            <div className="border-bottom pb-4 mb-4 d-flex align-items-center justify-content-between">
              <div className="mb-3 mb-md-0">
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
