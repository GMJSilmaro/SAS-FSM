import React, { useEffect, useState, useRef, useCallback } from "react";
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
import { BsClock, BsFillPersonFill, BsGeoAlt, BsCalendarCheck, BsBuilding, BsTools, BsX } from "react-icons/bs"; // Import icons
import styles from "./calendar.module.css";
import { useRouter } from 'next/router';
import truncate from 'html-truncate';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from 'sweetalert2';
import { format } from 'date-fns'; 

const Calendar = () => {
    const router = useRouter();
    const scheduleObj = useRef(null);
    const [events, setEvents] = useState([]); // Store events from Firebase
    const [searchTerm, setSearchTerm] = useState(""); // Search term state
    const [filteredEvents, setFilteredEvents] = useState([]); // Filtered events
    const [loading, setLoading] = useState(true); // Loading state
  
    useEffect(() => {
      const fetchJobs = async () => {
        setLoading(true);
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
              AssignedWorkers: job.assignedWorkers.map(worker => ({
                workerId: worker.workerId,
                fullName: worker.contact?.contactFullname || worker.workerId,
                profilePicture: worker.contact?.profilePicture || "/images/avatar/NoProfile.png"
              })),
              StartTime: new Date(job.startDate),
              EndTime: new Date(job.endDate),            
              JobStatus: job.jobStatus,
              Description: job.jobDescription,
              Equipments: job.equipments.map(eq => eq.itemName).join(", "),
              Priority: job.priority || "",
              Category: job.category || "N/A",
              ServiceCall: job.serviceCallID || "N/A",
              Equipment: job.equipments?.[0]?.itemName || "N/A"
            };
          });
          setEvents(jobsData);
          console.log(jobsData);
          setFilteredEvents(jobsData);
        } catch (error) {
          console.error("Error fetching jobs from Firebase:", error);
        } finally {
          setLoading(false);
        }
      };
  
      fetchJobs();
    }, []);
  
    const onDragStop = async (args) => {
        const { Id, StartTime, EndTime, Subject } = args.data;
        const currentView = scheduleObj.current.currentView;

        try {
            const jobRef = doc(db, "jobs", Id);

            let updatedStartTime, updatedEndTime;

            if (currentView === 'Month') {
                const originalStart = new Date(events.find(e => e.Id === Id).StartTime);
                const originalEnd = new Date(events.find(e => e.Id === Id).EndTime);

                updatedStartTime = new Date(StartTime.setHours(originalStart.getHours(), originalStart.getMinutes()));
                updatedEndTime = new Date(EndTime.setHours(originalEnd.getHours(), originalEnd.getMinutes()));
            } else {
                updatedStartTime = StartTime;
                updatedEndTime = EndTime;
            }

            // Update Firestore
            await updateDoc(jobRef, {
                startDate: updatedStartTime.toISOString(),
                endDate: updatedEndTime.toISOString(),
            });

            // Update local state
            const updatedEvents = events.map(event => {
                if (event.Id === Id) {
                    return {
                        ...event,
                        StartTime: updatedStartTime,
                        EndTime: updatedEndTime
                    };
                }
                return event;
            });

            setEvents(updatedEvents);
            setFilteredEvents(
                searchTerm ? 
                updatedEvents.filter(event => 
                    event.Subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    event.JobNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    event.Customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    event.ServiceLocation.toLowerCase().includes(searchTerm.toLowerCase())
                ) : 
                updatedEvents
            );

            // Force schedule component to refresh
            scheduleObj.current.refreshEvents();

            toast.success(`Job ${Id} ${Subject} updated successfully.`);
        } catch (error) {
            console.error("Error updating job:", error);
            toast.error("Failed to update job. Please try again.");
            
            // Revert the drag if there's an error
            scheduleObj.current.refreshEvents();
        }
    };
  
    const onResizeStop = async (args) => {
        const { Id, StartTime, EndTime } = args.data;
        const currentView = scheduleObj.current.currentView;

        try {
            const jobRef = doc(db, "jobs", Id);

            let updatedStartTime, updatedEndTime;

            if (currentView === 'Month') {
                const originalStart = new Date(events.find(e => e.Id === Id).StartTime);
                const originalEnd = new Date(events.find(e => e.Id === Id).EndTime);

                updatedStartTime = new Date(StartTime.setHours(originalStart.getHours(), originalStart.getMinutes()));
                updatedEndTime = new Date(EndTime.setHours(originalEnd.getHours(), originalEnd.getMinutes()));
            } else {
                updatedStartTime = StartTime;
                updatedEndTime = EndTime;
            }

            // Update Firestore
            await updateDoc(jobRef, {
                startDate: updatedStartTime.toISOString(),
                endDate: updatedEndTime.toISOString(),
            });

            // Update local state
            const updatedEvents = events.map(event => {
                if (event.Id === Id) {
                    return {
                        ...event,
                        StartTime: updatedStartTime,
                        EndTime: updatedEndTime
                    };
                }
                return event;
            });

            setEvents(updatedEvents);
            setFilteredEvents(
                searchTerm ? 
                updatedEvents.filter(event => 
                    event.Subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    event.JobNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    event.Customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    event.ServiceLocation.toLowerCase().includes(searchTerm.toLowerCase())
                ) : 
                updatedEvents
            );

            // Force schedule component to refresh
            scheduleObj.current.refreshEvents();

            toast.success(`Job ${Id} updated successfully.`);
        } catch (error) {
            console.error("Error updating job:", error);
            toast.error("Failed to update job. Please try again.");
            
            // Revert the resize if there's an error
            scheduleObj.current.refreshEvents();
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
        <div 
          className={styles.quickInfoHeader}
          style={getStatusColor(props.JobStatus)} 
        >
          <span className={styles.timeRange}>
            {intl.formatDate(props.StartTime, { skeleton: "hm" })} - {intl.formatDate(props.EndTime, { skeleton: "hm" })}
          </span>
          <button 
            onClick={() => scheduleObj.current.closeQuickInfoPopup()} 
            className={styles.closeButton}
          >
            <BsX className={styles.closeIcon} />
          </button>
        </div>
      );
      
      
    
      const stripHtmlTags = (htmlContent) => {
        const tempElement = document.createElement('div');
        tempElement.innerHTML = htmlContent;
        return tempElement.textContent || tempElement.innerText || '';  // Get plain text content
      };
      
      const contentTemplate = (props) => (
        <div className={styles.quickInfoContent}>
          <div className={styles.titleContainer} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className={styles.eventTitle} style={{ fontWeight: 600 }}>{props.Subject}</h3>
            <div className={styles.statusBadge} style={getStatusColor(props.JobStatus)}>
              {props.JobStatus}
            </div>
          </div>
          <div className={styles.eventDetails}>
            <span className={`${styles.priorityTag} ${styles[props.Priority?.toLowerCase()]}`}>
              {props.Priority}
            </span>
            {/* <span className={styles.category}>{props.Category}</span> */}
            <span className={styles.duration}>
              <BsClock className={styles.icon} />
              {calculateDuration(props.StartTime, props.EndTime)}
              <div className={styles.avatarGroup}>
                {props.AssignedWorkers.map((worker, index) => (
                  <OverlayTrigger
                    key={worker.workerId}
                    placement="top"
                    overlay={<Tooltip>{worker.fullName}</Tooltip>}
                  >
                    <img 
                      src={worker.profilePicture || "/images/avatar/NoProfile.png"} 
                      alt={worker.fullName}
                      className={styles.avatar}
                      style={{
                        marginLeft: index > 0 ? '-10px' : '0',
                        zIndex: props.AssignedWorkers.length - index
                      }}
                    />
                  </OverlayTrigger>
                ))}
              </div>
            </span>
          </div>
          <div className={styles.infoItem}>
            <BsGeoAlt className={styles.icon} />
            <span style={{ fontWeight: 600 }}>Location: </span>{props.ServiceLocation}
          </div>
          <div className={styles.infoItem}>
            <BsBuilding className={styles.icon} />
            <span style={{ fontWeight: 600 }}>Customer: </span>{props.Customer}
          </div>
          <div className={styles.infoItem}>
            <BsTools className={styles.icon} />
            <span style={{ fontWeight: 600 }}>Equipment: </span>{props.Equipment}
          </div>
          <div className={styles.infoItem}>
            <BsClock className={styles.icon} />
            <span style={{ fontWeight: 600 }}>Service Call: </span>{props.ServiceCall}
          </div>
        </div>
      );
    
    const footerTemplate = (props) => (
        <div className={styles.quickInfoFooter}>
          <button 
            className={styles.viewDetailsButton}
            onClick={() => router.push(`/dashboard/jobs/${props.Id}`)}
          >
            <span>View Details</span>
            <svg width="34" height="34" viewBox="0 0 74 74" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="37" cy="37" r="35.5" stroke="white" strokeWidth="3"></circle>
              <path d="M25 35.5C24.1716 35.5 23.5 36.1716 23.5 37C23.5 37.8284 24.1716 38.5 25 38.5V35.5ZM49.0607 38.0607C49.6464 37.4749 49.6464 36.5251 49.0607 35.9393L39.5147 26.3934C38.9289 25.8076 37.9792 25.8076 37.3934 26.3934C36.8076 26.9792 36.8076 27.9289 37.3934 28.5147L45.8787 37L37.3934 45.4853C36.8076 46.0711 36.8076 47.0208 37.3934 47.6066C37.9792 48.1924 38.9289 48.1924 39.5147 47.6066L49.0607 38.0607ZM25 38.5L48 38.5V35.5L25 35.5V38.5Z" fill="white"></path>
            </svg>
          </button>
        </div>
    );
    
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

      const handleCellDoubleClick = useCallback((args) => {
        if (args.element.classList.contains('e-work-cells')) {
          const startDate = args.startTime;
          const formattedStartDate = format(startDate, 'yyyy-MM-dd');

          Swal.fire({
            title: 'Create a Job?',
            text: `Are you sure you want to create a new job starting on ${format(startDate, 'MMMM d, yyyy')}?`,
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
                  startDate: formattedStartDate
                }
              });
            }
          });
        }
      }, [router]);

      const calculateDuration = (start, end) => {
        const diffInMilliseconds = new Date(end) - new Date(start);
        const hours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((diffInMilliseconds % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours === 0) {
          return `${minutes}min`;
        } else if (minutes === 0) {
          return `${hours}hr`;
        } else {
          return `${hours}hr ${minutes}min`;
        }
      };

  
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
                eventSettings={{ 
                  dataSource: filteredEvents,
                  fields: {
                    subject: { name: 'Subject' },
                    startTime: { name: 'StartTime' },
                    endTime: { name: 'EndTime' },
                    description: { name: 'Description' },
                    priority: { name: 'Priority' },
                    category: { name: 'Category' },
                    location: { name: 'ServiceLocation' },
                    customer: { name: 'Customer' },
                    equipment: { name: 'Equipment' },
                    serviceCall: { name: 'ServiceCall' }
                  },
                  allowEditing: false,
                  allowAdding: false 
                }}
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
                cellDoubleClick={handleCellDoubleClick}
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
