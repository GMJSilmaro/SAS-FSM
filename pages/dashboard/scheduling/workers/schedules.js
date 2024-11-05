import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { BsClock, BsFillPersonFill, BsGeoAlt, BsCalendarCheck, BsBuilding, BsTools, BsX, BsArrowRight } from "react-icons/bs"; 

const LoadingOverlay = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-8 shadow-lg flex flex-col items-center">
      <ClipLoader color="#3498db" size={50} />
      <p className="mt-4 text-lg font-semibold text-gray-700">
        Loading schedules...
      </p>
      <p className="mt-2 text-sm text-gray-500">
        Please wait while we fetch the latest data.
      </p>
    </div>
  </div>
);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const FieldServiceSchedules = () => {
  const [fieldWorkers, setFieldWorkers] = useState([]);
  const [scheduleData, setScheduleData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [oldWorkerId, setOldWorkerId] = useState(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const unsubscribeRef = useRef(null);
  const [cachedJobs, setCachedJobs] = useState(null);
  const lastFetchTime = useRef(null);
  const scheduleRef = useRef(null);

  const statusColors = {
    Available: "#28a745",
    "Not Available": "#dc3545",
    Break: "#ffc107",
    "On Leave": "#17a2b8",
    "Sick Leave": "#6c757d",
  };

  const workDays = [0, 1, 2, 3, 4, 5];

  const statusOptions = [
    "Available",
    "Unavailable",
    "Absent",
    "On Leave",
    "Sick Leave",
    "Work in Progress",
    "Busy",
    "Out of Office",
    "Tentative",
  ];

  const getEventColor = (args) => {
    return statusColors[args.Status] || "#1aaa55";
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${month}-${day}-${year}`;
  };

  const router = useRouter();

  // Add this function to handle cell double click
  const handleCellDoubleClick = useCallback((args) => {
    if (args.element.classList.contains('e-work-cells')) {
      const startTime = args.startTime;
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Default to 1 hour duration
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
            pathname: '/dashboard/jobs/create-jobs',
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

  // Authentication effect
  useEffect(() => {
    console.log("Starting authentication process...");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed. User:", user ? "exists" : "null");
      if (user) {
        try {
          console.log("Attempting to fetch user document for UID:", user.uid);
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("uid", "==", user.uid));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            console.log("User document found. Data:", userData);
            setCurrentUser({
              uid: user.uid,
              userId: userData.userId || userDoc.id,
              role: userData.role,
              workerId: userDoc.id,
            });
            setIsAuthenticated(true);
          } else {
            console.error("No user document found for the authenticated user");
            setError("User data not found. Please contact support.");
          }
        } catch (error) {
          console.error("Error fetching user document:", error);
          setError("Error fetching user data. Please try again later.");
        }
      } else {
        console.log("No authenticated user found");
        setCurrentUser(null);
        setError("Please log in to access the schedule.");
      }
      setIsLoading(false);
    });

    return () => {
      console.log("Unsubscribing from auth state changes");
      unsubscribe();
    };
  }, []);

  // Data loading effect
  useEffect(() => {
    if (isAuthenticated && !error) {
      console.log("Setting up workers and jobs listeners");
      setIsLoading(true);
      const unsubscribeWorkers = setupWorkersListener();
      unsubscribeRef.current = unsubscribeWorkers;

      return () => {
        console.log("Cleaning up workers and jobs listeners");
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    }
  }, [isAuthenticated, error]);

  const setupWorkersListener = useCallback(() => {
    console.log("Setting up workers listener");
    const workersQuery = query(
      collection(db, "users"),
      where("role", "==", "Worker")
    );

    return onSnapshot(
      workersQuery,
      (snapshot) => {
        const workers = snapshot.docs.map((doc) => ({
          id: doc.id,
          text: doc.data().fullName,
        }));
        console.log(`Fetched ${workers.length} workers:`, workers);
        setFieldWorkers(workers);
        setFilteredWorkers(workers);

        // Set up listeners for each worker's schedules
        const unsubscribeJobs = workers.map(setupWorkerJobsListener);

        setIsLoading(false);

        // Return a function to unsubscribe from all listeners
        return () => {
          unsubscribeJobs.forEach((unsubscribe) => unsubscribe());
        };
      },
      (error) => {
        console.error("Error fetching workers:", error);
        setError("Error loading worker data. Please try again later.");
        setIsLoading(false);
      }
    );
  }, []);

  const setupWorkerJobsListener = useCallback((worker) => {
    console.log(`Setting up jobs listener for worker: ${worker.text}`);
    
    const jobsQuery = query(
      collection(db, "jobs"),
      where("assignedWorkers", "array-contains", { workerId: worker.id })
    );

    return onSnapshot(jobsQuery, (snapshot) => {
      const workerJobs = [];
      snapshot.forEach((jobDoc) => {
        const jobData = jobDoc.data();
        
        const startDate = jobData.startDate instanceof Timestamp 
          ? jobData.startDate.toDate() 
          : new Date(jobData.startDate);
        
        const endDate = jobData.endDate instanceof Timestamp 
          ? jobData.endDate.toDate() 
          : new Date(jobData.endDate);

        const jobEntry = {
          Id: jobDoc.id,
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

        console.log(`Processing job for ${worker.text}:`, jobEntry);
        workerJobs.push(jobEntry);
      });

      setScheduleData(prevData => {
        const filteredData = prevData.filter(job => job.WorkerId !== worker.id);
        const newData = [...filteredData, ...workerJobs];
        console.log(`Updated schedule data for ${worker.text}:`, newData);
        return newData;
      });
    });
  }, []);

  const createNotification = useCallback(
    async (workerId, status, startTime) => {
      if (!currentUser) {
        console.error("No authenticated user found");
        toast.error("Error creating notification: No authenticated user");
        return;
      }

      const notificationRef = collection(db, `notifications`);

      const notificationEntry = {
        userID: currentUser.userId,
        workerId: workerId,
        notificationType: "Schedule Update",
        message: `Your schedule has been updated. New status: ${status} starting at ${new Date(
          startTime
        ).toLocaleString()}.`,
        timestamp: Timestamp.now(),
        read: false,
      };

      try {
        const docRef = await addDoc(notificationRef, notificationEntry);
        console.log(
          `Notification created for worker ${workerId} with ID: ${docRef.id}`
        );
      } catch (error) {
        console.error("Error creating notification:", error);
        toast.error("Failed to send notification to worker.");
      }
    },
    [currentUser]
  );

  useEffect(() => {
    const lowercaseFilter = searchFilter.toLowerCase();
    const filtered = fieldWorkers.filter(worker =>
      worker.text.toLowerCase().includes(lowercaseFilter)
    );
    setFilteredWorkers(filtered);
  }, [searchFilter, fieldWorkers]);

  // Update the filtered schedule data calculation
  const filteredScheduleData = React.useMemo(() => {
    return scheduleData.filter(event => 
      filteredWorkers.some(worker => worker.id === event.WorkerId)
    );
  }, [scheduleData, filteredWorkers]);

  const headerTemplate = (props) => {
    return (
      <div className={styles.headerContainer}>
        <div className={styles.headerBar} style={{ backgroundColor: '#90EE90' }}>
          {props.Subject}
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
    return (
      <div className={styles.quickInfoFooter}>
        <button 
          className={styles.viewDetailsButton}
          onClick={() => router.push(`/dashboard/jobs/${props.Id}`)}
        >
          View Details
          <BsArrowRight size={16} />
        </button>
        <div className={styles.actionButtons}>
          <button className={styles.editButton}>
            Edit
          </button>
          <button className={styles.deleteButton}>
            Delete
          </button>
        </div>
      </div>
    );
  };

  // Update the ScheduleComponent props
  <ScheduleComponent
    ref={scheduleRef}
    // ... other props ...
    quickInfoTemplates={{
      header: headerTemplate,
      content: contentTemplate,
      footer: footerTemplate,
    }}
  >
  </ScheduleComponent>

  // Add cache invalidation function
  const invalidateCache = useCallback(() => {
    fieldWorkers.forEach(worker => {
      localStorage.removeItem(`workerJobs_${worker.id}`);
    });
    lastFetchTime.current = null;
    setCachedJobs(null);
  }, [fieldWorkers]);

  // Add the calculateDuration helper function
  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = Math.abs(end - start) / 36e5; // Convert to hours
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  };

  useEffect(() => {
    console.log('Current schedule data:', scheduleData);
    console.log('Filtered workers:', filteredWorkers);
    console.log('Filtered schedule data:', filteredScheduleData);
  }, [scheduleData, filteredWorkers, filteredScheduleData]);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-4">{error}</div>;
  }

  if (!currentUser) {
    return (
      <div className="text-center mt-4">
        Please log in to access the schedule.
      </div>
    );
  }

  return (
    <div>
      <GeeksSEO title="Worker Schedules | SAS&ME - SAP B1 | Portal" />

      <Row>
        <Col lg={12}>
          <div className="border-bottom pb-4 mb-4 d-flex align-items-center justify-content-between">
            <div className="mb-1">
              <h1 className="mb-1 h2 fw-bold">Dispatch Schedules</h1>
              <Breadcrumb>
                <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item active href="/dashboard/scheduling/workers/schedules">Schedules</Breadcrumb.Item>
              </Breadcrumb>
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
              selectedDate={new Date()}
              startHour="06:00"
              endHour="21:00"
              workDays={workDays}
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
                enableTooltip: true
              }}
              group={{ resources: ["Workers"] }}
              eventRendered={(args) => {
                args.element.style.backgroundColor = getEventColor(args.data);
              }}
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
              <Inject
                services={[
                  TimelineViews,
                  TimelineMonth,
                  Agenda,
                ]}
              />
            </ScheduleComponent>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldServiceSchedules;
