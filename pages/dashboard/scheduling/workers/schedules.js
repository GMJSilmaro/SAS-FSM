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
            console.log("Current user set:", {
              uid: user.uid,
              userId: userData.userId || userDoc.id,
              role: userData.role,
              workerId: userDoc.id,
            });
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

  useEffect(() => {
    if (currentUser && !error) {
      const unsubscribeWorkers = setupWorkersListener();
      return () => {
        if (unsubscribeWorkers) unsubscribeWorkers();
      };
    }
  }, [currentUser, error]);

  const setupWorkersListener = () => {
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
        workers.forEach(setupWorkerJobsListener);
      },
      (error) => {
        console.error("Error fetching workers:", error);
        setError("Error loading worker data. Please try again later.");
      }
    );
  };

  const setupWorkerJobsListener = (worker) => {
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

          workerJobs.push({
            WorkerId: worker.id,
            Subject: jobData.jobName,
            StartTime: startDate,
            EndTime: endDate,
            WorkerName: worker.text,
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
  };

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
                  subject: { name: "Subject", title: "Status" },
                  startTime: { name: "StartTime" },
                  endTime: { name: "EndTime" },
                },
                allowEditing: false,
                allowAdding: false,
                allowDeleting: false,
              }}
              group={{ resources: ["Workers"] }}
              eventRendered={(args) => {
                args.element.style.backgroundColor = getEventColor(args.data);
              }}
              quickInfoTemplates={{
                footer: () => { return <div></div>; }
              }}
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
