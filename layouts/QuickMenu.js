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
} from "firebase/firestore";
import DotBadge from "components/bootstrap/DotBadge";
import { format } from "date-fns";
import { FaBell, FaBriefcase } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const QuickMenu = () => {
  const hasMounted = useMounted();
  const isDesktop = useMediaQuery({ query: "(min-width: 1224px)" });
  const router = useRouter();
  const [userDetails, setUserDetails] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0); // Unread notification count lifted to parent

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
      });
      if (response.ok) {
        document.cookie =
          "customToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly";
        document.cookie =
          "uid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
        document.cookie =
          "isAdmin=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
        document.cookie =
          "email=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
        router.push("/authentication/sign-in");
      } else {
        throw new Error("Logout failed");
      }
    } catch (error) {
      console.error("Error logging out:", error.message);
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
        where("workerId", "in", [workerID, "all"])
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

          // Check if the notification is assigned to 'all'
          if (notificationWorkerId === "all") {
            await updateDoc(notificationDocRef, {
              [`readBy.${workerID}`]: true,
            });
          } else {
            await updateDoc(notificationDocRef, { read: true });
          }

          // Optimistically update the notification without causing a full re-render
          setNotifications((prevNotifications) => {
            const updatedNotifications = prevNotifications.map((item) => {
              if (item.id === notificationId) {
                // If the notification was read by this worker, update the readBy or read property
                return notificationWorkerId === "all"
                  ? { ...item, readBy: { ...item.readBy, [workerID]: true } }
                  : { ...item, read: true };
              }
              return item;
            });
            return updatedNotifications; // Return updated notifications for efficient re-rendering
          });

          // Update unread count
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

        // Optimistically update the UI
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

    return (
      <>
        <SimpleBar style={{ maxHeight: "300px" }}>
          <ListGroup variant="flush">
            {notifications.length === 0 ? (
              <ListGroup.Item>No notifications</ListGroup.Item>
            ) : (
              notifications.map((item) => (
                <ListGroup.Item
                  className="d-flex align-items-start"
                  style={{
                    backgroundColor:
                      item.workerId === "all"
                        ? item.readBy && item.readBy[workerID]
                          ? "#fff"
                          : "#f1f5f9"
                        : item.read
                        ? "#fff"
                        : "#f1f5f9",
                    cursor: "pointer",
                  }}
                  key={item.id}
                >
                  <Row className="w-100">
                    <Col xs="auto">
                      <FaBell size={24} color="#6c757d" />
                    </Col>
                    <Col>
                      <div className="d-flex justify-content-between">
                        <h5 className="fw-bold mb-1">
                          {item.notificationType}
                        </h5>

                        <GKTippy content="Mark as read" placement="right">
                          <Link
                            href="#"
                            onClick={(e) => {
                              e.preventDefault(); // Prevent default link behavior
                              if (!item.read) {
                                markAsRead(item.id);
                              } else {
                                toast.info(
                                  "Notification is already marked as read",
                                  {
                                    position: "top-right",
                                  }
                                );
                              }
                            }}
                          >
                            <DotBadge
                              bg={item.read ? "secondary" : "info"}
                              className="mx-1"
                            ></DotBadge>
                          </Link>
                        </GKTippy>
                      </div>

                      <p className="mb-2">{item.message}</p>
                      <div className="d-flex align-items-center">
                        <FaBriefcase size={16} className="text-muted me-1" />
                        <span className="text-muted">{item.jobID}</span>
                      </div>
                      <div className="mt-1 text-muted">
                        {format(
                          new Date(item.timestamp.toDate()),
                          "MMMM do, yyyy h:mm:ss a"
                        )}
                      </div>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))
            )}
          </ListGroup>
        </SimpleBar>
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
            {/* Display unread notifications count as a badge */}
            {unreadCount > 0 && (
              <Badge
                bg="danger"
                pill
                className="position-absolute top-0 start-100 translate-middle"
                style={{
                  transform: "translate(-25%, 25%)", // Adjusts the badge left and down
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
                <span className="h4 mb-0">Notifications ({unreadCount})</span>
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
        <Dropdown as="li" className="ms-2">
          <Dropdown.Toggle
            as="a"
            bsPrefix=" "
            className="rounded-circle"
            id="dropdownUser"
          >
            <div className="avatar avatar-md avatar-indicators avatar-online">
              {userDetails && userDetails.profilePicture ? (
                <Image
                  alt="avatar"
                  src={userDetails.profilePicture}
                  className="rounded-circle"
                />
              ) : (
                <Image alt="avatar" src="" className="rounded-circle" />
              )}
            </div>
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

// const QuickMenu = () => {
//   const hasMounted = useMounted();
//   const isDesktop = useMediaQuery({ query: '(min-width: 1224px)' });
//   const router = useRouter();
//   const [userDetails, setUserDetails] = useState(null);
//   const [unreadCount, setUnreadCount] = useState(0); // Unread notification count

//   // Fetch user details
//   useEffect(() => {
//     const fetchUserDetails = async () => {
//       const email = Cookies.get('email');
//       const workerID = Cookies.get('workerID');

//       if (email) {
//         try {
//           const usersRef = collection(db, 'users');
//           const q = query(usersRef, where('email', '==', email));
//           const querySnapshot = await getDocs(q);

//           if (!querySnapshot.empty) {
//             const userDoc = querySnapshot.docs[0];
//             setUserDetails(userDoc.data());
//           } else {
//             console.log('User not found');
//           }
//         } catch (error) {
//           console.error('Error fetching user details:', error.message);
//         }
//       } else {
//         router.push('/authentication/sign-in');
//       }
//     };

//     fetchUserDetails();
//   }, [router]);

//   // Sign out function
//   const handleSignOut = async () => {
//     try {
//       const response = await fetch('/api/logout', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });
//       if (response.ok) {
//         document.cookie = 'customToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly';
//         document.cookie = 'uid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
//         document.cookie = 'isAdmin=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
//         document.cookie = 'email=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
//         router.push('/authentication/sign-in');
//       } else {
//         throw new Error('Logout failed');
//       }
//     } catch (error) {
//       console.error('Error logging out:', error.message);
//     }
//   };

//   const Notifications = React.memo(() => {
//     const [notifications, setNotifications] = useState([]);
//     const workerID = Cookies.get('workerId');
//     const [unreadCount, setUnreadCount] = useState(0);

//     // Fetch notifications when the component mounts or workerID changes
//     useEffect(() => {
//       if (!workerID) return;

//       const notificationsRef = collection(db, 'notifications');
//       const q = query(notificationsRef, where('workerId', '==', workerID));

//       // Set up Firestore listener for real-time updates
//       const unsubscribe = onSnapshot(
//         q,
//         (snapshot) => {
//           const notificationData = snapshot.docs.map((doc) => ({
//             id: doc.id,
//             ...doc.data(),
//           }));
//           setNotifications(notificationData);

//           // Calculate unread notifications count only once and set it
//           const unreadNotifications = notificationData.filter((item) => !item.read).length;
//           setUnreadCount(unreadNotifications);
//         },
//         (error) => {
//           console.error('Error fetching notifications: ', error.message);
//           toast.error(`Error fetching notifications: ${error.message}`, {
//             position: 'top-right',
//           });
//         }
//       );

//       return () => unsubscribe(); // Clean up the listener when component unmounts
//     }, [workerID]);

//     // Mark a specific notification as read
//     const markAsRead = useCallback(async (notificationId) => {
//       try {
//         const notificationDocRef = doc(db, 'notifications', notificationId);
//         await updateDoc(notificationDocRef, { read: true });

//         // Optimistically update the UI without refetching the data
//         setNotifications((prevNotifications) =>
//           prevNotifications.map((item) =>
//             item.id === notificationId ? { ...item, read: true } : item
//           )
//         );

//         // Update unread count without recalculating it from scratch
//         setUnreadCount((prevCount) => prevCount - 1);

//         toast.success('Notification marked as read!', {
//           position: 'top-right',
//         });
//       } catch (error) {
//         console.error('Error marking notification as read: ', error.message);
//         toast.error('Failed to mark as read. Please try again.', {
//           position: 'top-right',
//         });
//       }
//     }, []);

//     // Mark all notifications as read
//     const markAllAsRead = useCallback(async () => {
//       try {
//         const batch = writeBatch(db);

//         notifications.forEach((notification) => {
//           if (!notification.read) {
//             const notificationDocRef = doc(db, 'notifications', notification.id);
//             batch.update(notificationDocRef, { read: true });
//           }
//         });

//         await batch.commit();

//         // Optimistically update the UI
//         setNotifications((prevNotifications) =>
//           prevNotifications.map((item) => ({ ...item, read: true }))
//         );
//         setUnreadCount(0); // Reset unread count

//         toast.success('All notifications marked as read!', {
//           position: 'top-right',
//         });
//       } catch (error) {
//         console.error('Error marking all notifications as read: ', error.message);
//         toast.error('Failed to mark all as read. Please try again.', {
//           position: 'top-right',
//         });
//       }
//     }, [notifications]);

//     return (
//       <>
//         <SimpleBar style={{ maxHeight: '300px' }}>
//           <ListGroup variant="flush">
//             {notifications.length === 0 ? (
//               <ListGroup.Item>No notifications</ListGroup.Item>
//             ) : (
//               notifications.map((item) => (
//                 <ListGroup.Item
//                   className="d-flex align-items-start"
//                   style={{
//                     backgroundColor: item.read ? '#fff' : '#f1f5f9',
//                     cursor: 'pointer',
//                   }}
//                   key={item.id}
//                 >
//                   <Row className="w-100">
//                     <Col xs="auto">
//                       <FaBell size={24} color="#6c757d" />
//                     </Col>
//                     <Col>
//                       <div className="d-flex justify-content-between">
//                         <h5 className="fw-bold mb-1">{item.notificationType}</h5>

//                         <GKTippy content="Mark as read" placement="right">
//                           <Link
//                             href="#"
//                             onClick={(e) => {
//                               e.preventDefault(); // Prevent default link behavior
//                               if (!item.read) {
//                                 markAsRead(item.id);
//                               } else {
//                                 toast.info('Notification is already marked as read', {
//                                   position: 'top-right',
//                                 });
//                               }
//                             }}
//                           >
//                             <DotBadge
//                               bg={item.read ? 'secondary' : 'info'}
//                               className="mx-1"
//                             ></DotBadge>
//                           </Link>
//                         </GKTippy>
//                       </div>

//                       <p className="mb-2">{item.message}</p>
//                       <div className="d-flex align-items-center">
//                         <FaBriefcase size={16} className="text-muted me-1" />
//                         <span className="text-muted">{item.jobID}</span>
//                       </div>
//                       <div className="mt-1 text-muted">
//                         {format(new Date(item.timestamp.toDate()), 'MMMM do, yyyy h:mm:ss a')}
//                       </div>
//                     </Col>
//                   </Row>
//                 </ListGroup.Item>
//               ))
//             )}
//           </ListGroup>
//         </SimpleBar>
//       </>
//     );
//   });

//   return (
//     <Fragment>
//       <ListGroup
//         as="ul"
//         bsPrefix="navbar-nav"
//         className="navbar-right-wrap ms-2 d-flex nav-top-wrap"
//       >
//         {/* Notification Dropdown */}
//         <Dropdown as="li">
//           <Dropdown.Toggle
//             as="a"
//             bsPrefix=" "
//             id="dropdownNotification"
//             className="text-dark icon-notifications me-lg-1 btn btn-light btn-icon rounded-circle text-muted position-relative"
//           >
//             <i className="fe fe-bell"></i>
//             {/* Display unread notifications count as a badge */}
//             {unreadCount > 0 && (
//               <Badge
//                 bg="danger"
//                 pill
//                 className="position-absolute top-0 start-100 translate-middle"
//                 style={{
//                   transform: "translate(-25%, 25%)", // Adjusts the badge left and down
//                   fontSize: "0.75rem",
//                 }}
//               >
//                 {unreadCount}
//               </Badge>
//             )}
//           </Dropdown.Toggle>
//           <Dropdown.Menu
//             className="dashboard-dropdown notifications-dropdown dropdown-menu-lg dropdown-menu-end mt-4 py-0"
//             aria-labelledby="dropdownNotification"
//             align="end"
//             show={hasMounted && isDesktop ? true : false}
//           >
//             <Dropdown.Item className="mt-3" bsPrefix=" " as="div">
//               <div className="border-bottom px-3 pt-0 pb-3 d-flex justify-content-between align-items-end">
//                 <span className="h4 mb-0">Notifications ({unreadCount})</span>
//                 <Link
//                   href="/dashboard/settings#notifications"
//                   className="text-muted"
//                 >

//                   <span className="align-middle">
//                     <i className="fe fe-settings me-1"></i>
//                   </span>
//                 </Link>
//               </div>
//               <Notifications />
//               <div className="border-top px-3 pt-3 pb-3">
//                 <Link
//                   href="/dashboard/notification-history"
//                   className="text-link fw-semi-bold"
//                 >
//                   See all Notifications
//                 </Link>
//               </div>
//             </Dropdown.Item>
//           </Dropdown.Menu>
//         </Dropdown>
//         {/* User Dropdown */}
//         <Dropdown as="li" className="ms-2">
//           <Dropdown.Toggle
//             as="a"
//             bsPrefix=" "
//             className="rounded-circle"
//             id="dropdownUser"
//           >
//             <div className="avatar avatar-md avatar-indicators avatar-online">
//               {userDetails && userDetails.profilePicture ? (
//                 <Image
//                   alt="avatar"
//                   src={userDetails.profilePicture}
//                   className="rounded-circle"
//                 />
//               ) : (
//                 <Image alt="avatar" src="" className="rounded-circle" />
//               )}
//             </div>
//           </Dropdown.Toggle>
//           <Dropdown.Menu
//             className="dashboard-dropdown dropdown-menu-end mt-4 py-0"
//             align="end"
//             aria-labelledby="dropdownUser"
//             show={hasMounted && isDesktop ? true : false}
//           >
//             <Dropdown.Item className="mt-3">
//               <div className="d-flex">
//                 {userDetails && (
//                   <div>
//                     <h5 className="mb-1">{userDetails.fullName}</h5>
//                     <p className="mb-0 text-muted">{userDetails.email}</p>
//                   </div>
//                 )}
//               </div>
//             </Dropdown.Item>
//             <Dropdown.Divider />
//             <Dropdown.Item
//               eventKey="2"
//               onClick={() => router.push("/dashboard/profile/myprofile")}
//             >
//               <i className="fe fe-user me-2"></i> Profile
//             </Dropdown.Item>
//             <Dropdown.Item
//               eventKey="3"
//               onClick={() => router.push("/dashboard/settings")}
//             >
//               <i className="fe fe-settings me-2"></i> Settings
//             </Dropdown.Item>
//             <Dropdown.Divider />
//             <Dropdown.Item className="mb-3" onClick={handleSignOut}>
//               <i className="fe fe-power me-2"></i> Sign Out
//             </Dropdown.Item>
//           </Dropdown.Menu>
//         </Dropdown>
//       </ListGroup>
//     </Fragment>
//   );
// };

// export default QuickMenu;

// import Link from 'next/link';
// import { Fragment, useState, useEffect } from 'react';
// import { useMediaQuery } from 'react-responsive';
// import { Row, Col, Image, Dropdown, ListGroup, Badge  } from 'react-bootstrap';
// import SimpleBar from 'simplebar-react';
// import 'simplebar/dist/simplebar.min.css';
// import { GKTippy } from 'widgets';
// import DarkLightMode from 'layouts/DarkLightMode';
// import NotificationList from 'data/Notification';
// import useMounted from 'hooks/useMounted';
// import { useRouter } from 'next/router';
// import Cookies from 'js-cookie';
// import { db } from '../firebase';
// import { collection, getDocs, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
// import DotBadge from 'components/bootstrap/DotBadge';
// import { format } from 'date-fns';
// import { FaBell, FaBriefcase } from 'react-icons/fa';

// const QuickMenu = () => {
//   const hasMounted = useMounted();
//   const isDesktop = useMediaQuery({ query: '(min-width: 1224px)' });
//   const router = useRouter();
//   const [userDetails, setUserDetails] = useState(null);
//   const [unreadCount, setUnreadCount] = useState(0);

//   useEffect(() => {
//     const fetchUserDetails = async () => {
//       const email = Cookies.get('email'); // Get email from cookie
//       const workerID = Cookies.get('workerID'); // Get workerID from cookie if available

//       if (email) { // Check if email exists
//         try {
//           // Query Firestore to find user by workerID
//           const usersRef = collection(db, 'users');
//           const q = query(usersRef, where('email', '==', email));
//           const querySnapshot = await getDocs(q);

//           if (!querySnapshot.empty) {
//             const userDoc = querySnapshot.docs[0];
//             setUserDetails(userDoc.data());
//           } else {
//             console.log('User not found');
//           }
//         } catch (error) {
//           console.error('Error fetching user details:', error.message);
//         }
//       } else {
//         console.log('No email cookie found, redirecting to sign-in');
//         router.push('/authentication/sign-in'); // Redirect if no email
//       }
//     };

//     fetchUserDetails();
//   }, [router]);

//   const handleSignOut = async () => {
//     try {
//       const response = await fetch('/api/logout', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });
//       if (response.ok) {
//         document.cookie = 'customToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly';
//         document.cookie = 'uid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
//         document.cookie = 'isAdmin=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
//         document.cookie = 'email=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
//         router.push('/authentication/sign-in');
//       } else {
//         throw new Error('Logout failed');
//       }
//     } catch (error) {
//       console.error('Error logging out:', error.message);
//     }
//   };

//   const Notifications = () => {
//     const [notifications, setNotifications] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const workerID = Cookies.get('workerId'); // Ensure this is correctly fetched

//     useEffect(() => {
//       if (!workerID) return;

//       const notificationsRef = collection(db, 'notifications');
//       const q = query(notificationsRef, where('workerId', '==', workerID));

//       const unsubscribe = onSnapshot(
//         q,
//         (snapshot) => {
//           const notificationData = snapshot.docs.map((doc) => ({
//             id: doc.id,
//             ...doc.data(),
//           }));
//           setNotifications(notificationData);
//           setLoading(false);
//         },
//         (error) => {
//           console.error('Error fetching notifications: ', error.message);
//           setLoading(false);
//         }
//       );

//       return () => unsubscribe();
//     }, [workerID]);

//     // Mark a notification as read
//     const markAsRead = async (notificationId) => {
//       const notificationDocRef = doc(db, 'notifications', notificationId);
//       await updateDoc(notificationDocRef, { read: true });

//       // Update local state to reflect the change in read status
//       setNotifications((prevNotifications) =>
//         prevNotifications.map((item) =>
//           item.id === notificationId ? { ...item, read: true } : item
//         )
//       );
//     };

//     return (
//       <>
//         <SimpleBar style={{ maxHeight: '300px' }}>
//           <ListGroup variant="flush">
//             {notifications.map((item, index) => (
//               <ListGroup.Item
//                 className="d-flex align-items-start"
//                 style={{ backgroundColor: item.read ? '#fff' : '#f1f5f9', cursor: 'pointer' }} // Highlight unread notifications
//                 key={item.id} // Use unique notification ID
//                 onClick={() => markAsRead(item.id)} // Mark as read on click
//               >
//                 <Row className="w-100">
//                   <Col xs="auto">
//                     <FaBell size={24} color="#6c757d" /> {/* Bell icon using react-icons */}
//                   </Col>
//                   <Col>
//                     <div className="d-flex justify-content-between">
//                       <h5 className="fw-bold mb-1">{item.notificationType}</h5>
//                       <span className="ms-auto" style={{ color: item.read ? '#adb5bd' : '#28a745' }}>
//                         <i className="fas fa-circle" style={{ fontSize: '10px' }}></i>
//                       </span>
//                     </div>
//                     <p className="mb-2">{item.message}</p>
//                     <div className="d-flex align-items-center">
//                       <FaBriefcase size={16} className="text-muted me-1" /> {/* Briefcase icon */}
//                       <span className="text-muted">{item.jobID}</span>
//                     </div>
//                     <div className="mt-1 text-muted">
//                       {format(new Date(item.timestamp.toDate()), 'MMMM do, yyyy h:mm:ss a')} {/* Timestamp displayed below */}
//                     </div>
//                   </Col>
//                 </Row>
//               </ListGroup.Item>
//             ))}
//           </ListGroup>
//         </SimpleBar>

//       </>
//     );
//   };

//   return (
//     <Fragment>
//       <ListGroup
//         as="ul"
//         bsPrefix="navbar-nav"
//         className="navbar-right-wrap ms-2 d-flex nav-top-wrap"
//       >
//         <Dropdown as="li">
//           <Dropdown.Toggle as="a"
//             bsPrefix=' '
//             id="dropdownNotification"
//             className="text-dark icon-notifications me-lg-1  btn btn-light btn-icon rounded-circle indicator indicator-primary text-muted">
//             <i className="fe fe-bell"></i>
//           </Dropdown.Toggle>
//           <Dropdown.Menu
//             className="dashboard-dropdown notifications-dropdown dropdown-menu-lg dropdown-menu-end mt-4 py-0"
//             aria-labelledby="dropdownNotification"
//             align="end"
//             show={hasMounted && isDesktop ? true : false}>
//             <Dropdown.Item className="mt-3" bsPrefix=' ' as="div"  >
//               <div className="border-bottom px-3 pt-0 pb-3 d-flex justify-content-between align-items-end">
//                 <span className="h4 mb-0">Notifications</span>
//                 <Link href="/dashboard/settings#notifications" className="text-muted">
//                   <span className="align-middle">
//                     <i className="fe fe-settings me-1"></i>
//                   </span>
//                 </Link>
//               </div>
//               <Notifications />
//               <div className="border-top px-3 pt-3 pb-3">
//                 <Link href="/dashboard/notification-history" className="text-link fw-semi-bold">
//                   See all Notifications
//                 </Link>
//               </div>
//             </Dropdown.Item>
//           </Dropdown.Menu>
//         </Dropdown>
//         <Dropdown as="li" className="ms-2">
//           <Dropdown.Toggle
//             as="a"
//             bsPrefix=" "
//             className="rounded-circle"
//             id="dropdownUser"
//           >
//             <div className="avatar avatar-md avatar-indicators avatar-online">
//               {userDetails && userDetails.profilePicture ? (
//                 <Image
//                   alt="avatar"
//                   src={userDetails.profilePicture}
//                   className="rounded-circle"
//                 />
//               ) : (
//                 <Image alt="avatar" src="" className="rounded-circle" />
//               )}
//             </div>
//           </Dropdown.Toggle>
//           <Dropdown.Menu
//             className="dashboard-dropdown dropdown-menu-end mt-4 py-0"
//             align="end"
//             aria-labelledby="dropdownUser"
//             show={hasMounted && isDesktop ? true : false}
//           >
//             <Dropdown.Item className="mt-3">
//               <div className="d-flex">
//                 {userDetails && (
//                   <div>
//                     <h5 className="mb-1">{userDetails.fullName}</h5>
//                     <p className="mb-0 text-muted">{userDetails.email}</p>
//                   </div>
//                 )}
//               </div>
//             </Dropdown.Item>

//             <Dropdown.Divider />
//             <Dropdown.Item
//               eventKey="2"
//               onClick={() => router.push("/dashboard/profile/myprofile")}
//             >
//               <i className="fe fe-user me-2"></i> Profile
//             </Dropdown.Item>

//             <Dropdown.Item
//             eventKey="3"
//             onClick={() => router.push("/dashboard/settings")}>
//               <i className="fe fe-settings me-2"></i> Settings
//             </Dropdown.Item>
//             <Dropdown.Divider />
//             <Dropdown.Item className="mb-3" onClick={handleSignOut}>
//               <i className="fe fe-power me-2"></i> Sign Out
//             </Dropdown.Item>
//           </Dropdown.Menu>
//         </Dropdown>
//       </ListGroup>
//     </Fragment>
//   );
// }

// export default QuickMenu;
