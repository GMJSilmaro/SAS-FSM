import React, { Fragment, useMemo, useState, useEffect, useCallback } from 'react';
import { Col, Row, Card, Button } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';

const fetchCustomers = async (page = 1, limit = 10, search = '') => {
  try {
    const response = await fetch(`/api/getCustomersList?page=${page}&limit=${limit}&search=${search}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Failed to fetch customers: ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Unexpected content type:', contentType);
      throw new Error('Received non-JSON response from server');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    return { customers: [], totalCount: 0 };
  }
};

const customPropTypes = {
  ...DataTable.propTypes,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      selector: PropTypes.func,
      sortable: PropTypes.bool,
      width: PropTypes.string,
      cell: PropTypes.func,
      ignoreRowClick: PropTypes.bool,
      allowOverflow: PropTypes.bool,
      button: PropTypes.bool,
    })
  ),
};

const ViewCustomers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const router = useRouter();

  const fetchData = useCallback(async (page) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchCustomers(page, perPage, search);
      setData(response.customers);
      setTotalRows(response.totalCount);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [perPage, search]);

  useEffect(() => {
    fetchData(1); // Fetch initial data when component mounts
  }, [fetchData]);

  const handlePageChange = (page) => {
    fetchData(page);
  };

  const handlePerRowsChange = async (newPerPage, page) => {
    setPerPage(newPerPage);
    fetchData(page);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData(1); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, fetchData]);

  const handleViewDetails = (customer) => {
    router.push(`/dashboard/customers/${customer.CardCode}`);
  };

  const columns = [
    { name: '#', selector: (row, index) => index + 1, width: '50px' },
    { name: 'Customer Code', selector: row => row.CardCode, sortable: true, width: '150px' },
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
      <input
        type="text"
        className="form-control me-4 mb-4"
        placeholder="Search by Customer Code, Name, Phone, Email, Country, or Currency"
        value={search}
        onChange={handleSearch}
      />
    );
  }, [search]);

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
              {error && <div className="alert alert-danger">{error}</div>}
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
                progressComponent={<div>Loading customers...</div>}
                noDataComponent={<div>No matching records found</div>}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Fragment>
  );
};

export default ViewCustomers;
