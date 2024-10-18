import React, { useState, useRef, useEffect } from "react";
import { Container, Row, Col, Form, Button, Image, InputGroup } from "react-bootstrap";
import { db, storage } from "../../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, getDocs } from "firebase/firestore";
import { FaEye, FaEyeSlash } from 'react-icons/fa';


export const PersonalTab = ({ onSubmit, initialValues }) => {
  const [profilePicture, setProfilePicture] = useState(
    "/images/avatar/NoProfile.png"
  );
  const [activeUser, setActiveUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFieldWorker, setIsFieldWorker] = useState(false);
  const [shortBio, setShortBio] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [userId, setUserId] = useState(""); // Updated to be a running number
  const [password, setPassword] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [role, setRole] = useState("Worker");
  const [file, setFile] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const fileInputRef = useRef(null);

  // Fetch users and set running number for userId
  useEffect(() => {
    const fetchUsers = async () => {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);

      // Find the highest userId and increment by 1
      const highestUserId = snapshot.docs.reduce((max, doc) => {
        const currentId = parseInt(doc.data().userId, 10);
        return currentId > max ? currentId : max;
      }, 0);

      setUserId((highestUserId + 1).toString()); // Set the new userId as a running number
    };

    fetchUsers();
  }, []); // Only run once when the component mounts

  // Set initial values when component mounts or when initialValues prop changes
  useEffect(() => {
    if (initialValues) {
      setProfilePicture(
        initialValues.profilePicture || "/images/avatar/NoProfile.png"
      );
      setActiveUser(initialValues.activeUser || false);
      setIsAdmin(initialValues.isAdmin || false);
      setIsFieldWorker(initialValues.isFieldWorker || false);
      setShortBio(initialValues.shortBio || "");
      setFirstName(initialValues.firstName || "");
      setMiddleName(initialValues.middleName || "");
      setLastName(initialValues.lastName || "");
      setGender(initialValues.gender || "");
      setDateOfBirth(initialValues.dateOfBirth || "");
      setEmail(initialValues.email || "");
      setWorkerId(initialValues.workerId || "");
      setPassword(initialValues.password || "");
      setExpirationDate(initialValues.expirationDate || "");
      setRole("Worker");
      setUserId(initialValues.userId || userId); // Set userId from initial values or running number
    }
  }, [initialValues, userId]); // Re-run this effect if initialValues changes or userId is set

  const handleImageChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePicture(reader.result);
      };
      reader.readAsDataURL(selectedFile);
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    let profilePictureUrl = profilePicture;

    if (file) {
      try {
        const storageRef = ref(
          storage,
          `profile_pictures/${workerId}-${file.name}`
        );
        const snapshot = await uploadBytes(storageRef, file);
        profilePictureUrl = await getDownloadURL(snapshot.ref);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }

    const fullName = `${firstName} ${middleName} ${lastName}`.trim();

    const formData = {
      profilePicture: profilePictureUrl,
      activeUser,
      isAdmin,
      isFieldWorker,
      shortBio,
      firstName,
      middleName,
      lastName,
      fullName,
      gender,
      dateOfBirth,
      email,
      workerId,
      userId, // Include the running number userId in the formData
      password,
      role,
      expirationDate,
    };

    console.log(formData);
    onSubmit(formData);
  };

  const handleRemoveImage = () => {
    setProfilePicture("/images/avatar/NoProfile.png");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <Row className="align-items-center mb-4">
          <Col xs={12} md={6}>
            <h5 className="mb-0">Profile Picture</h5>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col xs={12} md={4}>
            <div className="d-flex align-items-center">
              <div className="me-3">
                <Image
                  src={profilePicture}
                  className="rounded-circle avatar avatar-xl"
                  alt="Profile Picture"
                  style={{ width: "120px", height: "120px" }}
                />
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                  ref={fileInputRef}
                  id="upload-input"
                />
                <Button
                  className="me-2"
                  onClick={() =>
                    document.getElementById("upload-input").click()
                  }
                >
                  Change
                </Button>
                <Button onClick={handleRemoveImage}>Remove</Button>
              </div>
            </div>
          </Col>
          <Form.Group as={Col} controlId="formSwitchActive">
            <Form.Label>Optional</Form.Label>
            <Form.Check
              type="switch"
              id="active-switch"
              label="Active"
              checked={activeUser}
              onChange={(e) => setActiveUser(e.target.checked)}
            />
            <Form.Check
              type="switch"
              id="admin-switch"
              label="Admin"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
            />
            <Form.Check
              type="switch"
              id="field-worker-switch"
              label="Field Worker"
              checked={isFieldWorker}
              onChange={(e) => setIsFieldWorker(e.target.checked)}
            />
          </Form.Group>
          <Form.Group as={Col} controlId="formShortBio">
            <Form.Label>Short Bio</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={shortBio}
              onChange={(e) => setShortBio(e.target.value)}
            />
          </Form.Group>
        </Row>

        <Row className="mb-3">
          <Form.Group as={Col} controlId="formGridFirstName">
            <Form.Label>First Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group as={Col} controlId="formGridMiddleName">
            <Form.Label>Middle Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Middle Name"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
            />
          </Form.Group>
          <Form.Group as={Col} controlId="formGridLastName">
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </Form.Group>
        </Row>

        <Row className="mb-3">
          <Form.Group as={Col} controlId="formGridGender">
            <Form.Label>Gender</Form.Label>
            {["radio"].map((type) => (
              <div key={`inline-${type}`} className="mb-3">
                <Form.Check
                  inline
                  label="Male"
                  name="gender"
                  type="radio"
                  id={`inline-gender-1`}
                  checked={gender === "male"}
                  onChange={() => setGender("male")}
                />
                <Form.Check
                  inline
                  label="Female"
                  name="gender"
                  type="radio"
                  id={`inline-gender-2`}
                  checked={gender === "female"}
                  onChange={() => setGender("female")}
                />
              </div>
            ))}
          </Form.Group>

          <Form.Group as={Col} controlId="formGridBirthDate">
            <Form.Label>Date of Birth</Form.Label>
            <Form.Control
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group as={Col} controlId="formGridEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>
        </Row>

        <Row className="mb-3">
          <Form.Group as={Col} controlId="formGridWorkerID">
            <Form.Label>Worker ID</Form.Label>
            <Form.Control
              type="text"
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)} // Allow user to modify
              required
              placeholder="Enter Worker ID"
            />
          </Form.Group>
            <Form.Group as={Col} controlId="formGridPassword">
      <Form.Label>Password</Form.Label>
      <InputGroup>
        <Form.Control
          type={showPassword ? "text" : "password"}
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <InputGroup.Text onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </InputGroup.Text>
      </InputGroup>
    </Form.Group>

          <Form.Group as={Col} controlId="formGridExpDate">
            <Form.Label>Expiration Date</Form.Label>
            <Form.Control
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              required
            />
          </Form.Group>
        </Row>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="primary" type="submit">
            Next
          </Button>
        </div>
      </Form>
    </Container>
  );
};
