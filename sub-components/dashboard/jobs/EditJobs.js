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
import EquipmentsTableWithAddDelete from "../../../pages/dashboard/tables/datatable-equipments-update";
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
  //const [formData, setFormData] = useState(initialJobData || {});
  const [formData, setFormData] = useState({
    ...initialJobData,
    // Provide default values for all form fields
    jobID: initialJobData?.jobID || '',
    jobNo: initialJobData?.jobNo || '',
    jobName: initialJobData?.jobName || '',
    jobDescription: initialJobData?.jobDescription || '',
    startDate: initialJobData?.startDate || '',
    endDate: initialJobData?.endDate || '',
    startTime: initialJobData?.startTime || '',
    endTime: initialJobData?.endTime || '',
    priority: initialJobData?.priority || '',
    jobStatus: initialJobData?.jobStatus || 'Created',
    scheduleSession: initialJobData?.scheduleSession || '',
    estimatedDurationHours: initialJobData?.estimatedDurationHours || '',
    estimatedDurationMinutes: initialJobData?.estimatedDurationMinutes || '',
    contact: {
      contactID: initialJobData?.contact?.contactID || '',
      contactFullname: initialJobData?.contact?.contactFullname || '',
      firstName: initialJobData?.contact?.firstName || '',
      middleName: initialJobData?.contact?.middleName || '',
      lastName: initialJobData?.contact?.lastName || '',
      email: initialJobData?.contact?.email || '',
      mobilePhone: initialJobData?.contact?.mobilePhone || '',
      phoneNumber: initialJobData?.contact?.phoneNumber || '',
      notification: {
        notifyCustomer: initialJobData?.contact?.notification?.notifyCustomer || false
      }
    },
    location: {
      locationName: initialJobData?.location?.locationName || '',
      address: {
        streetNo: initialJobData?.location?.address?.streetNo || '',
        streetAddress: initialJobData?.location?.address?.streetAddress || '',
        block: initialJobData?.location?.address?.block || '',
        buildingNo: initialJobData?.location?.address?.buildingNo || '',
        city: initialJobData?.location?.address?.city || '',
        stateProvince: initialJobData?.location?.address?.stateProvince || '',
        postalCode: initialJobData?.location?.address?.postalCode || '',
        country: initialJobData?.location?.address?.country || ''
      },
      coordinates: {
        latitude: initialJobData?.location?.coordinates?.latitude || '',
        longitude: initialJobData?.location?.coordinates?.longitude || ''
      }
    }
  });
  const [originalData, setOriginalData] = useState({
    startDate: initialJobData?.startDate || '',
    endDate: initialJobData?.endDate || '',
    startTime: initialJobData?.startTime || '',
    endTime: initialJobData?.endTime || '',
    assignedWorkers: initialJobData?.assignedWorkers || []
  });

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

  const [selectedEquipments, setSelectedEquipments] = useState([]);
  const [originalEquipments, setOriginalEquipments] = useState([]);

  useEffect(() => {
    // //console.log("Initial Job Data: ", initialJobData); // Log the data
    setTasks(initialJobData?.taskList || []);
  }, [initialJobData]);

  useEffect(() => {
    if (initialJobData?.equipments) {
      // Format the initial equipment data
      const formattedEquipments = initialJobData.equipments.map(equipment => ({
        brand: equipment.brand || equipment.Brand,
        equipmentLocation: equipment.equipmentLocation || equipment.EquipmentLocation || null,
        equipmentType: equipment.equipmentType || equipment.EquipmentType || '',
        itemCode: equipment.itemCode || equipment.ItemCode || '',
        itemGroup: equipment.itemGroup || equipment.ItemGroup || 'Equipment',
        itemName: equipment.itemName || equipment.ItemName,
        modelSeries: equipment.modelSeries || equipment.ModelSeries,
        notes: equipment.notes || equipment.Notes || '',
        serialNo: equipment.serialNo || equipment.SerialNo
      }));

      setOriginalEquipments(formattedEquipments);
      setSelectedEquipments(formattedEquipments);
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        equipments: formattedEquipments
      }));

      console.log('Initialized Equipment State:', {
        originalCount: formattedEquipments.length,
        equipments: formattedEquipments
      });
    }
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

  // Modify the useEffect for initial data loading
