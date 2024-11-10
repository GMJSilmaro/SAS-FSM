import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Tabs,
  Tab,
  Breadcrumb,
} from "react-bootstrap";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, setDoc, doc, addDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { ContactTab } from "sub-components/dashboard/worker/ContactTab";
import { PersonalTab } from "sub-components/dashboard/worker/PersonalTab";
import { SkillsTab } from "sub-components/dashboard/worker/SkillsTab";
import { toast, ToastContainer } from "react-toastify";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import { GeeksSEO } from "widgets";
import Link from 'next/link';

const CreateWorker = () => {
  const [activeTab, setActiveTab] = useState("personal");
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

  const handlePersonalFormSubmit = async (personalFormData, workerId) => {
    // Validation: Check for required fields
    if (
      !personalFormData.fullName ||
      !personalFormData.email ||
      !personalFormData.password
    ) {
      toast.error("Please fill in all required personal fields.");
      return; // Stop execution if validation fails
    }

    try {
      const { email, password } = personalFormData;
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const userData = {
        uid: user.uid,
        workerId,
        ...personalFormData,
        timestamp,
      };

      setPersonalData(userData);
      setIsPersonalTabComplete(true); // Mark personal tab as complete
      handleTabChange("contact"); // Move to contact tab
    } catch (error) {
      console.error("Error adding document:", error);
      toast.error("Error adding document: " + error.message);
    }
  };

  const handleContactFormSubmit = async (contactFormData) => {
    // Validation: Check for required fields
    if (
      !contactFormData.primaryPhone ||
      !contactFormData.address.streetAddress ||
      !contactFormData.address.stateProvince ||
      !contactFormData.address.postalCode ||
      !contactFormData.emergencyContactName ||
      !contactFormData.emergencyContactPhone
    ) {
      toast.error("Please fill in all required contact fields.");
      return; // Stop execution if validation fails
    }

    try {
      setContactData({ ...contactFormData });
      setIsContactTabComplete(true); // Mark contact tab as complete
      handleTabChange("skills"); // Move to skills tab
    } catch (error) {
      console.error("Error saving contact data:", error);
      toast.error("Error saving contact data: " + error.message);
    }
  };

  const handleSkillsFormSubmit = async (skillsFormData) => {
    // Validation: Check for required fields
    if (!skillsFormData.length) {
      // Check if at least one skill is provided
      toast.error("Please fill in all required skills fields.");
      return; // Stop execution if validation fails
    }

    try {
      const userData = {
        ...personalData,
        ...contactData,
        skills: skillsFormData,
      };

      await setDoc(
        doc(collection(db, "users"), personalData.workerId),
        userData
      );

      // Show a success toast
      //toast.success("Worker profile created successfully.");

      // Use SweetAlert for confirmation dialog
      Swal.fire({
        title: "Success!",
        text: "Worker profile created successfully. Click OK to continue.",
        icon: "success",
        confirmButtonText: "OK",
      }).then((result) => {
        if (result.isConfirmed) {
            // Force a reload of the page after a short delay
            setTimeout(() => {
              window.location.reload();
            }, 100);
        }
      });

      // Log this activity
      await logActivity(
        "Worker Created",
        `${personalData.firstName} ${personalData.lastName} has been added as a worker.`
      );
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error("An error occurred while saving data: " + error.message);
    }
  };

  return (
    <Container>
      <GeeksSEO title="Add Worker | SAS&ME - SAP B1 | Portal" />
      <Tab.Container defaultActiveKey="add">
        <Row>
          <Col lg={12} md={12} sm={12}>
            <div 
              style={{
                background: "linear-gradient(90deg, #4171F5 0%, #3DAAF5 100%)",
                padding: "1.5rem 2rem",
                borderRadius: "0 0 24px 24px",
                marginTop: "-39px",
                marginLeft: "10px",
                marginRight: "10px",
                marginBottom: "20px",
              }}
            >
              <div className="d-flex justify-content-between align-items-start">
                <div className="d-flex flex-column">
                  <div className="mb-3">
                    <h1
                      className="mb-2"
                      style={{
                        fontSize: "28px",
                        fontWeight: "600",
                        color: "#FFFFFF",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      Create New Worker
                    </h1>
                    <p
                      className="mb-2"
                      style={{
                        fontSize: "16px",
                        color: "rgba(255, 255, 255, 0.7)",
                        fontWeight: "400",
                        lineHeight: "1.5",
                      }}
                    >
                      Add a new worker to your team by filling out their personal, contact, and skill information
                    </p>
                    <div
                      className="d-flex align-items-center gap-2"
                      style={{
                        fontSize: "14px",
                        color: "rgba(255, 255, 255, 0.9)",
                        background: "rgba(255, 255, 255, 0.1)",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        marginTop: "8px",
                      }}
                    >
                      <i className="fe fe-info" style={{ fontSize: "16px" }}></i>
                      <span>
                        Complete all required fields across the three tabs: Personal, Contact, and Skills
                      </span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2 mb-4">
                    <span
                      className="badge"
                      style={{
                        background: "#FFFFFF",
                        color: "#4171F5",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontWeight: "500",
                        fontSize: "14px",
                      }}
                    >
                      Worker Management
                    </span>
                    <span
                      className="badge"
                      style={{
                        background: "rgba(255, 255, 255, 0.2)",
                        color: "#FFFFFF",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontWeight: "500",
                        fontSize: "14px",
                      }}
                    >
                      <i className="fe fe-user-plus me-1"></i>
                      New Worker
                    </span>
                  </div>

                  <nav
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <i
                        className="fe fe-home"
                        style={{ color: "rgba(255, 255, 255, 0.7)" }}
                      ></i>
                      <Link
                        href="/"
                        className="text-decoration-none ms-2"
                        style={{ color: "rgba(255, 255, 255, 0.7)" }}
                      >
                        Dashboard
                      </Link>
                      <span
                        className="mx-2"
                        style={{ color: "rgba(255, 255, 255, 0.7)" }}
                      >
                        /
                      </span>
                      <Link
                        href="/workers"
                        className="text-decoration-none d-flex align-items-center"
                        style={{ color: "rgba(255, 255, 255, 0.7)" }}
                      >
                        <i className="fe fe-users me-1"></i>
                        Workers
                      </Link>
                      <span
                        className="mx-2"
                        style={{ color: "rgba(255, 255, 255, 0.7)" }}
                      >
                        /
                      </span>
                      <span style={{ color: "#FFFFFF" }}>
                        <i className="fe fe-user-plus me-1"></i>
                        Create Worker
                      </span>
                    </div>
                  </nav>
                </div>

                <div>
                  <Link 
                    href="/workers"
                    className="btn btn-light btn-sm d-flex align-items-center gap-2"
                    style={{
                      border: "none",
                      borderRadius: "12px",
                      padding: "10px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.2s ease",
                      fontWeight: "500",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <i className="fe fe-arrow-left"></i>
                    Back to Workers
                  </Link>
                </div>
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
                    <Tabs
                      activeKey={activeTab}
                      onSelect={handleTabChange}
                      className="mb-3"
                    >
                      <Tab eventKey="personal" title="Personal">
                        <PersonalTab
                          onSubmit={handlePersonalFormSubmit}
                          disabled={false} // Always enabled
                        />
                      </Tab>
                      <Tab
                        eventKey="contact"
                        title="Contact"
                        disabled={!isPersonalTabComplete}
                      >
                        <ContactTab
                          onSubmit={handleContactFormSubmit}
                          disabled={!isPersonalTabComplete} // Disable if personal tab is not complete
                        />
                      </Tab>
                      <Tab
                        eventKey="skills"
                        title="Skills"
                        disabled={!isContactTabComplete}
                      >
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
      <style jsx global>{`
        .breadcrumb-link {
          transition: all 0.2s ease-in-out;
        }
        
        .breadcrumb-link:hover {
          color: #ffffff !important;
          transform: translateY(-1px);
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
        }

        .badge {
          font-weight: 500;
          padding: 0.35em 0.8em;
          font-size: 0.75rem;
          border-radius: 6px;
        }
      `}</style>
    </Container>
  );
};

export default CreateWorker;