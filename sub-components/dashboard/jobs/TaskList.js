import React, { useState, useEffect } from "react";
import { Form, Row, Col, Button, Table } from "react-bootstrap";
import Select from "react-select";
import { FaTrash, FaEdit } from "react-icons/fa";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { db } from "../../../firebase";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/router";

const TaskList = ({ workers, jobNo }) => {
  const [editingTask, setEditingTask] = useState(null);
  const [taskList, setTaskList] = useState([]);

  const [newTask, setNewTask] = useState({
    taskID: "",
    taskName: "",
    taskDescription: "",
    assignedTo: null,
    isPriority: false,
    isDone: false,
    completionDate: null,
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "jobs", jobNo), // Listen to the job document with the dynamic jobNo
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const jobData = docSnapshot.data();
          //console.log("Real-time Job Data:", jobData);

          // Ensure taskList is an array and handle errors gracefully
          if (Array.isArray(jobData.taskList)) {
            setTaskList(jobData.taskList); // Update the task list in real-time
          } else {
            console.error("taskList is not an array or is undefined");
            setTaskList([]); // Default to an empty array if taskList is not valid
          }
        } else {
          console.error("Job not found");
        }
      },
      (error) => {
        console.error("Error listening to job document:", error);
      }
    );

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, [jobNo]); // The effect will run when jobNo changes

  const handleAddTask = async () => {
    if (!newTask.taskName.trim()) {
      toast.error("Task name is required");
      return;
    }

    const taskId = `task-${Date.now()}`;
    const newTaskData = { ...newTask, taskID: taskId };

    // Add task to the taskList array
    try {
      const docRef = doc(db, "jobs", jobNo); // Reference to the job document
      await updateDoc(docRef, {
        taskList: [...taskList, newTaskData], // Append new task to the existing taskList
      });

      // Update local state
      setTaskList([...taskList, newTaskData]);
      setNewTask({
        taskID: "",
        taskName: "",
        taskDescription: "",
        assignedTo: null,
        isPriority: false,
        isDone: false,
        completionDate: null,
      });

      toast.success("Task added successfully!");
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to add task");
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setNewTask(task);
  };

  const handleUpdateTask = async () => {
    const updatedTasks = taskList.map((task) =>
      task.taskID === editingTask.taskID ? newTask : task
    );

    // Update task in Firestore
    try {
      const docRef = doc(db, "jobs", jobNo); // Reference to the job document
      await updateDoc(docRef, {
        taskList: updatedTasks, // Replace the entire taskList with the updated one
      });

      // Update local state
      setTaskList(updatedTasks);
      setEditingTask(null);
      setNewTask({
        taskID: "",
        taskName: "",
        taskDescription: "",
        assignedTo: null,
        isPriority: false,
        isDone: false,
        completionDate: null,
      });

      toast.success("Task updated successfully!");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Remove task from the taskList array
          const updatedTasks = taskList.filter(
            (task) => task.taskID !== taskId
          );

          // Update the taskList in Firestore
          const docRef = doc(db, "jobs", jobNo); // Reference to the job document
          await updateDoc(docRef, {
            taskList: updatedTasks, // Replace taskList with the updated array
          });

          // Update local state
          setTaskList(updatedTasks);
          toast.success("Task deleted successfully");
        } catch (error) {
          console.error("Error deleting task:", error);
          toast.error("Failed to delete task");
        }
      }
    });
  };

  return (
    <div>
      <Row className="mb-3">
        <Col md={12}>
          <h5>Task List</h5>
          <p className="text-muted">Add tasks for this job</p>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Task Name</Form.Label>
            <Form.Control
              type="text"
              value={newTask.taskName}
              onChange={(e) =>
                setNewTask({ ...newTask, taskName: e.target.value })
              }
              placeholder="Enter task name"
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control
              type="text"
              value={newTask.taskDescription}
              onChange={(e) =>
                setNewTask({ ...newTask, taskDescription: e.target.value })
              }
              placeholder="Enter task description"
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label>Assigned To</Form.Label>
            <Select
              value={
                workers.find((w) => w.value === newTask.assignedTo) || null
              }
              onChange={(selected) =>
                setNewTask({
                  ...newTask,
                  assignedTo: selected ? selected.value : null,
                })
              }
              options={workers}
              placeholder="Select worker"
              isClearable
            />
          </Form.Group>
        </Col>
        <Col md={1} className="d-flex align-items-end">
          <Button
            variant="primary"
            onClick={editingTask ? handleUpdateTask : handleAddTask}
            className="w-100"
          >
            {editingTask ? "Update" : "Add"}
          </Button>
        </Col>
      </Row>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Task Name</th>
            <th>Description</th>
            <th>Assigned To</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {taskList.map((task) => (
            <tr key={task.taskID}>
              <td>{task.taskName}</td>
              <td>{task.taskDescription}</td>
              <td>
                {workers.find((w) => w.value === task.assignedTo)?.label ||
                  "Unassigned"}
              </td>
              <td>
                <Form.Check
                  type="switch"
                  checked={task.isPriority}
                  onChange={(e) => {
                    const updatedTasks = taskList.map((t) =>
                      t.taskID === task.taskID
                        ? { ...t, isPriority: e.target.checked }
                        : t
                    );
                    setTaskList(updatedTasks);
                  }}
                />
              </td>
              <td>
                <Form.Check
                  type="switch"
                  checked={task.isDone}
                  onChange={(e) => {
                    const updatedTasks = taskList.map((t) =>
                      t.taskID === task.taskID
                        ? { ...t, isDone: e.target.checked }
                        : t
                    );
                    setTaskList(updatedTasks);
                  }}
                />
              </td>
              <td>
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="me-2"
                  onClick={() => handleEditTask(task)}
                >
                  <FaEdit />
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDeleteTask(task.taskID)}
                >
                  <FaTrash />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default TaskList;
