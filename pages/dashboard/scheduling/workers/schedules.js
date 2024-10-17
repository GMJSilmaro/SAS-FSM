import React, { useRef, useState, useEffect } from "react";
import {
  ScheduleComponent,
  ResourcesDirective,
  ResourceDirective,
  ViewsDirective,
  ViewDirective,
  Inject,
  TimelineViews,
  Resize,
  DragAndDrop,
  TimelineMonth,
} from "@syncfusion/ej2-react-schedule";
import { closest, removeClass, addClass } from "@syncfusion/ej2-base";
import { TreeViewComponent } from "@syncfusion/ej2-react-navigations";
import { collection, getDocs, setDoc, doc, deleteDoc } from "firebase/firestore"; // Firebase Firestore functions
import { db } from "../../../../firebase";
import { Input } from "@syncfusion/ej2-react-inputs";
import Head from "next/head";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import toaster styles

const WorkerSchedules = () => {
  const scheduleObj = useRef(null);
  const treeObj = useRef(null);
  const [workerData, setWorkerData] = useState([]);
  const [eventData, setEventData] = useState([]);
  const [toastShown, setToastShown] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const allowDragAndDrops = true;

  let isUpdating = false;

  // Statuses to drag (Available, On Leave, etc.)
  const fields = {
    dataSource: [
      { Id: 1, Name: "Available", StatusType: "Status" },
      { Id: 2, Name: "Unavailable", StatusType: "Status" },
      { Id: 3, Name: "On Leave", StatusType: "Status" },
      { Id: 4, Name: "Sick Leave", StatusType: "Status" },
      { Id: 5, Name: "Overtime", StatusType: "Status" },
    ],
    id: "Id",
    text: "Name",
  };
  

  const showToastOnce = (message, type = 'success') => {
    if (!toastShown) {
      toast[type](message);
      setToastShown(true);
      setTimeout(() => setToastShown(false), 1500); // Reset flag after delay
    }
  };

  const addNewEvent = (newEvent) => {
    setEventData((prevEvents) => [...prevEvents, newEvent]); // Append new event
  };

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const workers = querySnapshot.docs.map((doc) => ({
          Id: doc.id,
          Text: `${doc.data().firstName} ${doc.data().lastName}`,
          Designation: doc.data().isFieldWorker ? "Field Worker" : "Technician",
        }));
        setWorkerData(workers);
        console.log("Fetched Workers: ", workers); // Log the workers fetched
      } catch (error) {
        console.error("Error fetching workers: ", error); // Log any errors
      }
    };
    fetchWorkers();
  }, []);
  


  useEffect(() => {
    const fetchSchedules = async () => {
      const schedules = [];
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        console.log(`Total Users Found: ${usersSnapshot.docs.length}`);
    
        for (const userDoc of usersSnapshot.docs) {
          const userId = userDoc.id;
          console.log(`Fetching schedules for User ID: ${userId}`);
    
          // Reference to workerSchedules subcollection for the user
          const workerScheduleRef = collection(db, `users/${userId}/workerSchedules`);
          const scheduleSnapshot = await getDocs(workerScheduleRef);
          
          console.log(`Worker ID: ${userId}, Worker Schedule Count: ${scheduleSnapshot.docs.length}`);
    
          // Iterate through each document in the worker's workerSchedules (each representing a date)
          for (const scheduleDoc of scheduleSnapshot.docs) {
            console.log(`Date Document ID: ${scheduleDoc.id}`);
    
            // Reference to dailySchedules subcollection under the specific date document
            const dailyScheduleRef = collection(db, `users/${userId}/workerSchedules/${scheduleDoc.id}/dailySchedules`);
            const dailyQuerySnapshot = await getDocs(dailyScheduleRef);
            
            console.log(`Daily Schedule Count for ${scheduleDoc.id}: ${dailyQuerySnapshot.docs.length}`);
    
            // Fetch each event in the dailySchedules subcollection
            dailyQuerySnapshot.docs.forEach((eventDoc) => {
              const data = eventDoc.data();
              const startTime = data.StartTime ? new Date(data.StartTime) : null;
              const endTime = data.EndTime ? new Date(data.EndTime) : null;
              const categoryColor = getStatusColor(data.Subject || data.status || 'Default');
              schedules.push({
                ...data,
                StartTime: startTime,
                EndTime: endTime,
                CategoryColor: categoryColor,
                Id: eventDoc.id, // Store the document ID for updates
              });
            });
          }
        }
        console.log("Current Schedules: ", schedules);
        setEventData(schedules);
      } catch (error) {
        console.error("Error fetching schedules:", error);
        toast.error("Failed to fetch schedules.");
      }
    };
  
    fetchSchedules();
  }, []);
  
  
  
  
  
  
  
  
  
  
  
  

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value.toLowerCase());
  };

  // Filtered worker data based on search value
  const filteredWorkerData = workerData.filter((worker) =>
    worker.Text.toLowerCase().includes(searchValue)
  );

  const resourceHeaderTemplate = (props) => (
    <div className="template-wrap">
      <div className="worker-category">
        <div className="worker-name"> {props.resourceData.Text}</div>
        <div className="worker-designation">{props.resourceData.Designation}</div>
      </div>
    </div>
  );

  // Helper function to assign colors based on Subject/Status
  const getStatusColor = (subject) => {
    switch (subject) {
      case "Available":
        return "#28a745";
      case "Unavailable":
        return "#dc3545";
      case "On Leave":
        return "#ffc107";
      case "Sick Leave":
        return "#17a2b8";
      case "Overtime":
        return "#6f42c1";
      default:
        return "#ffffff";
    }
  };

  const onItemDrag = (event) => {
    if (event.name === "dragStart") {
      if (event.data && event.data.Subject) {
        console.log("Dragging existing event:", event.data.Subject);
      }
    }

    if (event.name === "drag") {
      if (previousEventTarget) {
        removeClass([previousEventTarget], "highlight");
      }
      setPreviousEventTarget(event.event.target);
      if (event.event.target.classList.contains("e-work-cells")) {
        addClass([event.event.target], "highlight");
      }
    }
  };


  const onTreeDragStop = async (event) => {
    const scheduleElement = closest(event.target, ".e-work-cells");
    if (scheduleElement && event.target.classList.contains("e-work-cells") && event.draggedNodeData) {
      const cellData = scheduleObj.current.getCellDetails(event.target);
      const resourceDetails = scheduleObj.current.getResourcesByIndex(cellData.groupIndex);
  
      // Create a new event data object using the actual status name from the dragged node
      const newEventData = {
        Subject: event.draggedNodeData.text, // Use the actual status name directly
        StartTime: cellData.startTime,
        EndTime: cellData.endTime,
        WorkerID: resourceDetails.resourceData.Id,
      };
  
      // Ensure no fields are undefined before saving
      if (!newEventData.Subject || !newEventData.StartTime || !newEventData.EndTime) {
        console.error("Cannot save event: Missing required fields", newEventData);
        toast.error("Failed to add new event. Missing required fields.");
        return; // Stop execution if fields are missing
      }
  
      // Format the date as MM-DD-YYYY for document ID
      const dateDocId = `${cellData.startTime.getMonth() + 1}-${cellData.startTime.getDate()}-${cellData.startTime.getFullYear()}`;
      console.log(`Saving new event for Worker ID: ${newEventData.WorkerID}, Date: ${dateDocId}`);
  
      try {
        // Change to create a subcollection for multiple events on the same date
        const workerScheduleRef = collection(db, `users/${newEventData.WorkerID}/workerSchedules/${dateDocId}/dailySchedules`);
        console.log(`Worker Schedule Reference Path: ${workerScheduleRef.path}`);
  
        const newDocRef = doc(workerScheduleRef); // Create a new document reference for each event
        console.log(`New Document Reference ID: ${newDocRef.id}`);
  
        await setDoc(newDocRef, newEventData); // Save the event
        console.log(`Event saved successfully with ID: ${newDocRef.id}`, newEventData);
  
        scheduleObj.current.addEvent({ ...newEventData, Id: newDocRef.id });
        addNewEvent({ ...newEventData, Id: newDocRef.id });
        showToastOnce("New schedule added successfully!");
      } catch (error) {
        console.error("Error saving new event to Firestore:", error);
        toast.error("Failed to add new event.");
      }
    }
  };
  

  const onActionBegin = async (args) => {
    if (args.requestType === "eventChange" && !isUpdating) {
      const eventId = String(args.data.Id);
      const updatedEvent = {
        ...args.data,
        StartTime: args.data.StartTime || null,
        EndTime: args.data.EndTime || null,
      };
  
      if (
        updatedEvent.StartTime && updatedEvent.EndTime && 
        updatedEvent.StartTime.getTime() === args.data.StartTime?.getTime() &&
        updatedEvent.EndTime.getTime() === args.data.EndTime?.getTime()
      ) {
        console.log("No changes detected in event timing. Skipping update.");
        return;
      }
  
      if (!updatedEvent.StartTime || !updatedEvent.EndTime) {
        console.error("Invalid StartTime or EndTime:", updatedEvent);
        toast.error("Event has invalid StartTime or EndTime.");
        return;
      }
  
      try {
        isUpdating = true;
        console.log("Updating Firestore with changed event:", updatedEvent);
        const docRef = doc(db, "workerSchedules", eventId);
        await setDoc(docRef, updatedEvent, { merge: true });
        scheduleObj.current.saveEvent(updatedEvent);
        showToastOnce("Schedule updated successfully!");
      } catch (error) {
        console.error("Error updating event in Firestore:", error);
        toast.error("Failed to update schedule.");
      } finally {
        isUpdating = false;
      }
    }
  
    // Handle delete event
    if (args.requestType === "eventRemove") {
      const eventData = args.data[0]; // Extract the first event being deleted
  
      if (!eventData || !eventData.Id) {
        console.error("Failed to delete event: Invalid event data or undefined ID", eventData);
        toast.error("Failed to delete event: Invalid data or undefined ID.");
        return; // Stop if there's no valid ID
      }
  
      const eventId = String(eventData.Id); // Get the event ID
      try {
        console.log("Deleting event with ID:", eventId);
        const docRef = doc(db, "workerSchedules", eventId);
        await deleteDoc(docRef); // Delete the event from Firebase
        showToastOnce("Schedule deleted successfully!");
      } catch (error) {
        console.error("Error deleting event from Firestore:", error);
        toast.error("Failed to delete schedule.");
      }
    }
  };
  
  
  const onDragStop = async (event) => {
    if (!isUpdating) {
      console.log("onDragStop triggered", event);
      const eventId = String(event.data.Id); // Ensure event.data.Id is a string
      const updatedEvent = {
        ...event.data,
        StartTime: event.event?.StartTime || event.data.StartTime,
        EndTime: event.event?.EndTime || event.data.EndTime,
      };
  
      if (!updatedEvent.StartTime || !updatedEvent.EndTime) {
        console.error("StartTime or EndTime is undefined", updatedEvent);
        toast.error("Invalid event data: StartTime or EndTime is missing.");
        return;
      }
  
      try {
        isUpdating = true; // Prevent other event triggers
        console.log("Updating Firestore with event:", updatedEvent);
        const docRef = doc(db, "workerSchedules", eventId);
        await setDoc(docRef, updatedEvent, { merge: true });
        scheduleObj.current.saveEvent(updatedEvent);
        showToastOnce("Schedule updated successfully!");
      } catch (error) {
        console.error("Error updating event in Firestore:", error);
        toast.error("Failed to update schedule.");
      } finally {
        isUpdating = false; // Reset the flag
      }
    }
  };
  

  const onPopupOpen = (args) => {
    if (args.type === "QuickInfo" && args.target.classList.contains("e-work-cells")) {
      args.cancel = true;
    }
    // if (args.type === "Editor") {
    //   args.cancel = true;
    // }
  };

  const onEventRendered = (args) => {
    if (args.data.CategoryColor) {
      args.element.style.backgroundColor = args.data.CategoryColor;
      args.element.style.borderColor = args.data.CategoryColor;
      args.element.style.color = "#ffffff";
    }
  };

  return (
    <>
      <Head>
        <title>Worker Schedule</title>
      </Head>
      <ToastContainer /> {/* Add ToastContainer for notifications */}
      <div className="schedule-control-section">
        <div className="col-lg-12 control-section">
          <div className="drag-sample-wrapper">
            <div className="schedule-container">
              <div className="title-container">
                <h1 className="title-text">Worker Schedule</h1>
              </div>
              <ScheduleComponent
                ref={scheduleObj}
                cssClass="schedule-drag-drop"
                width="100%"
                height="650px"
                selectedDate={new Date()}
                currentView="TimelineDay"
                resourceHeaderTemplate={resourceHeaderTemplate}
                eventSettings={{
                  dataSource: eventData,
                  fields: {
                    Subject: { title: "Status", name: "Subject" },
                    StartTime: { title: "From", name: "StartTime" },
                    EndTime: { title: "To", name: "EndTime" },
                    CategoryColor: { name: "CategoryColor" },
                  },
                }}
                group={{ enableCompactView: false, resources: ["Workers"] }}
                actionBegin={onActionBegin}
                dragStop={onDragStop}
                eventRendered={onEventRendered}
                popupOpen={onPopupOpen}
              >
                <ResourcesDirective>
                  <ResourceDirective
                    field="WorkerID"
                    title="Workers"
                    name="Workers"
                    allowMultiple={false}
                    dataSource={workerData}
                    textField="Text"
                    idField="Id"
                  />
                </ResourcesDirective>
                <ViewsDirective>
                  <ViewDirective option="TimelineDay" />
                  <ViewDirective
                  option="TimelineWeek"
                  timeScale={{ enable: true, interval: 180, slotCount: 3 }}
                  interval={2}
                  />
                  <ViewDirective option="TimelineMonth" />
                </ViewsDirective>
                <Inject services={[TimelineViews, TimelineMonth, Resize, DragAndDrop]} />
              </ScheduleComponent>
            </div>

            <div className="treeview-external-drag">
              <div className="title-container">
                <h1 className="title-text">Status List</h1>
              </div>
              <TreeViewComponent
                ref={treeObj}
                cssClass="treeview-external-drag"
                dragArea=".drag-sample-wrapper"
                fields={fields}
                nodeTemplate={(data) => {
                  // Dynamically assign class based on status
                  let statusClass = "";
                  switch (data.Name) {
                    case "Available":
                      statusClass = "available";
                      break;
                    case "Unavailable":
                      statusClass = "unavailable";
                      break;
                    case "On Leave":
                      statusClass = "onleave";
                      break;
                    case "Sick Leave":
                      statusClass = "sickleave";
                      break;
                    case "Overtime":
                      statusClass = "overtime";
                      break;
                    default:
                      statusClass = "";
                  }

                  return (
                    <div className={`e-list-text ${statusClass}`}>
                      <div id="waitlist">{data.Name}</div>
                      <div id="waitcategory">{data.StatusType}</div>
                    </div>
                  );
                }}
                nodeDragStop={onTreeDragStop}
                nodeDragStart={onItemDrag}
                allowDragAndDrop={allowDragAndDrops}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WorkerSchedules;