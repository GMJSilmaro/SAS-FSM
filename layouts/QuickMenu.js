/* eslint-disable react/display-name */
import Link from "next/link";
import React, { Fragment, useState, useEffect, useCallback } from "react";
import { useMediaQuery } from "react-responsive";
import { Row, Col, Image, Dropdown, ListGroup, Badge } from "react-bootstrap";
import SimpleBar from "simplebar-react";
import "simplebar/dist/simplebar.min.css";
import { GKTippy } from "widgets";
import DarkLightMode from "layouts/DarkLightMode";
import NotificationList from "data/Notification";
import useMounted from "hooks/useMounted";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  writeBatch,
  deleteDoc,
  limit,
  orderBy,
} from "firebase/firestore";
import DotBadge from "components/bootstrap/DotBadge";
import { format } from "date-fns";
import { FaBell, FaBriefcase, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const QuickMenu = () => {
  const hasMounted = useMounted();
  const isDesktop = useMediaQuery({ query: "(min-width: 1224px)" });
  const router = useRouter();
  const [userDetails, setUserDetails] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      const email = Cookies.get("email");
      const workerID = Cookies.get("workerID");

      if (email) {
        try {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("email", "==", email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            setUserDetails(userDoc.data());
          } else {
            console.log("User not found");
          }
        } catch (error) {
          console.error("Error fetching user details:", error.message);
        }
      } else {
        router.push("/authentication/sign-in");
      }
    };

    fetchUserDetails();
  }, [router]);

  // Sign out function
  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Important: include credentials
      });

      if (response.ok) {
        // Clear client-side cookies using js-cookie
        const cookiesToClear = [
          'customToken',
          'uid',
          'isAdmin',
          'email',
          'workerId',
          'LAST_ACTIVITY'
        ];

        cookiesToClear.forEach(cookie => {
          Cookies.remove(cookie, { path: '/' });
        });

        // Force reload to clear any cached state
        window.location.href = '/authentication/sign-in';
      } else {
        throw new Error("Logout failed");
      }
    } catch (error) {
      console.error("Error logging out:", error.message);
      toast.error("Failed to logout. Please try again.");
    }
  };

  const Notifications = React.memo(({ setUnreadCount }) => {
    const [notifications, setNotifications] = useState([]);
    const workerID = Cookies.get("workerId");

    useEffect(() => {
      if (!workerID) return;

      const notificationsRef = collection(db, "notifications");
      const q = query(
        notificationsRef,
        where("workerId", "in", [workerID, "all"]),
        orderBy("timestamp", "desc"),
        limit(20) // Limit to 20 most recent notifications
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const notificationData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setNotifications(notificationData);

          const unreadNotifications = notificationData.filter(
            (item) => !item.read
          ).length;
          setUnreadCount(unreadNotifications);
        },
        (error) => {
          console.error("Error fetching notifications: ", error.message);
          toast.error(`Error fetching notifications: ${error.message}`, {
            position: "top-right",
          });
        }
      );

      return () => unsubscribe();
    }, [workerID, setUnreadCount]);

    const markAsRead = useCallback(
      async (notificationId, workerID, notificationWorkerId) => {
        try {
          const notificationDocRef = doc(db, "notifications", notificationId);

          if (notificationWorkerId === "all") {
            await updateDoc(notificationDocRef, {
              [`readBy.${workerID}`]: true,
            });
          } else {
            await updateDoc(notificationDocRef, { read: true });
          }

          setNotifications((prevNotifications) => {
            const updatedNotifications = prevNotifications.map((item) => {
              if (item.id === notificationId) {
                return notificationWorkerId === "all"
                  ? { ...item, readBy: { ...item.readBy, [workerID]: true } }
                  : { ...item, read: true };
              }
              return item;
            });
            return updatedNotifications;
          });

          setUnreadCount((prevCount) => prevCount - 1);

          toast.success("Notification marked as read!", {
            position: "top-right",
          });
        } catch (error) {
          console.error("Error marking notification as read: ", error.message);
          toast.error("Failed to mark as read. Please try again.", {
            position: "top-right",
          });
        }
      },
      [setUnreadCount]
    );

    const markAllAsRead = useCallback(async () => {
      try {
        const batch = writeBatch(db);
        notifications.forEach((notification) => {
          if (!notification.read) {
            const notificationDocRef = doc(
              db,
              "notifications",
              notification.id
            );
            batch.update(notificationDocRef, { read: true });
          }
        });

        await batch.commit();

        setNotifications((prevNotifications) =>
          prevNotifications.map((item) => ({ ...item, read: true }))
        );
        setUnreadCount(0);

        toast.success("All notifications marked as read!", {
          position: "top-right",
        });
      } catch (error) {
        console.error(
          "Error marking all notifications as read: ",
          error.message
        );
        toast.error("Failed to mark all as read. Please try again.", {
          position: "top-right",
        });
      }
    }, [notifications, setUnreadCount]);

    const hideNotification = useCallback(async (notificationId) => {
      try {
        // Update the notification in Firestore to mark it as hidden
        await updateDoc(doc(db, "notifications", notificationId), { hidden: true });

        // Update local state
        setNotifications((prevNotifications) => 
          prevNotifications.filter((item) => item.id !== notificationId)
        );

        // Update unread count if the hidden notification was unread
        const hiddenNotification = notifications.find(n => n.id === notificationId);
        if (hiddenNotification && !hiddenNotification.read) {
          setUnreadCount((prevCount) => prevCount - 1);
        }

        toast.success("Notification hidden successfully!", {
          position: "top-right",
        });
      } catch (error) {
        console.error("Error hiding notification: ", error.message);
        toast.error("Failed to hide notification. Please try again.", {
          position: "top-right",
        });
      }
    }, [notifications, setUnreadCount]);

    return (
      <>
        <SimpleBar style={{ maxHeight: "400px" }}>
          <ListGroup variant="flush">
            {notifications.length === 0 ? (
              <ListGroup.Item className="text-center py-5">
                <FaBell size={48} color="#6c757d" className="mb-3" />
                <p className="text-muted">No notifications</p>
              </ListGroup.Item>
            ) : (
              notifications.map((item) => (
                <ListGroup.Item
                  className="d-flex align-items-center py-3"
                  style={{
                    backgroundColor:
                      item.workerId === "all"
                        ? item.readBy && item.readBy[workerID]
                          ? "#fff"
                          : "#f8f9fa"
                        : item.read
                        ? "#fff"
                        : "#f8f9fa",
                    cursor: "pointer",
                    transition: "background-color 0.3s ease",
                  }}
                  key={item.id}
                >
                  <div className="me-3">
                    {item.notificationType === "info" ? (
                      <FaBell size={24} color="#007bff" />
                    ) : item.notificationType === "warning" ? (
                      <FaExclamationCircle size={24} color="#ffc107" />
                    ) : (
                      <FaCheckCircle size={24} color="#28a745" />
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="mb-1">{item.notificationType}  {!item.read && (
                        <Badge bg="primary" pill className="ms-2">
                          New
                        </Badge>
                      )}</h6>
                    <p className="mb-1 text-muted">{item.message}</p>
                    <div className="d-flex align-items-center text-muted">
                      <FaBriefcase size={12} className="me-1" />
                      <small>{item.jobID}</small>
                     
                      <span className="mx-2">•</span>
                      <small>
                        {format(
                          new Date(item.timestamp.toDate()),
                          "MMM d, yyyy h:mm a"
                        )}
                      </small>
                    </div>
                  </div>
                  <div className="ms-auto">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        hideNotification(item.id);
                      }}
                    >
                      <i className="fe fe-eye-off"></i>
                    </button>
                  </div>
                </ListGroup.Item>
              ))
            )}
          </ListGroup>
        </SimpleBar>
        {notifications.length > 0 && (
          <div className="border-top p-3 text-center">
            <button
              className="btn btn-link text-primary"
              onClick={markAllAsRead}
            >
              Mark all as read
            </button>
          </div>
        )}
      </>
    );
  });

  return (
    <Fragment>
      <ListGroup
        as="ul"
        bsPrefix="navbar-nav"
        className="navbar-right-wrap ms-2 d-flex nav-top-wrap"
      >
        {/* Notification Dropdown */}
        <Dropdown as="li">
          <Dropdown.Toggle
            as="a"
            bsPrefix=" "
            id="dropdownNotification"
            className="text-dark icon-notifications me-lg-1 btn btn-light btn-icon rounded-circle text-muted position-relative"
          >
            <i className="fe fe-bell"></i>
            {unreadCount > 0 && (
              <Badge
                bg="danger"
                pill
                className="position-absolute top-0 start-100 translate-middle"
                style={{
                  transform: "translate(-25%, 25%)",
                  fontSize: "0.75rem",
                }}
              >
                {unreadCount}
              </Badge>
            )}
          </Dropdown.Toggle>
          <Dropdown.Menu
            className="dashboard-dropdown notifications-dropdown dropdown-menu-lg dropdown-menu-end mt-4 py-0"
            aria-labelledby="dropdownNotification"
            align="end"
            show={hasMounted && isDesktop ? true : false}
          >
            <Dropdown.Item className="mt-3" bsPrefix=" " as="div">
              <div className="border-bottom px-3 pt-0 pb-3 d-flex justify-content-between align-items-end">
                <span className="h4 mb-0">Notifications</span>
                <Link
                  href="/dashboard/settings#notifications"
                  className="text-muted"
                >
                  <span className="align-middle">
                    <i className="fe fe-settings me-1"></i>
                  </span>
                </Link>
              </div>
              <Notifications setUnreadCount={setUnreadCount} />
              <div className="border-top px-3 pt-3 pb-3">
                <Link
                  href="/dashboard/notification-history"
                  className="text-link fw-semi-bold"
                >
                  See all Notifications
                </Link>
              </div>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        {/* User Dropdown */}
<Dropdown as="li" className="ms-2 pe-4">
  <Dropdown.Toggle
    as="a"
    bsPrefix=" "
    className="rounded-circle"
    id="dropdownUser"
    style={{ 
      position: 'relative', 
      display: 'inline-block',
      paddingRight: '20px'  // Add padding to the right
    }}
  >
    <div className="avatar avatar-md avatar-indicators avatar-online">
      {userDetails && userDetails.profilePicture ? (
        <Image
          alt="avatar"
          src={userDetails.profilePicture}
          className="rounded-circle"
          width={40}
          height={40}
          style={{
            objectFit: 'cover',
            border: '2px solid #e5e9f2',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        />
      ) : (
        <Image
          alt="default avatar"
          src="/images/avatar/default-avatar.png" // Make sure to add this default image to your public folder
          className="rounded-circle"
          width={40}
          height={40}
          style={{
            objectFit: 'cover',
            border: '2px solid #e5e9f2',
            backgroundColor: '#f8f9fa',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        />
      )}
    </div>
    {userDetails && (
      <div 
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          top: '100%',
          marginTop: '4px',
          whiteSpace: 'nowrap',
          textAlign: 'center',
          marginRight: '20px'  // Add margin to the right of the text
        }}
      >
        <span className="text-dark small fw-bold">{userDetails.fullName}</span>
      </div>
    )}
  </Dropdown.Toggle>
  <Dropdown.Menu
    className="dashboard-dropdown dropdown-menu-end mt-4 py-0"
    align="end"
    aria-labelledby="dropdownUser"
    show={hasMounted && isDesktop ? true : false}
  >
    <Dropdown.Item className="mt-3">
      <div className="d-flex">
        {userDetails && (
          <div>
            <h5 className="mb-1">{userDetails.fullName}</h5>
            <p className="mb-0 text-muted">{userDetails.email}</p>
          </div>
        )}
      </div>
    </Dropdown.Item>
    <Dropdown.Divider />
    <Dropdown.Item
      eventKey="2"
      onClick={() => router.push("/dashboard/profile/myprofile")}
    >
      <i className="fe fe-user me-2"></i> Profile
    </Dropdown.Item>
    <Dropdown.Item
      eventKey="3"
      onClick={() => router.push("/dashboard/settings")}
    >
      <i className="fe fe-settings me-2"></i> Settings
    </Dropdown.Item>
    <Dropdown.Divider />
    <Dropdown.Item className="mb-3" onClick={handleSignOut}>
      <i className="fe fe-power me-2"></i> Sign Out
    </Dropdown.Item>
  </Dropdown.Menu>
</Dropdown>
      </ListGroup>
    </Fragment>
  );
};

export default QuickMenu;
