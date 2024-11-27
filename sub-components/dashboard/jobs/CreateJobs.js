"use client";

import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  InputGroup,
  Tabs,
  Tab,
} from "react-bootstrap";
import Select from "react-select";
import EquipmentsTable from "pages/dashboard/tables/datatable-equipments";
import { db } from "../../../firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  setDoc,
  doc,
  Timestamp,
  getDoc,
  where,
} from "firebase/firestore";
import Swal from "sweetalert2";
import styles from "./CreateJobs.module.css";
import toast from "react-hot-toast";
import JobTask from "./tabs/JobTasklist";
import { useRouter } from "next/router";
import { FlatPickr, FormSelect, DropFiles, ReactQuillEditor } from "widgets";
import { getAuth } from "firebase/auth";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { FaAsterisk } from "react-icons/fa";

// Add this helper function at the top of your file
const sanitizeDataForFirestore = (data) => {
  // Remove undefined values and convert null to empty strings
  const sanitized = {};

  Object.keys(data).forEach((key) => {
    const value = data[key];

    if (value === undefined) {
      return; // Skip undefined values
    }

    if (value === null) {
      sanitized[key] = ""; // Convert null to empty string
    } else if (Array.isArray(value)) {
      // Sanitize arrays
      sanitized[key] = value
        .map((item) => {
          if (typeof item === "object") {
            return sanitizeDataForFirestore(item);
          }
          return item ?? "";
        })
        .filter((item) => item !== undefined);
    } else if (value instanceof Date) {
      // Convert Date objects to Firestore Timestamp
      sanitized[key] = Timestamp.fromDate(value);
    } else if (typeof value === "object" && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeDataForFirestore(value);
    } else {
      sanitized[key] = value;
    }
  });

  return sanitized;
};

// Add this helper function near the top of your file
const formatContactData = (contactData) => {
  if (!contactData) return {};
  
  const fullName = `${contactData.firstName || ""} ${
    contactData.middleName || ""
  } ${contactData.lastName || ""}`.trim();

  return {
    contactID: contactData.value || contactData.contactID || "",
    contactFullname: fullName,
    firstName: contactData.firstName || "",
    middleName: contactData.middleName || "",
    lastName: contactData.lastName || "",
    phoneNumber: contactData.tel1 || contactData.phoneNumber || "",
    mobilePhone: contactData.tel2 || contactData.mobilePhone || "",
    email: contactData.email || "",
  };
};