useEffect(() => {
  const initializeFormData = async () => {
    if (initialJobData) {
      console.log('Initializing form with data:', initialJobData);

      // Set initial customer and immediately update form data
      const initialCustomer = {
        value: initialJobData.customerID,
        label: `${initialJobData.customerID} - ${initialJobData.customerName}`,
        cardCode: initialJobData.customerID,
        cardName: initialJobData.customerName
      };
      setSelectedCustomer(initialCustomer);

      // Immediately set initial contact and location in form data
      if (initialJobData.contact) {
        setSelectedContact({
          value: initialJobData.contact.contactID,
          label: initialJobData.contact.contactID,
          ...initialJobData.contact
        });
        console.log("Selected contact during intialization:", selectedContact);
        
        setFormData(prev => ({
          ...prev,
          contact: initialJobData.contact
        }));
      }

      if (initialJobData.location) {
        setSelectedLocation({
          value: initialJobData.location.locationName,
          label: initialJobData.location.locationName,
          ...initialJobData.location
        });
        
        setFormData(prev => ({
          ...prev,
          location: initialJobData.location
        }));
      }

      try {
        // Fetch contacts and locations for the customer
        const [contactsResponse, locationsResponse] = await Promise.all([
          fetch("/api/getContacts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cardCode: initialJobData.customerID }),
          }),
          fetch("/api/getLocation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cardCode: initialJobData.customerID }),
          })
        ]);

        if (contactsResponse.ok && locationsResponse.ok) {
          const [contactsData, locationsData] = await Promise.all([
            contactsResponse.json(),
            locationsResponse.json()
          ]);

          // Format and set contacts and locations lists
          const formattedContacts = contactsData.map(contact => ({
            value: contact.contactId,
            label: contact.contactId,
            ...contact
          }));
          setContacts(formattedContacts);

          const formattedLocations = locationsData.map(location => ({
            value: location.siteId,
            label: location.siteId,
            ...location
          }));
          setLocations(formattedLocations);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Error loading contact and location data');
      }
    }
  };

  initializeFormData();
}, [initialJobData]);

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
      // //console.log(
      //   "Initial assigned workers data:",
      //   initialJobData.assignedWorkers
      // );

      // First, wait for workers list to be loaded
      const mappedWorkers = initialJobData.assignedWorkers.map((worker) => {
        // Find the matching worker from the workers list to get the full name
        const matchingWorker = workers.find((w) => w.value === worker.workerId);

        return {
          value: worker.workerId,
          label: matchingWorker ? matchingWorker.label : worker.workerName, // Use workerName as fallback
        };
      });

      ////console.log("Mapped initial workers:", mappedWorkers);
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

  // Workers fetch useEffect
  // Add this useEffect near your other useEffect hooks
  useEffect(() => {
    const fetchCustomers = async () => {
      ////console.log("🚀 Starting customer fetch...");

      try {
        // //console.log("📡 Making API request to /api/getCustomers");
        const response = await fetch("/api/getCustomers", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        // //console.log(" Response received:", {
        //   ok: response.ok,
        //   status: response.status,
        //   statusText: response.statusText,
        // });

        if (!response.ok) {
          throw new Error(`Failed to fetch customers: ${response.statusText}`);
        }

        const data = await response.json();
        // //console.log("✅ Parsed customer data:", {
        //   count: data.length,
        //   firstCustomer: data[0],
        //   lastCustomer: data[data.length - 1],
        // });

        const formattedCustomers = data.map((customer) => ({
          value: customer.cardCode,
          label: `${customer.cardCode} - ${customer.cardName}`,
          cardCode: customer.cardCode,
          cardName: customer.cardName,
        }));

        // //console.log("🔄 Formatted customers:", {
        //   count: formattedCustomers.length,
        //   firstCustomer: formattedCustomers[0],
        //   lastCustomer: formattedCustomers[formattedCustomers.length - 1],
        // });

        setCustomers(formattedCustomers);
        // //console.log("💾 Customers saved to state");

        // If we have initialJobData, set the initial customer selection
        if (initialJobData?.customerID) {
          // //console.log(
          //   "🔍 Looking for initial customer:",
          //   initialJobData.customerID
          // );
          const initialCustomer = formattedCustomers.find(
            (c) => c.cardCode === initialJobData.customerID
          );
          if (initialCustomer) {
            // //console.log("✨ Found initial customer:", initialCustomer);
            setSelectedCustomer(initialCustomer);
            handleCustomerChange(initialCustomer);
          } else {
            // //console.log("⚠️ Initial customer not found in data");
          }
        }

        // Fetch job contact types after selecting a customer
        if (formattedCustomers.length > 0) {
          const fetchJobContactTypes = async () => {
            try {
              const jobContactTypeResponse = await fetch(
                "/api/getJobContactType",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );

              if (!jobContactTypeResponse.ok) {
                const errorData = await jobContactTypeResponse.json();
                throw new Error(
                  `Failed to fetch job contact types: ${
                    errorData.message || jobContactTypeResponse.statusText
                  }`
                );
              }

              const jobContactTypeData = await jobContactTypeResponse.json();

              const formattedJobContactTypes = jobContactTypeData.map(
                (item) => ({
                  value: item.code,
                  label: item.name,
                })
              );

              setJobContactTypes(formattedJobContactTypes);
            } catch (error) {
              console.error("Error fetching job contact types:", error);
              toast.error(
                `Failed to fetch job contact types: ${error.message}`
              );
              setJobContactTypes([]);
            }
          };

          fetchJobContactTypes();
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

    //console.log("🏁 Initiating customer fetch useEffect");
    fetchCustomers();
  }, []); // Empty dependency array means this runs once on component mount

  useEffect(() => {
    // Fetch workers from Firestore
    const fetchWorkers = async () => {
      try {
        const usersRef = collection(db, "users"); // Reference to the "users" collection

        // Add the role filter to the query
        const workersQuery = query(
          usersRef,
          where("role", "==", "Worker") // Only fetch users where role is "Worker"
        );

        const snapshot = await getDocs(workersQuery); // Fetch documents from the "users" collection
        const workersData = snapshot.docs.map((doc) => ({
          value: doc.id, // Use document ID as workerId
          label: doc.data().fullName, // Assuming the worker's name is stored in the "fullName" field
        }));

        setWorkers(workersData); // Set the workers state with filtered data
      } catch (error) {
        console.error("Error fetching workers:", error);
      }
    };

    fetchWorkers();
  }, []);

  // Update the worker selection handler
  const handleWorkersChange = (selected) => {
    //console.log("Worker selection changed:", selected);
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
        customerID: selectedOption.cardCode,
        customerName: selectedOption.cardName,
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

    // setSelectedLocation(null);
    setSelectedCustomer(selectedOption);
    // setSelectedServiceCall(null);
    // setSelectedSalesOrder(null);

    // const selectedCustomer = customers.find(
    //   (option) => option.value === selectedOption.value
    // );

   //console.log("Selected customer:", selectedCustomer);

    // setFormData((prevFormData) => ({
    //   ...prevFormData,
    //   customerID: selectedCustomer ? selectedCustomer.cardCode : "",
    //   customerName: selectedCustomer ? selectedCustomer.cardName : "",
    // }));

    // Start loading state
  setIsLoading(true);

    try {
      //console.log("Fetching related data for customer:", selectedOption.value);

      // Fetch contacts
      const contactsResponse = await fetch("/api/getContacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardCode: selectedOption.value }),
      });

      if (!contactsResponse.ok) throw new Error("Failed to fetch contacts");
      const contactsData = await contactsResponse.json();
      //console.log("Fetched contacts:", contactsData);

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
      //console.log("Fetched locations:", locationsData);

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
      //console.log("Fetched equipments:", equipmentsData);

      const formattedEquipments = equipmentsData.map((item) => ({
        brand: item.Brand,
        equipmentLocation: item.EquipmentLocation || null,
        equipmentType: item.EquipmentType || '',
        itemCode: item.ItemCode || '',
        itemGroup: item.ItemGroup || 'Equipment',
        itemName: item.ItemName,
        modelSeries: item.ModelSeries,
        notes: item.Notes || '',
        serialNo: item.SerialNo,
        warrantyStartDate: item.WarrantyStartDate,
        warrantyEndDate: item.WarrantyEndDate
      }));
      //console.log("Formatted equipments:", formattedEquipments);
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
      //console.log("Fetched service calls:", serviceCallsData);

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

    console.log("Selected contact:", selectedOption);

    setFormData((prevFormData) => ({
      ...prevFormData,
      contact: {
        ...prevFormData.contact, 
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
    if (!selectedOption) {
      // Handle clearing the selection
      setSelectedLocation(null);
      setFormData(prev => ({
        ...prev,
        location: {
          locationName: '',
          address: {
            streetNo: '',
            streetAddress: '',
            block: '',
            buildingNo: '',
            city: '',
            stateProvince: '',
            postalCode: '',
            country: '',
          },
          coordinates: {
            latitude: '',
            longitude: '',
          }
        }
      }));
      return;
    }

    const selectedLocation = locations.find(
      (location) => location.value === selectedOption.value
    );

    setSelectedLocation(selectedLocation);

    // Update form data with the new location
    setFormData(prev => ({
      ...prev,
      location: {
        locationName: selectedLocation.label || '',
        address: {
          streetNo: selectedLocation.streetNo || '',
          streetAddress: selectedLocation.street || '',
          block: selectedLocation.block || '',
          buildingNo: selectedLocation.building || '',
          country: selectedLocation.countryName || '',
          stateProvince: selectedLocation.stateProvince || '',
          city: selectedLocation.city || '',
          postalCode: selectedLocation.zipCode || '',
        },
        coordinates: {
          latitude: selectedLocation.latitude || '',
          longitude: selectedLocation.longitude || '',
        },
      }
    }));

    // Set flag to indicate changes
    setHasChanges(true);
  };

  const handleSelectedServiceCallChange = async (selectedServiceCall) => {
    setSelectedServiceCall(selectedServiceCall);
    setSelectedSalesOrder(null); // Reset sales order when service call changes

    if (!selectedServiceCall) {
      setSalesOrders([]);
      return;
    }

    try {
      // Log the request payload for debugging
      const requestPayload = {
        serviceCallID: selectedServiceCall.value,
        cardCode: formData.customerID
      };
      console.log('Fetching sales orders with payload:', requestPayload);

      const response = await fetch("/api/getSalesOrder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch sales orders');
      }

      const data = await response.json();
      console.log("Sales orders response:", data);

      if (data && Array.isArray(data.value)) {
        const formattedSalesOrders = data.value.map((order) => ({
          value: order.DocNum.toString(),
          label: `${order.DocNum} - ${getStatusText(order.DocStatus)}`,
          docTotal: order.DocTotal,
          docStatus: order.DocStatus,
        }));

        setSalesOrders(formattedSalesOrders);
      } else {
        setSalesOrders([]);
        console.warn('No sales orders found or invalid data format:', data);
      }
    } catch (error) {
      console.error("Error fetching sales orders:", error);
      toast.error(`Failed to fetch sales orders: ${error.message}`);
      setSalesOrders([]);
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

  // Add a new function to handle equipment selection changes
  const handleEquipmentSelection = useCallback(({ currentSelections, added, removed }) => {
    console.log('Equipment Selection Changed:', { currentSelections, added, removed });
    
    // Update the selected equipments state
    setSelectedEquipments(currentSelections);
    
    // Update form data with the new equipment selections
    setFormData(prev => ({
      ...prev,
      equipments: currentSelections
    }));

    // Set flag to indicate changes
    setHasChanges(true);
  }, []);

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

      // Check if the schedule hasn't changed from the original
      if (
        jobData.startDate === originalData.startDate &&
        jobData.endDate === originalData.endDate &&
        jobData.startTime === originalData.startTime &&
        jobData.endTime === originalData.endTime &&
        JSON.stringify(selectedWorkers.map(w => w.value).sort()) === 
        JSON.stringify(originalData.assignedWorkers?.map(w => w.workerId).sort())
      ) {
        return { hasConflicts: false, conflicts: [] };
      }

      const conflicts = [];
      const startDateTime = new Date(`${jobData.startDate}T${jobData.startTime}`);
      const endDateTime = new Date(`${jobData.endDate}T${jobData.endTime}`);

      for (const worker of selectedWorkers) {
        if (!worker?.value || !worker?.label) continue;

        try {
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
                message: `${worker.label} has a scheduling conflict with Job #${job.jobNo} (${job.startDate} ${job.startTime} - ${job.endTime})`
              });
            }
          });
        } catch (error) {
          console.error(`Error checking conflicts for worker ${worker.label}:`, error);
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
    try {
      setIsSubmitting(true);
      setProgress(10);

      // Validate form data
      if (!validateJobForm(formData)) {
        setIsSubmitting(false);
        return;
      }

      const jobRef = doc(db, "jobs", jobIdProp);
      
      // Prepare the update data
      const updateData = {
        ...formData,
        lastModifiedAt: Timestamp.now(),
        equipments: selectedEquipments, // Use the selected equipments
        location: {
          locationName: formData.location?.locationName || '',
          address: {
            streetNo: formData.location?.address?.streetNo || '',
            streetAddress: formData.location?.address?.streetAddress || '',
            block: formData.location?.address?.block || '',
            buildingNo: formData.location?.address?.buildingNo || '',
            city: formData.location?.address?.city || '',
            stateProvince: formData.location?.address?.stateProvince || '',
            postalCode: formData.location?.address?.postalCode || '',
            country: formData.location?.address?.country || '',
          },
          coordinates: {
            latitude: formData.location?.coordinates?.latitude || '',
            longitude: formData.location?.coordinates?.longitude || '',
          }
        },
        contact: {
          contactID: formData.contact?.contactID || '',
          contactFullname: formData.contact?.contactFullname || '',
          firstName: formData.contact?.firstName || '',
          middleName: formData.contact?.middleName || '',
          lastName: formData.contact?.lastName || '',
          email: formData.contact?.email || '',
          mobilePhone: formData.contact?.mobilePhone || '',
          phoneNumber: formData.contact?.phoneNumber || '',
          notification: {
            notifyCustomer: formData.contact?.notification?.notifyCustomer || false,
          }
        }
      };

      setProgress(50);

      // Update the document in Firebase
      await updateDoc(jobRef, updateData);

      setProgress(100);
      toast.success('Job updated successfully!');
      
      // Reset states
      setHasChanges(false);
      setOriginalEquipments(selectedEquipments);
      
      // Optionally refresh the data
      router.push('/jobs');

    } catch (error) {
      console.error('Error updating job:', error);
      toast.error(`Failed to update job: ${error.message}`);
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

          if (jobData.equipments) {
            setOriginalEquipments(jobData.equipments);
            setSelectedEquipments(jobData.equipments);
          }

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
              label: jobData.contact.contactID,
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
                  placeholder={isLoading ? "Loading customers..." : "Enter Customer Name"}
                  isDisabled={true} // Changed from disabled to isDisabled for react-select
                  noOptionsMessage={() => isLoading ? "Loading..." : "No customers found"}
                  styles={{
                    // Optional: Add custom styles to make it visually clear that it's disabled
                    control: (base) => ({
                      ...base,
                      backgroundColor: '#e9ecef',
                      cursor: 'not-allowed'
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: '#6c757d'
                    })
                  }}
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
  isDisabled={!selectedCustomer}
  defaultValue={selectedContact}
  key={`contact-${selectedCustomer?.value}`} // Add customer dependency
  isLoading={contacts.length === 0 && selectedCustomer !== null}
  noOptionsMessage={() => 
    selectedCustomer 
      ? "No contacts found for this customer" 
      : "Please select a customer first"
  }
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
                      isDisabled={!selectedCustomer}
                      defaultValue={selectedLocation}
                      key={`location-${selectedCustomer?.value}`} // Add customer dependency
                      isLoading={locations.length === 0 && selectedCustomer !== null}
                      noOptionsMessage={() => 
                        selectedCustomer 
                          ? "No locations found for this customer" 
                          : "Please select a customer first"
                      }
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
                    <EquipmentsTableWithAddDelete
                      equipments={equipments}
                      initialSelected={originalEquipments}
                      onSelectionChange={handleEquipmentSelection}
                    />
                  ) : (
                    <div className="text-center py-4">
                      <p>No equipment data available. Please select a customer first.</p>
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
                  <option value="afternoon">
                    Afternoon (1:00pm to 5:30pm)
                  </option>
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
                  <option value="afternoon">
                    Afternoon (1:00pm to 5:30pm)
                  </option>
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
                <Form.Label>Sales Orders</Form.Label>
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
                  //isDisabled={!selectedServiceCall || salesOrders.length === 0}
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
                <Form.Label>Schedule Session</Form.Label>
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
                    onChange={calculateDuration}
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
                <RequiredFieldWithTooltip label="Subject Name" />
                <Form.Control
                  type="text"
                  name="jobName"
                  value={formData.jobName}
                  onChange={handleInputChange}
                  placeholder="Enter Subject Name"
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
