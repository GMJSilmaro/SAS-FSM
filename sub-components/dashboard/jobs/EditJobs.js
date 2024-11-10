"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
  updateDoc,
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
import EditJobPage from "@/pages/dashboard/jobs/edit-jobs/[id]";
import TaskList from "./TaskList";
import EquipmentsUpdateTable from "../../../pages/dashboard/tables/datatable-equipments-update";
import Cookies from "js-cookie"; // Assuming you're using js-cookie for cookie management

const EditJobs = ({ initialJobData, jobId: jobIdProp, validateJobForm }) => {
  const router = useRouter();
  const { startDate, endDate, startTime, endTime, workerId, scheduleSession } =
    router.query;
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [showServiceLocation, setShowServiceLocation] = useState(true);
  const [showEquipments, setShowEquipments] = useState(true);
  const [activeKey, setActiveKey] = useState("summary");

  // Form state
  const [formData, setFormData] = useState(initialJobData || {});
  const [originalData, setOriginalData] = useState(initialJobData || {});

  // Selection states
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [selectedServiceCall, setSelectedServiceCall] = useState(null);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState(null);
  const [selectedJobContactType, setSelectedJobContactType] = useState(null);

  // Data lists
  const [customers, setCustomers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [serviceCalls, setServiceCalls] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [schedulingWindows, setSchedulingWindows] = useState([]);
  const [jobContactTypes, setJobContactTypes] = useState([]);
  const [tasks, setTasks] = useState(initialJobData?.taskList || []);

  // Other states
  const [jobNo, setJobNo] = useState("0000");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    console.log("Initial Job Data: ", initialJobData); // Log the data
    setTasks(initialJobData?.taskList || []);
  }, [initialJobData]);

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

  // Keep all the handler functions from CreateJobs
  const handleTaskChange = (index, field, value) => {
    const updatedTasks = [...tasks];
    updatedTasks[index][field] = value;
    setTasks(updatedTasks);
  };

  const handleCheckboxChange = (index, field) => {
    const updatedTasks = [...tasks];
    updatedTasks[index][field] = !updatedTasks[index][field];
    setTasks(updatedTasks);
  };

  const deleteTask = async (index) => {
    try {
      const taskToDelete = tasks[index];

      if (taskToDelete.taskID && taskToDelete.taskID.startsWith("firebase-")) {
        setTasks((prevTasks) => {
          const updatedTasks = [...prevTasks];
          updatedTasks[index] = {
            ...updatedTasks[index],
            isDeleted: true,
            deletedAt: Timestamp.now(),
          };
          return updatedTasks;
        });
      } else {
        setTasks((prevTasks) => prevTasks.filter((_, i) => i !== index));
      }

      setHasChanges(true);
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
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

  // Update the initial data loading effect
  useEffect(() => {
    if (initialJobData?.assignedWorkers) {
      console.log(
        "Initial assigned workers data:",
        initialJobData.assignedWorkers
      );

      // First, wait for workers list to be loaded
      const mappedWorkers = initialJobData.assignedWorkers.map((worker) => {
        // Find the matching worker from the workers list to get the full name
        const matchingWorker = workers.find((w) => w.value === worker.workerId);

        return {
          value: worker.workerId,
          label: matchingWorker ? matchingWorker.label : worker.workerName, // Use workerName as fallback
        };
      });

      console.log("Mapped initial workers:", mappedWorkers);
      setSelectedWorkers(mappedWorkers);
    }
  }, [initialJobData, workers]); // Add workers to dependency array

  // URL parameters useEffect
  useEffect(() => {
    if (router.isReady && formData) {
      let updatedFormData = { ...formData };

      if (router.query.startDate) {
        updatedFormData.startDate = router.query.startDate;
      }

      if (router.query.endDate) {
        updatedFormData.endDate = router.query.endDate;
      }

      if (router.query.startTime) {
        updatedFormData.startTime = router.query.startTime;
      }

      if (router.query.endTime) {
        updatedFormData.endTime = router.query.endTime;
      }

      if (router.query.scheduleSession) {
        updatedFormData.scheduleSession = router.query.scheduleSession;
      }

      setFormData(updatedFormData);

      // Handle worker selection if workerId is provided
      if (router.query.workerId && workers.length > 0) {
        const selectedWorker = workers.find(
          (worker) => worker.value === router.query.workerId
        );
        if (selectedWorker) {
          setSelectedWorkers([selectedWorker]);
        }
      }
    }
  }, [router.isReady, router.query, workers]);

  // Workers fetch useEffect
  // Add this useEffect near your other useEffect hooks
  useEffect(() => {
    const fetchCustomers = async () => {
      console.log("🚀 Starting customer fetch...");

      try {
        console.log("📡 Making API request to /api/getCustomers");
        const response = await fetch("/api/getCustomers", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log(" Response received:", {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch customers: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("✅ Parsed customer data:", {
          count: data.length,
          firstCustomer: data[0],
          lastCustomer: data[data.length - 1],
        });

        const formattedCustomers = data.map((customer) => ({
          value: customer.cardCode,
          label: `${customer.cardCode} - ${customer.cardName}`,
          cardCode: customer.cardCode,
          cardName: customer.cardName,
        }));

        console.log("🔄 Formatted customers:", {
          count: formattedCustomers.length,
          firstCustomer: formattedCustomers[0],
          lastCustomer: formattedCustomers[formattedCustomers.length - 1],
        });

        setCustomers(formattedCustomers);
        console.log("💾 Customers saved to state");

        // If we have initialJobData, set the initial customer selection
        if (initialJobData?.customerID) {
          console.log(
            "🔍 Looking for initial customer:",
            initialJobData.customerID
          );
          const initialCustomer = formattedCustomers.find(
            (c) => c.cardCode === initialJobData.customerID
          );
          if (initialCustomer) {
            console.log("✨ Found initial customer:", initialCustomer);
            setSelectedCustomer(initialCustomer);
            handleCustomerChange(initialCustomer);
          } else {
            console.log("⚠️ Initial customer not found in data");
          }
        }
      } catch (error) {
        console.error("❌ Error fetching customers:", {
          message: error.message,
          error: error,
        });
        toast.error("Failed to load customers data", {
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

    console.log("🏁 Initiating customer fetch useEffect");
    fetchCustomers();
  }, []); // Empty dependency array means this runs once on component mount

  useEffect(() => {
    // Fetch workers from Firestore
    const fetchWorkers = async () => {
      try {
        const usersRef = collection(db, "users"); // Reference to the "users" collection
        const snapshot = await getDocs(usersRef); // Fetch documents from the "users" collection
        const workersData = snapshot.docs.map((doc) => ({
          value: doc.id, // Use document ID as workerId
          label: doc.data().fullName, // Assuming the worker's name is stored in the "name" field
        }));

        setWorkers(workersData);
      } catch (error) {
        console.error("Error fetching workers:", error);
      }
    };

    fetchWorkers();
  }, []);

  // Update the worker selection handler
  const handleWorkersChange = (selected) => {
    console.log("Worker selection changed:", selected);
    setSelectedWorkers(selected || []);

    const formattedWorkers = (selected || []).map((worker) => ({
      workerId: worker.value,
      workerName: worker.label,
    }));

    setFormData((prev) => ({
      ...prev,
      assignedWorkers: formattedWorkers,
    }));

    setHasChanges(true);
  };

  const handleCustomerChange = async (selectedOption) => {
    console.log("handleCustomerChange triggered with:", selectedOption);

    if (!selectedOption) {
      // Handle clearing the selection
      setSelectedContact(null);
      setSelectedLocation(null);
      setSelectedCustomer(null);
      setSelectedServiceCall(null);
      setSelectedSalesOrder(null);
      setContacts([]);
      setLocations([]);
      setEquipments([]);
      setServiceCalls([]);
      setSalesOrders([]);
      setFormData((prev) => ({
        ...prev,
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
            notifyCustomer: false,
          },
        },
      }));
      return;
    }

    setSelectedContact(null);
    setSelectedLocation(null);
    setSelectedCustomer(selectedOption);
    setSelectedServiceCall(null);
    setSelectedSalesOrder(null);

    const selectedCustomer = customers.find(
      (option) => option.value === selectedOption.value
    );

    console.log("Selected customer:", selectedCustomer);

    setFormData((prevFormData) => ({
      ...prevFormData,
      customerID: selectedCustomer ? selectedCustomer.cardCode : "",
      customerName: selectedCustomer ? selectedCustomer.cardName : "",
    }));

    try {
      console.log("Fetching related data for customer:", selectedOption.value);

      // Fetch contacts
      const contactsResponse = await fetch("/api/getContacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardCode: selectedOption.value }),
      });

      if (!contactsResponse.ok) throw new Error("Failed to fetch contacts");
      const contactsData = await contactsResponse.json();
      console.log("Fetched contacts:", contactsData);

      const formattedContacts = contactsData.map((item) => ({
        value: item.contactId,
        label: item.contactId,
        ...item,
      }));
      setContacts(formattedContacts);

      // Fetch locations
      const locationsResponse = await fetch("/api/getLocation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardCode: selectedOption.value }),
      });

      if (!locationsResponse.ok) throw new Error("Failed to fetch locations");
      const locationsData = await locationsResponse.json();
      console.log("Fetched locations:", locationsData);

      const formattedLocations = locationsData.map((item) => ({
        value: item.siteId,
        label: item.siteId,
        ...item,
      }));
      setLocations(formattedLocations);

      // Fetch equipments
      const equipmentsResponse = await fetch("/api/getEquipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardCode: selectedOption.value }),
      });

      if (!equipmentsResponse.ok) throw new Error("Failed to fetch equipments");
      const equipmentsData = await equipmentsResponse.json();
      console.log("Fetched equipments:", equipmentsData);

      const formattedEquipments = equipmentsData.map((item) => ({
        value: item.ItemCode,
        label: `${item.ItemCode} - ${item.ItemName}`,
        ItemCode: item.ItemCode,
        ItemName: item.ItemName,
        ItemGroup: item.ItemGroup,
        Brand: item.Brand,
        EquipmentLocation: item.EquipmentLocation,
        EquipmentType: item.EquipmentType,
        ModelSeries: item.ModelSeries,
        SerialNo: item.SerialNo,
        Notes: item.Notes,
        WarrantyStartDate: item.WarrantyStartDate,
        WarrantyEndDate: item.WarrantyEndDate,
      }));
      console.log("Formatted equipments:", formattedEquipments);
      setEquipments(formattedEquipments);

      // Fetch service calls
      const serviceCallResponse = await fetch("/api/getServiceCall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardCode: selectedOption.value }),
      });

      if (!serviceCallResponse.ok)
        throw new Error("Failed to fetch service calls");
      const serviceCallsData = await serviceCallResponse.json();
      console.log("Fetched service calls:", serviceCallsData);

      const formattedServiceCalls = serviceCallsData.map((item) => ({
        value: item.serviceCallID,
        label: `${item.serviceCallID} - ${item.subject}`,
      }));
      setServiceCalls(formattedServiceCalls);

      // Clear sales orders when customer changes
      setSalesOrders([]);

      // Show success/warning toasts for each data type
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
      }

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
      }

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
      }

      // Set hasChanges to true since customer selection changed
      setHasChanges(true);
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
    setHasChanges(true);
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
    setHasChanges(true);
  };

  const handleLocationChange = (selectedOption) => {
    const selectedLocation = locations.find(
      (location) => location.value === selectedOption.value
    );

    setSelectedLocation(selectedLocation);

    // Update nested `location` and `address` in `formData`
    setFormData((prevFormData) => ({
      ...prevFormData,
      location: {
        ...prevFormData.location, // Spread existing location object
        locationName: selectedLocation.label || "",
        address: {
          ...prevFormData.location.address,
          streetNo: selectedLocation.streetNo || "",
          streetAddress: selectedLocation.street || "",
          block: selectedLocation.block || "",
          buildingNo: selectedLocation.building || "",
          country: selectedLocation.countryName || "",
          stateProvince: selectedLocation.stateProvince || "",
          city: selectedLocation.city || "",
          postalCode: selectedLocation.zipCode || "",
        },
        coordinates: {
          latitude: selectedLocation.latitude || 0,
          longitude: selectedLocation.longitude || 0,
        },
      },
    }));

    try {
      // No external fetch required; data is updated synchronously.
    } catch (error) {
      console.error("Error handling location change:", error);
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

      // Reset related state on error
      setContacts([]);
      setLocations([]);
      setEquipments([]);
      setServiceCalls([]);
      setSalesOrders([]);
    }
  };

  const handleSelectedServiceCallChange = async (selectedServiceCall) => {
    setSelectedServiceCall(selectedServiceCall);

    if (selectedServiceCall) {
      try {
        const response = await fetch("/api/getSalesOrders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            serviceCallId: selectedServiceCall.value,
            cardCode: formData.customerID,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch sales orders");
        }

        const data = await response.json();
        const formattedSalesOrders = data.map((order) => ({
          value: order.docNum,
          label: `${order.docNum} - ${order.docDate}`,
          ...order,
        }));

        setSalesOrders(formattedSalesOrders);
      } catch (error) {
        console.error("Error fetching sales orders:", error);
        toast.error("Failed to fetch sales orders");
        setSalesOrders([]);
      }
    } else {
      setSalesOrders([]);
      setSelectedSalesOrder(null);
    }
    setHasChanges(true);
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

  // Add this useEffect to initialize equipment data from initialJobData
  useEffect(() => {
    console.log(
      "Initial Job Equipments:",
      initialJobData?.equipments?.map((e) => ({
        serialNo: e.serialNo,
        modelSeries: e.modelSeries,
      })) || []
    );

    console.log(
      "Available Equipment List:",
      equipments.map((e) => ({
        serialNo: e.SerialNo,
        modelSeries: e.ModelSeries,
      }))
    );

    const syncedEquipments = (initialJobData?.equipments || [])
      .map((equipment) => {
        const matchingEquipment = equipments.find((e) => {
          const isMatch =
            e.SerialNo === equipment.serialNo &&
            e.ModelSeries === equipment.modelSeries;

          if (isMatch) {
            console.log("Found matching equipment:", {
              serialNo: equipment.serialNo,
              modelSeries: equipment.modelSeries,
            });
          }

          return isMatch;
        });

        if (!matchingEquipment) {
          console.log("No match found for equipment:", {
            serialNo: equipment.serialNo,
            modelSeries: equipment.modelSeries,
          });
          return null;
        }

        return {
          ...matchingEquipment,
          serialNo: equipment.serialNo,
          modelSeries: equipment.modelSeries,
          notes: equipment.notes || matchingEquipment.Notes,
          equipmentLocation:
            equipment.equipmentLocation || matchingEquipment.EquipmentLocation,
        };
      })
      .filter(Boolean);

    console.log("Final synced equipments:", syncedEquipments);
    setSelectedEquipments(syncedEquipments);
  }, [equipments, initialJobData]);

  // Update the equipment selection handler
  const handleSelectedEquipmentsChange = (selected) => {
    console.log("Equipment selection changed. New selection:", selected);
    setSelectedEquipments(selected || []);

    const formattedEquipments = (selected || []).map((equipment) => {
      const formatted = {
        itemCode: equipment.ItemCode,
        itemName: equipment.ItemName,
        itemGroup: equipment.ItemGroup,
        brand: equipment.Brand,
        equipmentLocation: equipment.EquipmentLocation,
        equipmentType: equipment.EquipmentType,
        modelSeries: equipment.ModelSeries,
        serialNo: equipment.SerialNo,
        notes: equipment.Notes,
        warrantyStartDate: equipment.WarrantyStartDate,
        warrantyEndDate: equipment.WarrantyEndDate,
      };
      console.log("Formatted equipment for form data:", formatted);
      return formatted;
    });

    console.log("Final formatted equipments for form:", formattedEquipments);
    setFormData((prev) => ({
      ...prev,
      equipments: formattedEquipments,
    }));

    setHasChanges(true);
  };

  const handleNextClick = () => {
    if (activeKey === "summary") {
      setActiveKey("task");
    } else if (activeKey === "task") {
      setActiveKey("scheduling");
    }
  };

  const handleScheduleSessionChange = (e) => {
    const { value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      scheduleSession: value,
      // Reset time fields if not custom
      startTime: value !== "custom" ? "" : prevState.startTime,
      endTime: value !== "custom" ? "" : prevState.endTime,
    }));
    setHasChanges(true);
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
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    setHasChanges(true);
  };

  // Function to check for overlapping jobs with improved date handling and worker schedule checking
  const checkForOverlappingJobs = async (jobData, existingJobId) => {
    try {
      // Check if we have selected workers from the form
      if (!selectedWorkers || selectedWorkers.length === 0) {
        return { hasConflicts: false, conflicts: [] };
      }

      const conflicts = [];
      const startDateTime = new Date(
        `${jobData.startDate}T${jobData.startTime}`
      );
      const endDateTime = new Date(`${jobData.endDate}T${jobData.endTime}`);

      // Use selectedWorkers instead of jobData.assignedWorkers
      for (const worker of selectedWorkers) {
        // Ensure worker has required properties
        if (!worker || !worker.label) {
          continue;
        }

        try {
          // Query using worker.value (worker ID) instead of workerName
          const jobsQuery = query(
            collection(db, "jobs"),
            where("assignedWorkers", "array-contains", {
              workerId: worker.value,
              workerName: worker.label,
            }),
            where("startDate", "<=", jobData.endDate),
            where("endDate", ">=", jobData.startDate)
          );

          const querySnapshot = await getDocs(jobsQuery);

          querySnapshot.forEach((doc) => {
            // Skip comparing with the current job being edited
            if (doc.id === existingJobId) return;

            const job = doc.data();
            const jobStart = new Date(`${job.startDate}T${job.startTime}`);
            const jobEnd = new Date(`${job.endDate}T${job.endTime}`);

            if (
              (startDateTime <= jobEnd && endDateTime >= jobStart) ||
              (jobStart <= endDateTime && jobEnd >= startDateTime)
            ) {
              conflicts.push({
                worker: worker.label,
                conflictingJob: {
                  jobNo: job.jobNo,
                  startDate: job.startDate,
                  endDate: job.endDate,
                  startTime: job.startTime,
                  endTime: job.endTime,
                },
              });
            }
          });
        } catch (error) {
          console.error(
            `Error checking conflicts for worker ${worker.label}:`,
            error
          );
        }
      }

      return {
        hasConflicts: conflicts.length > 0,
        conflicts,
      };
    } catch (error) {
      console.error("Error checking for schedule conflicts:", error);
      throw new Error(`Failed to check schedule conflicts: ${error.message}`);
    }
  };

  function formatDateTime(date, time) {
    // Assuming the date is in 'YYYY-MM-DD' format and time is in 'HH:mm' format
    const [year, month, day] = date.split("-");
    const [hours, minutes] = time.split(":");

    // Constructing a Date object using the components
    const formattedDateTime = new Date(year, month - 1, day, hours, minutes);

    return formattedDateTime;
  }

  // Updated handleSubmitClick for editing

  const handleSubmitClick = async () => {
    const auth = getAuth();

    try {
      // Get cookies related to the current user
      const userCookies = {
        email: Cookies.get("email"), // Email stored in cookie
        uid: Cookies.get("uid"), // User ID stored in cookie
        workerId: Cookies.get("workerId"), // Worker ID stored in cookie
        isAdmin: Cookies.get("isAdmin") === "true", // Convert string to boolean
        sessionExpiry: Cookies.get("B1SESSION_EXPIRY"), // Session expiry
      };

      console.log("User Cookies:", userCookies); // Log user cookies for verification

      // Log all form data before submission
      console.log("=== FORM SUBMISSION DATA ===");
      console.log("Form Data:", {
        ...formData,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
      });
      console.log("Selected Customer:", selectedCustomer);
      console.log("Selected Contact:", selectedContact);
      console.log("Selected Location:", selectedLocation);
      console.log("Selected Service Call:", selectedServiceCall);
      console.log("Selected Sales Order:", selectedSalesOrder);
      console.log("Selected Workers:", selectedWorkers);
      console.log("Tasks:", tasks);
      console.log("Job Contact Type:", selectedJobContactType);
      console.log("=== END FORM DATA ===");

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
        console.log("Missing Required Fields:", missingFields);
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

      console.log("Starting submission process...");
      setProgress(20);

      // Format the workers data before submission
      const formattedWorkers = selectedWorkers.map((worker) => ({
        workerId: worker.value,
        workerName: worker.label,
      }));

      async function getUserDisplayName(workerId) {
        try {
          const userRef = doc(db, "users", workerId); // Reference to the user's document using workerId
          const userDoc = await getDoc(userRef); // Get the document

          if (userDoc.exists()) {
            return userDoc.data().fullName || "Anonymous"; // Return the displayName or default to "Anonymous"
          } else {
            console.error("User not found");
            return "Anonymous"; // Default if no user is found
          }
        } catch (error) {
          console.error("Error getting user displayName:", error);
          return "Anonymous"; // Default in case of error
        }
      }
      // Create the initial form data with worker information
      const updatedFormData = {
        ...formData,
        assignedWorkers: formattedWorkers,
        updatedAt: Timestamp.now(),
        updatedBy: {
          workerId: userCookies.workerId, // Use the current user's UID
          fullName: await getUserDisplayName(userCookies.workerId), // Retrieve displayName from Firestore
          timestamp: Timestamp.now(),
        },
      };

      // Check for conflicts with the formatted data
      const conflicts = await checkForOverlappingJobs(
        updatedFormData,
        jobIdProp
      );

      if (conflicts.hasConflicts) {
        // Create a formatted message showing all conflicts
        const conflictMessage = conflicts.conflicts
          .map(
            (conflict) =>
              `• ${conflict.worker} has a scheduling conflict with Job #${conflict.conflictingJob.jobNo} (${conflict.conflictingJob.startDate} ${conflict.conflictingJob.startTime} - ${conflict.conflictingJob.endTime})`
          )
          .join("\n");

        const result = await Swal.fire({
          title: "Schedule Conflicts Detected",
          html: `
        <div class="text-start">
          <p class="mb-3">The following scheduling conflicts were found:</p>
          <div class="alert alert-warning">
            ${conflicts.conflicts
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

      // Format dates
      console.log("Formatting dates and preparing form data...");
      setProgress(60);
      const formattedStartDateTime = formatDateTime(
        formData.startDate,
        formData.startTime
      );
      const formattedEndDateTime = formatDateTime(
        formData.endDate,
        formData.endTime
      );

      // Update the form data with formatted dates
      const finalFormData = {
        ...updatedFormData,
        formattedStartDateTime,
        formattedEndDateTime,
      };

      // Save to Firestore
      console.log("Saving to Firestore...");
      const jobRef = doc(db, "jobs", jobIdProp);
      await updateDoc(jobRef, finalFormData);

      console.log("Successfully saved to Firestore");
      setProgress(100);

      // Update success message for edit mode
      const handleSubmitSuccess = async (jobDetails) => {
        const result = await Swal.fire({
          title:
            '<div class="d-flex align-items-center justify-content-center gap-2">' +
            "<span>Job Updated Successfully!</span>" +
            '<span class="animate__animated animate__bounceIn">✅</span>' +
            "</div>",
          html: `
        <div class="text-start">
          <div class="card border-success mb-3">
            <div class="card-header bg-success text-white">
              <i class="fas fa-info-circle me-2"></i>Updated Job Details
            </div>
            <div class="card-body">
              <ul class="list-group list-group-flush">
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <span><i class="fas fa-hashtag me-2 text-primary"></i>Job No:</span>
                  <span class="badge bg-primary">${jobIdProp}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <span><i class="fas fa-building me-2 text-info"></i>Customer:</span>
                  <span class="text-truncate ms-2" style="max-width: 200px;">${
                    selectedCustomer?.label || ""
                  }</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <span><i class="fas fa-calendar me-2 text-warning"></i>Schedule:</span>
                  <span>${formData.startDate} ${formData.startTime}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <span><i class="fas fa-users me-2 text-success"></i>Workers:</span>
                  <span class="badge bg-success">${
                    selectedWorkers.length
                  }</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      `,
          icon: "success",
          showConfirmButton: true,
          confirmButtonText: '<i class="fas fa-list me-2"></i>View Jobs List',
          showCancelButton: true,
          cancelButtonText: '<i class="fas fa-edit me-2"></i>Continue Editing',
          confirmButtonColor: "#28a745",
          cancelButtonColor: "#17a2b8",
        });

        if (result.isConfirmed) {
          router.push("/dashboard/jobs/list-jobs");
        }
      };

      handleSubmitSuccess(finalFormData);
      setHasChanges(false);
    } catch (error) {
      console.error("Error in submission:", error);
      toast.error(`Error: ${error.message}`);
      await Swal.fire({
        title: "Error!",
        text: error.message || "An error occurred while updating the job.",
        icon: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      setValidated(true);
      return;
    }

    handleSubmitClick();
  };

  // Add this state for tracking changes
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validated, setValidated] = useState(false);

  // Add handleDescriptionChange function
  const handleDescriptionChange = (content) => {
    setFormData((prevState) => ({
      ...prevState,
      jobDescription: content,
    }));
    setHasChanges(true);
  };

  // Add this useEffect for fetching job data
  useEffect(() => {
    const fetchJobData = async () => {
      if (!jobIdProp) return;

      try {
        setIsLoading(true);
        const jobRef = doc(db, "jobs", jobIdProp);
        const jobSnap = await getDoc(jobRef);

        if (jobSnap.exists()) {
          const jobData = jobSnap.data();

          // Store original data for comparison
          setOriginalData(jobData);

          // Update form data with all fields
          setFormData({
            jobID: jobData.jobID || "",
            jobNo: jobData.jobNo || "",
            jobName: jobData.jobName || "",
            jobDescription: jobData.jobDescription || "",
            serviceCallID: jobData.serviceCallID || "",
            salesOrderID: jobData.salesOrderID || "",
            customerID: jobData.customerID || "",
            customerName: jobData.customerName || "",
            contact: {
              contactID: jobData.contact?.contactID || "",
              contactFullname: jobData.contact?.contactFullname || "",
              firstName: jobData.contact?.firstName || "",
              middleName: jobData.contact?.middleName || "",
              lastName: jobData.contact?.lastName || "",
              email: jobData.contact?.email || "",
              mobilePhone: jobData.contact?.mobilePhone || "",
              phoneNumber: jobData.contact?.phoneNumber || "",
              notification: {
                notifyCustomer:
                  jobData.contact?.notification?.notifyCustomer || false,
              },
            },
            jobStatus: jobData.jobStatus || "Created",
            priority: jobData.priority || "",
            startDate: jobData.startDate?.split("T")[0] || "", // Extract date part only
            endDate: jobData.endDate?.split("T")[0] || "", // Extract date part only
            startTime: jobData.startTime || "",
            endTime: jobData.endTime || "",
            scheduleSession: jobData.scheduleSession || "",
            estimatedDurationHours: jobData.estimatedDurationHours || "",
            estimatedDurationMinutes: jobData.estimatedDurationMinutes || "",
            location: {
              locationName: jobData.location?.locationName || "",
              address: {
                streetNo: jobData.location?.address?.streetNo || "",
                streetAddress: jobData.location?.address?.streetAddress || "",
                block: jobData.location?.address?.block || "",
                buildingNo: jobData.location?.address?.buildingNo || "",
                city: jobData.location?.address?.city || "",
                stateProvince: jobData.location?.address?.stateProvince || "",
                postalCode: jobData.location?.address?.postalCode || "",
                country: jobData.location?.address?.country || "",
              },
              coordinates: {
                latitude: jobData.location?.coordinates?.latitude || "",
                longitude: jobData.location?.coordinates?.longitude || "",
              },
            },
            equipments: jobData.equipments || [],
            customerSignature: {
              signatureURL: jobData.customerSignature?.signatureURL || "",
              signedBy: jobData.customerSignature?.signedBy || "",
              signatureTimestamp:
                jobData.customerSignature?.signatureTimestamp || null,
            },
          });

          // Update selected values for dropdowns and multi-selects
          setSelectedCustomer({
            value: jobData.customerID,
            label: jobData.customerName,
          });

          if (jobData.contact) {
            setSelectedContact({
              value: jobData.contact.contactID,
              label: jobData.contact.contactFullname,
              ...jobData.contact,
            });
          }

          if (jobData.location) {
            setSelectedLocation({
              value: jobData.location.locationName,
              label: jobData.location.locationName,
              ...jobData.location,
            });
          }

          // Set assigned workers
          if (jobData.assignedWorkers && jobData.assignedWorkers.length > 0) {
            setSelectedWorkers(
              jobData.assignedWorkers.map((worker) => ({
                value: worker.workerId,
                label: worker.workerName,
              }))
            );
          }

          // Set service call
          if (jobData.serviceCallID) {
            setSelectedServiceCall({
              value: jobData.serviceCallID,
              label: jobData.serviceCallID.toString(),
            });
          }

          // Set sales order
          if (jobData.salesOrderID) {
            setSelectedSalesOrder({
              value: jobData.salesOrderID,
              label: jobData.salesOrderID,
            });
          }

          // Set job contact type
          if (jobData.jobContactType) {
            setSelectedJobContactType({
              value: jobData.jobContactType.code,
              label: jobData.jobContactType.name,
            });
          }

          // Set tasks
          if (jobData.taskList && jobData.taskList.length > 0) {
            setTasks(jobData.taskList);
          }

          // Set job number
          if (jobData.jobNo) {
            setJobNo(jobData.jobNo);
          }

          setHasChanges(false);
        }
      } catch (error) {
        console.error("Error fetching job data:", error);
        toast.error("Failed to load job data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobData();
  }, [jobIdProp]);

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

  // Add unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  // Update task management functions
  const handleAddTask = () => {
    const newTask = {
      taskID: `task-${tasks.length + 1}`,
      taskName: "",
      taskDescription: "",
      assignedTo: "",
      isPriority: false,
      isDone: false,
      completionDate: null,
      createdAt: Timestamp.now(),
    };

    setTasks((prevTasks) => [...prevTasks, newTask]);
    setHasChanges(true);
  };

  const handleUpdateTask = (index, field, value) => {
    setTasks((prevTasks) => {
      const updatedTasks = [...prevTasks];
      updatedTasks[index] = {
        ...updatedTasks[index],
        [field]: value,
        updatedAt: Timestamp.now(),
      };
      return updatedTasks;
    });
    setHasChanges(true);
  };

  // Update the equipment selection state
  const [selectedEquipments, setSelectedEquipments] = useState([]);
  const isEquipmentChanging = useRef(false);

  // Handle equipment selection changes
  const handleEquipmentSelection = useCallback(({ currentSelections }) => {
    // Simple update without checking previous state
    setFormData((prev) => ({
      ...prev,
      equipments: currentSelections.map((equipment) => ({
        itemCode: equipment.ItemCode,
        itemName: equipment.ItemName,
        itemGroup: equipment.ItemGroup,
        modelSeries: equipment.ModelSeries,
        serialNo: equipment.SerialNo,
        brand: equipment.Brand,
        notes: equipment.Notes,
        equipmentType: equipment.EquipmentType,
        equipmentLocation: equipment.EquipmentLocation,
      })),
    }));
  }, []);

  // Initialize equipment selections when component mounts
  useEffect(() => {
    if (initialJobData?.equipments) {
      console.log("Initial job equipments:", initialJobData.equipments);
      setSelectedEquipments(initialJobData.equipments);
    }
  }, [initialJobData]);

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
                      <RequiredFieldWithTooltip label="Location" />
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
                          className="fe fe-help-circle text-muted"
                          style={{ cursor: "pointer" }}
                        ></i>
                      </OverlayTrigger>
                    </Form.Label>
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
                  {equipments.length > 0 ? (
                    <EquipmentsUpdateTable
                      equipments={equipments}
                      initialSelected={initialJobData?.equipments}
                      onSelectionChange={handleEquipmentSelection}
                    />
                  ) : (
                    <div className="text-center py-4">
                      <p>
                        No equipment data available. Please select a customer
                        first.
                      </p>
                    </div>
                  )}
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
          <TaskList
            taskList={tasks}
            setTaskList={handleUpdateTask}
            workers={workers}
            jobNo={jobNo}
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
              {/* <Form.Group as={Col} md="3" controlId="serviceCall">
                <RequiredFieldWithTooltip label="Service Call" />
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
                <RequiredFieldWithTooltip label="Sales Order" />
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
                  isDisabled={!selectedServiceCall || salesOrders.length === 0}
                  isClearable
                  noOptionsMessage={() => "No contact types available"}
                />
                {jobContactTypes.length === 0 && selectedCustomer && (
                  <small className="text-muted">
                    No contact types available
                  </small>
                )}
              </Form.Group> */}
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
                  isMulti={true}
                  name="workers"
                  options={workers}
                  value={selectedWorkers}
                  onChange={handleWorkersChange}
                  placeholder="Select Workers"
                  isSearchable={true}
                  isClearable={true}
                  closeMenuOnSelect={false}
                  defaultValue={selectedWorkers}
                  getOptionLabel={(option) => option.label}
                  getOptionValue={(option) => option.value}
                  styles={{
                    control: (baseStyles, state) => ({
                      ...baseStyles,
                      borderColor: state.isFocused ? "#80bdff" : "#ced4da",
                      boxShadow: state.isFocused
                        ? "0 0 0 0.2rem rgba(0,123,255,.25)"
                        : null,
                      "&:hover": {
                        borderColor: state.isFocused ? "#80bdff" : "#ced4da",
                      },
                    }),
                    multiValue: (styles) => ({
                      ...styles,
                      backgroundColor: "#e9ecef",
                      borderRadius: "4px",
                    }),
                    multiValueLabel: (styles) => ({
                      ...styles,
                      color: "#495057",
                      padding: "2px 6px",
                    }),
                    multiValueRemove: (styles) => ({
                      ...styles,
                      ":hover": {
                        backgroundColor: "#dc3545",
                        color: "white",
                      },
                    }),
                  }}
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
                    readOnly={
                      formData.scheduleSession !== "custom" ||
                      (formData.startTime && formData.endTime)
                    }
                    required
                  />
                  <InputGroup.Text>h</InputGroup.Text>
                  <Form.Control
                    type="number"
                    name="estimatedDurationMinutes"
                    value={formData.estimatedDurationMinutes}
                    onChange={handleInputChange}
                    placeholder="Minutes"
                    readOnly={
                      formData.scheduleSession !== "custom" ||
                      (formData.startTime && formData.endTime)
                    }
                    required
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
                <RequiredFieldWithTooltip label="Job Name" />
                <Form.Control
                  type="text"
                  name="jobName"
                  value={formData.jobName}
                  onChange={handleInputChange}
                  placeholder="Enter Job Name"
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
            <div className="mt-2">Updating Job...</div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditJobs;
