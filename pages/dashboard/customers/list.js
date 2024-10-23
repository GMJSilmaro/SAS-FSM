import React, { Fragment, useMemo, useState, useEffect, useCallback } from 'react';
import { Col, Row, Card, Button, Modal, Form } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import PropTypes from 'prop-types';

const fetchCustomers = async (page = 1, limit = 10, search = '') => {
  try {
    const response = await fetch(`/api/getCustomersList?page=${page}&limit=${limit}&search=${search}`);
    
    if (!response.ok) throw new Error('Failed to fetch customers');
    
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
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchData = useCallback(async (page) => {
    setLoading(true);
    const response = await fetchCustomers(page, perPage, search);
    setData(response.customers);
    setTotalRows(response.totalCount);
    setLoading(false);
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
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const renderBPAddresses = (addresses) => {
    if (!addresses || addresses.length === 0) {
      return <p>No addresses available</p>;
    }
    return addresses.map((address, index) => (
      <div key={index}>
        <p><strong>Address Name:</strong> {address.AddressName}</p>
        <p><strong>Street:</strong> {address.Street}</p>
        <p><strong>Zip Code:</strong> {address.ZipCode}</p>
        <p><strong>Country:</strong> {address.Country}</p>
        <hr />
      </div>
    ));
  };

  const renderContactEmployees = (contacts) => {
    if (!contacts || contacts.length === 0) {
      return <p>No contact employees available</p>;
    }
    return contacts.map((contact, index) => (
      <div key={index}>
        <p><strong>Name:</strong> {contact.Name}</p>
        <p><strong>Phone:</strong> {contact.Phone1}</p>
        <p><strong>Email:</strong> {contact.E_Mail}</p>
        <hr />
      </div>
    ));
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

  const filteredData = data.filter(item =>
    (item.CardCode && item.CardCode.toLowerCase().includes(search.toLowerCase())) ||
    (item.CardName && item.CardName.toLowerCase().includes(search.toLowerCase())) ||
    (item.Phone1 && item.Phone1.toLowerCase().includes(search.toLowerCase())) ||
    (item.EmailAddress && item.EmailAddress.toLowerCase().includes(search.toLowerCase())) ||
    (item.Country && item.Country.toLowerCase().includes(search.toLowerCase())) ||
    (item.Currency && item.Currency.toLowerCase().includes(search.toLowerCase()))
  );

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
              <DataTable
                customStyles={customStyles}
                columns={columns}
                data={filteredData}
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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Customer Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCustomer ? (
            <Fragment>
              <h5>Basic Info</h5>
              <Form.Group className="mb-3">
                <Form.Label>Customer Code:</Form.Label>
                <Form.Control type="text" value={selectedCustomer.CardCode} readOnly />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Customer Name:</Form.Label>
                <Form.Control type="text" value={selectedCustomer.CardName} readOnly />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email:</Form.Label>
                <Form.Control type="text" value={selectedCustomer.EmailAddress} readOnly />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Phone:</Form.Label>
                <Form.Control type="text" value={selectedCustomer.Phone1} readOnly />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Country:</Form.Label>
                <Form.Control type="text" value={selectedCustomer.Country} readOnly />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Currency:</Form.Label>
                <Form.Control type="text" value={selectedCustomer.Currency} readOnly />
              </Form.Group>
              
              <hr />
              <h5>Addresses</h5>
              {renderBPAddresses(selectedCustomer.BPAddresses)}

              <hr />
              <h5>Contact Employees</h5>
              {renderContactEmployees(selectedCustomer.ContactEmployees)}

            </Fragment>
          ) : (
            <p>No customer details available</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </Fragment>
  );
};

export default ViewCustomers;