const generateBaseJobNo = async () => {
  try {
    // Get the current year
    const year = new Date().getFullYear();
    
    // Query Firestore to get the latest job number for this year
    const jobsRef = collection(db, "jobs");
    const q = query(
      jobsRef,
      where("jobNo", ">=", `${year}-000001`),
      where("jobNo", "<=", `${year}-999999`),
      orderBy("jobNo", "desc"),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    let nextNumber = 1;
    
    if (!snapshot.empty) {
      // Extract the number from the latest job number
      const latestJobNo = snapshot.docs[0].data().jobNo;
      const [yearPrefix, number] = latestJobNo.split('-');
      
      // If it's a new year, start from 1, otherwise increment
      if (yearPrefix === year.toString()) {
        nextNumber = parseInt(number) + 1;
      }
    }
    
    // Format the job number with leading zeros (6 digits)
    const formattedNumber = nextNumber.toString().padStart(6, '0');
    
    const newJobNo = `${year}-${formattedNumber}`;
    //// console.log("Generated job number:", newJobNo);
    return newJobNo;
  } catch (error) {
    console.error("Error generating job number:", error);
    throw new Error("Failed to generate job number");
  }
};


const generateRepeatJobNo = (baseJobNo, sequence) => {
  return `${baseJobNo}-${sequence.toString().padStart(3, '0')}`;
};

const generateRepeatGroupId = () => {
  return `R${Date.now()}`;
};

const AddNewJobs = ({ validateJobForm }) => {
  const router = useRouter();
  const { startDate, endDate, startTime, endTime, workerId, scheduleSession } =
    router.query;

  useEffect(() => {
    if (router.isReady) {
      let updatedFormData = { ...formData };

      if (startDate) {
        updatedFormData.startDate = startDate;
      }

      if (endDate) {
        updatedFormData.endDate = endDate;
      }

      if (startTime) {
        updatedFormData.startTime = startTime;
      }

      if (endTime) {
        updatedFormData.endTime = endTime;
      }

      if (scheduleSession) {
        updatedFormData.scheduleSession = scheduleSession;
      }

      setFormData(updatedFormData);

      // Handle worker selection if workerId is provided
      if (workerId) {
        const selectedWorker = workers.find(
          (worker) => worker.value === workerId
        );
        if (selectedWorker) {
          setSelectedWorkers([selectedWorker]);
        }
      }
    }
  }, [
    router.isReady,
    startDate,
    endDate,
    startTime,
    endTime,
    workerId,
    scheduleSession,
  ]);

  const timestamp = Timestamp.now();

  const [schedulingWindows, setSchedulingWindows] = useState([]); // State for scheduling windows

  const [workers, setWorkers] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [tasks, setTasks] = useState([]); // Initialize tasks

  const [serviceCalls, setServiceCalls] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [selectedServiceCall, setSelectedServiceCall] = useState(null);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [jobContactTypes, setJobContactTypes] = useState([]);
  const [selectedJobContactType, setSelectedJobContactType] = useState(null);
  const [formData, setFormData] = useState({
    jobID: "", // unique
    jobNo: "",
    jobName: "",
    jobDescription: "",
    serviceCallID: "",
    salesOrderID: "",
    customerID: "",
    customerName: "",
    contact: {
      contactID: "",
      contactFullname: "",
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      mobilePhone: "",
      phoneNumber: "",
      notification: {
        notifyCustomer: false, // Default false, can be updated based on user input
      },
    },
    assignedWorkers: {}, // Empty object, will be filled when workers are assigned
    jobStatus: "", // Should be populated later, e.g., Work in Progress, Completed, etc.
    priority: "", // Low, Medium, High, or any other predefined statuses
    startDate: "", // Initialize as empty string instead of null
    endDate: "", // Initialize as empty string instead of null
    startTime: "", // Will be a string representing the time, e.g., '09:00'
    endTime: "", // Will be a string representing the time, e.g., '17:00'
    scheduleSession: "",
    estimatedDurationHours: "",
    estimatedDurationMinutes: "",
    location: {
      locationName: "",
      address: {
        streetNo: "",
        streetAddress: "",
        block: "",
        buildingNo: "",
        city: "",
        stateProvince: "",
        postalCode: "",
      },
      coordinates: {
        latitude: "", // Initialize as empty string instead of null
        longitude: "", // Initialize as empty string instead of null
      },
    },
    taskList: [
      {
        taskID: "", // Will be generated or populated
        taskName: "",
        taskDescription: "",
        assignedTo: "", // Will store worker ID or name
        isPriority: false, // Default false, can be updated later
        isDone: false, // Default false, can be updated when completed
        completionDate: "", // Initialize as empty string instead of null
      },
    ],
    equipments: [
      {
        ItemCode: "",
        itemName: "",
        itemGroup: "",
        brand: "",
        equipmentLocation: "",
        equipmentType: "",
        modelSeries: "",
        serialNo: "",
        notes: "",
        warrantyStartDate: "", // Initialize as empty string instead of null
        warrantyEndDate: "", // Initialize as empty string instead of null
      },
    ],
    customerSignature: {
      signatureURL: "", // URL for the signature image
      signedBy: "",
      signatureTimestamp: "", // Initialize as empty string instead of null
    },
    jobContactType: {
      code: "",
      name: "",
    },
    createdBy: {
      workerId: "",
      fullName: "",
      timestamp: "",
    },
  });
  const initialFormData = {
    jobID: "", // unique
    jobNo: "",
    jobName: "",
    jobDescription: "",
    serviceCallID: "",
    salesOrderID: "",
    customerID: "",
    customerName: "",
    contact: {
      contactID: "",
      contactFullname: "",
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      mobilePhone: "",
      phoneNumber: "",
      notification: {
        notifyCustomer: false, // Default false, can be updated based on user input
      },
    },
    assignedWorkers: {}, // Empty object, will be filled when workers are assigned
    jobStatus: "Created", // Should be populated later, e.g., Work in Progress, Completed, etc.
    priority: "", // Low, Medium, High, or any other predefined statuses
    startDate: "", // Initialize as empty string instead of null
    endDate: "", // Initialize as empty string instead of null
    startTime: "", // Will be a string representing the time, e.g., '09:00'
    endTime: "", // Will be a string representing the time, e.g., '17:00'
    scheduleSession: "",
    estimatedDurationHours: "",
    estimatedDurationMinutes: "",
    location: {
      locationName: "",
      address: {
        streetNo: "",
        streetAddress: "",
        block: "",
        buildingNo: "",
        city: "",
        stateProvince: "",
        postalCode: "",
      },
      coordinates: {
        latitude: "", // Initialize as empty string instead of null
        longitude: "", // Initialize as empty string instead of null
      },
    },
    taskList: [
      {
        taskID: "", // Will be generated or populated
        taskName: "",
        taskDescription: "",
        assignedTo: "", // Will store worker ID or name
        isPriority: false, // Default false, can be updated later
        isDone: false, // Default false, can be updated when completed
        completionDate: "", // Initialize as empty string instead of null
      },
    ],
    equipments: [
      {
        ItemCode: "",
        itemName: "",
        itemGroup: "",
        brand: "",
        equipmentLocation: "",
        equipmentType: "",
        modelSeries: "",
        serialNo: "",
        notes: "",
        warrantyStartDate: "", // Initialize as empty string instead of null
        warrantyEndDate: "", // Initialize as empty string instead of null
      },
    ],
    customerSignature: {
      signatureURL: "", // URL for the signature image
      signedBy: "",
      signatureTimestamp: "", // Initialize as empty string instead of null
    },
    jobContactType: {
      code: "",
      name: "",
    },
    createdBy: {
      workerId: "",
      fullName: "",
      timestamp: "",
    },
  };

  const [showServiceLocation, setShowServiceLocation] = useState(true);
  const [showEquipments, setShowEquipments] = useState(true);
  const [jobNo, setJobNo] = useState("Loading...");
  const [validated, setValidated] = useState(false);
  const [activeKey, setActiveKey] = useState("summary");
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRY_ATTEMPTS = 3;

  const [currentUser, setCurrentUser] = useState({
    workerId: "",
    fullName: "",
    uid: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Add new state for repeat settings
  const [repeatSettings, setRepeatSettings] = useState({
    isRepeat: false,
    frequency: 'none', // none, daily, weekly, monthly
    interval: 1,
    weekDays: [], // For weekly frequency
    monthDay: 1, // For monthly frequency
    endDate: '', // Optional end date for repetition
    occurrences: '', // Optional number of occurrences
    endType: 'never' // never, date, occurrences
  });

  // Add repeat options
  const repeatFrequencyOptions = [
    { value: 'none', label: 'Do not repeat' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const weekDayOptions = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  useEffect(() => {
    const getCurrentUserInfo = async () => {
      try {
        // Fetch user info from the existing endpoint
        const response = await fetch("/api/getUserInfo");

        if (!response.ok) {
          throw new Error("Failed to fetch user info");
        }

        const { user } = await response.json();

       // // console.log("Fetched user data:", user);

        if (!user.workerId) {
          throw new Error("Worker ID not found in user data");
        }

        // Set the current user data with actual full name from Firestore
        setCurrentUser({
          workerId: user.workerId,
          fullName: user.name || "anonymous",
          uid: user.uid || "",
        });

        //toast.success("User information loaded successfully");
      } catch (error) {
        console.error("Error getting user info:", error);
        toast.error("Unable to get user information. Using default values.");
        setCurrentUser({
          workerId: "unknown",
          fullName: "anonymous",
          uid: "",
        });
      }
    };

    getCurrentUserInfo();
  }, []);

  const fetchSchedulingWindows = async () => {
    try {
      const schedulingWindowsRef = collection(db, "schedulingWindows");
      const querySnapshot = await getDocs(schedulingWindowsRef);

      const windows = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        label: doc.data().label,
        timeStart: doc.data().timeStart, // Keep time in 24-hour format for storage and display
        timeEnd: doc.data().timeEnd, // Keep time in 24-hour format for storage and display
        isPublic: doc.data().isPublic,
      }));

      // Sort windows by timeStart in ascending order
      windows.sort((a, b) => {
        const [aHours, aMinutes] = a.timeStart.split(":").map(Number);
        const [bHours, bMinutes] = b.timeStart.split(":").map(Number);
        return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
      });

      setSchedulingWindows(windows); // Use the windows directly without formatting
    } catch (error) {
      console.error("Error fetching scheduling windows:", error);
    }
  };

  const fetchJobContactTypes = async () => {
    try {
      const jobContactTypeResponse = await fetch("/api/getJobContactType", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!jobContactTypeResponse.ok) {
        const errorData = await jobContactTypeResponse.json();
        throw new Error(
          `Failed to fetch job contact types: ${
            errorData.message || jobContactTypeResponse.statusText
          }`
        );
      }

      const jobContactTypeData = await jobContactTypeResponse.json();

      const formattedJobContactTypes = jobContactTypeData.map((item) => ({
        value: item.code,
        label: item.name,
      }));

      setJobContactTypes(formattedJobContactTypes);
    } catch (error) {
      console.error("Error fetching job contact types:", error);
      toast.error(`Failed to fetch job contact types: ${error.message}`);
      setJobContactTypes([]);
    }
  };

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      // Show loading toast while fetching
      toast.loading("Fetching customers...", { id: "customersFetch" });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("/api/getCustomers", {
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format: Expected JSON");
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid data format: Expected array");
      }

      const formattedOptions = data.map((item) => ({
        value: item.cardCode,
        label: `${item.cardCode} - ${item.cardName}`, // Keep combined display label
        cardCode: item.cardCode, // Add separate cardCode
        cardName: item.cardName, // Add separate cardName
      }));

      setCustomers(formattedOptions);
      setIsLoading(false);
      setRetryCount(0);
      toast.dismiss("customersFetch");

      if (formattedOptions.length === 0) {
        toast("No customers found in the database", {
          icon: "⚠️",
          duration: 5000,
          style: {
            background: "#fff",
            color: "#856404",
            padding: "16px",
            borderLeft: "6px solid #ffc107",
            borderRadius: "4px",
          },
        });
      } else {
        toast.success(
          `Successfully loaded ${formattedOptions.length} customers`,
          {
            duration: 5000,
            style: {
              background: "#fff",
              color: "#28a745",
              padding: "16px",
              borderLeft: "6px solid #28a745",
              borderRadius: "4px",
            },
            iconTheme: {
              primary: "#28a745",
              secondary: "#fff",
            },
          }
        );
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
      setIsLoading(false);
      toast.dismiss("customersFetch");

      if (error.name === "AbortError") {
        toast.error("Request timed out. Retrying...", {
          duration: 3000,
          style: {
            background: "#fff",
            color: "#dc3545",
            padding: "16px",
            borderLeft: "6px solid #dc3545",
            borderRadius: "4px",
          },
        });
      } else {
        toast.error(`Failed to fetch customers: ${error.message}`, {
          duration: 5000,
          style: {
            background: "#fff",
            color: "#dc3545",
            padding: "16px",
            borderLeft: "6px solid #dc3545",
            borderRadius: "4px",
          },
          iconTheme: {
            primary: "#dc3545",
            secondary: "#fff",
          },
        });
      }

      if (retryCount < MAX_RETRY_ATTEMPTS) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        toast.error(`Retrying in ${retryDelay / 1000} seconds...`, {
          duration: retryDelay,
          style: {
            background: "#fff",
            color: "#dc3545",
            padding: "16px",
            borderLeft: "6px solid #dc3545",
            borderRadius: "4px",
          },
        });

        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          fetchCustomers();
        }, retryDelay);
      } else {
        toast.error(
          "Maximum retry attempts reached. Please refresh the page.",
          {
            duration: 5000,
            style: {
              background: "#fff",
              color: "#dc3545",
              padding: "16px",
              borderLeft: "6px solid #dc3545",
              borderRadius: "4px",
            },
          }
        );

        // Reset retry count after max attempts
        setRetryCount(0);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      if (isMounted) {
        await fetchSchedulingWindows();

        if (isMounted) {
          await fetchCustomers(); // Remove the toast from here
        }

        if (isMounted) {
          await fetchJobContactTypes();
        }
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, [retryCount]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, "users");

        // Add the role filter to the query
        const usersQuery = query(
          usersCollection,
          where("role", "==", "Worker") // Only get users where role is "Worker"
        );

        const usersSnapshot = await getDocs(usersQuery);
        const usersList = usersSnapshot.docs.map((doc) => ({
          value: doc.id,
          label: doc.data().firstName + " " + doc.data().lastName,
          workerId: doc.data().workerId,
        }));
        setWorkers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const formatDateTime = (date, time) => {
    return `${date}T${time}:00`; // Combining date and time
  };

  // Function to format duration to required format
  const formatDuration = (hours, minutes) => {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:00`;
  };

  useEffect(() => {
    const fetchLastJobNo = async () => {
      try {
        const jobsRef = collection(db, "jobs");
        const q = query(jobsRef, orderBy("jobNo", "desc"), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const lastJob = querySnapshot.docs[0].data();
          const lastJobNo = parseInt(lastJob.jobNo, 10);
          setJobNo((lastJobNo + 1).toString().padStart(6, "0"));
        } else {
          setJobNo("000001"); // Start from 000001 if no jobs exist
        }
      } catch (error) {
        console.error("Error fetching last Job No:", error);
      }
    };

    fetchLastJobNo();
  }, []);

  // Task Management Functions
  const addTask = () => {
    setTasks((prevTasks) => [
      ...prevTasks,
      {
        taskID: `task-${prevTasks.length + 1}`,
        taskName: "",
        taskDescription: "",
        assignedTo: "",
        isPriority: false,
        isDone: false,
        completionDate: null,
      },
    ]);
  };

  const fetchCoordinates = async (locationName) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const encodedLocation = encodeURIComponent(locationName);

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedLocation}&key=${apiKey}`
    );

    const data = await response.json();
    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    } else {
      throw new Error("Location not found");
    }
  };

  // Handle ReactQuill change event for the job description
  const handleDescriptionChange = (htmlContent) => {
    //// console.log("Updated description (HTML):", htmlContent); // Debugging
    setFormData((prevState) => ({
      ...prevState,
      jobDescription: htmlContent, // Store the HTML content
    }));
  };

  // Function to handle task field change
  const handleTaskChange = (index, field, value) => {
    const updatedTasks = [...tasks];
    updatedTasks[index][field] = value;
    setTasks(updatedTasks);
  };

  // Function to handle checkbox change for priority and completion status
  const handleCheckboxChange = (index, field) => {
    const updatedTasks = [...tasks];
    updatedTasks[index][field] = !updatedTasks[index][field];
    setTasks(updatedTasks);
  };

  // Function to delete a task
  const deleteTask = (index) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);
  };

  const handleWorkersChange = (selectedOptions) => {
    setSelectedWorkers(selectedOptions);
  };

  const handleCustomerChange = async (selectedOption) => {
    //// console.log("handleCustomerChange called with:", selectedOption);

    setSelectedContact(null);
    setSelectedLocation(null);
    setSelectedCustomer(selectedOption);
    setSelectedServiceCall(null);
    setSelectedSalesOrder(null);

    const selectedCustomer = customers.find(
      (option) => option.value === selectedOption.value
    );

    //// console.log("Selected customer:", selectedCustomer);

    setFormData((prevFormData) => ({
      ...prevFormData,
      customerID: selectedCustomer ? selectedCustomer.cardCode : "", // Use separate cardCode
      customerName: selectedCustomer ? selectedCustomer.cardName : "", // Use separate cardName
    }));

    // Fetch related data for the selected customer
    try {
     // // console.log("Fetching related data for customer:", selectedOption.value);

      // Fetch contacts for the customer
      const contactsResponse = await fetch("/api/getContacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardCode: selectedOption.value }),
      });

      if (!contactsResponse.ok) {
        throw new Error("Failed to fetch contacts");
      }

      const contactsData = await contactsResponse.json();
    //  // console.log("Fetched contacts:", contactsData);

      const formattedContacts = contactsData.map((item) => ({
        value: item.contactId,
        label: item.contactId,
        ...item,
      }));
      setContacts(formattedContacts);

      if (formattedContacts.length === 0) {
        toast("No contacts found for this customer.", {
          icon: "⚠️",
          duration: 5000,
          style: {
            background: "#fff",
            color: "#856404",
            padding: "16px",
            borderLeft: "6px solid #ffc107",
          },
        });
      } else {
        toast.success(
          `Successfully fetched ${formattedContacts.length} contacts.`,
          {
            duration: 5000,
            style: {
              background: "#fff",
              color: "#28a745",
              padding: "16px",
              borderLeft: "6px solid #28a745",
            },
            iconTheme: {
              primary: "#28a745",
              secondary: "#fff",
            },
          }
        );
      }

      // Fetch locations for the customer
      const locationsResponse = await fetch("/api/getLocation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardCode: selectedOption.value }),
      });

      if (!locationsResponse.ok) {
        throw new Error("Failed to fetch locations");
      }

      const locationsData = await locationsResponse.json();
      //// console.log("Fetched locations:", locationsData);

      // Format locations with more detailed information
      const formattedLocations = locationsData
        .sort((a, b) => {
          // Sort by addressType ('B' comes before 'S')
          if (a.addressType === "B" && b.addressType === "S") return -1;
          if (a.addressType === "S" && b.addressType === "B") return 1;
          return a.address.localeCompare(b.address);
        })
        .map((item) => ({
          value: item.siteId,
          label: (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontWeight: "bold" }}>
                {item.building ? `${item.building} - ` : ""}
                {item.address}
              </div>
              <div style={{ fontSize: "0.85em", color: "#666" }}>
                {[item.city, item.stateProvince, item.zipCode, item.countryName]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            </div>
          ),
          subLabel: `${item.city}, ${item.stateProvince} ${item.zipCode}`,
          addressType: item.addressType,
          ...item,
        }));

      const groupedLocations = [
        {
          label: "Billing Addresses",
          options: formattedLocations.filter((loc) => loc.addressType === "B"),
        },
        {
          label: "Shipping Addresses",
          options: formattedLocations.filter((loc) => loc.addressType === "S"),
        },
      ];

      setLocations(groupedLocations);

      if (formattedLocations.length === 0) {
        toast("No locations found for this customer.", {
          icon: "⚠️",
          duration: 5000,
          style: {
            background: "#fff",
            color: "#856404",
            padding: "16px",
            borderLeft: "6px solid #ffc107",
          },
        });
      } else {
        toast.success(
          `Successfully fetched ${formattedLocations.length} locations.`,
          {
            duration: 5000,
            style: {
              background: "#fff",
              color: "#28a745",
              padding: "16px",
              borderLeft: "6px solid #28a745",
            },
            iconTheme: {
              primary: "#28a745",
              secondary: "#fff",
            },
          }
        );
      }

      // Fetch equipments for the customer
      const equipmentsResponse = await fetch("/api/getEquipments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardCode: selectedOption.value }),
      });

      if (!equipmentsResponse.ok) {
        throw new Error("Failed to fetch equipments");
      }

      const equipmentsData = await equipmentsResponse.json();
      // // console.log("Fetched equipments:", equipmentsData);

      const formattedEquipments = equipmentsData.map((item) => ({
        value: item.ItemCode,
        label: item.ItemCode,
        ...item,
      }));
      setEquipments(formattedEquipments);

      if (formattedEquipments.length === 0) {
        toast("No equipments found for this customer.", {
          icon: "⚠️",
          duration: 5000,
          style: {
            background: "#fff",
            color: "#856404",
            padding: "16px",
            borderLeft: "6px solid #ffc107",
          },
        });
      } else {
        toast.success(
          `Successfully fetched ${formattedEquipments.length} equipments.`,
          {
            duration: 5000,
            style: {
              background: "#fff",
              color: "#28a745",
              padding: "16px",
              borderLeft: "6px solid #28a745",
            },
            iconTheme: {
              primary: "#28a745",
              secondary: "#fff",
            },
          }
        );
      }

      // Fetch service calls for the customer
      const serviceCallResponse = await fetch("/api/getServiceCall", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardCode: selectedOption.value }),
      });

      if (!serviceCallResponse.ok) {
        throw new Error("Failed to fetch service calls");
      }

      const serviceCallsData = await serviceCallResponse.json();
      // // console.log("Fetched service calls:", serviceCallsData);

      const formattedServiceCalls = serviceCallsData.map((item) => ({
        value: item.serviceCallID,
        label: item.serviceCallID + " - " + item.subject,
      }));
      setServiceCalls(formattedServiceCalls);

      if (formattedServiceCalls.length === 0) {
        toast("No service calls found for this customer.", {
          icon: "⚠️",
          duration: 5000,
          style: {
            background: "#fff",
            color: "#856404",
            padding: "16px",
            borderLeft: "6px solid #ffc107",
          },
        });
      } else {
        toast.success(
          `Successfully fetched ${formattedServiceCalls.length} service calls.`,
          {
            duration: 5000,
            style: {
              background: "#fff",
              color: "#28a745",
              padding: "16px",
              borderLeft: "6px solid #28a745",
            },
            iconTheme: {
              primary: "#28a745",
              secondary: "#fff",
            },
          }
        );
      }

      // Clear sales orders when customer changes
      setSalesOrders([]);
    } catch (error) {
      console.error("Error in handleCustomerChange:", error);
      toast.error(`Error: ${error.message}`, {
        duration: 5000,
        style: {
          background: "#fff",
          color: "#dc3545",
          padding: "16px",
          borderLeft: "6px solid #dc3545",
        },
        iconTheme: {
          primary: "#dc3545",
          secondary: "#fff",
        },
      });
      setContacts([]);
      setLocations([]);
      setEquipments([]);
      setServiceCalls([]);
      setSalesOrders([]);
    }
  };

  const handleJobContactTypeChange = (selectedOption) => {
    setSelectedJobContactType(selectedOption);

    setFormData((prevData) => ({
      ...prevData,
      jobContactType: {
        code: selectedOption ? selectedOption.value : "",
        name: selectedOption ? selectedOption.label : "",
      },
    }));
  };

  const handleContactChange = (selectedOption) => {
    if (!selectedOption) return;

    setFormData((prevFormData) => ({
      ...prevFormData,
      contact: formatContactData(selectedOption)
    }));

    setSelectedContact(selectedOption);
  };

  const handleLocationChange = async (selectedOption) => {
    // console.log("Selected Location:", selectedOption); // For debugging

    // Find the selected location from the flattened options
    const selectedLocation = selectedOption;

    setSelectedLocation(selectedLocation);

    // Update nested `location` and `address` in `formData`
    setFormData((prevFormData) => ({
      ...prevFormData,
      location: {
        ...prevFormData.location,
        locationName: selectedLocation.address || "", // Changed from label
        addressType: selectedLocation.addressType || "", // Added addressType
        address: {
          ...prevFormData.location.address,
          streetNo: selectedLocation.streetNo || "",
          streetAddress: selectedLocation.address || "",
          block: selectedLocation.block || "",
          buildingNo: selectedLocation.building || "",
          country: selectedLocation.countryName || "",
          stateProvince: selectedLocation.stateProvince || "",
          city: selectedLocation.city || "",
          postalCode: selectedLocation.zipCode || "",
          addressType:
            selectedLocation.addressType === "B" ? "Billing" : "Shipping", // Added human-readable addressType
        },
        displayAddress: `${
          selectedLocation.building ? `${selectedLocation.building} - ` : ""
        }${selectedLocation.address}`, // Added formatted display address
        fullAddress: [
          selectedLocation.building && `${selectedLocation.building}`,
          selectedLocation.address,
          selectedLocation.city,
          selectedLocation.stateProvince,
          selectedLocation.zipCode,
          selectedLocation.countryName,
        ]
          .filter(Boolean)
          .join(", "), // Added full formatted address
      },
    }));

    try {
      // Construct full address for geocoding
      const fullAddress = [
        selectedLocation.building && `${selectedLocation.building}`,
        selectedLocation.address,
        selectedLocation.city,
        selectedLocation.stateProvince,
        selectedLocation.zipCode,
        selectedLocation.countryName,
      ]
        .filter(Boolean)
        .join(", ");

      // console.log("Geocoding address:", fullAddress); // For debugging

      const coordinates = await fetchCoordinates(fullAddress);

      setFormData((prevFormData) => ({
        ...prevFormData,
        location: {
          ...prevFormData.location,
          coordinates: {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          },
        },
      }));

      toast.success(`Location coordinates fetched successfully`, {
        duration: 3000,
        style: {
          background: "#fff",
          color: "#28a745",
          padding: "16px",
          borderLeft: "6px solid #28a745",
        },
      });
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      toast.error(`Error fetching location coordinates: ${error.message}`, {
        duration: 5000,
        style: {
          background: "#fff",
          color: "#dc3545",
          padding: "16px",
          borderLeft: "6px solid #dc3545",
        },
      });
    }
  };

  const handleSelectedServiceCallChange = async (selectedServiceCall) => {
    // // console.log(
    //   "handleSelectedServiceCallChange called with:",
    //   selectedServiceCall
    // );
    setSelectedServiceCall(selectedServiceCall);
    setSelectedSalesOrder(null); // Reset sales order selection

    if (!selectedServiceCall) {
      setSalesOrders([]); // Clear sales orders if no service call selected
      toast.error("Please select a service call", {
        duration: 3000,
        style: {
          background: "#fff",
          color: "#dc3545",
          padding: "16px",
          borderLeft: "6px solid #dc3545",
        },
      });
      return;
    }

    if (selectedCustomer && selectedServiceCall) {
      try {
        // Show loading toast
        toast.loading("Fetching sales orders...", { id: "salesOrdersFetch" });

        // console.log("Fetching sales orders with:", {
        //  cardCode: selectedCustomer.value,
       //   serviceCallID: selectedServiceCall.value,
      //  });

        const salesOrderResponse = await fetch("/api/getSalesOrder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cardCode: selectedCustomer.value,
            serviceCallID: selectedServiceCall.value,
          }),
        });

        if (!salesOrderResponse.ok) {
          const errorData = await salesOrderResponse.json();
          console.error("Sales order fetch error:", errorData);
          toast.dismiss("salesOrdersFetch");
          toast.error(
            `Error fetching sales orders: ${
              errorData.error || "Unknown error"
            }`,
            {
              duration: 5000,
              style: {
                background: "#fff",
                color: "#dc3545",
                padding: "16px",
                borderLeft: "6px solid #dc3545",
              },
            }
          );
          setSalesOrders([]);
          return;
        }

        const response = await salesOrderResponse.json();
        // console.log("Fetched sales orders:", response);

        if (!response.value) {
          console.error("Unexpected response format:", response);
          toast.dismiss("salesOrdersFetch");
          toast.error("No sales orders found for this service call", {
            duration: 5000,
            style: {
              background: "#fff",
              color: "#dc3545",
              padding: "16px",
              borderLeft: "6px solid #dc3545",
            },
          });
          setSalesOrders([]);
          return;
        }

        const formattedSalesOrders = response.value.map((item) => ({
          value: item.DocNum.toString(),
          label: `${item.DocNum} - ${getStatusText(item.DocStatus)}`,
          docTotal: item.DocTotal,
          docStatus: item.DocStatus,
        }));

        setSalesOrders(formattedSalesOrders);
        toast.dismiss("salesOrdersFetch");

        // Show success or warning toast based on the number of sales orders found
        if (formattedSalesOrders.length === 0) {
          toast("No sales orders found for this service call", {
            icon: "⚠️",
            duration: 5000,
            style: {
              background: "#fff",
              color: "#856404",
              padding: "16px",
              borderLeft: "6px solid #ffc107",
              borderRadius: "4px",
            },
          });
        } else {
          toast.success(
            `Found ${formattedSalesOrders.length} sales order${
              formattedSalesOrders.length > 1 ? "s" : ""
            } for Service Call ${selectedServiceCall.value}`,
            {
              duration: 5000,
              style: {
                background: "#fff",
                color: "#28a745",
                padding: "16px",
                borderLeft: "6px solid #28a745",
                borderRadius: "4px",
              },
              iconTheme: {
                primary: "#28a745",
                secondary: "#fff",
              },
            }
          );
        }
      } catch (error) {
        console.error("Error fetching sales orders:", error);
        toast.dismiss("salesOrdersFetch");
        toast.error(`Error: ${error.message}`, {
          duration: 5000,
          style: {
            background: "#fff",
            color: "#dc3545",
            padding: "16px",
            borderLeft: "6px solid #dc3545",
            borderRadius: "4px",
          },
        });
        setSalesOrders([]);
      }
    }
  };

  // Helper function to convert status codes to readable text
  const getStatusText = (status) => {
    const statusMap = {
      O: "Open",
      C: "Closed",
      P: "Pending",
    };
    return statusMap[status] || status;
  };

  const handleSelectedEquipmentsChange = (selectedEquipments) => {
    const formattedEquipments = selectedEquipments.map((equipment) => ({
      itemCode: equipment.ItemCode || "",
      itemName: equipment.ItemName || "",
      itemGroup: equipment.ItemGroup || "",
      brand: equipment.Brand || "",
      equipmentLocation: equipment.EquipmentLocation || "",
      equipmentType: equipment.EquipmentType || "",
      modelSeries: equipment.ModelSeries || "",
      serialNo: equipment.SerialNo || "",
      notes: equipment.Notes || "",
      warrantyStartDate: equipment.WarrantyStartDate || null,
      warrantyEndDate: equipment.WarrantyEndDate || null,
    }));

    setFormData((prevFormData) => ({
      ...prevFormData,
      equipments: formattedEquipments,
    }));
  };

  const handleNextClick = () => {
    if (activeKey === "summary") {
      setActiveKey("task");
    } else if (activeKey === "task") {
      setActiveKey("scheduling");
    }
  };

  const handleScheduleSessionChange = (e) => {
    const selectedSessionLabel = e.target.value;
    const selectedWindow = schedulingWindows.find(
      (window) => window.label === selectedSessionLabel
    );

    if (selectedWindow) {
      // Parse the start and end times
      const startTimeParts = selectedWindow.timeStart.split(":");
      const endTimeParts = selectedWindow.timeEnd.split(":");

      const startHours = parseInt(startTimeParts[0], 10);
      const startMinutes = parseInt(startTimeParts[1], 10);
      const endHours = parseInt(endTimeParts[0], 10);
      const endMinutes = parseInt(endTimeParts[1], 10);

      // Calculate total minutes
      const totalStartMinutes = startHours * 60 + startMinutes;
      const totalEndMinutes = endHours * 60 + endMinutes;

      // Calculate duration in minutes
      const durationInMinutes = totalEndMinutes - totalStartMinutes;

      // Calculate hours and minutes
      const estimatedDurationHours = Math.floor(durationInMinutes / 60);
      const estimatedDurationMinutes = durationInMinutes % 60;

      setFormData({
        ...formData,
        scheduleSession: selectedWindow.label,
        startTime: selectedWindow.timeStart,
        endTime: selectedWindow.timeEnd,
        estimatedDurationHours,
        estimatedDurationMinutes,
        manualDuration: false // Reset manual duration flag when selecting a session
      });
    } else {
      setFormData({
        ...formData,
        scheduleSession: "custom",
        startTime: "",
        endTime: "",
        estimatedDurationHours: "",
        estimatedDurationMinutes: "",
        manualDuration: false
      });
    }
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return { hours: 0, minutes: 0 };

    const start = new Date(`2000/01/01 ${startTime}`);
    const end = new Date(`2000/01/01 ${endTime}`);

    // If end time is before start time, assume it's next day
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }

    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);

    return {
      hours: Math.floor(diffMins / 60),
      minutes: diffMins % 60,
    };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "startTime" || name === "endTime") {
      const newFormData = {
        ...formData,
        [name]: value,
      };

      // Only calculate duration if user hasn't manually entered values
      if (!formData.manualDuration) {
        const duration = calculateDuration(
          newFormData.startTime,
          newFormData.endTime
        );
        newFormData.estimatedDurationHours = duration.hours;
        newFormData.estimatedDurationMinutes = duration.minutes;
      }

      setFormData(newFormData);
    } else if (name === "estimatedDurationHours" || name === "estimatedDurationMinutes") {
      // Set flag to indicate manual duration entry
      setFormData({
        ...formData,
        [name]: value,
        manualDuration: true
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Function to check for overlapping jobs with improved date handling and worker schedule checking
  const checkForOverlappingJobs = async () => {
    try {
      const existingJobsRef = collection(db, "jobs");
      const promises = selectedWorkers.map(async (worker) => {
        // console.log(`Checking for overlaps for worker: ${worker.label}`);

        // Update query to properly check assignedWorkers array
        const existingJobsQuery = query(
          existingJobsRef,
          where("assignedWorkers", "array-contains", {
            workerId: worker.value,
            workerName: worker.label,
          })
        );

        const querySnapshot = await getDocs(existingJobsQuery);

        // Parse dates using a more reliable method
        const newJobStart = new Date(
          `${formData.startDate}T${formData.startTime}`
        );
        const newJobEnd = new Date(`${formData.endDate}T${formData.endTime}`);

        // console.log(
        //   `New Job Schedule - Start: ${newJobStart}, End: ${newJobEnd}`
        // );

        const conflicts = [];

        for (const doc of querySnapshot.docs) {
          const jobData = doc.data();

          // Parse existing job dates
          const existingJobStart = new Date(jobData.startDate);
          const existingJobEnd = new Date(jobData.endDate);

          // console.log(
        //    `Existing Job (${doc.id}) - Start: ${existingJobStart}, End: ${existingJobEnd}`
          // );

          // Check for overlap with improved date comparison
          const hasOverlap =
            (newJobStart <= existingJobEnd && newJobEnd >= existingJobStart) ||
            (existingJobStart <= newJobEnd && existingJobEnd >= newJobStart);

          if (hasOverlap) {
            conflicts.push({
              workerId: worker.value,
              workerName: worker.label,
              conflictingJobId: doc.id,
              conflictingJobTime: `${existingJobStart.toLocaleDateString()} ${existingJobStart.toLocaleTimeString()} - ${existingJobEnd.toLocaleTimeString()}`,
              message: `Worker ${
                worker.label
              } has a scheduling conflict with Job #${
                doc.id
              } (${existingJobStart.toLocaleDateString()} ${existingJobStart.toLocaleTimeString()} - ${existingJobEnd.toLocaleTimeString()})`,
            });
          }
        }

        return conflicts.length > 0 ? conflicts : undefined;
      });

      const results = await Promise.all(promises);
      const allConflicts = results.filter(Boolean).flat();

      // console.log("Schedule conflict check results:", allConflicts);
      return allConflicts;
    } catch (error) {
      console.error("Error checking for schedule conflicts:", error);
      throw new Error(`Failed to check schedule conflicts: ${error.message}`);
    }
  };

  // Add this function before handleSubmitClick
  const handleSubmitSuccess = async ({ jobId }) => {
    try {
      // Show success message with Swal
      await Swal.fire({
        icon: "success",
        title: "Job Created Successfully!",
        text: `Job #${jobId} has been created`,
        confirmButtonText: "View Job",
        showCancelButton: true,
        cancelButtonText: "Create Another",
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#6c757d",
      }).then((result) => {
        if (result.isConfirmed) {
          // Redirect to job details page
          router.push(`/jobs/view/${jobId}`);
        } else {
          // Reset form for creating another job
          setFormData({
            ...initialFormState, // Make sure to define initialFormState at the top of your component
            jobNo: generateNewJobNo(), 
          });
          setSelectedCustomer(null);
          setSelectedContact(null);
          setSelectedLocation(null);
          setSelectedWorkers([]);
          setTasks([]);
          setProgress(0);
          setIsSubmitting(false);
          setActiveKey("summary");
        }
      });
    } catch (error) {
      console.error("Error in success handling:", error);
      toast.error("Error handling success state", {
        duration: 5000,
        style: {
          background: "#fff",
          color: "#dc3545",
          padding: "16px",
          borderLeft: "6px solid #dc3545",
        },
      });
    }
  };

  // Add this at the top with your other state declarations
  const initialFormState = {
    jobID: "",
    jobNo: "",
    jobName: "",
    jobDescription: "",
    priority: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    estimatedDurationHours: "",
    estimatedDurationMinutes: "",
    scheduleSession: "custom",
    customerID: "",
    customerName: "",
    contact: {
      contactID: "",
      firstName: "",
      middleName: "",
      lastName: "",
      phoneNumber: "",
      mobilePhone: "",
      email: "",
    },
    location: {
      locationName: "",
      address: {
        streetNo: "",
        streetAddress: "",
        block: "",
        buildingNo: "",
        country: "",
        stateProvince: "",
        city: "",
        postalCode: "",
      },
    },
    equipments: [],
    adminWorkerNotify: false,
    customerNotify: false,
  };

  // Add this function to generate new job numbers
  const generateNewJobNo = async () => {
    try {
      // Get the current year
      const year = new Date().getFullYear();
      
      // Query Firestore to get the latest job number for this year
      const jobsRef = collection(db, "jobs");
      const q = query(
        jobsRef,
        where("jobNo", ">=", `${year}-000001`),
        where("jobNo", "<=", `${year}-999999`),
        orderBy("jobNo", "desc"),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      let nextNumber = 1;
      
      if (!snapshot.empty) {
        // Extract the number from the latest job number
        const latestJobNo = snapshot.docs[0].data().jobNo;
        const [yearPrefix, number] = latestJobNo.split('-');
        
        // If it's a new year, start from 1, otherwise increment
        if (yearPrefix === year.toString()) {
          nextNumber = parseInt(number) + 1;
        }
      }
      
      // Format the job number with leading zeros (6 digits)
      const formattedNumber = nextNumber.toString().padStart(6, '0');
      
      const newJobNo = `${year}-${formattedNumber}`;
      // console.log("Generated job number:", newJobNo);
      return newJobNo;
    } catch (error) {
      console.error("Error generating job number:", error);
      throw new Error("Failed to generate job number");
    }
  };

  // Updated handleSubmitClick function
  const handleSubmitClick = async () => {
    try {
      // Log all form data before submission
      // console.log("=== FORM SUBMISSION DATA ===");
      // console.log("Form Data:", {
      // ...formData,
      //   startDate: formData.startDate,
      //   endDate: formData.endDate,
      //   startTime: formData.startTime,
      //   endTime: formData.endTime,
      // });
      //console.log("Selected Customer:", selectedCustomer);
      //console.log("Selected Contact:", selectedContact);
      //console.log("Selected Location:", selectedLocation);
      //console.log("Selected Service Call:", selectedServiceCall);
      //console.log("Selected Sales Order:", selectedSalesOrder);
      //console.log("Selected Workers:", selectedWorkers);
      //console.log("Tasks:", tasks);
      //console.log("Job Contact Type:", selectedJobContactType);
      //console.log("=== END FORM DATA ===");

      // Validation check
      const missingFields = [];
      if (!selectedCustomer) missingFields.push("Customer");
      if (!selectedContact) missingFields.push("Contact");
      if (!selectedLocation) missingFields.push("Location");
      if (!selectedWorkers.length) missingFields.push("Assigned Workers");
      if (!formData.startDate) missingFields.push("Start Date");
      if (!formData.endDate) missingFields.push("End Date");
      if (!formData.startTime) missingFields.push("Start Time");
      if (!formData.endTime) missingFields.push("End Time");
      if (!formData.jobName) missingFields.push("Job Name");
      if (!formData.priority) missingFields.push("Priority");
      if (!selectedJobContactType) missingFields.push("Job Contact Type");

      if (missingFields.length > 0) {
       // console.log("Missing Required Fields:", missingFields);
        toast.error(
          <div>
            <strong>Please fill in all required fields:</strong>
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              {missingFields.map((field, index) => (
                <li key={index}>{field}</li>
              ))}
            </ul>
          </div>,
          {
            duration: 5000,
            style: {
              background: "#fff",
              color: "#dc3545",
              padding: "16px",
              borderLeft: "6px solid #dc3545",
              maxWidth: "500px",
            },
          }
        );
        return;
      }

      setProgress(0);
      setIsSubmitting(true);

      // Generate base job number
      const baseJobNo = await generateBaseJobNo();
      const repeatGroupId = repeatSettings.isRepeat ? generateRepeatGroupId() : null;

      // Generate recurring dates if repeat is enabled
      const jobDates = repeatSettings.isRepeat ? generateRecurringDates() : [new Date(formData.startDate)];
      // console.log("Generated job dates:", jobDates);

      // Check for overlaps
      // console.log("Checking for schedule conflicts...");
      setProgress(40);
      const conflicts = await checkForOverlappingJobs();

      if (conflicts.length > 0) {
        // Create a formatted message showing all conflicts
        const conflictMessage = conflicts
          .map((conflict) => `• ${conflict.message}`)
          .join("\n");

        const result = await Swal.fire({
          title: "Schedule Conflicts Detected",
          html: `
            <div class="text-start">
              <p class="mb-3">The following scheduling conflicts were found:</p>
              <div class="alert alert-warning">
                ${conflicts
                  .map((c) => `<p class="mb-2">${c.message}</p>`)
                  .join("")}
              </div>
              <p class="mt-3">Do you want to proceed with creating this job anyway?</p>
            </div>
          `,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, proceed anyway",
          cancelButtonText: "No, let me adjust the schedule",
          confirmButtonColor: "#28a745",
          cancelButtonColor: "#dc3545",
          customClass: {
            htmlContainer: "text-start",
          },
        });

        if (!result.isConfirmed) {
          setIsSubmitting(false);
          return;
        }
      }

      // Format dates and prepare base form data
      // console.log("Formatting dates and preparing form data...");
      setProgress(60);

      // Create jobs for each date
      for (let i = 0; i < jobDates.length; i++) {
        const currentDate = jobDates[i];
        const currentJobNo = repeatSettings.isRepeat && i > 0 
          ? generateRepeatJobNo(baseJobNo, i + 1)
          : baseJobNo;

        const formattedStartDateTime = formatDateTime(
          currentDate.toISOString().split('T')[0],
          formData.startTime
        );

        const endDate = new Date(currentDate);
        endDate.setHours(new Date(formData.endDate).getHours());
        endDate.setMinutes(new Date(formData.endDate).getMinutes());
        const formattedEndDateTime = formatDateTime(
          endDate.toISOString().split('T')[0],
          formData.endTime
        );

        // Prepare the form data
        const updatedFormData = {
          // Basic Job Info
          jobID: currentJobNo,
          jobNo: currentJobNo,
          jobName: repeatSettings.isRepeat 
            ? `${formData.jobName} (${i + 1}/${jobDates.length})`
            : formData.jobName,
          jobDescription: formData.jobDescription || "",
          jobStatus: "Created",
          priority: formData.priority || "",

          // Repeat Job Information
          repeatJob: repeatSettings.isRepeat ? {
            isRepeat: true,
            repeatGroupId: repeatGroupId,
            baseJobNo: baseJobNo,
            sequence: i + 1,
            totalOccurrences: jobDates.length,
            settings: repeatSettings
          } : null,

          // Customer Info
          customerID: selectedCustomer?.cardCode || "",
          customerName: selectedCustomer?.cardName || "",

          // Dates and Times
          startDate: formattedStartDateTime || null,
          endDate: formattedEndDateTime || null,
          startTime: formData.startTime || "",
          endTime: formData.endTime || "",
          estimatedDurationHours: formData.estimatedDurationHours || "",
          estimatedDurationMinutes: formData.estimatedDurationMinutes || "",

          // Location
          location: {
            locationName: selectedLocation?.address || "",
            siteId: selectedLocation?.value || "",
            addressType: selectedLocation?.addressType || "",
            address: {
              streetNo: selectedLocation?.streetNo || "",
              streetAddress: selectedLocation?.address || "",
              block: selectedLocation?.block || "",
              buildingNo: selectedLocation?.building || "",
              city: selectedLocation?.city || "",
              stateProvince: selectedLocation?.stateProvince || "",
              postalCode: selectedLocation?.zipCode || "",
              country: selectedLocation?.countryName || "",
            },
            coordinates: formData.location?.coordinates || {
              latitude: "",
              longitude: "",
            },
            displayAddress: `${
              selectedLocation?.building ? `${selectedLocation.building} - ` : ""
            }${selectedLocation?.address}`,
            fullAddress: [
              selectedLocation?.building && `${selectedLocation.building}`,
              selectedLocation?.address,
              selectedLocation?.city,
              selectedLocation?.stateProvince,
              selectedLocation?.zipCode,
              selectedLocation?.countryName,
            ]
              .filter(Boolean)
              .join(", "),
          },
          equipments: formData.equipments.map((equipment) => ({
            itemCode: equipment.itemCode || "",
            itemName: equipment.itemName || "",
            itemGroup: equipment.itemGroup || "",
            brand: equipment.brand || "",
            equipmentLocation: equipment.equipmentLocation || "",
            equipmentType: equipment.equipmentType || "",
            modelSeries: equipment.modelSeries || "",
            serialNo: equipment.serialNo || "",
            notes: equipment.notes || "",
            warrantyStartDate: equipment.warrantyStartDate || null,
            warrantyEndDate: equipment.warrantyEndDate || null,
          })),

          // Contact
          contact: formatContactData(selectedContact),

          // Workers
          assignedWorkers: selectedWorkers.map((worker) => ({
            workerId: worker.value || "",
            workerName: worker.label || "",
          })),

          // Tasks
          taskList: tasks.map((task) => ({
            taskID: task.taskID || "",
            taskName: task.taskName || "",
            taskDescription: task.taskDescription || "",
            assignedTo: task.assignedTo || "",
            isPriority: Boolean(task.isPriority),
            isDone: Boolean(task.isDone),
            completionDate: task.completionDate
              ? Timestamp.fromDate(new Date(task.completionDate))
              : null,
          })),

          // Metadata
          createdBy: {
            workerId: currentUser.workerId || "unknown",
            fullName: currentUser.fullName || "anonymous",
            timestamp: Timestamp.now(),
          },

          // Timestamps
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        // Sanitize the data before saving
        const sanitizedData = sanitizeDataForFirestore(updatedFormData);
        //// console.log(`Sanitized data for job ${i + 1}:`, sanitizedData);

        // Save to Firestore
        try {
          const jobRef = doc(db, "jobs", currentJobNo);
          await setDoc(jobRef, sanitizedData);
         // // console.log(`Successfully saved job ${i + 1} to Firestore`);
          setProgress(60 + (35 * (i + 1) / jobDates.length));
        } catch (firestoreError) {
          console.error(`Firestore save error for job ${i + 1}:`, firestoreError);
          throw new Error(`Failed to save job ${i + 1}: ${firestoreError.message}`);
        }
      }

      setProgress(100);

      // Show success message
      toast.success(`Successfully created ${jobDates.length} job(s)!`, {
        duration: 5000,
        style: {
          background: "#fff",
          color: "#28a745",
          padding: "16px",
          borderLeft: "6px solid #28a745",
        },
      });
      initializeJobNo();
      // Handle success (redirect, reset form, etc.)
      handleSubmitSuccess({ jobId: baseJobNo });

    } catch (error) {
      console.error("Submit error:", error);
      setIsSubmitting(false);
      setProgress(0);

      toast.error(`Error creating job: ${error.message}`, {
        duration: 5000,
        style: {
          background: "#fff",
          color: "#dc3545",
          padding: "16px",
          borderLeft: "6px solid #dc3545",
        },
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const missingFields = validateJobForm(formData);

    if (missingFields.length > 0) {
      toast.error(
        <div>
          <strong>Please check the following:</strong>
          <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
            {missingFields.map((field, index) => (
              <li key={index}>{field}</li>
            ))}
          </ul>
        </div>,
        {
          duration: 5000,
          style: {
            background: "#fff",
            color: "#dc3545",
            padding: "16px",
            borderLeft: "6px solid #dc3545",
            maxWidth: "500px",
          },
        }
      );

      // If there's a task-related error, switch to the Task tab
      if (missingFields.some((field) => field.toLowerCase().includes("task"))) {
        setActiveKey("task");
      }
      return;
    }

  };

  // Function to toggle the visibility of the Service Location section
  const toggleServiceLocation = () => {
    setShowServiceLocation(!showServiceLocation);
  };

  // Function to toggle the visibility of the Equipments section
  const toggleEquipments = () => {
    setShowEquipments(!showEquipments);
  };

  // Add useEffect to handle initial customer selection
  useEffect(() => {
    const initializeCustomer = async () => {
      const params = new URLSearchParams(window.location.search);
      const customerCode = params.get("customerCode");

      if (customerCode && customers.length > 0) {
        const customerOption = customers.find(
          (customer) => customer.value === customerCode
        );
        if (customerOption) {
          handleCustomerChange(customerOption);
        }
      }
    };

    initializeCustomer();
  }, [customers]); // Dependency on customers ensures we wait for customer data to load

  // Required field indicator component
  const RequiredField = () => (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip>This field is required</Tooltip>}
    >
      <FaAsterisk
        style={{
          color: "red",
          marginLeft: "4px",
          fontSize: "8px",
          verticalAlign: "super",
        }}
      />
    </OverlayTrigger>
  );

  // Add this component for fields that need tooltips
  const RequiredFieldWithTooltip = ({ label }) => (
    <Form.Label>
      {label}
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip>This field is required</Tooltip>}
      >
        <span
          className="text-danger"
          style={{ marginLeft: "4px", cursor: "help" }}
        >
          *
        </span>
      </OverlayTrigger>
    </Form.Label>
  );

  const handleRepeatSettingChange = (field, value) => {
    if (field === 'endType' && value === 'never') {
      toast.info(
        `Note: Recurring jobs will be limited to ${MAX_OCCURRENCES} occurrences for system performance`,
        {
          duration: 5000,
          style: {
            background: "#fff",
            color: "#0dcaf0",
            padding: "16px",
            borderLeft: "6px solid #0dcaf0",
          },
        }
      );
    }
    
    setRepeatSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWeekDayToggle = (day) => {
    setRepeatSettings(prev => ({
      ...prev,
      weekDays: prev.weekDays.includes(day)
        ? prev.weekDays.filter(d => d !== day)
        : [...prev.weekDays, day]
    }));
  };

  // Function to generate recurring dates
  const generateRecurringDates = () => {
    const startDate = new Date(formData.startDate);
    const dates = [startDate];
    
    if (!repeatSettings.isRepeat || repeatSettings.frequency === 'none') {
      return dates;
    }

    // Set a maximum number of occurrences even for "never" ending repeats
    const MAX_OCCURRENCES = 52; // For example, limit to 52 occurrences (1 year for weekly)
    
    const endDate = repeatSettings.endType === 'date' 
      ? new Date(repeatSettings.endDate)
      : null;
    
    const maxOccurrences = repeatSettings.endType === 'occurrences'
      ? parseInt(repeatSettings.occurrences)
      : repeatSettings.endType === 'never'
      ? MAX_OCCURRENCES
      : null;

    let currentDate = new Date(startDate);
    
    while (dates.length < maxOccurrences) {
      // Break if we've reached the end date
      if (endDate && currentDate > endDate) break;
      
      // Break if we've reached the maximum occurrences
      if (dates.length >= MAX_OCCURRENCES) {
        //// console.log(`Reached maximum limit of ${MAX_OCCURRENCES} occurrences`);
        break;
      }

      switch (repeatSettings.frequency) {
        case 'daily':
          currentDate = new Date(currentDate.setDate(
            currentDate.getDate() + parseInt(repeatSettings.interval)
          ));
          break;

        case 'weekly':
          if (repeatSettings.weekDays.length > 0) {
            currentDate = new Date(currentDate.setDate(
              currentDate.getDate() + 1
            ));
            while (!repeatSettings.weekDays.includes(currentDate.getDay())) {
              currentDate = new Date(currentDate.setDate(
                currentDate.getDate() + 1
              ));
            }
          } else {
            currentDate = new Date(currentDate.setDate(
              currentDate.getDate() + (7 * parseInt(repeatSettings.interval))
            ));
          }
          break;

        case 'monthly':
          currentDate = new Date(currentDate.setMonth(
            currentDate.getMonth() + parseInt(repeatSettings.interval)
          ));
          // Adjust to specified day of month
          currentDate.setDate(parseInt(repeatSettings.monthDay));
          break;
      }

      if (currentDate > startDate) {
        dates.push(new Date(currentDate));
      }
    }

    return dates;
  };


  const initializeJobNo = async () => {
    try {
      const newJobNo = await generateBaseJobNo();
      setJobNo(newJobNo);
    } catch (error) {
      console.error("Error initializing job number:", error);
      setJobNo("Error");
    }
  };

  // Add this useEffect
  useEffect(() => {
    initializeJobNo();
  }, []); // Empty dependency array means this runs once when component mounts

  return (
    <>
      <Tabs
        id="noanim-tab-example"
        activeKey={activeKey}
        onSelect={(key) => setActiveKey(key)} // Handle tab change event
        className="mb-3"
      >
        <Tab eventKey="summary" title="Job Summary">
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Form.Group as={Col} md="7" controlId="customerList">
                <Form.Label>
                  <RequiredFieldWithTooltip label="Customer" />
                  <OverlayTrigger
                    placement="right"
                    overlay={
                      <Tooltip id="customer-search-tooltip">
                        <div className="text-start">
                          <strong>Customer Search:</strong>
                          <br />
                          • Search by customer code or name
                          <br />
                          • Selection will load related contacts and locations
                          <br />• Required to proceed with job creation
                        </div>
                      </Tooltip>
                    }
                  >
                    <i
                      className="fe fe-help-circle text-muted"
                      style={{ cursor: "pointer" }}
                    ></i>
                  </OverlayTrigger>
                </Form.Label>
                <Select
                  instanceId="customer-select"
                  options={customers}
                  value={selectedCustomer}
                  onChange={handleCustomerChange}
                  placeholder={
                    isLoading ? "Loading customers..." : "Enter Customer Name"
                  }
                  isDisabled={isLoading}
                  noOptionsMessage={() =>
                    isLoading ? "Loading..." : "No customers found"
                  }
                />
              </Form.Group>
            </Row>

            <hr className="my-4" />
            <h5 className="mb-1">Primary Contact</h5>
            <p className="text-muted">Details about the customer.</p>

            <Row className="mb-3">
              <Form.Group as={Col} md="3" controlId="jobWorker">
                <Form.Label>
                  <RequiredFieldWithTooltip label="Contact ID" />
                  <OverlayTrigger
                    placement="right"
                    overlay={
                      <Tooltip id="contact-tooltip">
                        <div className="text-start">
                          <strong>Contact Information:</strong>
                          <br />
                          • Shows contacts linked to selected customer
                          <br />
                          Auto-fills contact details
                          <br />• Required for job communication
                        </div>
                      </Tooltip>
                    }
                  >
                    <i
                      className="fe fe-help-circle text-muted"
                      style={{ cursor: "pointer" }}
                    ></i>
                  </OverlayTrigger>
                </Form.Label>
                <Select
                  instanceId="contact-select"
                  options={contacts}
                  value={selectedContact}
                  onChange={handleContactChange}
                  placeholder="Select Contact ID"
                />
              </Form.Group>
            </Row>

            <Row className="mb-3">
              <Form.Group as={Col} md="4" controlId="validationCustom01">
                <Form.Label>First name</Form.Label>
                <Form.Control
                  required
                  type="text"
                  value={formData.contact.firstName}
                  readOnly
                  disabled
                />
                <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
              </Form.Group>
              <Form.Group as={Col} md="4" controlId="validationCustom02">
                <Form.Label>Middle name</Form.Label>
                <Form.Control
                  required
                  type="text"
                  value={formData.contact.middleName}
                  readOnly
                  disabled
                />
                <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
              </Form.Group>
              <Form.Group as={Col} md="4" controlId="validationCustom03">
                <Form.Label>Last name</Form.Label>
                <Form.Control
                  required
                  type="text"
                  value={formData.contact.lastName}
                  readOnly
                  disabled
                />
                <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
              </Form.Group>
            </Row>
            <Row className="mb-3">
              <Form.Group
                as={Col}
                md="4"
                controlId="validationCustomPhoneNumber"
              >
                <Form.Label>Phone Number</Form.Label>
                <Form.Control
                  defaultValue={formData.contact.phoneNumber}
                  type="text"
                  readOnly
                  disabled
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid phone number.
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group
                as={Col}
                md="4"
                controlId="validationCustomMobilePhone"
              >
                <Form.Label>Mobile Phone</Form.Label>
                <Form.Control
                  defaultValue={formData.contact.mobilePhone}
                  type="text"
                  readOnly
                  disabled
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid mobile phone number.
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group as={Col} md="4" controlId="validationCustomEmail">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  defaultValue={formData.contact.email}
                  type="email"
                  readOnly
                  disabled
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid email.
                </Form.Control.Feedback>
              </Form.Group>
            </Row>

            <hr className="my-4" />
            <h5
              className="mb-1"
              style={{ cursor: "pointer" }}
              onClick={toggleServiceLocation}
            >
              Job Address {showServiceLocation ? "(-)" : "(+)"}
            </h5>
            {showServiceLocation && (
              <>
                <p className="text-muted">Details about the Job Address.</p>
                <Row className="mb-3">
                  <Form.Group as={Col} md="4" controlId="jobLocation">
                    <Form.Label>
                      <RequiredFieldWithTooltip label="Site / Location" />
                      <OverlayTrigger
                        placement="right"
                        overlay={
                          <Tooltip id="location-tooltip">
                            <div className="text-start">
                              <strong>Location Details:</strong>
                              <br />
                              • Shows addresses linked to customer
                              <br />
                              • Auto-fills complete address
                              <br />• Used for job site information
                            </div>
                          </Tooltip>
                        }
                      >
                        <i
                          className="fe fe-help-circle text-muted ms-1"
                          style={{ cursor: "pointer" }}
                        ></i>
                      </OverlayTrigger>
                    </Form.Label>
                    <Select
                      instanceId="location-select"
                      options={locations}
                      value={selectedLocation}
                      onChange={handleLocationChange}
                      placeholder="Select Site ID"
                      isGrouped={true}
                      formatGroupLabel={(data) => (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "0.9em",
                            fontWeight: "bold",
                            padding: "8px 0",
                            color: "#2c3e50",
                            borderBottom: "2px solid #eee",
                            width: "100%",
                          }}
                        >
                          <span>{data.label}</span>
                          <span
                            style={{
                              background: "#e9ecef",
                              borderRadius: "4px",
                              padding: "2px 8px",
                              fontSize: "0.8em",
                            }}
                          >
                            {data.options.length}
                          </span>
                        </div>
                      )}
                      formatOptionLabel={(option) => (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "10px",
                            padding: "4px 0",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontWeight: "500",
                                color: "#2c3e50",
                                marginBottom: "2px",
                              }}
                            >
                              {option.building ? `${option.building} - ` : ""}
                              {option.address}
                            </div>
                            <div
                              style={{
                                fontSize: "0.85em",
                                color: "#666",
                                lineHeight: "1.3",
                              }}
                            >
                              {[
                                option.city,
                                option.stateProvince,
                                option.zipCode,
                                option.countryName,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: "0.75em",
                              padding: "3px 8px",
                              borderRadius: "12px",
                              background:
                                option.addressType === "B"
                                  ? "#e3f2fd"
                                  : "#fff3e0",
                              color:
                                option.addressType === "B"
                                  ? "#1976d2"
                                  : "#f57c00",
                              whiteSpace: "nowrap",
                              alignSelf: "center",
                            }}
                          >
                            {option.addressType === "B"
                              ? "Billing"
                              : "Shipping"}
                          </div>
                        </div>
                      )}
                      styles={{
                        control: (base) => ({
                          ...base,
                          minHeight: "45px",
                          borderColor: "#dee2e6",
                          "&:hover": {
                            borderColor: "#80bdff",
                          },
                        }),
                        group: (base) => ({
                          ...base,
                          paddingTop: 8,
                          paddingBottom: 8,
                        }),
                        option: (base, state) => ({
                          ...base,
                          padding: "8px 12px",
                          borderBottom: "1px solid #f0f0f0",
                          backgroundColor: state.isFocused
                            ? "#f8f9fa"
                            : "white",
                          cursor: "pointer",
                          "&:hover": {
                            backgroundColor: "#f8f9fa",
                          },
                        }),
                        menu: (base) => ({
                          ...base,
                          zIndex: 9999,
                          boxShadow:
                            "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
                        }),
                        groupHeading: (base) => ({
                          ...base,
                          margin: "8px 0",
                          fontSize: "0.9em",
                          fontWeight: "bold",
                        }),
                      }}
                      noOptionsMessage={() => (
                        <div
                          style={{
                            padding: "8px",
                            textAlign: "center",
                            color: "#666",
                          }}
                        >
                          No locations found for this customer
                        </div>
                      )}
                    />
                  </Form.Group>
                </Row>
                <Row className="mb-3">
                  <Form.Group as={Col} controlId="locationName">
                    <Form.Label>Location Name</Form.Label>
                    <Form.Control
                      type="text"
                      disabled
                      value={formData.location?.locationName || ""} // Fallback to an empty string
                      readOnly
                    />
                  </Form.Group>
                  <Form.Group as={Col} controlId="streetNo">
                    <Form.Label>Street No.</Form.Label>
                    <Form.Control
                      type="text"
                      disabled
                      value={formData.location?.address?.streetNo || ""} // Ensure fallback
                      readOnly
                    />
                  </Form.Group>
                  <Form.Group as={Col} controlId="streetAddress">
                    <Form.Label>Street Address</Form.Label>
                    <Form.Control
                      type="text"
                      disabled
                      value={formData.location?.address?.streetAddress || ""} // Ensure fallback
                      readOnly
                    />
                  </Form.Group>
                </Row>
                <Row className="mb-3">
                  <Form.Group as={Col} controlId="block">
                    <Form.Label>Block</Form.Label>
                    <Form.Control
                      type="text"
                      disabled
                      value={formData.location?.address?.block || ""} // Ensure fallback
                      readOnly
                    />
                  </Form.Group>
                  <Form.Group as={Col} controlId="buildingNo">
                    <Form.Label>Building No.</Form.Label>
                    <Form.Control
                      type="text"
                      disabled
                      value={formData.location?.address?.buildingNo || ""} // Ensure fallback
                      readOnly
                    />
                  </Form.Group>
                </Row>
                <Row className="mb-3">
                  <Form.Group as={Col} md="3" controlId="country">
                    <Form.Label>Country</Form.Label>
                    <Form.Control
                      type="text"
                      disabled
                      value={formData.location?.address?.country || ""} // Ensure fallback
                      readOnly
                    />
                  </Form.Group>
                  <Form.Group as={Col} md="3" controlId="stateProvince">
                    <Form.Label>State/Province</Form.Label>
                    <Form.Control
                      type="text"
                      disabled
                      value={formData.location?.address?.stateProvince || ""} // Ensure fallback
                      readOnly
                    />
                  </Form.Group>
                  <Form.Group as={Col} md="3" controlId="city">
                    <Form.Label>City</Form.Label>
                    <Form.Control
                      type="text"
                      disabled
                      value={formData.location?.address?.city || ""} // Ensure fallback
                      readOnly
                    />
                  </Form.Group>
                  <Form.Group as={Col} md="3" controlId="postalCode">
                    <Form.Label>Zip/Postal Code</Form.Label>
                    <Form.Control
                      type="text"
                      disabled
                      value={formData.location?.address?.postalCode || ""} // Ensure fallback
                      readOnly
                    />
                  </Form.Group>
                </Row>
              </>
            )}

            <hr className="my-4" />
            <h5
              className="mb-1"
              style={{ cursor: "pointer" }}
              onClick={toggleEquipments}
            >
              Job Equipments {showEquipments ? "(-)" : "(+)"}
            </h5>
            {showEquipments && (
              <>
                <p className="text-muted">Details about the Equipments.</p>
                <Row className="mb-3">
                  <EquipmentsTable
                    equipments={equipments}
                    onSelectedRowsChange={handleSelectedEquipmentsChange}
                  />
                </Row>
              </>
            )}
            <hr className="my-4" />
          </Form>
          <Row className="align-items-center">
            <Col md={{ span: 4, offset: 8 }} xs={12} className="mt-1">
              <Button
                variant="primary"
                onClick={handleNextClick}
                className="float-end"
              >
                Next
              </Button>
            </Col>
          </Row>
        </Tab>
        <Tab eventKey="task" title="Job Task">
          <JobTask
            tasks={tasks}
            addTask={addTask}
            handleTaskChange={handleTaskChange}
            handleCheckboxChange={handleCheckboxChange}
            deleteTask={deleteTask}
          />
          <Row className="align-items-center">
            <Col md={{ span: 4, offset: 8 }} xs={12} className="mt-1">
              <Button
                variant="primary"
                onClick={handleNextClick}
                className="float-end"
              >
                Next
              </Button>
            </Col>
          </Row>
        </Tab>
        <Tab eventKey="scheduling" title="Job Scheduling">
          <Form>
            <Row className="mb-3">
              <Col xs="auto">
                <Form.Group as={Col} controlId="jobNo">
                  <Form.Label>Job No.</Form.Label>
                  <Form.Control
                    type="text"
                    value={jobNo}
                    readOnly
                    style={{ width: "150px" }}
                  />
                </Form.Group>
              </Col>
              {/* <Form.Group as={Col} md="2" controlId="scheduleSession">
                <Form.Label>Service Call</Form.Label>
                <Form.Select
                  name="scheduleSession"
                  value={formData.scheduleSession}
                  onChange={handleScheduleSessionChange}
                  aria-label="Select schedule session"
                >
                  <option value="custom">Custom</option>
                  <option value="morning">Morning (9:30am to 1:00pm)</option>
                  <option value="afternoon">Afternoon (1:00pm to 5:30pm)</option>
                </Form.Select>
              </Form.Group>
              <Form.Group as={Col} md="2" controlId="scheduleSession">
                <Form.Label>Sales Order</Form.Label>
                <Form.Select
                  name="scheduleSession"
                  value={formData.scheduleSession}
                  onChange={handleScheduleSessionChange}
                  aria-label="Select schedule session"
                >
                  <option value="custom">Custom</option>
                  <option value="morning">Morning (9:30am to 1:00pm)</option>
                  <option value="afternoon">Afternoon (1:00pm to 5:30pm)</option>
                </Form.Select>
              </Form.Group> */}
              <Form.Group as={Col} md="3" controlId="serviceCall">
                <Form.Label>Service Call</Form.Label>
                <Select
                  instanceId="service-call-select"
                  options={serviceCalls}
                  value={selectedServiceCall}
                  onChange={handleSelectedServiceCallChange}
                  placeholder="Select Service Call"
                  isDisabled={!selectedCustomer}
                />
              </Form.Group>

              <Form.Group as={Col} md="3" controlId="salesOrder">
                <Form.Label>Sales Order</Form.Label>
                <Select
                  instanceId="sales-order-select"
                  options={salesOrders}
                  value={selectedSalesOrder}
                  onChange={(selectedOption) =>
                    setSelectedSalesOrder(selectedOption)
                  }
                  placeholder={
                    selectedServiceCall
                      ? "Select Sales Order"
                      : "Select Service Call first"
                  }
                  isDisabled={!selectedServiceCall || salesOrders.length === 0}
                  noOptionsMessage={() =>
                    selectedServiceCall
                      ? "No sales orders found for this service call"
                      : "Please select a service call first"
                  }
                />
              </Form.Group>

              <Form.Group as={Col} md="3" controlId="jobContactType">
                <RequiredFieldWithTooltip label="Job Contact Type" />
                <Select
                  instanceId="job-contact-type-select"
                  options={jobContactTypes}
                  value={selectedJobContactType}
                  onChange={handleJobContactTypeChange}
                  placeholder="Select Contact Type"
                  // isDisabled={!selectedServiceCall || salesOrders.length === 0}
                  isClearable
                  noOptionsMessage={() => "No contact types available"}
                />
                {jobContactTypes.length === 0 && selectedCustomer && (
                  <small className="text-muted">
                    No contact types available
                  </small>
                )}
              </Form.Group>
            </Row>

            <Row className="mb-3">
              <Form.Group as={Col} md="4" controlId="jobCategory">
                <RequiredFieldWithTooltip label="Job Priority" />
                <Form.Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  aria-label="Select job category"
                >
                  <option value="" disabled>
                    Select Priority
                  </option>
                  <option value="Low">Low</option>
                  <option value="Mid">Mid</option>
                  <option value="High">High</option>
                </Form.Select>
              </Form.Group>
              <Form.Group as={Col} md="4" controlId="jobCategory">
                <Form.Label>Job Status</Form.Label>
                <Form.Select
                  name="jobStatus"
                  value={formData.jobStatus}
                  onChange={handleInputChange}
                  aria-label="Select job status"
                >
                  <option value="" disabled>
                    Select Status
                  </option>
                  <option value="Created">Created</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Rescheduled">Rescheduled</option>
                  <option value="Cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>

              <Form.Group as={Col} md="4" controlId="jobWorker">
                <RequiredFieldWithTooltip label="Assigned Worker" />
                <Select
                  instanceId="worker-select"
                  isMulti
                  options={workers}
                  value={selectedWorkers}
                  onChange={handleWorkersChange}
                  placeholder="Search Worker"
                />
              </Form.Group>
            </Row>
            <Row className="mb-3">
              <Form.Group as={Col} md="4" controlId="startDate">
                <RequiredFieldWithTooltip label="Start Date" />
                <Form.Control
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  placeholder="Enter start date"
                />
              </Form.Group>
              <Form.Group as={Col} md="4" controlId="endDate">
                <RequiredFieldWithTooltip label="End Date" />
                <Form.Control
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  placeholder="Enter end date"
                />
              </Form.Group>
              <Form.Group as={Col} md="4" controlId="scheduleSession">
                <RequiredFieldWithTooltip label="Schedule Session" />
                <Form.Select
                  name="scheduleSession"
                  value={formData.scheduleSession}
                  onChange={handleScheduleSessionChange}
                  aria-label="Select schedule session"
                >
                  <option value="">Select a session</option>
                  <option value="">Custom</option>
                  {schedulingWindows.map((window) => (
                    <option key={window.id} value={window.label}>
                      {window.label} ({window.timeStart} to {window.timeEnd})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Row>
            <Row className="mb-3">
              <Form.Group as={Col} md="4" controlId="startTime">
                <RequiredFieldWithTooltip label="Start Time" />
                <Form.Control
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  readOnly={formData.scheduleSession !== "custom"}
                />
              </Form.Group>

              <Form.Group as={Col} md="4" controlId="endTime">
                <RequiredFieldWithTooltip label="End Time" />
                <Form.Control
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  readOnly={formData.scheduleSession !== "custom"}
                />
              </Form.Group>

              <Form.Group as={Col} md="3" controlId="estimatedDuration">
                <RequiredFieldWithTooltip label="Estimated Duration" />
                <InputGroup>
                  <Form.Control
                    type="number"
                    name="estimatedDurationHours"
                    value={formData.estimatedDurationHours}
                    onChange={handleInputChange}
                    placeholder="Hours"
                   
                  />
                  <InputGroup.Text>h</InputGroup.Text>
                  <Form.Control
                    type="number"
                    name="estimatedDurationMinutes"
                    value={formData.estimatedDurationMinutes}
                    onChange={handleInputChange}
                    placeholder="Minutes"
                   
                  />
                  <InputGroup.Text>m</InputGroup.Text>
                </InputGroup>
                {formData.startTime && formData.endTime && (
                  <small className="text-muted">
                    Duration auto-calculated from time range
                  </small>
                )}
              </Form.Group>
            </Row>
            <hr className="my-4" />
            <Row className="mb-3">
              <Form.Group as={Col} controlId="jobName" className="mb-3">
                <RequiredFieldWithTooltip label="Subject" />
                <Form.Control
                  type="text"
                  name="jobName"
                  value={formData.jobName}
                  onChange={handleInputChange}
                  placeholder="Enter Subject"
                />
              </Form.Group>
              <Form.Group controlId="description" className="mb-3">
                <RequiredFieldWithTooltip label="Description" />
                <ReactQuillEditor
                  initialValue={formData.jobDescription} // Pass the initial value
                  onDescriptionChange={handleDescriptionChange} // Handle changes
                />
              </Form.Group>
            </Row>
            <hr className="my-4" />
<h5 className="mb-3">Repeat Settings</h5>

<Row className="mb-3">
  <Form.Group as={Col} md="3">
    <Form.Check
      type="switch"
      id="repeat-switch"
      label="Repeat Job"
      checked={repeatSettings.isRepeat}
      onChange={(e) => handleRepeatSettingChange('isRepeat', e.target.checked)}
    />
  </Form.Group>
</Row>

{repeatSettings.isRepeat && (
  <>
    <Row className="mb-3">
      <Form.Group as={Col} md="4">
        <Form.Label>Repeat Frequency</Form.Label>
        <Form.Select
          value={repeatSettings.frequency}
          onChange={(e) => handleRepeatSettingChange('frequency', e.target.value)}
        >
          {repeatFrequencyOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group as={Col} md="4">
        <Form.Label>Repeat Every</Form.Label>
        <InputGroup>
          <Form.Control
            type="number"
            min="1"
            value={repeatSettings.interval}
            onChange={(e) => handleRepeatSettingChange('interval', e.target.value)}
          />
          <InputGroup.Text>
            {repeatSettings.frequency === 'daily' ? 'Days' :
             repeatSettings.frequency === 'weekly' ? 'Weeks' :
             repeatSettings.frequency === 'monthly' ? 'Months' : ''}
          </InputGroup.Text>
        </InputGroup>
      </Form.Group>
    </Row>

    {repeatSettings.frequency === 'weekly' && (
      <Row className="mb-3">
        <Form.Group as={Col}>
          <Form.Label>Repeat On</Form.Label>
          <div className="d-flex gap-2">
            {weekDayOptions.map(day => (
              <Form.Check
                key={day.value}
                type="checkbox"
                id={`weekday-${day.value}`}
                label={day.label.substring(0, 3)}
                checked={repeatSettings.weekDays.includes(day.value)}
                onChange={() => handleWeekDayToggle(day.value)}
              />
            ))}
          </div>
        </Form.Group>
      </Row>
    )}

    {repeatSettings.frequency === 'monthly' && (
      <Row className="mb-3">
        <Form.Group as={Col} md="4">
          <Form.Label>Day of Month</Form.Label>
          <Form.Control
            type="number"
            min="1"
            max="31"
            value={repeatSettings.monthDay}
            onChange={(e) => handleRepeatSettingChange('monthDay', e.target.value)}
          />
        </Form.Group>
      </Row>
    )}

    <Row className="mb-3">
      <Form.Group as={Col} md="4">
        <Form.Label>End Repeat</Form.Label>
        <Form.Select
          value={repeatSettings.endType}
          onChange={(e) => handleRepeatSettingChange('endType', e.target.value)}
        >
          <option value="never">Never</option>
          <option value="date">On Date</option>
          <option value="occurrences">After Occurrences</option>
        </Form.Select>
      </Form.Group>

      {repeatSettings.endType === 'date' && (
        <Form.Group as={Col} md="4">
          <Form.Label>End Date</Form.Label>
          <Form.Control
            type="date"
            value={repeatSettings.endDate}
            onChange={(e) => handleRepeatSettingChange('endDate', e.target.value)}
            min={formData.startDate}
          />
        </Form.Group>
      )}

      {repeatSettings.endType === 'occurrences' && (
        <Form.Group as={Col} md="4">
          <Form.Label>Number of Occurrences</Form.Label>
          <Form.Control
            type="number"
            min="1"
            value={repeatSettings.occurrences}
            onChange={(e) => handleRepeatSettingChange('occurrences', e.target.value)}
          />
        </Form.Group>
      )}
    </Row>
  </>
)}
            {/* SUBMIT BUTTON! */}
            <Row className="align-items-center">
              <Col md={{ span: 4, offset: 8 }} xs={12} className="mt-4">
                <Button
                  variant="primary"
                  onClick={handleSubmitClick}
                  className="float-end"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Creating Job...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </Col>
            </Row>
          </Form>
        </Tab>
      </Tabs>
      {isSubmitting && (
        <div className={styles.loadingOverlay}>
          <div className="text-center">
            <div className="progress mb-3" style={{ width: "200px" }}>
              <div
                className="progress-bar progress-bar-striped progress-bar-animated"
                role="progressbar"
                style={{ width: `${progress}%` }}
                aria-valuenow={progress}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div className="mt-2">Creating Job...</div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddNewJobs;