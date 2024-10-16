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
} from "firebase/firestore";
import Swal from "sweetalert2";
import styles from "./CreateJobs.module.css";
import { ToastContainer, toast } from "react-toastify";
import JobTask from "./tabs/JobTasklist";
import { useRouter } from "next/router";

const AddNewJobs = () => {
  const router = useRouter();
  const timestamp = Timestamp.now();

  const [workers, setWorkers] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [tasks, setTasks] = useState([]); // Initialize tasks

  const [customers, setCustomers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({
    contactId: "",
    customerName: "",
    firstName: "",
    middleName: "",
    lastName: "",
    phoneNumber: "",
    mobilePhone: "",
    email: "",
    locationName: "",
    streetNo: "",
    streetAddress: "",
    block: "",
    buildingNo: "",
    country: "",
    stateProvince: "",
    city: "",
    zipCode: "",
    jobNo: "",
    jobName: "",
    description: "",
    jobPriority: "",
    jobStatus: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    estimatedDurationHours: "",
    estimatedDurationMinutes: "",
    adminWorkerNotify: false,
    customerNotify: false,
  });

  const [showServiceLocation, setShowServiceLocation] = useState(true);
  const [showEquipments, setShowEquipments] = useState(true);
  const [jobNo, setJobNo] = useState("0000");
  const [validated, setValidated] = useState(false);
  const [activeKey, setActiveKey] = useState("summary");

  const logActivity = async (activity, activitybrief) => {
    try {
      await addDoc(collection(db, "recentActivities"), {
        activity,
        activitybrief,
        time: Timestamp.now(),
        icon: "check",
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/getCustomers");
      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Unexpected response format");
      }
      const formattedOptions = data.map((item) => ({
        value: item.cardCode,
        label: item.cardCode + " - " + item.cardName,
        cardName: item.cardName,
      }));
      setCustomers(formattedOptions);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]); // Ensure options is an array
    }
  };

  useEffect(() => {
    fetchCustomers();
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
        taskName: "",
        taskDescription: "",
        isComplete: false,
        isPriority: false,
      },
    ]);
  };

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

    // Fetch contacts, locations, and equipments for the selected customer
    try {
      const response = await fetch("/api/getContacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardCode: selectedOption.value }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch contacts");
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Unexpected response format");
      }

      const formattedContacts = data.map((item) => ({
        value: item.contactId,
        label: item.contactId,
        ...item,
      }));

      setContacts(formattedContacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setContacts([]);
    }

    // Fetch locations for the selected customer
    try {
      const response = await fetch("/api/getLocation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardCode: selectedOption.value }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch locations");
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Unexpected response format");
      }

      const formattedLocations = data.map((item) => ({
        value: item.siteId,
        label: item.siteId,
        ...item,
      }));

      setLocations(formattedLocations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      setLocations([]);
    }

    // Fetch Equipments for the selected customer
    try {
      const response = await fetch("/api/getEquipments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardCode: selectedOption.value }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch equipments");
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Unexpected response format");
      }

      const formattedEquipments = data.map((item) => ({
        value: item.ItemCode,
        label: item.ItemCode,
        ...item,
      }));

      setEquipments(formattedEquipments);
    } catch (error) {
      console.error("Error fetching equipments:", error);
      setEquipments([]);
    }
  };

  const handleContactChange = (selectedOption) => {
    setSelectedContact(selectedOption);
    setFormData({
      ...formData,
      firstName: selectedOption.firstName || "",
      middleName: selectedOption.middleName || "",
      lastName: selectedOption.lastName || "",
      phoneNumber: selectedOption.tel1 || "",
      mobilePhone: selectedOption.tel2 || "",
      email: selectedOption.email || "",
    });
  };

  const handleLocationChange = (selectedOption) => {
    const selectedLocation = locations.find(
      (location) => location.value === selectedOption.value
    );
    setSelectedLocation(selectedLocation);
    setFormData({
      ...formData,
      locationName: selectedLocation.siteId,
      streetNo: selectedLocation.streetNo || "",
      streetAddress: selectedLocation.street || "",
      block: selectedLocation.block || "",
      buildingNo: selectedLocation.building || "",
      country: selectedLocation.countryName || "",
      stateProvince: "",
      city: selectedLocation.city || "",
      zipCode: selectedLocation.zipCode || "",
    });
  };

  const handleSelectedEquipmentsChange = (selectedEquipments) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      equipments: selectedEquipments,
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
    const { name, value } = e.target;
    let updatedFormData = { ...formData, [name]: value };

    if (value === "morning") {
      updatedFormData = {
        ...updatedFormData,
        startTime: "09:30",
        endTime: "13:00",
        estimatedDurationHours: 3,
        estimatedDurationMinutes: 30,
      };
    } else if (value === "afternoon") {
      updatedFormData = {
        ...updatedFormData,
        startTime: "13:00",
        endTime: "17:30",
        estimatedDurationHours: 4,
        estimatedDurationMinutes: 30,
      };
    } else {
      updatedFormData = {
        ...updatedFormData,
        startTime: "",
        endTime: "",
        estimatedDurationHours: "",
        estimatedDurationMinutes: "",
      };
    }

    setFormData(updatedFormData);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }));

    // SENT API THRU SAP
  };

  // const handleSubmitClick = async () => {
  //   try {
  //     const formattedStartDateTime = formatDateTime(
  //       formData.startDate,
  //       formData.startTime
  //     );
  //     const formattedDuration = formatDuration(
  //       formData.estimatedDurationHours,
  //       formData.estimatedDurationMinutes
  //     );

  //     const newJobData = {
  //       ...formData,
  //       start: formattedStartDateTime,
  //       duration: formattedDuration,
  //       jobNo: jobNo,
  //       assignedWorkers: selectedWorkers.map((worker) => worker.value),
  //     };

  //     const jobRef = doc(db, "jobs", jobNo);
  //     await setDoc(jobRef, newJobData);

  //     Swal.fire({
  //       title: "Success!",
  //       text: "Job created successfully.",
  //       icon: "success",
  //     });

  //     // Increment jobNo for the UI
  //     setJobNo((prevJobNo) =>
  //       (parseInt(prevJobNo, 10) + 1).toString().padStart(6, "0")
  //     );
  //   } catch (e) {
  //     console.error("Error adding document: ", e);
  //     Swal.fire({
  //       title: "Error!",
  //       text: "An error occurred while saving data.",
  //       icon: "error",
  //     });
  //   }
  // };

  // const handleSubmitClick = async () => {
  //     try {
  //         const formattedStartDateTime = formatDateTime(formData.startDate, formData.startTime);
  //         const formattedDuration = formatDuration(formData.estimatedDurationHours, formData.estimatedDurationMinutes);

  //         const newJobData = {
  //             ...formData,
  //             start: formattedStartDateTime,
  //             duration: formattedDuration,
  //             jobNo: jobNo,
  //             assignedWorkers: selectedWorkers.map(worker => worker.value),
  //         };

  //         const jobRef = doc(db, "jobs", jobNo);
  //         await setDoc(jobRef, newJobData);

  //         alert('Form submitted successfully!');

  //         // Increment jobNo for the UI
  //         setJobNo((prevJobNo) => (parseInt(prevJobNo, 10) + 1).toString().padStart(6, '0'));
  //     } catch (e) {
  //         console.error("Error adding document: ", e);
  //         alert('Error submitting the form!');
  //     }
  // };

  const handleSubmitClick = async () => {
    try {
      const formattedStartDateTime = formatDateTime(
        formData.startDate,
        formData.startTime
      );
      const formattedDuration = formatDuration(
        formData.estimatedDurationHours,
        formData.estimatedDurationMinutes
      );

      const newJobData = {
        ...formData,
        start: formattedStartDateTime,
        duration: formattedDuration,
        jobNo: jobNo,
        TaskList: tasks,
        assignedWorkers: selectedWorkers.map((worker) => worker.value),
      };

      const jobRef = doc(db, "jobs", jobNo);
      await setDoc(jobRef, newJobData);

      // Show success toast
      toast.success("Job created successfully!");

      // Log the activity
      await logActivity(
        "Job Created",
        `Job ${formData.jobName} (Job No: ${jobNo}) was created.`
      );

      // Show success SweetAlert
      Swal.fire({
        title: "Success!",
        text: "Job created successfully.",
        icon: "success",
      });

      // Redirect after the user clicks OK
      router.replace("/dashboard/jobs/list-jobs");

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
                value={formData.firstName}
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
                value={formData.middleName}
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
                value={formData.lastName}
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
                defaultValue={formData.phoneNumber}
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
                defaultValue={formData.mobilePhone}
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
                defaultValue={formData.email}
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
                    value={formData.locationName}
                    readOnly
                  />
                </Form.Group>
                <Form.Group as={Col} controlId="streetAddress">
                  <Form.Label>Street No.</Form.Label>
                  <Form.Control
                    type="text"
                    disabled
                    value={formData.streetNo}
                    readOnly
                  />
                </Form.Group>
                <Form.Group as={Col} controlId="streetAddress">
                  <Form.Label>Street Address</Form.Label>
                  <Form.Control
                    type="text"
                    disabled
                    value={formData.streetAddress}
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
                    value={formData.block}
                    readOnly
                  />
                </Form.Group>
                <Form.Group as={Col} controlId="building">
                  <Form.Label>Building No.</Form.Label>
                  <Form.Control
                    type="text"
                    disabled
                    value={formData.buildingNo}
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
                    value={formData.country}
                    readOnly
                  />
                </Form.Group>
                <Form.Group as={Col} md="3" controlId="stateProvince">
                  <Form.Label>State/Province</Form.Label>
                  <Form.Control
                    type="text"
                    disabled
                    value={formData.stateProvince}
                    readOnly
                  />
                </Form.Group>
                <Form.Group as={Col} md="3" controlId="city">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    disabled
                    value={formData.city}
                    readOnly
                  />
                </Form.Group>
                <Form.Group as={Col} md="3" controlId="zipCode">
                  <Form.Label>Zip/Postal Code</Form.Label>
                  <Form.Control
                    type="text"
                    disabled
                    value={formData.zipCode}
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
              <Form.Control
                as="textarea"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Enter job description"
              />
            </Form.Group>
          </Row>
          <Row className="mb-3">
            <Form.Group as={Col} md="4" controlId="jobCategory">
              <Form.Label>Job Priority</Form.Label>
              <Form.Select
                name="jobPriority"
                value={formData.jobPriority}
                onChange={handleInputChange}
                aria-label="Select job category"
              >
                <option value="" disabled>
                  Select Priority
                </option>
                <option value="L">Low</option>
                <option value="M">Mid</option>
                <option value="H">High</option>
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
                <option value="C">Created</option>
                {/* <option value="CO">Confirm</option>
                <option value="CA">Cancel</option>
                <option value="JS">Job Started</option>
                <option value="JC">Job Complete</option>
                <option value="V">Validate</option>
                <option value="S">Scheduled</option> */}
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
                <option value="custom">Custom</option>
                <option value="morning">Morning (9:30am to 1:00pm)</option>
                <option value="afternoon">Afternoon (1:00pm to 5:30pm)</option>
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
                label="Admin/Worker: Email Notify when Job Status changed and new Job message Submitted"
              />
            </Form.Group>
            <Form.Group controlId="customerNotify">
              <Form.Check
                type="checkbox"
                name="customerNotify"
                checked={formData.customerNotify}
                onChange={handleInputChange}
                label="Customer: Email Notify when Job Status changed and new Job message Submitted"
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

// // import React, { Fragment, useState, useEffect } from 'react';
// // import {
// //     Container,
// //     Row,
// //     Col,
// //     Card,
// //     Form,
// //     FormGroup,
// //     FormLabel,
// //     FormControl,
// //     Button,
// //     InputGroup,
// //     Alert,
// //     Table,
// //     Pagination
// // } from 'react-bootstrap';
// // import {
// //   TableSmall
// // } from 'widgets';

// // // import required data file
// // import BasicTableData from 'data/dashboard/tables/BasicTableData'
// // import Tab from 'react-bootstrap/Tab';
// // import Tabs from 'react-bootstrap/Tabs';
// // import Select from 'react-select';
// // import TableEquipments from 'widgets/tables/TableEquipments';
// // import EquipmentsTable from 'pages/dashboard/tables/datatable-equipments';

// // const options5 = [
// //     { value: 'worker1', label: 'Worker 1' },
// //     { value: 'worker2', label: 'Worker 2' },
// //     { value: 'worker3', label: 'Worker 3' },
// //     { value: 'worker4', label: 'Worker 4' },
// //     { value: 'worker5', label: 'Worker 5' },
// //     { value: 'worker6', label: 'Worker 6' },
// // ];

// // const AddNewJobs = () => {
// //     const [customers, setCustomers] = useState([]);
// //     const [contacts, setContacts] = useState([]);
// //     const [locations, setLocations] = useState([]);
// //     const [equipments, setEquipments] = useState([]);
// //     const [selectedCustomer, setSelectedCustomer] = useState(null);
// //     const [selectedContact, setSelectedContact] = useState(null);
// //     const [selectedLocation, setSelectedLocation] = useState(null);
// //     const [formData, setFormData] = useState({
// //       customerName: '',
// //       firstName: '',
// //       middleName: '',
// //       lastName: '',
// //       phoneNumber: '',
// //       mobilePhone: '',
// //       email: '',
// //       locationName: '',
// //       streetNo: '',
// //       streetAddress: '',
// //       block: '',
// //       buildingNo: '',
// //       country: '',
// //       stateProvince: '',
// //       city: '',
// //       zipCode: '',
// //       equipments: []
// //     });

// //     const [showServiceLocation, setShowServiceLocation] = useState(true);
// //     const [showEquipments, setShowEquipments] = useState(true);
// //     const [selectedWorkers, setSelectedWorkers] = useState([]);

// //     const [selectedEquipment, setSelectedEquipment] = useState([]);
// //     const [validated, setValidated] = useState(false);
// //     const [activeKey, setActiveKey] = useState('summary'); // Initial active tab

// //       useEffect(() => {
// //         const fetchCustomers = async () => {
// //           try {
// //             const response = await fetch('/api/getCustomers');
// //             if (!response.ok) {
// //               throw new Error('Failed to fetch customers');
// //             }
// //             const data = await response.json();
// //             if (!Array.isArray(data)) {
// //               throw new Error('Unexpected response format');
// //             }
// //             const formattedOptions = data.map(item => ({
// //               value: item.cardCode,
// //               label: item.cardCode + ' - ' + item.cardName,
// //               cardName: item.cardName
// //             }));
// //             setCustomers(formattedOptions);
// //           } catch (error) {
// //             console.error('Error fetching customers:', error);
// //             setCustomers([]); // Ensure options is an array
// //           }
// //         };

// //         fetchCustomers();
// //       }, []);

// //       const handleCustomerChange = async (selectedOption) => {
// //         setSelectedContact(null);
// //         setSelectedLocation(null);

// //         setSelectedCustomer(selectedOption);
// //         const selectedCustomer = customers.find(option => option.value === selectedOption.value);
// //         setFormData({ ...formData, customerName: selectedCustomer ? selectedCustomer.label : '' });

// //         // Fetch contacts for the selected customer
// //         try {
// //           const response = await fetch('/api/getContacts', {
// //             method: 'POST',
// //             headers: {
// //               'Content-Type': 'application/json'
// //             },
// //             body: JSON.stringify({ cardCode: selectedOption.value })
// //           });

// //           if (!response.ok) {
// //             throw new Error('Failed to fetch contacts');
// //           }

// //           const data = await response.json();
// //           if (!Array.isArray(data)) {
// //             throw new Error('Unexpected response format');
// //           }

// //           const formattedContacts = data.map(item => ({
// //             value: item.contactId,
// //             label: item.contactId,
// //             ...item
// //           }));

// //           setContacts(formattedContacts);
// //         } catch (error) {
// //           console.error('Error fetching contacts:', error);
// //           setContacts([]);
// //         }

// //         // Fetch locations for the selected customer
// //         try {
// //           const response = await fetch('/api/getLocation', {
// //             method: 'POST',
// //             headers: {
// //               'Content-Type': 'application/json'
// //             },
// //             body: JSON.stringify({ cardCode: selectedOption.value })
// //           });

// //           if (!response.ok) {
// //             throw new Error('Failed to fetch locations');
// //           }

// //           const data = await response.json();
// //           if (!Array.isArray(data)) {
// //             throw new Error('Unexpected response format');
// //           }

// //           const formattedLocations = data.map(item => ({
// //             value: item.siteId,
// //             label: item.siteId,
// //             ...item
// //           }));

// //           setLocations(formattedLocations);
// //         } catch (error) {
// //           console.error('Error fetching locations:', error);
// //           setLocations([]);
// //         }
// //          // Fetch Equipments for the selected customer
// //          try {
// //           const response = await fetch('/api/getEquipments', {
// //             method: 'POST',
// //             headers: {
// //               'Content-Type': 'application/json'
// //             },
// //             body: JSON.stringify({ cardCode: selectedOption.value })
// //           });

// //           if (!response.ok) {
// //             throw new Error('Failed to fetch equipments');
// //           }

// //           const data = await response.json();
// //           if (!Array.isArray(data)) {
// //             throw new Error('Unexpected response format');
// //           }

// //           const formattedEquipments = data.map(item => ({
// //             value: item.ItemCode,
// //             label: item.ItemCode,
// //             ...item
// //           }));

// //           setEquipments(formattedEquipments);
// //         } catch (error) {
// //           console.error('Error fetching equipments:', error);
// //           setEquipments([]);
// //         }
// //       };

// //       const handleContactChange = (selectedOption) => {
// //         setSelectedContact(selectedOption);
// //         setFormData({
// //           ...formData,
// //           firstName: selectedOption.firstName || '',
// //           middleName: selectedOption.middleName || '',
// //           lastName: selectedOption.lastName || '',
// //           phoneNumber: selectedOption.tel1 || '',
// //           mobilePhone: selectedOption.tel2 || '',
// //           email: selectedOption.email || ''
// //         });
// //       };

// //       const handleLocationChange = (selectedOption) => {
// //         const selectedLocation = locations.find(location => location.value === selectedOption.value);
// //         setSelectedLocation(selectedLocation);
// //         setFormData({
// //           ...formData,
// //           locationName: selectedLocation.siteId,
// //           streetNo: selectedLocation.streetNo || '',
// //           streetAddress: selectedLocation.street || '',
// //           block: selectedLocation.block || '',
// //           buildingNo: selectedLocation.building || '',
// //           country: selectedLocation.countryName || '',
// //           stateProvince: '',
// //           city: selectedLocation.city || '',
// //           zipCode: selectedLocation.zipCode || ''
// //         });
// //       };

// //       const handleSelectedEquipmentsChange = (selectedEquipments) => {
// //         setFormData(prevFormData => ({
// //           ...prevFormData,
// //           equipments: selectedEquipments
// //         }));
// //       };

// //     const handleNextClick = () => {
// //         setActiveKey('scheduling'); // Switch to the 'Job Scheduling' tab
// //     };

// //     const handleSubmitClick = () => {
// //         // Handle form submission or any other logic for the 'Job Scheduling' tab
// //         alert('Form submitted successfully!');
// //     };

// //     const handleSubmit = (event) => {
// //         const form = event.currentTarget;
// //         if (form.checkValidity() === false) {
// //             event.preventDefault();
// //             event.stopPropagation();
// //         }
// //         setValidated(true);
// //     };

// //     // Function to toggle the visibility of the Service Location section
// //     const toggleServiceLocation = () => {
// //         setShowServiceLocation(!showServiceLocation);
// //     };

// //     // Function to toggle the visibility of the Equipments section
// //     const toggleEquipments = () => {
// //         setShowEquipments(!showEquipments);
// //     };

// //     return (
// //         <Tabs
// //             id="noanim-tab-example"
// //             activeKey={activeKey}
// //             onSelect={(key) => setActiveKey(key)} // Handle tab change event
// //             className="mb-3"
// //         >
// //             <Tab eventKey="summary" title="Job Summary">
// //                 <Form noValidate validated={validated} onSubmit={handleSubmit}>
// //                     <Row className='mb-3'>
// //                         <Form.Group as={Col} md="7" controlId="customerList">
// //                             <Form.Label>Search Customer</Form.Label>
// //                             <Select
// //                                 instanceId="customer-select"
// //                                 options={customers}
// //                                 value={selectedCustomer}
// //                                 onChange={handleCustomerChange}
// //                                 placeholder="Enter Customer Name"
// //                             />
// //                         </Form.Group>

// //                         {/* <Form.Group as={Col} md="4" controlId="customerName">
// //                             <Form.Label>Customer Name</Form.Label>
// //                             <Form.Control
// //                                 required
// //                                 type="text"
// //                                 value={formData.customerName}
// //                                 readOnly
// //                             />
// //                             <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
// //                         </Form.Group> */}
// //                     </Row>

// //                     <hr className="my-4" />
// //                     <h5 className="mb-1">Primary Contact</h5>
// //                     <p className="text-muted">Details about the customer.</p>

// //                     <Row className="mb-3">
// //                         <Form.Group as={Col} md="3" controlId="jobWorker">
// //                             <Form.Label>Select Contact ID</Form.Label>
// //                             <Select
// //                                 instanceId="contact-select"
// //                                 options={contacts}
// //                                 value={selectedContact}
// //                                 onChange={handleContactChange}
// //                                 placeholder="Select Contact ID"
// //                             />
// //                         </Form.Group>
// //                     </Row>

// //                     <Row className="mb-3">
// //                         <Form.Group as={Col} md="4" controlId="validationCustom01">
// //                             <Form.Label>First name</Form.Label>
// //                             <Form.Control
// //                                 required
// //                                 type="text"

// //                                 value={formData.firstName}
// //                                 readOnly
// //                                 disabled
// //                             />
// //                             <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
// //                         </Form.Group>
// //                         <Form.Group as={Col} md="4" controlId="validationCustom02">
// //                             <Form.Label>Middle name</Form.Label>
// //                             <Form.Control
// //                                 required
// //                                 type="text"

// //                                 value={formData.middleName}
// //                                 readOnly
// //                                 disabled
// //                             />
// //                             <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
// //                         </Form.Group>
// //                         <Form.Group as={Col} md="4" controlId="validationCustom03">
// //                             <Form.Label>Last name</Form.Label>
// //                             <Form.Control
// //                                 required
// //                                 type="text"

// //                                 value={formData.lastName}
// //                                 readOnly
// //                                 disabled
// //                             />
// //                             <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
// //                         </Form.Group>
// //                     </Row>
// //                     <Row className="mb-3">
// //                         <Form.Group as={Col} md="4" controlId="validationCustomPhoneNumber">
// //                             <Form.Label>Phone Number</Form.Label>
// //                             <Form.Control
// //                                 defaultValue={formData.phoneNumber}
// //                                 type="text"

// //                                 readOnly
// //                                 disabled
// //                             />
// //                             <Form.Control.Feedback type="invalid">
// //                                 Please provide a valid phone number.
// //                             </Form.Control.Feedback>
// //                         </Form.Group>
// //                         <Form.Group as={Col} md="4" controlId="validationCustomMobilePhone">
// //                             <Form.Label>Mobile Phone</Form.Label>
// //                             <Form.Control
// //                                 defaultValue={formData.mobilePhone}
// //                                 type="text"

// //                                 readOnly
// //                                 disabled
// //                             />
// //                             <Form.Control.Feedback type="invalid">
// //                                 Please provide a valid mobile phone number.
// //                             </Form.Control.Feedback>
// //                         </Form.Group>
// //                         <Form.Group as={Col} md="4" controlId="validationCustomEmail">
// //                             <Form.Label>Email</Form.Label>
// //                             <Form.Control
// //                                 defaultValue={formData.email}
// //                                 type="email"

// //                                 readOnly
// //                                 disabled
// //                             />
// //                             <Form.Control.Feedback type="invalid">
// //                                 Please provide a valid email.
// //                             </Form.Control.Feedback>
// //                         </Form.Group>
// //                     </Row>

// //                     <hr className="my-4" />
// //   {/* Service Location Section */}
// //   <h5 className="mb-1" style={{ cursor: 'pointer' }} onClick={toggleServiceLocation}>
// //     Job Address {showServiceLocation ? '(-)' : '(+)'}
// //   </h5>
// //   {showServiceLocation && (
// //     <>
// //       <p className="text-muted">Details about the Job Address.</p>

// //       <Row className="mb-3">
// //         <Form.Group as={Col} md="4" controlId="jobLocation">
// //           <Form.Label>Select Location ID</Form.Label>
// //           <Select
// //             instanceId="location-select"
// //             options={locations}
// //             value={selectedLocation}
// //             onChange={handleLocationChange}
// //             placeholder="Select Location ID"
// //           />
// //         </Form.Group>
// //       </Row>

// //       <Row className="mb-3">
// //         <Form.Group as={Col} controlId="locationName">
// //           <Form.Label>Location Name</Form.Label>
// //           <Form.Control
// //             type="text"
// //             disabled
// //             value={formData.locationName}
// //             readOnly
// //           />
// //         </Form.Group>
// //         <Form.Group as={Col} controlId="streetAddress">
// //           <Form.Label>Street No.</Form.Label>
// //           <Form.Control
// //             type="text"
// //             disabled
// //             value={formData.streetNo}
// //             readOnly
// //           />
// //         </Form.Group>
// //         <Form.Group as={Col} controlId="streetAddress">
// //           <Form.Label>Street Address</Form.Label>
// //           <Form.Control
// //             type="text"
// //             disabled
// //             value={formData.streetAddress}
// //             readOnly
// //           />
// //         </Form.Group>
// //       </Row>
// //       <Row className="mb-3">
// //         <Form.Group as={Col} controlId="block">
// //           <Form.Label>Block</Form.Label>
// //           <Form.Control
// //             type="text"
// //             disabled
// //             value={formData.block}
// //             readOnly
// //           />
// //         </Form.Group>
// //         <Form.Group as={Col} controlId="building">
// //           <Form.Label>Building No.</Form.Label>
// //           <Form.Control
// //             type="text"
// //             disabled
// //             value={formData.buildingNo}
// //             readOnly
// //           />
// //         </Form.Group>
// //       </Row>
// //       <Row className="mb-3">
// //         <Form.Group as={Col} md="3" controlId="country">
// //           <Form.Label>Country</Form.Label>
// //           <Form.Control
// //             type="text"
// //             disabled
// //             value={formData.country}
// //             readOnly
// //           />
// //         </Form.Group>
// //         <Form.Group as={Col} md="3" controlId="stateProvince">
// //           <Form.Label>State/Province</Form.Label>
// //           <Form.Control
// //             type="text"
// //             disabled
// //             value={formData.stateProvince}
// //             readOnly
// //           />
// //         </Form.Group>
// //         <Form.Group as={Col} md="3" controlId="city">
// //           <Form.Label>City</Form.Label>
// //           <Form.Control
// //             type="text"
// //             disabled
// //             value={formData.city}
// //             readOnly
// //           />
// //         </Form.Group>
// //         <Form.Group as={Col} md="3" controlId="zipCode">
// //           <Form.Label>Zip/Postal Code</Form.Label>
// //           <Form.Control
// //             type="text"
// //             disabled
// //             value={formData.zipCode}
// //             readOnly
// //           />
// //         </Form.Group>
// //       </Row>
// //     </>
// //   )}

// //             <hr className="my-4" />
// //             {/* Equipments Section */}
// //             <h5 className="mb-1" style={{ cursor: 'pointer' }} onClick={toggleEquipments}>
// //               Job Equipments {showEquipments ? '(-)' : '(+)'}
// //             </h5>
// //             {showEquipments && (
// //               <>
// //                 <p className="text-muted">Details about the Equipments.</p>
// //                 <Row className='mb-3'>
// //                   <EquipmentsTable equipments={equipments} onSelectedRowsChange={handleSelectedEquipmentsChange} />
// //                 </Row>
// //               </>
// //             )}
// //             <hr className="my-4" />
// //                 </Form>
// //                 <Row className="align-items-center">
// //                     <Col md={{ span: 4, offset: 8 }} xs={12} className="mt-1">
// //                         <Button variant="primary" onClick={handleNextClick} className="float-end">
// //                             Next
// //                         </Button>
// //                     </Col>
// //                 </Row>

// //             </Tab>
// //             <Tab eventKey="scheduling" title="Job Scheduling">
// //                 <Form>

// //                     <Row className='mb-3'>
// //                     <Col xs="auto">
// //                 <Form.Group as={Col} controlId="jobNo">
// //                   <Form.Label>Job No.</Form.Label>
// //                   <Form.Control type="text" value={'000002'} readOnly style={{ width: '95px' }} />
// //                 </Form.Group>
// //               </Col>
// //                         <Form.Group as={Col} controlId="jobName">
// //                             <Form.Label>Job Name</Form.Label>
// //                             <Form.Control type="text" placeholder="Enter Job Name" />
// //                         </Form.Group>
// //                     </Row>

// //                     <Row className='mb-3'>
// //                         <Form.Group controlId="description">
// //                             <Form.Label>Description</Form.Label>
// //                             <Form.Control as="textarea" rows={3} placeholder="Enter job description" />
// //                         </Form.Group>
// //                     </Row>

// //                     <Row className='mb-3'>
// //                         <Form.Group as={Col} md="4" controlId="jobCategory">
// //                             <Form.Label>Job Priority</Form.Label>
// //                             <Form.Select aria-label="Select job category">
// //                                 <option value="" disabled>Select Priority</option>
// //                                 <option value="L">Low</option>
// //                                 <option value="M">Mid</option>
// //                                 <option value="H">High</option>
// //                             </Form.Select>
// //                         </Form.Group>
// //                         <Form.Group as={Col} md="4" controlId="jobCategory">
// //                             <Form.Label>Job Status</Form.Label>
// //                             <Form.Select aria-label="Select job category">
// //                                 <option value="" disabled>Select Status</option>
// //                                 <option value="C">Created</option>
// //                                 <option value="CO">Confirm</option>
// //                                 <option value="CA">Cancel</option>
// //                                 <option value="JS">Job Started</option>
// //                                 <option value="JC">Job Complete</option>
// //                                 <option value="V">Validate</option>
// //                                 <option value="S">Scheduled</option>
// //                                 <option value="US">Unscheduled</option>
// //                                 <option value="RS">Re-scheduled</option>
// //                             </Form.Select>
// //                         </Form.Group>
// //                         <Form.Group as={Col} md="4" controlId="jobWorker">
// //                             <Form.Label>Assigned Worker</Form.Label>
// //                             <Select
// //                                 instanceId={'wsad123wqwe'}
// //                                 isMulti
// //                                 options=''
// //                                 value=''
// //                                 onChange=''
// //                                 placeholder="Search Worker"

// //                             />
// //                         </Form.Group>

// //                     </Row>

// //                     <Row className="mb-3">
// //                         <Form.Group as={Col} md="4" controlId="arrivalTime">
// //                             <Form.Label>Start Date</Form.Label>
// //                             <Form.Control
// //                                 type="date"
// //                                 placeholder="Enter start date"
// //                                 name="startDate"
// //                             />
// //                         </Form.Group>
// //                         <Form.Group as={Col} md="4" controlId="formEndTime">
// //                             <Form.Label>End Date</Form.Label>
// //                             <Form.Control
// //                                 type="date"
// //                                 placeholder="Enter end date"
// //                                 name="endDate"
// //                             />
// //                         </Form.Group>
// //                     </Row>
// //                     <Row className="mb-3">
// //                         <Form.Group as={Col} md="4" controlId="arrivalTime">
// //                             <Form.Label>Start Time</Form.Label>

// //                             <Form.Control
// //                                 type="time"
// //                                 placeholder="Enter start time"
// //                                 name="startTime"
// //                             />
// //                         </Form.Group>
// //                         <Form.Group as={Col} md="4" controlId="formEndTime">
// //                             <Form.Label>End Time</Form.Label>
// //                             <Form.Control
// //                                 type="time"
// //                                 placeholder="Enter end time"
// //                                 name="endTime"
// //                             />
// //                         </Form.Group>
// //                         <Form.Group as={Col} md="3" controlId="estimatedDuration">
// //                             <Form.Label>Estimated Duration</Form.Label>
// //                             <InputGroup>
// //                                 <Form.Control type="number" placeholder="Hours" />
// //                                 <InputGroup.Text>h</InputGroup.Text>

// //                                 <Form.Control type="number" placeholder="Minutes" />
// //                                 <InputGroup.Text>m</InputGroup.Text>
// //                             </InputGroup>
// //                         </Form.Group>
// //                     </Row>

// //                     <Row className="mb-3">

// //                     </Row>
// //                     <hr className="my-4" />
// //                     <p className="text-muted">Notification:</p>
// //                     <Row className='mt-3'>
// //                         <Form.Group controlId="adminWorkerNotify">
// //                             <Form.Check type="checkbox" label="Admin/Worker: Email Notify when Job Status changed and new Job message Submitted" />
// //                         </Form.Group>

// //                         <Form.Group controlId="customerNotify">
// //                             <Form.Check type="checkbox" label="Customer: Email Notify when Job Status changed and new Job Messaged Submitted" />
// //                         </Form.Group>
// //                     </Row>
// //                     {/* SUBMIT BUTTON! */}
// //                     <Row className="align-items-center">
// //                         <Col md={{ span: 4, offset: 8 }} xs={12} className="mt-4">
// //                             <Button variant="primary" onClick={handleSubmitClick} className="float-end">
// //                                 Submit
// //                             </Button>
// //                         </Col>
// //                     </Row>
// //                 </Form>

// //             </Tab>

// //         </Tabs>

// //     );
// // };

// // export default AddNewJobs;
