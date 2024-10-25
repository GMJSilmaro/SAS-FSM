import React, { useState, useEffect } from 'react';
import { Form, Button, Card, ListGroup, Row, Col, InputGroup, Modal, Toast, ToastContainer } from 'react-bootstrap';
import { collection, query, orderBy, onSnapshot, doc, setDoc, serverTimestamp, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trash, PencilSquare, Plus, Save, X, Tags } from 'react-bootstrap-icons';
import { formatDistanceToNow } from 'date-fns';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

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

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (newNote.trim() === '') return;

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

  const handleEditNote = (note) => {
    setEditingNote(note);
    setNewNote(note.content);
    setSelectedTags(note.tags || []);
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

  return (
    <>
      <Row className="g-4">
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Customer Notes</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={editingNote ? handleSaveEdit : handleAddNote} className="mb-4">
                <InputGroup>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder={editingNote ? "Edit your note here..." : "Enter your note here..."}
                  />
                  <Button variant="outline-secondary" onClick={() => setShowTagModal(true)}>
                    <Tags /> Add Tags
                  </Button>
                  {editingNote ? (
                    <>
                      <Button variant="success" onClick={handleSaveEdit}>
                        <Save className="me-1" /> Save
                      </Button>
                      <Button variant="secondary" onClick={handleCancelEdit}>
                        <X className="me-1" /> Cancel
                      </Button>
                    </>
                  ) : (
                    <Button variant="primary" type="submit">
                      <Plus className="me-1" /> Add Note
                    </Button>
                  )}
                </InputGroup>
              </Form>

              <ListGroup variant="flush">
                {notes.map((note) => (
                  <ListGroup.Item 
                    key={note.id} 
                    className="border-bottom py-3"
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="me-3">
                        <p className="mb-1">{note.content}</p>
                        <small className="text-muted">
                          {note.createdAt?.toDate().toLocaleString() || 'Date not available'} 
                          ({formatDistanceToNow(note.createdAt?.toDate() || new Date(), { addSuffix: true })})
                        </small>
                        <div>
                          <small className="text-muted">By: {note.userEmail}</small>
                        </div>
                        <div>
                          {note.tags && note.tags.map((tag, index) => (
                            <span key={index} className="badge bg-secondary me-1">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div>
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
                          onClick={() => handleEditNote(note)}
                        >
                          <PencilSquare />
                        </Button>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm">
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
          </Card>
        </Col>
      </Row>

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
          <div className="mt-3">
            <h6>Newly Added Tags:</h6>
            {selectedTags.filter(tag => !availableTags.includes(tag)).map((tag, index) => (
              <Button
                key={index}
                variant="outline-danger"
                size="sm"
                className="me-2 mb-2"
                onClick={() => handleRemoveNewTag(tag)}
              >
                {tag} <X />
              </Button>
            ))}
          </div>
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

      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1 }}>
        <Toast show={showToast} onClose={() => setShowToast(false)} delay={3000} autohide>
          <Toast.Header>
            <strong className="me-auto">Notification</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};
