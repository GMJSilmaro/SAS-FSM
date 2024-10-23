import React, { useState, useEffect, useMemo, Fragment } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Badge,
  Image,
  Tooltip,
  OverlayTrigger,
} from "react-bootstrap";
import { useRouter } from "next/router";
import { toast, ToastContainer } from "react-toastify";

// Import utility functions
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../firebase";

// DataTable component
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";

const WorkersListItems = () => {
  const [workers, setWorkers] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchWorkers = async () => {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      const workersData = snapshot.docs.map((doc, index) => {
        const address = doc.data().address || {}; // Access the address map safely

        return {
          id: doc.id,
          index: index + 1, // Index starting from 1
          name: doc.data().fullName,
          profilePicture: doc.data().profilePicture,
          workerId: doc.data().workerId,
          email: doc.data().email,
          primaryPhone: doc.data().primaryPhone,
          address: `${address.streetAddress || ""}, ${
            address.stateProvince || ""
          }, ${address.postalCode || ""}`, // Concatenate address fields
          skills: doc.data().skills,
          isActive: doc.data().activeUser,
        };
      });

      setWorkers(workersData);
      setFilteredWorkers(workersData);
      setLoading(false);
    };

    fetchWorkers();
  }, []);

  useEffect(() => {
    const result = workers.filter((worker) => {
      return (
        (worker.name &&
          worker.name.toLowerCase().includes(search.toLowerCase())) ||
        (worker.workerId &&
          worker.workerId.toLowerCase().includes(search.toLowerCase())) ||
        (worker.email &&
          worker.email.toLowerCase().includes(search.toLowerCase())) ||
        (worker.primaryPhone &&
          worker.primaryPhone.toLowerCase().includes(search.toLowerCase())) ||
        (worker.address &&
          worker.address.toLowerCase().includes(search.toLowerCase())) ||
        (Array.isArray(worker.skills) &&
          worker.skills
            .join(", ")
            .toLowerCase()
            .includes(search.toLowerCase())) ||
        worker.isActive.toString() === search.toLowerCase() // Search by active status as well
      );
    });

    setFilteredWorkers(result);
  }, [search, workers]);

  // Function to handle row click
  const handleRowClick = (workerId) => {
    Swal.fire({
      title: "Choose an action",
      text: "Do you want to edit or remove this worker?",
      icon: "question",
      showCancelButton: true,
      backdrop: true, // Enables backdrop clicking to close the alert
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Edit",
      cancelButtonText: "Remove",
    }).then(async (result) => {
      // Check if the user confirmed the edit action
      if (result.isConfirmed) {
        // Navigate to the edit page
        router.push(`/dashboard/workers/${workerId}`);
      }
      // Only proceed to delete if the user clicked the cancel button
      else if (
        result.isDismissed &&
        result.dismiss === Swal.DismissReason.cancel
      ) {
        // Confirm before deletion
        const deleteResult = await Swal.fire({
          title: "Are you sure?",
          text: "Do you want to remove this worker? This action cannot be undone.",
          icon: "warning",
          showCancelButton: true,
          backdrop: true, // Enables backdrop clicking to close the alert
          confirmButtonColor: "#d33",
          cancelButtonColor: "#3085d6",
          confirmButtonText: "Yes, remove it!",
        });

        if (deleteResult.isConfirmed) {
          try {
            const workerRef = doc(db, "users", workerId);
            await deleteDoc(workerRef);
            Swal.fire("Deleted!", "The worker has been removed.", "success");
            // Update state after deletion
            setWorkers(
              workers.filter((worker) => worker.workerId !== workerId)
            );
            setFilteredWorkers(
              filteredWorkers.filter((worker) => worker.workerId !== workerId)
            );
          } catch (error) {
            console.error("Error removing document: ", error);
            Swal.fire(
              "Error!",
              "There was a problem removing the worker.",
              "error"
            );
          }
        }
      }
    });
  };

  // Table columns
  const columns = [
    {
      name: "#",
      selector: (row) => row.index,
      sortable: true,
      width: "60px",
    },
    {
      name: "W-ID",
      selector: (row) => row.workerId,
      sortable: true,
      width: "100px",
    },
    {
      name: "Name",
      cell: (row) => (
        <div className="d-flex align-items-center">
          <Image
            src={row.profilePicture}
            alt="profile"
            className="rounded-circle avatar-md me-2"
            style={{ width: "40px", height: "40px", objectFit: "cover" }}
          />
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip id={`tooltip-${row.id}-name`}>{row.name}</Tooltip>
            }
          >
            <span
              className="mb-0 text-truncate fw-bold"
              style={{ maxWidth: "200px" }}
            >
              {row.name}
            </span>
          </OverlayTrigger>
        </div>
      ),
      sortable: true,
      width: "250px",
    },
    {
      name: "Email",
      cell: (row) => (
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip id={`tooltip-${row.id}-email`}>{row.email}</Tooltip>
          }
        >
          <span
            className="text-truncate"
            style={{ maxWidth: "200px", cursor: "pointer" }}
            onClick={() => {
              navigator.clipboard.writeText(row.email);
              toast.success(`Email copied to clipboard: ${row.email}`, {
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              });
            }}
          >
            {row.email}
          </span>
        </OverlayTrigger>
      ),
      sortable: true,
      width: "200px",
    },
    {
      name: "Primary Phone",
      selector: (row) => row.primaryPhone,
      sortable: true,
      width: "150px",
    },
    {
      name: "Address",
      cell: (row) => (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id={`tooltip-${row.id}`}>{row.address}</Tooltip>}
        >
          <div className="text-truncate" style={{ maxWidth: "220px" }}>
            {row.address}
          </div>
        </OverlayTrigger>
      ),
      sortable: true,
      width: "240px",
    },
    {
      name: "Skills",
      cell: (row) => (
        <div className="d-flex flex-wrap gap-1">
          {Array.isArray(row.skills) && row.skills.length > 0 ? (
            row.skills.map((skill, index) => (
              <Badge pill bg="primary" className="me-1 mb-1" key={index}>
                {skill}
              </Badge>
            ))
          ) : (
            <Badge pill bg="secondary" className="me-1 mb-1">
              None
            </Badge>
          )}
        </div>
      ),
      width: "150px",
    },
    {
      name: "Status",
      cell: (row) =>
        row.isActive ? (
          <Badge pill bg="success" className="me-1">
            Active
          </Badge>
        ) : (
          <Badge pill bg="danger" className="me-1">
            Inactive
          </Badge>
        ),
      width: "80px",
    },
  ];

  const subHeaderComponentMemo = useMemo(() => {
    return (
      <Fragment>
        <input
          type="text"
          className="form-control me-4 mb-4"
          placeholder="Search Workers"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Fragment>
    );
  }, [search]);

  const customStyles = {
    headCells: {
      style: {
        fontWeight: "bold",
        fontSize: "14px",
        backgroundColor: "#F1F5FC",
      },
    },
    cells: {
      style: {
        color: "#64748b",
        fontSize: "14px",
      },
    },
  };

  return (
    <Fragment>
      <Row>
        <Col md={12} xs={12} className="mb-5">
          <Card>
            <Card.Body className="px-4 py-4">
              {loading ? (
                <div className="text-center">Loading...</div>
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredWorkers}
                  pagination
                  highlightOnHover
                  onRowClicked={(row) => handleRowClick(row.id)} // Make the whole row clickable
                  customStyles={customStyles}
                  subHeader
                  subHeaderComponent={subHeaderComponentMemo}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <ToastContainer />
    </Fragment>
  );
};

export default WorkersListItems;
