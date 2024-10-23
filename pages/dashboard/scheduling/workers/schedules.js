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
  Resize,
  DragAndDrop,
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
// import widget/custom components
import { GeeksSEO, GridListViewButton } from 'widgets';
import {
  Row,
  Col,
  Card,
  Image,
  OverlayTrigger,
  Tooltip,
  Breadcrumb,
  ListGroup,
} from "react-bootstrap";

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

        // Set up listeners for each worker's schedules
        workers.forEach(setupWorkerSchedulesListener);
      },
      (error) => {
        console.error("Error fetching workers:", error);
        setError("Error loading worker data. Please try again later.");
      }
    );
  };

  const setupWorkerSchedulesListener = (worker) => {
    const scheduleQuery = query(
      collection(db, "users", worker.id, "workerSchedules")
    );

    return onSnapshot(
      scheduleQuery,
      (snapshot) => {
        const workerSchedules = [];
        snapshot.forEach((scheduleDoc) => {
          const data = scheduleDoc.data();
          if (data.schedules && Array.isArray(data.schedules)) {
            data.schedules.forEach((schedule) => {
              workerSchedules.push({
                Id: schedule.id,
                Subject: schedule.status,
                StartTime: new Date(schedule.startTime),
                EndTime: new Date(schedule.endTime),
                IsAllDay: schedule.isAllDay,
                WorkerId: worker.id,
                Status: schedule.status,
                Day: data.day,
                DayId: data.dayId,
              });
            });
          }
        });

        console.log(`Updated schedules for ${worker.text}:`, workerSchedules);

        setScheduleData((prevData) => {
          // Remove existing schedules for this worker
          const filteredData = prevData.filter(
            (schedule) => schedule.WorkerId !== worker.id
          );
          // Add the new schedules
          return [...filteredData, ...workerSchedules];
        });
      },
      (error) => {
        console.error(
          `Error fetching schedules for worker ${worker.text}:`,
          error
        );
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

  const onActionComplete = useCallback(
    async (args) => {
      if (!currentUser) {
        console.error("No authenticated user found");
        toast.error("Error updating schedule: No authenticated user");
        return;
      }

      console.log("onActionComplete triggered", args);

      if (args.data && args.requestType === "eventRemoved") {
        // Handle event removal
        const eventData = Array.isArray(args.data) ? args.data[0] : args.data;
        if (!eventData) {
          console.error("Event data is missing.");
          return;
        }

        // Log the eventData and its Id
        console.log("Event data for removal:", eventData);
        console.log("Event ID for removal:", eventData.Id);

        const workerId = eventData.WorkerId;
        if (!workerId) {
          console.error("Worker ID is missing. Cannot delete schedule.");
          toast.error("Failed to delete schedule. Worker ID is missing.");
          return;
        }

        const dayId = formatDate(eventData.StartTime);
        console.log(
          `Attempting to delete schedule for worker ${workerId} on ${dayId}:`,
          eventData
        );

        try {
          const workerScheduleRef = doc(
            db,
            "users",
            workerId,
            "workerSchedules",
            dayId
          );
          const docSnap = await getDoc(workerScheduleRef);

          if (docSnap.exists()) {
            const existingSchedules = docSnap.data().schedules || [];
            const updatedSchedules = existingSchedules.filter(
              (schedule) => schedule.id !== eventData.Id
            );

            // Update the worker's schedule by removing the deleted event
            await setDoc(
              workerScheduleRef,
              { schedules: updatedSchedules },
              { merge: true }
            );

            console.log(
              `Successfully deleted schedule for worker ${workerId} on ${dayId}`
            );
            toast.success("Schedule deleted successfully!");
          } else {
            console.warn(
              `No schedule found for worker ${workerId} on ${dayId}`
            );
          }
        } catch (error) {
          console.error(
            `Error deleting schedule for worker ${workerId} on ${dayId}:`,
            error
          );
          toast.error("Failed to delete schedule. Please try again.");
        }
      } else if (
        args.data &&
        (args.requestType === "eventCreated" ||
          args.requestType === "eventChanged")
      ) {
        // Handle event creation or change
        const eventData = Array.isArray(args.data) ? args.data[0] : args.data;
        if (!eventData) {
          console.error("Event data is missing.");
          return;
        }

        // Log the eventData and its Id for creation/change
        console.log("Event data for creation/change:", eventData);
        console.log("Event ID for creation/change:", eventData.Id);

        const dayId = formatDate(eventData.StartTime);

        // Get the old worker ID from event data, ensure it's set correctly
        console.log("Old worker ID from state:", oldWorkerId);
        const newWorkerId = eventData.NewWorkerId || eventData.WorkerId; // Use the new worker ID if it exists
        const newScheduleEntry = {
          id: eventData.Id || Date.now().toString(),
          status: eventData.Subject || statusOptions[0],
          startTime: eventData.StartTime.toISOString(),
          endTime: eventData.EndTime.toISOString(),
          isAllDay: eventData.IsAllDay,
        };

        console.log(
          `Attempting to save schedule for worker ${newWorkerId} on ${dayId}:`,
          newScheduleEntry
        );

        try {
          const newWorkerScheduleRef = doc(
            db,
            "users",
            newWorkerId,
            "workerSchedules",
            dayId
          );
          const newDocSnap = await getDoc(newWorkerScheduleRef);

          let existingSchedules = [];
          if (newDocSnap.exists()) {
            existingSchedules = newDocSnap.data().schedules || [];
          }

          const updatedSchedulesForNewWorker = existingSchedules.filter(
            (schedule) => schedule.id !== newScheduleEntry.id
          );
          updatedSchedulesForNewWorker.push(newScheduleEntry);

          await setDoc(
            newWorkerScheduleRef,
            {
              day: eventData.StartTime.toLocaleDateString("en-US", {
                weekday: "long",
              }),
              dayId: dayId,
              timestamp: new Date().toISOString(),
              workerId: newWorkerId,
              schedules: updatedSchedulesForNewWorker,
            },
            { merge: true }
          );

          console.log(
            `Successfully saved schedule for worker ${newWorkerId} on ${dayId}`
          );
          toast.success("Schedule updated successfully!");

          // Check if the worker has changed
          console.log(
            `Old worker ID: ${oldWorkerId}, New worker ID: ${newWorkerId}`
          );
          if (oldWorkerId && oldWorkerId !== newWorkerId) {
            console.log(
              "Worker has changed. Removing old entry from:",
              oldWorkerId
            );
            await handleOldEntryRemoval(oldWorkerId, eventData.Id, dayId);
          } else {
            console.log(
              "Old and new worker IDs are the same; not removing any old entry."
            );
          }
        } catch (error) {
          console.error(
            `Error saving schedule for worker ${newWorkerId} on ${dayId}:`,
            error
          );
          toast.error("Failed to update schedule. Please try again.");
        }
      } else {
        console.log(
          "Event not created, changed, or removed:",
          args.requestType
        );
      }
    },
    [currentUser, createNotification, statusOptions, oldWorkerId]
  );

  const handleOldEntryRemoval = async (oldWorkerId, eventId, dayId) => {
    console.log(
      `Attempting to remove old entry for worker ${oldWorkerId} with event ID ${eventId} on ${dayId}`
    );
    try {
      const oldWorkerScheduleRef = doc(
        db,
        "users",
        oldWorkerId,
        "workerSchedules",
        dayId
      );
      const oldDocSnap = await getDoc(oldWorkerScheduleRef);

      if (oldDocSnap.exists()) {
        const existingSchedules = oldDocSnap.data().schedules || [];
        const updatedSchedules = existingSchedules.filter(
          (schedule) => schedule.id !== eventId
        );

        // Update the old worker's schedule by removing the moved event
        await setDoc(
          oldWorkerScheduleRef,
          { schedules: updatedSchedules },
          { merge: true }
        );

        console.log(
          `Successfully removed schedule for worker ${oldWorkerId} on ${dayId}`
        );
        toast.success("Old schedule entry removed successfully!");
      } else {
        console.warn(`No schedule found for worker ${oldWorkerId} on ${dayId}`);
      }
    } catch (error) {
      console.error(
        `Error removing old schedule for worker ${oldWorkerId} on ${dayId}:`,
        error
      );
      toast.error("Failed to remove old schedule entry. Please try again.");
    }
  };

  // const onActionComplete = useCallback(async (args) => {
  //   if (!currentUser) {
  //     console.error("No authenticated user found");
  //     toast.error("Error updating schedule: No authenticated user");
  //     return;
  //   }

  //   console.log("onActionComplete triggered", args);
  //   if (args.requestType === 'eventCreated' || args.requestType === 'eventChanged') {
  //     const eventData = args.data[0];
  //     const workerId = eventData.WorkerId;
  //     const dayId = formatDate(eventData.StartTime);

  //     const newScheduleEntry = {
  //       id: Date.now().toString(),
  //       status: eventData.Subject || statusOptions[0],
  //       startTime: eventData.StartTime.toISOString(),
  //       endTime: eventData.EndTime.toISOString(),
  //       isAllDay: eventData.IsAllDay,
  //     };

  //     console.log(`Attempting to save schedule for worker ${workerId} on ${dayId}:`, newScheduleEntry);

  //     try {
  //       const workerScheduleRef = doc(db, "users", workerId, "workerSchedules", dayId);

  //       const docSnap = await getDoc(workerScheduleRef);
  //       let existingSchedules = [];
  //       if (docSnap.exists()) {
  //         existingSchedules = docSnap.data().schedules || [];
  //       }

  //       const scheduleExists = existingSchedules.some(schedule =>
  //         schedule.startTime === newScheduleEntry.startTime &&
  //         schedule.endTime === newScheduleEntry.endTime &&
  //         schedule.status === newScheduleEntry.status
  //       );

  //       if (!scheduleExists) {
  //         const updatedSchedules = [...existingSchedules, newScheduleEntry];
  //         await setDoc(workerScheduleRef, {
  //           day: eventData.StartTime.toLocaleDateString('en-US', { weekday: 'long' }),
  //           dayId: dayId,
  //           timestamp: new Date().toISOString(),
  //           workerId: workerId,
  //           schedules: updatedSchedules
  //         }, { merge: true });

  //         console.log(`Successfully saved schedule for worker ${workerId} on ${dayId}`);
  //         toast.success('Schedule updated successfully!');

  //         await createNotification(workerId, newScheduleEntry.status, newScheduleEntry.startTime);
  //       } else {
  //         console.log("Schedule already exists, skipping save");
  //         toast.info('This schedule already exists.');
  //       }
  //     } catch (error) {
  //       console.error(`Error saving schedule for worker ${workerId} on ${dayId}:`, error);
  //       toast.error('Failed to update schedule. Please try again.');
  //     }
  //   } else {
  //     console.log("Event not created or changed:", args.requestType);
  //   }
  // }, [currentUser, createNotification, statusOptions]);

  const onActionBegin = (args) => {
    console.log("Action has started:", args);

    if (
      args.requestType === "eventCreate" ||
      args.requestType === "eventChange"
    ) {
      const eventData = Array.isArray(args.data) ? args.data[0] : args.data;

      if (eventData) {
        const retrievedOldWorkerId =
          eventData.OldWorkerId || eventData.WorkerId;
        console.log("Old worker ID retrieved:", retrievedOldWorkerId);
        setOldWorkerId(retrievedOldWorkerId); // Store in state
      } else {
        console.warn("Event data is missing.");
      }
    }
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
          <ScheduleComponent
            // ref={scheduleRef}
            cssClass="timeline-resource-grouping"
            width="100%"
            height="650px"
            currentView="TimelineDay"
            selectedDate={new Date()}
            startHour="06:00"
            endHour="21:00"
            workDays={workDays}
            // quickInfoTemplates={{
            //   content: quickInfoTemplatesContent,
            //   footer: quickInfoTemplatesFooter,
            // }}
            // popupOpen={onPopupOpen}
            eventSettings={{
              dataSource: scheduleData,
              fields: {
                subject: { name: "Subject", title: "Status" },
                startTime: { name: "StartTime" },
                endTime: { name: "EndTime" },
                description: { name: "Description" },
              },
            }}
            group={{ resources: ["Workers"] }}
            eventRendered={(args) => {
              args.element.style.backgroundColor = getEventColor(args.data);
            }}
            actionComplete={onActionComplete} // Action complete callback
            actionBegin={onActionBegin} // Action begin callback
          >
            <ResourcesDirective>
              <ResourceDirective
                field="WorkerId"
                title="Field Workers"
                name="Workers"
                allowMultiple={false}
                dataSource={fieldWorkers}
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
                Resize,
                DragAndDrop,
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
