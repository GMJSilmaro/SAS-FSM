import React, { useEffect, useState, useRef } from "react";
import { getDocs, collection } from "firebase/firestore"; // Firebase Firestore imports
import { db } from "../../firebase"; 
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

import { registerLicense } from "@syncfusion/ej2-base";

registerLicense(process.env.REACT_APP_SYNCFUSION_LICENSE_KEY);

const Calendar = () => {
  const router = useRouter();
  const scheduleObj = useRef(null);
  const [events, setEvents] = useState([]); // Store events from Firebase
  const [searchTerm, setSearchTerm] = useState(""); // Search term state
  const [filteredEvents, setFilteredEvents] = useState([]); // Filtered events

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobsSnapshot = await getDocs(collection(db, "jobs"));
        const jobsData = jobsSnapshot.docs.map((doc) => {
          const job = doc.data();
          return {
            Id: doc.id,
            Subject: job.jobName,
            JobNo: job.jobNo,
            Customer: job.customerName,
            ServiceLocation: job.locationName,
            AssignedWorkers: job.assignedWorkers,
            StartTime: new Date(`${job.startDate}T${job.startTime}`),
            EndTime: new Date(`${job.endDate}T${job.endTime}`),
            JobStatus: job.jobStatus,
            Description: job.description,
          };
        });
        setEvents(jobsData);
        setFilteredEvents(jobsData); // Set both filtered and original events
      } catch (error) {
        console.error("Error fetching jobs from Firebase:", error);
      }
    };

    fetchJobs();
  }, []);

  const intl = new Internationalization();

  const getStatusColor = (status) => {
    switch (status) {
      case "C":
        return { backgroundColor: "#9e9e9e", color: "#fff" }; // Created (Gray)
      case "CO":
        return { backgroundColor: "#2196f3", color: "#fff" }; // Confirmed (Blue)
      case "CA":
        return { backgroundColor: "#f44336", color: "#fff" }; // Cancelled (Red)
      case "JS":
        return { backgroundColor: "#FFA500", color: "#fff" }; // Job Started (Orange)
      case "JC":
        return { backgroundColor: "#32CD32", color: "#fff" }; // Job Complete (Green)
      case "V":
        return { backgroundColor: "#00bcd4", color: "#fff" }; // Validate (Cyan)
      case "S":
        return { backgroundColor: "#607d8b", color: "#fff" }; // Scheduled (Blue Gray)
      default:
        return { backgroundColor: "#9e9e9e", color: "#fff" }; // Default (Gray)
    }
  };

  const headerTemplate = (props) => (
    <div className={styles["quick-info-header"]}>
      <div className={styles["quick-info-header-content"]} style={getStatusColor(props.JobStatus)}>
        <div className={styles["quick-info-title"]}>
          {props.elementType === "cell" ? "Add Job" : "Job Details"}
        </div>
        <div className={styles["duration-text"]}>
          {intl.formatDate(props.StartTime, { type: "date", skeleton: "full" })}{" "}
          ({intl.formatDate(props.StartTime, { skeleton: "hm" })} -{" "}
          {intl.formatDate(props.EndTime, { skeleton: "hm" })})
        </div>
      </div>
    </div>
  );

  const contentTemplate = (props) => (
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
            <BsCalendarCheck /> <strong>Customer:</strong> {props.Customer}
          </div>
          
          <div className={styles["notes-wrap"]}>
            <BsGeoAlt /> <strong>Service Location:</strong> {props.ServiceLocation} 
          </div>
         
          <div className={styles["notes-wrap"]}>
            <BsFillPersonFill /> <strong>Assigned Workers:</strong>{" "}
            {props.AssignedWorkers.join(", ")}
          </div>
          <div className={styles["notes-wrap"]}>
            <strong>Description:</strong> {props.Description}
          </div>
        </div>
      )}
    </div>
  );

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

  const legendItems = [
    { status: "Created", color: getStatusColor("C").backgroundColor },
    { status: "Confirmed", color: getStatusColor("CO").backgroundColor },
    { status: "Cancelled", color: getStatusColor("CA").backgroundColor },
    { status: "Job Started", color: getStatusColor("JS").backgroundColor },
    { status: "Job Complete", color: getStatusColor("JC").backgroundColor },
    { status: "Validate", color: getStatusColor("V").backgroundColor },
    { status: "Scheduled", color: getStatusColor("S").backgroundColor }
  ];

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

  return (
    <div style={{ display: "flex" }}>
      
  
      {/* Left side: Calendar */}
      <div style={{ flex: 8, marginRight: '20px' }}> {/* Increase the flex to 3 */}
      <TextBoxComponent
          placeholder="Search via Job Name, Job Number, Customer, Location..."
          value={searchTerm}
          input={handleSearch} // Syncfusion uses `input` event instead of `onChange`
          cssClass={styles.searchInput}
        />
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
        >
          <ViewsDirective>
            <ViewDirective option="Day" />
            <ViewDirective option="Week" />
            <ViewDirective option="Month" />
          </ViewsDirective>
          <Inject services={[Day, Week, Month, Resize, DragAndDrop]} />
        </ScheduleComponent>
      </div>
  
      {/* Right side: Legend */}
      <div style={{ flex: 1 }}> {/* Decrease the flex to 1 */}
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
  );
  
};

