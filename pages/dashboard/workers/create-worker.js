import React, { useState } from 'react';
import { Container, Row, Col, Card, Tabs, Tab, Breadcrumb } from 'react-bootstrap';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, setDoc, doc, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../../firebase'; 
import { ContactTab } from 'sub-components/dashboard/worker/ContactTab';
import { PersonalTab } from 'sub-components/dashboard/worker/PersonalTab';
import { SkillsTab } from 'sub-components/dashboard/worker/SkillsTab';
import { toast, ToastContainer } from 'react-toastify';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2'; 
import { GeeksSEO } from 'widgets';

const CreateWorker = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [personalData, setPersonalData] = useState({});
  const [contactData, setContactData] = useState({});
  const [skillsData, setSkillsData] = useState([]);
  const [isPersonalTabComplete, setIsPersonalTabComplete] = useState(false);
  const [isContactTabComplete, setIsContactTabComplete] = useState(false);
  const timestamp = Timestamp.now();
  const router = useRouter();

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const logActivity = async (activity, activitybrief) => {
    try {
      await addDoc(collection(db, 'recentActivities'), {
        activity,
        activitybrief,
        time: Timestamp.now(),
        icon: 'check',
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const handlePersonalFormSubmit = async (personalFormData, workerId) => {
    // Validation: Check for required fields
    if (!personalFormData.firstName || !personalFormData.lastName || !personalFormData.email || !personalFormData.password) {
      toast.error('Please fill in all required personal fields.');
      return; // Stop execution if validation fails
    }

    try {
      const { email, password } = personalFormData;
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      const userData = { uid: user.uid, workerId, ...personalFormData, timestamp };

      setPersonalData(userData);
      setIsPersonalTabComplete(true); // Mark personal tab as complete
      handleTabChange('contact'); // Move to contact tab
    } catch (error) {
      console.error('Error adding document:', error);
      toast.error('Error adding document: ' + error.message);
    }
  };

  const handleContactFormSubmit = async (contactFormData) => {
    // Validation: Check for required fields
    if (!contactFormData.primaryPhone || !contactFormData.streetAddress || !contactFormData.emergencyContactName || !contactFormData.emergencyContactPhone) {
      toast.error('Please fill in all required contact fields.');
      return; // Stop execution if validation fails
    }

    try {
      setContactData({ ...contactFormData });
      setIsContactTabComplete(true); // Mark contact tab as complete
      handleTabChange('skills'); // Move to skills tab
    } catch (error) {
      console.error('Error saving contact data:', error);
      toast.error('Error saving contact data: ' + error.message);
    }
  };

  const handleSkillsFormSubmit = async (skillsFormData) => {
    // Validation: Check for required fields
    if (!skillsFormData.length) { // Check if at least one skill is provided
      toast.error('Please fill in all required skills fields.');
      return; // Stop execution if validation fails
    }

    try {
      const userData = { ...personalData, ...contactData, skills: skillsFormData };
  
      await setDoc(doc(collection(db, 'users'), personalData.workerId), userData);
      
      // Show a success toast
      toast.success('Worker profile created successfully.');
  
      // Use SweetAlert for confirmation dialog
      await Swal.fire({
        title: 'Success!',
        text: 'Worker profile created successfully. Click OK to continue.',
        icon: 'success',
        confirmButtonText: 'OK',
      });
  
      // Redirect after the user clicks OK
      router.replace('/dashboard/workers/create-worker');
  
      // Log this activity
      await logActivity('Worker Created', `${personalData.firstName} ${personalData.lastName} has been added as a worker.`);
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('An error occurred while saving data: ' + error.message);
    }
  };
  
  return (
    <Container>
       <GeeksSEO title="Add Worker | SAS - SAP B1 Portal" />
      <Tab.Container defaultActiveKey="add">
        <Row>
          <Col lg={12} md={12} sm={12}>
            <div className="border-bottom pb-4 mb-4 d-flex align-items-center justify-content-between">
              <div className="mb-3 mb-md-0">
                <h1 className="mb-1 h2 fw-bold">Create New Worker</h1>
                <Breadcrumb>
                  <Breadcrumb.Item href="#">Dashboard</Breadcrumb.Item>
                  <Breadcrumb.Item href="#">Workers</Breadcrumb.Item>
                  <Breadcrumb.Item active>Add new Worker</Breadcrumb.Item>
                </Breadcrumb>
              </div>
            </div>
          </Col>
        </Row>
        
        <Tab.Content>
          <Tab.Pane eventKey="add" className="pb-4 tab-pane-custom-margin">
            <ToastContainer
              position="top-right"
              autoClose={2000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
            <Row>
              <Col xl={12} lg={12} md={12} sm={12}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <Tabs activeKey={activeTab} onSelect={handleTabChange} className="mb-3">
                      <Tab eventKey="personal" title="Personal">
                        <PersonalTab 
                          onSubmit={handlePersonalFormSubmit} 
                          disabled={false} // Always enabled
                        />
                      </Tab>
                      <Tab eventKey="contact" title="Contact" disabled={!isPersonalTabComplete}>
                        <ContactTab 
                          onSubmit={handleContactFormSubmit} 
                          disabled={!isPersonalTabComplete} // Disable if personal tab is not complete
                        />
                      </Tab>
                      <Tab eventKey="skills" title="Skills" disabled={!isContactTabComplete}>
                        <SkillsTab 
                          onSubmit={handleSkillsFormSubmit} 
                          disabled={!isContactTabComplete} // Disable if contact tab is not complete
                        />
                      </Tab>
                    </Tabs>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </Container>
  );
};

export default CreateWorker;


// import React, { useState } from 'react';
// import { Container, Row, Col, Card, Tabs, Tab, Breadcrumb } from 'react-bootstrap';
// import { createUserWithEmailAndPassword } from 'firebase/auth';
// import { collection, setDoc, doc, addDoc, Timestamp } from 'firebase/firestore';
// import { db, auth } from '../../../firebase'; 
// import { ContactTab } from 'sub-components/dashboard/worker/ContactTab';
// import { PersonalTab } from 'sub-components/dashboard/worker/PersonalTab';
// import { SkillsTab } from 'sub-components/dashboard/worker/SkillsTab';
// import { toast, ToastContainer } from 'react-toastify';
// import { useRouter } from 'next/router';
// import Swal from 'sweetalert2'; 

// const CreateWorker = () => {
//   const [activeTab, setActiveTab] = useState('personal');
//   const [personalData, setPersonalData] = useState({});
//   const [contactData, setContactData] = useState({});
//   const [skillsData, setSkillsData] = useState({});
//   const [isPersonalTabComplete, setIsPersonalTabComplete] = useState(false);
//   const [isContactTabComplete, setIsContactTabComplete] = useState(false);
//   const timestamp = Timestamp.now();
//   const router = useRouter();

//   const handleTabChange = (key) => {
//     setActiveTab(key);
//   };

//   const logActivity = async (activity, activitybrief) => {
//     try {
//       await addDoc(collection(db, 'recentActivities'), {
//         activity,
//         activitybrief,
//         time: Timestamp.now(),
//         icon: 'check',
//       });
//     } catch (error) {
//       console.error('Error logging activity:', error);
//     }
//   };

//   const handlePersonalFormSubmit = async (personalFormData, workerId) => {
//     // Validation: Check for required fields
//     if (!personalFormData.firstName || !personalFormData.lastName || !personalFormData.email || !personalFormData.password) {
//       toast.error('Please fill in all required personal fields.');
//       return; // Stop execution if validation fails
//     }

//     try {
//       const { email, password } = personalFormData;
//       const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
//       const userData = { uid: user.uid, workerId, ...personalFormData, timestamp };

//       setPersonalData(userData);
//       setIsPersonalTabComplete(true); // Mark personal tab as complete
//       handleTabChange('contact'); // Move to contact tab
//     } catch (error) {
//       console.error('Error adding document:', error);
//       toast.error('Error adding document: ' + error.message);
//     }
//   };

//   const handleContactFormSubmit = async (contactFormData) => {
//     // Validation: Check for required fields
//     if (!contactFormData.primaryPhone || !contactFormData.streetAddress || !contactFormData.emergencyContactName || !contactFormData.emergencyContactPhone) {
//       toast.error('Please fill in all required contact fields.');
//       return; // Stop execution if validation fails
//     }

//     try {
//       setContactData({ ...contactFormData });
//       setIsContactTabComplete(true); // Mark contact tab as complete
//       handleTabChange('skills'); // Move to skills tab
//     } catch (error) {
//       console.error('Error saving contact data:', error);
//       toast.error('Error saving contact data: ' + error.message);
//     }
//   };

//   const handleSkillsFormSubmit = async (skillsFormData) => {
//     // Validation: Check for required fields
//     if (!skillsFormData.skill1 || !skillsFormData.skill2) { // Change this based on your actual required skills
//       toast.error('Please fill in all required skills fields.');
//       return; // Stop execution if validation fails
//     }

//     try {
//       const userData = { ...personalData, ...contactData, skills: skillsFormData };
  
//       await setDoc(doc(collection(db, 'users'), personalData.workerId), userData);
      
//       // Show a success toast
//       toast.success('Worker profile created successfully.');
  
//       // Use SweetAlert for confirmation dialog
//       await Swal.fire({
//         title: 'Success!',
//         text: 'Worker profile created successfully. Click OK to continue.',
//         icon: 'success',
//         confirmButtonText: 'OK',
//       });
  
//       // Redirect after the user clicks OK
//       router.replace('/dashboard/workers/list');
  
//       // Log this activity
//       await logActivity('Worker Created', `${personalData.firstName} ${personalData.lastName} has been added as a worker.`);
//     } catch (error) {
//       console.error('Error saving data:', error);
//       toast.error('An error occurred while saving data: ' + error.message);
//     }
//   };
  
//   return (
//     <Container>
//       <Tab.Container defaultActiveKey="add">
//         <Row>
//           <Col lg={12} md={12} sm={12}>
//             <div className="border-bottom pb-4 mb-4 d-flex align-items-center justify-content-between">
//               <div className="mb-3 mb-md-0">
//                 <h1 className="mb-1 h2 fw-bold">Create New Worker</h1>
//                 <Breadcrumb>
//                   <Breadcrumb.Item href="#">Dashboard</Breadcrumb.Item>
//                   <Breadcrumb.Item href="#">Workers</Breadcrumb.Item>
//                   <Breadcrumb.Item active>Add new Worker</Breadcrumb.Item>
//                 </Breadcrumb>
//               </div>
//             </div>
//           </Col>
//         </Row>
        
//         <Tab.Content>
//           <Tab.Pane eventKey="add" className="pb-4 tab-pane-custom-margin">
//             <ToastContainer
//               position="top-right"
//               autoClose={2000}
//               hideProgressBar={false}
//               newestOnTop={false}
//               closeOnClick
//               rtl={false}
//               pauseOnFocusLoss
//               draggable
//               pauseOnHover
//               theme="colored"
//             />
//             <Row>
//               <Col xl={12} lg={12} md={12} sm={12}>
//                 <Card className="shadow-sm">
//                   <Card.Body>
//                     <Tabs activeKey={activeTab} onSelect={handleTabChange} className="mb-3">
//                       <Tab eventKey="personal" title="Personal">
//                         <PersonalTab 
//                           onSubmit={handlePersonalFormSubmit} 
//                           disabled={false} // Always enabled
//                         />
//                       </Tab>
//                       <Tab eventKey="contact" title="Contact" disabled={!isPersonalTabComplete}>
//                         <ContactTab 
//                           onSubmit={handleContactFormSubmit} 
//                           disabled={!isPersonalTabComplete} // Disable if personal tab is not complete
//                         />
//                       </Tab>
//                       <Tab eventKey="skills" title="Skills" disabled={!isContactTabComplete}>
//                         <SkillsTab 
//                           onSubmit={handleSkillsFormSubmit} 
//                           disabled={!isContactTabComplete} // Disable if contact tab is not complete
//                         />
//                       </Tab>
//                     </Tabs>
//                   </Card.Body>
//                 </Card>
//               </Col>
//             </Row>
//           </Tab.Pane>
//         </Tab.Content>
//       </Tab.Container>
//     </Container>
//   );
// };

// export default CreateWorker;



// // import React, { useState } from 'react';
// // import { Container, Row, Col, Card, Tabs, Tab, Breadcrumb } from 'react-bootstrap';
// // import { createUserWithEmailAndPassword } from 'firebase/auth';
// // import { collection, setDoc, doc, addDoc, Timestamp } from 'firebase/firestore';
// // import { db, auth } from '../../../firebase'; 
// // import { ContactTab } from 'sub-components/dashboard/worker/ContactTab';
// // import { PersonalTab } from 'sub-components/dashboard/worker/PersonalTab';
// // import { SkillsTab } from 'sub-components/dashboard/worker/SkillsTab';
// // import { toast, ToastContainer } from 'react-toastify';
// // import { useRouter } from 'next/router';
// // import Swal from 'sweetalert2'; // Make sure to import SweetAlert2

// // const CreateWorker = () => {
// //   const [activeTab, setActiveTab] = useState('personal');
// //   const [personalData, setPersonalData] = useState({});
// //   const [contactData, setContactData] = useState({});
// //   const [skillsData, setSkillsData] = useState({});
// //   const timestamp = Timestamp.now();
// //   const router = useRouter();

// //   const handleTabChange = (key) => {
// //     setActiveTab(key);
// //   };

// //   const logActivity = async (activity, activitybrief) => {
// //     try {
// //       await addDoc(collection(db, 'recentActivities'), {
// //         activity,
// //         activitybrief,
// //         time: Timestamp.now(),
// //         icon: 'check',
// //       });
// //     } catch (error) {
// //       console.error('Error logging activity:', error);
// //     }
// //   };

// //   const handlePersonalFormSubmit = async (personalFormData, workerId) => {
// //     // Validation: Check for required fields
// //     if (!personalFormData.firstName || !personalFormData.lastName || !personalFormData.email || !personalFormData.password) {
// //       toast.error('Please fill in all required personal fields.');
// //       return; // Stop execution if validation fails
// //     }

// //     try {
// //       const { email, password } = personalFormData;
// //       const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
// //       const userData = { uid: user.uid, workerId, ...personalFormData, timestamp };

// //       setPersonalData(userData);
// //       handleTabChange('contact');
// //     } catch (error) {
// //       console.error('Error adding document:', error);
// //       toast.error('Error adding document: ' + error.message);
// //     }
// //   };

// //   const handleContactFormSubmit = async (contactFormData) => {
// //     // Validation: Check for required fields
// //     if (!contactFormData.phone || !contactFormData.address) {
// //       toast.error('Please fill in all required contact fields.');
// //       return; // Stop execution if validation fails
// //     }

// //     try {
// //       setContactData({ ...contactFormData });
// //       handleTabChange('skills');
// //     } catch (error) {
// //       console.error('Error saving contact data:', error);
// //       toast.error('Error saving contact data: ' + error.message);
// //     }
// //   };

// //   const handleSkillsFormSubmit = async (skillsFormData) => {
// //     // Validation: Check for required fields
// //     if (!skillsFormData.skill1 || !skillsFormData.skill2) { // Change this based on your actual required skills
// //       toast.error('Please fill in all required skills fields.');
// //       return; // Stop execution if validation fails
// //     }

// //     try {
// //       const userData = { ...personalData, ...contactData, skills: skillsFormData };
  
// //       await setDoc(doc(collection(db, 'users'), personalData.workerId), userData);
      
// //       // Show a success toast
// //       toast.success('Worker profile created successfully.');
  
// //       // Use SweetAlert for confirmation dialog
// //       await Swal.fire({
// //         title: 'Success!',
// //         text: 'Worker profile created successfully. Click OK to continue.',
// //         icon: 'success',
// //         confirmButtonText: 'OK',
// //       });
  
// //       // Redirect after the user clicks OK
// //       router.replace('/dashboard/workers/list');
  
// //       // Log this activity
// //       await logActivity('Worker Created', `${personalData.firstName} ${personalData.lastName} has been added as a worker.`);
// //     } catch (error) {
// //       //console.error('Error saving data:', error);
    
// //       toast.error('An error occurred while saving data: ' + error.message);
// //     }
// //   };
  
// //   return (
// //     <Container>
// //       <Tab.Container defaultActiveKey="add">
// //         <Row>
// //           <Col lg={12} md={12} sm={12}>
// //             <div className="border-bottom pb-4 mb-4 d-flex align-items-center justify-content-between">
// //               <div className="mb-3 mb-md-0">
// //                 <h1 className="mb-1 h2 fw-bold">
// //                   Create New Worker
// //                 </h1>
// //                 <Breadcrumb>
// //                   <Breadcrumb.Item href="#">Dashboard</Breadcrumb.Item>
// //                   <Breadcrumb.Item href="#">Workers</Breadcrumb.Item>
// //                   <Breadcrumb.Item active>Add new Worker</Breadcrumb.Item>
// //                 </Breadcrumb>
// //               </div>
// //             </div>
// //           </Col>
// //         </Row>
        
// //         <Tab.Content>
// //           <Tab.Pane eventKey="add" className="pb-4 tab-pane-custom-margin">
// //             <ToastContainer
// //               position="top-right"
// //               autoClose={2000}
// //               hideProgressBar={false}
// //               newestOnTop={false}
// //               closeOnClick
// //               rtl={false}
// //               pauseOnFocusLoss
// //               draggable
// //               pauseOnHover
// //               theme="colored"
// //             />
// //             <Row>
// //               <Col xl={12} lg={12} md={12} sm={12}>
// //                 <Card className="shadow-sm">
// //                   <Card.Body>
// //                     <Tabs activeKey={activeTab} onSelect={handleTabChange} className="mb-3">
// //                       <Tab eventKey="personal" title="Personal">
// //                         <PersonalTab onSubmit={handlePersonalFormSubmit} />
// //                       </Tab>
// //                       <Tab eventKey="contact" title="Contact">
// //                         <ContactTab onSubmit={handleContactFormSubmit} />
// //                       </Tab>
// //                       <Tab eventKey="skills" title="Skills">
// //                         <SkillsTab onSubmit={handleSkillsFormSubmit} />
// //                       </Tab>
// //                     </Tabs>
// //                   </Card.Body>
// //                 </Card>
// //               </Col>
// //             </Row>
// //           </Tab.Pane>
// //         </Tab.Content>
// //       </Tab.Container>
// //     </Container>
// //   );
// // };

// // export default CreateWorker;





// // import React, { useState } from 'react';
// // import Swal from 'sweetalert2';
// // import { Container, Row, Col, Card, Tabs, Tab } from 'react-bootstrap';
// // import { createUserWithEmailAndPassword } from 'firebase/auth';
// // import { collection, setDoc, doc, Timestamp } from 'firebase/firestore';
// // import { db, auth } from '../../../firebase'; 
// // import { ContactTab } from 'sub-components/dashboard/worker/ContactTab';
// // import { PersonalTab } from 'sub-components/dashboard/worker/PersonalTab';
// // import { SkillsTab } from 'sub-components/dashboard/worker/SkillsTab';


// // const CreateWorker = () => {
// //   const [activeTab, setActiveTab] = useState('personal');
// //   const [personalData, setPersonalData] = useState({});
// //   const [contactData, setContactData] = useState({});
// //   const [skillsData, setSkillsData] = useState({});
// //   const timestamp = Timestamp.now();

// //   const handleTabChange = (key) => {
// //     setActiveTab(key);
// //   };

// //   const handlePersonalFormSubmit = async (personalFormData, workerId) => {
// //     try {
// //       const { email, password } = personalFormData;
// //       const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
// //       // Include workerId in userData along with other personal data
// //       const userData = { uid: user.uid, workerId, ...personalFormData, timestamp };

// //       setPersonalData(userData);
// //       handleTabChange('contact');
// //     } catch (error) {
// //       console.error('Error adding document:', error);
// //     }
// //   };

// //   const handleContactFormSubmit = async (contactFormData) => {
// //     try {
// //       setContactData({ ...contactFormData });
// //       handleTabChange('skills');
// //     } catch (error) {
// //       console.error('Error saving contact data:', error);
// //     }
// //   };

// //   const handleSkillsFormSubmit = async (skillsFormData) => {
// //     try {
// //       // Combine all data including skills
// //       const userData = { ...personalData, ...contactData, skills: skillsFormData };
  
// //       // Save all data to Firestore
// //       const userDocRef = await setDoc(doc(collection(db, 'users'), personalData.workerId), userData);
// //       handleTabChange('personal');
      
//   //     // Display SweetAlert success alert
//   //     Swal.fire({
//   //       title: 'Success!',
//   //       text: 'Worker profile created successfully.',
//   //       icon: 'success',
//   //     });
//   //   } catch (error) {
//   //     console.error('Error saving data:', error);
//   //     // Display SweetAlert error alert
//   //     Swal.fire({
//   //       title: 'Error!',
//   //       text: 'An error occurred while saving data.',
//   //       icon: 'error',
//   //     });
//   //   }
//   // };
 
// //   return (
// //     <Container>
// //       <Row>
// //         <Col xl={12} lg={12} md={12} sm={12}>
// //           <Card className="shadow-sm">
// //             <Card.Body>
// //               <Tabs activeKey={activeTab} onSelect={handleTabChange} className="mb-3">
// //                 <Tab eventKey="personal" title="Personal">
// //                   <PersonalTab onSubmit={handlePersonalFormSubmit} />
// //                 </Tab>
// //                 <Tab eventKey="contact" title="Contact">
// //                   <ContactTab onSubmit={handleContactFormSubmit} />
// //                 </Tab>
// //                 <Tab eventKey="skills" title="Skills">
// //                   <SkillsTab onSubmit={handleSkillsFormSubmit} />
// //                 </Tab>
// //               </Tabs>
// //             </Card.Body>
// //           </Card>
// //         </Col>
// //       </Row>
// //     </Container>
// //   );
// // };

// // export default CreateWorker;





// // import React, { useState } from 'react';

// // import { Container, Row, Col, Card, Tabs, Tab, Button } from 'react-bootstrap';
// // import { ContactTab } from 'sub-components/dashboard/worker/ContactTab';
// // import { PersonalTab } from 'sub-components/dashboard/worker/PersonalTab';
// // import { SkillsTab } from 'sub-components/dashboard/worker/SkillsTab';
// // import { addDoc, collection } from 'firebase/firestore';
// // import { db } from './../../../firebase'; 

// // const CreateWorker = () => {
// //   const [activeTab, setActiveTab] = useState('personal');
// //   const [formData, setFormData] = useState({});

// //   const handleTabChange = (key) => {
// //     setActiveTab(key);
// //   };

// //   const handlePersonalFormSubmit = async (personalFormData) => {
// //     try {
// //       // Create user with email and password
// //       const { email, password, displayName } = personalFormData;
// //       await createUserWithEmailAndPassword(auth, email, password);

// //       const currentUser = auth.currentUser;
// //       await updateProfile(currentUser, { displayName });
  
    
// //       const userData = {
// //         email,
// //         displayName,
// //       };
// //       const docRef = await addDoc(collection(db, 'users'), userData);
  
// //       // Move to the next tab
// //       setFormData({ ...formData, personal: personalFormData });
// //       handleTabChange('contact');
// //     } catch (error) {
// //       console.error('Error creating user:', error);
// //     }
// //   };

// //   const handleContactFormSubmit = async (contactFormData) => {
// //     try {
// //       // Save contact data to Firestore
// //       const currentUser = auth.currentUser;
// //       const contactData = {
// //         userId: currentUser.uid, 
// //         ...contactFormData, 
// //       };
// //       await addDoc(collection(db, 'contact'), contactData);
  
      
// //       setFormData({ ...formData, contact: contactFormData });
// //       handleTabChange('skills');
// //     } catch (error) {
// //       console.error('Error saving contact data:', error);
      
// //     }
// //   };
  
// //   const handleSkillsFormSubmit = async (skillsFormData) => {
// //     try {
// //       // Save skills data to Firestore
// //       const currentUser = auth.currentUser;
// //       const skillsData = {
// //         userId: currentUser.uid, 
// //         ...skillsFormData, 
// //       };
// //       await addDoc(collection(db, 'skills'), skillsData);
  
// //       // Move to the next tab or perform other actions
// //       setFormData({ ...formData, skills: skillsFormData });
// //       console.log(formData); 
// //     } catch (error) {
// //       console.error('Error saving skills data:', error);
// //       // Handle error (e.g., show error message to the user)
// //     }
// //   };
  
// // //   const handlePersonalFormSubmit = (personalFormData) => {
// // //     setFormData({ ...formData, personal: personalFormData });
// // //     handleTabChange('contact');
// // //   };
  
// // //   const handleContactFormSubmit = (contactFormData) => {
// // //     setFormData({ ...formData, contact: contactFormData });
// // //     handleTabChange('skills');
// // //   };

// // //   const handleSkillsFormSubmit = (skillsFormData) => {
// // //     setFormData({ ...formData, skills: skillsFormData });
// // //     console.log(formData); // Log form data after skills form submission
// // //   };

  

// //   return (
// //     <Container>
// //       <Row>
// //         <Col xl={12} lg={12} md={12} sm={12}>
// //           <Card className="shadow-sm">
// //             <Card.Body>
// //               <Tabs activeKey={activeTab} onSelect={handleTabChange} className="mb-3">
// //                 <Tab eventKey="personal" title="Personal">
// //                   <PersonalTab onSubmit={handlePersonalFormSubmit} />
// //                 </Tab>
// //                 <Tab eventKey="contact" title="Contact">
// //                   <ContactTab onSubmit={handleContactFormSubmit} />
// //                 </Tab>
// //                 <Tab eventKey="skills" title="Skills">
// //                   <SkillsTab onSubmit={handleSkillsFormSubmit} />
// //                 </Tab>
// //               </Tabs>
// //             </Card.Body>
// //           </Card>
// //         </Col>
// //       </Row>
// //     </Container>
// //   );
// // };

// // export default CreateWorker;



// // import React from 'react'
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
// // } from 'react-bootstrap';

// // import Tab from 'react-bootstrap/Tab';
// // import Tabs from 'react-bootstrap/Tabs';
// // import { ContactTab } from 'sub-components/dashboard/worker/ContactTab';
// // import { PersonalTab } from 'sub-components/dashboard/worker/PersonalTab';
// // import { SkillsTab } from 'sub-components/dashboard/worker/SkillsTab';


// // const CreateWorker = () => {
    
// //   return (
// //       <Container>
// //           <Row>
// //               <Col xl={12} lg={12} md={12} sm={12}>
// //                   <Card className="shadow-sm">
// //                       <Card.Body>
// //                           <Tabs
// //                               defaultActiveKey="personal"
// //                               id="uncontrolled-tab-example"
// //                               className="mb-3"
// //                           >
// //                               <Tab eventKey="personal" title="Personal">
// //                               <PersonalTab />
// //                               </Tab>
// //                               <Tab eventKey="contact" title="Contact">
// //                                   <ContactTab />
// //                               </Tab>
// //                               <Tab eventKey="skills" title="Skills">
// //                                   <SkillsTab />
// //                                </Tab>
            
// //                           </Tabs>
                         

// //                       </Card.Body>
                      
// //                   </Card>
// //               </Col>
// //           </Row>
// //       </Container>
// //   )
// // }

// // export default CreateWorker