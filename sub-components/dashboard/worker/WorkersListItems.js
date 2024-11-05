import React, { useState, useEffect, useMemo, Fragment, useCallback } from "react";
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
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import { Search } from 'react-feather';
import { format, parseISO } from 'date-fns'; // Add this import for date formatting
import { useWorkers } from 'hooks/useWorkers';

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

const WorkersListItems = () => {
  const { 
    workers, 
    loading, 
    error, 
    fetchWorkers, 
    clearCache,
    removeWorker 
  } = useWorkers();
  
  const [search, setSearch] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log('Workers data:', workers); // Debug log
  }, [workers]);

  // Memoized filtered workers
  const filteredWorkers = useMemo(() => {
    if (!workers || !Array.isArray(workers)) {
      console.log('No workers data or invalid format:', workers);
      return [];
    }
    
    const searchLower = search.toLowerCase().trim();
    if (!searchLower) return workers;

    return workers.filter((worker) => {
      if (!worker) return false;

      const searchableFields = {
        fullName: worker.fullName || '',
        workerId: worker.workerId || '',
        email: worker.email || '',
        primaryPhone: worker.primaryPhone || '',
        address: worker.address || '',
        skills: Array.isArray(worker.skills) ? worker.skills.join(", ") : "",
        isActive: (worker.isActive ?? false).toString()
      };

      return Object.values(searchableFields).some(value => 
        String(value).toLowerCase().includes(searchLower)
      );
    });
  }, [workers, search]);

  // Handle search with debounce
  const handleSearch = useCallback((value) => {
    setSearch(value);
  }, []);

  // Handle refresh
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

  // Handle worker removal
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
        await removeWorker(row.id);
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
  }, [removeWorker]);

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
          router.push(`/dashboard/workers/${row.id}`);
        });
        document.getElementById('editBtn').addEventListener('click', async () => {
          setIsEditing(true);
          Swal.close();
          await router.push(`/dashboard/workers/${row.id}`);
          setIsEditing(false);
        });
        document.getElementById('removeBtn').addEventListener('click', () => {
          Swal.close();
          handleRemoveWorker(row);
        });
      }
    });
  }, [router, handleRemoveWorker]);

  // Memoized subheader component
  const subHeaderComponentMemo = useMemo(() => (
    <div className="w-100 mb-4">
      <div className="d-flex gap-3 align-items-center">
        <div className="position-relative flex-grow-1">
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
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              padding: '0.75rem 1rem',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
          />
        </div>
        <Button 
          variant="light"
          onClick={handleRefresh}
          disabled={loading}
        >
          <i className="fas fa-sync-alt me-1"></i>
          Refresh
        </Button>
      </div>
    </div>
  ), [search, loading, handleSearch, handleRefresh]);

  const columns = [
    {
      name: "#",
      selector: row => row.index,
      sortable: true,
      sortFunction: (a, b) => a.index - b.index,
      minWidth: "60px",
      maxWidth: "60px",
      cell: row => (
        <span className="text-muted fw-medium" style={{ fontSize: '13px' }}>
          {row.index}
        </span>
      )
    },
    {
      name: "Worker ID",
      selector: row => row.workerId,
      sortable: true,
      sortFunction: (a, b) => a.workerId.localeCompare(b.workerId),
      minWidth: "120px",
      maxWidth: "120px",
      cell: row => (
        <span 
          className="px-2 py-1 rounded"
          style={{
            backgroundColor: '#f8f9fa',
            color: '#495057',
            fontSize: '13px',
            fontWeight: '500',
            border: '1px solid #e9ecef'
          }}
        >
          {row.workerId}
        </span>
      )
    },
    {
      name: "Worker Name",
      selector: row => row.fullName,
      sortable: true,
      sortFunction: (a, b) => (a.fullName || '').localeCompare(b.fullName || ''),
      minWidth: "250px",
      grow: 2,
      cell: (row) => (
        <div className="d-flex align-items-center">
          <div className="position-relative">
            <Image
              src={row.profilePicture || '/images/avatar-placeholder.png'}
              alt={row.fullName}
              className="rounded-circle"
              style={{ 
                width: "42px", 
                height: "42px", 
                objectFit: "cover",
                backgroundColor: '#f8f9fa',
                border: "2px solid #fff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
              }}
            />
            <div 
              className={`position-absolute bottom-0 end-0 border-2 border-white rounded-circle`}
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: row.isActive ? '#12b886' : '#fa5252',
                boxShadow: '0 0 0 2px #fff'
              }}
            />
          </div>
          <div className="ms-3">
            <div className="text-dark fw-medium mb-0" style={{ fontSize: '14px' }}>{row.fullName}</div>
            <div className="text-muted" style={{ fontSize: '12px' }}>#{row.workerId}</div>
          </div>
        </div>
      ),
    },
    {
      name: "Contact",
      selector: row => row.email,
      sortable: true,
      sortFunction: (a, b) => (a.email || '').localeCompare(b.email || ''),
      minWidth: "230px",
      maxWidth: "230px",
      cell: (row) => (
        <div className="d-flex flex-column">
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Click to copy email</Tooltip>}
          >
            <div
              className="d-flex align-items-center mb-1 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(row.email);
                toast.success('Email copied!');
              }}
              style={{ fontSize: '13px' }}
            >
              <i className="fas fa-envelope text-muted me-2" style={{ fontSize: '12px' }}></i>
              <span className="text-primary">{row.email}</span>
            </div>
          </OverlayTrigger>
          <div className="d-flex align-items-center" style={{ fontSize: '13px' }}>
            <i className="fas fa-phone text-muted me-2" style={{ fontSize: '12px' }}></i>
            <span className="text-muted">{row.primaryPhone}</span>
          </div>
        </div>
      ),
    },
    {
      name: "Address",
      selector: row => formatAddress(row.address),
      sortable: true,
      sortFunction: (a, b) => formatAddress(a.address).localeCompare(formatAddress(b.address)),
      minWidth: "200px",
      maxWidth: "200px",
      cell: (row) => (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>{formatAddress(row.address)}</Tooltip>}
        >
          <div 
            className="text-truncate text-muted"
            style={{ 
              fontSize: '13px',
              maxWidth: "200px"
            }}
          >
            <i className="fas fa-map-marker-alt me-2" style={{ fontSize: '12px' }}></i>
            {formatAddress(row.address)}
          </div>
        </OverlayTrigger>
      ),
    },
    {
      name: "Skills",
      selector: row => Array.isArray(row.skills) ? row.skills.join(', ') : '',
      sortable: true,
      sortFunction: (a, b) => {
        const skillsA = Array.isArray(a.skills) ? a.skills.length : 0;
        const skillsB = Array.isArray(b.skills) ? b.skills.length : 0;
        return skillsA - skillsB;
      },
      minWidth: "100px",
      maxWidth: "100px",
      cell: (row) => {
        const skills = Array.isArray(row.skills) ? row.skills : [];
        const skillCount = skills.length;
        
        return (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip>
                {skills.length > 0 ? skills.join(', ') : 'No skills'}
              </Tooltip>
            }
          >
            <span 
              className="px-2 py-1 rounded-pill"
              style={{
                fontSize: '11px',
                backgroundColor: skillCount > 0 
                  ? 'rgba(0, 123, 255, 0.08)'
                  : 'rgba(108, 117, 125, 0.08)',
                color: skillCount > 0 ? '#007bff' : '#6c757d',
                border: skillCount > 0 
                  ? '1px solid rgba(0, 123, 255, 0.1)'
                  : '1px solid rgba(108, 117, 125, 0.1)',
                fontWeight: '500'
              }}
            >
              {skillCount > 0 ? `${skillCount}+ skills` : 'No skills'}
            </span>
          </OverlayTrigger>
        );
      },
    },
    {
      name: "Status",
      selector: row => Boolean(row.isActive),
      sortable: true,
      sortFunction: (a, b) => {
        const isActiveA = Boolean(a.isActive);
        const isActiveB = Boolean(b.isActive);
        return isActiveA === isActiveB ? 0 : isActiveA ? -1 : 1;
      },
      minWidth: "115px",
      maxWidth: "115px",
      cell: row => {
        const isActive = Boolean(row.isActive);
        return (
          <span 
            className="px-3 py-1 rounded-pill d-inline-flex align-items-center"
            style={{
              fontSize: '12px',
              backgroundColor: isActive ? 'rgba(18, 184, 134, 0.1)' : 'rgba(250, 82, 82, 0.1)',
              color: isActive ? '#12b886' : '#fa5252',
              fontWeight: '500'
            }}
          >
            <i className={`fas fa-${isActive ? 'check' : 'times'} me-1`} style={{ fontSize: '10px' }}></i>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      }
    },
    {
      name: "Role",
      selector: row => row.role,
      sortable: true,
      sortFunction: (a, b) => (a.role || '').localeCompare(b.role || ''),
      minWidth: "125px",
      maxWidth: "125px",
      cell: row => (
        <span 
          className="px-3 py-1 rounded-pill"
          style={{
            fontSize: '12px',
            backgroundColor: 'rgba(0, 199, 255, 0.1)',
            color: '#00c7ff',
            fontWeight: '500'
          }}
        >
          {row.role}
        </span>
      )
    },
    {
      name: "Gender",
      selector: row => row.gender,
      sortable: true,
      sortFunction: (a, b) => (a.gender || '').localeCompare(b.gender || ''),
      minWidth: "100px",
      maxWidth: "100px",
      cell: row => <span className="text-capitalize">{row.gender}</span>
    },
    {
      name: "Date of Birth",
      selector: row => row.dateOfBirth,
      sortable: true,
      sortFunction: (a, b) => {
        const dateA = a.dateOfBirth?.toDate?.() || new Date(a.dateOfBirth);
        const dateB = b.dateOfBirth?.toDate?.() || new Date(b.dateOfBirth);
        return dateA - dateB;
      },
      minWidth: "150px",
      maxWidth: "150px",
      cell: row => <span>{formatDate(row.dateOfBirth)}</span>
    }
  ];

  const customStyles = {
    table: {
      style: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        width: '100%',
      }
    },
    tableWrapper: {
      style: {
        display: 'block',
        width: '100%',
      },
    },
    responsiveWrapper: {
      style: {
        width: '100%',
        height: '90%',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        msOverflowStyle: '-ms-autohiding-scrollbar',
      },
    },
    headRow: {
      style: {
        backgroundColor: '#f8f9fa',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        borderBottom: '1px solid #e9ecef',
        minHeight: '48px',
      }
    },
    headCells: {
      style: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#495057',
        paddingTop: '12px',
        paddingBottom: '12px',
      }
    },
    cells: {
      style: {
        paddingTop: '12px',
        paddingBottom: '12px',
        borderBottom: '1px solid #f1f3f5',
      }
    },
    rows: {
      style: {
        backgroundColor: '#ffffff',
        minWidth: 'fit-content',
        '&:hover': {
          backgroundColor: '#f8f9fa',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        },
      },
      stripedStyle: {
        backgroundColor: '#fbfbfc',
      }
    },
    pagination: {
      style: {
        borderTop: '1px solid #e9ecef',
        padding: '16px',
      },
      pageButtonsStyle: {
        borderRadius: '4px',
        height: '32px',
        minWidth: '32px',
        padding: '0 6px',
        margin: '0 4px',
        cursor: 'pointer',
        transition: '0.2s ease',
        backgroundColor: '#ffffff',
        border: '1px solid #dee2e6',
        '&:hover:not(:disabled)': {
          backgroundColor: '#e9ecef',
        }
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
              <div className="table-container">
                {error ? (
                  <div className="text-center py-5 text-danger">
                    <p>Error loading workers: {error.message}</p>
                    <Button 
                      variant="outline-danger"
                      onClick={() => fetchWorkers(true)}
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <>
                    {loading ? (
                      <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2">Loading workers...</p>
                      </div>
                    ) : (
                      <DataTable
                        columns={columns}
                        data={filteredWorkers}
                        pagination
                        defaultSortFieldId="index"
                        defaultSortAsc={true}
                        sortServer={false}
                        onRowClicked={handleRowClick}
                        customStyles={customStyles}
                        subHeader
                        subHeaderComponent={subHeaderComponentMemo}
                        responsive
                        fixedHeader
                        fixedHeaderScrollHeight="calc(100vh - 300px)"
                        dense
                        persistTableHead
                        paginationComponentOptions={{
                          noRowsPerPage: true // Hide rows per page selector
                        }}
                        progressPending={loading}
                        noDataComponent={
                          <div className="text-center py-5">
                            <div className="text-muted mb-2">
                              {workers?.length === 0 ? 'No workers found' : 'No matching results'}
                            </div>
                            <small>
                              {search ? 'Try adjusting your search terms' : 'Add workers to get started'}
                            </small>
                          </div>
                        }
                      />
                    )}
                  </>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <ToastContainer />
      <style jsx>{`
        .table-container {
          width: 100%;
          min-width: 0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

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

        /* Custom scrollbar styles */
        .table-container::-webkit-scrollbar {
          height: 8px;
        }

        .table-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .table-container::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        .table-container::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        @media screen and (max-width: 1200px) {
          .table-container {
            margin-bottom: 16px;
          }
        }
      `}</style>
    </Fragment>
  );
};

export default WorkersListItems;
