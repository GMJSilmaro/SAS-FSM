import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  getDocs,
  collection,
  updateDoc,
  doc,
  setDoc,
  getDoc
} from "firebase/firestore"; // Firebase Firestore imports
import { db } from "../../../../firebase";
import {
  Row,
  Col,
  Card,
  Image,
  OverlayTrigger,
  Tooltip,
  Breadcrumb,
  ListGroup,
  Spinner,
  Dropdown,
} from "react-bootstrap";
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
import {
  BsClock,
  BsFillPersonFill,
  BsGeoAlt,
  BsCalendarCheck,
  BsBuilding,
  BsTools,
  BsX,
  BsThreeDotsVertical,
  BsArrowRepeat,
  BsArrowRight,
} from "react-icons/bs"; // Import icons
import styles from "./calendar.module.css";
import { useRouter } from "next/router";
import truncate from "html-truncate";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import { format } from "date-fns";
import Legend from "./legends";

const DEFAULT_LEGEND_ITEMS = [
  { id: 'created', status: "Created", color: "#9e9e9e" },
  { id: 'confirmed', status: "Confirmed", color: "#2196f3" },
  { id: 'cancelled', status: "Cancelled", color: "#f44336" },
  { id: 'started', status: "Job Started", color: "#FFA500" },
  { id: 'complete', status: "Job Complete", color: "#32CD32" },
  { id: 'validate', status: "Validate", color: "#00bcd4" },
  { id: 'scheduled', status: "Scheduled", color: "#607d8b" }
];

