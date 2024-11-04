// QuotationsTab.js
import React, { useState, useEffect } from 'react';
import { Table, Spinner, Alert, Pagination, Container, Row, Col, Form, InputGroup, Button } from 'react-bootstrap';
import { Search, Calendar, XCircle, CaretUpFill, CaretDownFill } from 'react-bootstrap-icons';
import { format, parse, isValid } from 'date-fns';

const QuotationsTab = ({ customerId }) => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [quotationsPerPage] = useState(10);
  const [retryCount, setRetryCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortField, setSortField] = useState('DocNum');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const fetchQuotations = async () => {
      if (!customerId) {
        setError('Customer ID is required');
        setLoading(false);
        return;
      }

      try {
        console.log(`Fetching quotations for cardCode: ${customerId}`);
        const response = await fetch('/api/getQuotations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cardCode: customerId }),
        });

        if (!response.ok) {
          throw new Error(`HTTP Error ${response.status}`);
        }

        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received');
        }

        console.log('Fetched quotations:', data);
        setQuotations(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching quotations:', err);
        setError(err.message);
        
        if (retryCount < 2) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            fetchQuotations();
          }, 1000 * (retryCount + 1));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuotations();
  }, [customerId, retryCount]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      const date = new Date(year, month - 1, day);
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      console.error('Error parsing date:', error);
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const filteredQuotations = quotations.filter(quote => {
    const matchesSearch = Object.values(quote).some(value =>
      value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

    let matchesDate = true;
    if (dateFilter) {
      const filterDate = parse(dateFilter, 'yyyy-MM-dd', new Date());
      if (isValid(filterDate)) {
        const quoteDate = parse(quote.DocDate, 'yyyyMMdd', new Date());
        matchesDate = format(quoteDate, 'yyyy-MM-dd') === format(filterDate, 'yyyy-MM-dd');
      }
    }

    return matchesSearch && matchesDate;
  });

  const indexOfLastQuotation = currentPage * quotationsPerPage;
  const indexOfFirstQuotation = indexOfLastQuotation - quotationsPerPage;
  const currentQuotations = filteredQuotations.slice(indexOfFirstQuotation, indexOfLastQuotation);
  const totalPages = Math.ceil(filteredQuotations.length / quotationsPerPage);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDateFilter = (e) => {
    setDateFilter(e.target.value);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDateFilter('');
    setCurrentPage(1);
  };

  const sortQuotations = (quotations) => {
    return [...quotations].sort((a, b) => {
      let compareA = a[sortField];
      let compareB = b[sortField];

      // Special handling for dates
      if (sortField === 'DocDate') {
        compareA = parseInt(compareA);
        compareB = parseInt(compareB);
      }

      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (field) => {
    setSortDirection(sortField === field && sortDirection === 'asc' ? 'desc' : 'asc');
    setSortField(field);
  };

  const getSortIcon = (direction) => {
    return direction === 'asc' ? 
      <CaretUpFill className="ms-1" /> : 
      <CaretDownFill className="ms-1" />;
  };

  const headerStyle = {
    cursor: 'pointer',
    userSelect: 'none',
    backgroundColor: '#f8f9fa',
    position: 'relative',
    padding: '12px 8px',
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading quotations...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error Loading Quotations</Alert.Heading>
        <p>{error}</p>
        {retryCount > 0 && <p>Retrying... Attempt {retryCount} of 2</p>}
      </Alert>
    );
  }

  if (!quotations.length) {
    return (
      <Alert variant="info">
        No quotations found for this customer (ID: {customerId}).
      </Alert>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-3">
        <Col md={6}>
          <InputGroup className="mb-3">
            <InputGroup.Text>
              <Search />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search quotations..."
              value={searchTerm}
              onChange={handleSearch}
            />
            {searchTerm && (
              <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
                <XCircle />
              </Button>
            )}
          </InputGroup>
          <InputGroup>
            <InputGroup.Text>
              <Calendar />
            </InputGroup.Text>
            <Form.Control
              type="date"
              value={dateFilter}
              onChange={handleDateFilter}
              style={{ maxWidth: '200px' }}
            />
            {dateFilter && (
              <Button 
                variant="outline-secondary" 
                onClick={() => setDateFilter('')}
                style={{ flexShrink: 0 }}
              >
                <XCircle />
              </Button>
            )}
          </InputGroup>
        </Col>
      </Row>
      <Row>
        <Col>
          <div className="table-responsive">
            <Table striped bordered hover className="shadow-sm">
              <thead className="bg-light">
                <tr>
                  <th onClick={() => handleSort('DocNum')} style={headerStyle}>
                    Quotation Number {sortField === 'DocNum' && getSortIcon(sortDirection)}
                  </th>
                  <th onClick={() => handleSort('DocDate')} style={headerStyle}>
                    Date {sortField === 'DocDate' && getSortIcon(sortDirection)}
                  </th>
                  <th onClick={() => handleSort('DocStatus')} style={headerStyle}>
                    Status {sortField === 'DocStatus' && getSortIcon(sortDirection)}
                  </th>
                  <th onClick={() => handleSort('DocTotal')} style={headerStyle}>
                    Total {sortField === 'DocTotal' && getSortIcon(sortDirection)}
                  </th>
                  <th onClick={() => handleSort('subject')} style={headerStyle}>
                    Subject {sortField === 'subject' && getSortIcon(sortDirection)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortQuotations(filteredQuotations)
                  .slice(indexOfFirstQuotation, indexOfLastQuotation)
                  .map((quote) => (
                    <tr key={quote.DocNum} className="align-middle">
                      <td className="fw-bold text-primary">{quote.DocNum}</td>
                      <td>{formatDate(quote.DocDate)}</td>
                      <td>
                        <span className={`badge ${quote.DocStatus === 'C' ? 'bg-secondary' : 'bg-success'}`}>
                          {quote.DocStatus === 'C' ? 'Closed' : 'Open'}
                        </span>
                      </td>
                      <td className="text-end">{formatCurrency(quote.DocTotal)}</td>
                      <td style={{ maxWidth: '300px' }} className="text-wrap">
                        {quote.subject || 'N/A'}
                      </td>
                    </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>
      {totalPages > 1 && (
        <Row className="mt-3">
          <Col>
            <Pagination className="justify-content-center">
              <Pagination.First 
                onClick={() => setCurrentPage(1)} 
                disabled={currentPage === 1}
              />
              <Pagination.Prev 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              />
              {[...Array(totalPages).keys()].map((number) => (
                <Pagination.Item
                  key={number + 1}
                  active={number + 1 === currentPage}
                  onClick={() => setCurrentPage(number + 1)}
                >
                  {number + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              />
              <Pagination.Last 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default QuotationsTab;
