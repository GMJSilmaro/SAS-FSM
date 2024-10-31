import React, { useState } from 'react';
import { Table, Button, Form, InputGroup, Pagination, Container, Row, Col } from 'react-bootstrap';
import { formatDistanceToNow } from 'date-fns';
import { Trash, PencilSquare, Search, ArrowLeft, Check, X } from 'react-bootstrap-icons';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-toastify';

export const AllNotesTable = ({ notes, onClose, customerId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [notesPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc'
  });

  const filteredNotes = notes.filter(note =>
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
    note.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (sortConfig.key === 'createdAt') {
      const dateA = a.createdAt?.toDate() || new Date();
      const dateB = b.createdAt?.toDate() || new Date();
      return sortConfig.direction === 'asc' 
        ? dateA - dateB 
        : dateB - dateA;
    }
    if (sortConfig.key === 'tags') {
      const tagsA = a.tags?.join(', ') || '';
      const tagsB = b.tags?.join(', ') || '';
      return sortConfig.direction === 'asc'
        ? tagsA.localeCompare(tagsB)
        : tagsB.localeCompare(tagsA);
    }
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const indexOfLastNote = currentPage * notesPerPage;
  const indexOfFirstNote = indexOfLastNote - notesPerPage;
  const currentNotes = sortedNotes.slice(indexOfFirstNote, indexOfLastNote);
  const totalPages = Math.ceil(filteredNotes.length / notesPerPage);

  const startEditing = (note) => {
    setEditingNoteId(note.id);
    setEditedContent(note.content);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditedContent('');
  };

  const handleEditNote = async (note) => {
    if (editedContent.trim() === '') return;

    try {
      const noteRef = doc(db, `customers/${customerId}/notes`, note.id);
      await updateDoc(noteRef, {
        content: editedContent,
        updatedAt: serverTimestamp(),
      });
      setEditingNoteId(null);
      setEditedContent('');
      toast.success('Note updated successfully!');
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Error updating note. Please try again.');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteDoc(doc(db, `customers/${customerId}/notes`, noteId));
      toast.success('Note deleted successfully!');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Error deleting note. Please try again.');
    }
  };

  return (
    <Container fluid>
      <Row className="mb-3">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>All Notes</h2>
            <Button variant="outline-secondary" onClick={onClose}>
              <ArrowLeft /> Back to Summary
            </Button>
          </div>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <Search />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
      </Row>

      <Row>
        <Col>
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th onClick={() => requestSort('content')} style={{ cursor: 'pointer' }}>
                    Content {sortConfig.key === 'content' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => requestSort('userEmail')} style={{ cursor: 'pointer' }}>
                    User {sortConfig.key === 'userEmail' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => requestSort('createdAt')} style={{ cursor: 'pointer' }}>
                    Date {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => requestSort('tags')} style={{ cursor: 'pointer' }}>
                    Tags {sortConfig.key === 'tags' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentNotes.map((note) => (
                  <tr key={note.id}>
                    <td>
                      {editingNoteId === note.id ? (
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                        />
                      ) : (
                        note.content
                      )}
                    </td>
                    <td>{note.userEmail}</td>
                    <td>
                      {note.createdAt?.toDate().toLocaleString() || 'Date not available'}
                      <br />
                      <small>
                        ({formatDistanceToNow(note.createdAt?.toDate() || new Date(), { addSuffix: true })})
                      </small>
                    </td>
                    <td>
                      {note.tags && note.tags.map((tag, index) => (
                        <span key={index} className="badge bg-secondary me-1">{tag}</span>
                      ))}
                    </td>
                    <td>
                      {editingNoteId === note.id ? (
                        <>
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            onClick={() => handleEditNote(note)}
                            className="me-2"
                          >
                            <Check />
                          </Button>
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={cancelEditing}
                          >
                            <X />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDeleteNote(note.id)}
                            className="me-2"
                          >
                            <Trash />
                          </Button>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => startEditing(note)}
                          >
                            <PencilSquare />
                          </Button>
                        </>
                      )}
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
