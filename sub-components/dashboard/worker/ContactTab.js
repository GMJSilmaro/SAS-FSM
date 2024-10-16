import React, { useState, useEffect } from "react";
import { Row, Col, Form, Button } from "react-bootstrap";
import { toast } from "react-toastify";

export const ContactTab = ({ onSubmit, initialValues }) => {
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [activePhone1, setActive1] = useState(false);
  const [activePhone2, setActive2] = useState(false);
  const [streetAddress, setStreetAddress] = useState("");
  const [stateProvince, setStateProvince] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("");

  useEffect(() => {
    // Populate form fields with initial values if provided
    if (initialValues) {
      setPrimaryPhone(initialValues.primaryPhone || "");
      setSecondaryPhone(initialValues.secondaryPhone || "");
      setActive1(initialValues.activePhone1 || false);
      setActive2(initialValues.activePhone2 || false);
      setStreetAddress(initialValues.streetAddress || "");
      setStateProvince(initialValues.stateProvince || "");
      setZipCode(initialValues.zipCode || "");
      setEmergencyContactName(initialValues.emergencyContactName || "");
      setEmergencyContactPhone(initialValues.emergencyContactPhone || "");
      setEmergencyRelationship(initialValues.emergencyRelationship || "");
    }
  }, [initialValues]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = {
      primaryPhone,
      secondaryPhone,
      activePhone1,
      activePhone2,
      streetAddress,
      stateProvince,
      zipCode,
      emergencyContactName,
      emergencyContactPhone,
      emergencyRelationship,
    };

    // Log the data for debugging
    console.log("Contact Form Data:", formData);

    // Check if required fields are filled
    if (
      !primaryPhone ||
      !streetAddress ||
      !emergencyContactName ||
      !emergencyContactPhone ||
      !stateProvince ||
      !zipCode
    ) {
      toast.error("Please fill in all required contact fields.");
      return;
    }

    // If all fields are valid, submit the form
    onSubmit(formData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row className="mb-3">
        <Form.Label>Primary Phone Number</Form.Label>
        <Form.Group as={Col} sm={3} controlId="formPhone2">
          <Form.Control
            type="text"
            value={primaryPhone}
            onChange={(e) => setPrimaryPhone(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group as={Col} controlId="fromSwitchActive">
          <Form.Check
            type="switch"
            id="active-phone1"
            label="Active"
            checked={activePhone1}
            onChange={(e) => setActive1(e.target.checked)}
          />
        </Form.Group>
      </Row>
      <Row className="mb-3">
        <Form.Label>Secondary Phone Number</Form.Label>
        <Form.Group as={Col} sm={3} controlId="formPhone4">
          <Form.Control
            type="text"
            value={secondaryPhone}
            onChange={(e) => setSecondaryPhone(e.target.value)}
          />
        </Form.Group>
        <Form.Group as={Col} controlId="fromSwitchActive">
          <Form.Check
            type="switch"
            id="active-phone2"
            label="Active"
            checked={activePhone2}
            onChange={(e) => setActive2(e.target.checked)}
          />
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} controlId="formGridStreetAddress">
          <Form.Label>Street Address</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter Street Address"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group as={Col} controlId="formGridStateProvince">
          <Form.Label>State / Province</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter State / Province"
            value={stateProvince}
            onChange={(e) => setStateProvince(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group as={Col} controlId="formGridZipPostal">
          <Form.Label>Postal Code</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter Zip Code / Postal Code"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            required
          />
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} controlId="formGridEmergencyName">
          <Form.Label>Emergency Contact Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter Emergency Contact Name"
            value={emergencyContactName}
            onChange={(e) => setEmergencyContactName(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group as={Col} controlId="formGridEmergencyContact">
          <Form.Label>Emergency Contact Phone</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter Emergency Contact Phone"
            value={emergencyContactPhone}
            onChange={(e) => setEmergencyContactPhone(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group as={Col} controlId="formGridEmergencyRelationship">
          <Form.Label>Emergency Contact Relationship</Form.Label>
          <Form.Select
            aria-label="Select Emergency Contact Relationship"
            value={emergencyRelationship}
            onChange={(e) => setEmergencyRelationship(e.target.value)}
            required
          >
            <option>Select Relationship</option>
            <option value="Parent">Parent</option>
            <option value="Spouse">Spouse</option>
            <option value="Sibling">Sibling</option>
            <option value="Child">Child</option>
            <option value="Other">Other</option>
          </Form.Select>
        </Form.Group>
      </Row>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="primary" type="submit">
          Next
        </Button>
      </div>
    </Form>
  );
};

// import React, { useState } from 'react';
// import { Row, Col, Form, Button } from 'react-bootstrap';

// export const ContactTab = ({ onSubmit }) => {
//   const [primaryPhone, setPrimaryPhone] = useState('');
//   const [secondaryPhone, setSecondaryPhone] = useState('');
//   const [activePhone1, setActive1] = useState(false);
//   const [activePhone2, setActive2] = useState(false);
//   const [streetAddress, setStreetAddress] = useState('');
//   const [stateProvince, setStateProvince] = useState('');
//   const [zipCode, setZipCode] = useState('');
//   const [emergencyContactName, setEmergencyContactName] = useState('');
//   const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
//   const [emergencyRelationship, setEmergencyRelationship] = useState('');

//   const handleSubmit = (event) => {
//     event.preventDefault();
//     const formData = {
//       phone: primaryPhone,  // Match with the CreateWorker validation
//       secondaryPhone,
//       activePhone1,
//       activePhone2,
//       streetAddress,
//       stateProvince,
//       zipCode,
//       emergencyContactName,
//       emergencyContactPhone,
//       emergencyRelationship,
//     };

//     console.log("Contact Form Data:", formData); // Log the data for debugging

//     // Check if required fields are filled
//     if (!primaryPhone || !streetAddress || !emergencyContactName || !emergencyContactPhone || !stateProvince || !zipCode) {
//       // Adjust this to include all required fields
//       toast.error('Please fill in all required contact fields.');
//       return;
//     }

//     onSubmit(formData);
//   };

//   return (
//     <Form onSubmit={handleSubmit}>
//       <Row className="mb-3">
//         <Form.Label>Primary Phone Number</Form.Label>
//         <Form.Group as={Col} sm={3} controlId="formPhone2">
//           <Form.Control
//             type="text"
//             value={primaryPhone}
//             onChange={(e) => setPrimaryPhone(e.target.value)}
//             required
//           />
//         </Form.Group>
//         <Form.Group as={Col} controlId="fromSwitchActive">
//           <Form.Check
//             type="switch"
//             id="active-phone1"
//             label="Active"
//             checked={activePhone1}
//             onChange={(e) => setActive1(e.target.checked)}
//           />
//         </Form.Group>
//       </Row>
//       <Row className="mb-3">
//         <Form.Label>Secondary Phone Number</Form.Label>
//         <Form.Group as={Col} sm={3} controlId="formPhone4">
//           <Form.Control
//             type="text"
//             value={secondaryPhone}
//             onChange={(e) => setSecondaryPhone(e.target.value)}
//           />
//         </Form.Group>
//         <Form.Group as={Col} controlId="fromSwitchActive">
//           <Form.Check
//             type="switch"
//             id="active-phone2"
//             label="Active"
//             checked={activePhone2}
//             onChange={(e) => setActive2(e.target.checked)}
//           />
//         </Form.Group>
//       </Row>

//       <Row className="mb-3">
//         <Form.Group as={Col} controlId="formGridStreetAddress">
//           <Form.Label>Street Address</Form.Label>
//           <Form.Control
//             type="text"
//             placeholder="Enter Street Address"
//             value={streetAddress}
//             onChange={(e) => setStreetAddress(e.target.value)}
//             required
//           />
//         </Form.Group>

//         <Form.Group as={Col} controlId="formGridStateProvince">
//           <Form.Label>State / Province</Form.Label>
//           <Form.Control
//             type="text"
//             placeholder="Enter State / Province"
//             value={stateProvince}
//             onChange={(e) => setStateProvince(e.target.value)}
//             required
//           />
//         </Form.Group>

//         <Form.Group as={Col} controlId="formGridZipPostal">
//           <Form.Label>Postal Code</Form.Label>
//           <Form.Control
//             type="text"
//             placeholder="Enter Zip Code / Postal Code"
//             value={zipCode}
//             onChange={(e) => setZipCode(e.target.value)}
//             required
//           />
//         </Form.Group>
//       </Row>

//       <Row className="mb-3">
//         <Form.Group as={Col} controlId="formGridEmergencyName">
//           <Form.Label>Emergency Contact Name</Form.Label>
//           <Form.Control
//             type="text"
//             placeholder="Enter Emergency Contact Name"
//             value={emergencyContactName}
//             onChange={(e) => setEmergencyContactName(e.target.value)}
//             required
//           />
//         </Form.Group>

//         <Form.Group as={Col} controlId="formGridEmergencyContact">
//           <Form.Label>Emergency Contact Phone</Form.Label>
//           <Form.Control
//             type="text"
//             placeholder="Enter Emergency Contact Phone"
//             value={emergencyContactPhone}
//             onChange={(e) => setEmergencyContactPhone(e.target.value)}
//             required
//           />
//         </Form.Group>

//         <Form.Group as={Col} controlId="formGridEmergencyRelationship">
//           <Form.Label>Emergency Contact Relationship</Form.Label>
//           <Form.Select
//             aria-label="Select Emergency Contact Relationship"
//             value={emergencyRelationship}
//             onChange={(e) => setEmergencyRelationship(e.target.value)}
//             required
//           >
//             <option>Select Relationship</option>
//             <option value="Parent">Parent</option>
//             <option value="Spouse">Spouse</option>
//             <option value="Sibling">Sibling</option>
//             <option value="Child">Child</option>
//             <option value="Other">Other</option>
//           </Form.Select>
//         </Form.Group>
//       </Row>

//       <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
//         <Button variant="primary" type="submit">Next</Button>
//       </div>
//     </Form>
//   );
// };

// // import React, { useState } from 'react';
// // import { Row, Col, Form, Button } from 'react-bootstrap';

// // export const ContactTab = ({ onSubmit }) => {
// //   const [primaryPhone, setPrimaryPhone] = useState('');
// //   // const [primaryCode, setPrimaryCode] = useState('');
// //   // const [secondaryCode, setSecondaryCode] = useState('');
// //   const [secondaryPhone, setSecondaryPhone] = useState('');
// //   const [activePhone1, setActive1] = useState(false);
// //   const [activePhone2, setActive2] = useState(false);
// //   const [streetAddress, setStreetAddress] = useState('');
// //   const [stateProvince, setStateProvince] = useState('');
// //   const [zipCode, setZipCode] = useState('');
// //   const [emergencyContactName, setEmergencyContactName] = useState('');
// //   const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
// //   const [emergencyRelationship, setEmergencyRelationship] = useState('');

// //   const handleSubmit = (event) => {
// //     event.preventDefault();
// //     const formData = {
// //       primaryPhone,
// //       secondaryPhone,
// //       activePhone1,
// //       activePhone2,
// //       streetAddress,
// //       stateProvince,
// //       zipCode,
// //       emergencyContactName,
// //       emergencyContactPhone,
// //       emergencyRelationship,
// //     };
// //     console.log(formData);
// //     onSubmit(formData);
// //   };

// //   return (
// //     <Form onSubmit={handleSubmit}>
// //     <Row className="mb-3">
// //     <Form.Label>Primary Phone Number</Form.Label>
// //       {/* <Form.Group as={Col} sm={1} controlId="formPhone1">
// //       <Form.Control type="text" value={primaryCode} onChange={(e) => setPrimaryCode(e.target.value)} />
// //       </Form.Group> */}
// //       <Form.Group as={Col} sm={3} controlId="formPhone2">
// //       <Form.Control type="text" value={primaryPhone} onChange={(e) => setPrimaryPhone(e.target.value)} />
// //       </Form.Group>
// //         <Form.Group as={Col} controlId="fromSwitchActive">
// //           <Form.Check
// //             type="switch"
// //             id="active-phone1"
// //             label="Active"
// //             checked={activePhone1} // Set the checked state to the value of 'active'
// //             onChange={(e) => setActive1(e.target.checked)} // Update 'active' state on change
// //           />
// //         </Form.Group>

// //     </Row>
// //     <Row className="mb-3">
// //     <Form.Label>Secondary Phone Number</Form.Label>
// //       {/* <Form.Group as={Col} sm={1} controlId="formPhone3">
// //       <Form.Control type="text" value={secondaryCode} onChange={(e) => setSecondaryCode(e.target.value)} />
// //       </Form.Group> */}
// //       <Form.Group as={Col} sm={3} controlId="formPhone4">
// //       <Form.Control type="text" value={secondaryPhone} onChange={(e) => setSecondaryPhone(e.target.value)} />
// //       </Form.Group>
// //       <Form.Group as={Col} controlId="fromSwitchActive">
// //           <Form.Check
// //             type="switch"
// //             id="active-phone2"
// //             label="Active"
// //             checked={activePhone2} // Set the checked state to the value of 'active'
// //             onChange={(e) => setActive2(e.target.checked)} // Update 'active' state on change
// //           />
// //         </Form.Group>
// //     </Row>

// //    <Row className="mb-3">
// //     <Form.Group as={Col} controlId="formGridStreetAddress">
// //       <Form.Label>Street Address</Form.Label>
// //       <Form.Control
// //       type="text"
// //       placeholder="Enter Street Address"
// //       value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} />
// //     </Form.Group>

// //     <Form.Group as={Col} controlId="formGridStateProvince">
// //       <Form.Label>State / Province</Form.Label>
// //       <Form.Control
// //       type="text"
// //       placeholder="Enter State / Province"
// //       value={stateProvince} onChange={(e) => setStateProvince(e.target.value)} />
// //     </Form.Group>

// //     <Form.Group as={Col} controlId="formGridZipPostal">
// //       <Form.Label>Postal Code</Form.Label>
// //       <Form.Control
// //       type="text"
// //       placeholder="Enter Zip Code / Postal Code"
// //       value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
// //     </Form.Group>
// //   </Row>

// //   <Row className="mb-3">
// //     <Form.Group as={Col} controlId="formGridEmergencyName">
// //       <Form.Label>Emergency Contact Name</Form.Label>
// //       <Form.Control
// //       type="text"
// //       placeholder="Enter Emergency Contact Name"
// //       value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} />
// //     </Form.Group>

// //     <Form.Group as={Col} controlId="formGridEmergencyContact">
// //       <Form.Label>Emergency Contact Phone</Form.Label>
// //       <Form.Control
// //       type="text"
// //       placeholder="Enter Emergency Contact"
// //       value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)}/>
// //     </Form.Group>

// //     <Form.Group as={Col} controlId="formGridEmergencyRelationship">
// //           <Form.Label>Emergency Contact Relationship</Form.Label>
// //           <Form.Select
// //             aria-label="Select Emergency Contact Relationship"
// //             value={emergencyRelationship} // Set the value to the state
// //             onChange={(e) => setEmergencyRelationship(e.target.value)} // Update state on change
// //           >
// //             <option>Select Relationship</option>
// //             <option value="Parent">Parent</option>
// //             <option value="Spouse">Spouse</option>
// //             <option value="Sibling">Sibling</option>
// //             <option value="Child">Child</option>
// //             <option value="Other">Other</option>
// //           </Form.Select>
// //         </Form.Group>

// //   </Row>

// //   <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
// //       <Button variant="primary" type="submit">Next</Button>
// //     </div>

// // </Form>
// //   );
// // };

// // // import React from 'react'
// // // import {
// // //     Container,
// // //     Row,
// // //     Col,
// // //     Card,
// // //     Form,
// // //     FormGroup,
// // //     FormLabel,
// // //     FormControl,
// // //     Button,
// // //     InputGroup,
// // //     Alert,
// // //     Image,
// // // } from 'react-bootstrap';

// // // // import hooks
// // // import useMounted from 'hooks/useMounted';

// // // export const ContactTab = () => {
// // //   const hasMounted = useMounted();
// // //   return (
// // //     <>
// //     // <Form>
// //     //     <Row className="mb-3">
// //     //     <Form.Label>Primary Phone Number</Form.Label>
// //     //       <Form.Group as={Col} sm={1} controlId="formPhone1">
// //     //       <Form.Control type="text" placeholder="+60" />
// //     //       </Form.Group>
// //     //       <Form.Group as={Col} sm={3} controlId="formPhone2">
// //     //       <Form.Control type="text" placeholder="953 123 4567" />
// //     //       </Form.Group>
// //     //       <Form.Group as={Col} controlId="formSwitchActive">
// //     //         <Form.Check
// //     //           type="switch"
// //     //           id="active-switch"
// //     //           label="Active"
// //     //         />
// //     //       </Form.Group>
// //     //     </Row>
// //     //     <Row className="mb-3">
// //     //     <Form.Label>Secondary Phone Number</Form.Label>
// //     //       <Form.Group as={Col} sm={1} controlId="formPhone3">
// //     //       <Form.Control type="text" placeholder="+60" />
// //     //       </Form.Group>
// //     //       <Form.Group as={Col} sm={3} controlId="formPhone4">
// //     //       <Form.Control type="text" placeholder="953 123 4567" />
// //     //       </Form.Group>
// //     //       <Form.Group as={Col} controlId="formSwitchActive">
// //     //         <Form.Check
// //     //           type="switch"
// //     //           id="active-switch"
// //     //           label="Active"
// //     //         />
// //     //       </Form.Group>
// //     //     </Row>

// //     //    <Row className="mb-3">
// //     //     <Form.Group as={Col} controlId="formGridFirstName">
// //     //       <Form.Label>Street Address</Form.Label>
// //     //       <Form.Control type="text" placeholder="Enter Street Address" />
// //     //     </Form.Group>

// //     //     <Form.Group as={Col} controlId="formGridMiddleName">
// //     //       <Form.Label>State / Province</Form.Label>
// //     //       <Form.Control type="text" placeholder="Enter State / Province" />
// //     //     </Form.Group>

// //     //     <Form.Group as={Col} controlId="formGridLastName">
// //     //       <Form.Label>Zip Code / Postal Code</Form.Label>
// //     //       <Form.Control type="text" placeholder="Enter Zip Code / Postal Code" />
// //     //     </Form.Group>
// //     //   </Row>

// //     //   <Row className="mb-3">
// //     //     <Form.Group as={Col} controlId="formGridFirstName">
// //     //       <Form.Label>Emergency Contact Name</Form.Label>
// //     //       <Form.Control type="text" placeholder="Enter Emergency Contact Name" />
// //     //     </Form.Group>

// //     //     <Form.Group as={Col} controlId="formGridMiddleName">
// //     //       <Form.Label>Emergency Contact Phone</Form.Label>
// //     //       <Form.Control type="text" placeholder="Enter Emergency Contact" />
// //     //     </Form.Group>

// //     //       <Form.Group as={Col} controlId="formGridEmergencyRelationship">
// //     //         <Form.Label>Emergency Contact Relationship</Form.Label>
// //     //         <Form.Select aria-label="Select Emergency Contact Relationship">
// //     //           <option>Select Relationship</option>
// //     //           <option value="1">Parent</option>
// //     //           <option value="2">Spouse</option>
// //     //           <option value="3">Sibling</option>
// //     //           <option value="4">Child</option>
// //     //           <option value="5">Other</option>
// //     //         </Form.Select>
// //     //       </Form.Group>

// //     //   </Row>

// //     //   <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
// //     //       <Button variant="primary" type="submit">Next</Button>
// //     //     </div>

// //     // </Form>
// // //     </>
// // //   )
// // // }