export default Calendar;


// const Calendar = () => {
//   const router = useRouter();
//   const scheduleObj = useRef(null);
//   const [events, setEvents] = useState([]); // Store events from Firebase
//   const [searchTerm, setSearchTerm] = useState(""); // Search term state
//   const [filteredEvents, setFilteredEvents] = useState([]); // Filtered events

//   // useEffect(() => {
//   //   const fetchJobs = async () => {
//   //     try {
//   //       const jobsSnapshot = await getDocs(collection(db, "jobs"));
//   //       const jobsData = jobsSnapshot.docs.map((doc) => {
//   //         const job = doc.data();
//   //         return {
//   //           Id: doc.id,
//   //           Subject: job.jobName,
//   //           JobNo: job.jobNo,
//   //           Customer: job.customerName,
//   //           ServiceLocation: job.locationName,
//   //           AssignedWorkers: job.assignedWorkers,
//   //           StartTime: new Date(`${job.startDate}T${job.startTime}`),
//   //           EndTime: new Date(`${job.endDate}T${job.endTime}`),
//   //           JobStatus: job.jobStatus,
//   //           Description: job.description,
//   //         };
//   //       });
//   //       setEvents(jobsData);
//   //     } catch (error) {
//   //       console.error("Error fetching jobs from Firebase:", error);
//   //     }
//   //   };

//   //   fetchJobs();
//   // }, []);

//   useEffect(() => {
//     const fetchJobs = async () => {
//       try {
//         const jobsSnapshot = await getDocs(collection(db, "jobs"));
//         const jobsData = jobsSnapshot.docs.map((doc) => {
//           const job = doc.data();
//           return {
//             Id: doc.id,
//             Subject: job.jobName,
//             JobNo: job.jobNo,
//             Customer: job.customerName,
//             ServiceLocation: job.locationName,
//             AssignedWorkers: job.assignedWorkers,
//             StartTime: new Date(`${job.startDate}T${job.startTime}`),
//             EndTime: new Date(`${job.endDate}T${job.endTime}`),
//             JobStatus: job.jobStatus,
//             Description: job.description,
//           };
//         });
//         setEvents(jobsData);
//         setFilteredEvents(jobsData); // Set both filtered and original events
//       } catch (error) {
//         console.error("Error fetching jobs from Firebase:", error);
//       }
//     };

//     fetchJobs();
//   }, []);

//   const intl = new Internationalization();

//   const getStatusColor = (status) => {
//     switch (status) {
//       case "C":
//         return { backgroundColor: "#9e9e9e", color: "#fff" }; // Created (Gray)
//       case "CO":
//         return { backgroundColor: "#2196f3", color: "#fff" }; // Confirmed (Blue)
//       case "CA":
//         return { backgroundColor: "#f44336", color: "#fff" }; // Cancelled (Red)
//       case "JS":
//         return { backgroundColor: "#FFA500", color: "#fff" }; // Job Started (Green)
//       case "JC":
//         return { backgroundColor: "#32CD32", color: "#fff" }; // Job Complete (Light Green)
//       case "V":
//         return { backgroundColor: "#00bcd4", color: "#fff" }; // Validate (Cyan)
//       case "S":
//         return { backgroundColor: "#607d8b", color: "#fff" }; // Scheduled (Blue Gray)
//       default:
//         return { backgroundColor: "#9e9e9e", color: "#fff" }; // Default (Gray)
//     }
//   };
  

//   const headerTemplate = (props) => (
//     <div className={styles["quick-info-header"]}>
//       <div className={styles["quick-info-header-content"]} style={getStatusColor(props.JobStatus)}>
//         <div className={styles["quick-info-title"]}>
//           {props.elementType === "cell" ? "Add Job" : "Job Details"}
//         </div>
//         <div className={styles["duration-text"]}>
//           {intl.formatDate(props.StartTime, { type: "date", skeleton: "full" })}{" "}
//           ({intl.formatDate(props.StartTime, { skeleton: "hm" })} -{" "}
//           {intl.formatDate(props.EndTime, { skeleton: "hm" })})
//         </div>
//       </div>
//     </div>
//   );

