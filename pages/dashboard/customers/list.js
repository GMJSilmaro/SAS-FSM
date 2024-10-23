import React, { Fragment, useMemo, useState, useEffect, useCallback } from 'react';
import { Col, Row, Card, Button } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import { useRouter } from 'next/router';

const fetchCustomers = async (page = 1, limit = 10, search = '') => {
  try {
    // Format the search term - trim whitespace and handle case
    const formattedSearch = search.trim();
    
    // Add timestamp to prevent caching
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
    
    // If searching for a specific customer code and no results, try again with case-insensitive search
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

  // Initial load
  useEffect(() => {
    loadData(1);
  }, [loadData]);

  // Handle search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      loadData(1, search);
    }, 300); // Reduced debounce time for better responsiveness

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
    // For CustomerCode, automatically convert to uppercase
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
      name: '#', 
      selector: (row, index) => ((currentPage - 1) * perPage) + index + 1, 
      width: '50px' 
    },
    { 
      name: 'Customer Code', 
      selector: row => row.CardCode, 
      sortable: true, 
      width: '150px',
      cell: row => <div style={{fontWeight: 'bold'}}>{row.CardCode}</div>
    },
    { name: 'Customer Name', selector: row => row.CardName, sortable: true, width: '250px' },
    { name: 'Phone 1', selector: row => row.Phone1, sortable: true, width: '150px' },
    { name: 'Email', selector: row => row.EmailAddress, sortable: true, width: '250px' },
    { name: 'Country', selector: row => row.Country, sortable: true, width: '100px' },
    { name: 'Currency', selector: row => row.Currency, sortable: true, width: '100px' },
    { 
      name: 'Actions',
      cell: (row) => (
        <Button variant="outline-primary" size="sm" onClick={() => handleViewDetails(row)}>
          View Details
        </Button>
      ),
      ignoreRowClick: true,
      style: { overflow: 'visible' },
    },
  ];

  const customStyles = {
    headCells: {
      style: {
        fontWeight: 'bold',
        fontSize: '14px',
        backgroundColor: "#F1F5FC",
      },
    },
    cells: {
      style: {
        color: '#64748b',
        fontSize: '14px',
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
                highlightOnHover
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