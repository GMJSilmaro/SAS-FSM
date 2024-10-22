// import node module libraries
import React, { useState, useEffect } from "react";
import { Col, Row, Card, ListGroup, Form, InputGroup, Pagination } from "react-bootstrap";
import { Bell, Briefcase, CheckCircle, ExclamationCircle, Search } from "react-feather";
import { format } from "date-fns";
import { GKTippy } from "widgets";
import DotBadge from "components/bootstrap/DotBadge";
import { db } from "../../firebase";
import { collection, query, where, getDocs, updateDoc, doc, orderBy, limit, startAfter } from "firebase/firestore";
import Cookies from "js-cookie";

const ITEMS_PER_PAGE = 10;

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastVisible, setLastVisible] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, [currentPage]);

  const fetchNotifications = async () => {
    const workerId = Cookies.get("workerId");
    console.log("Fetching notifications for workerId:", workerId);

    if (workerId) {
      const notificationsRef = collection(db, "notifications");
      let q = query(
        notificationsRef,
        where("workerId", "in", [workerId, "all"]),
        orderBy("timestamp", "desc"),
        limit(ITEMS_PER_PAGE)
      );

      if (lastVisible && currentPage > 1) {
        q = query(q, startAfter(lastVisible));
      }

      try {
        const querySnapshot = await getDocs(q);
        const notificationsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setNotifications(notificationsData);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);

        // Get total count for pagination
        const countQuery = query(notificationsRef, where("workerId", "in", [workerId, "all"]));
        const countSnapshot = await getDocs(countQuery);
        setTotalPages(Math.ceil(countSnapshot.size / ITEMS_PER_PAGE));

        console.log("Fetched notifications:", notificationsData);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    } else {
      console.log("No workerId found in cookies");
    }
  };

  const markAsRead = async (notificationId) => {
    console.log("Marking as read:", notificationId);
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, { read: true });
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      )
    );
    console.log("Marked as read successfully");
  };

  const markAllAsRead = async () => {
    console.log("Marking all as read");
    const updatePromises = notifications.map(notification => {
      if (!notification.read) {
        const notificationRef = doc(db, "notifications", notification.id);
        return updateDoc(notificationRef, { read: true });
      }
      return Promise.resolve();
    });

    await Promise.all(updatePromises);
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
    console.log("All notifications marked as read");
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredNotifications = notifications.filter(notification =>
    (notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    (notification.message?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const NotificationIcon = ({ type }) => {
    switch (type) {
      case "general": return <Bell className="text-primary" size={20} />;
      case "task": return <Briefcase className="text-warning" size={20} />;
      case "approval": return <CheckCircle className="text-success" size={20} />;
      case "alert": return <ExclamationCircle className="text-danger" size={20} />;
      default: return <Bell className="text-primary" size={20} />;
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setLastVisible(null);  // Reset lastVisible when changing pages
  };

  return (
    <Row className="g-3">
      <Col xs={12}>
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Notification History</h4>
            <button onClick={markAllAsRead} className="btn btn-primary btn-sm">
              Mark all as read
            </button>
          </Card.Header>
          <Card.Body>
            <Form className="mb-3">
              <InputGroup>
                <InputGroup.Text><Search size={18} /></InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </InputGroup>
            </Form>
            <ListGroup variant="flush">
              {filteredNotifications.map((notification, index) => (
                <ListGroup.Item key={index} className="py-3 px-0 border-bottom">
                  <div className="d-flex">
                    <div className="me-3">
                      <NotificationIcon type={notification.type} />
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{notification.title}</h6>
                      <p className="mb-1 text-muted">{notification.message}</p>
                      <small className="text-muted">
                        {format(new Date(notification.timestamp.toDate()), "MMM d, yyyy h:mm a")}
                      </small>
                      <small className="text-muted ms-2">
                        Worker ID: {notification.workerId}
                      </small>
                    </div>
                    {!notification.read && (
                      <GKTippy content="Mark as read">
                        <button onClick={() => markAsRead(notification.id)} className="btn btn-link p-0">
                          <DotBadge bg="info"></DotBadge>
                        </button>
                      </GKTippy>
                    )}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card.Body>
          <Card.Footer>
            <Pagination className="justify-content-center">
              <Pagination.Prev
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
              />
              {[...Array(totalPages).keys()].map(number => (
                <Pagination.Item
                  key={number + 1}
                  active={number + 1 === currentPage}
                  onClick={() => handlePageChange(number + 1)}
                >
                  {number + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next
                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </Card.Footer>
        </Card>
      </Col>
    </Row>
  );
};

export default Notifications;
