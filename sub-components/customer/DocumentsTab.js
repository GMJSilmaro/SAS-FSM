import React from 'react';
import { Row, Col, Table, Button, Badge } from 'react-bootstrap';
import { FileText, Download } from 'lucide-react';

export const DocumentsTab = ({ customerData }) => {
  // Sample documents data
  const sampleDocuments = [
    {
      id: 1,
      name: 'Service Agreement Contract',
      type: 'PDF',
      uploadDate: '2024-03-15',
      size: '2.4 MB',
      status: 'Active',
      url: '#'
    },
    {
      id: 2,
      name: 'Warranty Certificate',
      type: 'PDF',
      uploadDate: '2024-03-10',
      size: '1.1 MB',
      status: 'Active',
      url: '#'
    },
    {
      id: 3,
      name: 'Equipment Installation Report',
      type: 'PDF',
      uploadDate: '2024-02-28',
      size: '3.8 MB',
      status: 'Active',
      url: '#'
    },
    {
      id: 4,
      name: 'Maintenance Schedule 2024',
      type: 'XLSX',
      uploadDate: '2024-01-15',
      size: '856 KB',
      status: 'Active',
      url: '#'
    },
    {
      id: 5,
      name: 'Product Specifications',
      type: 'PDF',
      uploadDate: '2024-01-10',
      size: '1.5 MB',
      status: 'Active',
      url: '#'
    }
  ];

  const handleDownload = (documentUrl) => {
    // Implement document download logic here
    console.log('Downloading document:', documentUrl);
  };

  const getTypeColor = (type) => {
    const colors = {
      'PDF': 'danger',
      'XLSX': 'success',
      'DOC': 'primary',
      'DOCX': 'primary',
      'JPG': 'info',
      'PNG': 'info'
    };
    return colors[type] || 'secondary';
  };

  return (
    <Row className="p-4">
      <Col>
        <div className="d-flex align-items-center mb-4">
          <FileText size={24} className="me-2" />
          <h3 className="mb-0">Customer Documents</h3>
        </div>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Document Name</th>
              <th style={{ width: '100px' }}>Type</th>
              <th style={{ width: '150px' }}>Upload Date</th>
              <th style={{ width: '100px' }}>Size</th>
              <th style={{ width: '100px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {sampleDocuments.map((doc) => (
              <tr key={doc.id}>
                <td>
                  <div className="fw-medium">{doc.name}</div>
                </td>
                <td>
                  <Badge bg={getTypeColor(doc.type)}>{doc.type}</Badge>
                </td>
                <td>{new Date(doc.uploadDate).toLocaleDateString()}</td>
                <td>{doc.size}</td>
                <td>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={() => handleDownload(doc.url)}
                    className="d-flex align-items-center gap-2"
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Col>
    </Row>
  );
};

export default DocumentsTab;