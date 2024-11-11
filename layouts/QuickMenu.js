/* eslint-disable react/display-name */
import Link from 'next/link';
import React, { Fragment, useState, useEffect, useCallback, useMemo } from "react";
import { useMediaQuery } from "react-responsive";
import { ListGroup, Dropdown, Badge, Button, InputGroup, Form } from "react-bootstrap";
import Image from "next/image";
import SimpleBar from "simplebar-react";
import { FaBell, FaSearch, FaTimes, FaTasks, FaCalendarAlt, FaFilter, FaStickyNote } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from 'react-toastify';
import { globalQuickSearch } from '../utils/searchUtils';
import { GKTippy } from "widgets";
import DarkLightMode from "layouts/DarkLightMode";
import NotificationList from "data/Notification";
import useMounted from "hooks/useMounted";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  writeBatch,
  deleteDoc,
  limit,
  orderBy,
  getDoc,
} from "firebase/firestore";
import DotBadge from "components/bootstrap/DotBadge";
import { format } from "date-fns";
import { FaBriefcase, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import Swal from 'sweetalert2';
import { getNotifications, updateNotificationCache, invalidateNotificationCache, getUnreadCount } from '../utils/notificationCache';
import { getCompanyDetails } from '../utils/companyCache';
import { useSessionRenewal } from '../hooks/useSessionRenewal';
import { initializeSessionRenewalCheck, handleSessionError } from '../utils/middlewareClient';
import { useLogo } from '../contexts/LogoContext';
import debounce from 'lodash/debounce';

const formatNotificationTime = (timestamp) => {
  try {
    
    // Safety check for null/undefined
    if (!timestamp) {
      //console.log('Timestamp is null or undefined');
      return 'Date unavailable';
    }

    let dateToFormat;

    // Handle different timestamp formats
    if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
      try {
        dateToFormat = timestamp.toDate();
        //console.log('Firestore timestamp converted to:', dateToFormat);
      } catch (e) {
        console.error('Error converting Firestore timestamp:', e);
        dateToFormat = new Date();
      }
    } else if (typeof timestamp === 'number') {
      dateToFormat = new Date(timestamp);
      //console.log('Number timestamp converted to:', dateToFormat);
    } else if (timestamp instanceof Date) {
      dateToFormat = timestamp;
     // console.log('Date object:', dateToFormat);
    } else if (timestamp.seconds) {
      dateToFormat = new Date(timestamp.seconds * 1000);
      //console.log('Seconds timestamp converted to:', dateToFormat);
    } else {
      //console.log('Using fallback current date');
      dateToFormat = new Date();
    }

    // Validate the date before formatting
    if (isNaN(dateToFormat.getTime())) {
      console.error('Invalid date object:', dateToFormat);
      return 'Invalid date';
    }

    return format(dateToFormat, "MMM d, yyyy h:mm a");
  } catch (error) {
    console.error('Error in formatNotificationTime:', error);
    console.error('Problematic timestamp:', timestamp);
    return 'Date error';
  }
};

const getStatusTag = (type, status) => {
  const statusColors = {
    'Created': { bg: '#FEF3C7', text: '#D97706' },
    'In Progress': { bg: '#DBEAFE', text: '#2563EB' },
    'Completed': { bg: '#D1FAE5', text: '#059669' },
    'Cancelled': { bg: '#FEE2E2', text: '#DC2626' },
    'Pending': { bg: '#E5E7EB', text: '#4B5563' }
  };

  const color = statusColors[status] || statusColors['Pending'];

  return (
    <span
      className="ms-2 px-2 py-1 rounded-pill"
      style={{
        backgroundColor: color.bg,
        color: color.text,
        fontSize: '0.75rem',
        fontWeight: '500'
      }}
    >
      {status}
    </span>
  );
};

