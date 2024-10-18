import { Fragment, useState, useEffect } from "react";
import { Row, Col, Image, Breadcrumb, Card, ListGroup } from "react-bootstrap";
import Link from "next/link";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";

const MyProfile = () => {
  const router = useRouter();
  const [userDetails, setUserDetails] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      const uid = Cookies.get("workerId");
      if (uid) {
        try {
          const userRef = doc(collection(db, "users"), uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setUserDetails(userDoc.data());
          } else {
            console.log("User not found");
          }
        } catch (error) {
          console.error("Error fetching user details:", error.message);
        }
      } else {
        // Redirect to sign-in if UID is not available
        router.push("/authentication/sign-in");
      }
    };

    const fetchRecentJobs = async () => {
      try {
        // Fetch all jobs from the jobs collection
        const jobsCollectionRef = collection(db, "jobs");
        const jobDocs = await getDocs(jobsCollectionRef);

        const jobsWithDetails = [];

        // Iterate through each job document
        for (const jobDoc of jobDocs.docs) {
          const jobData = jobDoc.data();
          const jobId = jobDoc.id; // This is your jobID

          // Fetch the logs for the current job
          const logsCollectionRef = collection(db, `jobs/${jobId}/logs`);
          const logDocs = await getDocs(logsCollectionRef);

          // Prepare an array for log data
          const logsData = logDocs.docs.map((logDoc) => ({
            logID: logDoc.id, // This is the logId
            ...logDoc.data(),
          }));

          // Combine job details and logs into a single object
          const combinedData = {
            jobID: jobId,
            jobDetails: jobData,
            logs: logsData, // Add all logs data to the job object
          };

          // Add combined data to the jobsWithDetails array
          jobsWithDetails.push(combinedData);
        }

        setRecentJobs(jobsWithDetails); // Set the state with jobs and their logs
      } catch (error) {
        console.error("Error fetching jobs or logs:", error.message);
      }
    };

    // Call your functions in useEffect or wherever suitable
    fetchUserDetails();
    fetchRecentJobs();
  }, []);

  if (!userDetails) {
    return <div>Loading...</div>;
  }
  return (
    <Fragment>
      <Row>
        <Col lg={12} md={12} sm={12}>
          <div className="border-bottom pb-3 mb-3 d-md-flex align-items-center justify-content-between">
            <div className="mb-3 mb-md-0">
              <h1 className="mb-1 h2 fw-bold">My Profile</h1>
              <Breadcrumb>
                <Breadcrumb.Item to="#">Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item to="#">Profile</Breadcrumb.Item>
                <Breadcrumb.Item active>My Profile</Breadcrumb.Item>
              </Breadcrumb>
            </div>
            <div className="d-flex align-items-center">
              <Link
                href={`/dashboard/profile/${userDetails.workerId}`}
                className="btn btn-primary me-2"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={8} xs={12}>
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex align-items-center">
                <Image
                  src={
                    userDetails.profilePicture || "/path/to/default/avatar.jpg"
                  }
                  className="avatar-xl rounded-circle"
                  alt="Profile"
                />
                <div className="ms-4">
                  <h3 className="mb-1">
                    {userDetails.firstName} {userDetails.lastName}
                  </h3>
                  <div>
                    <span>
                      <i className="fe fe-calendar text-muted me-2"></i>User
                      since{" "}
                      {userDetails.timestamp
                        ? new Date(
                            userDetails.timestamp.seconds * 1000
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "N/A"}
                    </span>
                    <span className="ms-3">
                      <i className="fe fe-map-pin text-muted me-2"></i>
                      {userDetails.streetAddress}, {userDetails.stateProvince}
                    </span>
                  </div>
                </div>
              </div>
            </Card.Body>
            <Card.Body className="border-top">
              <div className="hstack gap-2 justify-content-between d-md-flex d-inline">
                <div className="mb-3">
                  <span className="fw-semibold">Last Login</span>
                  <div className="mt-2">
                    <h5 className="h3 fw-bold mb-0">
                      {userDetails.lastLogin || "N/A"}
                    </h5>
                  </div>
                </div>
                <div className="mb-3">
                  <span className="fw-semibold">Total Jobs</span>
                  <div className="mt-2">
                    <h5 className="h3 fw-bold mb-0">
                      {userDetails.totalOrders || 4}
                    </h5>
                  </div>
                </div>
                <div>
                  <span className="fw-semibold">Customers</span>
                  <div className="mt-2">
                    <h5 className="h3 fw-bold mb-0">
                      {userDetails.lifetimeSpent || 0.0}
                    </h5>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>
              <h4 className="mb-0">Recent Jobs</h4>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                {recentJobs.length > 0 ? (
                  recentJobs.map((job, index) => (
                    <ListGroup.Item className="px-0" key={index}>
                      <Card className="mb-2">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="d-flex align-items-center">
                              <i className="fas fa-briefcase text-primary me-2"></i>
                              <h6 className="text-primary mb-0">
                                Job ID: {job.jobID}
                              </h6>
                            </div>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <div>
                              <p className="mb-1">
                                <strong>Status:</strong>{" "}
                                {job.jobDetails.status || "Pending"}
                              </p>
                              <p className="mb-1">
                                <strong>Assigned Workers:</strong>{" "}
                                {Array.isArray(
                                  job.jobDetails.assignedWorkers
                                ) && job.jobDetails.assignedWorkers.length > 0
                                  ? job.jobDetails.assignedWorkers.map(
                                      (worker, index) => (
                                        <span
                                          key={index}
                                          className="badge bg-secondary me-1"
                                        >
                                          {worker.workerId}
                                        </span>
                                      )
                                    )
                                  : "None"}
                              </p>
                              <p className="mb-1">
                                <strong></strong>{" "}
                                {job.logs.length > 0 ? (
                                  job.logs.map((logg) => (
                                    <div key={logg.logID} className="mb-1">
                                      <span className="text-muted">
                                        {logg.event} at{" "}
                                        {new Date(
                                          logg.timestamp.seconds * 1000
                                        ).toLocaleString("en-US", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                          hour: "numeric",
                                          minute: "numeric",
                                          second: "numeric",
                                        })}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <span>No logs available</span>
                                )}
                              </p>
                            </div>
                            <div>
                              <Link
                                href="#"
                                className="btn btn-light-danger text-danger btn-sm"
                              >
                                More Info
                              </Link>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </ListGroup.Item>
                  ))
                ) : (
                  <p>No recent jobs found.</p>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="mt-4 mt-lg-0">
            <Card.Body className="border-bottom">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Contact</h4>
                <Link
                  href={{
                    pathname: `/dashboard/profile/${userDetails.workerId}`,
                    query: { tab: "personal" },
                  }}
                >
                  Edit
                </Link>
              </div>
              <div className="d-flex align-items-center mb-2">
                <i className="fe fe-mail text-muted fs-4"></i>
                <Link href="#" className="ms-2">
                  {userDetails.email}
                </Link>
              </div>
              <div className="d-flex align-items-center">
                <i className="fe fe-phone text-muted fs-4"></i>
                <span className="ms-2">
                  {userDetails.primaryPhone || userDetails.secondaryPhone}
                </span>
              </div>
            </Card.Body>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Default Address</h4>
                <Link
                  href={{
                    pathname: `/dashboard/profile/${userDetails.workerId}`,
                    query: { tab: "contact" },
                  }}
                >
                  Change
                </Link>
              </div>
              <div>
                <p className="mb-0">
                  {userDetails.stateProvince} <br />
                  {userDetails.streetAddress}
                </p>
              </div>
            </Card.Body>
          </Card>

          <Card className="mt-4">
            <Card.Body>
              <h4 className="mb-4">About Me</h4>
              <p>{userDetails.bio || "No bio provided."}</p>
              <h4 className="mt-4 mb-4">Social Media</h4>
              <ul className="list-unstyled">
                {userDetails.socialLinks &&
                  userDetails.socialLinks.map((link, index) => (
                    <li key={index}>
                      <Link href={link.url} className="text-inherit">
                        <i className={`fe fe-${link.platform} text-muted`}></i>
                        {link.platform.charAt(0).toUpperCase() +
                          link.platform.slice(1)}
                      </Link>
                    </li>
                  ))}
                <li>
                  <Link
                    href="https://github.com/user"
                    className="text-inherit"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fab fa-github text-muted"></i> GitHub
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://linkedin.com/in/user"
                    className="text-inherit"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fab fa-linkedin text-muted"></i> LinkedIn
                  </Link>
                </li>
                <li>
                  <Link href="mailto:user@example.com" className="text-inherit">
                    <i className="fe fe-mail text-muted"></i> Gmail
                  </Link>
                </li>
              </ul>
            </Card.Body>
          </Card>

          {/* New section for Help/Support */}
          <Card className="mt-4">
            <Card.Body>
              <h4 className="mb-4">Help/Support</h4>
              <p>
                If you have any questions, feel free to reach out to our support
                team!
              </p>
              <Link href="/support" className="btn btn-light">
                Get Help
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Fragment>
  );
};

export default MyProfile;
