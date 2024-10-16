import React, { useState, useEffect } from "react";
import { Tabs, Tab } from "react-bootstrap";
import { db } from "../../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import JobSummary from "./tabs/JobSummary";
import JobScheduling from "./tabs/JobScheduling";
import JobLocation from "./tabs/JobLocation";
import JobImages from "./tabs/JobImages";
import { useRouter } from "next/router";
import Swal from "sweetalert2";

const UpdateJobForm = () => {
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [jobData, setJobData] = useState(null);
  const [formData, setFormData] = useState({
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
    latitude: "",
    longitude: "",
  });

  const [showServiceLocation, setShowServiceLocation] = useState(true);
  const [showEquipments, setShowEquipments] = useState(true);
  const [activeKey, setActiveKey] = useState("summary");

  const router = useRouter();
  const { jobId } = router.query;

  useEffect(() => {
    const fetchJobData = async () => {
      try {
        const jobDoc = doc(db, "jobs", jobId);
        const jobSnapshot = await getDoc(jobDoc);
        if (jobSnapshot.exists()) {
          const jobData = jobSnapshot.data();
          console.log("Job Data from Firestore:", jobData);
          setJobData(jobData);

          setFormData((prevState) => ({
            ...prevState,
            jobNo: jobData.jobNo || "",
            jobName: jobData.jobName || "",
            description: jobData.description || "",
            jobPriority: jobData.jobPriority || "",
            jobStatus: jobData.jobStatus || "",
            startDate: jobData.startDate || "",
            endDate: jobData.endDate || "",
            startTime: jobData.startTime || "",
            endTime: jobData.endTime || "",
            estimatedDurationHours: jobData.estimatedDurationHours || "",
            estimatedDurationMinutes: jobData.estimatedDurationMinutes || "",
          }));

          setSelectedWorkers(jobData.assignedWorkers || []);
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching job:", error);
      }
    };

    if (jobId) {
      fetchJobData();
    }
  }, [jobId]);

  useEffect(() => {
    console.log("Updated formData:", formData);
  }, [formData]);

  const toggleServiceLocation = () => {
    setShowServiceLocation(!showServiceLocation);
  };

  const toggleEquipments = () => {
    setShowEquipments(!showEquipments);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }));
    console.log(`Updated ${name} to ${value}`);
  };

  const handleLocationChange = (selectedOption) => {
    setSelectedLocation(selectedOption);
  };

  // Add the handleWorkersChange function
  const handleWorkersChange = (selectedOptions) => {
    const selectedWorkerIds = selectedOptions.map((option) => option.value);
    setSelectedWorkers(selectedWorkerIds);
    console.log("Updated Selected Workers:", selectedWorkerIds); // Debug log
  };

  const handleSubmit = async () => {
    try {
      const jobDocRef = doc(db, "jobs", jobId);

      await updateDoc(jobDocRef, {
        ...formData,
        assignedWorkers: selectedWorkers,
      });

      console.log("Job updated successfully!");

      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Job updated successfully!",
        confirmButtonText: "OK",
      });

      router.push("/dashboard/jobs/list-jobs");
    } catch (error) {
      console.error("Error updating job:", error);

      await Swal.fire({
        icon: "error",
        title: "Error!",
        text: "There was an error updating the job. Please try again.",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <Tabs
      id="noanim-tab-example"
      activeKey={activeKey}
      onSelect={(key) => setActiveKey(key)}
      className="mb-3"
    >
      <Tab eventKey="summary" title="Job Summary">
        <JobSummary
          jobId={jobId}
          formData={formData}
          selectedCustomer={selectedCustomer}
          selectedContact={selectedContact}
          selectedLocation={selectedLocation}
          showServiceLocation={showServiceLocation}
          showEquipments={showEquipments}
          toggleServiceLocation={toggleServiceLocation}
          toggleEquipments={toggleEquipments}
          setActiveTab={setActiveKey}
        />
      </Tab>
      <Tab eventKey="scheduling" title="Job Scheduling">
        <JobScheduling
          jobId={jobId}
          formData={formData}
          selectedWorkers={selectedWorkers}
          handleInputChange={handleInputChange}
          handleWorkersChange={handleWorkersChange} // Pass the workers change handler
          handleSubmit={handleSubmit}
        />
      </Tab>
      <Tab eventKey="location" title="Job Location">
        <JobLocation jobId={jobId} />
      </Tab>
      <Tab eventKey="images" title="Job Images">
        <JobImages jobId={jobId} assignedWorkers={selectedWorkers} />
      </Tab>
    </Tabs>
  );
};

export default UpdateJobForm;

// import React, { useState, useEffect } from 'react';
// import { Tabs, Tab } from 'react-bootstrap';
// import { db } from '../../../firebase';
// import { doc, getDoc } from 'firebase/firestore';
// import JobSummary from './tabs/JobSummary';
// import JobScheduling from './tabs/JobScheduling';
// import JobLocation from './tabs/JobLocation';
// import JobImages from './tabs/JobImages';
// import { useRouter } from 'next/router';

// const UpdateJobForm = () => {
//   const [selectedWorkers, setSelectedWorkers] = useState([]);
//   const [selectedCustomer, setSelectedCustomer] = useState(null);
//   const [selectedContact, setSelectedContact] = useState(null);
//   const [selectedLocation, setSelectedLocation] = useState(null);
//   const [jobData, setJobData] = useState(null);
//   const [formData, setFormData] = useState({
//     customerName: '',
//     firstName: '',
//     middleName: '',
//     lastName: '',
//     phoneNumber: '',
//     mobilePhone: '',
//     email: '',
//     locationName: '',
//     streetNo: '',
//     streetAddress: '',
//     block: '',
//     buildingNo: '',
//     country: '',
//     stateProvince: '',
//     city: '',
//     zipCode: '',
//     jobNo: '',
//     jobName: '',
//     description: '',
//     jobPriority: '',
//     jobStatus: '',
//     startDate: '',
//     endDate: '',
//     startTime: '',
//     endTime: '',
//     estimatedDurationHours: '',
//     estimatedDurationMinutes: '',
//     adminWorkerNotify: false,
//     customerNotify: false,
//     latitude: '',
//     longitude: ''
//   });

//   const [showServiceLocation, setShowServiceLocation] = useState(true);
//   const [showEquipments, setShowEquipments] = useState(true);
//   const [activeKey, setActiveKey] = useState('summary');

//   const router = useRouter();
//   const { jobId } = router.query;

//   useEffect(() => {
//     const fetchJobData = async () => {
//       try {
//         const jobDoc = doc(db, 'jobs', jobId);
//         const jobSnapshot = await getDoc(jobDoc);
//         if (jobSnapshot.exists()) {
//           const jobData = jobSnapshot.data();
//           console.log('Job Data from Firestore:', jobData); // Debug log
//           setJobData(jobData);
//           setFormData({
//             ...formData,
//             ...jobData,
//             startDate: jobData.startDate || '',
//             endDate: jobData.endDate || '',
//             startTime: jobData.startTime || '',
//             endTime: jobData.endTime || '',
//             estimatedDurationHours: jobData.estimatedDurationHours || '',
//             estimatedDurationMinutes: jobData.estimatedDurationMinutes || ''
//           });
//           setSelectedWorkers(jobData.assignedWorkers || []);
//         } else {
//           console.error('No such document!');
//         }
//       } catch (error) {
//         console.error('Error fetching job:', error);
//       }
//     };

//     if (jobId) {
//       fetchJobData();
//     }
//   }, [jobId]);

//   useEffect(() => {
//     console.log('Updated formData:', formData); // Debug log
//   }, [formData]);

//   const toggleServiceLocation = () => {
//     setShowServiceLocation(!showServiceLocation);
//   };

//   const toggleEquipments = () => {
//     setShowEquipments(!showEquipments);
//   };

//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData(prevState => ({
//       ...prevState,
//       [name]: type === 'checkbox' ? checked : value,
//     }));
//     console.log(`Updated ${name} to ${value}`); // Debug log
//   };

//   const handleLocationChange = (selectedOption) => {
//     setSelectedLocation(selectedOption);
//   };

//   return (
//     <Tabs
//       id="noanim-tab-example"
//       activeKey={activeKey}
//       onSelect={(key) => setActiveKey(key)}
//       className="mb-3"
//     >
//       <Tab eventKey="summary" title="Job Summary">
//         <JobSummary
//           jobId={jobId}
//           formData={formData}
//           selectedCustomer={selectedCustomer}
//           selectedContact={selectedContact}
//           selectedLocation={selectedLocation}
//           showServiceLocation={showServiceLocation}
//           showEquipments={showEquipments}
//           toggleServiceLocation={toggleServiceLocation}
//           toggleEquipments={toggleEquipments}
//         />
//       </Tab>
//       <Tab eventKey="scheduling" title="Job Scheduling">
//         <JobScheduling
//           jobId={jobId}
//           formData={formData}
//           selectedWorkers={selectedWorkers}
//           handleInputChange={handleInputChange}
//         />
//       </Tab>
//       <Tab eventKey="location" title="Job Location">
//         <JobLocation
//           jobId={jobId}
//           workerId={selectedWorkers.length > 0 ? selectedWorkers[0] : null}
//         />
//       </Tab>
//       <Tab eventKey="images" title="Job Images">
//         <JobImages
//           jobId={jobId}
//           assignedWorkers={selectedWorkers}
//         />
//       </Tab>
//     </Tabs>
//   );
// };

// export default UpdateJobForm;
