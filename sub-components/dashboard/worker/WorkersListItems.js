import React, { useState, useEffect, useMemo, Fragment, useCallback, useRef } from "react";
import {
  Row,
  Col,
  Card,
  Badge,
  Image,
  Tooltip,
  OverlayTrigger,
  Spinner,
  Button,
} from "react-bootstrap";
import { useRouter } from "next/router";
import { toast, ToastContainer } from "react-toastify";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../firebase";
import { useReactTable, createColumnHelper, getCoreRowModel, getPaginationRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table';
import Swal from "sweetalert2";
import { Search } from 'react-feather';
import { format, parseISO } from 'date-fns'; // Add this import for date formatting
import { useWorkers } from '../../../hooks/useWorkers';
import { MailIcon, PhoneIcon, MapPinIcon, CheckIcon, XIcon, Eye } from 'lucide-react';
import { Users, Clock, CheckCircle, Activity } from 'lucide-react';
import Link from "next/link";
import { FaUser, FaPlus } from "react-icons/fa";
import { Filter, ChevronDown, ChevronUp, X as FeatherX } from 'react-feather';
import { Form } from 'react-bootstrap';

const formatDate = (date) => {
  try {
    if (!date) return '-';
    
    // If it's a timestamp
    if (date?.toDate) {
      return format(date.toDate(), 'MMM d, yyyy');
    }
    
    // If it's a string
    if (typeof date === 'string') {
      return format(parseISO(date), 'MMM d, yyyy');
    }
    
    // If it's a Date object
    if (date instanceof Date) {
      return format(date, 'MMM d, yyyy');
    }

    return '-';
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return '-';
  }
};

// Helper function to format address
const formatAddress = (address) => {
  if (!address) return '-';
  
  if (typeof address === 'string') return address;
  
  const {
    streetAddress = '',
    stateProvince = '',
    postalCode = '',
    city = '',
    country = ''
  } = address;
  
  // Custom format
  return [
    streetAddress,
    city,
    stateProvince,
    postalCode,
    country
  ]
    .filter(Boolean) // Remove empty values
    .join(', ');
};

const FilterPanel = ({
  filters,
  setFilters,
  onClear,
  loading,
  handleSearch,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleSearch();
    }
  };
  

  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex align-items-center flex-grow-1">
            <OverlayTrigger
              placement="right"
              overlay={
                <Tooltip>
                  Click to {isExpanded ? "collapse" : "expand"} filters
                </Tooltip>
              }
            >
              <div
                className="d-flex align-items-center"
                style={{ cursor: "pointer" }}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <Filter size={16} className="me-2 text-primary" />
                <h6 className="mb-0 me-2" style={{ fontSize: "1rem" }}>
                  Filter
                  {Object.values(filters).filter((value) => value !== "")
                    .length > 0 && (
                    <Badge
                      bg="primary"
                      className="ms-2"
                      style={{
                        fontSize: "0.75rem",
                        verticalAlign: "middle",
                        borderRadius: "12px",
                        padding: "0.25em 0.6em",
                      }}
                    >
                      {
                        Object.values(filters).filter((value) => value !== "")
                          .length
                      }
                    </Badge>
                  )}
                </h6>
                {isExpanded ? (
                  <ChevronUp size={16} className="text-muted" />
                ) : (
                  <ChevronDown size={16} className="text-muted" />
                )}
              </div>
            </OverlayTrigger>

            {!isExpanded && (
              <div className="ms-4 flex-grow-1" style={{ maxWidth: "300px" }}>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  placeholder="Quick search..."
                  style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}
                  onKeyPress={handleKeyPress}
                />
              </div>
            )}
          </div>

          <div className="d-flex justify-content-end align-items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={onClear}
              disabled={loading}
              className="clear-btn d-flex align-items-center"
            >
              <FeatherX size={14} className="me-1" />
              Clear
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSearch}
              disabled={loading}
              className="search-btn d-flex align-items-center"
            >
              <Search size={14} className="me-1" />
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>

        <div
          style={{
            maxHeight: isExpanded ? "1000px" : "0",
            overflow: "hidden",
            transition: "all 0.3s ease-in-out",
            opacity: isExpanded ? 1 : 0,
          }}
        >
          <Row>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Worker ID:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.workerId}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, workerId: e.target.value }))
                  }
                  placeholder="Enter worker ID..."
                  onKeyPress={handleKeyPress}
                  style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Name:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.fullName}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  placeholder="Search by name..."
                  onKeyPress={handleKeyPress}
                  style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Email:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.email}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Search by email..."
                  onKeyPress={handleKeyPress}
                  style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Status:</Form.Label>
                <Form.Select
                  size="sm"
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, status: e.target.value }))
                  }
                  style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Role:</Form.Label>
                <Form.Select
                  size="sm"
                  value={filters.role}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, role: e.target.value }))
                  }
                  style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="worker">Worker</option>
                  <option value="fieldworker">Field Worker</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="small mb-1">Skills:</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  value={filters.skills}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, skills: e.target.value }))
                  }
                  placeholder="Search by skills..."
                  onKeyPress={handleKeyPress}
                  style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}
                />
              </Form.Group>
            </Col>
          </Row>
        </div>
      </Card.Body>
      <style jsx global>{`
        .clear-btn, .search-btn {
          padding: 6px 12px !important;
          font-size: 14px !important;
          border-radius: 4px !important;
          transition: all 0.2s ease-in-out !important;
          border: none !important;
          position: relative;
          overflow: hidden;
        }

        .clear-btn {
          background-color: #FEE2E2 !important;
          color: #DC2626 !important;
        }

        .search-btn {
          background-color: #3B82F6 !important;
          color: white !important;
        }

        /* Hover animations */
        .clear-btn:hover, .search-btn:hover {
          transform: translateY(-1px);
        }

        .clear-btn:hover {
          background-color: #FEE2E2 !important;
          opacity: 0.9;
        }

        .search-btn:hover {
          background-color: #2563EB !important;
        }

        /* Active state animations */
        .clear-btn:active, .search-btn:active {
          transform: translateY(0);
        }

        /* Ripple effect */
        .clear-btn::after, .search-btn::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 120%;
          height: 120%;
          background: rgba(255, 255, 255, 0.2);
          transform: translate(-50%, -50%) scale(0);
          border-radius: 50%;
          transition: transform 0.3s ease;
        }

        .clear-btn:active::after, .search-btn:active::after {
          transform: translate(-50%, -50%) scale(1);
          opacity: 0;
        }

        /* Disabled state */
        .clear-btn:disabled, .search-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none !important;
        }

        /* Icon animations */
        .clear-btn svg, .search-btn svg {
          transition: transform 0.2s ease;
        }

        .clear-btn:hover svg {
          transform: rotate(90deg);
        }

        .search-btn:hover svg {
          transform: translateX(-2px);
        }
          /* Primary Button Style */
  .btn-primary.btn-icon-text {
    background-color: #3b82f6;
    color: white;
    border: none;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
    font-size: 0.875rem;
    padding: 0.5rem 0.875rem;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .btn-primary.btn-icon-text:hover {
    background-color: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2);
    color: white;
    text-decoration: none;
  }

  .btn-primary.btn-icon-text:hover .icon-left {
    transform: translateX(-2px);
  }

  .btn-primary.btn-icon-text .icon-left {
    transition: transform 0.2s ease;
  }

  /* Small button variant */
  .btn-sm.btn-icon-text {
    padding: 0.4rem 0.75rem;
    font-size: 0.812rem;
  }

  /* Ripple effect */
  .btn-icon-text {
    position: relative;
    overflow: hidden;
  }

  .btn-icon-text::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 120%;
    height: 120%;
    background: rgba(255, 255, 255, 0.2);
    transform: translate(-50%, -50%) scale(0);
    border-radius: 50%;
    transition: transform 0.5s ease;
  }

  .btn-icon-text:active::after {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }

      `}</style>
    </Card>
  );
};

