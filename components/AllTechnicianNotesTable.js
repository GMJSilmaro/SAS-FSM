import React, { useState } from 'react';
import { Table, Button, Form, InputGroup } from 'react-bootstrap';
import { Search } from 'react-bootstrap-icons';
import { formatDistanceToNow } from 'date-fns';

export const AllTechnicianNotesTable = ({ notes, onClose, jobId }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNotes = notes.filter(note =>
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>All Technician Notes</h3>
        <Button variant="secondary" onClick={onClose}>Back to Job Details</Button>
      </div>

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

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Note</th>
            <th>Created By</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {filteredNotes.map((note) => (
            <tr key={note.id}>
              <td>{note.content}</td>
              <td>{note.userEmail}</td>
              <td>
                {note.createdAt.toLocaleString()} 
                ({formatDistanceToNow(note.createdAt, { addSuffix: true })})
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};