//   const contentTemplate = (props) => (
//     <div className={styles["quick-info-content"]}>
//       {props.elementType === "cell" ? (
//         <div className="e-cell-content">
//           <div className="content-area">Create a new job...</div>
//         </div>
//       ) : (
//         <div className={styles["event-content"]}>
//           <div className={styles["notes-wrap"]}>
//             <BsCalendarCheck /> <strong>Job No:</strong> {props.JobNo}
//           </div>

//           <div className={styles["notes-wrap"]}>
//             <BsCalendarCheck /> <strong>Job Name:</strong> {props.Subject}
//           </div>

//           <div className={styles["notes-wrap"]}>
//             <BsCalendarCheck /> <strong>Customer:</strong> {props.Customer}
//           </div>
          
//           <div className={styles["notes-wrap"]}>
//             <BsGeoAlt /> <strong>Service Location:</strong> {props.ServiceLocation} 
//           </div>
         
//           <div className={styles["notes-wrap"]}>
//             <BsFillPersonFill /> <strong>Assigned Workers:</strong>{" "}
//             {props.AssignedWorkers.join(", ")}
//           </div>
//           <div className={styles["notes-wrap"]}>
//             <strong>Description:</strong> {props.Description}
//           </div>
//         </div>
//       )}
//     </div>
//   );

// const footerTemplate = (props) => {
//     return (
//       <div className={styles["quick-info-footer"]}>
//         {props.elementType === "cell" ? (
//           <div className="cell-footer">
//             <ButtonComponent id="add" cssClass="e-flat" content="Add" isPrimary={true} />
//           </div>
//         ) : (
//           <div className="event-footer">
//             <ButtonComponent 
//               id="more-details" 
//               cssClass="e-flat" 
//               content="More Details" 
//               isPrimary={true} 
//               onClick={() => router.push(`/dashboard/jobs/${props.Id}`)} // Navigate to dynamic job page
//             />
//           </div>
//         )}
//       </div>
//     );
//   };

  // const onPopupOpen = (args) => {
  //   // Disable the quick info for cell clicks
  //   if (args.type === "QuickInfo" && args.target.classList.contains("e-work-cells")) {
  //     args.cancel = true; // This will hide the quick info popup when a cell is clicked
  //   }
  // };

  // const onCellDoubleClick = (args) => {
  //   args.cancel = true; // This cancels the default editor popup
  //   window.location.href = "/dashboard/jobs/create-jobs"; // Custom redirect action
  // };

  // const onEventDoubleClick = (args) => {
  //   args.cancel = true; // Prevent the default event editor from opening
    
  //   console.log(args.data); // You can access the event details here
  // };
  
  // const handleSearch = (args) => {
  //   const term = args.value.toLowerCase(); // Access value directly from args
  //   setSearchTerm(term);
  //   if (term !== "") {
  //     const filtered = events.filter((event) => {
  //       return (
  //         event.Subject.toLowerCase().includes(term) ||
  //         event.JobNo.toLowerCase().includes(term) ||
  //         event.Customer.toLowerCase().includes(term) ||
  //         event.ServiceLocation.toLowerCase().includes(term)
  //       );
  //     });
  //     setFilteredEvents(filtered);
  //   } else {
  //     setFilteredEvents(events); // Reset to original events if search is cleared
  //   }
  // };
  
//   return (
//     <div>
//   <TextBoxComponent
//         placeholder="Search via Job Name, Job Number, Customer, Location..."
//         value={searchTerm}
//         input={handleSearch} // Syncfusion uses `input` event instead of `onChange`
//         cssClass={styles.searchInput}
//       />

//     <ScheduleComponent
//       ref={scheduleObj}
//       height="650px"
//       style={{ marginTop: '15px' }}
//       selectedDate={new Date(2024, 9, 15)}
//       eventSettings={{ dataSource: filteredEvents }} // Use filtered events
//       eventRendered={(args) => {
//         const colorStyle = getStatusColor(args.data.JobStatus);
//         args.element.style.backgroundColor = colorStyle.backgroundColor;
//         args.element.style.color = colorStyle.color;
//       }}
//       quickInfoTemplates={{
//         header: headerTemplate,
//         content: contentTemplate,
//         footer: footerTemplate,
//       }}
//       popupOpen={onPopupOpen}
//       cellDoubleClick={onCellDoubleClick}
//       eventDoubleClick={onEventDoubleClick}
//       currentView="Month"
//     >
//       <ViewsDirective>
//         <ViewDirective option="Day" />
//         <ViewDirective option="Week" />
//         <ViewDirective option="Month" />
//       </ViewsDirective>
//       <Inject services={[Day, Week, Month, Resize, DragAndDrop]} />
//     </ScheduleComponent>
//   </div>
//   );
// };

// export default Calendar;