const WorkersListItems = () => {
  const { 
    workers, 
    loading, 
    error, 
    fetchWorkers, 
    clearCache 
  } = useWorkers();
  
  const [search, setSearch] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    active: 0,
    inactive: 0,
    fieldWorkers: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    workerId: "",
    fullName: "",
    email: "",
    status: "",
    role: "",
    skills: ""
  });

  // Initialize filteredWorkers when workers data changes
  useEffect(() => {
    if (workers) {
      setFilteredWorkers(workers);
    }
  }, [workers]);

  // Modify handleRefresh to force a fresh fetch
  const handleRefresh = useCallback(async () => {
    try {
      clearCache();
      await fetchWorkers(true);
      toast.success('Data refreshed successfully', {
        position: "top-right",
        className: 'bg-success text-white'
      });
    } catch (error) {
      toast.error('Failed to refresh data', {
        position: "top-right",
        className: 'bg-danger text-white'
      });
    }
  }, [clearCache, fetchWorkers]);

    // Update the handleSearch function to handle both quick search and filters
    const handleSearch = useCallback(() => {
      if (!workers) return;
      
      let filtered = [...workers];
  
      // Apply filters
      if (filters.workerId) {
        filtered = filtered.filter((worker) =>
          worker.workerId?.toLowerCase().includes(filters.workerId.toLowerCase())
        );
      }
  
      if (filters.fullName) {
        filtered = filtered.filter((worker) =>
          worker.fullName?.toLowerCase().includes(filters.fullName.toLowerCase())
        );
      }
  
      if (filters.email) {
        filtered = filtered.filter((worker) =>
          worker.email?.toLowerCase().includes(filters.email.toLowerCase())
        );
      }
  
      if (filters.status) {
        const isActive = filters.status === 'active';
        filtered = filtered.filter((worker) => worker.isActive === isActive);
      }
  
      if (filters.role) {
        filtered = filtered.filter((worker) => {
          if (filters.role === 'admin') return worker.isAdmin;
          if (filters.role === 'fieldworker') return worker.isFieldWorker;
          return worker.role?.toLowerCase() === filters.role;
        });
      }
  
      if (filters.skills) {
        const searchSkills = filters.skills.toLowerCase().split(',').map(s => s.trim());
        filtered = filtered.filter((worker) =>
          worker.skills?.some(skill => 
            searchSkills.some(searchSkill => 
              skill.toLowerCase().includes(searchSkill)
            )
          )
        );
      }
  
      // Quick search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter((worker) => {
          return (
            worker.workerId?.toLowerCase().includes(searchLower) ||
            worker.fullName?.toLowerCase().includes(searchLower) ||
            worker.email?.toLowerCase().includes(searchLower) ||
            worker.primaryPhone?.toLowerCase().includes(searchLower) ||
            worker.skills?.some(skill => skill.toLowerCase().includes(searchLower))
          );
        });
      }
  
      setFilteredWorkers(filtered);
    }, [workers, filters]);

  // Modify handleRemoveWorker to not need manual refresh
  const handleRemoveWorker = useCallback(async (row) => {
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
        const workerRef = doc(db, 'users', row.id);
        await deleteDoc(workerRef);
        // No need to manually refresh - onSnapshot will handle it
        
        toast.success('Worker removed successfully', {
          position: "top-right",
          className: 'bg-success text-white'
        });
      } catch (error) {
        console.error("Error removing worker:", error);
        toast.error('Error removing worker: ' + error.message, {
          position: "top-right",
          className: 'bg-danger text-white'
        });
      }
    }
  }, []);

  // Handle row click
  const handleRowClick = useCallback(async (row) => {
    const result = await Swal.fire({
      html: `
        <div class="text-center">
          <img src="${row.profilePicture}" alt="${row.fullName}" class="rounded-circle mb-3" style="width: 80px; height: 80px; object-fit: cover;">
          <h5 class="mb-1">${row.fullName}</h5>
          <p class="text-muted mb-4">${row.workerId}</p>
          <div class="d-grid gap-2">
            <button class="btn btn-primary" id="viewBtn">
              <i class="fas fa-eye me-2"></i>View Details
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
          router.push(`/workers/view/${row.id}`);
        });
        document.getElementById('editBtn').addEventListener('click', async () => {
          setIsEditing(true);
          Swal.close();
          await router.push(`/workers/edit-worker/${row.id}`);
          setIsEditing(false);
        });
        document.getElementById('removeBtn').addEventListener('click', () => {
          Swal.close();
          handleRemoveWorker(row);
        });
      }
    });
  }, [router, handleRemoveWorker]);

  // Add new bulk delete handler
  const handleBulkDelete = useCallback(async () => {
    if (!selectedRows.length) return;

    const confirmDelete = await Swal.fire({
      title: 'Delete Selected Workers?',
      text: `Are you sure you want to delete ${selectedRows.length} worker${selectedRows.length > 1 ? 's' : ''}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    });

    if (confirmDelete.isConfirmed) {
      try {
        // Delete all selected workers from Firebase
        await Promise.all(
          selectedRows.map(async (row) => {
            const workerRef = doc(db, 'workers', row.id);
            await deleteDoc(workerRef);
          })
        );
        
        // Refresh the workers list
        await fetchWorkers(true);
        
        setSelectedRows([]); // Clear selection
        toast.success(`Successfully deleted ${selectedRows.length} worker${selectedRows.length > 1 ? 's' : ''}`, {
          position: "top-right",
          className: 'bg-success text-white'
        });
      } catch (error) {
        console.error("Error deleting workers:", error);
        toast.error('Error deleting workers: ' + error.message, {
          position: "top-right",
          className: 'bg-danger text-white'
        });
      }
    }
  }, [selectedRows, fetchWorkers]);


  const columnHelper = createColumnHelper();

  const columns = [
    columnHelper.accessor((row, index) => index + 1, {
      id: 'index',
      header: '#',
      size: 60,
      cell: info => (
        <span className="text-muted" style={{ fontSize: '14px' }}>
          {info.getValue()}
        </span>
      )
    }),

    columnHelper.accessor('fullName', {
      header: 'WORKER NAME',
      size: 280,
      cell: info => (
        <div className="d-flex align-items-center">
          <div className="position-relative">
            <Image
              src={info.row.original.profilePicture || '/images/avatar/default-avatar.png'}
              alt={info.getValue()}
              width={45}
              height={45}
              className="rounded-circle"
              style={{ 
                objectFit: 'cover', 
                border: '2px solid #fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
            <span 
              className={`position-absolute bottom-0 end-0 ${info.row.original.isOnline ? 'bg-success' : 'bg-secondary'}`}
              style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                border: '2px solid #fff' 
              }}
            />
          </div>
          <div className="ms-3">
            <div className="d-flex align-items-center gap-2">
              <span className="fw-semibold text-dark" style={{ fontSize: '14px' }}>
                {info.getValue()}
              </span>
              <div className="d-flex gap-1">
                {info.row.original.isFieldWorker && (
                  <Badge 
                    bg="warning" 
                    text="dark"
                    style={{ 
                      fontSize: '10px', 
                      padding: '4px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    Field Worker
                  </Badge>
                )}
                {info.row.original.isAdmin && (
                  <Badge 
                    bg="danger" 
                    text="white"
                    style={{ 
                      fontSize: '10px', 
                      padding: '4px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    Admin
                  </Badge>
                )}
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <small className="text-muted" style={{ fontSize: '12px' }}>
                {info.row.original.workerId}
              </small>
              {info.row.original.role && (
                <small className="text-primary" style={{ fontSize: '11px' }}>
                  • {info.row.original.role}
                </small>
              )}
            </div>
          </div>
        </div>
      )
    }),

    columnHelper.accessor(row => ({
      email: row.email,
      primaryPhone: row.primaryPhone,
      secondaryPhone: row.secondaryPhone
    }), {
      id: 'contact',
      header: 'CONTACT INFO',
      size: 250,
      cell: info => (
        <div>
          <div className="d-flex align-items-center mb-1">
            <MailIcon size={14} className="text-muted me-2" />
            <span style={{ fontSize: '14px' }}>{info.getValue().email || '-'}</span>
          </div>
          <div className="d-flex align-items-center mb-1">
            <PhoneIcon size={14} className="text-muted me-2" />
            <span style={{ fontSize: '14px' }}>{info.getValue().primaryPhone || '-'}</span>
          </div>
          {info.getValue().secondaryPhone && (
            <div className="d-flex align-items-center">
              <PhoneIcon size={14} className="text-muted me-2" />
              <span style={{ fontSize: '14px' }}>{info.getValue().secondaryPhone}</span>
            </div>
          )}
        </div>
      )
    }),

    columnHelper.accessor(row => ({
      streetAddress: row.streetAddress,
      stateProvince: row.stateProvince,
      zipCode: row.zipCode
    }), {
      id: 'address',
      header: 'ADDRESS',
      size: 250,
      cell: info => {
        const address = [
          info.getValue().streetAddress,
          info.getValue().stateProvince,
          info.getValue().zipCode
        ].filter(Boolean).join(', ');
        
        return (
          <div className="d-flex align-items-center">
            <MapPinIcon size={14} className="text-muted me-2 flex-shrink-0" />
            <span className="text-truncate" style={{ fontSize: '14px', maxWidth: '200px' }}>
              {address || '-'}
            </span>
          </div>
        );
      }
    }),

    columnHelper.accessor('skills', {
      header: 'SKILLS',
      size: 200,
      cell: info => {
        const skills = info.getValue() || [];
        return (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip>
                <div className="text-start">
                  <strong>Skills & Expertise:</strong>
                  <div className="mt-1">
                    {skills.map((skill, index) => (
                      <div key={index} className="d-flex align-items-center gap-1 mb-1">
                        <i className="fe fe-check-circle text-success" style={{ fontSize: '12px' }}></i>
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Tooltip>
            }
          >
            <div className="d-flex flex-wrap gap-1">
              {skills.slice(0, 2).map((skill, index) => (
                <Badge 
                  key={index}
                  bg="light"
                  text="dark"
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '500',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  {skill}
                </Badge>
              ))}
              {skills.length > 2 && (
                <Badge 
                  bg="secondary"
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  +{skills.length - 2} more
                </Badge>
              )}
            </div>
          </OverlayTrigger>
        );
      }
    }),

    columnHelper.accessor('isActive', {
      header: 'STATUS',
      size: 120,
      cell: info => (
        <div className="d-flex flex-column align-items-start">
          <Badge 
            bg={info.getValue() ? 'success' : 'danger'}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            {info.getValue() ? 'Active' : 'Inactive'}
          </Badge>
          <small className="text-muted mt-1" style={{ fontSize: '11px' }}>
            Last login: {formatDate(info.row.original.lastLogin)}
          </small>
        </div>
      )
    }),

    columnHelper.accessor(() => 'actions', {
      id: 'actions',
      header: 'ACTIONS',
      size: 100,
      cell: info => (
        <div className="d-flex gap-2">
          <OverlayTrigger
            placement="left"
            overlay={
              <Tooltip>
                <div className="text-start">
                  <strong>View Details</strong>
                  <div className="mt-1 text-xs">Click to see full worker profile</div>
                </div>
              </Tooltip>
            }
          >
            <Button 
              variant="primary"
              size="sm"
              className="btn-icon-text"
              onClick={() => handleRowClick(info.row.original)}
              style={{
                backgroundColor: '#3b82f6',
                border: 'none',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.15)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '500',
                fontSize: '0.875rem',
                padding: '0.5rem 0.875rem',
                borderRadius: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <Eye size={14} className="icon-left" />
              View
            </Button>
          </OverlayTrigger>
        </div>
      )
    })
  ];

  const table = useReactTable({
    data: filteredWorkers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });

  // Add debug logs
  useEffect(() => {
    console.log('Component state:', {
      workersCount: workers?.length,
      loading,
      error: error?.message
    });
  }, [workers, loading, error]);

  useEffect(() => {
    console.log('Workers data:', {
      raw: workers,
      transformed: filteredWorkers,
      loading,
      error
    });
  }, [workers, filteredWorkers, loading, error]);

  // Add near the top of your component
  useEffect(() => {
    // Test direct Firestore access
    async function testAccess() {
      try {
        const workersRef = collection(db, 'users');
        const snapshot = await getDocs(workersRef);
        console.log('Direct Firestore test:', {
          success: true,
          count: snapshot.size,
          data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        });
      } catch (error) {
        console.error('Direct Firestore test failed:', error);
      }
    }
    
    testAccess();
  }, []);

  const calculateStats = useCallback(() => {
    if (!workers || !Array.isArray(workers)) return;

    // Calculate stats directly from workers array
    const totalWorkers = workers.length;
    const active = workers.filter(worker => worker.isActive).length;
    const inactive = workers.filter(worker => !worker.isActive).length;
    const fieldWorkers = workers.filter(worker => worker.isFieldWorker).length;

    setStats({
      totalUsers: totalWorkers,
      active,
      inactive,
      fieldWorkers,
    });

    console.log('Workers Stats:', {
      total: totalWorkers,
      active,
      inactive,
      fieldWorkers
    });
  }, [workers]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  const statCards = [
    {
      title: 'Workers Statistics',
      value: stats.totalUsers,
      icon: <Users className="text-primary" />,
      badge: { text: 'Total', variant: 'primary' },
      background: '#e7f1ff',
      summary: `${stats.active} Active | ${stats.inactive} Inactive`
    },
    {
      title: 'Active Workers',
      value: stats.active,
      icon: <Activity className="text-success" />,
      badge: { text: 'Active', variant: 'success' },
      background: '#e6f8f0',
      summary: 'Currently Active Users'
    },
    {
      title: 'Field Workers',
      value: stats.fieldWorkers,
      icon: <Clock className="text-warning" />,
      badge: { text: 'Field', variant: 'warning' },
      background: '#fff8ec',
      summary: 'Field Workers Available'
    },
    {
      title: 'Inactive Workers',
      value: stats.inactive,
      icon: <CheckCircle className="text-info" />,
      badge: { text: 'Inactive', variant: 'danger' },
      background: '#e7f6f8',
      summary: 'Currently Inactive Users'
    }
  ];

  // Update handleClearFilters
  const handleClearFilters = useCallback(() => {
    setFilters({
      search: "",
      workerId: "",
      fullName: "",
      email: "",
      status: "",
      role: "",
      skills: ""
    });
    setSearch(""); // Clear the search state
    if (workers) {
      setFilteredWorkers(workers); // Reset to show all workers
    }
  }, [workers]);

  // Add effect to run search when filters change
  useEffect(() => {
    handleSearch();
  }, [handleSearch, filters]);

  return (
    <Fragment>
      {isEditing && (
        <div className="loading-overlay">
          <Spinner animation="border" variant="primary" />
        </div>
      )}
      
      <Row>
        <Col lg={12} md={12} sm={12}>
          <div
            style={{
              background: "linear-gradient(90deg, #4171F5 0%, #3DAAF5 100%)",
              padding: "1.5rem 2rem",
              borderRadius: "0 0 24px 24px",
              marginTop: "-39px",
              marginLeft: "10px",
              marginRight: "10px",
              marginBottom: "20px",
            }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div className="d-flex flex-column">
                <div className="mb-3">
                  <h1
                    className="mb-2"
                    style={{
                      fontSize: "28px",
                      fontWeight: "600",
                      color: "#FFFFFF",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Workers List
                  </h1>
                  <p
                    className="mb-2"
                    style={{
                      fontSize: "16px",
                      color: "rgba(255, 255, 255, 0.7)",
                      fontWeight: "400",
                      lineHeight: "1.5",
                    }}
                  >
                    Manage and track all your workers and assignments in one centralized dashboard
                  </p>
                  <div
                    className="d-flex align-items-center gap-2"
                    style={{
                      fontSize: "14px",
                      color: "rgba(255, 255, 255, 0.9)",
                      background: "rgba(255, 255, 255, 0.1)",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      marginTop: "8px",
                    }}
                  >
                    <i className="fe fe-info" style={{ fontSize: "16px" }}></i>
                    <span>
                      Track worker availability, skills, and performance metrics
                    </span>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2 mb-4">
                  <span
                    className="badge"
                    style={{
                      background: "#FFFFFF",
                      color: "#4171F5",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}
                  >
                    Worker Management
                  </span>
                  <span
                    className="badge"
                    style={{
                      background: "rgba(255, 255, 255, 0.2)",
                      color: "#FFFFFF",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}
                  >
                    <i className="fe fe-users me-1"></i>
                    Workforce
                  </span>
                </div>

                <nav style={{ fontSize: "14px", fontWeight: "500" }}>
                  <div className="d-flex align-items-center">
                    <i
                      className="fe fe-home"
                      style={{ color: "rgba(255, 255, 255, 0.7)" }}
                    ></i>
                    <Link
                      href="/"
                      className="text-decoration-none ms-2"
                      style={{ color: "rgba(255, 255, 255, 0.7)" }}
                    >
                      Dashboard
                    </Link>
                    <span
                      className="mx-2"
                      style={{ color: "rgba(255, 255, 255, 0.7)" }}
                    >
                      /
                    </span>
                    <i
                      className="fe fe-users"
                      style={{ color: "#FFFFFF" }}
                    ></i>
                    <span className="ms-2" style={{ color: "#FFFFFF" }}>
                      Workers
                    </span>
                  </div>
                </nav>
              </div>

              <div>
                <OverlayTrigger
                  placement="left"
                  overlay={<Tooltip>Add a new worker</Tooltip>}
                >
                  <Link href="/workers/create" passHref>
                    <Button
                      variant="light"
                      className="create-worker-button"
                      style={{
                        border: "none",
                        borderRadius: "12px",
                        padding: "10px 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.2s ease",
                        fontWeight: "500",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <FaPlus className="plus-icon" size={16} />
                      <span>Add New Worker</span>
                    </Button>
                  </Link>
                </OverlayTrigger>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Stats Cards Row */}
      <Row className="g-4 mb-4">
        {statCards.map((card, index) => (
          <Col key={index} lg={3} sm={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1">{card.title}</p>
                    <h3 className="mb-1">{card.value}</h3>
                    <Badge bg={card.badge.variant}>{card.badge.text}</Badge>
                    <div className="small text-muted mt-2">{card.summary}</div>
                  </div>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: card.background,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {card.icon}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row>
        <Col md={12} xs={12}>
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            onClear={handleClearFilters}
            loading={loading}
            handleSearch={handleSearch}
          />
          
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
             
              
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th 
                            key={header.id}
                            style={{
                              width: header.getSize(),
                              cursor: header.column.getCanSort() ? 'pointer' : 'default',
                              backgroundColor: "#f8fafc",
                              fontSize: "13px",
                              fontWeight: "600",
                              color: "#475569",
                              padding: "16px",
                              borderBottom: "1px solid #e2e8f0"
                            }}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={columns.length} className="text-center py-5">
                          <Spinner animation="border" variant="primary" className="me-2" />
                          <span className="text-muted">Loading workers...</span>
                        </td>
                      </tr>
                    ) : table.getRowModel().rows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="text-center py-5">
                          <div className="text-muted mb-2">No workers found</div>
                          <small>Try adjusting your search terms</small>
                        </td>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map(row => (
                        <tr 
                          key={row.id}
                          style={{
                            transition: "all 0.2s ease",
                            cursor: "pointer"
                          }}
                          className="table-row-hover"
                        >
                          {row.getVisibleCells().map(cell => (
                            <td 
                              key={cell.id}
                              style={{
                                fontSize: "14px",
                                color: "#64748b",
                                padding: "16px",
                                verticalAlign: "middle"
                              }}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="d-flex justify-content-between align-items-center mt-4">
                <div>
                  <span className="text-muted">
                    Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                    {Math.min(
                      (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                      filteredWorkers.length
                    )}{' '}
                    of {filteredWorkers.length} entries
                  </span>
                </div>
                <div>
                  <Button
                    variant="outline-primary"
                    className="me-2 btn-icon-text"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline-primary"
                    className="btn-icon-text"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <style jsx global>{`
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

        .table-row-hover:hover {
          background-color: #f1f5f9;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        /* Button Base Styles */
        .btn-icon-text {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
          font-size: 0.875rem;
          padding: 0.5rem 0.875rem;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .btn-icon-text .icon-left {
          transition: transform 0.2s ease;
        }

        /* Soft Variant Styles */
        .btn-soft-danger {
          background-color: #fee2e2;
          color: #dc2626;
          border: 1px solid transparent;
        }

        .btn-soft-danger:hover {
          background-color: #dc2626;
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(220, 38, 38, 0.15);
        }

        .btn-soft-danger:hover .icon-left {
          transform: rotate(90deg);
        }

        /* Create Worker Button Style */
        .create-worker-button {
          background-color: #ffffff;
          color: #4171F5;
          transition: all 0.2s ease;
        }

        .create-worker-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }

        .create-worker-button:active {
          transform: translateY(0);
        }

        /* Table Styles */
        .table {
          margin-bottom: 0;
        }

        .table th {
          border-top: none;
          background-color: #f8fafc;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.5px;
        }

        .table td {
          vertical-align: middle;
          color: #64748b;
          font-size: 14px;
        }

        /* Badge Styles */
        .badge {
          font-weight: 500;
          padding: 0.35em 0.65em;
          border-radius: 6px;
        }

        /* Card Styles */
        .card {
          transition: all 0.2s ease;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        /* View Button Hover Effects */
        .btn-icon-text:hover {
          background-color: #2563eb !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2) !important;
          color: white !important;
          text-decoration: none;
        }

        .btn-icon-text:hover .icon-left {
          transform: translateX(-2px);
        }

        /* Tooltip Styles */
        .tooltip-inner {
          max-width: 300px;
          padding: 8px 12px;
          background-color: #1e293b;
          border-radius: 6px;
          font-size: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .tooltip.show {
          opacity: 1;
        }
      `}</style>
    </Fragment>
  );
};

export default WorkersListItems;
