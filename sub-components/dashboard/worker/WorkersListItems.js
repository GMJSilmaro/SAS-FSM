import React, { useState, useEffect, useMemo, Fragment } from "react";
import {
  Row,
  Col,
  Card,
  Badge,
  Image,
  Tooltip,
  OverlayTrigger,
  Spinner,
} from "react-bootstrap";
import { useRouter } from "next/router";
import { toast, ToastContainer } from "react-toastify";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../firebase";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import { Search } from 'react-feather';
import { format } from 'date-fns'; // Add this import for date formatting

const WorkersListItems = () => {
  const [workers, setWorkers] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false); // Add this state

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        const workersData = snapshot.docs.map((doc, index) => {
          const data = doc.data();
          return {
            id: doc.id,
            index: index + 1,
            fullName: data.fullName,
            profilePicture: data.profilePicture,
            workerId: data.workerId,
            email: data.email,
            primaryPhone: data.primaryPhone,
            address: `${data.address?.streetAddress || ""}, ${data.address?.stateProvince || ""}, ${data.address?.postalCode || ""}`,
            skills: data.skills,
            isActive: data.activeUser,
            role: data.role,
            gender: data.gender,
            dateOfBirth: data.dateOfBirth,
            expirationDate: data.expirationDate,
            isAdmin: data.isAdmin,
            isFieldWorker: data.isFieldWorker,
            joinDate: data.timestamp ? new Date(data.timestamp.toDate()) : new Date(),
          };
        });

        console.log("Fetched workers data:", workersData);
        setWorkers(workersData);
        setFilteredWorkers(workersData);
      } catch (error) {
        console.error("Error fetching workers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  useEffect(() => {
    const result = workers.filter((worker) => {
      return (
        (worker.fullName &&
          worker.fullName.toLowerCase().includes(search.toLowerCase())) ||
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
    console.log("Filtered workers:", result); // Debug log
  }, [search, workers]);

  const handleRowClick = async (row) => {
    const result = await Swal.fire({
      html: `
        <div class="text-center">
          <img src="${row.profilePicture}" alt="${row.fullName}" class="rounded-circle mb-3" style="width: 80px; height: 80px; object-fit: cover;">
          <h5 class="mb-1">${row.fullName}</h5>
          <p class="text-muted mb-4">${row.workerId}</p>
          <div class="d-grid gap-2">
            <button class="btn btn-primary" id="viewBtn">
              <i class="fas fa-eye me-2"></i>View Worker
            </button>
            <button class="btn btn-warning" id="editBtn">
              <i class="fas fa-edit me-2"></i>Edit Worker
            </button>
            <button class="btn btn-outline-danger" id="removeBtn">
              <i class="fas fa-trash-alt me-2"></i>Remove Worker
            </button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCloseButton: true,
      width: '300px',
      customClass: {
        container: 'worker-action-modal',
        closeButton: 'position-absolute top-0 end-0 mt-2 me-2',
      },
      didOpen: () => {
        document.getElementById('viewBtn').addEventListener('click', () => {
          Swal.close();
          router.push(`/dashboard/workers/${row.id}`);
        });
        document.getElementById('editBtn').addEventListener('click', async () => {
          setIsEditing(true); // Ensure this is called
          Swal.close();
          await router.push(`/dashboard/workers/${row.id}`);
          setIsEditing(false); // Ensure this is called
        });
        document.getElementById('removeBtn').addEventListener('click', () => {
          Swal.close();
          handleRemoveWorker(row);
        });
      }
    });
  };

  const handleRemoveWorker = async (row) => {
    const confirmDelete = await Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
    });

    if (confirmDelete.isConfirmed) {
      try {
        await deleteDoc(doc(db, "users", row.id));
        setWorkers(workers.filter(w => w.id !== row.id));
        setFilteredWorkers(filteredWorkers.filter(w => w.id !== row.id));
        toast.success('Worker removed successfully', {
          position: "top-right",
          className: 'bg-success text-white'
        });
      } catch (error) {
        console.error("Error removing worker:", error);
        toast.error('Error removing worker', {
          position: "top-right",
          className: 'bg-danger text-white'
        });
      }
    }
  };

  const columns = [
    {
      name: "#",
      selector: (row) => row.index,
      sortable: true,
      width: "60px",
      cell: row => <span className="text-muted">{row.index}</span>
    },
    {
      name: "Worker ID",
      selector: (row) => row.workerId,
      sortable: true,
      width: "130px",
      cell: row => <span className="badge bg-light text-dark">{row.workerId}</span>
    },
    {
      name: "Worker Name",
      cell: (row) => (
        <div className="d-flex align-items-center">
          <div className="position-relative">
            <Image
              src={row.profilePicture}
              alt={row.fullName}
              className="rounded-circle"
              style={{ 
                width: "40px", 
                height: "40px", 
                objectFit: "cover",
                border: "2px solid #fff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}
            />
            <div className={`position-absolute bottom-0 end-0 w-3 h-3 rounded-circle ${
              row.isActive ? 'bg-success' : 'bg-danger'
            }`} />
          </div>
          <div className="ms-3">
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>{row.fullName}</Tooltip>}
            >
              <div className="fw-semibold text-dark">{row.fullName}</div>
            </OverlayTrigger>
          </div>
        </div>
      ),
      sortable: true,
      width: "200px",
    },
    {
      name: "Contact",
      cell: (row) => (
        <div className="d-flex flex-column">
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Click to copy</Tooltip>}
          >
            <span
              className="text-primary cursor-pointer mb-1"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(row.email);
                toast.success('Email copied!');
              }}
            >
              {row.email}
            </span>
          </OverlayTrigger>
          <small className="text-muted">{row.primaryPhone}</small>
        </div>
      ),
      sortable: true,
      width: "200px",
    },
    {
      name: "Address",
      cell: (row) => (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>{row.address}</Tooltip>}
        >
          <div className="text-truncate text-muted" style={{ maxWidth: "220px" }}>
            {row.address}
          </div>
        </OverlayTrigger>
      ),
      sortable: true,
      width: "200px",
    },
    {
      name: "Skills",
      cell: (row) => (
        <div className="d-flex flex-wrap gap-1">
          {Array.isArray(row.skills) && row.skills.length > 0 ? (
            row.skills.map((skill, index) => (
              <Badge 
                key={index}
                className="px-2 py-1"
                bg="soft-primary"
                style={{
                  fontSize: '11px',
                  backgroundColor: 'rgba(13, 110, 253, 0.1)',
                  color: '#0d6efd'
                }}
              >
                {skill}
              </Badge>
            ))
          ) : (
            <Badge 
              className="px-2 py-1"
              bg="soft-secondary"
              style={{
                fontSize: '11px',
                backgroundColor: 'rgba(108, 117, 125, 0.1)',
                color: '#6c757d'
              }}
            >
              None
            </Badge>
          )}
        </div>
      ),
      width: "150px",
    },
    {
      name: "Status",
      selector: (row) => row.isActive,
      sortable: true,
      width: "120px",
      cell: row => (
        <Badge 
          bg={row.isActive ? 'success' : 'danger'}
          className="px-2 py-1"
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      name: "Role",
      selector: (row) => row.role,
      sortable: true,
      width: "120px",
      cell: row => <span className="badge bg-info">{row.role}</span>
    },
    {
      name: "Gender",
      selector: (row) => row.gender,
      sortable: true,
      width: "100px",
    },
    {
      name: "Date of Birth",
      selector: (row) => row.dateOfBirth,
      sortable: true,
      width: "150px",
      cell: row => <span>{row.dateOfBirth}</span>
    },
    {
      name: "Expiration Date",
      selector: (row) => row.expirationDate,
      sortable: true,
      width: "150px",
      cell: row => <span>{row.expirationDate}</span>
    },
    {
      name: "Admin",
      selector: (row) => row.isAdmin,
      sortable: true,
      width: "100px",
      cell: row => <span>{row.isAdmin ? "Yes" : "No"}</span>
    },
    {
      name: "Field Worker",
      selector: (row) => row.isFieldWorker,
      sortable: true,
      width: "120px",
      cell: row => <span>{row.isFieldWorker ? "Yes" : "No"}</span>
    },
    {
      name: "Created Date",
      selector: (row) => row.joinDate,
      sortable: true,
      width: "150px",
      cell: row => (
        <span className="text-muted">
          {format(row.joinDate, 'MMM d, yyyy')}
        </span>
      )
    }
  ];

  const subHeaderComponentMemo = useMemo(() => {
    return (
      <div className="w-100 mb-4 position-relative">
        <Search 
          size={18} 
          className="position-absolute text-muted" 
          style={{ top: '12px', left: '12px' }} 
        />
        <input
          type="text"
          className="form-control ps-5"
          placeholder="Search workers by name, ID, email, phone, skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            padding: '0.75rem 1rem',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
        />
      </div>
    );
  }, [search]);

  const customStyles = {
    table: {
      style: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
      }
    },
    headRow: {
      style: {
        backgroundColor: '#f8fafc',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        borderBottom: '1px solid #e2e8f0',
      }
    },
    headCells: {
      style: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#475569',
        paddingTop: '16px',
        paddingBottom: '16px',
      }
    },
    cells: {
      style: {
        fontSize: '14px',
        color: '#64748b',
        paddingTop: '12px',
        paddingBottom: '12px',
      }
    },
    rows: {
      style: {
        '&:hover': {
          backgroundColor: '#f1f5f9',
          cursor: 'pointer',
          transition: 'all 0.2s',
        },
      }
    },
    pagination: {
      style: {
        borderTop: '1px solid #e2e8f0',
      }
    }
  };

  return (
    <Fragment>
      {isEditing && (
        <div className="loading-overlay">
          <Spinner animation="border" variant="primary" />
        </div>
      )}
      <Row>
        <Col md={12} xs={12} className="mb-5">
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" className="me-2" />
                  <span className="text-muted">Loading workers...</span>
                </div>
              ) : filteredWorkers.length > 0 ? (
                <DataTable
                  columns={columns}
                  data={filteredWorkers}
                  pagination
                 // highlightOnHover
                 // pointerOnHover
                  onRowClicked={(row) => handleRowClick(row)}
                  customStyles={customStyles}
                  subHeader
                  subHeaderComponent={subHeaderComponentMemo}
                  persistTableHead
                  noDataComponent={
                    <div className="text-center py-5">
                      <div className="text-muted mb-2">No workers found</div>
                      <small>Try adjusting your search terms</small>
                    </div>
                  }
                />
              ) : (
                <div className="text-center py-5">
                  <div className="text-muted mb-2">No workers found</div>
                  <small>Try adjusting your search terms or add new workers</small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <ToastContainer />
      <style jsx>{`
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }
      `}</style>
    </Fragment>
  );
};

export default WorkersListItems;