const SearchResults = React.memo(({ results, onClose, router, isSearching }) => {
  const groupedResults = {
    customers: results.filter(r => r.type === 'customer'),
    workers: results.filter(r => r.type === 'worker'),
    jobs: results.filter(r => r.type === 'job'),
    followUps: results.filter(r => r.type === 'followUp'),
  };

  const renderHighlightedText = (text) => {
    if (!text) return '';
    
    const parts = text.split(/\[\[HIGHLIGHT\]\]|\[\[\/HIGHLIGHT\]\]/);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <strong 
            key={index}
            className="bg-light-primary text-primary"
            style={{ 
              padding: '0.1rem 0.3rem',
              borderRadius: '0.2rem',
              fontWeight: '600'
            }}
          >
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'customers':
        return <i className="fe fe-users me-2"></i>;
      case 'workers':
        return <i className="fe fe-user-check me-2"></i>;
      case 'jobs':
        return <i className="fe fe-briefcase me-2"></i>;
      case 'followUps':
        return <i className="fe fe-bell me-2"></i>;
      default:
        return null;
    }
  };

  const handleItemClick = (link) => {
    router.push(link);
    onClose();
  };

  return (
    <SimpleBar style={{ maxHeight: "400px" }}>
      <ListGroup variant="flush">
        {isSearching ? (
          <ListGroup.Item className="text-center py-4">
            <div className="text-muted">
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              Searching...
            </div>
          </ListGroup.Item>
        ) : results.length === 0 ? (
          <ListGroup.Item className="text-center py-4">
            <div className="text-muted">
              <i className="fe fe-search h3 mb-2"></i>
              <p className="mb-0">No results found</p>
            </div>
          </ListGroup.Item>
        ) : (
          Object.entries(groupedResults).map(([category, items]) => (
            items.length > 0 && (
              <div key={category}>
                <div className="p-2 bg-light">
                  <strong className="text-capitalize d-flex align-items-center">
                    {getCategoryIcon(category)}
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                    <span className="ms-1 text-muted">({items.length})</span>
                  </strong>
                </div>
                {items.map((item) => (
                  <ListGroup.Item
                    key={item.id}
                    action
                    onClick={() => handleItemClick(item.link)}
                    className="py-2 px-3"
                  >
                    <div className="d-flex flex-column">
                      <div className="d-flex align-items-center mb-1">
                        <span className="fw-medium">
                          {renderHighlightedText(item.title)}
                        </span>
                        {item.type === 'job' && item.status && getStatusTag(item.type, item.status)}
                      </div>
                      {item.subtitle && (
                        <small className="text-muted">
                          {renderHighlightedText(item.subtitle)}
                        </small>
                      )}
                      {item.type === 'worker' && (
                        <div className="d-flex align-items-center mt-1">
                          <small className="text-primary">
                            <i className="fe fe-mail me-1"></i>
                            {renderHighlightedText(item.workerID)}
                          </small>
                          {item.role && (
                            <small className="text-muted ms-3">
                              <i className="fe fe-tag me-1"></i>
                              {item.role}
                            </small>
                          )}
                        </div>
                      )}
                    </div>
                  </ListGroup.Item>
                ))}
              </div>
            )
          ))
        )}
      </ListGroup>
    </SimpleBar>
  );
});

SearchResults.displayName = 'SearchResults';

