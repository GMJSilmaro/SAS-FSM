import Link from 'next/link';
import { Fragment, useState, useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Row, Col, Image, Dropdown, ListGroup } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import 'simplebar/dist/simplebar.min.css';
import { GKTippy } from 'widgets';
import DotBadge from 'components/bootstrap/DotBadge';
import DarkLightMode from 'layouts/DarkLightMode';
import NotificationList from 'data/Notification';
import useMounted from 'hooks/useMounted';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { db } from '../firebase'; 
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

const QuickMenu = () => {
  const uid = Cookies.get('uid');
  const hasMounted = useMounted();
  const isDesktop = useMediaQuery({ query: '(min-width: 1224px)' });
  const router = useRouter();
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      const uid = Cookies.get('workerId');
      if (uid) {
        try {
          const userRef = doc(collection(db, 'users'), uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setUserDetails(userDoc.data());
          } else {
            console.log('User not found');
          }
        } catch (error) {
          console.error('Error fetching user details:', error.message);
        }
      } else {
        // Redirect to sign-in if UID is not available
        router.push('/authentication/sign-in');
      }
    };
  
    fetchUserDetails();
  }, []);
  

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        document.cookie = 'authToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly';
        document.cookie = 'uid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        document.cookie = 'isAdmin=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        document.cookie = 'workerId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        router.push('/authentication/sign-in');
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Error logging out:', error.message);
    }
  };

  const Notifications = () => {
    return (
      <SimpleBar style={{ maxHeight: '300px' }}>
        <ListGroup variant="flush">
          {NotificationList.map(function (item, index) {
            return (
              <ListGroup.Item className={index === 0 ? 'bg-light' : ''} key={index}>
                <Row>
                  <Col>
                    <Link href="#" className="text-body">
                      <div className="d-flex">
                        <Image src={item.image} alt="" className="avatar-md rounded-circle" />
                        <div className="ms-3">
                          <h5 className="fw-bold mb-1">{item.sender}</h5>
                          <p className="mb-3">{item.message}</p>
                          <span className="fs-6 text-muted">
                            <span>
                              <span className="fe fe-thumbs-up text-success me-1"></span>
                              {item.date}
                            </span>
                            <span className="ms-1">{item.time}</span>
                          </span>
                        </div>
                      </div>
                    </Link>
                  </Col>
                  <Col xs="auto" className="text-center me-2">
                    <GKTippy content="Mark as unread">
                      <Link href="#"><DotBadge bg="secondary"></DotBadge></Link>
                    </GKTippy>
                  </Col>
                </Row>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      </SimpleBar>
    );
  };

  return (
    <Fragment>
      {/* <DarkLightMode /> */}
      <ListGroup
        as="ul"
        bsPrefix="navbar-nav"
        className="navbar-right-wrap ms-2 d-flex nav-top-wrap"
      >
        <Dropdown as="li">
          <Dropdown.Toggle as="a"
            bsPrefix=' '
            id="dropdownNotification"
            className="text-dark icon-notifications me-lg-1  btn btn-light btn-icon rounded-circle indicator indicator-primary text-muted">
            <i className="fe fe-bell"></i>
          </Dropdown.Toggle>
          <Dropdown.Menu
            className="dashboard-dropdown notifications-dropdown dropdown-menu-lg dropdown-menu-end mt-4 py-0"
            aria-labelledby="dropdownNotification"
            align="end"
            show={hasMounted && isDesktop ? true : false}>
            <Dropdown.Item className="mt-3" bsPrefix=' ' as="div"  >
              <div className="border-bottom px-3 pt-0 pb-3 d-flex justify-content-between align-items-end">
                <span className="h4 mb-0">Notifications</span>
                <Link href="/" className="text-muted">
                  <span className="align-middle">
                    <i className="fe fe-settings me-1"></i>
                  </span>
                </Link>
              </div>
              <Notifications />
              <div className="border-top px-3 pt-3 pb-3">
                <Link href="/dashboard/notification-history" className="text-link fw-semi-bold">
                  See all Notifications
                </Link>
              </div>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
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
                    <h5 className="mb-1">{userDetails.firstName}</h5>
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
            onClick={() => router.push("/dashboard/settings")}>
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
}

export default QuickMenu;