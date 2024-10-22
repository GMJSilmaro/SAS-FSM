import React, { useEffect, useState, useRef } from "react";
import { getDocs, collection, updateDoc, doc } from "firebase/firestore"; // Firebase Firestore imports
import { db } from "../../../../firebase"; 
import { Row, Col, Card, Image, OverlayTrigger, Tooltip, Breadcrumb, ListGroup, Spinner  } from "react-bootstrap";
import {
  ScheduleComponent,
  ViewsDirective,
  ViewDirective,
  Day,
  Week,
  Month,
  Inject,
  Resize,
  DragAndDrop,
} from "@syncfusion/ej2-react-schedule";
import { ButtonComponent } from "@syncfusion/ej2-react-buttons";
import { Internationalization } from "@syncfusion/ej2-base";
import { TextBoxComponent } from "@syncfusion/ej2-react-inputs";
import { BsClock, BsFillPersonFill, BsGeoAlt, BsCalendarCheck } from "react-icons/bs"; // Import icons
import styles from "./calendar.module.css"; // Import the CSS module
import { useRouter } from 'next/router';
import truncate from 'html-truncate';
import { ToastContainer, toast } from "react-toastify"; // Import Toastify
import "react-toastify/dist/ReactToastify.css";

const Calendar = () => {
    const router = useRouter();
    const scheduleObj = useRef(null);
    const [events, setEvents] = useState([]); // Store events from Firebase
    const [searchTerm, setSearchTerm] = useState(""); // Search term state
    const [filteredEvents, setFilteredEvents] = useState([]); // Filtered events
    const [loading, setLoading] = useState(true); // Loading state
  
    useEffect(() => {
      const fetchJobs = async () => {
        setLoading(true); // Start loading
        try {
          const jobsSnapshot = await getDocs(collection(db, "jobs"));
          const jobsData = jobsSnapshot.docs.map((doc) => {
            const job = doc.data();
            return {
              Id: doc.id,
              Subject: job.jobName,
              JobNo: job.jobNo,
              Customer: job.customerName,
              ServiceLocation: job.location?.locationName || "",
              AssignedWorkers: job.assignedWorkers.map(worker => worker.contact?.contactFullname || worker.workerId),
              StartTime: new Date(job.startDate),
              EndTime: new Date(job.endDate),            
              JobStatus: job.jobStatus,
              Description: job.jobDescription,
              Equipments: job.equipments.map(eq => eq.itemName).join(", ") // Handling multiple equipments
            };
          });
          setEvents(jobsData);
          setFilteredEvents(jobsData); // Set both filtered and original events
        } catch (error) {
          console.error("Error fetching jobs from Firebase:", error);
        } finally {
          setLoading(false); // Stop loading once data is fetched
        }
      };
  
      fetchJobs();
    }, []);
  
    const onDragStop = async (args) => {
        const { Id, StartTime, EndTime, Subject } = args.data; // Extract event details
        const currentView = scheduleObj.current.currentView;
    
        try {
          // Reference to the document in Firestore
          const jobRef = doc(db, "jobs", Id);
    
          let updatedStartTime, updatedEndTime;
    
          if (currentView === 'Month') {
            // For Month view, keep the original time and only update the date
            const originalStart = new Date(events.find(e => e.Id === Id).StartTime);
            const originalEnd = new Date(events.find(e => e.Id === Id).EndTime);
    
            updatedStartTime = new Date(StartTime.setHours(originalStart.getHours(), originalStart.getMinutes()));
            updatedEndTime = new Date(EndTime.setHours(originalEnd.getHours(), originalEnd.getMinutes()));
          } else {
            // For Day and Week views, update both date and time
            updatedStartTime = StartTime;
            updatedEndTime = EndTime;
          }
    
          // Update the document with the new start and end times
          await updateDoc(jobRef, {
            startDate: updatedStartTime.toISOString(),
            endDate: updatedEndTime.toISOString(),
          });
    
          toast.success(`Job ${Id} ${Subject} updated successfully.`);
          
        } catch (error) {
          toast.error("Failed to update job. Please try again.");
        }
    };
  
    // Resize event handler to update startDate and endDate in Firebase
    const onResizeStop = async (args) => {
        const { Id, StartTime, EndTime } = args.data; // Extract event details
        const currentView = scheduleObj.current.currentView;
    
        try {
          // Reference to the document in Firestore
          const jobRef = doc(db, "jobs", Id);
    
          let updatedStartTime, updatedEndTime;
    
          if (currentView === 'Month') {
            // For Month view, keep the original time and only update the date
            const originalStart = new Date(events.find(e => e.Id === Id).StartTime);
            const originalEnd = new Date(events.find(e => e.Id === Id).EndTime);
    
            updatedStartTime = new Date(StartTime.setHours(originalStart.getHours(), originalStart.getMinutes()));
            updatedEndTime = new Date(EndTime.setHours(originalEnd.getHours(), originalEnd.getMinutes()));
          } else {
            // For Day and Week views, update both date and time
            updatedStartTime = StartTime;
            updatedEndTime = EndTime;
          }
    
          // Update the document with the new start and end times
          await updateDoc(jobRef, {
            startDate: updatedStartTime.toISOString(),
            endDate: updatedEndTime.toISOString(),
          });
    
          toast.success(`Job ${Id} updated successfully.`);
          console.log(`Job ${Id} updated in Firebase.`);
        } catch (error) {
          console.error("Error updating job in Firebase:", error);
          toast.error("Failed to update job. Please try again.");
        }
    };

    const intl = new Internationalization();

    const getStatusColor = (status) => {
        switch (status) {
          case "Created":
            return { backgroundColor: "#9e9e9e", color: "#fff" }; // Created (Gray)
          case "Confirmed":
            return { backgroundColor: "#2196f3", color: "#fff" }; // Confirmed (Blue)
          case "Cancelled":
            return { backgroundColor: "#f44336", color: "#fff" }; // Cancelled (Red)
          case "Job Started":
            return { backgroundColor: "#FFA500", color: "#fff" }; // Job Started (Orange)
          case "Job Complete":
            return { backgroundColor: "#32CD32", color: "#fff" }; // Job Complete (Green)
          case "Validate":
            return { backgroundColor: "#00bcd4", color: "#fff" }; // Validate (Cyan)
          case "Scheduled":
            return { backgroundColor: "#607d8b", color: "#fff" }; // Scheduled (Blue Gray)
          default:
            return { backgroundColor: "#9e9e9e", color: "#fff" }; // Default (Gray)
        }
      };

      const headerTemplate = (props) => (
        <div className={styles["quick-info-header"]}>
          <div className={styles["quick-info-header-content"]} style={getStatusColor(props.JobStatus)}>
      
            {/* Status at the top right */}
            <div className={styles["quick-info-status"]} style={{
              position: 'absolute', 
              right: '25px', 
              top: '8px', 
              fontWeight: 'bold'
            }}>
              {props.JobStatus || "Unknown Status"}
            </div>
      
            {/* Title and date below the status */}
            <div className={styles["quick-info-title"]} style={{ flex: 1 }}>
              {props.elementType === "cell" ? "Add Job" : "Job Details"}
              <div className={styles["duration-text"]}>
                {intl.formatDate(props.StartTime, { type: "date", skeleton: "full" })}{" "}
                ({intl.formatDate(props.StartTime, { skeleton: "hm" })} -{" "}
                {intl.formatDate(props.EndTime, { skeleton: "hm" })})
              </div>
            </div>
          </div>
        </div>
      );
      
      
    
      const stripHtmlTags = (htmlContent) => {
        const tempElement = document.createElement('div');
        tempElement.innerHTML = htmlContent;
        return tempElement.textContent || tempElement.innerText || '';  // Get plain text content
      };
      
      const contentTemplate = (props) => {
        // Remove HTML tags and truncate the plain text
        const plainTextDescription = stripHtmlTags(props.Description);
        const truncatedDescription = plainTextDescription.length > 100
          ? plainTextDescription.substring(0, 100) + '...'
          : plainTextDescription;
      
        return (
          <div className={styles["quick-info-content"]}>
            {props.elementType === "cell" ? (
              <div className="e-cell-content">
                <div className="content-area">Create a new job...</div>
              </div>
            ) : (
              <div className={styles["event-content"]}>
                <div className={styles["notes-wrap"]}>
                  <BsCalendarCheck /> <strong>Job No:</strong> {props.JobNo}
                </div>
                <div className={styles["notes-wrap"]}>
                  <BsCalendarCheck /> <strong>Job Name:</strong> {props.Subject}
                </div>
                <div className={styles["notes-wrap"]}>
                  <BsFillPersonFill /> <strong>Customer:</strong> {props.Customer}
                </div>
                <div className={styles["notes-wrap"]}>
                  <BsGeoAlt /> <strong>Service Location:</strong> {props.ServiceLocation}
                </div>
                <div className={styles["notes-wrap"]}>
                  <BsFillPersonFill /> <strong>Assigned Workers:</strong> {props.AssignedWorkers.join(", ")}
                </div>
                <div className={styles["notes-wrap"]}>
                  {/* Render plain text truncated description */}
                  <strong>Description:</strong> {truncatedDescription}
                </div>
              </div>
            )}
          </div>
        );
      };
    
    const footerTemplate = (props) => {
        return (
          <div className={styles["quick-info-footer"]}>
            {props.elementType === "cell" ? (
              <div className="cell-footer">
                <ButtonComponent id="add" cssClass="e-flat" content="Add" isPrimary={true} />
              </div>
            ) : (
              <div className="event-footer">
                <ButtonComponent 
                  id="more-details" 
                  cssClass="e-flat" 
                  content="More Details" 
                  isPrimary={true} 
                  onClick={() => router.push(`/dashboard/jobs/${props.Id}`)} // Navigate to dynamic job page
                />
              </div>
            )}
          </div>
        );
      };
    
      const onPopupOpen = (args) => {
        // Disable the quick info for cell clicks
        if (args.type === "QuickInfo" && args.target.classList.contains("e-work-cells")) {
          args.cancel = true; // This will hide the quick info popup when a cell is clicked
        }
      };
    
      const onCellDoubleClick = (args) => {
        args.cancel = true; // This cancels the default editor popup
        window.location.href = "/dashboard/jobs/create-jobs"; // Custom redirect action
      };
    
      const onEventDoubleClick = (args) => {
        args.cancel = true; // Prevent the default event editor from opening
        
        console.log(args.data); // You can access the event details here
      };

   

     

    const handleSearch = (args) => {
        const term = args.value.toLowerCase(); // Access value directly from args
        setSearchTerm(term);
        if (term !== "") {
          const filtered = events.filter((event) => {
            return (
              event.Subject.toLowerCase().includes(term) ||
              event.JobNo.toLowerCase().includes(term) ||
              event.Customer.toLowerCase().includes(term) ||
              event.ServiceLocation.toLowerCase().includes(term)
            );
          });
          setFilteredEvents(filtered);
        } else {
          setFilteredEvents(events); // Reset to original events if search is cleared
        }
      };
    

      const legendItems = [
        { status: "Created", color: getStatusColor("Created").backgroundColor },
        { status: "Confirmed", color: getStatusColor("Confirmed").backgroundColor },
        { status: "Cancelled", color: getStatusColor("Cancelled").backgroundColor },
        { status: "Job Started", color: getStatusColor("Job Started").backgroundColor },
        { status: "Job Complete", color: getStatusColor("Job Complete").backgroundColor },
        { status: "Validate", color: getStatusColor("Validate").backgroundColor },
        { status: "Scheduled", color: getStatusColor("Scheduled").backgroundColor }
      ];

  
    return (
      <>
        <h1 className="mb-1 h2 fw-bold">Current Jobs Calendar</h1>
  
        <Breadcrumb>
          <Breadcrumb.Item href="#">Dashboard</Breadcrumb.Item>
          <Breadcrumb.Item href="#">Scheduling</Breadcrumb.Item>
          <Breadcrumb.Item href="#">Jobs</Breadcrumb.Item>
          <Breadcrumb.Item active>Current Jobs</Breadcrumb.Item>
        </Breadcrumb>
        <ToastContainer />
        <div style={{ display: "flex", marginTop: '10px' }}>
          {/* Left side: Calendar */}
          <div style={{ flex: 8, marginRight: '20px' }}>
            <TextBoxComponent
              placeholder="Search via Job Name, Job Number, Customer, Location..."
              value={searchTerm}
              input={handleSearch}
              cssClass={styles.searchInput}
            />
  
            {/* Display loading spinner when loading is true */}
            {loading ? (
              <div className="d-flex justify-content-center mt-4">
                <Spinner animation="border" role="status">
                  <span className="sr-only">Loading...</span>
                </Spinner>
              </div>
            ) : (
              <ScheduleComponent
                ref={scheduleObj}
                height="650px"
                style={{ marginTop: '15px' }}
                width="100%"
                selectedDate={new Date(2024, 9, 15)}
                eventSettings={{ dataSource: filteredEvents }}
                eventRendered={(args) => {
                  const colorStyle = getStatusColor(args.data.JobStatus);
                  args.element.style.backgroundColor = colorStyle.backgroundColor;
                  args.element.style.color = colorStyle.color;
                }}
                quickInfoTemplates={{
                  header: headerTemplate,
                  content: contentTemplate,
                  footer: footerTemplate,
                }}
                popupOpen={onPopupOpen}
                cellDoubleClick={onCellDoubleClick}
                eventDoubleClick={onEventDoubleClick}
                currentView="Month"
                dragStop={onDragStop} // Add drag stop event handler
                resizeStop={onResizeStop} // Add resize stop event handler
              >
                <ViewsDirective>
                  <ViewDirective option="Day" />
                  <ViewDirective option="Week" />
                  <ViewDirective option="Month" />
                </ViewsDirective>
                <Inject services={[Day, Week, Month, Resize, DragAndDrop]} />
              </ScheduleComponent>
            )}
          </div>
  
          {/* Right side: Legend */}
          <div style={{ flex: 1 }}>
            <h4>Legend</h4>
            <ul style={{ listStyle: "none", paddingLeft: 0 }}>
              {legendItems.map((item) => (
                <li key={item.status} style={{ marginBottom: "10px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: "20px",
                      height: "20px",
                      backgroundColor: item.color,
                      marginRight: "10px"
                    }}
                  ></span>
                  {item.status}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </>
    );
  };
  
  export default Calendar;