// Memoize the user avatar component
const UserAvatar = React.memo(({ userDetails }) => {
  return (
    <div className="position-relative" style={{ 
      width: '45px', 
      height: '45px',
      display: 'inline-block',
      marginRight: '80px'
    }}>
      {userDetails?.profilePicture ? (
        <div style={{ 
          width: '45px', 
          height: '45px', 
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Image
            alt="avatar"
            src={userDetails.profilePicture}
            className="rounded-circle"
            width={45}
            height={45}
            style={{
              objectFit: 'cover',
              border: '3px solid #e5e9f2',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            priority // Add priority to load image faster
          />
          <div
            style={{
              position: 'absolute',
              bottom: '1px',
              right: '1px',
              width: '15px',
              height: '15px',
              backgroundColor: '#00d27a',
              borderRadius: '50%',
              border: '2px solid #fff'
            }}
          />
        </div>
      ) : (
        <div style={{ 
          width: '45px', 
          height: '45px', 
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Image
            alt="default avatar"
            src="/images/avatar/NoProfile.png"
            className="rounded-circle"
            width={45}
            height={45}
            style={{
              objectFit: 'cover',
              border: '3px solid #e5e9f2',
              backgroundColor: '#f8f9fa',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            priority // Add priority to load image faster
          />
          <div
            style={{
              position: 'absolute',
              bottom: '5px',
              right: '5px',
              width: '12px',
              height: '12px',
              backgroundColor: '#00d27a',
              borderRadius: '50%',
              border: '2px solid #fff'
            }}
          />
        </div>
      )}
      {userDetails && (
        <div 
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: '-25px',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            width: '150px',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          <span className="text-dark small fw-bold">{userDetails.fullName}</span>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.userDetails?.profilePicture === nextProps.userDetails?.profilePicture &&
         prevProps.userDetails?.fullName === nextProps.userDetails?.fullName;
});

const SearchBar = React.memo(({ value, onChange, onSubmit, onClear }) => {
  return (
    <div className="position-relative">
      <div className="d-flex align-items-center">
        <div className="position-relative" style={{ width: '300px' }}>
          <InputGroup>
            <input
              type="text"
              placeholder="Search jobs, status, etc..."
              value={value}
              onChange={onChange}
              className="form-control border-end-0"
              style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '8px 0 0 8px',
                padding: '0.6rem 1rem',
                fontSize: '0.875rem',
              }}
            />
            {value && (
              <Button 
                variant="link"
                className="position-absolute top-50 translate-middle-y"
                onClick={onClear}
                style={{ 
                  background: 'none', 
                  border: 'none',
                  zIndex: 5,
                  right: '3.5rem',
                  padding: '0',
                  color: '#6c757d'
                }}
              >
                <FaTimes size={12} />
              </Button>
            )}
            <Button 
              onClick={onSubmit}
              variant="primary"
              className="d-flex align-items-center justify-content-center"
              disabled={!value.trim()}
              style={{
                borderRadius: '0 8px 8px 0',
                padding: '0.6rem 1.2rem',
                border: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <FaSearch size={14} />
            </Button>
          </InputGroup>
        </div>
      </div>
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

// Add these constants before the QuickMenu component
const DEFAULT_FILTERS = {
  status: 'all',
  type: 'all',
  dateRange: { start: null, end: null }
};

const DEFAULT_STATE = {
  userDetails: null,
  unreadCount: 0,
  notifications: [],
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  showSearchResults: false,
  followUps: [],
  followUpCount: 0,
  taskCount: 0,
  taskCategories: {
    followUps: [],
    appointments: [],
    reminders: []
  }
};

const QuickMenu = ({ children }) => {
  const router = useRouter();
  const hasMounted = useMounted();
  const isDesktop = useMediaQuery({ query: "(min-width: 1224px)" });
  const [userDetails, setUserDetails] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { logo, setLogo } = useLogo();
  const isOverviewPage = router.pathname === '/dashboard' || router.pathname === '/';

  // Remove duplicate session renewal hooks
  useEffect(() => {
    // Single source of session management
    const cleanup = initializeSessionRenewalCheck(router);
    return () => cleanup();
  }, [router]);

  // Memoize userDetails fetch
  const fetchUserDetails = useCallback(async () => {
    const email = Cookies.get("email");
    if (email) {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          setUserDetails(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching user details:", error.message);
      }
    } else {
      router.push("/sign-in");
    }
  }, [router]);

  // Optimize useEffect for userDetails
  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  // Sign out function
  const handleSignOut = async () => {
    try {
      // First show confirmation alert
      const confirmResult = await Swal.fire({
        title: '<span class="fw-bold text-primary">Sign Out? 👋</span>',
        html: `
          <div class="text-center mb-2">
            <div class="spinner-border text-primary mb-2" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <div class="text-muted mb-2">Are you sure you want to sign out?</div>
            <div class="progress" style="height: 6px;">
              <div class="progress-bar progress-bar-striped progress-bar-animated" 
                   role="progressbar" 
                   style="width: 100%">
              </div>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Yes, Sign Out',
        cancelButtonText: 'Cancel',
        allowOutsideClick: false,
        customClass: {
          popup: 'shadow-lg',
          confirmButton: 'btn btn-primary px-4 me-2',
          cancelButton: 'btn btn-outline-secondary px-4'
        },
        buttonsStyling: false
      });

      if (confirmResult.isConfirmed) {
        // Show loading state
        const loadingModal = Swal.fire({
          title: '<span class="fw-bold text-primary">Signing Out... 🔄</span>',
          html: `
            <div class="text-center mb-2">
              <div class="spinner-border text-primary mb-2" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <div class="text-muted mb-2">Clearing your session data...</div>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                     role="progressbar" 
                     style="width: 15%">
                </div>
              </div>
            </div>
          `,
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: async (modal) => {
            try {
              // Store current time as last login
              localStorage.setItem('lastLoginTime', new Date().toISOString());

              // Update progress - 30%
              modal.querySelector('.progress-bar').style.width = '30%';
              modal.querySelector('.text-muted').textContent = 'Disconnecting from SAP services...';
              await new Promise(resolve => setTimeout(resolve, 1000));

              // Perform logout API call
              const response = await fetch("/api/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: 'include',
              });

              if (!response.ok) throw new Error("Logout failed");

              // Update progress - 60%
              modal.querySelector('.progress-bar').style.width = '60%';
              modal.querySelector('.text-muted').textContent = 'Revoking access tokens...';
              await new Promise(resolve => setTimeout(resolve, 800));

              // Clear cookies
              const cookiesToClear = [
                'customToken', 'uid', 'isAdmin', 'email', 
                'workerId', 'LAST_ACTIVITY'
              ];
              cookiesToClear.forEach(cookie => Cookies.remove(cookie, { path: '/' }));

              // Update progress - 90%
              modal.querySelector('.progress-bar').style.width = '90%';
              modal.querySelector('.text-muted').textContent = 'Finalizing sign out...';
              await new Promise(resolve => setTimeout(resolve, 700));

              // Show success state
              modal.querySelector('.swal2-title').innerHTML = 
                '<span class="fw-bold text-success">Successfully Signed Out! 🎉</span>';
              modal.querySelector('.swal2-html-container').innerHTML = `
                <div class="text-center">
                  <div class="checkmark-circle mb-2">
                    <div class="checkmark draw"></div>
                  </div>
                  <div class="text-muted mb-2">You have been successfully signed out</div>
                  <div class="progress mb-2" style="height: 6px;">
                    <div class="progress-bar bg-success" role="progressbar" style="width: 100%"></div>
                  </div>
                  <div class="countdown-text text-muted small mb-2">
                    Redirecting in <span class="fw-bold text-primary">3</span> seconds...
                  </div>
                </div>
              `;

              // Countdown and redirect
              let countdown = 3;
              const countdownElement = modal.querySelector('.countdown-text .fw-bold');
              const countdownInterval = setInterval(() => {
                countdown--;
                if (countdownElement) {
                  countdownElement.textContent = countdown;
                }
                if (countdown <= 0) {
                  clearInterval(countdownInterval);
                  localStorage.removeItem('welcomeShown');
                  window.location.href = '/sign-in';
                }
              }, 1000);

            } catch (error) {
              throw error;
            }
          }
        });

      }
    } catch (error) {
      console.error("Error logging out:", error.message);
      
      Swal.fire({
        icon: 'error',
        iconColor: '#dc3545',
        title: '<span class="fw-bold text-danger">Sign Out Failed</span>',
        text: 'Unable to complete the sign out process. Please try again.',
        showConfirmButton: true,
        confirmButtonText: 'Try Again',
        customClass: {
          popup: 'shadow-lg',
          confirmButton: 'btn btn-primary px-4'
        },
        buttonsStyling: false
      });
    }
  };

  // Add these states for notifications
  const [notifications, setNotifications] = useState([]);
  // Get workerId from cookies instead
  const workerId = Cookies.get('workerId');

  // Add notification loading function
  const loadNotifications = async () => {
    try {
      if (!workerId) return; // Don't load if no worker ID
      
      const notificationsRef = collection(db, "notifications");
      const q = query(
        notificationsRef,
        where("workerId", "in", [workerId, "all"]),
        where("hidden", "==", false),
        orderBy("timestamp", "desc"),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const notificationsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setNotifications(notificationsList);
      const unreadCount = notificationsList.filter(n => !n.read).length;
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Add notification listener effect
  useEffect(() => {
    if (!workerId) return; // Don't set up listener if no worker ID

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("workerId", "in", [workerId, "all"]),
      where("hidden", "==", false),
      orderBy("timestamp", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const changes = snapshot.docChanges();
      if (changes.length > 0) {
        loadNotifications();
      }
    });

    // Initial load
    loadNotifications();

    return () => unsubscribe();
  }, [workerId]); // Add workerId as dependency

  // Add mark all as read function
  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach(notification => {
        if (!notification.read) {
          const notificationRef = doc(db, "notifications", notification.id);
          batch.update(notificationRef, { read: true });
        }
      });
      await batch.commit();
      
      // Update local state
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Add debounced search function
  const debouncedSearch = useCallback(
    debounce(async (value) => {
      if (!value.trim()) {
        setShowSearchResults(false);
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await globalQuickSearch(db, value, true);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Search error:', error);
        // Show a more user-friendly error message
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300), // 300ms delay
    [db]
  );

  // Memoize search handlers
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  const handleSearchSubmit = useCallback((e) => {
    e?.preventDefault?.();
    if (!searchQuery.trim()) return;

    setShowSearchResults(false);
    setSearchResults([]);
    
    toast.info('Searching...', {
      position: "top-right",
      autoClose: 1000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      style: {
        fontFamily: 'Inter, sans-serif',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      },
      className: 'bg-white',
      toastId: 'search-start'
    });

    router.push({
      pathname: '/dashboard/search', 
      query: { q: searchQuery.trim() }
    });
  }, [searchQuery, router]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
  }, []);

  // Add memoized search render
  const renderSearch = useMemo(() => {
    if (isOverviewPage) return null;
    
    return (
      <li className="me-4">
        <SearchBar 
          value={searchQuery}
          onChange={handleSearchChange}
          onSubmit={handleSearchSubmit}
          onClear={handleClearSearch}
        />
      </li>
    );
  }, [isOverviewPage, searchQuery, handleSearchChange, handleSearchSubmit, handleClearSearch]);

  // Optimize company logo fetch
  useEffect(() => {
    const loadCompanyDetails = async () => {
      if (logo === '/images/SAS-LOGO.png') {
        const cachedLogo = localStorage.getItem('companyLogo');
        if (cachedLogo) {
          setLogo(cachedLogo);
        } else {
          const companyData = await getCompanyDetails();
          if (companyData?.logo) {
            setLogo(companyData.logo);
            localStorage.setItem('companyLogo', companyData.logo);
          }
        }
      }
    };

    loadCompanyDetails();
  }, [logo, setLogo]);

  // Add this effect to clear search when route changes
  useEffect(() => {
    // Clear search when route changes
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
  }, [router.pathname]);

  // Add clearSearch handler
  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
  };

  // Add necessary states
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [taskCategories, setTaskCategories] = useState({
    followUps: [],
    appointments: [],
    reminders: []
  });
  const [taskCount, setTaskCount] = useState(0);

  // Modified task fetching logic
  useEffect(() => {
    const fetchJobTasks = async () => {
      if (!workerId) return;
      
      try {
        const jobsRef = collection(db, "jobs");
        // Modified query to match your data structure
        const q = query(
          jobsRef,
          where("assignedWorkers", "array-contains", {
            workerId: workerId,
            workerName: userDetails?.fullName || ''
          }),
          where("jobStatus", "in", ["Created", "In Progress"])
        );

        const querySnapshot = await getDocs(q);
        let tasks = {
          followUps: [],
          appointments: [],
          reminders: []
        };

        querySnapshot.docs.forEach(doc => {
          const jobData = doc.data();
          // console.log('Job Data:', jobData); // Debug log
          
          // Process taskList if it exists
          if (jobData.taskList && Array.isArray(jobData.taskList)) {
            jobData.taskList.forEach(task => {
              // Check if task is not done
              if (!task.isDone) {
                const taskWithContext = {
                  ...task,
                  jobID: jobData.jobID,
                  jobName: jobData.jobName,
                  customerName: jobData.customerName,
                  startDate: jobData.startDate,
                  endDate: jobData.endDate,
                  priority: jobData.priority || 'Low'
                };

                // Categorize tasks based on type or default to reminders
                if (task.type === 'follow-up') {
                  tasks.followUps.push(taskWithContext);
                } else if (task.type === 'appointment') {
                  tasks.appointments.push(taskWithContext);
                } else {
                  tasks.reminders.push(taskWithContext);
                }
              }
            });
          }
        });

        // console.log('Processed Tasks:', tasks); // Debug log

        setTaskCategories(tasks);
        const totalTasks = Object.values(tasks).reduce((acc, arr) => acc + arr.length, 0);
        setTaskCount(totalTasks);
      } catch (error) {
        console.error('Error loading tasks:', error);
        toast.error('Error loading tasks');
      }
    };

    if (workerId) {
      fetchJobTasks();
    }
  }, [workerId, userDetails?.fullName]); // Add userDetails.fullName as dependency

  // Add these states
  const [followUpFilters, setFollowUpFilters] = useState({
    status: 'all',
    type: 'all',
    dateRange: {
      start: null,
      end: null
    }
  });
  const [followUpCount, setFollowUpCount] = useState(0);
  const [followUps, setFollowUps] = useState([]);

  // Modified filter implementation
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    dateRange: {
      start: null,
      end: null
    }
  });

  useEffect(() => {
    if (!workerId) return;

    const fetchFollowUps = async () => {
      try {
        // Query jobs with follow-ups
        const jobsRef = collection(db, "jobs");
        const q = query(
          jobsRef,
          where("followUpCount", ">", 0),
          orderBy("lastFollowUp", "desc")
        );

        // console.log('Starting follow-ups fetch...'); // Debug log 1

        const unsubscribe = onSnapshot(q, (snapshot) => {
          // console.log('Jobs snapshot received:', snapshot.size, 'documents'); // Debug log 2
          
          let allFollowUps = [];

          snapshot.docs.forEach(doc => {
            const jobData = doc.data();
            // console.log('Processing job:', jobData.jobID); // Debug log 3
            // console.log('Job followUps:', jobData.followUps); // Debug log 4
            
            if (jobData.followUps) {
              Object.entries(jobData.followUps).forEach(([followUpId, followUp]) => {
                // console.log('Processing followUp:', followUpId, followUp); // Debug log 5

                const statusMatch = filters.status === 'all' || followUp.status === filters.status;
                const typeMatch = filters.type === 'all' || followUp.type === filters.type;
                
                let dateMatch = true;
                if (filters.dateRange.start && filters.dateRange.end) {
                  const followUpDate = new Date(followUp.createdAt);
                  const startDate = new Date(filters.dateRange.start);
                  const endDate = new Date(filters.dateRange.end);
                  dateMatch = followUpDate >= startDate && followUpDate <= endDate;
                }

                // console.log('Filter matches:', { // Debug log 6
                //   statusMatch,
                //   typeMatch,
                //   dateMatch,
                //   currentFilters: filters,
                //   followUpStatus: followUp.status,
                //   followUpType: followUp.type,
                //   followUpDate: followUp.createdAt
                // });

                if (statusMatch && typeMatch && dateMatch) {
                  allFollowUps.push({
                    id: followUpId,
                    ...followUp,
                    jobID: jobData.jobID,
                    jobName: jobData.jobName,
                    customerName: jobData.customerName,
                    customerID: jobData.customerID
                  });
                }
              });
            }
          });

          // console.log('Final filtered follow-ups:', allFollowUps); // Debug log 7
          setFollowUps(allFollowUps);
          setFollowUpCount(allFollowUps.length);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching follow-ups:", error);
        toast.error("Error loading follow-ups");
      }
    };

    fetchFollowUps();
  }, [workerId, filters]); // Add filters as dependency

  // Update the filter change handler with logging
  const handleFilterChange = (type, value) => {
    // console.log('Filter change:', { type, value });
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [type]: value
      };
      // console.log('New filters state:', newFilters);
      return newFilters;
    });
  };

  // Add this state at the top with other states
  const [followUpTypes, setFollowUpTypes] = useState([]);

  // Update the fetchFollowUpTypes function
  const fetchFollowUpTypes = async () => {
    try {
      const settingsRef = doc(db, 'settings', 'followUp');
      const settingsDoc = await getDoc(settingsRef);
      
      // console.log('Raw followUp settings:', settingsDoc.data());
      
      if (settingsDoc.exists() && settingsDoc.data().types) {
        const types = settingsDoc.data().types;
        const processedTypes = Object.entries(types).map(([id, type]) => ({
          id,
          ...type
        }));
        // console.log('Processed follow-up types:', processedTypes);
        setFollowUpTypes(processedTypes);
      }
    } catch (error) {
      console.error('Error fetching follow-up types:', error);
    }
  };

  // Add this useEffect to fetch types when component mounts
  useEffect(() => {
    fetchFollowUpTypes();
  }, []);

  // Add this function to handle View All click
  const handleViewAllFollowUps = () => {
    // Reset all filters to default
    setFilters({
      status: 'all',
      type: 'all',
      dateRange: {
        start: null,
        end: null
      }
    });

    // Navigate to follow-ups page with reset filters
    router.push({
      pathname: '/dashboard/follow-ups',
      query: {
        status: 'all',
        type: 'all'
      }
    });
  };

  return (
    <Fragment>
      <ListGroup
        as="ul"
        bsPrefix="navbar-nav"
        className="navbar-right-wrap ms-2 d-flex nav-top-wrap align-items-center"
      >
        {renderSearch}

        {/* Notification Dropdown */}
        {/* <Dropdown as="li">
          <Dropdown.Toggle
            as="a"
            bsPrefix=" "
            id="dropdownNotification"
            className="text-dark icon-notifications me-lg-1 btn btn-light btn-icon rounded-circle text-muted position-relative"
          >
            <i className="fe fe-bell"></i>
            {unreadCount > 0 && (
              <Badge
                bg="danger"
                pill
                className="position-absolute top-0 start-100 translate-middle"
                style={{
                  transform: "translate(-25%, 25%)",
                  fontSize: "0.75rem",
                }}
              >
                {unreadCount}
              </Badge>
            )}
          </Dropdown.Toggle>
          <Dropdown.Menu
            className="dashboard-dropdown notifications-dropdown dropdown-menu-lg dropdown-menu-end mt-4 py-0"
            aria-labelledby="dropdownNotification"
            align="end"
            show={hasMounted && isDesktop ? true : false}
          >
            <Dropdown.Item className="mt-3" bsPrefix=" " as="div">
              <div className="border-bottom px-3 pt-0 pb-3 d-flex justify-content-between align-items-end">
                <span className="h4 mb-0">Notifications</span>
                <Link href="/dashboard/settings#notifications" className="text-muted">
                  <i className="fe fe-settings me-1"></i>
                </Link>
              </div>
              <SimpleBar style={{ maxHeight: "300px" }}>
                <ListGroup variant="flush">
                  {notifications.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="mb-0 text-muted">No notifications</p>
                    </div>
                  ) : (
                    notifications.map(notification => (
                      <NotificationItem 
                        key={notification.id} 
                        notification={notification}
                        onRead={() => markNotificationAsRead(notification.id)}
                      />
                    ))
                  )}
                </ListGroup>
              </SimpleBar>
              {notifications.length > 0 && (
                <div className="border-top p-3 text-center">
                  <button
                    className="btn btn-link text-primary"
                    onClick={markAllAsRead}
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown> */}

        {/* User Dropdown */}
        <Dropdown as="li" className="ms-2">
          <Dropdown.Toggle
            as="a"
            bsPrefix=" "
            className="rounded-circle"
            id="dropdownUser"
          >
            <UserAvatar userDetails={userDetails} />
          </Dropdown.Toggle>
          <Dropdown.Menu
            className="dashboard-dropdown dropdown-menu-end mt-4 py-0"
            align="end"
            aria-labelledby="dropdownUser"
            show={hasMounted && isDesktop ? true : false}
          >
            <Dropdown.Item className="mt-3">
              <div className="d-flex">
                {userDetails && (
                  <div>
                    <h5 className="mb-1">{userDetails.fullName}</h5>
                    <p className="mb-0 text-muted">{userDetails.email}</p>
                  </div>
                )}
              </div>
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item
              as={Link}
              href="/dashboard/profile/myprofile"
            >
              <i className="fe fe-user me-2"></i> Profile
            </Dropdown.Item>
            <Dropdown.Item
              as={Link}
              href="/dashboard/settings"
            >
              <i className="fe fe-settings me-2"></i> Settings
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item
              onClick={() => window.open("https://pixelcareconsulting.myfreshworks.com/login", "_blank")}
            >
              <i className="fe fe-help-circle me-2"></i> Help
            </Dropdown.Item>
            <Dropdown.Item className="mb-3" onClick={handleSignOut}>
              <i className="fe fe-power me-2"></i> Sign Out
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

      
      </ListGroup>

    </Fragment>
  );
};

// Memoize the entire QuickMenu component
export default React.memo(QuickMenu);
