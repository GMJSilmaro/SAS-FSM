import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Container, Row, Col, Card, Tabs, Tab, Spinner } from "react-bootstrap";
import { collection, getDoc, doc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { useRouter } from "next/router";
import { EditPersonalTab } from "sub-components/dashboard/profile/EditPersonalTab";
import { EditContactTab } from "sub-components/dashboard/profile/EditContactTab";

const EditProfile = () => {
  const router = useRouter();
  const { workerId, tab } = router.query; // Get the workerId and tab query param
  const [activeTab, setActiveTab] = useState("personal");
  const [personalData, setPersonalData] = useState({});
  const [contactData, setContactData] = useState({});
  // const [skillsData, setSkillsData] = useState({});
  const [loading, setLoading] = useState(true);

  // State to hold all submitted data
  const [submittedData, setSubmittedData] = useState({});

  useEffect(() => {
    const fetchWorkerData = async () => {
      console.log("Fetching data for Worker ID:", workerId);
      if (workerId) {
        try {
          const workerRef = doc(collection(db, "users"), workerId);
          const workerDoc = await getDoc(workerRef);
          if (workerDoc.exists()) {
            const workerData = workerDoc.data();
            setPersonalData(workerData);
            setContactData({
              primaryPhone: workerData.primaryPhone,
              secondaryPhone: workerData.secondaryPhone,
              activePhone1: workerData.activePhone1,
              activePhone2: workerData.activePhone2,
              email: workerData.email,
              stateProvince: workerData.stateProvince,
              streetAddress: workerData.streetAddress,
              zipCode: workerData.zipCode,
              emergencyContactName: workerData.emergencyContactName,
              emergencyContactPhone: workerData.emergencyContactPhone,
              emergencyRelationship: workerData.emergencyRelationship,
            });
            setSkillsData(workerData.skills || {});
          } else {
            console.log("No worker found with the provided ID.");
          }
        } catch (error) {
          console.error("Error fetching worker data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchWorkerData();
  }, [workerId]);

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  useEffect(() => {
    if (tab) {
      setActiveTab(tab); // Set the active tab to the one passed in the query (e.g., 'contact')
    }
  }, [tab]);

  const handlePersonalFormSubmit = async (personalFormData) => {
    try {
      const workerRef = doc(collection(db, "users"), workerId);
      await setDoc(workerRef, { ...personalFormData }, { merge: true });
      setSubmittedData((prevData) => ({
        ...prevData,
        personal: personalFormData,
      })); // Save personal data
      console.log("All Submitted Data:", {
        ...submittedData,
        personal: personalFormData,
      }); // Log data
      handleTabChange("contact");
    } catch (error) {
      console.error("Error updating personal data:", error);
    }
  };

  const handleContactFormSubmit = async (contactFormData) => {
    console.log("Submitting contact form data:", contactFormData); // Debug log
    try {
      const workerRef = doc(collection(db, "users"), workerId);

      // Update the worker document directly with contactFormData fields
      await setDoc(
        workerRef,
        {
          primaryPhone: contactFormData.primaryPhone,
          secondaryPhone: contactFormData.secondaryPhone,
          activePhone1: contactFormData.activePhone1,
          activePhone2: contactFormData.activePhone2,
          streetAddress: contactFormData.streetAddress,
          stateProvince: contactFormData.stateProvince,
          zipCode: contactFormData.zipCode,
          emergencyContactName: contactFormData.emergencyContactName,
          emergencyContactPhone: contactFormData.emergencyContactPhone,
          emergencyRelationship: contactFormData.emergencyRelationship,
        },
        { merge: true }
      );

      console.log("Contact data saved successfully."); // Debug log
      handleTabChange("skills"); // Only change tab after saving
    } catch (error) {
      console.error("Error updating contact data:", error);
      toast.error("Failed to save contact data.");
    }
  };

  const handleSkillsFormSubmit = async (skillsFormData) => {
    try {
      const workerRef = doc(collection(db, "users"), workerId);
      await setDoc(workerRef, { skills: skillsFormData }, { merge: true });
      setSubmittedData((prevData) => ({ ...prevData, skills: skillsFormData })); // Save skills data
      console.log("All Submitted Data:", {
        ...submittedData,
        skills: skillsFormData,
      }); // Log data

      Swal.fire({
        title: "Success!",
        text: "Worker profile updated successfully.",
        icon: "success",
      }).then(() => {
        // Redirect to workers/list after the alert is closed
        router.push("/workers");
      });
    } catch (error) {
      console.error("Error updating skills data:", error);
      Swal.fire({
        title: "Error!",
        text: "An error occurred while updating data.",
        icon: "error",
      });
    }
  };

  if (loading) {
    return (
      <Container>
        <Row className="justify-content-center">
          <Col>
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container>
      <Row>
        <Col xl={12} lg={12} md={12} sm={12}>
          <Card className="shadow-sm">
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={handleTabChange}
                className="mb-3"
              >
                <Tab eventKey="personal" title="Personal">
                  <EditPersonalTab
                    onSubmit={handlePersonalFormSubmit}
                    initialValues={personalData}
                  />
                </Tab>
                <Tab eventKey="contact" title="Address">
                  <EditContactTab
                    onSubmit={handleContactFormSubmit}
                    initialValues={contactData}
                  />
                </Tab>
                {/* <Tab eventKey="skills" title="Skills">
                  <SkillsTab
                    onSubmit={handleSkillsFormSubmit}
                    initialValues={skillsData}
                  />
                </Tab> */}
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default EditProfile;

// getStaticProps to generate static pages
export const getStaticProps = async ({ params }) => {
  const workerId = params.workerId;
  return {
    props: {
      workerId, // Pass the workerId as a prop
    },
  };
};

// getStaticPaths to pre-generate pages based on worker data
export const getStaticPaths = async () => {
  const paths = [];

  return {
    paths,
    fallback: "blocking", // Generate pages dynamically if not pre-rendered
  };
};
