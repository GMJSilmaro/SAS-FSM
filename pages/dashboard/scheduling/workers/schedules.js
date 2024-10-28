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
import { BsClock, BsFillPersonFill, BsGeoAlt, BsCalendarCheck, BsBuilding, BsTools, BsX } from "react-icons/bs"; 

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

    return onSnapshot(
      jobsQuery,
      (snapshot) => {
        const workerJobs = [];
        snapshot.forEach((jobDoc) => {
          const jobData = jobDoc.data();

          const startDate =
            jobData.startDate instanceof Timestamp
              ? jobData.startDate.toDate()
              : new Date(jobData.startDate);

          const endDate =
            jobData.endDate instanceof Timestamp
              ? jobData.endDate.toDate()
              : new Date(jobData.endDate);

          // Align fields with calendar.js
          workerJobs.push({
            Id: jobDoc.id,
            WorkerId: worker.id,
            Subject: jobData.jobName,
            JobNo: jobData.jobNo,
            Customer: jobData.customerName,
            ServiceLocation: jobData.location?.locationName || "",
            StartTime: startDate,
            EndTime: endDate,
            WorkerName: worker.text,
            JobStatus: jobData.jobStatus,
            Description: jobData.jobDescription,
            Equipments: jobData.equipments?.map(eq => eq.itemName).join(", "),
            Priority: jobData.priority || "",
            Category: jobData.category || "N/A",
            ServiceCall: jobData.serviceCallID || "N/A",
            Equipment: jobData.equipments?.[0]?.itemName || "N/A",
            Location: jobData.location?.locationName || "Not specified",
            ClientName: jobData.customerName || "Not specified"
          });
        });

        console.log(`Updated jobs for ${worker.text}:`, workerJobs);

        setScheduleData((prevData) => {
          const filteredData = prevData.filter(
            (job) => job.WorkerId !== worker.id
          );
          return [...filteredData, ...workerJobs];
        });
      },
      (error) => {
        console.error(`Error fetching jobs for worker ${worker.text}:`, error);
      }
    );
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

  const filteredScheduleData = scheduleData.filter(event => 
    filteredWorkers.some(worker => worker.id === event.WorkerId)
  );

  const quickInfoTemplates = {
    header: (props) => (
      <div className={quickInfoStyles.quickInfoHeader}>
        <span className={quickInfoStyles.timeRange}>
          {new Date(props.StartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
          {new Date(props.EndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <button className={quickInfoStyles.closeButton}>
          <BsX className={quickInfoStyles.closeIcon} />
        </button>
      </div>
    ),
    content: (props) => (
      <div className={quickInfoStyles.quickInfoContent}>
        <h3 className={quickInfoStyles.eventTitle}>
          <BsTools className={quickInfoStyles.icon} />
          {props.Subject}
        </h3>
        
        {/* Time Information */}
        <div className={quickInfoStyles.infoItem}>
          <BsClock className={quickInfoStyles.icon} />
          <span style={{ fontWeight: 600 }}>Duration:</span>
          <span>
            {Math.round((new Date(props.EndTime) - new Date(props.StartTime)) / (1000 * 60 * 60))} hours
            ({new Date(props.StartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
            {new Date(props.EndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
          </span>
        </div>

        {/* Worker Information */}
        <div className={quickInfoStyles.infoItem}>
          <BsFillPersonFill className={quickInfoStyles.icon} />
          <span style={{ fontWeight: 600 }}>Assigned To:</span>
          <span className={quickInfoStyles.workerName}>{props.WorkerName}</span>
        </div>

        {/* Location Information */}
        <div className={quickInfoStyles.infoItem}>
          <BsGeoAlt className={quickInfoStyles.icon} />
          <span style={{ fontWeight: 600 }}>Job Site:</span>
          <span>{props.Location || 'Not specified'}</span>
        </div>

        {/* Client/Company Information */}
        <div className={quickInfoStyles.infoItem}>
          <BsBuilding className={quickInfoStyles.icon} />
          <span style={{ fontWeight: 600 }}>Client:</span>
          <span>{props.ClientName || 'Not specified'}</span>
        </div>

        {/* Job Status */}
        <div className={quickInfoStyles.infoItem}>
          <BsCalendarCheck className={quickInfoStyles.icon} />
          <span style={{ fontWeight: 600 }}>Status:</span>
          <span className={`${quickInfoStyles.status} ${quickInfoStyles[props.Status?.toLowerCase() || 'pending']}`}>
            {props.Status || 'N/A'}
          </span>
        </div>
      </div>
    ),
    footer: (props) => (
      <div className={quickInfoStyles.quickInfoFooter}>
        <button 
          className={quickInfoStyles.viewDetailsButton}
          onClick={() => router.push(`/dashboard/jobs/${props.Id}`)}
        >
          <span>View Details</span>
          <svg width="34" height="34" viewBox="0 0 74 74" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="37" cy="37" r="35.5" stroke="white" strokeWidth="3"></circle>
            <path d="M25 35.5C24.1716 35.5 23.5 36.1716 23.5 37C23.5 37.8284 24.1716 38.5 25 38.5V35.5ZM49.0607 38.0607C49.6464 37.4749 49.6464 36.5251 49.0607 35.9393L39.5147 26.3934C38.9289 25.8076 37.9792 25.8076 37.3934 26.3934C36.8076 26.9792 36.8076 27.9289 37.3934 28.5147L45.8787 37L37.3934 45.4853C36.8076 46.0711 36.8076 47.0208 37.3934 47.6066C37.9792 48.1924 38.9289 48.1924 39.5147 47.6066L49.0607 38.0607ZM25 38.5L48 38.5V35.5L25 35.5V38.5Z" fill="white"></path>
          </svg>
        </button>
      </div>
    )
  };

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
      <GeeksSEO title="Worker Schedules | SAS - SAP B1 Portal" />

      <Row>
        <Col lg={12}>
          <div className="border-bottom pb-4 mb-4 d-flex align-items-center justify-content-between">
            <div className="mb-3">
              <h1 className="mb-1 h2 fw-bold">Worker Schedules</h1>
              <Breadcrumb>
                <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item href="#">Calendar</Breadcrumb.Item>
                <Breadcrumb.Item active>View Schedules</Breadcrumb.Item>
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
                  subject: { name: "Subject" },
                  startTime: { name: "StartTime" },
                  endTime: { name: "EndTime" },
                  description: { name: "Description" },
                  priority: { name: "Priority" },
                  category: { name: "Category" },
                  location: { name: "ServiceLocation" },
                  customer: { name: "Customer" },
                  equipment: { name: "Equipment" },
                  serviceCall: { name: "ServiceCall" },
                  status: { name: "JobStatus" }
                },
                allowEditing: false,
                allowAdding: false,
                allowDeleting: false,
              }}
              group={{ resources: ["Workers"] }}
              eventRendered={(args) => {
                args.element.style.backgroundColor = getEventColor(args.data);
              }}
              quickInfoTemplates={quickInfoTemplates}
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
