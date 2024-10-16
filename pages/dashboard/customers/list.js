import React, { Fragment, useMemo, useState, useEffect } from 'react';
import { Col, Row, Card, Button, Modal, Form } from 'react-bootstrap';
import DataTable from 'react-data-table-component';

const fetchCustomers = async () => {
  try {
    const response = await fetch('/api/getCustomersList');
    
    // Log the response status and text to the console
    console.log('Response status:', response.status);
    const responseText = await response.text(); // Read response as text first
    console.log('Response text:', responseText);
    
    if (!response.ok) throw new Error('Failed to fetch customers');
    
    const data = JSON.parse(responseText); // Parse the response text as JSON
    return data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
};


const ViewCustomers = () => {
  // State to manage data and modal visibility
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    const getCustomers = async () => {
      setLoading(true); // Set loading to true before fetching data
      const customerData = await fetchCustomers();
      setData(customerData);
      setFilteredData(customerData); // Initialize filtered data
      setLoading(false); // Set loading to false after data is fetched
    };
    getCustomers();
  }, []);

  // Filter customers based on search input
  useEffect(() => {
    const result = data.filter(item => {
      return (
        (item.CardName && item.CardName.toLowerCase().includes(search.toLowerCase())) ||
        (item.CardCode && item.CardCode.toLowerCase().includes(search.toLowerCase()))
      );
    });
    setFilteredData(result);
  }, [search, data]);

  // Handle opening modal with customer details
  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  // Helper to render BP addresses
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

  // Helper to render Contact Employees
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

  // Table columns definition, adding more fields to be displayed
  const columns = [
    { name: '#', selector: (row, index) => index + 1, width: '50px' }, // Auto index
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
      allowOverflow: true,
      button: true,
    },
  ];

  // Custom styles for the DataTable
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

  // Search component in the table header
  const subHeaderComponentMemo = useMemo(() => {
    return (
      <input
        type="text"
        className="form-control me-4 mb-4"
        placeholder="Search by Customer Code or Name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    );
  }, [search]);

  if (loading) {
    return <div>Loading customers...</div>; // Display loading state while fetching data
  }

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
                highlightOnHover
                subHeader
                subHeaderComponent={subHeaderComponentMemo}
                paginationRowsPerPageOptions={[3, 5, 10]}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal for Customer Details */}
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




// import React, { Fragment, useMemo, useState, useEffect } from 'react';
// import { Col, Row, Card, Button, Modal, Form } from 'react-bootstrap';
// import DataTable from 'react-data-table-component';

// const fetchCustomers = async () => {
//   try {
//     const response = await fetch('/api/getCustomers');
//     if (!response.ok) throw new Error('Failed to fetch customers');
//     const data = await response.json();
//     return data;
//   } catch (error) {
//     console.error('Error fetching customers:', error);
//     return [];
//   }
// };

// const ViewCustomers = () => {
//   // State to manage data and modal visibility
//   const [data, setData] = useState([]);
//   const [filteredData, setFilteredData] = useState([]);
//   const [search, setSearch] = useState('');
//   const [showModal, setShowModal] = useState(false);
//   const [selectedCustomer, setSelectedCustomer] = useState(null);

//   useEffect(() => {
//     const getCustomers = async () => {
//       const customerData = await fetchCustomers();
//       setData(customerData);
//       setFilteredData(customerData); // Initialize filtered data
//     };
//     getCustomers();
//   }, []);

//   // Filter customers based on search input
//   useEffect(() => {
//     const result = data.filter(item => {
//       return item.cardName.toLowerCase().includes(search.toLowerCase()) ||
//         item.cardCode.toLowerCase().includes(search.toLowerCase());
//     });
//     setFilteredData(result);
//   }, [search, data]);

//   // Handle opening modal with customer details
//   const handleViewDetails = (customer) => {
//     setSelectedCustomer(customer);
//     setShowModal(true);
//   };

//   // Table columns definition
//   const columns = [
//     { name: '#', selector: (row, index) => index + 1, width: '50px' }, // Auto index
//     { name: 'Customer Code', selector: row => row.cardCode, sortable: true, width: '250px' },
//     { name: 'Customer Name', selector: row => row.cardName, sortable: true, width: '250px' },
//     {
//       name: 'Actions',
//       cell: (row) => (
//         <Button variant="outline-primary" size="sm" onClick={() => handleViewDetails(row)}>
//           View Details
//         </Button>
//       ),
//       ignoreRowClick: true,
//       allowOverflow: true,
//       button: true,
//     }
//   ];

//   // Custom styles for the DataTable
//   const customStyles = {
//     headCells: {
//       style: {
//         fontWeight: 'bold',
//         fontSize: '14px',
//         backgroundColor: "#F1F5FC",
//       },
//     },
//     cells: {
//       style: {
//         color: '#64748b',
//         fontSize: '14px',
//       },
//     },
//   };

//   // Search component in the table header
//   const subHeaderComponentMemo = useMemo(() => {
//     return (
//       <input
//         type="text"
//         className="form-control me-4 mb-4"
//         placeholder="Search by Customer Code or Name"
//         value={search}
//         onChange={(e) => setSearch(e.target.value)}
//       />
//     );
//   }, [search]);

//   return (
//     <Fragment>
//       <Row>
//         <Col lg={12} md={12} sm={12}>
//           <div className="border-bottom pb-4 mb-4 d-md-flex align-items-center justify-content-between">
//             <div className="mb-3 mb-md-0">
//               <h1 className="mb-1 h2 fw-bold">Customers List</h1>
//             </div>
//           </div>
//         </Col>
//       </Row>

//       <Row>
//         <Col md={12} xs={12} className="mb-5">
//           <Card>
//             <Card.Header>
//               <h4 className="mb-1">Customers Table</h4>
//             </Card.Header>
//             <Card.Body className="px-0">
//               <DataTable
//                 customStyles={customStyles}
//                 columns={columns}
//                 data={filteredData}
//                 pagination
//                 highlightOnHover
//                 subHeader
//                 subHeaderComponent={subHeaderComponentMemo}
//                 paginationRowsPerPageOptions={[3, 5, 10]}
//               />
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>

//       {/* Modal for Customer Details */}
//       <Modal show={showModal} onHide={() => setShowModal(false)} centered>
//         <Modal.Header closeButton>
//           <Modal.Title>Customer Details</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           {selectedCustomer ? (
//             <Fragment>
//               <Form.Group className="mb-3">
//                 <Form.Label>Customer Code:</Form.Label>
//                 <Form.Control type="text" value={selectedCustomer.cardCode} readOnly />
//               </Form.Group>
//               <Form.Group className="mb-3">
//                 <Form.Label>Customer Name:</Form.Label>
//                 <Form.Control type="text" value={selectedCustomer.cardName} readOnly />
//               </Form.Group>
//             </Fragment>
//           ) : (
//             <p>No customer details available</p>
//           )}
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
//         </Modal.Footer>
//       </Modal>
//     </Fragment>
//   );
// };

// export default ViewCustomers;
