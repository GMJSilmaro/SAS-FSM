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
    clearCache 
  } = useWorkers();
  
  const [search, setSearch] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    active: 0,
    inactive: 0,
    fieldWorkers: 0,
  });

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
        const workerRef = doc(db, 'workers', row.id);
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
        {selectedRows.length > 0 && (
          <Button 
            variant="danger"
            onClick={handleBulkDelete}
            className="d-flex align-items-center gap-2"
          >
            <i className="fas fa-trash-alt"></i>
            Delete ({selectedRows.length})
          </Button>
        )}
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
  ), [search, loading, handleSearch, handleRefresh, selectedRows.length, handleBulkDelete]);

  const columnHelper = createColumnHelper();

  const columns = [
    columnHelper.accessor((row, index) => index + 1, {
      id: 'index',
      header: '#',
      size: 60,
      cell: info => <span className="text-muted">{info.getValue()}</span>
    }),

    columnHelper.accessor('fullName', {
      header: 'Worker Name',
      size: 200,
      cell: info => (
        <div className="d-flex align-items-center">
          <Image
            src={info.row.original.profilePicture || '/images/avatar/default-avatar.png'}
            alt={info.getValue()}
            width={32}
            height={32}
            className="rounded-circle me-2"
          />
          <div>
            <div className="fw-semibold">{info.getValue()}</div>
            <small className="text-muted">{info.row.original.workerId}</small>
          </div>
        </div>
      )
    }),

    columnHelper.accessor('email', {
      header: 'Contact',
      size: 250,
      cell: info => (
        <div>
          <div className="d-flex align-items-center mb-1">
            <MailIcon size={14} className="text-muted me-2" />
            <span>{info.getValue() || '-'}</span>
          </div>
          <div className="d-flex align-items-center">
            <PhoneIcon size={14} className="text-muted me-2" />
            <span>{info.row.original.primaryPhone || '-'}</span>
          </div>
        </div>
      )
    }),

    columnHelper.accessor('address', {
      header: 'Address',
      size: 300,
      cell: info => (
        <div className="d-flex align-items-center">
          <MapPinIcon size={14} className="text-muted me-2" />
          <span className="text-truncate" style={{ maxWidth: '250px' }}>
            {formatAddress(info.getValue()) || '-'}
          </span>
        </div>
      )
    }),

    columnHelper.accessor('isActive', {
      header: 'Status',
      size: 100,
      cell: info => (
        <Badge bg={info.getValue() ? 'success' : 'danger'}>
          {info.getValue() ? 'Active' : 'Inactive'}
        </Badge>
      )
    }),

    columnHelper.accessor(() => 'actions', {
      id: 'actions',
      header: 'Actions',
      size: 100,
      cell: info => (
        <div className="d-flex gap-2">
          <Button 
            className="header-button"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              color: 'white',
              padding: '8px 16px',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={() => handleRowClick(info.row.original)}
          >
            <Eye size={14} className="me-1" />
            View
          </Button>
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
        const workersRef = collection(db, 'workers');
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

  const fetchStats = async () => {
    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filter to only get users with role "Worker"
      const workersList = usersList.filter(user => user.role === "Worker");

      // Calculate stats from workers
      const totalWorkers = workersList.length;
      const active = workersList.filter(worker => worker.activeUser).length;
      const inactive = workersList.filter(worker => !worker.activeUser).length;
      const fieldWorkers = workersList.filter(worker => worker.isFieldWorker).length;

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

    } catch (error) {
      console.error("Error fetching worker stats:", error);
      toast.error('Error loading worker statistics');
    }
  };

  useEffect(() => {
    fetchStats();
  }, [workers]); // This will update stats whenever workers data changes

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
      badge: { text: 'Inactive', variant: 'secondary' },
      background: '#e7f6f8',
      summary: 'Currently Inactive Users'
    }
  ];

  return (
    <Fragment>
      {isEditing && (
        <div className="loading-overlay">
          <Spinner animation="border" variant="primary" />
        </div>
      )}
      
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
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: card.background,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {card.icon}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Main Table Card */}
      <Row>
        <Col md={12} xs={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              {/* Search and Actions */}
              {subHeaderComponentMemo}
              
              <div className="table-container">
                {error ? (
                  <div className="text-center py-5 text-danger">
                    <p>Error loading workers: {error.message}</p>
                    <Button 
                      variant="primary"
                      onClick={() => fetchWorkers(true)}
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <>
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
                              <tr key={row.id}>
                                {row.getVisibleCells().map(cell => (
                                  <td key={cell.id}>
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
                          className="me-2"
                          onClick={() => table.previousPage()}
                          disabled={!table.getCanPreviousPage()}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline-primary"
                          onClick={() => table.nextPage()}
                          disabled={!table.getCanNextPage()}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

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
      `}</style>
    </Fragment>
  );
};

export default WorkersListItems;
