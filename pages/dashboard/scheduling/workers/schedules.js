import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  TimelineViews,
  TimelineMonth,
  Agenda,
  ScheduleComponent,
  ViewsDirective,
  ViewDirective,
  ResourcesDirective,
  ResourceDirective,
  Inject,
} from "@syncfusion/ej2-react-schedule";
import { db, auth } from "../../../../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  setDoc,
  doc,
  arrayUnion,
  updateDoc,
  getDoc,
  addDoc,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import { ClipLoader } from "react-spinners";
import { toast, ToastContainer } from "react-toastify";
import { onAuthStateChanged } from "firebase/auth";
import { ChevronDown } from "lucide-react";
import { extend } from "@syncfusion/ej2-base";
import { DropDownListComponent } from "@syncfusion/ej2-react-dropdowns";
import { DateTimePickerComponent } from "@syncfusion/ej2-react-calendars";
import styles from "./SchedulerStyles.module.css";
import { GeeksSEO, GridListViewButton } from "widgets";
import {
  Row,
  Col,
  Card,
  Image,
  OverlayTrigger,
  Tooltip,
  Breadcrumb,
  ListGroup,
  Form,
  InputGroup,
} from "react-bootstrap";
import { faLessThanEqual } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import quickInfoStyles from '../jobs/calendar.module.css';  // Adjust the path based on your file structure
import { BsClock, BsFillPersonFill, BsGeoAlt, BsCalendarCheck, BsBuilding, BsTools, BsX, BsArrowRight,BsCalendar } from "react-icons/bs"; 
import Link from 'next/link';
import 'react-toastify/dist/ReactToastify.css';
import { initializeSessionRenewalCheck, validateSession } from 'utils/middlewareClient';

const LoadingOverlay = () => (
  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white/90 backdrop-blur rounded-2xl p-8 shadow-2xl flex flex-col items-center" 
      style={{ 
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid rgba(65, 113, 245, 0.1)',
        maxWidth: '400px',
        width: '90%'
      }}>
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-spin-slow">
          <svg className="w-12 h-12" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="#4171F5" 
              strokeWidth="4" 
              fill="none"
            />
            <path 
              className="opacity-75" 
              fill="#4171F5" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      </div>
      <h4 className="text-xl font-semibold mb-3 bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
        Preparing Your Workspace
      </h4>
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-gray-600 text-center">
          Loading schedules and assignments...
        </p>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  </div>
);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return 'Duration not available';
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMs = end - start;
  
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) {
    return `${minutes} minutes`;
  } else if (minutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} min`;
  }
};

const generatePastelColor = () => {
  const mix = 0.8;
  const red = Math.floor((Math.random() * 256 * (1 - mix)) + (255 * mix));
  const green = Math.floor((Math.random() * 256 * (1 - mix)) + (255 * mix));
  const blue = Math.floor((Math.random() * 256 * (1 - mix)) + (255 * mix));
  return `rgb(${red}, ${green}, ${blue})`;
};

const processWorkers = (workers) => {
  return workers.map(worker => ({
    ...worker,
    color: generatePastelColor(),
    text: worker.text || `${worker.firstName} ${worker.lastName}`,
    id: worker.id
  }));
};

const FieldServiceSchedules = () => {
  const [fieldWorkers, setFieldWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [scheduleData, setScheduleData] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const scheduleRef = useRef(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const router = useRouter();

  // Add stats state
  const [stats, setStats] = useState({
    totalWorkers: 0,
    activeJobs: 0,
    lastFetchTime: null
  });

  // Define updateStats first
  const updateStats = useCallback((workers, jobs) => {
    setStats(prevStats => ({
      totalWorkers: workers?.length || prevStats.totalWorkers,
      activeJobs: jobs?.length || prevStats.activeJobs,
      lastFetchTime: Date.now()
    }));
  }, []);

  // Add workDays definition - this sets Monday to Saturday as work days
  const workDays = [1, 2, 3, 4, 5, 6]; // 0 = Sunday, 1 = Monday, etc.

  // Filter workers based on search
  useEffect(() => {
    if (fieldWorkers.length > 0) {
      const filtered = fieldWorkers.filter(worker =>
        worker.text.toLowerCase().includes(searchFilter.toLowerCase())
      );
      const processedWorkers = processWorkers(filtered);
      setFilteredWorkers(processedWorkers);
      console.log('Filtered workers:', processedWorkers);
    }
  }, [fieldWorkers, searchFilter]);

  // Debug effect - separate from filtered data
  useEffect(() => {
    console.log('Current state:', {
      workers: fieldWorkers,
      filteredWorkers,
      scheduleData
    });
  }, [fieldWorkers, filteredWorkers, scheduleData]);

  // Then define setupWorkerJobsListener
  const setupWorkerJobsListener = useCallback((worker) => {
    console.log(`Setting up jobs listener for worker: ${worker.text} (${worker.id})`);
    
    const jobsQuery = query(
      collection(db, "jobs"),
      where("assignedWorkers", "array-contains", { workerId: worker.id })
    );

    return onSnapshot(jobsQuery, (snapshot) => {
      console.log(`Found ${snapshot.docs.length} jobs for worker ${worker.text}`);
      
      const workerJobs = snapshot.docs.map(doc => {
        const jobData = doc.data();
        console.log('Job data:', jobData);

        // Handle date conversion
        const startDate = jobData.startDate instanceof Timestamp 
          ? jobData.startDate.toDate() 
          : new Date(jobData.startDate);
        
        const endDate = jobData.endDate instanceof Timestamp 
          ? jobData.endDate.toDate() 
          : new Date(jobData.endDate);

        return {
          Id: doc.id,
          WorkerId: worker.id,
          Subject: jobData.jobName || "Untitled Job",
          StartTime: startDate,
          EndTime: endDate,
          Description: jobData.jobDescription || "",
          JobStatus: jobData.jobStatus || "Pending",
          Customer: jobData.customerName || "No Customer",
          ServiceLocation: jobData.location?.locationName || "No Location",
          Equipment: jobData.equipments?.[0]?.itemName || "No Equipment",
          ServiceCall: jobData.serviceCallID || "N/A",
          Priority: jobData.priority || "Normal",
          Category: jobData.category || "General",
          IsAllDay: false,
          Status: jobData.jobStatus || "Pending"
        };
      });

      setScheduleData(prevData => {
        const filteredData = prevData.filter(job => job.WorkerId !== worker.id);
        const newData = [...filteredData, ...workerJobs];
        updateStats(null, newData); // Update only job count
        return newData;
      });
    });
  }, [updateStats]);

  // Then define setupWorkersListener
  const setupWorkersListener = useCallback(() => {
    console.log("Setting up workers listener");
    const workersQuery = query(
      collection(db, "users"),
      where("role", "==", "Worker"),
      where("isActive", "==", true)
    );

    return onSnapshot(workersQuery, (snapshot) => {
      const workers = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.fullName || `${data.firstName} ${data.lastName}`.trim(),
          color: data.color || '#1a73e8'
        };
      });
      
      console.log('Fetched workers:', workers);
      setFieldWorkers(workers);
      setFilteredWorkers(workers);
      updateStats(workers, null);

      workers.forEach(worker => {
        setupWorkerJobsListener(worker);
      });
    });
  }, [updateStats, setupWorkerJobsListener]);

  // Initialize listeners
  useEffect(() => {
    const unsubscribe = setupWorkersListener();
    return () => unsubscribe();
  }, [setupWorkersListener]);

  // Template functions
  const headerTemplate = (props) => {
    // Check if this is an empty cell or existing event
    const isEmptyCell = !props.Subject;

    return (
      <div className={styles.headerContainer}>
        <div className={styles.headerBar} style={{ backgroundColor: isEmptyCell ? '#4171F5' : '#90EE90' }}>
          {isEmptyCell ? 'New Job Assignment' : props.Subject}
          <button 
            className={styles.closeButton}
            onClick={() => {
              if (scheduleRef.current) {
                scheduleRef.current.closeQuickInfoPopup();
              }
            }}
          >
            <BsX size={20} />
          </button>
        </div>
      </div>
    );
  };

  const contentTemplate = (props) => {
    // Check if this is an empty cell
    const isEmptyCell = !props.Subject;

    if (isEmptyCell) {
      // Get the worker info based on the cell's resource
      const workerId = props.GroupIndex !== undefined ? filteredWorkers[props.GroupIndex]?.id : null;
      const workerName = filteredWorkers[props.GroupIndex]?.text || 'Unknown Worker';
      
      return (
        <div className={styles.quickInfoContent}>
          <h2 className={styles.title}>Create New Job</h2>
          
          <div className={styles.infoRow}>
            <BsClock className={styles.icon} />
            <span>Time:</span>
            <div className={styles.infoValue}>
              {props.startTime?.toLocaleTimeString()} - {props.endTime?.toLocaleTimeString()}
            </div>
          </div>

          <div className={styles.infoRow}>
            <BsFillPersonFill className={styles.icon} />
            <span>Worker:</span>
            <div className={styles.infoValue}>
              {workerName}
            </div>
          </div>

          <div className={styles.emptyMessage}>
            Double-click to create a new job assignment
          </div>
        </div>
      );
    }

    // Original template for existing events
    return (
      <div className={styles.quickInfoContent}>
        <h2 className={styles.title}>{props.Subject}</h2>
        
        <div className={`${styles.priorityBadge} ${styles.high}`}>
          High
        </div>

        <div className={styles.infoRow}>
          <BsClock className={styles.icon} />
          <span>0 hours</span>
        </div>

        <div className={styles.infoRow}>
          <BsGeoAlt className={styles.icon} />
          <span>Location</span>
          <div className={styles.infoValue}>
            {props.ServiceLocation}
          </div>
        </div>

        <div className={styles.infoRow}>
          <BsBuilding className={styles.icon} />
          <span>Customer</span>
          <div className={styles.infoValue}>
            {props.Customer}
          </div>
        </div>

        <div className={styles.infoRow}>
          <BsTools className={styles.icon} />
          <span>Equipment</span>
          <div className={styles.infoValue}>
            {props.Equipment}
          </div>
        </div>

        <div className={styles.infoRow}>
          <BsCalendarCheck className={styles.icon} />
          <span>Service Call</span>
          <div className={styles.infoValue}>
            {props.ServiceCall || 'N/A'}
          </div>
        </div>
      </div>
    );
  };

  const footerTemplate = (props) => {
    // Check if this is an empty cell
    const isEmptyCell = !props.Subject;

    if (isEmptyCell) {
      return (
        <div className={styles.quickInfoFooter}>
          <button 
            className={styles.createButton}
            onClick={() => handleCellDoubleClick(props)}
          >
            Create Job
            <BsArrowRight size={16} />
          </button>
        </div>
      );
    }

    // Original footer for existing events
    return (
      <div className={styles.quickInfoFooter}>
        <button 
          className={styles.viewDetailsButton}
          onClick={() => router.push(`/jobs/view/${props.Id}`)}
        >
          View Details
          <BsArrowRight size={16} />
        </button>
        <div className={styles.actionButtons}>
          {/* <button className={styles.editButton}>
            Edit
          </button>
          <button className={styles.deleteButton}>
            Delete
          </button> */}
        </div>
      </div>
    );
  };

  // Cell double click handler
  const handleCellDoubleClick = useCallback((args) => {
    console.log('Double Click Event:', args);
    
    // Cancel the default behavior
    args.cancel = true;

    // Check if clicking on an appointment
    if (args.element && 
        (args.element.classList.contains('e-appointment') || 
         args.element.closest('.e-appointment'))) {
      console.log('Double clicked on appointment');
      
      let eventElement = args.element.classList.contains('e-appointment') 
        ? args.element 
        : args.element.closest('.e-appointment');
      
      const eventData = scheduleRef.current.getEventDetails(eventElement);
      console.log('Event Data:', eventData);
      
      if (eventData && scheduleRef.current) {
        scheduleRef.current.showQuickInfo(eventData);
      }
      return;
    }

    // Handle empty cell double-click with SweetAlert
    if (args.element.classList.contains('e-work-cells')) {
      const startTime = args.startTime;
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      const workerId = args.groupIndex !== undefined ? filteredWorkers[args.groupIndex].id : null;
      const workerName = filteredWorkers[args.groupIndex]?.text || 'Unknown Worker';

      Swal.fire({
        title: 'Create a Job?',
        text: `Are you sure you want to create a job for ${workerName}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, create job'
      }).then((result) => {
        if (result.isConfirmed) {
          router.push({
            pathname: '/jobs/create',
            query: {
              startDate: startTime.toISOString().split('T')[0],
              endDate: endTime.toISOString().split('T')[0],
              startTime: startTime.toTimeString().split(' ')[0],
              endTime: endTime.toTimeString().split(' ')[0],
              workerId: workerId,
              scheduleSession: 'custom'
            }
          });
        }
      });
    }
  }, [filteredWorkers, router]);

  // Calculate filtered schedule data
  const filteredScheduleData = scheduleData.filter(event => 
    filteredWorkers.some(worker => worker.id === event.WorkerId)
  );

  // Add this effect for page refresh
  useEffect(() => {
    // Function to handle route change complete
    const handleRouteChangeComplete = (url) => {
      if (url === '/schedule') {
        console.log('Schedule page visited - refreshing...');
        window.location.reload();
      }
    };

    // Subscribe to router events
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    // Cleanup subscription
    return () => {
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router]);

  // Handle popup opening
  const onPopupOpen = (args) => {
    console.log('Popup Open Event:', args);
    
    // Always cancel for empty cells or non-appointment elements
    if (!args.data || 
        args.target.classList.contains('e-work-cells') || 
        args.target.classList.contains('e-alternate-cells')) {
      console.log('Empty cell, canceling popup');
      args.cancel = true;
      return;
    }
    
    // Only allow quick info for appointments
    if (args.type === 'QuickInfo' && 
        (args.target.classList.contains('e-appointment') || 
         args.target.closest('.e-appointment'))) {
      console.log('Has event data, showing custom popup');
      return;
    }
    
    // Cancel all other popups
    args.cancel = true;
  };

  // Handle cell clicking
  const onCellClick = (args) => {
    console.log('Cell Click Event:', args);
    console.log('Element Classes:', args.element.classList);
    
    if (args.element.classList.contains('e-appointment')) {
      console.log('Clicked on appointment');
      const eventData = scheduleRef.current.getEventDetails(args.element);
      console.log('Event Data:', eventData);
      
      if (eventData) {
        console.log('Opening Quick Info for event');
        scheduleRef.current.openEditor(eventData, 'QuickInfo');
      }
    }
  };

  // Define colors outside of the component to avoid recreation
  const eventColors = [
    '#FF9999', // Light Red
    '#99FF99', // Light Green
    '#9999FF', // Light Blue
    '#FFFF99', // Light Yellow
    '#FF99FF', // Light Magenta
    '#99FFFF', // Light Cyan
    '#FFB366', // Light Orange
    '#99FF66', // Lime Green
    '#FF99CC', // Pink
    '#99CCFF', // Sky Blue
    '#FF8533', // Orange
    '#33FF33', // Bright Green
    '#3399FF', // Blue
  ];

  // Event rendering function
  const onEventRendered = useCallback((args) => {
    if (args.data && args.element) {
      const workerId = args.data.WorkerId;
      const colorIndex = workerId % eventColors.length;
      args.element.style.backgroundColor = eventColors[colorIndex];
    }
  }, []); // Empty dependency array since eventColors is defined outside

  return (
    <div>
      <GeeksSEO title="Worker Schedules | SAS&ME - SAP B1 | Portal" />

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
                      letterSpacing: "-0.02em"
                    }}
                  >
                    Workers Dispatch
                  </h1>
                  <p 
                    className="mb-2" 
                    style={{ 
                      fontSize: "16px",
                      color: "rgba(255, 255, 255, 0.7)",
                      fontWeight: "400",
                      lineHeight: "1.5"
                    }}
                  >
                    Manage and monitor field service schedules and assignments in real-time
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
                      Double-click on any time slot to create a new job assignment
                    </span>
                  </div>
                </div>

                {/* Status Badges */}
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
                    <BsCalendar size={14} className="me-1" />
                    Scheduling
                  </span>
                </div>

                {/* Breadcrumbs */}
                <nav
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
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
                    <span className="mx-2" style={{ color: "rgba(255, 255, 255, 0.7)" }}>/</span>
                    <Link
                      href="/workers"
                      className="text-decoration-none"
                      style={{ color: "rgba(255, 255, 255, 0.7)" }}
                    >
                      Workers
                    </Link>
                    <span className="mx-2" style={{ color: "rgba(255, 255, 255, 0.7)" }}>/</span>
                    <span style={{ color: "#FFFFFF" }}>Workers Dispatch</span>
                  </div>
                </nav>
              </div>

              {/* Stats Badges */}
              <div className="d-flex gap-3">
                <OverlayTrigger
                  placement="bottom"
                  overlay={
                    <Tooltip>
                      <div className="text-start">
                        <div className="fw-semibold mb-1">Total Active Workers</div>
                        <div className="small">
                          Last updated: {stats.lastFetchTime ? new Date(stats.lastFetchTime).toLocaleTimeString() : 'N/A'}
                        </div>
                        <div className="small text-muted">
                          Shows the total number of active field workers
                        </div>
                      </div>
                    </Tooltip>
                  }
                >
                  <div 
                    className="badge d-flex align-items-center gap-2"
                    style={{
                      background: "#FFFFFF",
                      color: "#4171F5",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "help"  // Add cursor style to indicate tooltip
                    }}
                  >
                    <i className="fe fe-users"></i>
                    Total Workers: {stats.totalWorkers}
                  </div>
                </OverlayTrigger>

                <OverlayTrigger
                  placement="bottom"
                  overlay={
                    <Tooltip>
                      <div className="text-start">
                        <div className="fw-semibold mb-1">Active Job Assignments</div>
                        <div className="small">
                          Last updated: {stats.lastFetchTime ? new Date(stats.lastFetchTime).toLocaleTimeString() : 'N/A'}
                        </div>
                        <div className="small text-muted">
                          Current number of active job assignments across all workers
                        </div>
                      </div>
                    </Tooltip>
                  }
                >
                  <div 
                    className="badge d-flex align-items-center gap-2"
                    style={{
                      background: "rgba(255, 255, 255, 0.2)",
                      color: "#FFFFFF",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "help"  // Add cursor style to indicate tooltip
                    }}
                  >
                    <BsCalendar size={14} />
                    Active Jobs: {stats.activeJobs}
                  </div>
                </OverlayTrigger>
              </div>
            </div>
          </div>
        </Col>
      </Row>
      <div className="schedule-control-section">
        <ToastContainer position="top-right" autoClose={5000} />
        <div className="col-lg-12 control-section">
          <div className="control-wrapper">
            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Search Workers</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Search by worker name"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <ScheduleComponent
              ref={scheduleRef}
              cssClass="timeline-resource-grouping"
              width="100%"
              height="650px"
              currentView="TimelineDay"
              selectedDate={currentDate}
              startHour="06:00"
              endHour="21:00"
              workDays={workDays}
              popupOpen={onPopupOpen}
              eventRendered={onEventRendered}
              eventSettings={{
                dataSource: filteredScheduleData,
                fields: {
                  id: 'Id',
                  subject: { name: 'Subject', title: 'Job Name' },
                  startTime: { name: 'StartTime' },
                  endTime: { name: 'EndTime' },
                  description: { name: 'Description' },
                  workerId: { name: 'WorkerId' },
                  status: { name: 'Status' }
                },
                enableTooltip: true,
                allowEditing: false,
                enableQuickInfoPopup: false
              }}
              group={{ resources: ["Workers"] }}
              quickInfoTemplates={{
                header: headerTemplate,
                content: contentTemplate,
                footer: footerTemplate,
              }}
              cellDoubleClick={handleCellDoubleClick}
            >
              <ResourcesDirective>
                <ResourceDirective
                  field="WorkerId"
                  title="Field Workers"
                  name="Workers"
                  allowMultiple={false}
                  dataSource={filteredWorkers}
                  textField="text"
                  idField="id"
                />
              </ResourcesDirective>
              <ViewsDirective>
                <ViewDirective option="TimelineDay" />
                <ViewDirective option="TimelineWeek" />
                <ViewDirective option="TimelineWorkWeek" />
                <ViewDirective option="TimelineMonth" />
                <ViewDirective option="Agenda" />
              </ViewsDirective>
              <Inject services={[TimelineViews, TimelineMonth, Agenda]} />
            </ScheduleComponent>
          </div>
        </div>
      </div>
    </div>
  );
};

// Session monitor initialization
const initializeSessionMonitor = ({ onSessionExpired, onSessionWarning }) => {
  const checkInterval = setInterval(async () => {
    const isValid = await validateSession();
    if (!isValid) {
      onSessionExpired();
      clearInterval(checkInterval);
    }
  }, 30000); // Check every 30 seconds

  return () => clearInterval(checkInterval);
};

export default FieldServiceSchedules;