const Calendar = () => {
  const router = useRouter();
  const scheduleObj = useRef(null);
  const [events, setEvents] = useState([]); // Store events from Firebase
  const [searchTerm, setSearchTerm] = useState(""); // Search term state
  const [filteredEvents, setFilteredEvents] = useState([]); // Filtered events
  const [loading, setLoading] = useState(true); // Loading state
  const [legendItems, setLegendItems] = useState(DEFAULT_LEGEND_ITEMS);
  const [editingLegendId, setEditingLegendId] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState(legendItems[0]?.id);

  // Create a stable toast configuration
  const toastConfig = {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light"
  };

  // Create a stable showToast function with useCallback
  const showToast = useCallback((message, type = 'success') => {
    if (!message) return;

    try {
      switch (type) {
        case 'success':
          toast.success(message, toastConfig);
          break;
        case 'error':
          toast.error(message, toastConfig);
          break;
        default:
          toast.info(message, toastConfig);
      }
    } catch (error) {
      console.error('Toast error:', error);
    }
  }, []);

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
            AssignedWorkers: job.assignedWorkers.map((worker) => ({
              workerId: worker.workerId,
              fullName: worker.contact?.contactFullname || worker.workerId,
              profilePicture:
                worker.contact?.profilePicture ||
                "/images/avatar/NoProfile.png",
            })),
            StartTime: new Date(job.startDate),
            EndTime: new Date(job.endDate),
            JobStatus: job.jobStatus,
            Description: job.jobDescription,
            Equipments: job.equipments.map((eq) => eq.itemName).join(", "),
            Priority: job.priority || "",
            Category: job.category || "N/A",
            ServiceCall: job.serviceCallID || "N/A",
            Equipment: job.equipments?.[0]?.itemName || "N/A",
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

  const createJobUpdateNotification = async (jobId, subject, updateType) => {
    const notificationsRef = collection(db, "notifications");
    const querySnapshot = await getDocs(notificationsRef);

    // Generate new notification ID in format 'N-001'
    let latestIdNum = 0;
    querySnapshot.forEach((doc) => {
      const docId = doc.id;
      const match = docId.match(/N-(\d+)/);
      if (match) {
        const idNum = parseInt(match[1]);
        if (idNum > latestIdNum) latestIdNum = idNum;
      }
    });

    latestIdNum += 1;
    const newNotificationId = `N-${String(latestIdNum).padStart(3, "0")}`;
    console.log("Generated Notification ID:", newNotificationId);

    // Notification entry
    const notificationEntry = {
      notificationId: newNotificationId,
      hidden: false,
      jobID: jobId,
      message: `Job ${subject} was updated (${updateType}).`,
      notificationType: "Job Updated",
      timestamp: new Date(),
      read: false,
      userID: "all",
      workerId: "all",
    };

    // Save the notification to Firestore
    const notificationRef = doc(db, "notifications", newNotificationId);
    await setDoc(notificationRef, notificationEntry);
    console.log(`Job update notification added with ID: ${newNotificationId}`);
  };

  const onDragStop = async (args) => {
    const { Id, StartTime, EndTime, Subject } = args.data;
    const currentView = scheduleObj.current.currentView;

    try {
      const jobRef = doc(db, "jobs", Id);
      let updatedStartTime, updatedEndTime;

      if (currentView === "Month") {
        const originalStart = new Date(
          events.find((e) => e.Id === Id).StartTime
        );
        const originalEnd = new Date(events.find((e) => e.Id === Id).EndTime);
        updatedStartTime = new Date(
          StartTime.setHours(
            originalStart.getHours(),
            originalStart.getMinutes()
          )
        );
        updatedEndTime = new Date(
          EndTime.setHours(originalEnd.getHours(), originalEnd.getMinutes())
        );
      } else {
        updatedStartTime = StartTime;
        updatedEndTime = EndTime;
      }

      await updateDoc(jobRef, {
        startDate: updatedStartTime.toISOString(),
        endDate: updatedEndTime.toISOString(),
      });

      const updatedEvents = events.map((event) => {
        if (event.Id === Id) {
          return {
            ...event,
            StartTime: updatedStartTime,
            EndTime: updatedEndTime,
          };
        }
        return event;
      });

      setEvents(updatedEvents);
      setFilteredEvents(
        searchTerm
          ? updatedEvents.filter(
              (event) =>
                event.Subject.toLowerCase().includes(
                  searchTerm.toLowerCase()
                ) ||
                event.JobNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.Customer.toLowerCase().includes(
                  searchTerm.toLowerCase()
                ) ||
                event.ServiceLocation.toLowerCase().includes(
                  searchTerm.toLowerCase()
                )
            )
          : updatedEvents
      );

      scheduleObj.current.refreshEvents();
      showToast(`Job ${Id} ${Subject} updated successfully.`, 'success');

      // Create notification for job update
      await createJobUpdateNotification(Id, Subject, "Drag");
    } catch (error) {
      console.error("Error updating job:", error);
      showToast("Failed to update job. Please try again.", 'error');
      scheduleObj.current.refreshEvents();
    }
  };

  const onResizeStop = async (args) => {
    const { Id, StartTime, EndTime, Subject } = args.data;
    const currentView = scheduleObj.current.currentView;

    try {
      const jobRef = doc(db, "jobs", Id);
      let updatedStartTime, updatedEndTime;

      if (currentView === "Month") {
        const originalStart = new Date(
          events.find((e) => e.Id === Id).StartTime
        );
        const originalEnd = new Date(events.find((e) => e.Id === Id).EndTime);

        updatedStartTime = new Date(
          StartTime.setHours(
            originalStart.getHours(),
            originalStart.getMinutes()
          )
        );
        updatedEndTime = new Date(
          EndTime.setHours(originalEnd.getHours(), originalEnd.getMinutes())
        );
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
      const updatedEvents = events.map((event) =>
        event.Id === Id
          ? { ...event, StartTime: updatedStartTime, EndTime: updatedEndTime }
          : event
      );

      setEvents(updatedEvents);
      setFilteredEvents(
        searchTerm
          ? updatedEvents.filter(
              (event) =>
                event.Subject.toLowerCase().includes(
                  searchTerm.toLowerCase()
                ) ||
                event.JobNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.Customer.toLowerCase().includes(
                  searchTerm.toLowerCase()
                ) ||
                event.ServiceLocation.toLowerCase().includes(
                  searchTerm.toLowerCase()
                )
            )
          : updatedEvents
      );

      // Refresh the schedule component
      scheduleObj.current.refreshEvents();

      // Add notification for resize action
      await createJobUpdateNotification(Id, Subject, "Resize");
      showToast(`Job ${Id} resized successfully.`, 'success');
    } catch (error) {
      console.error("Error updating job:", error);
      showToast("Failed to update job. Please try again.", 'error');
      scheduleObj.current.refreshEvents(); // Revert the resize if there's an error
    }
  };

  const intl = new Internationalization();

  const getStatusColor = (status) => {
    const legendItem = legendItems.find(item => 
      item.status.toLowerCase() === status.toLowerCase()
    );
    return legendItem 
      ? { backgroundColor: legendItem.color, color: '#fff' }
      : { backgroundColor: '#9e9e9e', color: '#fff' };
  };

  const headerTemplate = (props) => (
    <div
      className={styles.quickInfoHeader}
      style={getStatusColor(props.JobStatus)}
    >
      <span className={styles.timeRange}>
        {intl.formatDate(props.StartTime, { skeleton: "hm" })} -{" "}
        {intl.formatDate(props.EndTime, { skeleton: "hm" })}
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
    const tempElement = document.createElement("div");
    tempElement.innerHTML = htmlContent;
    return tempElement.textContent || tempElement.innerText || ""; // Get plain text content
  };

  const contentTemplate = (props) => (
    <div className={styles.quickInfoContent}>
      <div
        className={styles.titleContainer}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 className={styles.eventTitle} style={{ fontWeight: 600 }}>
          {props.Subject}
        </h3>
        <div
          className={styles.statusBadge}
          style={getStatusColor(props.JobStatus)}
        >
          {props.JobStatus}
        </div>
      </div>
      <div className={styles.eventDetails}>
        <span
          className={`${styles.priorityTag} ${
            styles[props.Priority?.toLowerCase()]
          }`}
        >
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
                    marginLeft: index > 0 ? "-10px" : "0",
                    zIndex: props.AssignedWorkers.length - index,
                  }}
                />
              </OverlayTrigger>
            ))}
          </div>
        </span>
      </div>
      <div className={styles.infoItem}>
        <BsGeoAlt className={styles.icon} />
        <span style={{ fontWeight: 600 }}>Location: </span>
        {props.ServiceLocation}
      </div>
      <div className={styles.infoItem}>
        <BsBuilding className={styles.icon} />
        <span style={{ fontWeight: 600 }}>Customer: </span>
        {props.Customer}
      </div>
      <div className={styles.infoItem}>
        <BsTools className={styles.icon} />
        <span style={{ fontWeight: 600 }}>Equipment: </span>
        {props.Equipment}
      </div>
      <div className={styles.infoItem}>
        <BsClock className={styles.icon} />
        <span style={{ fontWeight: 600 }}>Service Call: </span>
        {props.ServiceCall}
      </div>
      <div className={styles.actionButtons}>
        <button
          className={styles.viewDetailsButton}
          onClick={() => handleRepeatJob(props)}
        >
          <span>Repeat Job</span>
          <BsArrowRepeat className={styles.arrowIcon} />
        </button>
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
        <svg
          width="34"
          height="34"
          viewBox="0 0 74 74"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="37"
            cy="37"
            r="35.5"
            stroke="white"
            strokeWidth="3"
          ></circle>
          <path
            d="M25 35.5C24.1716 35.5 23.5 36.1716 23.5 37C23.5 37.8284 24.1716 38.5 25 38.5V35.5ZM49.0607 38.0607C49.6464 37.4749 49.6464 36.5251 49.0607 35.9393L39.5147 26.3934C38.9289 25.8076 37.9792 25.8076 37.3934 26.3934C36.8076 26.9792 36.8076 27.9289 37.3934 28.5147L45.8787 37L37.3934 45.4853C36.8076 46.0711 36.8076 47.0208 37.3934 47.6066C37.9792 48.1924 38.9289 48.1924 39.5147 47.6066L49.0607 38.0607ZM25 38.5L48 38.5V35.5L25 35.5V38.5Z"
            fill="white"
          ></path>
        </svg>
      </button>
    </div>
  );

  const onPopupOpen = (args) => {
    // Disable the quick info for cell clicks
    if (
      args.type === "QuickInfo" &&
      args.target.classList.contains("e-work-cells")
    ) {
      args.cancel = true; // This will hide the quick info popup when a cell is clicked
    }
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

  const handleAddLegend = () => {
    Swal.fire({
      title: 'Add New Status',
      html: `
        <div class="mb-3">
          <label class="form-label">Status Name</label>
          <input 
            id="status" 
            class="form-control" 
            placeholder="Enter status name"
          >
        </div>
        <div class="mb-3">
          <label class="form-label">Color</label>
          <input 
            id="color" 
            class="form-control" 
            type="color" 
            value="#000000"
          >
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Add',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-outline-secondary'
      },
      buttonsStyling: false,
      preConfirm: () => {
        const status = document.getElementById('status').value;
        const color = document.getElementById('color').value;
        if (!status) {
          Swal.showValidationMessage('Please enter a status name');
          return false;
        }
        if (!validateNewStatus(status)) {
          Swal.showValidationMessage('Status name already exists');
          return false;
        }
        return { status, color };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const newId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const newLegendItems = [...legendItems, {
            id: newId,
            status: result.value.status,
            color: result.value.color
          }];
          
          await saveLegendToFirebase(newLegendItems);
          setLegendItems(newLegendItems);
          toast.success('New status added successfully', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        } catch (error) {
          console.error('Error adding new status:', error);
          toast.error('Failed to add new status', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      }
    });
  };

  const handleEditLegend = (item) => {
    Swal.fire({
      title: 'Edit Status',
      html: `
        <div class="mb-3">
          <label class="form-label">Status Name</label>
          <input 
            id="status" 
            class="form-control" 
            value="${item.status}"
            placeholder="Enter status name"
          >
        </div>
        <div class="mb-3">
          <label class="form-label">Color</label>
          <input 
            id="color" 
            class="form-control" 
            type="color" 
            value="${item.color}"
          >
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'btn btn-primary me-2',
        cancelButton: 'btn btn-outline-secondary ms-2',
        actions: 'my-2'
      },
      buttonsStyling: false,
      preConfirm: () => {
        const status = document.getElementById('status').value;
        const color = document.getElementById('color').value;
        if (!status) {
          Swal.showValidationMessage('Please enter a status name');
          return false;
        }
        if (!validateNewStatus(status, item.id)) {
          Swal.showValidationMessage('Status name already exists');
          return false;
        }
        return { status, color };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const newLegendItems = legendItems.map(legend => 
            legend.id === item.id 
              ? { ...legend, status: result.value.status, color: result.value.color }
              : legend
          );
          
          await saveLegendToFirebase(newLegendItems);
          setLegendItems(newLegendItems);
          toast.success('Status updated successfully', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        } catch (error) {
          console.error('Error updating status:', error);
          toast.error('Failed to update status', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      }
    });
  };

  const handleDeleteLegend = (itemId) => {
    Swal.fire({
      title: 'Delete Status?',
      text: 'Are you sure you want to delete this status?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const newLegendItems = legendItems.filter(item => item.id !== itemId);
          await saveLegendToFirebase(newLegendItems);
          setLegendItems(newLegendItems);
          showToast('Status deleted successfully', 'success');
        } catch (error) {
          console.error('Error deleting status:', error);
          showToast('Failed to delete status', 'error');
        }
      }
    });
  };

  const calculateDuration = (start, end) => {
    const diffInMilliseconds = new Date(end) - new Date(start);
    const hours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
    const minutes = Math.floor(
      (diffInMilliseconds % (1000 * 60 * 60)) / (1000 * 60)
    );

    if (hours === 0) {
      return `${minutes}min`;
    } else if (minutes === 0) {
      return `${hours}hr`;
    } else {
      return `${hours}hr ${minutes}min`;
    }
  };

  // Add this function to save legend changes to Firebase
  const saveLegendToFirebase = async (newLegendItems) => {
    try {
      const legendRef = doc(db, 'settings', 'jobStatuses');
      await setDoc(legendRef, { items: newLegendItems }, { merge: true });
      // showToast('Status settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving legend items:', error);
      showToast('Failed to save status settings', 'error');
    }
  };

  const validateNewStatus = (status, currentId = null) => {
    return !legendItems.some(item => 
      item.id !== currentId && 
      item.status.toLowerCase() === status.toLowerCase()
    );
  };

  const handleSetDefault = (itemId) => {
    setDefaultStatus(itemId);
    // You could also save this to Firebase
  };

  const handleCellDoubleClick = useCallback(
    (args) => {
      if (args.element.classList.contains("e-work-cells")) {
        const startDate = args.startTime;
        const formattedStartDate = format(startDate, "yyyy-MM-dd");

        Swal.fire({
          title: "Create a Job?",
          text: `Are you sure you want to create a new job starting on ${format(
            startDate,
            "MMMM d, yyyy"
          )}?`,
          icon: "question",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Yes, create job",
        }).then((result) => {
          if (result.isConfirmed) {
            router.push({
              pathname: "/dashboard/jobs/create-jobs",
              query: {
                startDate: formattedStartDate,
              },
            });
          }
        });
      }
    },
    [router]
  );

  useEffect(() => {
    const fetchLegendItems = async () => {
      try {
        const legendRef = doc(db, 'settings', 'jobStatuses');
        const legendDoc = await getDoc(legendRef);
        
        if (legendDoc.exists()) {
          const data = legendDoc.data();
          setLegendItems(data.items || DEFAULT_LEGEND_ITEMS);
        } else {
          // If no document exists, create it with default items
          await setDoc(legendRef, { items: DEFAULT_LEGEND_ITEMS });
          setLegendItems(DEFAULT_LEGEND_ITEMS);
        }
      } catch (error) {
        console.error('Error loading legend items:', error);
        toast.error('Failed to load status settings', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setLegendItems(DEFAULT_LEGEND_ITEMS);
      }
    };

    fetchLegendItems();
  }, []);

  const handleRepeatJob = async (jobData) => {
    try {
      const { Id, Subject } = jobData;
      
      // First, get the latest job number from the jobs collection
      const jobsSnapshot = await getDocs(collection(db, "jobs"));
      let maxJobNo = 0;

      jobsSnapshot.forEach((doc) => {
        const jobNo = doc.data().jobNo;
        if (jobNo) {
          // Assuming job numbers are in format "JOB-001"
          const numPart = parseInt(jobNo.split('-')[1]);
          if (!isNaN(numPart) && numPart > maxJobNo) {
            maxJobNo = numPart;
          }
        }
      });

      const result = await Swal.fire({
        title: 'Repeat Job',
        html: `
          <div class="swal2-custom-container">
            <div class="form-group mb-3">
              <label class="form-label fw-bold">Frequency</label>
              <select id="frequency" class="form-select">
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div class="form-group mb-3">
              <label class="form-label fw-bold">Number of Occurrences</label>
              <input 
                type="number" 
                id="services" 
                class="form-control" 
                min="1" 
                max="52" 
                value="1"
              >
              <small class="text-muted">Maximum 52 occurrences</small>
            </div>
            <div class="form-group">
              <label class="form-label fw-bold">Select Months (Optional)</label>
              <select id="months" class="form-select" multiple size="6">
                <option value="0">January</option>
                <option value="1">February</option>
                <option value="2">March</option>
                <option value="3">April</option>
                <option value="4">May</option>
                <option value="5">June</option>
                <option value="6">July</option>
                <option value="7">August</option>
                <option value="8">September</option>
                <option value="9">October</option>
                <option value="10">November</option>
                <option value="11">December</option>
              </select>
              <small class="text-muted">Hold Ctrl/Cmd to select multiple</small>
            </div>
          </div>
        `,
        customClass: {
          container: 'swal2-custom',
          popup: 'swal2-custom-popup',
          confirmButton: 'btn btn-primary px-4',
          cancelButton: 'btn btn-outline-secondary'
        },
        showCancelButton: true,
        confirmButtonText: 'Create',
        cancelButtonText: 'Cancel',
        buttonsStyling: false,
        preConfirm: () => {
          const frequency = document.getElementById('frequency').value;
          const services = parseInt(document.getElementById('services').value);
          const monthsSelect = document.getElementById('months');
          const selectedMonths = Array.from(monthsSelect.selectedOptions).map(option => parseInt(option.value));
          
          if (services < 1 || services > 52) {
            Swal.showValidationMessage('Number of occurrences must be between 1 and 52');
            return false;
          }
          
          return { frequency, services, selectedMonths };
        }
      });

      if (result.isConfirmed) {
        try {
          Swal.fire({
            title: 'Creating Jobs',
            html: 'Please wait while we create the repeated jobs...',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });

          const { frequency, services, selectedMonths } = result.value;
          const jobRef = doc(db, "jobs", Id);
          const originalJob = await getDoc(jobRef);
          
          if (!originalJob.exists()) {
            throw new Error('Original job not found');
          }

          const jobDetails = originalJob.data();
          const newDates = calculateRepeatingDates(
            new Date(jobDetails.startDate),
            new Date(jobDetails.endDate),
            frequency,
            services,
            selectedMonths
          );

          // Create new jobs with sequential job numbers
          const creationPromises = newDates.map(async ([startDate, endDate], index) => {
            const newJobNo = `JOB-${String(maxJobNo + index + 1).padStart(3, '0')}`;
            const newJobId = `${Id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Create new job data with modifications
            const newJobData = {
              ...jobDetails,
              jobNo: newJobNo,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              parentJobId: Id,
              isRepeating: true,
              jobStatus: defaultStatus || 'created',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              repeatDetails: {
                originalJobId: Id,
                originalJobNo: jobDetails.jobNo,
                frequency: frequency,
                occurrence: index + 1,
                totalOccurrences: services
              }
            };

            // Remove any existing status-specific fields that shouldn't be copied
            delete newJobData.completedAt;
            delete newJobData.completedBy;
            delete newJobData.startedAt;
            delete newJobData.startedBy;
            delete newJobData.cancelledAt;
            delete newJobData.cancelledBy;
            delete newJobData.validatedAt;
            delete newJobData.validatedBy;

            const newJobRef = doc(db, "jobs", newJobId);
            await setDoc(newJobRef, newJobData);

            return {
              Id: newJobId,
              Subject: jobDetails.jobName,
              JobNo: newJobNo,
              Customer: jobDetails.customerName,
              ServiceLocation: jobDetails.location?.locationName || "",
              AssignedWorkers: jobDetails.assignedWorkers?.map((worker) => ({
                workerId: worker.workerId,
                fullName: worker.contact?.contactFullname || worker.workerId,
                profilePicture: worker.contact?.profilePicture || "/images/avatar/NoProfile.png",
              })) || [],
              StartTime: startDate,
              EndTime: endDate,
              JobStatus: newJobData.jobStatus,
              Description: jobDetails.jobDescription,
              Priority: jobDetails.priority || "",
              Category: jobDetails.category || "N/A",
              ServiceCall: jobDetails.serviceCallID || "N/A",
              Equipment: jobDetails.equipments?.[0]?.itemName || "N/A",
            };
          });

          const newJobsData = await Promise.all(creationPromises);

          // Update the events state
          const updatedEvents = [...events, ...newJobsData];
          setEvents(updatedEvents);
          setFilteredEvents(
            searchTerm
              ? updatedEvents.filter(event =>
                  event.Subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  event.JobNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  event.Customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  event.ServiceLocation.toLowerCase().includes(searchTerm.toLowerCase())
                )
              : updatedEvents
          );

          Swal.close();
          showToast(`Successfully created ${newDates.length} repeated jobs`, 'success');

          if (scheduleObj.current) {
            scheduleObj.current.refreshEvents();
          }

        } catch (error) {
          console.error('Error in job creation:', error);
          Swal.close();
          showToast(`Failed to create repeated jobs: ${error.message}`, 'error');
        }
      }
    } catch (error) {
      console.error('Error in repeat job dialog:', error);
      Swal.close();
      showToast('Failed to open repeat job dialog', 'error');
    }
  };

  const calculateRepeatingDates = (startDate, endDate, frequency, services, selectedMonths) => {
    const dates = [];
    const duration = endDate - startDate;
    let currentDate = new Date(startDate);

    const getNextDate = (current) => {
      const next = new Date(current);
      switch (frequency) {
        case 'weekly':
          next.setDate(next.getDate() + 7);
          break;
        case 'biweekly':
          next.setDate(next.getDate() + 14);
          break;
        case 'monthly':
          next.setMonth(next.getMonth() + 1);
          break;
        case 'quarterly':
          next.setMonth(next.getMonth() + 3);
          break;
        case 'yearly':
          next.setFullYear(next.getFullYear() + 1);
          break;
      }
      return next;
    };

    for (let i = 0; i < services; i++) {
      if (selectedMonths.length > 0) {
        // If specific months are selected, find the next valid month
        while (!selectedMonths.includes(currentDate.getMonth())) {
          currentDate = getNextDate(currentDate);
        }
      }

      const newEndDate = new Date(currentDate.getTime() + duration);
      dates.push([new Date(currentDate), newEndDate]);
      currentDate = getNextDate(currentDate);
    }

    return dates;
  };

  useEffect(() => {
    // Component mount
    return () => {
      // Component cleanup
      toast.dismiss(); // Dismiss all toasts when component unmounts
    };
  }, []);

  return (
    <>
      <ToastContainer
        enableMultiContainer={false}
        containerId="main-toaster"
        limit={3}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="light"
      />
      
      <h1 className="mb-1 h2 fw-bold">Jobs Calendar</h1>

      <Breadcrumb>
        <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active href="/dashboard/scheduling/jobs/current">
          Calendar
        </Breadcrumb.Item>
      </Breadcrumb>
      <div style={{ 
        display: "flex", 
        marginTop: "10px", 
        width: "100%",  // Changed from 95%
        marginRight: "20px" 
      }}>
        {/* Left side: Calendar */}
        <div style={{ flex: 8, marginRight: "20px" }}>
        <TextBoxComponent 
      placeholder="Search via Job Name, Job Number, Customer, Location..."
      cssClass="e-bigger" // Makes the component larger
      floatLabelType="Auto"
      value={searchTerm}
      input={handleSearch}
      htmlAttributes={{
        style: {
          width: '100%',
          fontSize: '16px',
          padding: '12px',
          height: '48px'  // Increased height
        }
      }}
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
              style={{ marginTop: "15px" }}
              width="100%"
              selectedDate={new Date()}
              eventSettings={{
                dataSource: filteredEvents,
                fields: {
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
                },
                allowEditing: false,
                allowAdding: false,
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

       
      {/* Right side: Legend - update styles */}
  <div style={{ 
    flex: 1,
    minWidth: "250px",
    maxWidth: "300px", 
    height: '650px',
    display: 'flex',
    flexDirection: 'column',
    marginRight: "5px" // Add right margin to prevent sticking to edge
  }}>
    <Legend
      legendItems={legendItems}
      defaultStatus={defaultStatus}
      onAddLegend={handleAddLegend}
      onEditLegend={handleEditLegend}
      onDeleteLegend={handleDeleteLegend}
      onSetDefault={handleSetDefault}
    />
  </div>
        {/* <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4>Legend</h4>
            <button 
              className="btn btn-sm btn-primary"
              onClick={handleAddLegend}
            >
              Add Status
            </button>
          </div>
          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {legendItems.map((item) => (
              <li 
                key={item.id} 
                style={{ 
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                  '&:hover': {
                    backgroundColor: '#f5f5f5'
                  }
                }}
              >
                <OverlayTrigger
                  placement="left"
                  overlay={
                    <Tooltip>
                      Click for options
                    </Tooltip>
                  }
                >
                  <div 
                    style={{ 
                      display: "flex", 
                      alignItems: "center",
                      flex: 1 
                    }}
                    onClick={() => handleEditLegend(item)}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: "20px",
                        height: "20px",
                        backgroundColor: item.color,
                        marginRight: "10px",
                        borderRadius: "4px"
                      }}
                    ></span>
                    <span style={{ flex: 1 }}>{item.status}</span>
                  </div>
                </OverlayTrigger>
                
                <Dropdown align="end">
                  <Dropdown.Toggle 
                    variant="link" 
                    size="sm"
                    style={{ 
                      border: 'none', 
                      padding: '4px',
                      background: 'transparent',
                      color: '#6c757d'
                    }}
                  >
                    <BsThreeDotsVertical />
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => handleEditLegend(item)}>
                      Edit
                    </Dropdown.Item>
                    <Dropdown.Item 
                      onClick={() => handleSetDefault(item.id)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      Set as Default
                      {defaultStatus === item.id && (
                        <span style={{ color: '#28a745' }}>✓</span>
                      )}
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item 
                      onClick={() => handleDeleteLegend(item.id)}
                      className="text-danger"
                    >
                      Delete
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </li>
            ))}
          </ul>
        </div> */}

        
      </div>
    </>
  );
};

export default Calendar;
