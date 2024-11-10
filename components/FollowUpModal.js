import React, { useState } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { db } from "../firebase";
import { doc, updateDoc, serverTimestamp, increment } from "firebase/firestore";
import { toast } from "react-toastify";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const FollowUpModal = ({ 
  show, 
  onHide, 
  jobId, 
  technicianId, 
  technicianName 
}) => {
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [dueDate, setDueDate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const jobRef = doc(db, "jobs", jobId);
      
      const followUpData = {
        id: `followup-${Date.now()}`,
        type,
        status: "Logged",
        notes,
        priority,
        dueDate: dueDate ? dueDate.toISOString() : null,
        technicianId,
        technicianName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignedCSOId: null,
        assignedCSOName: null
      };

      await updateDoc(jobRef, {
        [`followUps.${followUpData.id}`]: followUpData,
        followUpCount: increment(1),
        lastFollowUp: serverTimestamp(),
        [`subStatus.${type.toLowerCase()}`]: true
      });

      toast.success("Follow-up created successfully!");
      onHide();
      
      setType('');
      setNotes('');
      setPriority('Normal');
      setDueDate(null);

    } catch (error) {
      console.error('Error creating follow-up:', error);
      toast.error("Failed to create follow-up");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Create Follow-up</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Type</Form.Label>
            <Form.Select 
              value={type} 
              onChange={(e) => setType(e.target.value)}
              required
            >
              <option value="">Select Type</option>
              <option value="Appointment">Appointment</option>
              <option value="Repair">Repair</option>
              <option value="Contract">Contract</option>
              <option value="Verify Customer">Verify Customer</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Priority</Form.Label>
            <Form.Select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Due Date</Form.Label>
            <DatePicker
              selected={dueDate}
              onChange={(date) => setDueDate(date)}
              className="form-control"
              dateFormat="MMM d, yyyy"
              minDate={new Date()}
              placeholderText="Select due date"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter follow-up details..."
              required
            />
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onHide}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Creating...
                </>
              ) : (
                'Create Follow-up'
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default FollowUpModal; 