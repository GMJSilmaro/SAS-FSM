import { Fragment, useState, useEffect } from "react";
import {
  Row,
  Col,
  Image,
  Breadcrumb,
  Card,
  ListGroup,
  Table,
} from "react-bootstrap";
import Link from "next/link";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import { doc, getDoc, collection } from "firebase/firestore";
import { db } from "../../../firebase";

const MyProfile = () => {
  const router = useRouter();
  const [userDetails, setUserDetails] = useState(null);

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

    fetchUserDetails();
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
                href={`/dashboard/profile/${userDetails.workerId}`} // Use the worker ID to construct the link
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
                  <span className="fw-semibold">Total Orders</span>
                  <div className="mt-2">
                    <h5 className="h3 fw-bold mb-0">
                      {userDetails.totalOrders || 0}
                    </h5>
                  </div>
                </div>
                <div>
                  <span className="fw-semibold">Lifetime Spend</span>
                  <div className="mt-2">
                    <h5 className="h3 fw-bold mb-0">
                      ${userDetails.lifetimeSpent || 0.0}
                    </h5>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>
              <h4 className="mb-0">Recent Orders</h4>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                {userDetails.orders && userDetails.orders.length > 0 ? (
                  userDetails.orders.map((order, index) => (
                    <ListGroup.Item className="px-0" key={index}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <h6 className="text-primary mb-0">
                            Order ID: {order.id}
                          </h6>
                        </div>
                        <div>
                          <span>{order.date}</span>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between">
                        <div>
                          <Link href="#" className="text-inherit">
                            <div className="d-lg-flex align-items-center">
                              <div>
                                <Image
                                  src={order.image}
                                  alt=""
                                  className="img-4by3-md rounded"
                                />
                              </div>
                              <div className="ms-lg-3 mt-2 mt-lg-0">
                                <h5 className="mb-0">{order.productName}</h5>
                              </div>
                            </div>
                          </Link>
                        </div>
                        <div>
                          <Link
                            href="#"
                            className="btn btn-light-danger text-danger btn-sm"
                          >
                            Refund
                          </Link>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))
                ) : (
                  <p>No recent orders found.</p>
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
                    query: { tab: "personal" }, // Pass 'contact' as the tab in the query
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
                    query: { tab: "contact" }, // Pass 'contact' as the tab in the query
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
        </Col>
      </Row>
    </Fragment>
  );
};

export default MyProfile;
