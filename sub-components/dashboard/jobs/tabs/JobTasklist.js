import React from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import { BsTrash } from 'react-icons/bs'; // For delete icon

const JobTask = ({ tasks, addTask, handleTaskChange, handleCheckboxChange, deleteTask }) => {
  return (
    <Form>
      <h5 className="mb-3">Job Tasks</h5>
      <Button variant="primary" onClick={addTask}>
        Add Task
      </Button>

      <Table striped bordered hover className="mt-3">
        <thead>
          <tr>
            <th>Delete</th>
            <th>Task Name</th>
            <th>Task Description</th>
            <th>Task Complete</th>
            <th>Priority Task</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, index) => (
            <tr key={index}>
              <td>
                <Button variant="danger" onClick={() => deleteTask(index)}>
                  <BsTrash />
                </Button>
              </td>
              <td>
                <Form.Control
                  type="text"
                  value={task.taskName}
                  onChange={(e) =>
                    handleTaskChange(index, "taskName", e.target.value)
                  }
                  placeholder="Enter task name"
                />
              </td>
              <td>
                <Form.Control
                  as="textarea"
                  value={task.taskDescription}
                  onChange={(e) =>
                    handleTaskChange(index, "taskDescription", e.target.value)
                  }
                  placeholder="Enter task description"
                />
              </td>
              <td>
                <Form.Check
                  type="checkbox"
                  className="d-flex justify-content-center align-items-center"
                  checked={task.isComplete}
                  onChange={() => handleCheckboxChange(index, "isComplete")}
                />
              </td>
              <td>
                <Form.Check
                  type="checkbox"
                  className="d-flex justify-content-center align-items-center"
                  checked={task.isPriority}
                  onChange={() => handleCheckboxChange(index, "isPriority")}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Form>
  );
};

export default JobTask;
