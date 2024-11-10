import { Fragment, useState } from 'react';
import { useRouter } from 'next/router';
import { Col, Row, Card, Form, Button, Image } from 'react-bootstrap';
import Link from 'next/link';
import { GeeksSEO } from 'widgets';
import AuthLayout from 'layouts/dashboard/AuthLayout';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';

const SignIn = () => {
  const [workerId, setWorkerId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const [loading, setLoading] = useState(false);



  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  
  //   try {
  //     const res = await fetch('/api/login', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ workerId, password }),
  //     });
  
  //     if (!res.ok) {
  //       throw new Error('Login failed. Please check your credentials.');
  //     }
  
  //     const data = await res.json();
  //     if (data.message === 'Login successful') {
  //       console.log('Login successful');
  //       console.log('uid:', data.uid);
  //       console.log('workerId:', data.workerId);
  //       console.log('isAdmin:', data.isAdmin);
  //       console.log('customToken:', data.customToken);
  //       console.log('Token', data.token);
      
  //       // Set cookies using js-cookie
  //       Cookies.set('uid', data.uid, { secure: true, sameSite: 'None' });
  //       Cookies.set('workerId', data.workerId, { secure: true, sameSite: 'None' });
  //       Cookies.set('isAdmin', data.isAdmin, { secure: true, sameSite: 'None' });
  //       Cookies.set('Token', data.token, { secure: true, sameSite: 'None' });
  //       Cookies.set('customToken', data.customToken, { secure: true, sameSite: 'None' });
        
  //       // Handle redirection or other logic here
  //       router.push('/dashboard/overview'); // Redirect to dashboard page
  //     } else {
  //       throw new Error('Login failed. Please check your credentials.');
  //     }
  //   } catch (error) {
  //     setError(error.message);
  //   }
  // };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  
  //   try {
  //     const res = await fetch('/api/login', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ workerId, password }),
  //     });
  
  //     if (!res.ok) {
  //       const errorData = await res.json();
  //       if (errorData.message === 'Invalid credentials') {
  //         throw new Error('Login failed. Please check your credentials.');
  //       } else if (errorData.message === 'Access denied. You are not authorized.') {
  //         throw new Error('Access denied. You are not authorized.');
  //       } else {
  //         throw new Error('Login failed. Please check your credentials.');
  //       }
  //     }
  
  //     const data = await res.json();
  //     if (data.message === 'Login successful') {
  //       console.log('Login successful');
  //       console.log('uid:', data.uid);
  //       console.log('workerId:', data.workerId);
  //       console.log('isAdmin:', data.isAdmin);
  //       console.log('customToken:', data.customToken);
  //       console.log('Token', data.token);
  
  //       // Set cookies using js-cookie
  //       Cookies.set('uid', data.uid, { secure: true, sameSite: 'None' });
  //       Cookies.set('workerId', data.workerId, { secure: true, sameSite: 'None' });
  //       Cookies.set('isAdmin', data.isAdmin, { secure: true, sameSite: 'None' });
  //       Cookies.set('Token', data.token, { secure: true, sameSite: 'None' });
  //       Cookies.set('customToken', data.customToken, { secure: true, sameSite: 'None' });
  
  //       // Handle redirection or other logic here
  //       router.push('/dashboard/overview'); // Redirect to dashboard page
  //     } else {
  //       throw new Error('Login failed. Please check your credentials.');
  //     }
  //   } catch (error) {
  //     setError(error.message); // Update the error state with the specific error message
  //   }
  // };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading to true when form is submitted
  
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workerId, password }),
      });
  
      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.message === 'Invalid credentials') {
          throw new Error('Login failed. Please check your credentials.');
        } else if (errorData.message === 'Access denied. You are not authorized.') {
          throw new Error('Access denied. You are not authorized.');
        } else {
          throw new Error('Login failed. Please check your credentials.');
        }
      }
  
      const data = await res.json();
      if (data.message === 'Login successful') {
        console.log('Login successful');
        console.log('uid:', data.uid);
        console.log('workerId:', data.workerId);
        console.log('isAdmin:', data.isAdmin);
        console.log('customToken:', data.customToken);
        console.log('Token', data.token);
  
        // Set cookies using js-cookie
        Cookies.set('uid', data.uid, { secure: true, sameSite: 'None' });
        Cookies.set('workerId', data.workerId, { secure: true, sameSite: 'None' });
        Cookies.set('isAdmin', data.isAdmin, { secure: true, sameSite: 'None' });
        Cookies.set('Token', data.token, { secure: true, sameSite: 'None' });
        Cookies.set('customToken', data.customToken, { secure: true, sameSite: 'None' });
  
        // Show SweetAlert welcome message
        Swal.fire({
          title: 'Welcome!',
          text: `Welcome back, ${data.firstName} ${data.middleName} ${data.lastName}!`,
          icon: 'success',
          confirmButtonText: 'OK',
        }).then(() => {
          // Redirect to dashboard page after closing the alert
          router.push('/');
        });
      } else {
        throw new Error('Login failed. Please check your credentials.');
      }
    } catch (error) {
      setError(error.message); // Update the error state with the specific error message
    } finally {
      setLoading(false); // Set loading to false after login attempt is finished
    }
  };
  
  
  return (
    <Fragment>
      <GeeksSEO title="Sign In Customer | SAS&ME - SAP B1 | Portal" />

      <Row className="align-items-center justify-content-center g-0 min-vh-100">
        <Col lg={5} md={5} className="py-8 py-xl-0">
          <Card>
            <Card.Body className="p-6">
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                {/* <Link href="/">
               
                </Link> */}
                   <Image src="/images/SAS-LOGO.png" alt="SAS Logo" height={150} width={250} />
               
              
              </div>
              {/* <h1 className="mb-1 fw-bold">Sign in</h1> */}
              <Form onSubmit={handleSubmit}>
                {error && <div className="alert alert-danger">{error}</div>}
                <Row>
                  <Col lg={12} md={12} className="mb-3">
                    <Form.Label>Customer ID </Form.Label>
                    <Form.Control
                      type="text"
                      id="customerid"
                      placeholder="Customer ID here"
                      value={workerId}
                      onChange={(e) => setWorkerId(e.target.value)}
                      required
                    />
                  </Col>
                  <Col lg={12} md={12} className="mb-3">
                    <Form.Label>Password </Form.Label>
                    <Form.Control
                      type="password"
                      id="password"
                      placeholder="**************"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Col>
                  <Col lg={12} md={12} className="mb-0 d-grid gap-2">
                    <Button variant="primary" type="submit" disabled={loading}>
                      {loading ? 'Logging In...' : 'Sign In'}
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Fragment>
  );
};

SignIn.Layout = AuthLayout;

export default SignIn;
