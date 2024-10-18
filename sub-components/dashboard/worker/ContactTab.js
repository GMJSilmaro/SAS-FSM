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

      // Access address fields from the initialValues.address object
      setStreetAddress(initialValues.address?.streetAddress || ""); // Optional chaining to avoid errors if address is undefined
      setStateProvince(initialValues.address?.stateProvince || "");
      setZipCode(initialValues.address?.postalCode || ""); // Make sure to match the correct key

      setEmergencyContactName(initialValues.emergencyContactName || "");
      setEmergencyContactPhone(initialValues.emergencyContactPhone || "");
      setEmergencyRelationship(initialValues.emergencyRelationship || "");
    }
  }, [initialValues]);

  const handleSubmit = (event) => {
    event.preventDefault();

    // Trim the input values to remove any extra spaces
    const trimmedPrimaryPhone = primaryPhone.trim();
    const trimmedStreetAddress = streetAddress.trim();
    const trimmedStateProvince = stateProvince.trim();
    const trimmedZipCode = zipCode.trim();
    const trimmedEmergencyContactName = emergencyContactName.trim();
    const trimmedEmergencyContactPhone = emergencyContactPhone.trim();

    // Log trimmed values for debugging
    console.log("Trimmed Values:", {
      primaryPhone: trimmedPrimaryPhone,
      streetAddress: trimmedStreetAddress,
      stateProvince: trimmedStateProvince,
      zipCode: trimmedZipCode,
      emergencyContactName: trimmedEmergencyContactName,
      emergencyContactPhone: trimmedEmergencyContactPhone,
    });

    // Form data structure with address as a map
    const formData = {
      primaryPhone: trimmedPrimaryPhone,
      secondaryPhone: secondaryPhone.trim(),
      activePhone1,
      activePhone2,
      address: {
        streetAddress: trimmedStreetAddress,
        stateProvince: trimmedStateProvince,
        postalCode: trimmedZipCode, 
      },
      emergencyContactName: trimmedEmergencyContactName,
      emergencyContactPhone: trimmedEmergencyContactPhone,
      emergencyRelationship,
    };

    // Log the data for debugging
    console.log("Contact Form Data:", formData);

    // Check if required fields are filled
    if (
      !trimmedPrimaryPhone ||
      !trimmedStreetAddress ||
      !trimmedStateProvince ||
      !trimmedZipCode ||
      !trimmedEmergencyContactName ||
      !trimmedEmergencyContactPhone
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