import React, { useState, useEffect } from 'react';
import { Form, Button, Card, ListGroup, Row, Col, InputGroup, Modal, Toast, ToastContainer, Pagination, Badge } from 'react-bootstrap';
import { collection, query, orderBy, onSnapshot, doc, setDoc, serverTimestamp, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trash, PencilSquare, Plus, Save, X, Tags, Search } from 'react-bootstrap-icons';
import { formatDistanceToNow } from 'date-fns';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { AllNotesTable } from './AllNotesTable';

export const NotesTab = ({ customerId }) => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [latestNote, setLatestNote] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTag, setNewTag] = useState('');

  const [availableTags, setAvailableTags] = useState(['Important', 'Follow-up', 'Resolved', 'Pending', 'Question']);

  const [userEmail, setUserEmail] = useState('');

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [notesPerPage] = useState(3);
  const [searchTerm, setSearchTerm] = useState('');

  const [showAllNotes, setShowAllNotes] = useState(false);

  useEffect(() => {
    // Retrieve email from cookies
    const emailFromCookie = Cookies.get('email');
    setUserEmail(emailFromCookie || 'Unknown');
  }, []);

  useEffect(() => {
    const notesRef = collection(db, `customers/${customerId}/notes`);
    const q = query(notesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotes(fetchedNotes);
      if (fetchedNotes.length > 0) {
        setLatestNote(fetchedNotes[0]);
      }
    });

    return () => unsubscribe();
  }, [customerId]);

  // Filter notes based on search term
  const filteredNotes = notes.filter(note =>
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
    note.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get current notes for pagination
  const indexOfLastNote = currentPage * notesPerPage;
  const indexOfFirstNote = indexOfLastNote - notesPerPage;
  const currentNotes = filteredNotes.slice(indexOfFirstNote, indexOfLastNote);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Add this function to calculate total pages
  const totalPages = Math.ceil(filteredNotes.length / notesPerPage);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (newNote.trim() === '') {
      toast.error('Please enter a note before adding.');
      return;
    }

    try {
      const noteRef = doc(collection(db, `customers/${customerId}/notes`));
      await setDoc(noteRef, {
        content: newNote,
        createdAt: serverTimestamp(),
        tags: selectedTags,
        userEmail: userEmail
      });
      setNewNote('');
      setSelectedTags([]);
      setShowTagModal(false);
      toast.success('Note added successfully!');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Error adding note. Please try again.');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteDoc(doc(db, `customers/${customerId}/notes`, noteId));
      if (latestNote && latestNote.id === noteId) {
        setLatestNote(notes.length > 1 ? notes[1] : null);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleEditNote = async (updatedNote) => {
    if (updatedNote.content.trim() === '') return;

    try {
      const noteRef = doc(db, `customers/${customerId}/notes`, updatedNote.id);
      await updateDoc(noteRef, {
        content: updatedNote.content,
        updatedAt: serverTimestamp(),
      });
      setEditingNote(null);
      toast.success('Note updated successfully!');
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Error updating note. Please try again.');
    }
  };

  const handleSaveEdit = async () => {
    if (newNote.trim() === '') return;

    try {
      const noteRef = doc(db, `customers/${customerId}/notes`, editingNote.id);
      await updateDoc(noteRef, {
        content: newNote,
        updatedAt: serverTimestamp(),
        tags: selectedTags
      });
      setEditingNote(null);
      setNewNote('');
      setSelectedTags([]);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setNewNote('');
    setSelectedTags([]);
  };

  const handleTagSelection = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddNewTag = () => {
    if (newTag.trim() !== '' && !availableTags.includes(newTag.trim())) {
      const trimmedTag = newTag.trim();
      setAvailableTags(prev => [...prev, trimmedTag]);
      setSelectedTags(prev => [...prev, trimmedTag]);
      setNewTag('');
      setShowToast(true);
      setToastMessage(`New tag "${trimmedTag}" added successfully!`);
    }
  };

  const handleRemoveNewTag = (tagToRemove) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
    setAvailableTags(prev => prev.filter(tag => tag !== tagToRemove));
    setShowToast(true);
    setToastMessage(`Tag "${tagToRemove}" removed successfully!`);
  };

  // Add this function to handle view change
  const handleViewChange = (showAll) => {
    setShowAllNotes(showAll);
    setSearchTerm(''); // Clear search term when changing views
    setCurrentPage(1); // Reset to first page
  };

  return (
    <>
      {!showAllNotes ? (
        <Row className="g-4">
          <Col md={8}>
            <Card className="shadow-sm">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Customer Notes</h5>
              </Card.Header>
              <Card.Body>
                {/* Add search input */}
                <InputGroup className="mb-3">
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

                <ListGroup variant="flush">
                  {currentNotes.map((note) => (
                    <ListGroup.Item key={note.id} className="border-bottom py-3">
                      <Row>
                        {/* Left side: Note content, tags, and email */}
                        <Col xs={9}>
                          {editingNote && editingNote.id === note.id ? (
                            <>
                              <Form.Control
                                as="textarea"
                                rows={3}
                                value={editingNote.content}
                                onChange={(e) => setEditingNote({...editingNote, content: e.target.value})}
                              />
                              <Button variant="outline-secondary" onClick={() => setShowTagModal(true)} className="mt-2">
                                <Tags /> Edit Tags
                              </Button>
                            </>
                          ) : (
                            <>
                              <p className="mb-1">{note.content}</p>
                              {note.tags && note.tags.length > 0 && (
                                <div className="mb-2">
                                  {note.tags.map((tag, index) => (
                                    <Badge key={index} bg="secondary" className="me-1">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <small className="text-muted d-block mt-2">
                                By: {note.userEmail}
                              </small>
                            </>
                          )}
                        </Col>

                        {/* Right side: Date and action buttons */}
                        <Col xs={3} className="text-end">
                          <div className="mb-2">
                            <small className="text-muted d-block">
                              {note.createdAt?.toDate().toLocaleString() || 'Date not available'}
                            </small>
                          </div>
                          
                          {editingNote && editingNote.id === note.id ? (
                            <div>
                              <Button 
                                variant="success" 
                                size="sm"
                                onClick={() => handleEditNote(editingNote)}
                                className="me-1 mb-1"
                              >
                                <Save /> Save
                              </Button>
                              <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={() => setEditingNote(null)}
                                className="mb-1"
                              >
                                <X /> Cancel
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => setEditingNote(note)}
                                className="me-1 mb-1"
                              >
                                <PencilSquare /> Edit
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleDeleteNote(note.id)}
                                className="mb-1"
                              >
                                <Trash /> Delete
                              </Button>
                            </div>
                          )}
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>

                {/* Replace the existing pagination with this new one */}
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

                <Button 
                  variant="primary" 
                  onClick={() => handleViewChange(true)}
                  className="w-100 mt-3"
                >
                  View All Notes
                </Button>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            {/* <Card className="shadow-sm mb-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Latest Note</h5>
              </Card.Header>
              <Card.Body>
                {latestNote ? (
                  <>
                    <Card.Text>{latestNote.content}</Card.Text>
                    <Card.Subtitle className="text-muted mt-2">
                      {latestNote.createdAt?.toDate().toLocaleString() || 'Date not available'}
                      ({formatDistanceToNow(latestNote.createdAt?.toDate() || new Date(), { addSuffix: true })})
                    </Card.Subtitle>
                    <div className="mt-2">
                      <small className="text-muted">By: {latestNote.userEmail}</small>
                    </div>
                    <div className="mt-2">
                      {latestNote.tags && latestNote.tags.map((tag, index) => (
                        <span key={index} className="badge bg-secondary me-1">{tag}</span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-muted">No notes available</p>
                )}
              </Card.Body>
            </Card> */}
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Add Note</h5>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={editingNote ? handleSaveEdit : handleAddNote}>
                  <Form.Group className="mb-3">
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder={editingNote ? "Edit your note here..." : "Enter your note here..."}
                    />
                  </Form.Group>
                  <Button variant="outline-secondary" onClick={() => setShowTagModal(true)} className="mb-2 w-100">
                    <Tags /> Add Tags
                  </Button>
                  {editingNote ? (
                    <>
                      <Button variant="success" onClick={handleSaveEdit} className="me-2 mb-2">
                        <Save className="me-1" /> Save
                      </Button>
                      <Button variant="secondary" onClick={handleCancelEdit} className="mb-2">
                        <X className="me-1" /> Cancel
                      </Button>
                    </>
                  ) : (
                    <Button variant="primary" type="submit" className="w-100">
                      <Plus className="me-1" /> Add Note
                    </Button>
                  )}
                </Form>
              </Card.Body>
            </Card>

            <Col md={12} className="mt-4">
             
            </Col>
          </Col>
        </Row>
      ) : (
        <AllNotesTable 
          notes={notes} 
          onClose={() => handleViewChange(false)}
          customerId={customerId}
        />
      )}

      <Modal show={showTagModal} onHide={() => setShowTagModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Select Tags</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {availableTags.map((tag, index) => (
            <Button
              key={index}
              variant={selectedTags.includes(tag) ? "primary" : "outline-primary"}
              className="me-2 mb-2"
              onClick={() => handleTagSelection(tag)}
            >
              {tag}
              {!['Important', 'Follow-up', 'Resolved', 'Pending', 'Question'].includes(tag) && (
                <X
                  className="ms-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveNewTag(tag);
                  }}
                />
              )}
            </Button>
          ))}
          <Form.Group className="mt-3">
            <Form.Control
              type="text"
              placeholder="Add new tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
            />
            <Button variant="secondary" className="mt-2" onClick={handleAddNewTag}>
              Add New Tag
            </Button>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTagModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => setShowTagModal(false)}>
            Apply Tags
          </Button>
        </Modal.Footer>
      </Modal>

    
    </>
  );
};
