import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Table, Button, Badge, Form, Modal, Spinner, ProgressBar } from 'react-bootstrap';
import { FileText, Download, Upload } from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { toast } from 'react-toastify';
import { db } from '../../firebase';
import * as XLSX from 'xlsx';

export const DocumentsTab = ({ customerData }) => {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [viewDocumentHtml, setViewDocumentHtml] = useState(null);
  const [loading, setLoading] = useState(false);

  const storage = getStorage();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, `customers/${customerData.CardCode}/documents`));
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setShowUploadModal(true);
    setUploadProgress(0);

    try {
      const storageRef = ref(storage, `customers/${customerData.CardCode}/documents/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Error uploading document:', error);
          toast.error('Failed to upload document');
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          const docData = {
            name: file.name,
            type: file.name.split('.').pop().toUpperCase(),
            uploadDate: new Date().toISOString(),
            size: `${(file.size / 1024).toFixed(2)} KB`,
            url: downloadURL
          };

          await addDoc(collection(db, `customers/${customerData.CardCode}/documents`), docData);
          toast.success('Document uploaded successfully');
          fetchDocuments();
          setShowUploadModal(false);
        }
      );
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (document) => {
    setLoading(true);
    
    try {
      if (['XLSX', 'XLS'].includes(document.type)) {
        // For Excel files, open in a new tab
        window.open(document.url, '_blank');
      } else if (['PDF'].includes(document.type)) {
        // For PDFs, open in a new tab
        window.open(document.url, '_blank');
      } else {
        // For other file types, show download prompt
        handleDownload(document.url);
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Failed to view document. Try downloading instead.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseViewModal = () => {
    setViewDocumentHtml(null);
  };

  const handleDownload = (documentUrl) => {
    window.open(documentUrl, '_blank');
  };

  const handleDelete = async (docId, fileName) => {
    try {
      await deleteDoc(doc(db, `customers/${customerData.CardCode}/documents`, docId));
      const storageRef = ref(storage, `customers/${customerData.CardCode}/documents/${fileName}`);
      await deleteObject(storageRef);
      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      'PDF': 'danger',
      'XLSX': 'success',
      'XLS': 'success',
      'DOC': 'primary',
      'DOCX': 'primary',
      'JPG': 'info',
      'PNG': 'info'
    };
    return colors[type] || 'secondary';
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  return (
    <Row className="p-4">
      <Col>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <FileText size={24} className="me-2" />
            <h3 className="mb-0">Customer Documents</h3>
          </div>
          <Button
            variant="primary"
            onClick={handleUploadClick}
            disabled={uploading}
          >
            <Upload size={14} className="me-2" />
            Upload Document
          </Button>
          <Form.Control
            type="file"
            ref={fileInputRef}
            className="d-none"
            onChange={handleUpload}
          />
        </div>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Document Name</th>
              <th style={{ width: '100px' }}>Type</th>
              <th style={{ width: '150px' }}>Upload Date</th>
              <th style={{ width: '100px' }}>Size</th>
              <th style={{ width: '200px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
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
                    onClick={() => handleView(doc)}
                    className="me-2"
                    disabled={loading}
                  >
                    View
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={() => handleDownload(doc.url)}
                    className="me-2"
                  >
                    <Download size={14} className="me-1" />
                    Download
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => handleDelete(doc.id, doc.name)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Col>
      
      {/* Upload Modal */}
      <Modal show={showUploadModal} centered backdrop="static" keyboard={false}>
        <Modal.Body className="text-center">
          <h4>Uploading Document</h4>
          <Spinner animation="border" role="status" className="my-3" />
          <p>Please wait while your document is being uploaded...</p>
          <ProgressBar now={uploadProgress} label={`${Math.round(uploadProgress)}%`} className="mt-3" />
        </Modal.Body>
      </Modal>

      {/* View Document Modal */}
      <Modal show={!!viewDocumentHtml} onHide={handleCloseViewModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>View Document</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div dangerouslySetInnerHTML={{ __html: viewDocumentHtml }} />
        </Modal.Body>
      </Modal>
    </Row>
  );
};

export default DocumentsTab;