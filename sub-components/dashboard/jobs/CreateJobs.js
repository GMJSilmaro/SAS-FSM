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
import { ToastContainer, toast } from "react-toastify";
import JobTask from "./tabs/JobTasklist";
import { useRouter } from "next/router";
import { FlatPickr, FormSelect, DropFiles, ReactQuillEditor } from "widgets";
import { getAuth } from "firebase/auth";

const AddNewJobs = () => {
  const router = useRouter();
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
  };

  const [showServiceLocation, setShowServiceLocation] = useState(true);
  const [showEquipments, setShowEquipments] = useState(true);
  const [jobNo, setJobNo] = useState("0000");
  const [validated, setValidated] = useState(false);
  const [activeKey, setActiveKey] = useState("summary");

  // const fetchCustomers = async () => {
  //   try {
  //     const response = await fetch("/api/getCustomers");
  //     if (!response.ok) {
  //       throw new Error("Failed to fetch customers");
  //     }
  //     const data = await response.json();
  //     if (!Array.isArray(data)) {
  //       throw new Error("Unexpected response format");
  //     }
  //     const formattedOptions = data.map((item) => ({
  //       value: item.cardCode,
  //       label: item.cardCode + " - " + item.cardName,
  //       cardName: item.cardName,
  //     }));
  //     setCustomers(formattedOptions);
  //   } catch (error) {
  //     console.error("Error fetching customers:", error);
  //     setCustomers([]); // Ensure options is an array
  //   }
  // };

  // useEffect(() => {
  //   fetchCustomers();
  // }, []);

  const forceLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include", // This is important for including cookies in the request
      });
      if (response.ok) {
        toast.success(
          "You have been logged out due to an authentication issue."
        );
        router.push("/authentication/sign-in"); // Redirect to login page
      } else {
        throw new Error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout. Please try again.");
    }
  };

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

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/getCustomers");

      // Check if the response is redirected to login page
      if (response.redirected) {
        toast.error("Session expired. Redirecting to login...");
        forceLogout();
        return;
      }

      // Check if the response is OK
      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      // Check content type to ensure it's JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text();
        console.error("Unexpected content type, raw response:", responseText);
        throw new Error("Received non-JSON response");
      }

      // Parse the response to JSON
      const data = await response.json();

      // Validate if the response is an array
      if (!Array.isArray(data)) {
        throw new Error("Unexpected response format. Expected an array.");
      }

      // Format the fetched customer data into options
      const formattedOptions = data.map((item) => ({
        value: item.cardCode,
        label: item.cardCode + " - " + item.cardName,
        cardName: item.cardName,
      }));

      // Set the formatted data in state
      setCustomers(formattedOptions);

      // Remove this toast notification
      // toast.success("Customers fetched successfully");
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
      toast.error(`Error fetching customers: ${error.message}`);
      
      // Add auto-refresh logic here
      setTimeout(() => {
        toast.info("Attempting to refresh the page...");
        window.location.reload();
      }, 5000); // Wait for 5 seconds before refreshing
    }
  };

  useEffect(() => {
    fetchSchedulingWindows();
    fetchCustomers().then(() => {
      if (customers.length > 0) {
        toast.success("Customers fetched successfully");
      }
    });
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map((doc) => ({
          value: doc.id,
          label:
            doc.data().workerId +
            " - " +
            doc.data().firstName +
            " " +
            doc.data().lastName,
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
    console.log("Updated description (HTML):", htmlContent); // Debugging
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
    setSelectedContact(null);
    setSelectedLocation(null);
    setSelectedCustomer(selectedOption);

    const selectedCustomer = customers.find(
      (option) => option.value === selectedOption.value
    );

    setFormData({
      ...formData,
      customerName: selectedCustomer ? selectedCustomer.label : "",
    });

    // Fetch related data for the selected customer
    try {
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
      const formattedContacts = contactsData.map((item) => ({
        value: item.contactId,
        label: item.contactId,
        ...item,
      }));
      setContacts(formattedContacts);

      if (formattedContacts.length === 0) {
        toast.warning("No contacts available for the selected customer.", {
          position: "top-right",
          autoClose: 3000,
        });
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
      const formattedLocations = locationsData.map((item) => ({
        value: item.siteId,
        label: item.siteId,
        ...item,
      }));
      setLocations(formattedLocations);

      if (formattedLocations.length === 0) {
        toast.warning("No locations available for the selected customer.", {
          position: "top-right",
          autoClose: 3000,
        });
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
      const formattedEquipments = equipmentsData.map((item) => ({
        value: item.ItemCode,
        label: item.ItemCode,
        ...item,
      }));
      setEquipments(formattedEquipments);

      if (formattedEquipments.length === 0) {
        toast.warning("No equipment available for the selected customer.", {
          position: "top-right",
          autoClose: 3000,
        });
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
      const formattedServiceCalls = serviceCallsData.map((item) => ({
        value: item.serviceCallID,
        label: item.serviceCallID + " - " + item.subject,
      }));
      setServiceCalls(formattedServiceCalls);

      // Fetch sales orders for the customer
      const salesOrderResponse = await fetch("/api/getSalesOrder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardCode: selectedOption.value }),
      });

      if (!salesOrderResponse.ok) {
        throw new Error("Failed to fetch sales orders");
      }

      const salesOrdersData = await salesOrderResponse.json();
      const formattedSalesOrders = salesOrdersData.map((item) => ({
        value: item.DocNum,
        label: item.DocNum,
      }));
      setSalesOrders(formattedSalesOrders);
    } catch (error) {
      console.error("Error fetching related data:", error);
      setContacts([]);
      setLocations([]);
      setEquipments([]);
      setServiceCalls([]);
      setSalesOrders([]);
    }
  };

  const handleContactChange = (selectedOption) => {
    if (!selectedOption) return;

    const fullName = `${selectedOption.firstName || ""} ${
      selectedOption.middleName || ""
    } ${selectedOption.lastName || ""}`.trim();

    setSelectedContact(selectedOption);

    setFormData((prevFormData) => ({
      ...prevFormData,
      contact: {
        ...prevFormData.contact, // Ensure you don't overwrite other fields like notification
        contactID: selectedOption.value || "",
        contactFullname: fullName,
        firstName: selectedOption.firstName || "",
        middleName: selectedOption.middleName || "",
        lastName: selectedOption.lastName || "",
        phoneNumber: selectedOption.tel1 || "",
        mobilePhone: selectedOption.tel2 || "",
        email: selectedOption.email || "",
      },
    }));
  };

  const handleLocationChange = async (selectedOption) => {
    const selectedLocation = locations.find(
      (location) => location.value === selectedOption.value
    );

    setSelectedLocation(selectedLocation);

    // Update nested `location` and `address` in `formData`
    setFormData((prevFormData) => ({
      ...prevFormData,
      location: {
        ...prevFormData.location, // Spread existing location object
        locationName: selectedLocation.siteId || "",
        address: {
          ...prevFormData.location.address,
          streetNo: selectedLocation.streetNo || "",
          streetAddress: selectedLocation.streetAddress || "",
          block: selectedLocation.block || "",
          buildingNo: selectedLocation.building || "",
          country: selectedLocation.countryName || "",
          stateProvince: selectedLocation.stateProvince || "",
          city: selectedLocation.city || "",
          postalCode: selectedLocation.zipCode || "",
        },
      },
    }));

    try {
      const coordinates = await fetchCoordinates(selectedLocation.street);
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
    } catch (error) {
      console.error("Error fetching coordinates:", error);
    }
  };

  // const handleSelectedEquipmentsChange = (selectedEquipments) => {
  //   setFormData((prevFormData) => ({
  //     ...prevFormData,
  //     equipment: selectedEquipments,
  //   }));
  // };

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
      });
    } else {
      setFormData({
        ...formData,
        scheduleSession: "custom",
        startTime: "",
        endTime: "",
        estimatedDurationHours: "",
        estimatedDurationMinutes: "",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }));

    // SENT API THRU SAP
  };

  const handleSubmitClick = async () => {
    // Validation function to check required fields
    const isValid = () => {
      const requiredFields = [
        formData.jobName,
        formData.startDate,
        formData.endDate,
        formData.contact?.firstName,
        formData.location?.locationName,
      ];

      // Check for empty fields
      for (const field of requiredFields) {
        if (!field || field.trim() === "") {
          return false;
        }
      }

      // Check if there are any assigned workers
      if (selectedWorkers.length === 0) {
        return false;
      }

      return true;
    };

    if (!isValid()) {
      // If validation fails, show a SweetAlert message
      Swal.fire({
        title: "Validation Error!",
        text: "Please fill in all required fields before submitting.",
        icon: "error",
      });
      return;
    }

    // Function to check for overlapping jobs for assigned workers
    const checkForOverlappingJobs = async () => {
      const existingJobsRef = collection(db, "jobs");

      const promises = selectedWorkers.map(async (worker) => {
        console.log(`Checking for overlaps for worker: ${worker.label}`);

        const existingJobsQuery = query(
          existingJobsRef,
          where("assignedWorkers", "array-contains", { workerId: worker.value })
        );

        const querySnapshot = await getDocs(existingJobsQuery);

        const formattedStartDateTime = new Date(
          `${formData.startDate}T${formData.startTime}`
        ).getTime(); // Convert to timestamp
        const formattedEndDateTime = new Date(
          `${formData.endDate}T${formData.endTime}`
        ).getTime(); // Convert to timestamp

        console.log(`Formatted Start Time: ${formattedStartDateTime}`);
        console.log(`Formatted End Time: ${formattedEndDateTime}`);

        for (const doc of querySnapshot.docs) {
          const jobData = doc.data();
          const jobStartDateTime = new Date(jobData.startDate).getTime();
          const jobEndDateTime = new Date(jobData.endDate).getTime();

          console.log(`Checking job: ${jobData.jobName || "Unnamed Job"}`);
          console.log(
            `Job Start Time: ${jobStartDateTime}, Job End Time: ${jobEndDateTime}`
          );

          // Check for overlap
          if (
            (formattedStartDateTime < jobEndDateTime &&
              formattedEndDateTime > jobStartDateTime) || // New job starts before existing job ends
            (jobStartDateTime < formattedEndDateTime &&
              jobEndDateTime > formattedStartDateTime) // Existing job starts before new job ends
          ) {
            console.log(`Overlap found for worker: ${worker.label}`);
            return {
              workerId: worker.value,
              message: `Worker ${worker.label} is already assigned to another job during this schedule.`,
            };
          }
        }

        console.log(`No overlap found for worker: ${worker.label}`);
      });

      const results = await Promise.all(promises);
      const errors = results.filter((result) => result !== undefined);

      console.log(`Overlap checking completed. Found ${errors.length} errors.`);
      return errors; // Return any overlap errors found
    };

    // Check for overlaps before creating the job
    const overlapErrors = await checkForOverlappingJobs();
    if (overlapErrors.length > 0) {
      // If there are any overlap errors, display them
      const errorMessages = overlapErrors
        .map((error) => error.message)
        .join("\n");
      Swal.fire({
        title: "Overlap Error!",
        text: errorMessages,
        icon: "error",
      });
      return;
    }

    try {
      const formattedStartDateTime = formatDateTime(
        formData.startDate,
        formData.startTime
      );
      const formattedEndDateTime = formatDateTime(
        formData.endDate,
        formData.endTime
      );

      const assignedWorkers = selectedWorkers.map((worker) => ({
        workerId: worker.value,
      }));

      const updatedFormData = {
        ...formData,
        jobID: jobNo,
        jobNo: jobNo,
        serviceCallID: selectedServiceCall ? selectedServiceCall.value : "",
        salesOrderID: selectedSalesOrder ? selectedSalesOrder.value : "",
        assignedWorkers,
        customerID: selectedCustomer ? selectedCustomer.value : "",
        startDate: formattedStartDateTime,
        endDate: formattedEndDateTime,
        location: selectedLocation
          ? {
              locationName: selectedLocation.label,
              address: {
                streetNo: selectedLocation.streetNo || "",
                streetAddress: selectedLocation.street || "",
                block: selectedLocation.block || "",
                city: selectedLocation.city || "",
                stateProvince: selectedLocation.stateProvince || "",
                postalCode: selectedLocation.postalCode || "",
              },
              coordinates: {
                latitude: formData.location.coordinates.latitude,
                longitude: formData.location.coordinates.longitude,
              },
            }
          : null,
        taskList: tasks.map((task) => ({
          taskID: task.taskID || "",
          taskName: task.taskName || "",
          taskDescription: task.taskDescription || "",
          assignedTo: task.assignedTo || "",
          isPriority: task.isPriority || false,
          isDone: task.isDone || false,
          completionDate: task.completionDate || null,
        })),
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
        customerSignature: {
          signatureURL: formData.customerSignature.signatureURL || "",
          signedBy: formData.contactFullname || "",
          signatureTimestamp:
            formData.customerSignature.signatureTimestamp || null,
        },
      };

      // Save the job document
      const jobRef = doc(db, "jobs", jobNo);
      await setDoc(jobRef, updatedFormData);

      // Step 1: Get the authenticated user's UID
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const uid = currentUser?.uid || "anonymous";

      console.log(
        "Searching for workerId by matching uid in users collection:",
        uid
      );

      // Step 2: Load all user documents
      const usersCollectionRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollectionRef);

      let workerId = null;
      let userId = null;
      let fullName = "anonymous"; // Default value if no match is found

      // Step 3: Loop through each user document and check if `uid` matches
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.uid === uid) {
          workerId = userData.workerId;
          userId = userData.userId; // Get the workerId from the document where uid matches
          console.log("Matching workerId found:", workerId);
        }
      });

      // Step 4: If a workerId was found, use it to get the user's full name
      if (workerId) {
        const workerDocRef = doc(db, "users", workerId); // Now fetch the document by workerId
        const workerDoc = await getDoc(workerDocRef);

        if (workerDoc.exists()) {
          const workerData = workerDoc.data();
          if (workerData.fullName) {
            fullName = workerData.fullName; // Get the fullName from the worker document
            console.log("Full name found:", fullName);
          }
        } else {
          console.log(`No document found for workerId: ${workerId}`);
        }
      } else {
        console.log("No matching user found for the current UID");
      }

      const jobCreatedNotificationRef = collection(db, `notifications`);

      const jobCreatedNotificationEntry = {
        userID: "all",
        workerId: "all",
        jobID: jobNo,
        notificationType: "Job Created", // Notification type for job creation
        message: `Job ${formData.jobName} was created by ${fullName}.`,
        timestamp: Timestamp.now(),
        readBy: {},
      };

      const docRefCreated = await addDoc(
        jobCreatedNotificationRef,
        jobCreatedNotificationEntry
      );
      console.log(
        `Job Created notification added with ID: ${docRefCreated.id}`
      );

      assignedWorkers.forEach(async (worker) => {
        const notificationRef = collection(db, `notifications`);

        // Define the notification entry for each worker
        const notificationEntry = {
          userID: userId || "unknown",
          workerId: worker.workerId,
          jobID: jobNo,
          notificationType: "Job Assigned",
          message: `You have been assigned to Job ${formData.jobName}.`,
          timestamp: Timestamp.now(), // Current timestamp
          read: false, // Initially unread
        };

        // Add the notification entry for the current worker using `addDoc` to generate an auto ID
        const docRef = await addDoc(notificationRef, notificationEntry);
        console.log(
          `Notification created for worker ${worker.workerId} with ID: ${docRef.id}`
        );
      });

      const logRef = doc(db, `jobs/${jobNo}/logs`, jobNo);
      const logEntry = {
        logID: `${jobNo}`,
        jobID: jobNo,
        workerId: workerId || "unknown",
        uid: uid,
        event: "Job Created",
        details: `Job ${formData.jobName} was created by ${fullName}.`, // Use the full name here
        previousStatus: null,
        newStatus: formData.jobStatus,
        timestamp: Timestamp.now(),
        relatedDocuments: {},
      };

      // Use `setDoc` to save the document with `jobNo` as the ID
      await setDoc(logRef, logEntry);

      // Show success SweetAlert and redirect after clicking OK
      Swal.fire({
        title: "Success!",
        text: "Job created successfully.",
        icon: "success",
      }).then(() => {
        setTimeout(() => {
          window.location.reload();
        }, 100);
      });

      // Clear the form data after submission
      setFormData(initialFormData);

      // Increment jobNo for the UI
      setJobNo((prevJobNo) =>
        (parseInt(prevJobNo, 10) + 1).toString().padStart(6, "0")
      );
    } catch (e) {
      console.error("Error adding document: ", e);
      toast.error("An error occurred while saving data.");

      Swal.fire({
        title: "Error!",
        text: "An error occurred while saving data.",
        icon: "error",
      });
    }
  };

  const handleSubmit = (event) => {
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    }
    setValidated(true);
  };

  // Function to toggle the visibility of the Service Location section
  const toggleServiceLocation = () => {
    setShowServiceLocation(!showServiceLocation);
  };

  // Function to toggle the visibility of the Equipments section
  const toggleEquipments = () => {
    setShowEquipments(!showEquipments);
  };

  return (
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
              <Form.Label>Search Customer</Form.Label>
              <Select
                instanceId="customer-select"
                options={customers}
                value={selectedCustomer}
                onChange={handleCustomerChange}
                placeholder="Enter Customer Name"
              />
            </Form.Group>
          </Row>

          <hr className="my-4" />
          <h5 className="mb-1">Primary Contact</h5>
          <p className="text-muted">Details about the customer.</p>

          <Row className="mb-3">
            <Form.Group as={Col} md="3" controlId="jobWorker">
              <Form.Label>Select Contact ID</Form.Label>
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
            <Form.Group as={Col} md="4" controlId="validationCustomPhoneNumber">
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
            <Form.Group as={Col} md="4" controlId="validationCustomMobilePhone">
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
                  <Form.Label>Select Location ID</Form.Label>
                  <Select
                    instanceId="location-select"
                    options={locations}
                    value={selectedLocation}
                    onChange={handleLocationChange}
                    placeholder="Select Location ID"
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
                  style={{ width: "95px" }}
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
                onChange={(selectedOption) =>
                  setSelectedServiceCall(selectedOption)
                }
                placeholder="Select Service Call"
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
                placeholder="Select Sales Order"
              />
            </Form.Group>

            <Form.Group as={Col} controlId="jobName">
              <Form.Label>Job Name</Form.Label>
              <Form.Control
                type="text"
                name="jobName"
                value={formData.jobName}
                onChange={handleInputChange}
                placeholder="Enter Job Name"
              />
            </Form.Group>
          </Row>
          <Row className="mb-3">
            <Form.Group controlId="description">
              <Form.Label>Description</Form.Label>
              <ReactQuillEditor
                initialValue={formData.jobDescription} // Pass the initial value
                onDescriptionChange={handleDescriptionChange} // Handle changes
              />
            </Form.Group>
          </Row>
          <Row className="mb-3">
            <Form.Group as={Col} md="4" controlId="jobCategory">
              <Form.Label>Job Priority</Form.Label>
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
              <Form.Label>Assigned Worker</Form.Label>
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
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                placeholder="Enter start date"
              />
            </Form.Group>
            <Form.Group as={Col} md="4" controlId="endDate">
              <Form.Label>End Date</Form.Label>
              <Form.Control
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                placeholder="Enter end date"
              />
            </Form.Group>
            <Form.Group as={Col} md="4" controlId="scheduleSession">
              <Form.Label>Schedule Session</Form.Label>
              <Form.Select
                name="scheduleSession"
                value={formData.scheduleSession}
                onChange={handleScheduleSessionChange}
                aria-label="Select schedule session"
              >
                <option value="">Select a session</option>{" "}
                <option value="">Custom</option> {/* Placeholder option */}
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
              <Form.Label>Start Time</Form.Label>
              <Form.Control
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                readOnly={formData.scheduleSession !== "custom"}
              />
            </Form.Group>

            <Form.Group as={Col} md="4" controlId="endTime">
              <Form.Label>End Time</Form.Label>
              <Form.Control
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                readOnly={formData.scheduleSession !== "custom"}
              />
            </Form.Group>

            <Form.Group as={Col} md="3" controlId="estimatedDuration">
              <Form.Label>Estimated Duration</Form.Label>
              <InputGroup>
                <Form.Control
                  type="number"
                  name="estimatedDurationHours"
                  value={formData.estimatedDurationHours}
                  onChange={handleInputChange}
                  placeholder="Hours"
                  readOnly={formData.scheduleSession !== "custom"}
                />
                <InputGroup.Text>h</InputGroup.Text>
                <Form.Control
                  type="number"
                  name="estimatedDurationMinutes"
                  value={formData.estimatedDurationMinutes}
                  onChange={handleInputChange}
                  placeholder="Minutes"
                  readOnly={formData.scheduleSession !== "custom"}
                />
                <InputGroup.Text>m</InputGroup.Text>
              </InputGroup>
            </Form.Group>
          </Row>
          <hr className="my-4" />
          {/* <p className="text-muted">Notification:</p>
          <Row className="mt-3">
            <Form.Group controlId="adminWorkerNotify">
              <Form.Check
                type="checkbox"
                name="adminWorkerNotify"
                checked={formData.adminWorkerNotify}
                onChange={handleInputChange}
                label="Admin/Worker: Notify when Job Status changed and new Job message Submitted"
              />
            </Form.Group>
            <Form.Group controlId="customerNotify">
              <Form.Check
                type="checkbox"
                name="customerNotify"
                checked={formData.customerNotify}
                onChange={handleInputChange}
                label="Customer: Notify when Job Status changed and new Job message Submitted"
              />
            </Form.Group>
          </Row> */}
          {/* SUBMIT BUTTON! */}
          <Row className="align-items-center">
            <Col md={{ span: 4, offset: 8 }} xs={12} className="mt-4">
              <Button
                variant="primary"
                onClick={handleSubmitClick}
                className="float-end"
              >
                Submit
              </Button>
            </Col>
          </Row>
        </Form>
      </Tab>
    </Tabs>
  );
};

export default AddNewJobs;
