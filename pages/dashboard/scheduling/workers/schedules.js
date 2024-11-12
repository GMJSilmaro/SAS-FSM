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
  Button,
  InputGroup,
  Badge,
} from "react-bootstrap";
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import { BsClock, BsFillPersonFill, BsGeoAlt, BsCalendarCheck, BsBuilding, BsTools, BsX, BsArrowRight,BsCalendar, BsFillPersonBadgeFill, BsCode, BsBriefcase, BsGear, BsPlus, BsCircleFill, BsFlag, BsEye } from "react-icons/bs"; 
import Link from 'next/link';
import 'react-toastify/dist/ReactToastify.css';
import { initializeSessionRenewalCheck, validateSession } from 'utils/middlewareClient';
import SchedulerFilterPanel from './SchedulerFilterPanel';
import { format, parseISO, isValid } from 'date-fns';

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
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 80%)`; // Saturation 70%, Lightness 80% for pastel look
};

// Define a larger set of predefined colors
const WORKER_COLORS = {
  'W-001': '#B8B5FF', // Gilbert
  'W-002': '#B5FFB8', // Devin
  'W-003': '#FFB5B8', // Pixel Care
  // Add more predefined colors
  'W-004': '#FFE4B5', // Light Orange
  'W-005': '#98FB98', // Pale Green
  'W-006': '#DDA0DD', // Plum
  'W-007': '#87CEEB', // Sky Blue
  'W-008': '#F0E68C', // Khaki
  'W-009': '#E6E6FA', // Lavender
  'W-010': '#FFDAB9', // Peach
};

// Add a function to generate a deterministic color based on workerId
const getWorkerColor = (workerId) => {
  // First check if there's a predefined color
  if (WORKER_COLORS[workerId]) {
    return WORKER_COLORS[workerId];
  }

  // If no predefined color, generate a deterministic color based on workerId
  const colorPalette = [
    '#FFB5B5', // Light Red
    '#B5FFB5', // Light Green
    '#B5B5FF', // Light Blue
    '#FFE4B5', // Light Orange
    '#98FB98', // Pale Green
    '#DDA0DD', // Plum
    '#87CEEB', // Sky Blue
    '#F0E68C', // Khaki
    '#E6E6FA', // Lavender
    '#FFDAB9', // Peach
    '#B5E4FF', // Light Azure
    '#FFB5E4', // Light Pink
    '#E4FFB5', // Light Lime
  ];

  // Use the workerId string to generate a consistent index
  const hash = workerId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  // Use the hash to pick a color from the palette
  const index = Math.abs(hash) % colorPalette.length;
  return colorPalette[index];
};

const processWorkers = (workers) => {
  return workers.map(worker => ({
    ...worker,
    color: getWorkerColor(worker.workerId || worker.id),
    text: worker.fullName || worker.text || `${worker.firstName} ${worker.lastName}`,
    id: worker.workerId || worker.id,
    workerId: worker.workerId
  }));
};

const formatDate = (date) => {
  if (!date) return '';
  try {
    return date.toLocaleString();
  } catch (error) {
    console.warn('Error formatting date:', error);
    return '';
  }
};

const FieldServiceSchedules = () => {
  const [fieldWorkers, setFieldWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [scheduleData, setScheduleData] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const scheduleRef = useRef(null);
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    // If it's after 6 PM, show tomorrow's schedule
    if (today.getHours() >= 18) {
      today.setDate(today.getDate() + 1);
    }
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const router = useRouter();

  // Add stats state
  const [stats, setStats] = useState({
    totalWorkers: 0,
    activeJobs: 0,
    lastFetchTime: null
  });

  // Calculate filtered schedule data
  const filteredScheduleData = useMemo(() => {
    const filtered = scheduleData.filter(event => 
      filteredWorkers.some(worker => worker.id === event.WorkerId)
    );
    console.log('Filtered schedule data calculation:', {
      allData: scheduleData,
      filteredWorkers,
      result: filtered
    });
    return filtered;
  }, [scheduleData, filteredWorkers]);

  // Define updateStats after filteredScheduleData is defined
  const updateStats = useCallback((workers, jobs) => {
    setStats(prevStats => ({
      totalWorkers: workers?.length || prevStats.totalWorkers,
      activeJobs: jobs?.length || 0,
      lastFetchTime: Date.now()
    }));
  }, []);

  // Add effect to update stats when filtered data changes
  useEffect(() => {
    updateStats(fieldWorkers, filteredScheduleData);
  }, [fieldWorkers, filteredScheduleData, updateStats]);

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

  // Helper function to safely get date fields from job data
  const getJobDates = (job) => {
    const data = job?.data || {};
    return {
      startDate: data.startDate || null,
      startTime: data.startTime || null,
      endDate: data.endDate || null,
      endTime: data.endTime || null
    };
  };

  // Updated parseDate function with null checks
  const parseDate = (dateStr, timeStr) => {
    if (!dateStr) return null;
    
    try {
      // If dateStr already includes time information, use it directly
      if (dateStr.includes('T')) {
        const date = parseISO(dateStr);
        if (!isValid(date)) {
          throw new Error(`Invalid date: ${dateStr}`);
        }
        return date;
      }

      // Combine date and time
      const timeString = timeStr || '00:00';
      const combinedStr = `${dateStr}T${timeString}`;
      const date = parseISO(combinedStr);
      
      if (!isValid(date)) {
        throw new Error(`Invalid date: ${combinedStr}`);
      }
      
      return date;
    } catch (error) {
      console.warn('Date parsing error:', error);
      return null;
    }
  };

  // Updated processJobDates function
  const processJobDates = (job) => {
    const dates = getJobDates(job);
    console.log('Processing dates for job', job.id, ':', dates);
    
    try {
      const start = parseDate(dates.startDate, dates.startTime);
      const end = parseDate(dates.endDate, dates.endTime);
      
      return {
        start,
        end,
        isValid: Boolean(start && end)
      };
    } catch (error) {
      console.log('Error processing dates for job', job.id, ':', error);
      return {
        start: null,
        end: null,
        isValid: false
      };
    }
  };

  // Then define setupJobsListener
  const setupJobsListener = useCallback((worker) => {
    console.log("Setting up jobs listener for worker:", {
      worker,
      workerId: worker.workerId,
      workerName: worker.text
    });

    const jobsQuery = query(collection(db, "jobs"));

    return onSnapshot(jobsQuery, (snapshot) => {
      console.log("Jobs snapshot received:", snapshot.size, "documents");
      
      const allJobs = snapshot.docs.map((doc) => {
        try {
          const jobData = doc.data();
          console.log("Processing job:", { id: doc.id, data: jobData });
      
          // Check if this job is assigned to the current worker
          const isAssigned = jobData.assignedWorkers?.some(
            (assigned) => assigned.workerId === worker.workerId
          );
      
          console.log("Job assignments check:", {
            jobId: doc.id,
            jobName: jobData.jobName,
            assignedWorkers: jobData.assignedWorkers,
            currentWorker: worker
          });
      
          if (!isAssigned) return null;
      
          // Process the job dates
          const processedJob = processJobDates({ id: doc.id, data: jobData });
          if (!processedJob || !processedJob.start || !processedJob.end) {
            console.warn('Invalid dates for job:', doc.id);
            return null;
          }
      
          // Create the job object with validated dates
          const jobObject = {
            Id: doc.id,
            WorkerId: worker.workerId,
            Subject: jobData.jobName || 'Untitled Job',
            StartTime: processedJob.start,
            EndTime: processedJob.end,
            Description: jobData.jobDescription?.replace(/<[^>]*>/g, '') || "",
            JobStatus: jobData.jobStatus || 'Pending',
            Customer: jobData.customerName || 'No Customer',
            ServiceLocation: jobData.location?.locationName || 'No Location',
            Priority: jobData.priority || 'Medium',
            Category: "General",
            IsAllDay: false,
            Status: jobData.jobStatus || 'Pending',
            AssignedWorkers: jobData.assignedWorkers || [],
            Color: worker.color || '#B8B5FF',
            TextColor: '#FFFFFF'
          };
      
          // Validate the job object before returning
          if (!(jobObject.StartTime instanceof Date) || !(jobObject.EndTime instanceof Date)) {
            console.warn('Invalid date objects in job:', doc.id);
            return null;
          }
      
          return jobObject;
        } catch (error) {
          console.error('Error processing job:', doc.id, error);
          return null;
        }
      }).filter(Boolean); // Remove null entries
      
      // Update the schedule data with proper error handling
      try {
        setScheduleData(prevData => {
          const filteredData = prevData.filter(job => job.WorkerId !== worker.workerId);
          return [...filteredData, ...allJobs];
        });
      } catch (error) {
        console.error('Error updating schedule data:', error);
        toast.error('Error updating schedule');
      }

      console.log('Processed jobs for worker:', {
        worker: worker.text,
        workerId: worker.workerId,
        jobCount: allJobs.length,
        jobs: allJobs.map(j => ({
          id: j.Id,
          subject: j.Subject,
          start: j.StartTime instanceof Date ? j.StartTime.toLocaleString() : 'Invalid Date'
        }))
      });

      setScheduleData(prevData => {
        const filteredData = prevData.filter(job => job.WorkerId !== worker.workerId);
        const newData = [...filteredData, ...allJobs];
        return newData;
      });
    });
  }, []);

  // Then define setupWorkersListener
  const setupWorkersListener = useCallback(() => {
    console.log("Setting up workers listener");
    const workersQuery = query(
      collection(db, "users"),
      where("role", "==", "Worker")
    );

    return onSnapshot(workersQuery, (snapshot) => {
      const workers = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          workerId: data.workerId || doc.id,
          text: data.fullName || `${data.firstName} ${data.lastName}`.trim(),
          color: WORKER_COLORS[data.workerId] || '#B8B5FF', // Use predefined color or default
          role: data.role || 'Worker',
          ...data
        };
      });
      
      console.log('Workers with colors:', workers.map(w => ({
        name: w.text,
        color: w.color
      })));

      setFieldWorkers(workers);
      setFilteredWorkers(workers);
      updateStats(workers, null);

      workers.forEach(worker => {
        setupJobsListener(worker);
      });
    });
  }, [updateStats, setupJobsListener]);

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
    console.log('contentTemplate rendered with props:', props);
    const [isEditing, setIsEditing] = useState(false);
    const isEmptyCell = !props.Subject;

    const handleSaveInTemplate = async (updatedEvent) => {
      console.log('handleSaveInTemplate called with:', updatedEvent);
      try {
        // Update the schedule data immediately
        setScheduleData(prevData => {
          console.log('Previous schedule data:', prevData);
          const newData = prevData.map(item => 
            item.Id === updatedEvent.Id ? updatedEvent : item
          );
          console.log('New schedule data:', newData);
          return newData;
        });

        // Force refresh the scheduler
        if (scheduleRef.current) {
          console.log('Refreshing scheduler');
          scheduleRef.current.refreshEvents();
        }

        setIsEditing(false);
        if (scheduleRef.current) {
          scheduleRef.current.closeQuickInfoPopup();
        }
      } catch (error) {
        console.error('Error saving changes:', error);
        toast.error('Failed to save changes');
      }
    };

    if (isEmptyCell) {
      const workerId = props.GroupIndex !== undefined ? filteredWorkers[props.GroupIndex]?.id : null;
      const workerName = filteredWorkers[props.GroupIndex]?.text || 'Unknown Worker';
      
      return (
        <div className={styles.quickInfoContent}>
          <h2 className={styles.title}>Create New Job</h2>
          
          <div className={styles.infoRow}>
            <BsClock className={styles.icon} />
            <span>Time:</span>
            <div className={styles.infoValue}>
              {formatDate(props.startTime)} - {formatDate(props.endTime)}
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
            <BsPlus size={20} className="me-2" />
            Double-click to create a new job assignment
          </div>
        </div>
      );
    }

    if (isEditing) {
      return (
        <QuickEditForm 
          data={props} 
          onSave={handleSaveInTemplate}
          onCancel={() => setIsEditing(false)}
        />
      );
    }

    return (
      <div className={styles.quickInfoContent}>
        <div className={styles.headerRow}>
          <h2 className={styles.title}>{props.Subject}</h2>
          <Button 
            variant="link" 
            className={styles.editLink}
            onClick={() => setIsEditing(true)}
          >
            <BsGear size={14} className="me-1" />
            Quick Edit
          </Button>
        </div>
        
        <div className={styles.statusSection}>
          <div className={`${styles.statusBadge} ${styles[props.JobStatus?.toLowerCase() || 'pending']}`}>
            <BsCircleFill size={8} className="me-1" />
            {props.JobStatus || 'Pending'}
          </div>
          
          <div className={styles.priorityBadge}>
            <BsFlag size={12} className="me-1" />
            {props.Priority || 'Medium'} Priority
          </div>
        </div>

        <div className={styles.infoRow}>
          <BsClock className={styles.icon} />
          <span>Duration:</span>
          <div className={styles.infoValue}>
            {calculateDuration(props.StartTime, props.EndTime)}
          </div>
        </div>

        <div className={styles.infoRow}>
          <BsGeoAlt className={styles.icon} />
          <span>Location:</span>
          <div className={styles.infoValue}>
            {props.ServiceLocation || 'Not specified'}
          </div>
        </div>

        <div className={styles.infoRow}>
          <BsBuilding className={styles.icon} />
          <span>Customer:</span>
          <div className={styles.infoValue}>
            {props.Customer || 'Not specified'}
          </div>
        </div>

        {props.Description && (
          <div className={styles.descriptionSection}>
            <h6 className={styles.sectionTitle}>Description</h6>
            <p className={styles.description}>{props.Description}</p>
          </div>
        )}

        <div className={styles.actionsRow}>
          <Button 
            variant="primary" 
            size="sm" 
            className={styles.actionButton}
            onClick={() => router.push(`/jobs/edit-jobs/${props.Id}`)}
          >
            <BsGear size={14} className="me-1" />
            Full Edit
          </Button>

          <Button 
            variant="outline-primary" 
            size="sm"
            className={styles.actionButton}
            onClick={() => router.push(`/jobs/view/${props.Id}`)}
          >
            <BsEye size={14} className="me-1" />
            View Details
          </Button>
        </div>

        <div className={styles.metaInfo}>
          <small className={styles.timestamp}>
            Last updated: {new Date(props.StartTime).toLocaleString()}
          </small>
        </div>
      </div>
    );
  };
  

  // Update footer template to match new design
  const footerTemplate = (props) => {
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
  
    // Footer for existing events
    return (
      <div className={styles.quickInfoFooter}>
        <div className={styles.meta}>
          <small className={styles.timestamp}>
            Last updated: {new Date(props.StartTime).toLocaleString()}
          </small>
        </div>
      </div>
    );
  };

  // Cell double click handler
  const handleCellDoubleClick = useCallback((args) => {
    console.log('Double Click Event:', args);
    
    // Cancel the default behavior
    args.cancel = true;

    // Check if args exists
    if (!args) {
      console.warn('Invalid args in double click event');
      return;
    }

    try {
      // Handle appointment click
      const appointmentElement = args.element?.closest('.e-appointment');
      if (appointmentElement) {
        console.log('Double clicked on appointment');
        
        if (scheduleRef.current) {
          const eventData = scheduleRef.current.getEventDetails(appointmentElement);
          console.log('Event Data:', eventData);
          
          if (eventData) {
            scheduleRef.current.openEditor(eventData, 'Add');
          }
        }
        return;
      }

      // Handle empty cell click
      const workCellElement = args.element?.closest('.e-work-cells');
      if (workCellElement) {
        const startTime = args.startTime;
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
        const workerId = args.groupIndex !== undefined ? filteredWorkers[args.groupIndex]?.id : null;
        const workerName = filteredWorkers[args.groupIndex]?.text || 'Unknown Worker';

        // Verify we have required data before showing dialog
        if (!workerId || !startTime || !endTime) {
          console.warn('Missing required data for job creation', { workerId, startTime, endTime });
          toast.error('Unable to create job: Missing required information');
          return;
        }

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
    } catch (error) {
      console.error('Error in handleCellDoubleClick:', error);
      toast.error('An error occurred while handling the click event');
    }
  }, [filteredWorkers, router]);

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

  useEffect(() => {
    console.log('Current schedule data:', scheduleData);
    console.log('Filtered schedule data:', filteredScheduleData);
  }, [scheduleData, filteredScheduleData]);

  useEffect(() => {
    console.log('Schedule initialization:', {
      currentDate: currentDate,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      browserLocale: navigator.language,
      sampleDate: new Date('2024-11-12T01:30:00').toLocaleString()
    });
  }, [currentDate]);

  // Update the debug function to safely handle dates
  const debugScheduleData = (data) => {
    console.log('Schedule Data Debug:', {
      data,
      firstItem: data[0] ? {
        ...data[0],
        startTime: data[0].StartTime instanceof Date ? data[0].StartTime.toLocaleString() : 'Invalid Date',
        endTime: data[0].EndTime instanceof Date ? data[0].EndTime.toLocaleString() : 'Invalid Date'
      } : null,
      currentDate: new Date().toLocaleString()
    });
  };

  // Add this to your component before the return statement
  useEffect(() => {
    debugScheduleData(filteredScheduleData);
  }, [filteredScheduleData]);

  // Add a date navigation handler
  const onNavigating = useCallback((args) => {
    console.log('Navigating to date:', args.currentDate);
    setCurrentDate(args.currentDate);
  }, []);

  useEffect(() => {
    const dates = [...new Set(scheduleData.map(job => job.StartTime.toDateString()))];
    console.log('Available job dates:', {
      dates,
      jobs: scheduleData.map(job => ({
        date: job.StartTime.toDateString(),
        name: job.Subject,
        worker: job.WorkerId
      }))
    });
  }, [scheduleData]);

  // // Also add a debug component to show assignments
  // const DebugAssignments = () => (
  //   <div className="mb-3 p-3 bg-light">
  //     <h6>Debug Info - Job Assignments</h6>
  //     <div>
  //       {scheduleData.map(job => (
  //         <div key={job.Id} className="mb-2">
  //           <strong>{job.Subject}</strong>
  //           <div>Worker: {job.WorkerId}</div>
  //           <div>All Assigned Workers: {
  //             job.AssignedWorkers?.map(w => w.workerId).join(', ') || 'None'
  //           }</div>
  //           <div>Time: {job.StartTime.toLocaleString()} - {job.EndTime.toLocaleString()}</div>
  //         </div>
  //       ))}
  //     </div>
  //   </div>
  // );

  // Add custom CSS for the scheduler
  const schedulerStyles = {
    '.e-schedule .e-vertical-view .e-work-cells': {
      backgroundColor: '#ffffff',
    },
    '.e-schedule .e-vertical-view .e-work-cells.e-work-hours': {
      backgroundColor: '#fafafa',
    }
  };

  // Create a function to get the appropriate icon based on role
  const getWorkerIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'technician':
        return <BsTools size={16} />;
      case 'developer':
        return <BsCode size={16} />;
      default:
        return <BsFillPersonBadgeFill size={16} />;
    }
  };

  const customStyles = `
    .custom-scheduler .e-schedule .e-timeline-view .e-work-cells {
      min-height: 50px !important;
      background-color: #f8f9fa !important; /* Light background for empty cells */
      border: 1px solid #e9ecef !important;
      cursor: pointer !important;
    }

    .custom-scheduler .e-schedule .e-timeline-view .e-work-cells:hover {
      background-color: #e9ecef !important; /* Lighter background on hover */
    }

    .custom-scheduler .e-schedule .e-timeline-view .e-resource-left-td {
      width: 250px !important;
    }

    .custom-scheduler .e-schedule .e-timeline-view .e-resource-cells {
      height: auto !important;
      vertical-align: middle;
      padding: 4px !important;
    }

    .custom-scheduler .e-schedule .e-content-wrap {
      height: 100% !important;
    }

    .custom-scheduler .e-schedule .e-timeline-view .e-resource-column {
      height: 100% !important;
    }

    .custom-scheduler .e-schedule .e-timeline-view .e-date-header-wrap table {
      height: 100% !important;
    }

    .custom-scheduler .e-schedule .e-timeline-view .e-content-wrap table {
      height: 100% !important;
    }

    .custom-scheduler .e-schedule .e-timeline-view tr {
      height: 100% !important;
    }

    /* Add alternating row colors for better visibility */
    .custom-scheduler .e-schedule .e-timeline-view .e-work-cells:nth-child(odd) {
      background-color: #fafafa !important;
    }

    /* Add subtle grid lines */
    .custom-scheduler .e-schedule .e-timeline-view .e-work-cells {
      border: 1px solid #e0e0e0 !important;
    }

    /* Add visual feedback for clickable areas */
    .custom-scheduler .e-schedule .e-timeline-view .e-work-cells:hover {
      background-color: #f0f0f0 !important;
      transition: background-color 0.2s ease;
    }
  `;

  // Add these new states for filtering
  const [filters, setFilters] = useState({
    workerId: '',
    workerName: '',
    role: '',
    status: ''
  });

  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    try {
      setLoading(true); // You should already have this state
      
      // Filter workers based on the name filter
      const filteredWorkersList = fieldWorkers.filter(worker => {
        const nameMatch = worker.text.toLowerCase().includes(filters.workerName.toLowerCase());
        return nameMatch;
      });

      // Update the filtered workers state
      setFilteredWorkers(filteredWorkersList);

      // Filter schedule data based on the filtered workers
      const filteredJobs = scheduleData.filter(event => 
        filteredWorkersList.some(worker => worker.id === event.WorkerId)
      );

      // Update the filtered schedule data
      setScheduleData(prevData => {
        const updatedData = [...prevData];
        return filteredJobs;
      });

      toast.success('Search completed successfully');
    } catch (error) {
      console.error('Error searching workers:', error);
      toast.error('Error searching workers');
    } finally {
      setLoading(false);
    }
  }, [fieldWorkers, filters.workerName, scheduleData]);

  const handleClearFilters = useCallback(() => {
    // Clear filters
    setFilters({
      workerId: '',
      workerName: '',
      role: '',
      status: ''
    });

    // Reset to show all workers
    setFilteredWorkers(fieldWorkers);
    
    // Reset schedule data to show all events
    setScheduleData(prevData => {
      const allJobs = prevData.filter(event => 
        fieldWorkers.some(worker => worker.id === event.WorkerId)
      );
      return allJobs;
    });

    toast.info('Filters cleared');
  }, [fieldWorkers]);

 
  const onPopupOpen = useCallback((args) => {
    if (args.type === 'Editor' || args.type === 'QuickInfo') {
      console.log('Popup opening:', args);
      
      // For new events
      if (args.type === 'Editor' && !args.data.Id) {
        args.cancel = true;
        if (scheduleRef.current) {
          scheduleRef.current.closeEditor();
        }
        return;
      }
  
      if (args.type === 'QuickInfo') {
        // For empty cells
        if (!args.data || !args.data.Subject) {
          args.cancel = true;
          return;
        }
    
        // For existing events
        if (args.data && args.data.Subject) {
          // Ensure we have valid dates
          const startTime = args.data.StartTime instanceof Date ? args.data.StartTime : null;
          const endTime = args.data.EndTime instanceof Date ? args.data.EndTime : null;
    
          if (!startTime || !endTime) {
            args.cancel = true;
            return;
          }
    
          args.cancel = false;
        }
      } else if (args.type === 'Editor') {
        args.cancel = true;
        if (scheduleRef.current) {
          scheduleRef.current.closeEditor();
        }
      }
    }
  }, []);

  const onCellClick = useCallback((args) => {
    console.log('Cell clicked:', args);
  }, []);
  
  // QuickEditForm component with integrated handleSave
  const QuickEditForm = ({ data, onSave, onCancel }) => {
    console.log('QuickEditForm initialized with data:', data);

    const [formData, setFormData] = useState({
      Subject: data.Subject || '',
      Description: data.Description || '',
      StartTime: data.StartTime instanceof Date ? data.StartTime : new Date(),
      EndTime: data.EndTime instanceof Date ? data.EndTime : new Date(),
      Priority: data.Priority || 'Medium',
      JobStatus: data.JobStatus || 'Pending'
    });

    const handleSave = async (updatedData) => {
      console.log('handleSave called with:', updatedData);
      try {
        // Format dates for Firestore
        const formattedData = {
          jobName: updatedData.Subject,
          jobDescription: updatedData.Description || '',
          startDate: format(updatedData.StartTime, 'yyyy-MM-dd'),
          startTime: format(updatedData.StartTime, 'HH:mm'),
          endDate: format(updatedData.EndTime, 'yyyy-MM-dd'),
          endTime: format(updatedData.EndTime, 'HH:mm'),
          priority: updatedData.Priority,
          jobStatus: updatedData.JobStatus,
          formattedStartDateTime: updatedData.StartTime,
          formattedEndDateTime: updatedData.EndTime,
          lastModifiedAt: new Date()
        };

        console.log('Formatted data for Firestore:', formattedData);
        console.log('Updating document with ID:', data.Id);

        // Update Firestore
        await updateDoc(doc(db, "jobs", data.Id), formattedData);
        console.log('Firestore update successful');

        // Create the updated schedule event object
        const updatedEvent = {
          Id: data.Id,
          Subject: updatedData.Subject,
          Description: updatedData.Description,
          StartTime: updatedData.StartTime,
          EndTime: updatedData.EndTime,
          Priority: updatedData.Priority,
          JobStatus: updatedData.JobStatus,
          WorkerId: data.WorkerId,
          Customer: data.Customer,
          ServiceLocation: data.ServiceLocation,
          Color: data.Color,
          TextColor: data.TextColor
        };

        console.log('Created updatedEvent:', updatedEvent);
        onSave(updatedEvent);
        
        toast.success('Job updated successfully');
      } catch (error) {
        console.error('Error updating job:', error);
        toast.error('Failed to update job');
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await handleSave(formData);
      } catch (error) {
        console.error('Error in form submission:', error);
        toast.error('Failed to save changes');
      }
    };

    return (
      <Form onSubmit={handleSubmit} className={styles.quickEditForm}>
        <Form.Group className="mb-2">
          <Form.Label>Job Name</Form.Label>
          <Form.Control
            type="text"
            value={formData.Subject}
            onChange={(e) => setFormData(prev => ({ ...prev, Subject: e.target.value }))}
            required
          />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Start Time</Form.Label>
          <DateTimePickerComponent
            value={formData.StartTime}
            onChange={(e) => {
              if (e.value instanceof Date) {
                setFormData(prev => ({ ...prev, StartTime: e.value }));
              }
            }}
            format="dd/MM/yy hh:mm a"
            step={15}
          />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>End Time</Form.Label>
          <DateTimePickerComponent
            value={formData.EndTime}
            onChange={(e) => {
              if (e.value instanceof Date) {
                setFormData(prev => ({ ...prev, EndTime: e.value }));
              }
            }}
            format="dd/MM/yy hh:mm a"
            step={15}
          />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Priority</Form.Label>
          <Form.Select
            value={formData.Priority}
            onChange={(e) => setFormData(prev => ({ ...prev, Priority: e.target.value }))}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Status</Form.Label>
          <Form.Select
            value={formData.JobStatus}
            onChange={(e) => setFormData(prev => ({ ...prev, JobStatus: e.target.value }))}
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Scheduled">Scheduled</option>
          </Form.Select>
        </Form.Group>

        <div className={styles.formActions}>
          <Button type="submit" variant="primary" size="sm">
            Save Changes
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </Form>
    );
  };

  // Add this effect to refresh the schedule when data changes
  useEffect(() => {
    if (scheduleRef.current) {
      scheduleRef.current.refreshEvents();
    }
  }, [scheduleData]);

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
           

            {/* {process.env.NODE_ENV === 'development' && (
              <div className="mb-3 p-3 bg-light">
                <h6>Debug Info</h6>
                <div>Current Date: {currentDate.toLocaleString()}</div>
                <div>Jobs for current view:</div>
                <ul>
                  {filteredScheduleData.map(job => (
                    <li key={job.Id}>
                      {job.Subject} - {job.StartTime.toLocaleString()} to {job.EndTime.toLocaleString()}
                      (Worker: {job.WorkerId})
                    </li>
                  ))}
                </ul>
              </div>
            )} */}

            <SchedulerFilterPanel 
              filters={filters}
              setFilters={setFilters}
              onClear={handleClearFilters}
              loading={loading}
              handleSearch={handleSearch}
            />

            <ScheduleComponent
              ref={scheduleRef}
              cssClass="custom-scheduler"
              width="100%"
              height="650px"
              currentView="TimelineDay"
              selectedDate={currentDate}
              startHour="00:00"
              endHour="24:00"
              workDays={workDays}
              popupOpen={onPopupOpen}
              eventRendered={onEventRendered}
              rowAutoHeight={false}
              timezone="Asia/Taipei"
              eventSettings={{
                dataSource: filteredScheduleData,
                enableTooltip: true,
                template: props => {
                  const workerColor = getWorkerColor(props.WorkerId);
                  console.log('Worker ID:', props.WorkerId, 'Color:', workerColor);
                  
                  return (
                    <div className="custom-event" style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: workerColor,
                      padding: '4px 8px',
                      color: '#000000',
                    }}>
                      <div style={{ fontWeight: '500' }}>{props.Subject}</div>
                      <div style={{ fontSize: '0.85em' }}>
                        {new Date(props.StartTime).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })} 
                        {' - '}
                        {new Date(props.EndTime).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  );
                }
              }}
              group={{ 
                byGroupID: false,
                resources: ['Workers'],
                headerHeight: 'auto', // Allows header to adjust height
                allowGroupDragAndDrop: false
              }}
              quickInfoTemplates={{
                header: headerTemplate,
                content: contentTemplate,
                footer: footerTemplate,
              }}
              cellClick={onCellClick}
              cellDoubleClick={handleCellDoubleClick}
              timeScale={{ 
                enable: true, 
                interval: 60, 
                slotCount: 2 
              }}
              workHours={{
                highlight: true,
                start: '00:00',
                end: '24:00'
              }}
              cellTemplate={(props) => {
                return (
                  <div className="template-wrap" style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}>
                 
                    <div style={{
                      fontSize: '12px',
                      color: '#999',
                      display: props.elementType === 'emptyCells' ? 'flex' : 'none',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <BsPlus size={14} />
                      <span>Add Job</span>
                    </div>
                  </div>
                );
              }}
              navigating={onNavigating}
              resourceHeaderTemplate={props => (
                <div className="worker-header" style={{ 
                  backgroundColor: getWorkerColor(props.resourceData.workerId),
                  padding: '6px 8px',
                  borderRadius: '6px',
                  color: '#000000',
                  width: '100%',
                  height: '100%',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: '100%'
                }}>
                  {/* Worker Name */}
                  <div style={{ 
                    fontWeight: '600',
                    fontSize: '0.9em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: '2px'
                  }}>
                    {props.resourceData.text}
                  </div>

                  {/* Role and Status Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '4px',
                    fontSize: '0.75em'
                  }}>
                    {/* Role */}
                    <div style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255,255,255,0.5)',
                      padding: '2px 6px',
                      borderRadius: '12px',
                      maxWidth: '40%'
                    }}>
                      <span style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {props.resourceData.role || 'Worker'}
                      </span>
                    </div>

                    {/* Status and Tasks */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'rgba(0,0,0,0.6)',
                      fontSize: '0.9em'
                    }}>
                      {/* Status Dot */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <BsCircleFill size={6} color={props.resourceData.isActive ? '#4CAF50' : '#757575'} />
                        <span style={{ whiteSpace: 'nowrap' }}>
                          {props.resourceData.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Tasks Count */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <span style={{ whiteSpace: 'nowrap' }}>
                          {`${props.resourceData.taskCount || 0} tasks`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
              </ViewsDirective>
              <Inject services={[TimelineViews, TimelineMonth]} />
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